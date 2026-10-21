"""Contract tests, no SSH, Docker, credentials, API calls or production writes."""
import copy
import contextlib
import importlib.util
import io
import json
import os
import pathlib
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('deploy', pathlib.Path(__file__).resolve().parents[1] / 'scripts/ovh-autodeploy.py')
DEPLOY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(DEPLOY)
REVISION = 'a' * 40


def ci_run(**changes):
    result = {'head_sha': REVISION, 'head_branch': 'main', 'event': 'push',
              'status': 'completed', 'conclusion': 'success', 'path': '.github/workflows/ci.yml',
              'repository': {'full_name': 'lsk7209/dolbomjigi'},
              'head_repository': {'full_name': 'lsk7209/dolbomjigi'},
              'run_number': 1, 'run_attempt': 1}
    result.update(changes)
    return result


def archive(extra=None):
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode='w:') as output:
        for name in ('package.json', 'pnpm-lock.yaml', 'next.config.ts'):
            item = tarfile.TarInfo(name)
            item.size = 2
            output.addfile(item, io.BytesIO(b'{}'))
        if extra:
            item, content = extra
            output.addfile(item, io.BytesIO(content) if item.isfile() else None)
    return stream.getvalue()


class CiGateTests(unittest.TestCase):
    def test_exact_success(self):
        self.assertTrue(DEPLOY.ci_passed({'workflow_runs': [ci_run()]}, REVISION))

    def test_no_runs_never_approves(self):
        self.assertFalse(DEPLOY.ci_passed({'workflow_runs': []}, REVISION))

    def test_non_success_or_wrong_provenance_never_approves(self):
        variants = [{'head_sha': 'b' * 40}, {'head_branch': 'release'}, {'event': 'pull_request'},
                    {'status': 'in_progress'}, {'conclusion': 'failure'}, {'conclusion': 'skipped'},
                    {'path': '.github/workflows/other.yml'},
                    {'repository': {'full_name': 'fork/dolbomjigi'}},
                    {'head_repository': {'full_name': 'fork/dolbomjigi'}}]
        for variant in variants:
            with self.subTest(variant=variant):
                self.assertFalse(DEPLOY.ci_passed({'workflow_runs': [ci_run(**variant)]}, REVISION))

    def test_new_failed_or_pending_rerun_overrides_older_success(self):
        for changes in ({'conclusion': 'failure'}, {'status': 'in_progress', 'conclusion': None}):
            runs = [ci_run(), ci_run(run_attempt=2, **changes)]
            self.assertFalse(DEPLOY.ci_passed({'workflow_runs': runs}, REVISION))

    def test_receipt_selection_uses_exact_latest_valid_attempt(self):
        runs = [ci_run(id=1), ci_run(id=2, run_attempt=2),
                ci_run(id=3, run_number=99, repository={'full_name': 'fork/dolbomjigi'})]
        self.assertEqual(DEPLOY.selected_ci_run({'workflow_runs': runs}, REVISION)['id'], 2)


class SourceSafetyTests(unittest.TestCase):
    def test_regular_archive(self):
        self.assertEqual(set(DEPLOY.archive_files(archive())), {'package.json', 'pnpm-lock.yaml', 'next.config.ts'})

    def test_traversal_absolute_and_environment_paths_rejected(self):
        for name in ('../outside', '/outside', 'a/../../outside', 'a\\outside', '.env', 'nested/.env.production', '.git/config'):
            with self.subTest(name=name):
                entry = tarfile.TarInfo(name)
                entry.size = 1
                with self.assertRaises(RuntimeError):
                    DEPLOY.archive_files(archive((entry, b'x')))

    def test_symlink_and_hardlink_rejected(self):
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE):
            entry = tarfile.TarInfo('safe-name')
            entry.type = kind
            entry.linkname = '/etc/passwd'
            with self.assertRaises(RuntimeError):
                DEPLOY.archive_files(archive((entry, b'')))

    @unittest.skipUnless(os.name == 'posix', 'production pipe selector is POSIX; exercised on OVH/CI')
    def test_streaming_limit_aborts_large_archive_before_capture(self):
        with self.assertRaisesRegex(DEPLOY.DeploymentError, 'source_archive_too_large'):
            DEPLOY.bounded_archive([sys.executable, '-c', "import sys;sys.stdout.buffer.write(b'x'*65536)"], limit=1024)

    @unittest.skipUnless(os.name == 'posix', 'production pipe selector is POSIX; exercised on OVH/CI')
    def test_streaming_archive_small_output_and_timeout(self):
        self.assertEqual(DEPLOY.bounded_archive([sys.executable, '-c', "print('archive')"], limit=1024), b'archive\n')
        with self.assertRaisesRegex(DEPLOY.DeploymentError, 'archive_timeout'):
            DEPLOY.bounded_archive([sys.executable, '-c', 'import time;time.sleep(3)'], timeout=0.05)


class BuildFailureTests(unittest.TestCase):
    def test_builder_shutdown_checked_even_if_build_preparation_fails(self):
        with patch.object(DEPLOY, 'resources'), patch.object(DEPLOY, 'preserved', return_value={}), \
             patch.object(DEPLOY, 'ensure_builder', side_effect=DEPLOY.DeploymentError('prepare_failed')), \
             patch.object(DEPLOY, 'command', return_value=b'') as command, \
             patch.object(DEPLOY, 'inspect', return_value={'State': {'Running': True, 'OOMKilled': False}}), \
             patch.object(DEPLOY, 'check_preserved') as preserved:
            with self.assertRaisesRegex(DEPLOY.DeploymentError, 'builder_not_stopped'):
                DEPLOY.build(pathlib.Path('/unused'), REVISION)
            self.assertIn(['docker', 'buildx', 'stop', DEPLOY.BUILDER], [x.args[0] for x in command.call_args_list])
            preserved.assert_called_once_with({})


class OperationsTests(unittest.TestCase):
    def test_existing_operations_pins_follow_exact_source_manifest(self):
        old = dict(productionSha='a' * 40, packageSha256='b' * 64, sourceArchiveSha256='c' * 64, packagedFiles=605)
        new = dict(productionSha='d' * 40, packageSha256='e' * 64, sourceArchiveSha256='f' * 64, packagedFiles=610)
        original = ("IMAGE_SHA = '" + old['productionSha'] + "'\nPACKAGE_SHA = '" + old['packageSha256']
                    + "'\nSOURCE_SHA = '" + old['sourceArchiveSha256'] + "'\nassert 605 == 605\nassert 605 == 605\n")
        result = DEPLOY.update_operations(original.encode(), old, new).decode()
        self.assertIn(new['productionSha'], result)
        self.assertIn(new['sourceArchiveSha256'], result)
        self.assertEqual(result.count('== 610'), 2)

    def test_unexpected_operations_changes_block_deployment(self):
        old = dict(productionSha='a', packageSha256='b', sourceArchiveSha256='c', packagedFiles=1)
        with self.assertRaises(RuntimeError):
            DEPLOY.update_operations(b'# changed operator contract', old, old)


class RuntimeContractTests(unittest.TestCase):
    def setUp(self):
        self.old = {'Config': {'User': '1001:1001'}, 'HostConfig': {
            'PortBindings': {'3000/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '18109'}]},
            'Memory': 805306368, 'NanoCpus': 1000000000, 'PidsLimit': 128,
            'CapDrop': ['ALL'], 'SecurityOpt': ['no-new-privileges:true']}}
        self.live = copy.deepcopy(self.old)
        self.live['Config']['Env'] = ['NEXT_PUBLIC_LOCAL_PREVIEW=0', 'KEY=exact=value']
        self.live['NetworkSettings'] = {'Networks': {'dolbomjigi-production-runtime': {'Aliases': ['dolbomjigi-web']}}}
        self.wanted = {'NEXT_PUBLIC_LOCAL_PREVIEW': '0', 'KEY': 'exact=value'}

    def test_exact_contract(self):
        DEPLOY.runtime_contract(self.old, self.live, self.wanted)

    def test_port_resource_or_secret_drift_rejected(self):
        for key, value in [('Memory', 0), ('CapDrop', []), ('PortBindings', {})]:
            live = copy.deepcopy(self.live)
            live['HostConfig'][key] = value
            with self.assertRaises(RuntimeError):
                DEPLOY.runtime_contract(self.old, live, self.wanted)
        live = copy.deepcopy(self.live)
        live['Config']['Env'] = ['NEXT_PUBLIC_LOCAL_PREVIEW=1', 'KEY=exact=value']
        with self.assertRaises(RuntimeError):
            DEPLOY.runtime_contract(self.old, live, self.wanted)


class ExecutionGateTests(unittest.TestCase):
    def scenario(self, current, failed=False, check=False):
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary)
            auto = root / 'autodeploy'
            auto.mkdir()
            if failed:
                (auto / 'failed-revision.json').write_text(json.dumps({'revision': REVISION}))
            live = {'Image': 'image-id', 'State': {'Running': True, 'OOMKilled': False,
                    'Health': {'Status': 'healthy'}}, 'RestartCount': 0,
                    'Config': {'Labels': {'org.opencontainers.image.revision': current}}}
            with contextlib.ExitStack() as stack:
                for obj, name, value in ((DEPLOY, 'ROOT', root), (DEPLOY, 'AUTO', auto)):
                    stack.enter_context(patch.object(obj, name, value))
                stack.enter_context(patch.object(DEPLOY, 'require_host'))
                stack.enter_context(patch.object(DEPLOY.os, 'umask'))
                stack.enter_context(patch.object(DEPLOY, 'locks', side_effect=lambda names: contextlib.nullcontext()))
                stack.enter_context(patch.object(DEPLOY, 'fetch_main', return_value=REVISION))
                stack.enter_context(patch.object(DEPLOY, 'inspect', return_value=live))
                stack.enter_context(patch.object(DEPLOY, 'clean_interrupted_canary'))
                stack.enter_context(patch.object(DEPLOY, 'clean_interrupted_builder'))
                ci = stack.enter_context(patch.object(DEPLOY, 'ci_receipt', return_value={'revision': REVISION}))
                stage = stack.enter_context(patch.object(DEPLOY, 'stage'))
                build = stack.enter_context(patch.object(DEPLOY, 'build'))
                if failed:
                    with self.assertRaises(DEPLOY.Deferred):
                        DEPLOY.execute(check_only=check)
                    ci.assert_not_called()
                else:
                    result = DEPLOY.execute(check_only=check)
                    self.assertEqual(result['outcome'], 'current' if current == REVISION else 'eligible')
                stage.assert_not_called()
                build.assert_not_called()

    def test_unchanged_revision_never_builds_or_queries_ci(self):
        self.scenario(REVISION)

    def test_check_mode_does_not_build_eligible_revision(self):
        self.scenario('b' * 40, check=True)

    def test_failed_revision_is_quarantined(self):
        self.scenario('b' * 40, failed=True)


class RollbackTests(unittest.TestCase):
    def exercise(self, healthy=True):
        with tempfile.TemporaryDirectory() as temporary:
            root = pathlib.Path(temporary) / 'app'
            auto = root / 'autodeploy'
            release = root / 'releases/auto-example'
            backup = release / 'rollback'
            auto.mkdir(parents=True)
            backup.mkdir(parents=True)
            (backup / 'source').mkdir()
            (backup / 'source/old.txt').write_text('old immutable source')
            (root / 'source').mkdir()
            (root / 'source/partial.txt').write_text('incomplete replacement')
            files = {'compose.yaml': True, 'build.json': True, 'database-preflight.json': True,
                     'health-observation.json': False, 'current-release.json': True}
            contents = {'compose.yaml': 'old image', 'build.json': '{}',
                        'database-preflight.json': '{"sampleRobotSlug":"dasom-k"}',
                        'current-release.json': '{"revision":"old"}'}
            for name, content in contents.items():
                (backup / name).write_text(content)
                (root / name).write_text('new incomplete receipt')
            (root / 'health-observation.json').write_text('new health receipt')
            (root / 'health-observation.pending').write_text('partial observation')
            (auto / 'inflight.json').write_text('{}')
            (backup / 'transaction.json').write_text(json.dumps({'files': files, 'oldImage': 'old-image',
                                                               'oldRuntime': {}, 'revision': REVISION}))
            # Directory fsync is Linux-specific. Test rollback state transitions on Windows too.
            with patch.object(DEPLOY, 'ROOT', root), patch.object(DEPLOY, 'AUTO', auto), \
                 patch.object(DEPLOY, 'atomic', lambda p, data: p.write_bytes(data)), \
                 patch.object(DEPLOY, 'compose_up') as compose, \
                 patch.object(DEPLOY, 'runtime_contract') as contract, \
                 patch.object(DEPLOY, 'smoke') as smoke, \
                 patch.object(DEPLOY, 'wait_healthy', side_effect=None if healthy else RuntimeError('unhealthy'), return_value={}):
                if not healthy:
                    with self.assertRaises(RuntimeError):
                        DEPLOY.restore(release)
                    self.assertTrue((auto / 'inflight.json').exists())
                    self.assertFalse((release / 'rollback.json').exists())
                    return
                DEPLOY.restore(release)
                compose.assert_called_once()
                contract.assert_called_once()
                self.assertEqual(smoke.call_count, 2)
                self.assertTrue(smoke.call_args.kwargs['public'])
            self.assertEqual((root / 'source/old.txt').read_text(), 'old immutable source')
            self.assertFalse((root / 'source/partial.txt').exists())
            self.assertEqual((release / 'failed-source/partial.txt').read_text(), 'incomplete replacement')
            for name, content in contents.items():
                self.assertEqual((root / name).read_text(), content)
            self.assertFalse((root / 'health-observation.json').exists())
            self.assertFalse((root / 'health-observation.pending').exists())
            self.assertFalse((auto / 'inflight.json').exists())
            self.assertEqual(json.loads((auto / 'failed-revision.json').read_text())['revision'], REVISION)

    def test_partial_source_and_receipts_restore_before_success(self):
        self.exercise()

    def test_unhealthy_rollback_retains_recovery_marker_and_never_claims_pass(self):
        self.exercise(healthy=False)


if __name__ == '__main__':
    unittest.main()
