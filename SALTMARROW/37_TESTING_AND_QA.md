# SALTMARROW: PART 37, TESTING AND QA

Every part of this bible ends with acceptance tests. This part says how to build and run them: the test pyramid, the frameworks, the test maps, the bot clients, the multiplayer soak tests, and the manual playtest protocol. The rule from part 01 stands: a system isn't done until its tests pass, and you don't tell me something works unless you've run it.

---

## 37.1 THE TEST PYRAMID

Unit tests (hundreds, run in seconds): pure logic in C++ (ballistics, armor, damage, stats, gunsmith validation, loot generation, the Surge schedule, the inventory grid, XP math, reticle BDC math) and in TypeScript (stash ops, the ledger, the TS gunsmith validator, economy math, auth). Run on every build.

Integration tests (dozens, minutes): C++ automation tests that spin up a world (no rendering) with real subsystems (spawn a character, equip a weapon, fire at a dummy, verify damage; spawn an inventory, run ops; run the Surge for 30 simulated minutes at high time dilation and check water levels). Backend integration tests against real Postgres and Redis.

Functional tests (dozens, minutes): Unreal Functional Tests (`AFunctionalTest` actors placed in test maps) that run gameplay scenarios in PIE, including multiplayer PIE with multiple clients and network emulation.

Bot tests (a few, long): headless bot clients that play the game through the real networking, for soak, load and desync detection.

Visual tests (screenshot comparisons): rendering and UI screenshots at fixed views and resolutions, compared to approved baselines with a tolerance, flagged for my review when they differ.

Manual playtests: humans playing, with a protocol (37.7).

## 37.2 FRAMEWORKS AND COMMANDS

C++ unit and integration tests: Unreal's Automation system (`IMPLEMENT_SIMPLE_AUTOMATION_TEST`, `IMPLEMENT_COMPLEX_AUTOMATION_TEST`, latent commands for world tests), or the newer test framework if the installed engine provides a better one (e.g. the CQTest plugin, which has nicer syntax for actor and world tests; use it if available). Test names: `Saltmarrow.<Module>.<Feature>.<Case>`.

Running from the command line (so you can run them without clicking):

```
UnrealEditor-Cmd.exe "<path>\Saltmarrow.uproject" -ExecCmds="Automation RunTests Saltmarrow; Quit" -unattended -nopause -NullRHI -log -ReportExportPath="<path>\Saved\TestReports"
```

Functional tests in maps: `Automation RunTests Project.Functional Tests.Maps.L_Test_Combat` (with rendering where the test needs it).

Backend: `npm test` (Vitest) with `docker compose up -d postgres redis` for local runs, service containers in CI.

Through the MCP: you can trigger test runs in the open editor and read results. Prefer the command line for full suites (it's cleaner and doesn't depend on editor state).

## 37.3 THE TEST MAPS

| Map | Purpose |
|---|---|
| `L_Test_Movement` | Every movement state: mantle ledges at each height, vault fences, ladders, prone body box walls at angles, stairs, slopes, water pools at each depth band, current channels, a cliff for fall damage, a timed jog strip |
| `L_Test_Combat` | Part 05.14: range, penetration wall, armor lane, recoil wall, sway test, drop boards, water pool |
| `L_Test_Gunsmith` | The bench scene, a weapon on a turntable, every slot marker visible, auto-cycling through the fuzz corpus with screenshots |
| `L_Test_Inventory` | Containers of every type, bodies, a stash UI harness |
| `L_Test_AI` | Arenas for each AI behavior (grab, chase, cover, flank, grenade, retreat, water, fire avoidance, ladder escape) |
| `L_Test_AI_Soak` | 60 Hollows and 15 Wardens with scripted dummy players, for the AI budget |
| `L_Test_Surge` | A mini island with every flood zone type, a compressed Surge cycle (time dilation), interiors flooding |
| `L_Test_Lighting` | Part 25.10 |
| `L_Test_Audio` | Distance lanes, occlusion walls with materials, doors and windows (portals), interiors of each reverb class |
| `L_Test_Network` | A compact arena for multiplayer functional tests: firing, hitting at latency, movement prediction, doors, pickups, extraction, disconnect |
| `L_Test_UI` | Every widget in every state on a grid, at each resolution, for screenshots |

## 37.4 KEY FUNCTIONAL TESTS (MINIMUM SET)

Movement: the acceptance list from part 04.17.

Combat: shot at a dummy at 100 m with every Tier 0 weapon hits within the expected MOA cone (statistical over 50 shots); damage equals the expected value per zone; armor penetration probabilities match within 3% over 500 shots; penetration through each wall material matches the table; drop at each board matches the ballistic sim within 2 cm; water stops rounds beyond 1.5 m.

Gunsmith: the fuzz corpus (part 08.12) with C++/TS parity.

Inventory: the conservation test (part 11.10), container rules, nested containers, rotation, stacking.

Raid flow (single player in PIE, with the backend on staging or a local backend): create raid, join, spawn at insertion, pick up loot, extract on a boat, verify the stash.

Raid flow (multiplayer PIE, 3 clients, Bad network profile): a squad of 2 plus a solo. The solo kills one squad member, the surviving squad member kills the solo and loots both bodies, then extracts. Verify all three stashes on the backend: the dead lost their gear, the survivor has items from both bodies with correct history and ownership, and the ledger has no duplicates.

Host loss: 3 clients, kill the host process mid-raid; verify both other clients get "host ended" outcomes and their stashes are restored from the checkpoint with found loot.

Reconnect: disconnect a client for 60 s; reconnect; verify state.

Surge: compressed cycle at 10× time dilation; at each wave, water levels in each test zone match the expected values; AI waves spawn at tide points; extractions open and close on schedule; salt deposits spawn after recede.

AI: the acceptance list from part 13.11.

Extraction: part 16.7.

UI: every screen at every resolution renders without clipping (screenshot test plus an automated widget bounds check: no text widget's desired size exceeds its allocated size, meaning no clipped text).

## 37.5 BOT CLIENTS

Build a headless bot client mode: the game launched with `-bot -nullrhi -nosound -botscript=<name>` connects to a raid like a player (with a test account on the staging backend: `-botaccount=<n>` uses a dev-only auth path `POST /v1/auth/dev` enabled only in staging with a shared secret), and runs a scripted or simple AI behavior driving real player input: wander between nav points, sprint, crouch, mantle when blocked, pick up loot, open containers, fire at visible enemies (with a simple aim at the target's chest plus noise), use medical items when bleeding, and go to an extraction after N minutes. Bots log desyncs (server corrections over a threshold, inventory mismatches between the predicted and the replicated state, hit confirmations that never arrive).

Bot scripts: `wander`, `looter`, `fighter`, `extractor`, `chaos` (random valid actions as fast as possible: the inventory and RPC fuzzer), `afk` (connects and idles: tests relevancy and dormancy).

Soak test: a host (a real game instance on my machine, rendering) plus 11 bot clients (on the same machine if it can handle it with `-nullrhi`, which is light; or across two machines) running a full 28-minute Standard raid, three raids in a row. Pass criteria: no crashes, no server tick under 45 Hz for more than 1% of the raid, no desync logs above threshold, memory stable (part 35.8), all reports committed on the backend with zero ledger rejections.

## 37.6 BACKEND TESTS

Part 19.13 and part 20's endpoints: every endpoint has tests for success, validation failure, auth failure, authorization failure (another player's resources), and idempotency where applicable. Fuzz tests for stash ops (part 19.13). A load test (k6 or autocannon) simulating 200 concurrent players doing menu operations and 20 concurrent raids reporting: the api's p95 latency stays under 150 ms on the Railway plan, and the worker processes a 12-player raid's reports in under 10 s total.

## 37.7 MANUAL PLAYTEST PROTOCOL

Every milestone gets a structured playtest with me (and friends when we have them). Write `design/PLAYTEST.md` with: the build to test, the setup steps, a checklist of things to try (each new feature), the questions to answer afterward (5 to 8: "Did the shooting feel good? What felt bad? Did you understand the Surge? Where did you get lost? What did you want to do that you couldn't?"), and a place for notes. After each playtest, turn the notes into tasks in `BUILD_LOG.md` and fix the top issues before adding new features.

Feel tests (things only humans can judge, which I'll do with you): the gun feel review (each weapon fired in the range and in a fight: does it sound and feel right, is recoil readable), the movement feel review (does running and mantling feel weighty and responsive), the first-time-user test (someone who's never seen the game plays the Shakedown without help while you watch the telemetry: where do they stall?).

## 37.8 BUG TRACKING

Use GitHub Issues on the game repo (with the GitHub tools): labels `bug`, `crash`, `perf`, `network`, `ui`, `content`, `balance`, `tier-0`... `tier-4`, `blocker`. Every bug from a playtest or crash report becomes an issue with steps to reproduce, the build, and logs. Link fixes to issues in commit messages.

## 37.9 TEST ACCEPTANCE CRITERIA

The unit suite runs in under 2 minutes and the integration suite in under 15 minutes on my machine.

Every milestone's acceptance tests (part 40) are automated where possible and listed in `design/TEST_PLAN.md` with their status.

A failing test blocks a merge to `develop` (for the backend through CI; for the client by policy: you don't merge a red build).

---

End of part 37. Next: `38_TELEMETRY_LIVE_OPS_ACHIEVEMENTS.md`.
