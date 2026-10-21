# Dolbomjigi OVH automatic deployment

The canonical site is `https://dolbomjigi.ehon365.kr`, served by OVH. GitHub/Vercel deployment status alone does not prove this host updated.

`dolbomjigi-autodeploy.timer` polls GitHub main about every five minutes. Only a successful **push CI run for that exact main revision**, descended from the approved baseline, permits a deployment. Pending/failed/skipped CI and API/rate-limit failures leave the live image unchanged. The current revision is a no-op. Changes on another branch require merge into main first.

The runner fetches the public repository over HTTPS, so it needs no GitHub deploy key or API token. Source is packaged with `git archive`; symlinks, traversal, environment files and local state are rejected. It adds the existing host-only standalone/one-worker configuration and health probe. No Git worktree or application source checkout is modified.

## Installation layout

- Script: `/opt/dolbomjigi-production/autodeploy/runner.py`, installed from `scripts/ovh-autodeploy.py`.
- Bare source store: `/opt/dolbomjigi-production/autodeploy/repo.git`.
- Units: `/etc/systemd/system/dolbomjigi-autodeploy.{service,timer}`.
- Attempts and rollback preimages: `/opt/dolbomjigi-production/releases/auto-*`.
- Live Compose/source/environment and operational receipts remain under `/opt/dolbomjigi-production`.

Install or update the reviewed script and units explicitly as root, preserving old files. The runner never replaces its own script or systemd unit from unreviewed repository content. Script updates in Git therefore require a separate explicit installation; application content/code updates deploy automatically.

## Deployment and failure boundaries

The app lock prevents duplicate runs. Existing foundation, B2 backup, Dolbom build and cron locks serialize host changes. Builds require 3 GiB available RAM and 10 GiB free disk; BuildKit is limited to 2 GiB/one CPU, application runtime stays at its existing 768 MiB/one CPU. The app-specific stopped builder retains its cache. No global cleanup or other application is changed.

The build uses the existing protected BuildKit secret file and existing remote build/image audit helper. Production preview stays `0`. The runner never invokes migrations, seeds, valid cron requests, content approval, DNS changes or shared ingress changes. A private canary must pass before replacing only the application container. Home, authors, a database-backed robot page, sitemap, RSS aliases and unauthenticated cron401 are checked privately and publicly. The operations source/restore hashes and cron image ownership receipt follow the deployed image; original cron handoff and unresolved-execution markers remain intact.

On promotion failure it restores source/configuration/receipts/image and checks private/public health. An interruption marker permits recovery on the next run before another revision can deploy. A failed revision is quarantined instead of rebuilt every five minutes. Environment/build logs contain protected operational data; do not copy their contents into issues or chat.

## Operator commands (run on OVH)

```sh
sudo systemctl status dolbomjigi-autodeploy.timer --no-pager
sudo journalctl -u dolbomjigi-autodeploy.service -n 30 --no-pager
sudo python3 /opt/dolbomjigi-production/autodeploy/runner.py --check
```

`--check` fetches and reads CI only; it never builds, switches containers or repairs an interrupted transaction. Outcomes: `current`, `eligible`, `deferred`; ordinary runs may also return `deployed` or fail. Resource/lock deferral is retried by the timer.

Stop future polling without interrupting an active deployment:

```sh
sudo systemctl disable --now dolbomjigi-autodeploy.timer
```

Do not stop the active service casually. Check its status first. If an interrupted transaction exists, the runner recovers it before any new deployment. If rollback itself cannot be verified, it keeps `autodeploy/inflight.json` for recovery and does not claim success.

Inspect `autodeploy/failed-revision.json` and the referenced release after a failed attempt. Repair the source with a new main commit, or have an operator review the exact failure before moving that one failure marker to a dated evidence filename and retrying. Do not broadly delete evidence, release directories or caches.

For a previous known-good application release, prefer reverting the problematic source changes through a reviewed main commit so CI and this deployment path run again. Historical release images, sources and configuration snapshots are retained for a scoped emergency restore; do not reset or delete the production database as part of rollback.

## Validation

```sh
python3 -m unittest discover -s tests -p ovh_autodeploy_test.py -v
```

These tests are isolated; they do not contact SSH, GitHub, Docker or production databases. Installation verification must also confirm the enabled timer, exact deployed commit/image and actual public host. This mechanism deploys code; AI-generated manuscripts still require the site's separate editorial approval process.
