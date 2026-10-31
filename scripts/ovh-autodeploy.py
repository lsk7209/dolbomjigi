#!/usr/bin/env python3
"""CI-gated dolbomjigi deployment. Only stdlib; secrets stay on the host.

Installed separately from the shared runner so other applications are unaffected.
The app lock covers a whole run; host build/backup locks protect every mutation.
"""
import argparse
import contextlib
import datetime as dt
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import selectors
import shutil
import signal
import socket
import subprocess
import tarfile
import time
import urllib.error
import urllib.request

ROOT = Path('/opt/dolbomjigi-production')
AUTO = ROOT / 'autodeploy'
REPO = AUTO / 'repo.git'
REMOTE = 'https://github.com/lsk7209/dolbomjigi.git'
API = 'https://api.github.com/repos/lsk7209/dolbomjigi'
BASELINE = 'e0c404ec4579f95f62ff22fa298357d7c7b3db91'
NAME = 'dolbomjigi-production-web'
CANARY = 'dolbomjigi-autodeploy-canary'
BUILDER = 'dolbomjigi-autodeploy-bounded'
HOST = 'dolbomjigi.ehon365.kr'
LOCKS = ('ovh-dolbomjigi-build.lock', 'ovh-foundation.lock',
         'ovh-b2-backup.lock', 'ovh-dolbomjigi-cron.lock')
SHA = re.compile(r'[0-9a-f]{40}')
PRIVATE_FILES = ('compose.yaml', 'runtime.env', 'build.json', 'image.json',
                 'source-manifest.json', 'source.tgz', 'runtime.json',
                 'image-security.json', 'private-parity.json', 'database-preflight.json',
                 'dolbomjigi-operations.remote.py', 'cron-ownership.json')
OPTIONAL_FILES = ('current-release.json', 'health-observation.json')


class Deferred(Exception):
    pass


class DeploymentError(RuntimeError):
    """Only fixed, nonsecret reason codes may be used here."""


def require(condition, code):
    if not condition:
        raise DeploymentError(code)


def require_host():
    require(socket.gethostname() == 'vps-ce781f0f' and os.geteuid() == 0, 'wrong_host')
    require(ROOT.is_dir() and not ROOT.is_symlink() and ROOT.stat().st_uid == 0, 'unsafe_root')


def command(args, *, data=None, timeout=120, env=None):
    result = subprocess.run(args, input=data, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, timeout=timeout, env=env)
    require(result.returncode == 0, 'child_failed')
    return result.stdout


def read_json(path):
    return json.loads(path.read_text())


def private(path):
    info = path.lstat()
    require(path.is_file() and not path.is_symlink() and info.st_uid == 0
            and info.st_mode & 0o077 == 0, 'protected_file_required')
    return path.read_bytes()


def atomic(path, data):
    pending = path.with_name(path.name + '.autodeploy-pending')
    with pending.open('xb') as stream:
        os.chmod(pending, 0o600)
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(pending, path)
    fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def write_json(path, value):
    atomic(path, (json.dumps(value, indent=2) + '\n').encode())


@contextlib.contextmanager
def locks(names):
    import fcntl
    with contextlib.ExitStack() as stack:
        for name in names:
            handle = stack.enter_context(open('/run/lock/' + name, 'a'))
            try:
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise Deferred('lock_busy') from None
        yield


def inspect(name):
    return json.loads(command(['docker', 'inspect', name]))[0]


def healthy(item, image=None):
    require(item['State']['Running'] and not item['State']['OOMKilled']
            and item['State'].get('Health', {}).get('Status') == 'healthy'
            and item['RestartCount'] == 0, 'container_unhealthy')
    if image:
        require(item['Image'] == image, 'runtime_image_mismatch')


def git(*args):
    env = dict(os.environ, GIT_TERMINAL_PROMPT='0')
    return command(['git', '--git-dir', str(REPO), *args], env=env).decode().strip()


def fetch_main():
    require(REPO.is_dir() and not REPO.is_symlink(), 'bare_repo_missing')
    require(git('rev-parse', '--is-bare-repository') == 'true', 'bare_repo_required')
    require(git('config', '--get', 'remote.origin.url') == REMOTE, 'origin_mismatch')
    git('fetch', '--no-tags', 'origin', '+refs/heads/main:refs/remotes/origin/main')
    revision = git('rev-parse', 'refs/remotes/origin/main')
    require(SHA.fullmatch(revision), 'invalid_revision')
    git('merge-base', '--is-ancestor', BASELINE, revision)
    return revision


def selected_ci_run(document, revision):
    runs = [run for run in document.get('workflow_runs', [])
            if run.get('head_sha') == revision and run.get('head_branch') == 'main'
            and run.get('event') == 'push'
            and run.get('path') == '.github/workflows/ci.yml'
            and run.get('repository', {}).get('full_name') == 'lsk7209/dolbomjigi'
            and run.get('head_repository', {}).get('full_name') == 'lsk7209/dolbomjigi']
    if not runs:
        return None
    # A successful old attempt must not override a newer failed/pending rerun.
    return max(runs, key=lambda value: (value.get('run_number', 0), value.get('run_attempt', 0)))


def ci_passed(document, revision):
    """Accept exact main push run, never a PR run, fork, stale ref or skipped CI."""
    run = selected_ci_run(document, revision)
    if not run:
        return False
    return (run.get('head_sha') == revision and run.get('head_branch') == 'main'
               and run.get('event') == 'push' and run.get('status') == 'completed'
               and run.get('conclusion') == 'success'
               and run.get('path') == '.github/workflows/ci.yml'
               and run.get('repository', {}).get('full_name') == 'lsk7209/dolbomjigi'
               and run.get('head_repository', {}).get('full_name') == 'lsk7209/dolbomjigi'
               )


def ci_receipt(revision):
    url = API + '/actions/workflows/ci.yml/runs?branch=main&event=push&per_page=20'
    headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'dolbomjigi-ovh-autodeploy'}
    # Public repository: no new token or account permission is necessary.
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=25) as response:
            body = json.load(response)
    except (urllib.error.URLError, ValueError):
        raise Deferred('ci_api_unavailable') from None
    if not ci_passed(body, revision):
        raise Deferred('ci_not_successful')
    run = selected_ci_run(body, revision)
    return {'revision': revision, 'runId': run['id'], 'url': run['html_url']}


def resources():
    memory = int(next(x.split()[1] for x in Path('/proc/meminfo').read_text().splitlines()
                      if x.startswith('MemAvailable:'))) * 1024
    if memory < 3 * 1024**3 or shutil.disk_usage(ROOT).free < 10 * 1024**3:
        raise Deferred('insufficient_resources')


def archive_files(blob):
    files = {}
    require(len(blob) <= 200 * 1024**2, 'source_archive_too_large')
    with tarfile.open(fileobj=io.BytesIO(blob), mode='r:') as archive:
        members = archive.getmembers()
        require(len(members) <= 10000, 'too_many_source_entries')
        for member in members:
            path = PurePosixPath(member.name)
            require(not path.is_absolute() and path.as_posix() == member.name.rstrip('/')
                    and not any(x in ('..', '.', '.git', '.tmp', '.goal-harness') for x in path.parts)
                    and '\\' not in member.name, 'unsafe_archive_path')
            require(member.isdir() or member.isfile(), 'archive_link_or_device')
            require(not any(x.startswith('.env') for x in path.parts), 'environment_file_in_source')
            if member.isfile():
                require(member.name not in files and member.size <= 32 * 1024**2, 'invalid_source_file')
                files[member.name] = archive.extractfile(member).read()
    require({'package.json', 'pnpm-lock.yaml', 'next.config.ts'} <= files.keys(), 'source_incomplete')
    return files


def bounded_archive(args, limit=200 * 1024**2, timeout=120):
    """Bound stdout during production, before buffering a possibly huge archive."""
    process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    chunks = []
    size = 0
    deadline = time.monotonic() + timeout
    try:
        with selectors.DefaultSelector() as selector:
            selector.register(process.stdout, selectors.EVENT_READ)
            while True:
                require(time.monotonic() < deadline, 'archive_timeout')
                if not selector.select(timeout=min(1, max(0, deadline - time.monotonic()))):
                    continue
                chunk = os.read(process.stdout.fileno(), min(65536, limit - size + 1))
                if not chunk:
                    break
                size += len(chunk)
                require(size <= limit, 'source_archive_too_large')
                chunks.append(chunk)
        require(process.wait(timeout=10) == 0, 'archive_failed')
        return b''.join(chunks)
    finally:
        if process.poll() is None:
            process.kill()
            process.wait(timeout=10)
        process.stdout.close()


def stage(revision, receipt):
    root = ROOT / 'releases' / ('auto-' + revision[:12] + '-' + dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S'))
    root.mkdir(mode=0o700)
    source = root / 'source'
    source.mkdir(mode=0o700)
    blob = bounded_archive(['git', '--git-dir', str(REPO), 'archive', '--format=tar', revision])
    files = archive_files(blob)
    config = files['next.config.ts'].decode()
    require(config.count('const nextConfig: NextConfig = {') == 1
            and not re.search(r'\b(output|experimental)\s*:', config), 'standalone_overlay_needs_review')
    config = config.replace('const nextConfig: NextConfig = {',
                            'const nextConfig: NextConfig = {\n  output: "standalone",\n  experimental: { cpus: 1 },', 1)
    files['next.config.ts'] = config.encode()
    files['healthcheck.cjs'] = (ROOT / 'source/healthcheck.cjs').read_bytes()
    files['.dockerignore'] = b'node_modules\n.next\n.git\n.env*\n.goal-harness\n.tmp\n'
    for name, content in files.items():
        target = source / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode='w:gz') as archive:
        for name, content in sorted(files.items()):
            entry = tarfile.TarInfo(name)
            entry.size = len(content)
            entry.mode = 0o644
            archive.addfile(entry, io.BytesIO(content))
    package = stream.getvalue()
    manifest = {'productionSha': revision, 'sourceArchiveSha256': hashlib.sha256(blob).hexdigest(),
                'packageSha256': hashlib.sha256(package).hexdigest(), 'packagedFiles': len(files),
                'files': [{'path': name, 'sha256': hashlib.sha256(content).hexdigest()}
                          for name, content in sorted(files.items())],
                'overlays': ['next.config.ts standalone/cpus1', 'healthcheck.cjs', '.dockerignore']}
    write_json(root / 'source-manifest.json', manifest)
    atomic(root / 'source.tgz', package)
    write_json(root / 'ci.json', receipt)
    for name in ('Dockerfile', 'buildkitd.toml'):
        atomic(root / name, (ROOT / name).read_bytes())
    values = json.loads(private(ROOT / 'build.json'))
    require(all(isinstance(x, str) for x in values.values()), 'environment_values_invalid')
    values.update(VERCEL_GIT_COMMIT_SHA=revision, NEXT_PUBLIC_LOCAL_PREVIEW='0')
    write_json(root / 'build.json', values)
    return root


def preserved(exclude=()):
    ids = command(['docker', 'ps', '-q']).decode().split()
    if not ids:
        return {}
    return {x['Id']: (x['State']['StartedAt'], x['RestartCount'])
            for x in json.loads(command(['docker', 'inspect', *ids]))
            if x['Name'].lstrip('/') not in exclude and not x['HostConfig'].get('AutoRemove')}


def check_preserved(before):
    for cid, state in before.items():
        current = inspect(cid)
        require(current['State']['Running'] and (current['State']['StartedAt'], current['RestartCount']) == state,
                'other_workload_changed')


def load_runtime(root, revision):
    spec = importlib.util.spec_from_file_location('runtime', ROOT / 'dolbomjigi-runtime.remote.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT, module.SHA, module.BUILDER = root, revision, BUILDER
    module.environment = lambda: json.loads(private(root / 'build.json'))
    return module


def ensure_builder(root):
    probe = subprocess.run(['docker', 'buildx', 'inspect', BUILDER], stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL)
    if probe.returncode:
        command(['docker', 'buildx', 'create', '--name', BUILDER, '--driver', 'docker-container',
                 '--driver-opt', 'memory=2g', '--driver-opt', 'cpu-period=100000',
                 '--driver-opt', 'cpu-quota=100000', '--driver-opt', 'restart-policy=no',
                 '--buildkitd-config', str(root / 'buildkitd.toml')])
    command(['docker', 'buildx', 'inspect', '--bootstrap', BUILDER])
    item = inspect('buildx_buildkit_' + BUILDER + '0')
    require(item['HostConfig']['Memory'] == 2 * 1024**3
            and item['HostConfig']['CpuQuota'] == item['HostConfig']['CpuPeriod'] == 100000,
            'builder_limits_invalid')


def build(root, revision):
    resources()
    before = preserved()
    image = 'ovh-dolbomjigi-production:' + revision
    try:
        ensure_builder(root)
        with (root / 'build.log').open('xb') as log:
            process = subprocess.Popen(['docker', 'buildx', 'build', '--builder', BUILDER,
                '--load', '--progress=plain', '--secret', 'id=buildenv,src=' + str(root / 'build.json'),
                '--build-arg', 'REVISION=' + revision, '-f', str(root / 'Dockerfile'),
                '-t', image, str(root / 'source')], stdout=log, stderr=subprocess.STDOUT)
            deadline = time.monotonic() + 2700
            try:
                while process.poll() is None:
                    available = int(next(x.split()[1] for x in Path('/proc/meminfo').read_text().splitlines()
                                         if x.startswith('MemAvailable:'))) * 1024
                    require(available >= 1024**3 and shutil.disk_usage(ROOT).free >= 5 * 1024**3,
                            'resource_reserve_low')
                    require(time.monotonic() < deadline, 'build_timeout')
                    time.sleep(3)
                require(process.returncode == 0, 'build_failed')
            finally:
                if process.poll() is None:
                    process.terminate()
                    process.wait(timeout=30)
    finally:
        try:
            command(['docker', 'buildx', 'stop', BUILDER], timeout=60)
            stopped = inspect('buildx_buildkit_' + BUILDER + '0')
            require(not stopped['State']['Running'] and not stopped['State']['OOMKilled'], 'builder_not_stopped')
        finally:
            check_preserved(before)
    builder = inspect('buildx_buildkit_' + BUILDER + '0')
    require(not builder['State']['Running'] and not builder['State']['OOMKilled'], 'builder_not_stopped')
    write_json(root / 'build-resource-limits.json', {'memoryBytes': 2 * 1024**3,
               'cpuQuota': 100000, 'cpuPeriod': 100000, 'oomKilled': False})
    item = json.loads(command(['docker', 'image', 'inspect', image]))[0]
    require(item['Config']['User'] == '1001:1001'
            and item['Config']['Labels']['org.opencontainers.image.revision'] == revision,
            'image_identity_invalid')
    write_json(root / 'image.json', {'image': image, 'imageId': item['Id'], 'revision': revision})
    load_runtime(root, revision).audit()
    return item['Id']

def probe(port, path, *, status=200, contains=None, public=False):
    url = ('https://' + HOST if public else 'http://127.0.0.1:' + str(port)) + path
    request = urllib.request.Request(url, headers={'Host': HOST, 'User-Agent': 'dolbomjigi-deploy-health'})
    try:
        response = urllib.request.urlopen(request, timeout=25)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read(8 * 1024**2).decode()
        require(response.status == status and (not contains or contains in body), 'http_health_failed')
        return {'path': path, 'status': response.status}


def smoke(port, sample_slug, public=False):
    checks = [probe(port, '/', public=public), probe(port, '/authors', public=public),
              probe(port, '/robot/' + sample_slug, contains=sample_slug, public=public),
              probe(port, '/api/cron/index-published', status=401, public=public)]
    for path in ('/sitemap.xml', '/api/feed', '/feed.xml'):
        checks.append(probe(port, path, public=public))
    return checks


def wait_healthy(name, image):
    for _ in range(90):
        item = inspect(name)
        require(item['State']['Running'] and not item['State']['OOMKilled'], 'runtime_stopped')
        if item['State'].get('Health', {}).get('Status') == 'healthy':
            healthy(item, image)
            return item
        time.sleep(1)
    raise DeploymentError('runtime_health_timeout')


def remove_canary(image):
    probe = subprocess.run(['docker', 'inspect', CANARY], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    if probe.returncode:
        return
    item = json.loads(probe.stdout)[0]
    require(item['Image'] == image and item['Config'].get('Labels', {}).get('ovh.autodeploy') == 'dolbomjigi',
            'canary_not_owned')
    command(['docker', 'stop', '--time', '15', CANARY], timeout=25)
    command(['docker', 'rm', CANARY])


def clean_interrupted_canary():
    probe = subprocess.run(['docker', 'inspect', CANARY], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    if probe.returncode == 0:
        item = json.loads(probe.stdout)[0]
        with locks(LOCKS):
            remove_canary(item['Image'])  # requires exact name and ownership label


def clean_interrupted_builder():
    name = 'buildx_buildkit_' + BUILDER + '0'
    probe = subprocess.run(['docker', 'inspect', name], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    if probe.returncode == 0 and json.loads(probe.stdout)[0]['State']['Running']:
        with locks(LOCKS):
            item = inspect(name)
            require(item['HostConfig']['Memory'] == 2 * 1024**3
                    and item['HostConfig']['CpuQuota'] == item['HostConfig']['CpuPeriod'] == 100000,
                    'builder_recovery_identity_failed')
            command(['docker', 'buildx', 'stop', BUILDER], timeout=60)
            require(not inspect(name)['State']['Running'], 'builder_recovery_failed')


def canary(root, image):
    require(subprocess.run(['docker', 'inspect', CANARY], stdout=subprocess.DEVNULL,
                           stderr=subprocess.DEVNULL).returncode != 0, 'canary_already_exists')
    values = json.loads(private(root / 'build.json'))
    args = ['docker', 'run', '-d', '--name', CANARY, '--label', 'ovh.autodeploy=dolbomjigi',
            '--network', 'dolbomjigi-production-runtime', '-p', '127.0.0.1:18119:3000',
            '--init', '--user', '1001:1001', '--memory', '768m', '--cpus', '1', '--pids-limit', '128',
            '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true',
            '--log-opt', 'max-size=5m', '--log-opt', 'max-file=2']
    for key in values:
        args += ['--env', key]
    command(args + [image], env=dict(os.environ, **values))
    wait_healthy(CANARY, image)
    proof = json.loads(private(ROOT / 'database-preflight.json'))
    slug = proof['sampleRobotSlug']
    require(re.fullmatch(r'[a-z0-9-]+', slug), 'invalid_health_slug')
    checks = smoke(18119, slug)
    write_json(root / 'canary.json', {'result': 'PASS', 'imageId': image, 'checks': checks})
    return slug


def update_operations(original, old, new):
    text = original.decode()
    for name, field in (('IMAGE_SHA', 'productionSha'), ('PACKAGE_SHA', 'packageSha256'),
                        ('SOURCE_SHA', 'sourceArchiveSha256')):
        token = name + ' = ' + repr(old[field])
        require(text.count(token) == 1, 'operations_pin_drift')
        text = text.replace(token, name + ' = ' + repr(new[field]))
    token = '== ' + str(old['packagedFiles'])
    require(text.count(token) == 2, 'operations_count_drift')
    text = text.replace(token, '== ' + str(new['packagedFiles']))
    compile(text, 'operations.py', 'exec')
    return text.encode()


def compose_up():
    command(['docker', 'compose', '--project-directory', str(ROOT), '-f', str(ROOT / 'compose.yaml'),
             'up', '-d', '--no-deps', 'web'], timeout=120)


def runtime_contract(old, live, wanted):
    require(live['Config']['User'] == old['Config']['User'] == '1001:1001', 'runtime_user_changed')
    for key in ('PortBindings', 'Memory', 'NanoCpus', 'PidsLimit', 'CapDrop', 'SecurityOpt'):
        require(live['HostConfig'][key] == old['HostConfig'][key], 'runtime_contract_changed')
    require('dolbomjigi-web' in live['NetworkSettings']['Networks']['dolbomjigi-production-runtime']['Aliases'],
            'network_alias_changed')
    values = dict(x.split('=', 1) for x in live['Config']['Env'])
    require(all(values.get(k) == v for k, v in wanted.items()), 'runtime_environment_changed')


def restore(root):
    """Recover a recorded interrupted transaction before any new deployment."""
    backup = root / 'rollback'
    transaction = read_json(backup / 'transaction.json')
    for name, existed in transaction['files'].items():
        target = ROOT / name
        pending = target.with_name(target.name + '.autodeploy-pending')
        if pending.exists():
            pending.unlink()
        if existed:
            atomic(target, (backup / name).read_bytes())
        elif target.exists():
            target.unlink()
    if (ROOT / 'health-observation.pending').exists():
        (ROOT / 'health-observation.pending').unlink()
    if (backup / 'source').exists():
        if (ROOT / 'source').exists():
            failed = root / 'failed-source'
            require(not failed.exists(), 'failed_source_exists')
            os.rename(ROOT / 'source', failed)
        os.rename(backup / 'source', ROOT / 'source')
    compose_up()
    live = wait_healthy(NAME, transaction['oldImage'])
    runtime_contract(transaction['oldRuntime'], live, read_json(backup / 'build.json'))
    slug = read_json(backup / 'database-preflight.json')['sampleRobotSlug']
    smoke(18109, slug)
    smoke(0, slug, public=True)
    write_json(root / 'rollback.json', {'result': 'PASS', 'imageId': transaction['oldImage']})
    (AUTO / 'inflight.json').unlink()
    write_json(AUTO / 'failed-revision.json', {'revision': transaction['revision'], 'reason': 'promotion_rolled_back'})


def promote(root, revision, image, slug):
    with locks(LOCKS):
        # Do not install a revision overtaken by another main push during build.
        require(fetch_main() == revision, 'main_advanced_during_build')
        ci_receipt(revision)
        old = inspect(NAME)
        healthy(old)
        before = preserved(exclude=(NAME, CANARY))
        ingress = Path('/opt/todaypharm-production/Caddyfile')
        ingress_hash = hashlib.sha256(ingress.read_bytes()).hexdigest()
        timers = {name: command(['systemctl', 'is-active', 'dolbomjigi-production-' + name + '.timer']).strip()
                  for name in ('health', 'backup', 'cron-etl-daily', 'cron-etl-weekly', 'cron-index-published')}
        backup = root / 'rollback'
        backup.mkdir(mode=0o700)
        paths = {name: True for name in PRIVATE_FILES}
        paths.update({name: (ROOT / name).exists() for name in OPTIONAL_FILES})
        for name, exists in paths.items():
            if exists:
                atomic(backup / name, private(ROOT / name))
            require(not (ROOT / (name + '.autodeploy-pending')).exists(), 'stale_pending_file')
        require(not (ROOT / 'health-observation.pending').exists(), 'health_already_running')
        old_runtime = {'Config': {'User': old['Config']['User']},
                       'HostConfig': {key: old['HostConfig'][key] for key in
                                      ('PortBindings', 'Memory', 'NanoCpus', 'PidsLimit', 'CapDrop', 'SecurityOpt')}}
        write_json(backup / 'transaction.json', {'revision': revision, 'oldImage': old['Image'],
                   'oldRuntime': old_runtime, 'files': paths})
        # Durable marker precedes source/config mutation, including crash recovery.
        write_json(AUTO / 'inflight.json', {'release': str(root)})
        try:
            os.rename(ROOT / 'source', backup / 'source')
            shutil.copytree(root / 'source', ROOT / 'source')
            new = read_json(root / 'source-manifest.json')
            old_manifest = read_json(backup / 'source-manifest.json')
            for name in ('source-manifest.json', 'source.tgz', 'build.json', 'image.json', 'image-security.json'):
                atomic(ROOT / name, private(root / name))
            env = (backup / 'runtime.env').read_text().splitlines()
            require(sum(x.startswith('VERCEL_GIT_COMMIT_SHA=') for x in env) == 1, 'runtime_revision_missing')
            env = ['VERCEL_GIT_COMMIT_SHA=' + json.dumps(revision) if x.startswith('VERCEL_GIT_COMMIT_SHA=') else x
                   for x in env if not x.startswith('NEXT_PUBLIC_LOCAL_PREVIEW=')]
            env.append('NEXT_PUBLIC_LOCAL_PREVIEW="0"')
            atomic(ROOT / 'runtime.env', ('\n'.join(env) + '\n').encode())
            compose = (backup / 'compose.yaml').read_text()
            require(compose.count(old['Image']) == 1, 'compose_image_drift')
            atomic(ROOT / 'compose.yaml', compose.replace(old['Image'], image).encode())
            atomic(ROOT / 'dolbomjigi-operations.remote.py', update_operations(
                (backup / 'dolbomjigi-operations.remote.py').read_bytes(), old_manifest, new))
            # Preserve historical handoff/uncertain markers; bind the owner to the new image.
            owner = read_json(backup / 'cron-ownership.json')
            require(owner['status'] == 'PASS' and owner['handoffSha256'] == hashlib.sha256(private(ROOT / 'cron-handoff.json')).hexdigest(),
                    'cron_handoff_drift')
            owner.update(imageId=image, releaseRevision=revision)
            write_json(ROOT / 'cron-ownership.json', owner)
            compose_up()
            live = wait_healthy(NAME, image)
            runtime_contract(old, live, read_json(root / 'build.json'))
            checks = smoke(18109, slug)
            public_checks = smoke(0, slug, public=True)
            namespace = {'__name__': 'autodeploy_operations'}
            exec(compile((ROOT / 'dolbomjigi-operations.remote.py').read_text(), 'operations.py', 'exec'), namespace)
            require(namespace['verify_restored_source'](ROOT / 'source', namespace['source_entries'](new)) == new['packagedFiles'],
                    'installed_source_mismatch')
            namespace['health']()
            require(hashlib.sha256(ingress.read_bytes()).hexdigest() == ingress_hash, 'ingress_changed')
            for name, state in timers.items():
                require(command(['systemctl', 'is-active', 'dolbomjigi-production-' + name + '.timer']).strip() == state,
                        'timer_changed')
            check_preserved(before)
            result = {'result': 'PASS', 'revision': revision, 'imageId': image, 'containerId': live['Id'],
                      'healthy': True, 'restarts': 0, 'oomKilled': False, 'privateChecks': checks,
                      'publicChecks': public_checks, 'rollbackDirectory': str(backup), 'otherContainersPreserved': len(before)}
            write_json(ROOT / 'runtime.json', {**result, 'status': 'PRIVATE_HTTP_READY', 'container': NAME,
                       'containerHealth': 'healthy', 'publicIngressChanged': False, 'dnsChanged': False})
            write_json(ROOT / 'private-parity.json', {'status': 'PASS', 'readOnly': True, 'checkedRoutes': checks, 'revision': revision})
            write_json(ROOT / 'current-release.json', result)
            write_json(root / 'promotion.json', result)
            (AUTO / 'inflight.json').unlink()
            return result
        except BaseException:
            restore(root)
            raise


def execute(check_only=False):
    require_host()
    os.umask(0o077)
    with locks(('ovh-dolbomjigi-autodeploy.lock',)):
        marker = AUTO / 'inflight.json'
        if marker.exists():
            if check_only:
                raise Deferred('recovery_required')
            root = Path(read_json(marker)['release'])
            require(root.parent == ROOT / 'releases' and root.name.startswith('auto-')
                    and not root.is_symlink(), 'invalid_recovery_path')
            with locks(LOCKS):
                restore(root)
            clean_interrupted_canary()
            raise Deferred('previous_transaction_recovered')
        if not check_only:
            clean_interrupted_canary()
            clean_interrupted_builder()
        revision = fetch_main()
        live = inspect(NAME)
        healthy(live)
        current = live['Config'].get('Labels', {}).get('org.opencontainers.image.revision')
        if current == revision:
            return {'outcome': 'current', 'revision': revision, 'imageId': live['Image']}
        failed = AUTO / 'failed-revision.json'
        if failed.exists() and read_json(failed)['revision'] == revision:
            raise Deferred('failed_revision_requires_operator_review')
        receipt = ci_receipt(revision)
        if check_only:
            return {'outcome': 'eligible', 'revision': revision, 'ci': receipt}
        resources()
        root = None
        image = None
        try:
            with locks(LOCKS):
                resources()
                root = stage(revision, receipt)
                image = build(root, revision)
            with locks(LOCKS):
                slug = canary(root, image)
            result = promote(root, revision, image, slug)
            return {'outcome': 'deployed', **result, 'ci': receipt}
        except Deferred:
            raise
        except Exception:
            write_json(AUTO / 'failed-revision.json', {'revision': revision, 'release': str(root) if root else None, 'reason': 'deployment_failed'})
            raise
        finally:
            if image:
                remove_canary(image)


def interrupted(signum, frame):
    raise DeploymentError('deployment_interrupted')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='fetch/check CI; never build or replace runtime')
    args = parser.parse_args()
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGHUP, interrupted)
    try:
        result = execute(args.check)
    except Deferred as error:
        result = {'outcome': 'deferred', 'reason': str(error)}
    except Exception as error:
        # Never print exception text/tracebacks: child output may contain secrets.
        result = {'outcome': 'failed', 'category': type(error).__name__}
        if isinstance(error, DeploymentError):
            result['reason'] = str(error)
        print(json.dumps(result), flush=True)
        return 1
    print(json.dumps(result), flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
