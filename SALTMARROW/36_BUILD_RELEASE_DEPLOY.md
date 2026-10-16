# SALTMARROW: PART 36, BUILD, RELEASE AND DEPLOYMENT

How code becomes a download link. Three things get shipped: the game client (a Windows build, distributed through GitHub Releases and linked from a download page), the backend (api and worker on Railway, through my GitHub to Railway pipeline), and the web page (also on Railway). This part covers versioning, CI, packaging, distribution, updates, crash reporting, and the release checklist.

---

## 36.1 VERSIONING

Build number: a single increasing integer (`1001`, `1002`, ...), incremented on every packaged build, stored in `Config/DefaultGame.ini` (`[/Script/EngineSettings.GeneralProjectSettings] ProjectVersion=0.3.1057`) and in `design/BUILD_LOG.md`. The display version is `MAJOR.MINOR.BUILD` (`0.3.1057`): major 0 until I say otherwise, minor for each tier milestone.

Catalog version: equals the build number of the build that exported it (part 32.16). The backend accepts a list of catalog versions so two adjacent builds can play during a rollout.

Network compatibility: clients only matchmake with the same build (`version` in lobby attributes). Set the engine's network version checksum to include the build number (override `FNetworkVersion::GetLocalNetworkVersion` via the project's `NetworkVersionOverride` or a delegate) so mismatched builds can't connect at all.

## 36.2 CONTINUOUS INTEGRATION

### 36.2.1 Backend and web (GitHub Actions, GitHub-hosted runners)

Workflow `backend.yml` on pushes and PRs touching `backend/`: install (npm ci), lint, typecheck, unit tests, integration tests against a Postgres service container and a Redis service container, build. On success on `develop` or `main`, Railway's GitHub integration deploys (Railway watches the branch; the workflow doesn't deploy directly). Use Railway's "wait for CI" option if available (so Railway deploys only after the GitHub checks pass; check the setting in the service's source configuration through the MCP's `get-service-config` / `update-service`), otherwise gate merges to `develop`/`main` on the checks with branch protection.

Workflow `web.yml` for `web/`: build and test.

Workflow `catalog.yml`: when `backend/catalog/*.json` changes, run the TS gunsmith validator corpus test and the economy sanity checks.

### 36.2.2 Game client (self-hosted runner on my PC, Tier 1+)

Unreal builds need the engine installed, a lot of disk and a GPU for cooking shaders efficiently. GitHub-hosted runners can't do it practically. Options: a GitHub Actions self-hosted runner on my Windows PC (free, uses my machine when it's on), or just running the build scripts locally through you. Default: local scripts in `tools/build/` that you run on my machine, plus an optional self-hosted runner workflow (`client.yml`, triggered manually with `workflow_dispatch`) once the scripts are solid. Ask me before installing a runner service on my machine.

Client build script (`tools/build/package.ps1`), wrapping RunUAT:

```powershell
param([string]$Config = "Shipping", [string]$Build = "")
$UE = "<engine root from the registry or a config file>"
$Project = "$PSScriptRoot\..\..\Saltmarrow.uproject"
& "$UE\Engine\Build\BatchFiles\RunUAT.bat" BuildCookRun `
  -project="$Project" -noP4 -platform=Win64 -clientconfig=$Config -serverconfig=$Config `
  -build -cook -stage -pak -iostore -compressed -prereqs -package -archive `
  -archivedirectory="$PSScriptRoot\..\..\Builds\$Build" `
  -utf8output -unattended -nodebuginfo:$($Config -eq 'Shipping')
```

Plus steps before and after: bump the build number, run `ValidateContent` and the unit tests (fail the build on errors), run the catalog export and commit it to `backend/catalog/`, package, run the smoke test on the packaged build (launch with `-nullrhi`-free normal rendering for 60 s on the Halcyon and a Practice raid with `-ExecCmds="sm.test.smoke"`, which runs a scripted check and exits with a code), zip, compute SHA-256, and write the release notes from `BUILD_LOG.md` entries since the last release.

Pak and chunking: one pak for the base game in v1. Use IoStore (`-iostore`) for faster loading. Compression: Oodle (default in UE5; it's licensed for UE projects).

Shipping config details: no console in Shipping (but keep a hidden debug overlay for network stats), no cheats (`UE_WITH_CHEATS 0` for shipping), logs to `Saved/Logs` at Warning level plus our gameplay "important" category at Log level (for bug reports), and the crash reporter enabled (36.6).

## 36.3 DISTRIBUTION

### 36.3.1 GitHub Releases

Each player-facing build is a GitHub Release on the game repo, tagged `v0.3.1057`, with: the zipped build (`Saltmarrow-0.3.1057-win64.zip`), the SHA-256, and release notes (player-facing: "What's new", "Fixes", "Known issues").

GitHub limits: each release asset must be under 2 GB. A UE build may be bigger. If it is, split into a multi-part archive (`.zip.001`, `.002`, created with 7-Zip) and provide a tiny downloader (36.4) or instructions. Better: keep the build under 2 GB compressed in v1 (texture budgets, no unused content, cooking only referenced assets, `-skipcookingeditorcontent`); it's achievable for a single-map game if we're disciplined. Track the package size in `PERF_LOG.md`.

Private repo note: if the game repo is private, releases are private too, and friends can't download them. Two options: make a separate public repo just for releases (`saltmarrow-releases`, containing only a README and release assets, no source), or host the download elsewhere. Default: a public releases repo, since that keeps the source private and the download free and simple. Ask me before creating it.

### 36.3.2 The download page (Railway web service)

A small static site in `web/` (plain HTML, CSS and a bit of JS, or Astro if you want a framework; keep it light), deployed as a Railway service from GitHub: the SALTMARROW logo, a trailer or a few screenshots, a big DOWNLOAD FOR WINDOWS button (linking to the latest release asset, resolved at build time or through the GitHub API at page load: `GET https://api.github.com/repos/<owner>/saltmarrow-releases/releases/latest`), system requirements, a "How to play with friends" section (3 steps: download, open, share your friend code), patch notes (from releases), server status (from the api's `/status`), the privacy notice, and credits. Railway serves it on its generated domain; a custom domain later if I buy one (ask me).

Railway setup for `web`: a service connected to the repo with root `web/`, a static build (Railway's static site support, or a tiny Node server like `serve` or Caddy in a Dockerfile), and a public domain. Same pipeline as the backend.

### 36.3.3 Windows SmartScreen and code signing

An unsigned `.exe` downloaded from the internet triggers Windows SmartScreen ("Windows protected your PC"), and some antivirus tools flag unsigned new executables. Friends can click "More info → Run anyway", but it's a bad first impression and it breaks Pillar 5 a little. Options: buy a code signing certificate (OV certificates cost money yearly and still need reputation; EV certs cost more), or use a cloud signing service (Microsoft's Trusted Signing, a low monthly cost, if available in my country). I need to decide; list the options with current prices in `design/ASSET_OPTIONS.md` and ask me. Until then, the download page explains the SmartScreen prompt with a screenshot.

### 36.3.4 Optional: itch.io

itch.io is free, handles large uploads, and its `butler` tool does delta patching (players using the itch app get small updates automatically). It's a strong option for a friends-and-community game. Treat it as optional and secondary to GitHub Releases (my pipeline preference); if I say yes, add a `butler push` step to the release script (`butler push Builds/<build> <itch-username>/saltmarrow:windows --userversion 0.3.1057`), with the API key stored locally, never in the repo.

## 36.4 UPDATES

v1: the game checks `/status` at launch (part 20). If its build is below `minClientBuild`, it shows "Update required" with a Download button (opens the download page). If below `latestClientBuild` but above minimum, a soft prompt ("A new version is available") with "Later".

Tier 3: a small launcher (`SaltmarrowLauncher.exe`, written in something light: a .NET 8 single-file app or a Tauri app; not an Unreal app) that checks the latest release, downloads only changed files using a manifest of file hashes (each release publishes `manifest.json` with every file's path, size and SHA-256), verifies hashes, and launches the game. The game itself remains launchable without the launcher. Don't build the launcher until updates get annoying.

## 36.5 BACKEND RELEASE PROCESS

1. Develop on a feature branch; PR to `develop`; CI passes; merge. Railway deploys staging (migrations run in the pre-deploy step).
2. Test the staging backend with a development client build pointed at staging (`-backend=` flag or the dev default).
3. When a game build ships, merge `develop` into `main` (backend and catalog together); Railway deploys production.
4. Update `MIN_CLIENT_BUILD` and `CATALOG_VERSION` variables in production through the Railway MCP (`set-variables`) as part of the release (if the new build changes the catalog in incompatible ways, set the minimum to the new build; otherwise allow both).
5. Check `/readyz`, recent logs (`get-logs`), and the error rate (`http-error-rate`) after deploy.

Database migrations must be backward compatible for one release (expand, then contract in the next release), so a rollback of the api doesn't break the schema.

Rollback: redeploy the previous Railway deployment (`redeploy` on the last good deployment, through the MCP, after confirming with me).

## 36.6 CRASH REPORTING

Unreal's Crash Report Client can send reports to a configurable URL. Run a minimal crash receiver endpoint on the api (`POST /v1/crash`, accepting the CRC's upload format: it posts a zip with the minidump, logs and context XML) that stores reports in the Railway bucket and a summary row in a `crashes` table (build, callstack hash from the context's call stack text, user, time). An admin endpoint lists crash groups by frequency. Configure `DataRouterUrl` in `DefaultEngine.ini` (`[CrashReportClient] DataRouterUrl="https://<api>/v1/crash"`) and include the CrashReportClient in packaged builds (project setting "Include Crash Reporter"). Keep the PDBs for each build archived locally (or in the bucket, private) so minidumps can be symbolized later; don't ship PDBs to players.

Alternatively, a third-party crash service with a free tier (Sentry, BugSplat, Backtrace) gives symbolication and grouping out of the box. Ask me; default to our own minimal receiver because it's free and private.

## 36.7 RELEASE CHECKLIST

For every player-facing build (write this as `design/RELEASE_CHECKLIST.md` and follow it every time):

1. All unit, functional and backend tests pass. `ValidateContent` clean.
2. Benchmark passes on the reference machine (part 35) or regressions are documented and accepted by me.
3. A full playtest: 2 machines (or 1 machine plus a remote friend), a Standard raid start to extraction, a death with gear loss, a host crash simulation (kill the host process), and a reconnect.
4. Catalog exported and committed; backend `CATALOG_VERSION` and `MIN_CLIENT_BUILD` updated in staging first.
5. Package size under 2 GB (or the split-archive path tested).
6. Release notes written (player-facing).
7. Backend `develop` → `main` merged and deployed; `/readyz` green; production variables updated.
8. Release created (with assets and SHA-256); download page shows the new version.
9. Download the release on a clean Windows machine or VM (or a fresh user account), unzip, run: first-launch flow works (Device ID login, callsign, character, Shakedown).
10. Announce to me with the link and a summary (I'll pass it to friends).

## 36.8 BUILD ACCEPTANCE TESTS

The package script produces a build from a clean clone without manual steps beyond installing the engine.

The packaged build launches on a clean Windows 10 and 11 machine with no Unreal or Visual Studio installed (the prerequisites installer for the Visual C++ runtime is included with `-prereqs`).

A client with an old build gets the update prompt; a client with a mismatched network version can't join a newer host.

A crash in the packaged build (forced with a debug command in a development build) produces a report that reaches the backend.

---

End of part 36. Next: `37_TESTING_AND_QA.md`.
