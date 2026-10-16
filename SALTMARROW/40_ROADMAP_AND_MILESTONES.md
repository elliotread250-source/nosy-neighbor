# SALTMARROW: PART 40, THE ROADMAP AND MILESTONES

This is the build order. It turns the tiers from part 01 into milestones, each with an ordered task list, deliverables, an acceptance gate and a playtest. Follow it in order. Within a milestone, you can reorder tasks when it helps, but don't start a milestone until the previous one's gate has passed and I've signed off. At the start of every working session, read `BUILD_LOG.md` and this part to find where you are.

Time estimates are deliberately absent. They'd be guesses. What matters is that each milestone ends with a playable, tested build.

Stop-and-ask points are marked ⚑. At those, pause and ask me, with a short summary of what you need and the options.

---

## 40.1 MILESTONE 0: FOUNDATIONS

Goal: an empty but correctly structured project, building cleanly, with the backend skeleton live on Railway and the tools you'll need in place.

Tasks:

0.1 Read the whole design bible (parts 00 to 56). Write `design/BUILD_LOG.md` with a first entry summarizing your understanding and any questions. ⚑ Send me the questions before writing code.

0.2 Check the machine: installed Unreal Engine versions, Visual Studio (2022 with the "Game development with C++" workload and the Windows SDK UE needs), Git, Git LFS, Node.js LTS, Docker (for local Postgres; optional), and disk space (at least 300 GB free recommended for engine, project, DDC and builds). Report what's missing. ⚑ Ask before installing anything big.

0.3 Confirm the unreal-mcp connection works: invoke the `unreal-engine-skills-for-claude-code:unreal-mcp` skill, open a blank project, list the toolsets, create and delete a test asset.

0.4 ⚑ Create the GitHub repo `saltmarrow` (private) with my confirmation. Decide the LFS plan with me (part 30.4). Add `.gitignore`, `.gitattributes`, `README.md`, `design/` (copy this bible into `design/bible/`), `backend/`, `web/`, `tools/`.

0.5 Get Lyra for the chosen engine version (from Fab through the launcher; ⚑ I may need to add it to my library and create the project from the launcher myself: tell me the exact steps). Create the project from Lyra, rename to Saltmarrow (part 30.1), build it, run it, confirm Lyra's sample works in PIE with 2 players.

0.6 Strip Lyra's sample content that we won't use (maps, modes, art) carefully: keep the framework, CommonUser, the settings screens, Common UI layers. Rebuild and confirm it still runs (with a temporary empty map).

0.7 Create our modules (part 30.5) with empty classes, the Content folder structure, the asset naming validator, and the `SaltmarrowEditor` module with the `ValidateContent` commandlet (empty rules for now).

0.8 Add the Game Animation Sample's content and anim BP framework (part 29.1), on the mannequin, in a test map. Confirm motion matching locomotion runs.

0.9 Set up the automation test project structure and a first unit test that passes. Set up the command-line test runner script (`tools/test/run-unit.ps1`).

0.10 Backend skeleton: Fastify app with `/healthz`, `/readyz`, `/v1/status`, Drizzle with the schema from part 19.4 (tables created, migrations working), Vitest with one test, Dockerfile, `railway.json` with the pre-deploy migration command.

0.11 ⚑ Create the Railway project `saltmarrow` with services api, worker (stub), web (a placeholder page), Postgres and Redis, environments production and staging, variables (generated secrets), and domains, using the Railway MCP. Confirm with me before creating. Push the backend; confirm staging deploys and `/readyz` is green.

0.12 GitHub Actions for the backend (part 36.2.1).

0.13 ⚑ EOS: write `design/EOS_SETUP.md` (part 18.3.3) and ask me to set up the product. Meanwhile, use the OSS Null subsystem for local testing.

0.14 Write the first toolset skeleton (`SaltmarrowTools` plugin with one trivial function) with the `create-toolset` skill, to prove the toolset pipeline.

Deliverables: the repo with a building project, the backend live on staging, docs.

Gate: clean build from a fresh clone (following README), unit test passes, backend staging green, Lyra framework runs with 2 PIE players.

## 40.2 MILESTONE 1: TIER 0, THE GUN RANGE

Goal: shooting feels great, and two players can do it together. This is the most important milestone in the project.

Tasks:

1.1 `SaltmarrowCombat`: ballistics math (part 05.3) with unit tests (drop tables for every Tier 0 ammo at 100 to 600 m, velocity and energy decay, falloff curves), penetration and armor resolution math with unit tests (Monte Carlo probabilities), damage calculator and zone multipliers.

1.2 The projectile subsystem: struct-based projectiles stepped at 120 Hz with batched traces, cosmetic client projectiles, tracers. Performance test: 600 projectiles under 1.5 ms.

1.3 Character: `ASMCharacterBase` and `ASMPlayerCharacter` on Lyra's character, the custom movement component with walk/jog/sprint, crouch, stamina (GAS attribute), jump, and mantle and vault (part 04.5), with saved moves. Movement test map with the acceptance tests from 04.17 (the water states come in Milestone 2).

1.4 Camera: third person rig (part 04.11.1), shoulder swap, ADS first-person transition (04.11.2), weapon wall collision (04.11.3).

1.5 GAS setup: health set (zones), stamina set, damage execution, the core abilities (fire, ADS, reload, swap, sprint, crouch, jump), the status effects needed for Tier 0 (light and heavy bleed, fracture, pain), healing items (bandage, IFAK, splint, painkillers) usable from quick slots.

1.6 Weapons: `USMWeaponDefinition`, `USMAttachmentDefinition`, `USMAmmoDefinition`, `FSMWeaponConfig`, the stat calculator (part 08.5) with tests, assembly (08.6), recoil (05.4.4) and sway (05.4.3), procedural motion (05.4.7), fire modes, magazines with ordered rounds, reloads (tactical, empty, fast), chamber, malfunctions and durability.

1.7 The four weapons: Kestrel 9, Gannet, Mako, Fathom (part 06.5), with their ★ attachments (about 40 parts, part 09), meshes (sourced or kitbashed, part 07.8 and 41), materials (the weapon master, part 26.5, at least finish and wear layers), animations (pistol, AR and bolt families, part 29.4, at least draw, holster, fire, reloads, bolt cycle, inspect), sounds (layered, part 28.3: mechanics, transient, body, tail for Interior and Coastal, distance layers), muzzle flashes, shells, impacts for 6 core surfaces (concrete, wood, metal, glass, water, flesh).

1.8 Optics: red dot, holographic and one magnified scope working in Performance mode (part 26.8.3), with procedural reticles (26.8.4), zeroing (08.6.4) and parallax/scope shadow.

1.9 Lag compensation (05.11) and the shot networking (05.12): server validation, batched auto fire, hit confirmation, impact batches.

1.10 Hit feedback: hit markers (server-confirmed), damage direction indicator, aim punch, hit reactions (physical animation), the death ragdoll.

1.11 The range level (part 39.5, a first version: the Halcyon stern with the barge targets, the paper lane, the armor dummy, the recoil wall) and `L_Test_Combat` (05.14).

1.12 A minimal HUD (reticle, hit markers, weapon and fire mode, health doll, stamina) and a debug weapon picker (choose a weapon and a preset).

1.13 Networking for two players on LAN or through OSS Null (and EOS if ready): two players in the range, shooting each other and the targets, at 150 ms simulated latency.

1.14 A minimal gunsmith (no bench scene yet): a 2D slot list to swap attachments in the range and see the stats change, proving the gunsmith data model.

Deliverables: a packaged development build of the range with 2-player networking.

Gate: all Tier 0 acceptance tests from parts 04, 05 and 08 pass; the TTK simulation lands in the target band; frame time on the reference laptop at Medium under 16.6 ms in the range; ⚑ my gun feel review (part 37.7): I fire every weapon and say yes. If I say no, we iterate here until it's yes.

## 40.3 MILESTONE 2: TIER 1A, HARBOURSIDE OFFLINE RAID LOOP

Goal: a complete raid loop in Harbourside, single player and offline (no backend yet), with the Surge, Hollows, loot, inventory and extraction.

Tasks:

2.1 Harbourside blockout (part 14.4): terrain, harbor basin, the quay, every POI as greybox with correct scale and floors, the back lanes, the High Street edge as a boundary; play-test scale (14.13.5). ⚑ Send me screenshots and a short video of a walkthrough before dressing anything.

2.2 Water: the ocean (Water plugin) and flood volumes for Harbourside's zones (part 15.4), the water query subsystem, wading and swimming states in the movement component (04.7), breath, currents, buoyancy for physics objects.

2.3 The Surge: the schedule generator with determinism tests, the weather state, zone water heights, the storm wall (first version), rain (camera system and occlusion), wind, lightning, the sky and grade changes (simplified LUT blend), the HUD indicator, Sparks's subtitled broadcasts.

2.4 Inventory: the grid model (part 11.4), equipment slots, rigs and backpacks, containers in the world with searching, pickups, dropping, the in-raid inventory UI (part 24.4), quick slots, weight and encumbrance, the secure pouch, the conservation test.

2.5 Items: the Tier 1 item catalog (part 12: medical, food, valuables, barter, salt, keys, notes) with icons from the icon renderer, and loot tables for Harbourside's container types with zone tiers; seeded loot generation; post-Surge dynamic loot (salt deposits, flotsam).

2.6 AI: Shamblers and Crawlers (part 13.3), perception (sight, hearing via the noise subsystem), the StateTree behaviors (idle, investigate, alert, chase, grab, attack), the grab and break-free mechanic, water and fire behavior, the director (static population, Surge waves from tide spawn points), the significance system, nav with water-cost filtering.

2.7 Extraction: the scripted Gull boat (part 16.1) at the cannery jetty and the ferry ramp, one fixed extraction (the breakwater light), extraction UI and flow, death and MIA, the raid summary (local data only).

2.8 Harbourside art pass 1: the modular kit's core pieces (walls, floors, roofs, doors, windows) with the surface master material (wetness, puddles, flood line and salt line layers), the terrace and harbor shed archetypes, PCG dressing for streets and the quay, interiors for the hero POIs (cannery, terminal, lifeboat station, Drowned Man) dressed to a first pass, lighting for calm and storm.

2.9 Audio pass 1: footsteps on all Harbourside surfaces, occlusion and portals, ambience beds (harbor, town, interiors, rain, wind, Surge), Hollow sounds, the Surge roar.

2.10 The in-raid HUD (part 24) mostly complete: compass, weather indicator, squad (placeholder), interaction prompts, the map (a first version of the chart texture for Harbourside).

Deliverables: a packaged build where one player can play a full Harbourside raid offline, from landing to extraction or death.

Gate: the raid loop works end to end; the Surge floods every zone correctly for all 8 directions (test 37.4); AI acceptance tests for Shamblers and Crawlers pass; Harbourside's map tests (14.14) pass; performance on the reference laptop at Medium in the storm within budget; ⚑ my playtest of 3 raids.

## 40.4 MILESTONE 3: TIER 1B, PERSISTENCE (BACKEND LIVE)

Goal: the stash, traders and raids persist on the Railway backend.

Tasks:

3.1 Backend: auth (with a dev auth path for staging and the EOS path once EOS is set up), profiles, the stash engine (part 19.6) with fuzz tests, traders (buy, sell, quote, restock), loadout validation and raid join, raid create, loot manifest, checkpoints, reports, the worker's report processing with the ledger, host-lost handling, results, rate limits, idempotency.

3.2 The catalog exporter commandlet and the TS catalog loader, gunsmith validator port, parity tests.

3.3 Client: `SaltmarrowOnline` (API client, generated types, services), the stash service with optimistic ops and debounced batching, pending report persistence.

3.4 The Halcyon menu scene (a first version: the car deck, the cabin, the trader stations as simple greybox with placeholder NPCs), Common UI screens: title, main, loadout, stash, traders (buy and sell), the post-raid summary pages (with backend results), the callsign flow and a simple character creator (a few presets).

3.5 Starter stash, the Scavenger loadout, the economy config, the Captain and Tomasz with Tier 1 stock.

3.6 Telemetry basics (session, raid lifecycle, deaths, extracts) to the backend.

Deliverables: a build where raids persist: what you extract is in your stash next launch, what you lose is gone, and you can buy and sell.

Gate: the backend acceptance tests (19.13) pass; the full offline raid loop now commits to the backend correctly in 20 consecutive test raids with zero ledger rejections; a forced host crash restores gear; the stash survives a client restart.

## 40.5 MILESTONE 4: TIER 1C, MULTIPLAYER RAIDS

Goal: squads of friends in Harbourside raids together, through EOS.

Tasks:

4.1 EOS: Device ID login (part 18.3.4), the backend's EOS token verification, squads (EOS lobbies, invites by friend code, the squad panel), raid lobbies and matchmaking (part 18.5), the listen-server raid session with PreLogin checks and manifest-based inventories, host selection (18.6.3), reconnection, host loss.

4.2 Replication hardening: push model, dormancy, the Replication Graph (if profiling says so, and it will), the LOS relevancy filter for players (18.8.2) with its tests, AI replication tuning, bandwidth profiling with Networking Insights.

4.3 Squad features: downed and revive (part 03.6.2), friendly fire and the guard, squad HUD, outlines, pings and the ping wheel, squad voice and proximity voice (part 18.10), spectating squadmates.

4.4 Player vs player: the full combat loop between players in the raid, body looting of other players (with item history), kill summaries ("Killed by" with the weapon render).

4.5 Bot clients (part 37.5) and the soak test.

4.6 The PLAY screen with raid setup, ready flow, matchmaking status.

Deliverables: a packaged build where up to 12 players (humans and bots) play a Harbourside raid together through EOS, from different networks.

Gate: the multiplayer acceptance tests (18.13) pass; the soak test (37.5) passes; ⚑ a real playtest with me and at least one friend on different networks.

## 40.6 MILESTONE 5: TIER 1D, THE FIRST FRIENDS BUILD (RELEASE 0.1)

Goal: polish Tier 1 into something I'm proud to send.

Tasks:

5.1 The remaining Tier 1 weapons (part 07.7: Sever, Harbormaster, Rook, Signal Pistol, Fulmar, Bilge Pump, Bora, Breaker) with their attachment trees and animation families (AK, HK roller, pump, revolver, break action, open bolt).

5.2 The Gunsmith screen proper (part 23.7): the bench scene, slot markers, the part list, stat deltas, field strip, Test Fire, Builds with Assemble and Buy Missing.

5.3 The Shakedown (part 39.2) fully scripted, the first-ten-raids protections and hints, the range improvements.

5.4 Contracts: the first 8 Captain and Tomasz contracts with tracking and the trader contract UI.

5.5 Harbourside art pass 2 (dressing density, storytelling props and notes, decals, lighting polish for every weather state, night not yet), audio pass 2 (weapon sounds for all Tier 1 weapons, the Halcyon music, UI sounds), VFX pass (all impacts, explosions for grenades: add the frag and smoke grenades), the HUD and menus fully styled (part 22).

5.6 Settings (part 34) complete for Tier 1 options, including keybinds and accessibility basics (colorblind, subtitles, UI scale, camera shake, toggles).

5.7 Performance pass against part 35 on all presets, the PSO cache, the benchmark.

5.8 Release infrastructure (part 36): versioning, the package script, the releases repo ⚑, the download page on Railway, crash reporting, the update prompt, the release checklist.

Deliverables: Release 0.1 on GitHub Releases, the download page live.

Gate: the release checklist (36.7) complete; ⚑ I play it with 3 friends who have never seen it, and part 01.14's success test is the bar.

## 40.7 MILESTONE 6: TIER 2A, THE WHOLE ISLAND

6.1 Blockout of the High Street, Kirkhill, the East End, the Moor, Gannet Rock, Kirk Holm and the Teeth (part 14), with scale tests and the sightline checks; then art passes district by district (the kit's remaining archetypes, PCG dressing for the moor, the hero buildings: bank, hotel, church, hospital, police station, power station, distillery, LISTENER, the Orla Brae).

6.2 Flood profiles for all zones, interiors flooding, the full Surge (three waves, events: Salt Bloom, Distress Call, Lighthouse Wakes, Gull Storm, Fog Bank), day/night and Night raids (part 15.9), the lighting for night.

6.3 All insertions and extractions (part 14.11, 16.4) including conditional ones (winch fuse, flares, the smuggler).

6.4 The full map texture and map features (part 24.5).

6.5 Ambient life (gulls, sheep, seals, crows) with their gameplay tells.

Gate: map acceptance tests for the whole island, performance at the belfry view, ⚑ playtest.

## 40.8 MILESTONE 7: TIER 2B, THE FULL ARSENAL AND GUNSMITH

7.1 The remaining weapons (part 07.7) with animation families (bullpup, PDW, LMG, lever, launcher, harpoon), sounds, VFX.

7.2 The full attachment catalog (part 09, about 260 parts) through the authoring toolsets, with icons, the designer presets, rails with positions, canted sights and magnifiers, thermal and night optics, PiP scope mode on High+, field modification in the raid, the remaining ammo types, throwables (all grenades), the smoke and fire gameplay systems.

7.3 Cosmetics (part 10): weapon finishes and wear overrides, charms, engravings, reticle colors, the character creator full (MetaHuman heads, hair, clothing catalog, tattoos, voices), clothing weathering states, the readability tests.

Gate: the gunsmith fuzz corpus on the full catalog, cosmetics readability tests, ⚑ gun feel review on every new weapon.

## 40.9 MILESTONE 8: TIER 2C, THE FULL AI

8.1 Wailers, Bloats, Brutes, Drowners; Warden types and squad behavior (cover generation, flanking, grenades, suppression, retreat, reinforcement), Warden voice lines (or the subtitle-and-radio-chirp fallback).

8.2 The bosses: the Ferryman and the Lantern Choir with arenas, abilities, loot and music.

8.3 AI performance at full population on the host (part 13.9).

Gate: AI acceptance tests, the AI soak, boss fights tested solo and in squads, ⚑ playtest.

## 40.10 MILESTONE 9: TIER 2D, PROGRESSION

9.1 All four traders with full stock tables, loyalty, barters, dialogue lines; Mother Agnes and Nils.

9.2 All contract lines (part 17.3 and 44), dailies and weeklies, the Journal (all tabs).

9.3 Halcyon stations (part 17.4) with upgrades, build timers, crafting, the station visuals on the ship.

9.4 Account levels and unlocks, mastery, achievements (part 38.7).

Gate: progression acceptance tests, pacing check against part 17.7 with telemetry from playtests.

## 40.11 MILESTONE 10: TIER 2E, BOATS

10.1 Player boats (part 16.2): the skiff, the rowing dinghy and the RIB with physics, networking, damage, fuel, theft, persistence through the Boathouse.

Gate: boat acceptance tests at latency, ⚑ playtest.

## 40.12 MILESTONE 11: RELEASE 0.2 (ALPHA)

Polish, performance, the full settings and accessibility set, the audio pass 3 (all weapons, the full mix, music), and the release checklist.

Gate: release checklist; a playtest with my friends group across a week, with telemetry review.

## 40.13 MILESTONE 12 AND BEYOND: TIER 3 AND TIER 4

Tier 3 (part 01.8): Skirmish mode, kill-cam, the walkable Halcyon social space, the seasonal events framework and the first event, the launcher and updater, statistical cheat detection, the dashboard, the Spindrift bar and jukebox, the cabin decoration, Gull Launch boat, polish everywhere. Release 0.3 (beta).

Tier 4: dedicated servers (part 18.12), host migration, a second map, ranked Skirmish, spectator mode, EOS Anti-Cheat, Steam release considerations, mod support for cosmetics.

Plan each Tier 3 and 4 feature as its own mini-milestone with a task list, an acceptance gate and my sign-off, in the same format as above, and add it to this part when we get there.

## 40.14 HOW TO REPORT PROGRESS

At the end of every working session: update `BUILD_LOG.md` (what you did, what works, what's broken, what's next), commit and push, and give me a short summary: the milestone and task you're on, what you finished, what's blocking, and anything I need to decide. At the end of every milestone: a review package in `design/review/<milestone>/` with screenshots, a short video capture if possible (the editor's movie render queue or a screen recording of PIE), the test report, the benchmark results, and the list of known issues.

---

End of part 40. Next: `41_ASSET_SOURCING_AND_LICENSING.md`.
