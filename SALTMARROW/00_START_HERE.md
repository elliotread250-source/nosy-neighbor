# SALTMARROW: START HERE (THE KICKOFF PROMPT)

This file is the prompt. Paste everything below the line "PASTE FROM HERE" into Claude Code as your first message, in a session running on your own Windows PC (not a cloud session: Unreal Engine runs on your machine, and the unreal-mcp connection needs the editor open locally). The rest of this folder is the design bible it points to: 56 parts, about 200,000 words.

Before you paste, do these four things yourself (they need your accounts and your hands):

1. Install Unreal Engine 5 (5.5 or newer, the newest version that has a matching Lyra Starter Game and Game Animation Sample on Fab) through the Epic Games Launcher, and add both Lyra and the Game Animation Sample to your Fab library.
2. Make sure Visual Studio 2022 with the "Game development with C++" workload, Git, Git LFS and Node.js (LTS) are installed. Claude Code will check and tell you what's missing.
3. Open Claude Code in an empty folder where you want the project to live (for example `D:\Games\Saltmarrow`), with the Unreal Engine skills plugin installed and the unreal-mcp server configured (your "Unreal Engine skill" and the Unreal editor connection).
4. Have your GitHub and Railway connections active in Claude Code (they are, if you can see the GitHub and Railway tools in its tool list).

Then paste.

---

PASTE FROM HERE

You're going to build a game with me. It's called SALTMARROW: a third-person, squad-based PvPvE extraction shooter set on a drowned North Atlantic archipelago, where a storm called the Surge raises the sea level during every raid, the drowned dead walk out of the water, and the gun you build in the gunsmith is the gun you lose if you die. It's multiplayer (up to 12 players per raid, squads of 3), built in Unreal Engine 5 with C++, Blueprints and the unreal-mcp editor connection, with a TypeScript backend on Railway, distributed as a Windows download through GitHub Releases. The goal is a game I can send to my friends with one link and play with them tonight.

The full design is a 56-part design bible, about 200,000 words, in the GitHub repository `elliotread250-source/nosy-neighbor`, folder `SALTMARROW/`, on the branch `claude/focused-hamilton-vabae0` (or on `main` if that branch has been merged). Every system, number, screen, shader, weapon, attachment, enemy, room, line of dialogue and test is in there. You will build from it.

## Step 1: get the bible and set up the project repo

1. Clone or fetch the bible: `git clone --branch claude/focused-hamilton-vabae0 https://github.com/elliotread250-source/nosy-neighbor.git _bible_source` (into a temporary folder next to this one; if that branch doesn't exist, use `main`). The files you need are in `_bible_source/SALTMARROW/`.
2. Ask me to confirm the name of the new GitHub repository for the game (default: `saltmarrow`, private). Create it with your GitHub tools once I confirm.
3. In this folder, initialize the game repository with the layout in part 30.3 (`design/`, `backend/`, `web/`, `tools/`, and the Unreal project to come), and copy the bible into `design/bible/` (all files `00` to `56`). Commit it as the first commit.
4. Set up Git LFS with the `.gitattributes` from part 30.4, but before pushing any large binaries, ask me about the LFS storage plan (part 30.4 explains the cost question).

## Step 2: read the bible

Read it all before writing code. The parts are numbered and designed to be read in order. If you can't hold it all in context at once (you probably can't), read it in passes: first parts 00, 01, 03, 40, 53 and 54 closely (the vision, the loop, the roadmap, the decision rules and the working rules), then skim the rest end to end so you know where everything is, then read deeply the parts for each milestone as you reach it. Every important value has a stable name you can search for.

After reading, write `design/BUILD_LOG.md` with a first entry: your summary of the game in your own words (one paragraph), the milestone plan as you understand it, and a list of questions for me. Send me the questions and wait for my answers before writing game code. This is the first ⚑ stop-and-ask point; the bible marks the others with ⚑.

## Step 3: build, in the order of part 40

Follow the milestones in part 40 exactly: Milestone 0 (foundations), Milestone 1 (Tier 0: the Gun Range), Milestone 2 (Harbourside offline raid loop), Milestone 3 (persistence on Railway), Milestone 4 (multiplayer through EOS), Milestone 5 (Release 0.1, the first friends build), then Tier 2 milestones 6 to 11 and beyond. Each milestone ends with a playable build, passing tests, and my sign-off at its gate. Don't start the next milestone until I've signed off on the current one.

Milestone 1 matters more than any other. The shooting has to feel incredible before anything else gets built (part 01 Pillar 1, part 50). We'll iterate there until I say yes.

## The rules (the short version of part 54.3)

Read before you build: at the start of every session, read `design/BUILD_LOG.md`, part 40, and the parts for the current task.

The five pillars (part 01.4) decide every tradeoff: every bullet has weight; the gun is yours; the tide decides; fear and greed; play it tonight with your friends.

Keep the project playable at all times. Never leave it in a state where I can't press Play for more than one working session.

Networked from line one: every gameplay feature is built for multiplayer from the start and tested with 2+ clients at 150 ms simulated latency before it's called done.

The server is the authority for gameplay, the backend is the authority for persistence, and the client decides nothing but its inputs and its cosmetics.

Content is data: weapons, attachments, items, loot, AI, contracts, stations and cosmetics are data assets, authored from source tables where possible, never one-off Blueprints.

C++ for systems, Blueprints for presentation.

Tests prove it: a system is done when its acceptance tests (at the end of each part) pass.

Look at what you make: screenshots and playtests for anything visual. Never tell me something looks or feels right unless you've checked it.

Performance is a feature: respect the budgets in part 35 from the start.

When you'd do something through the unreal-mcp connection more than three times, write a toolset for it with the `create-toolset` skill (part 30.9).

Log everything: `BUILD_LOG.md` every session, `DECISIONS.md` for every deviation from the bible, `CREDITS.md` for every third-party asset and its license.

Commit and push every session, on feature branches, with PRs into `develop`.

Ask me at the ⚑ points and for anything that's my call: money, accounts (EOS, code signing, paid assets), public releases, the game's name, legal questions, destructive actions on Railway or GitHub, and the feel sign-offs. Don't ask me about implementation details that are your call.

Be honest: label placeholders as WIP in development builds, report failures with logs, and never say "it works" unless you ran it.

Licenses: no asset goes in without a verified, recorded license that allows commercial distribution (part 41).

No em dashes in any player-facing text.

## The stack, in one breath

Unreal Engine 5 (newest installed 5.x with a matching Lyra and Game Animation Sample), started from Lyra (part 30.1), with GAS, Enhanced Input, Common UI and CommonUser; the Game Animation Sample's motion matching for locomotion; Lumen, Nanite, Virtual Shadow Maps and TSR (part 25); the Water plugin, Niagara, MetaSounds, StateTree, EQS and PCG; Epic Online Services for identity (Device ID login, no account form), squads, raid lobbies, P2P connections with NAT traversal and relay, and voice (part 18); listen servers hosted by players (no dedicated servers in v1); a backend in Node.js and TypeScript with Fastify, Drizzle, Postgres, Redis and BullMQ, on a new Railway project called `saltmarrow` deployed through my GitHub to Railway pipeline (parts 19 and 20); a download page as a Railway web service; the game builds on GitHub Releases (part 36).

## How to report to me

At the end of every working session: update `BUILD_LOG.md`, commit and push, and give me a short summary: the milestone and task you're on, what you finished (and how you verified it), what's broken, what's blocking, and what you need from me. At the end of each milestone: a review package in `design/review/<milestone>/` with screenshots, a short capture if you can, the test report, the benchmark results and the known issues (part 40.14).

## Begin

Start with Step 1. Then read. Then send me your questions.

END OF PASTE

---

## THE BIBLE: WHAT'S IN EACH PART

A map of the 56 parts, so you (and Claude Code) can find things fast.

| Part | Title | What it covers |
|---|---|---|
| 00 | Start Here | This kickoff prompt and the map of the bible |
| 01 | Vision, Pillars and Scope | The game in one paragraph, the five pillars, what it isn't, the scope tiers, the anchor numbers, camera and multiplayer decisions, how to work, the success test, the glossary, the first 30 seconds |
| 02 | World, Lore and Factions | The archipelago, the town, the Surge (what people know and what's true: LANTERN and the Marrow), the Halcyon, the four traders and Sparks, the Wardens and Hollows, the story in each place, the fictional brands, the timeline, the writing voice |
| 03 | Core Loop and Raid Rules | The three loops, the session flow end to end, raid types, the raid timeline, risk and reward, squads, downed and revive, death, disconnection and host loss, voice, pings, extraction and loot rules, XP, edge cases, pacing targets |
| 04 | Player Character, Movement and Camera | The capsule and hitboxes, every movement state and speed, encumbrance, stamina, jumping and falling, mantling and vaulting, prone, wading, swimming and breath, ladders, leaning, the camera rig, ADS and first person, line-of-sight fairness, interaction, melee, throwables, movement networking, footsteps, tests |
| 05 | Combat, Ballistics, Damage, Armor and Health | The shot pipeline, projectile ballistics, the ammo table, falloff, accuracy, sway, recoil, aim punch, fire modes, magazines, reloads, malfunctions, penetration and ricochet, water, destructibles, hit zones, armor, status effects, healing, lag compensation, shot networking, explosives, the combat test map |
| 06 | Weapons Catalog, Part 1 | Handguns, SMGs and assault rifles: 17 weapons with fiction, operation, stats, slots, look, sound and animation notes |
| 07 | Weapons Catalog, Part 2 | Battle rifles, DMRs, bolt actions, shotguns, LMGs and specials (the Thumper and the Whaler harpoon gun): 19 more, the summary table, the sourcing strategy |
| 08 | The Gunsmith System | The part tree, attachment definitions, compatibility by tags, rails and positions, stat modifiers and the calculator, weight distribution and ergonomics, assembly, ADS alignment, zeroing, lights, lasers, suppressors, builds and presets, the bench screen, field modification, item history, replication, tests |
| 09 | The Attachment Catalog | About 260 parts: optics, magnifiers, mounts, iron sights, muzzle devices, suppressors, barrels, handguards, rails, foregrips, bipods, stocks, grips, triggers, internals, magazines, lights and lasers, shotgun parts, charms, designer presets |
| 10 | Cosmetics and Character Customization | The character creator (MetaHuman faces), clothing and weathering, weapon finishes, wear, engravings, reticle colors, charms, emotes, profile cosmetics, how cosmetics are earned, readability rules |
| 11 | Armor, Gear and the Inventory | Equipment slots, the armor and helmet catalog, face and ears, rigs and backpacks, the secure pouch, the grid inventory model and operations, the stash, looting containers and bodies, weight, keys and locks, the in-raid inventory, tests |
| 12 | Items, Loot Tables and the Economy | Item categories, rarity, medical, stimulants, food, valuables, barter, Marrow Salt, trader prices, stock, inflation control, loot tables, zone tiers, seeded spawning, contract items, post-Surge loot, the loot ledger, Scrip |
| 13 | AI: Hollows, Wardens and Bosses | Architecture (StateTree, perception, EQS), awareness, the six Hollow types and their behaviors, spawning, the Wardens and squad tactics, the two bosses (the Ferryman, the Lantern Choir), navigation in a flooding world, cover, difficulty, the performance budget, debug tools, tests |
| 14 | The Map | Coordinates, the island's shape, the ASCII map, districts and loot zones, Harbourside in detail, the High Street, Kirkhill, the East End, the Moor, the islets, flood behavior, insertions, extractions, building the map in Unreal (World Partition, terrain, the modular kit, PCG), tests |
| 15 | The Surge, Water, Weather and Day/Night | The raid clock and schedule, the storm front and wall, the sky change, rising and falling water, interiors flooding, currents, surf, rain, wind, fog, lightning, the weather state, variants and events, day and night, AI and player effects, performance, tests |
| 16 | Boats and Extraction | The scripted extraction boats, player boats (Tier 2), boat physics and networking, damage and theft, extraction types, the full extraction catalog, edge cases, presentation, tests |
| 17 | Progression, Traders, Contracts and the Halcyon | Account levels, trader loyalty, contract objective types and lines, the Halcyon stations and crafting, mastery, the social Halcyon (Tier 3), pacing targets, tests |
| 18 | Multiplayer Architecture | The topology, why listen servers, the EOS stack and config, Device ID identity, squads, raid lobbies and matchmaking, region, host selection, the raid session, replication strategy, the line-of-sight relevancy filter, prediction, voice chat, network testing, the dedicated server path, tests |
| 19 | The Backend on Railway | The stack, repo layout, Railway services and variables, the full database schema, auth, the stash engine, the raid lifecycle and ledger, rate limits, the starter stash, observability, backups, costs, tests |
| 20 | Backend API Reference | Every endpoint with request and response JSON: status, auth, profile, stash, builds, traders, contracts, stations, cosmetics, raids, social, telemetry, admin, and the Unreal client side |
| 21 | Security, Fairness and Anti-Cheat | The threat model, client and server integrity rules, backend security, economy integrity, statistical detection, EOS Anti-Cheat (Tier 4), player safety, tests |
| 22 | UI Style Guide | The design language, color tokens, rarity colors, colorblind modes, typography, spacing, surfaces, icons, components, motion, copy, UI sound, Common UI and input, performance rules, tests |
| 23 | The Halcyon Screens | The menu scene and camera spots, title, main, squads, play and raid setup, loadout, stash, gunsmith, traders, stations, salvager, journal, the post-raid summary, loading and deployment |
| 24 | The In-Raid HUD | HUD principles and layout, reticle and hit markers, compass, weather, squad, contracts, health, weapon, quick slots, prompts, banners, radio subtitles, the in-raid inventory, the map, the health screen, downed and death, the pause menu, tests |
| 25 | Art Direction and Rendering | The look in five rules, references, the rendering pipeline, exposure and color grading, lighting, environment and character art standards, the map illustration, scalability presets, calibration, tests |
| 26 | Materials and Shaders | Global parameters, the surface master (wetness, puddles, flood and salt lines), landscape, foliage, the weapon master (finishes, wear, rust, salt, heat), skin, cloth, Hollow skin, salt crystals, ocean and flood water, glass, lenses, scope rendering, procedural reticles, parallax, storm and weather shaders, post-process, shader compilation and PSO caching |
| 27 | Visual Effects (Niagara) | Rules and budgets, muzzle flashes, ejection, tracers, impacts per surface, explosions, character and movement effects, gameplay smoke, fire, world and weather effects, ambient life, tests |
| 28 | Audio | Gameplay noise vs audio, the engine setup, the weapon layer model, attenuation radii, footsteps and foley, occlusion and propagation, hearing and headsets, voice and radio processing, ambience, music, the mix, tests |
| 29 | Animation | The Game Animation Sample foundation, the anim blueprint structure, first person, weapon animation families, sourcing, interactions, hit reactions and death, Hollow and Warden animation, facial, retargeting, performance, tests |
| 30 | Code Architecture | Starting from Lyra, engine version, the repo layout, Git LFS, modules and key classes, content folders and naming, coding standards, driving the editor through unreal-mcp, our toolsets, experiences, criteria |
| 31 | Gameplay Ability System | Where the ASC lives, attribute sets, the damage pipeline, every ability, gameplay effects and cues, the tag taxonomy, GAS networking, tests |
| 32 | Data Schemas | Every data asset type field by field: items and fragments, weapons, ammo, attachments, presets, loot tables, contracts, stations, recipes, traders, cosmetics, AI archetypes, world definitions, reticles, notes, achievements, the catalog export format, the data entry workflow |
| 33 | Input, Controls and Accessibility | Enhanced Input contexts, default bindings for keyboard and gamepad, mouse and stick feel, aim assist, accessibility (visual, audio, motor, cognitive), tests |
| 34 | The Settings Menu | Every setting with ranges and defaults: gameplay, controls, display, graphics quality (with the fairness rule), audio, voice, accessibility, HUD, account, diagnostics, tests |
| 35 | Performance Budgets | Reference hardware, frame time budgets for client and host, render and GPU budgets, memory, network, the benchmark, the optimization playbook, governance, tests |
| 36 | Build, Release and Deployment | Versioning, CI for backend and client, packaging, GitHub Releases, the download page on Railway, code signing, itch.io (optional), updates, the backend release process, crash reporting, the release checklist, tests |
| 37 | Testing and QA | The test pyramid, frameworks and commands, test maps, the key functional tests, bot clients and soak tests, backend tests, the playtest protocol, bug tracking |
| 38 | Telemetry, Live Ops and Achievements | The event catalog, storage and rollups, dashboards, key metrics and targets, live-ops levers, the seasonal events framework, the achievement list |
| 39 | Onboarding, the Shakedown, the Range and Practice | The first launch, the guided first raid beat by beat, the first ten raids, the gunsmith tutorial, the firing range, Practice mode, tests |
| 40 | The Roadmap and Milestones | Milestones 0 to 12 with ordered tasks, deliverables, gates and ⚑ points, and how to report progress |
| 41 | Asset Sourcing and Licensing | Sources in order of preference, what to source from where, license tracking and credits, style consistency, what not to do |
| 42 | Appendix: Tags, Console Variables and Config | The complete gameplay tag list, every debug command, key config file excerpts, physical materials, scalability overrides |
| 43 | Appendix: Balance | Calibrated ballistics, damage by distance, the armor penetration matrix, the TTK simulation targets, recoil and ergonomics constants, movement and encumbrance math, ammo prices and stock, repair costs, expected raid values, all station costs, the XP table, AI populations, contract reward bands, the balance script |
| 44 | Narrative: The Notes | The full text of the 64 notes found in raids |
| 45 | Narrative: The Contract Lines | The full text of the four traders' main contract lines, side contracts and repeatable pools |
| 46 | Narrative: Dialogue and Descriptions | Trader lines, Sparks's radio broadcasts, Warden voice lines, and item descriptions |
| 47 | Harbourside Room by Room | Every hero building in the Tier 1 district: the cannery, the terminal, the lifeboat station, the Drowned Man, the harbor front, the fish market, the lanes, the aground trawler, loot zones, AI placement |
| 48 | High Street and Kirkhill Room by Room | The bank and its vault, the police station, the hotel, the shops, St. Brendan's church and its belfry, the manse, the graveyard, the hill houses, the wynds |
| 49 | East End, Moor and Islets Room by Room | The hospital, the school, the terraces, the power station, the airfield, the distillery, the caravan park, the water works and wind farm, Gannet Rock, Kirk Holm, LISTENER and the LANTERN levels, the Orla Brae |
| 50 | The Weapon Feel Spec | The feedback timeline of a shot, recoil patterns by family, procedural motion values, camera shake, each weapon's feel brief, the feel review protocol, common feel bugs |
| 51 | The Halcyon Ship | The ship's layout, every menu camera spot in detail, transitions, the people of the Halcyon, station visuals, lighting, audio, performance |
| 52 | Skirmish Mode | The Tier 3 quick PvP mode: format, arenas, the Surge as a closing zone, loadouts and budgets, scoring, lobbies, HUD, tests |
| 53 | The Decisions FAQ | Answers to the questions that come up mid-build: scope, engine, art, gameplay, networking, process |
| 54 | Risks and Working Rules | The big risks and responses, what the game is not going to be, the twenty working rules, the definition of done for Release 0.1 |
| 55 | Reference Code Skeletons | Starting C++ and TypeScript shapes for the movement component, projectile subsystem, lag compensation, weapon config serialization, inventory fast array, Surge subsystem, noise subsystem, API client, stash engine and raid report worker |
| 56 | Attachment and Ammo Descriptions | Inspect-panel text for every attachment family and ammo type |

## A FEW HONEST NOTES FOR YOU (NOT FOR CLAUDE CODE)

This is a very large project. Claude Code can build a lot of it, but it can't do everything on its own: it'll need you to set up the Epic Developer Portal product for EOS, to approve spending (Git LFS storage, any paid assets, code signing), to play-test and sign off on how the guns feel, and to pull in a friend or two for multiplayer tests. Expect weeks to months of sessions for Release 0.1, not one evening. Tier 1 alone (the Harbourside raid with friends) is a real, playable game; treat everything beyond it as a bonus.

Two technical facts worth knowing up front. Railway is excellent for the backend and the download page, but Unreal's netcode uses UDP, and Railway's public networking is built around HTTP and TCP, so the raids themselves run as player-hosted listen servers through Epic Online Services (free, with NAT traversal and relays). And Unreal Engine has to run on your own Windows PC; a cloud Claude Code session can't open the editor.

The design bible lives in this folder. If you want to change the game, change the bible first (or tell Claude Code what to change), and it'll follow.

What the first few sessions will look like, so nothing surprises you: in session one, Claude Code fetches the bible, reads it, and comes back with questions (answer them; they'll be about your accounts, your machine, money decisions and the game's name). In the next sessions it sets up the repo, the Lyra-based project, the Railway backend skeleton and the Epic Online Services checklist, and it'll ask you to click through the Epic Developer Portal and paste back some IDs. Then it starts on the gun range, and you'll spend a while firing four guns at targets and telling it what feels wrong. That part is the most important feedback you'll give in the whole project, so be picky. Once the guns feel right, the island starts to appear, and the first time the water rises over the quay with Hollows climbing out of it, you'll know it's working.

If at any point you want to cut scope (a smaller map, fewer guns, no boats), tell Claude Code which part to trim, and ask it to update the bible and `DECISIONS.md` so the plan stays honest.
