# SALTMARROW: PART 13, AI: HOLLOWS, WARDENS AND BOSSES

The AI does three jobs. The Hollows are the weather made flesh: a constant, readable, escalating pressure that pushes players around the map with the Surge and punishes noise. The Wardens are the skill check: smart, armed human enemies guarding the best loot. The bosses are the stories players tell afterward. None of them should feel like a bullet sponge or a cheater. All of them should be readable: a player who dies to the AI should know exactly why.

All AI runs on the host's server. Clients only see replicated characters. That means AI cost lands on the host's CPU on top of hosting the game and playing it, so the budget is strict (13.9).

---

## 13.1 ARCHITECTURE

Use Unreal's StateTree for AI decision making (it's Epic's recommended path for new projects, it's fast, data-driven, and debuggable with the StateTree debugger). Use AI Perception for senses (sight, hearing, damage, and a custom "salt sense"). Use the Environment Query System (EQS) for position picking (cover, flanking, ambush spots). Use the navigation system with Recast nav mesh plus custom nav areas for water depth. Use GAS for AI abilities and health, the same system as players (part 31), so damage, armor and status effects work identically.

Class layout: `ASMAICharacter` (base, derives from the same `ASMCharacterBase` as players for shared health, hit zones, damage and movement), `ASMHollowCharacter`, `ASMWardenCharacter`, `ASMBossCharacter`. `ASMAIController` hosts the `UStateTreeAIComponent` and the perception component. Each archetype is a Data Asset (`USMAIArchetype`): mesh, anim BP, StateTree asset, perception config, attribute set defaults, loot table, abilities, sound set, spawn rules.

A world subsystem, `USMAIDirector`, owns spawning, despawning, population budgets, wave logic tied to the Surge, and the significance/LOD system.

## 13.2 PERCEPTION

### 13.2.1 Senses

Sight: a cone and a range per archetype, with line-of-sight traces from the AI's eyes to six points on the target (head, chest, pelvis, hands, feet). Visibility is a score from 0 to 1 per target, built from how many points are visible, the target's stance (prone ×0.4, crouched ×0.7), movement (still ×0.6, walking ×0.8, sprinting ×1.2), light level at the target (sampled from a cheap light probe grid baked per level, plus dynamic boosts from flashlights, flares, muzzle flashes, burning, salt glow), weather (rain during the Surge ×0.7, fog ×0.6) and distance (falloff). Outfit never enters the score: all players are equally visible to AI regardless of cosmetics, so cosmetics never become a stealth advantage. The AI "notices" a target when the accumulated visibility over time crosses a threshold (a detection meter, per target, that fills at a rate proportional to visibility and drains when not visible).

Hearing: noise events from the sound event system (part 28): footsteps, gunshots (with their sound radius from the weapon config), reloads (12 m), looting (10 m), doors (15 m, 25 m for kicks), explosions (whole map), breaking glass (30 m). Proximity voice is never an AI noise source, because it would punish talking to your friends, and talking to your friends is Pillar 5. Each noise event has a loudness radius; AI within that radius (attenuated by walls: each wall between the source and the AI, found with a single line trace, halves the effective radius) hears it and gets a stimulus at the source location (with an error offset that grows with distance: up to 15% of the distance).

Damage: being hit gives a stimulus pointing back toward the shooter's location at the time of the shot.

Salt sense (Hollows only): Hollows sense Marrow Salt carriers through walls within a short range (base 8 m, more with more salt, part 12). It's a soft attraction, not instant detection: they drift toward it.

### 13.2.2 Awareness states

Every AI has an awareness state per target and an overall state:

Unaware: idle behaviors.
Suspicious: heard something or partial sight; investigates.
Alert: knows a target is nearby but not exactly where; searches.
Engaged: has a target; attacks.
Fleeing (Wardens only, and some Hollow types near fire): retreats.

Transitions are driven by perception. Show these states to the player through behavior and sound, never with a UI icon above the AI's head (no "?" and "!" icons; this is not a stealth game with a HUD). A Shambler that's heard you turns its head toward the noise and makes a wet clicking sound. That's the cue.

## 13.3 THE HOLLOWS

The Hollows are the drowned dead of Saltmarrow, animated by the salt. They're the main AI population. Their visual design language: human bodies that spent time underwater, bloated or shrunken, skin waxy grey-blue and crusted with white crystalline salt that grows in branching patterns from the eyes, mouth and wounds (the crystals glow faintly in the dark, a pale cyan, which helps readability at night). They wear the clothes they drowned in: oilskins, pyjamas, cannery aprons, school uniforms (sparingly), suits, nurses' scrubs. Kelp and seaweed tangle in their hair. They move with a heavy, wet, uncoordinated gait, like people walking against water. They never speak; they click, gurgle, hum low, and when they attack, they make a horrible rasping exhale.

### 13.3.1 Hollow types

| Type | Role | HP (total) | Speed (walk/run) | Damage | Senses | Weakness | Spawn | XP |
|---|---|---|---|---|---|---|---|---|
| Shambler | Basic, numerous | 200 | 1.0 / 3.4 m/s | Grab and bite: 28 per hit, 1.2 s | Sight 25 m (poor), hearing normal | Head (×2 multiplier on Hollows), fire | Everywhere | 20 |
| Crawler | Ambusher, low | 120 | 0.6 / 4.8 m/s (lunge) | Lunge 35 + bleed chance | Sight 12 m, hearing ×1.5 | Fragile, slow to recover after lunge | Under water, in rubble, crawlspaces | 30 |
| Wailer | Alarm, support | 160 | 1.2 / 3.0 m/s | Scream (no damage): alerts all Hollows within 60 m, applies a short concussion within 8 m | Sight 30 m, hearing ×2 | Kill fast; scream has a 1.2 s wind-up with a visible chest heave | Surge waves 2+ | 50 |
| Bloat | Area denial | 260 | 0.8 / 2.2 m/s | Bursts on death or when adjacent: 90 blast + Salt Sickness | Sight 18 m | Shoot from range; don't melee | Surge waves 2+, flooded buildings | 60 |
| Brute | Heavy | 900 | 1.1 / 4.2 m/s (charge) | Slam 80 + knockdown; charge 120 | Sight 30 m, hearing normal | The salt-crystal "growths" on its back (×3 multiplier, a visible weak point); fire | Surge wave 3, boss areas | 120 |
| Drowner | Water threat | 180 | swim 2.4 m/s | Grabs a swimming or wading (waist+) player and pulls them under: 15/s + drowning, until broken free (mash Interact or a squadmate shoots it) | Senses movement in water within 20 m | Only appears in water; vulnerable when it surfaces to grab | Deep water during and after Surges | 60 |

Damage multipliers on Hollows: head ×2.0, salt growths ×3.0 (Brutes only, and a few Shamblers with visible growths ×1.5), limbs ×0.6, torso ×1.0. Hollows don't wear armor (except a rare Shambler variant in a stab vest or helmet, which uses armor normally; a visual tell for players to swap targets). Hollows don't bleed out, don't fracture, and don't feel pain, but fire terrifies them: burning Hollows flee (and keep burning, spreading fire to others they touch). Hollows have a "dismemberment lite": a high-damage hit to an arm can remove the forearm (a mesh swap with a gore decal; tone it to grim, not splatter-gore), which removes their grab attack.

### 13.3.2 Hollow behaviors (StateTree)

Idle states (Unaware): Stand and sway (with a low hum), shuffle along a short patrol (from spawn point patrol splines or a random walk in their zone), "remember": stand at a significant object and stare (at a window, a photograph, a child's toy, a front door; placed as "memory points" in the level by the level designer; it's eerie and sells the lore), sit slumped against a wall (looks like a corpse until it moves: a classic, use sparingly), submerged (lying underwater in flooded areas, rising when disturbed).

Suspicious: turn toward the stimulus, click, walk to investigate the stimulus location, look around, then return to idle after 15 s.

Alert: call nearby Hollows (a gurgling call that pulls Unaware Hollows within 15 m to Suspicious at the same location), search the area in a loose spread.

Engaged: chase the target (run speed), attack when in range. Shamblers attack in groups: they surround (EQS: positions around the target not occupied by other Hollows). Shamblers that lose sight of the target go to the last known position, then search.

Grab mechanic: Shamblers and Drowners grab. A grab locks the player into a struggle for up to 2.5 s (the player can't fire long guns, can fire pistols point-blank, can melee, or mash Interact to break free: 8 presses). Other Hollows deal +50% damage to a grabbed player. A squadmate shooting the grabbing Hollow breaks the grab. Grabs are the main way Hollows become deadly, and they create great team moments. The grab must be readable: a 0.6 s wind-up (arms rising, a rasp) before it lands, and a dodge (sprinting, vaulting or meleeing during the wind-up avoids it).

Water behavior: Hollows walk through water at any depth (they don't swim; they walk on the bottom when it's deep, emerging as the water drops or when they reach shallower ground). During a Surge, Hollows rise out of the water at spawn points along the advancing flood line. That's the signature visual: dozens of figures standing up out of the sea as the storm hits.

Fire behavior: a Hollow within 3 m of fire (burning fuel, incendiary, flare) won't approach and tries to path around. Burning Hollows flee for 4 s. Fire barrels in the world (lit oil drums, some placed by previous salvagers) are safe havens against Hollows during a Surge. That's a great tactical tool.

Light behavior: Wailers are agitated by direct flashlight beams (shining a light on a Wailer for 1.5 s triggers its scream). Other Hollows are mildly attracted to lights at night.

### 13.3.3 Hollow spawning

Static population: at raid start, Hollows are placed at spawn points in buildings and around the map (density per zone set by the zone's danger level and the raid type), mostly in Idle states. Static population at raid start: 30 to 50 for a full raid (scales with player count, see 13.9).

Surge waves: when each Surge wave hits (part 15), the director spawns waves at "tide spawn points" along the flood front: places where the water's rising (beaches, slipways, flooded streets). Wave sizes: wave 1: 12 to 20 (Shamblers, Crawlers), wave 2: 16 to 24 (adds Wailers, Bloats), wave 3: 20 to 30 (adds Brutes, Drowners). Wave Hollows spawn already Alert, with a stimulus at the nearest player within 120 m (so they push toward players, but not perfectly).

Noise attraction: every gunshot within a Hollow's hearing radius pulls it. That means a long firefight in the open draws Hollows from all around, which is the genre-defining "third party" dynamic, PvE edition.

Despawn: Hollows that are more than 200 m from any player, not in view, and Unaware for 60 s can be despawned (returned to the pool), so the director can respawn them where they matter. Bodies of killed Hollows persist (with simplified collision) and can be looted.

Hollow loot: Hollows drop little: sometimes what the person had on them when they drowned (wedding ring, wallet with old notes, keys, a gold tooth), 15% chance of a single item from a small table. Brutes drop a Salt Shard 50% of the time, and a Cluster 10%.

## 13.4 THE WARDENS

The Wardens are human soldiers (former listening station security, plus locals). They're the hard enemy and the best loot. They fight like competent, cautious humans: they use cover, communicate, flank, suppress, throw grenades, retreat when hurt, and call for reinforcements.

### 13.4.1 Warden types

| Type | Loadout pool | Behavior | HP | Armor |
|---|---|---|---|---|
| Rifleman | Bora, Bora-S, Mako (rare); Class 3 to 4 armor; helmet 50% | Standard soldier | 440 (player-equivalent zones) | Normal armor rules |
| Marksman | Drakon, Skua, Fathom (rare) | Holds high ground, long range, repositions after 2 shots | 440 | Class 3 |
| Gunner | Bora-L, Grom (power station roof only) | Suppression, holds a position | 440 | Class 4 |
| Breacher | Squall, Breaker | Pushes into buildings, close range | 440 | Class 4 to 5 |
| Medic | Fulmar, Gannet | Heals and revives other Wardens, carries good medical loot | 440 | Class 3 |
| Officer | Corsair, Albatross, Frigate (rare) | Coordinates squad (other Wardens near an officer fight better: faster reactions, more flanking), carries keys and the best loot | 440 | Class 5 |

Wardens follow all player rules: hit zones, armor penetration, bleeding, fractures, healing items (they actually use their medical items, and you can loot what they didn't use), ammo (they have finite magazines and reload), weapon malfunctions (rare). They're not cheats. Their weapons and armor drop and are lootable intact (with random durability between 40% and 90%).

### 13.4.2 Warden squad behavior

Wardens patrol in squads of 3 to 5 (one Officer per two squads on average, guaranteed at LISTENER and the power station). Squad behaviors in the StateTree, coordinated by a squad manager object (`USMWardenSquad`) that shares perception between members (if one sees you, the squad knows within 0.5 s, through a radio callout you can hear: "Contact! East side!" with voice lines, which is a great cue).

Patrol: walk patrol routes (splines placed in the level, with pause points), in a loose formation, talking occasionally (ambient voice lines that also tell players where they are).

Investigate: two members investigate a noise while others cover.

Engage: take cover (EQS: cover points with line of sight to the target, preferring points that don't expose the AI to other known threats; use a cover generator that pre-bakes cover points along walls, cars, sea walls and crates into the level at build time), fire in bursts from cover, peek and shoot, suppress (the Gunner fires at the target's last known position even without sight, to pin them), flank (one or two members move along an EQS-selected flanking path that avoids the target's sight line while others suppress), grenade (throw when the target is behind cover and hasn't moved for 4+ s, with a voice callout "Frag out!" that's a fair warning), push (when a target is wounded, which they know from hit feedback, the Breacher pushes).

Retreat: a Warden below 30% HP retreats to cover behind the squad and heals (taking 6 to 10 seconds, which is the player's window). If the squad loses two members, survivors retreat to a fallback position (defined per patrol) and call reinforcements (a radio call that spawns a 2-3 man reinforcement squad from a defined spawn point 2 minutes later, once per raid per zone).

Accuracy model: AI aim is not perfect. Each shot has an aim error that starts large when first engaging (2° to 4°), tightens over the first 1.5 to 3 seconds of continuous sight (the "settle" time), grows when the AI is moving, suppressed (being shot near), wounded or the target is moving fast, and is affected by the weapon's real recoil and spread (AI fire through the same ballistic system as players, with the same recoil, meaning a Warden spraying a Grom at 300 m misses most shots). Difficulty tunes the settle time and base error (13.8). AIs never shoot through walls at targets they can't see (except suppressive fire at the last known position, which can penetrate thin walls like player fire would, which is fair).

Reaction time: from first seeing a target to first shot: 0.45 to 0.9 s base (plus settle time for accuracy). Never instant.

Wardens vs Hollows: Wardens and Hollows are hostile to each other. Wardens shoot Hollows (and the noise draws more Hollows). During a Surge, Wardens retreat to their fortified positions (LISTENER, the power station, the police station). Players can exploit this: lure Hollows into a Warden patrol.

### 13.4.3 Warden voice lines

Wardens talk, and it's important for readability. Write 120 lines per voice set (3 voice sets), covering: idle chatter (about the Surge, about the Mainland, about the Halcyon salvagers, complaints about rations, jokes), patrol callouts, contact callouts with directions ("Contact, north!", "Movement in the cannery!"), reloading ("Changing mag!"), grenade ("Frag out!"), hit ("I'm hit!"), man down ("Man down! Davies is down!"), flanking ("Moving left, cover me!"), suppression ("Keep their heads down!"), retreat ("Fall back!"), victory ("Clear. Salvager down."), and reactions to Hollows ("Drowned on the left!", "Jesus, there's dozens of them!"). As with player voices, use real recordings or skip voice lines rather than shipping robotic TTS; placeholders labeled WIP are acceptable in development.

## 13.5 THE BOSSES

Two bosses at Tier 2, each a set piece with its own arena, mechanics, loot and story. A boss spawns in 25% of Standard raids (each), at most one boss per raid, and the radio hints at it ("Sparks: Fog's thick round the harbor mouth. Old-timers would say the Ferryman's working tonight.").

### 13.5.1 The Ferryman

Lore: the Halcyon's old purser, Thomas Gault, who went back to the town on the third night of the first Surge to look for his daughter. He didn't come back. Now he does, during the worst storms: a huge Hollow, crusted in thick salt armor, wearing the remains of his ferry uniform, carrying a boat hook as long as a man. The Hollows follow him like he's still collecting tickets.

Arena: the ferry terminal and the vehicle marshalling yard (Harbourside), with the ramp, the waiting room, the ticket office and 60 abandoned cars. Spawns at Surge wave 2.

Stats: 3,600 HP. Salt armor plates (6 visible plates on his chest, back, shoulders) each with 300 HP that absorb all damage to their area until broken (shatter with a great VFX and sound). Weak point: once the chest plate breaks, the exposed salt "heart" (×2.5 multiplier). Speed: walks 1.4 m/s, never runs, but has a hook pull.

Abilities: Hook Pull (throws the boat hook on a chain at a target within 18 m in line of sight, 1.0 s wind-up with a rattle; if it hits, pulls the target to him and stuns 1.2 s: dodge by breaking line of sight or sprinting perpendicular), Sweep (a 270° hook swing, 140 damage, 4 m radius, 1.4 s wind-up), Toll the Bell (he rings the ferry's bell on the terminal: all Hollows within 150 m become Alert toward the players he's fighting; once every 45 s), Fare (when he kills a player, he takes one item from their body, the most valuable, and it's added to his own loot drop, which is a darkly funny touch that motivates revenge), Low Tide (at 30% HP, he walks into the water, and the harbor water around the terminal rises 1 m locally for 60 s, spawning Drowners).

Loot: guaranteed: the Ferryman's Coin (charm, first kill), Gault's Ticket Punch (a key that opens the terminal strongroom, which has a weapon crate), 2 to 4 Salt Clusters, a Salt Geode (40%), and anything he took as Fare. Rare (10%): the Ferryman finish (weapon skin) blueprint.

### 13.5.2 The Lantern Choir

Lore: five LANTERN scientists who stayed in the control room on the night of BELLWETHER. They're still there, sort of: fused together by the salt into a single horrible mass in the station's flooded lower level, connected to the array by cables grown through with crystal. They sing. The song is the same frequency the array pulses at. It's the most direct horror in the game, and it should be eerie, sad and frightening, not gory.

Arena: LISTENER's operations building basement and the pump room (Tier 2 map content, part 14), accessed through a blast door that requires the LANTERN Keycard from a contract or from Warden officers.

Stats: the Choir doesn't move. It's a stationary boss with 5 "singers" (each 800 HP, ×2 head multiplier) on a central mass (immune until all singers are dead, then 2,000 HP with a glowing core at ×2). The room floods progressively during the fight.

Abilities: The Song (constant: a sustained chord that causes a slow concussion buildup on all players in the room: blurred vision and tinnitus that grows over 20 s unless the player breaks line of sight with the singing faces; it resets when you hide), Harmony (when two or more singers are alive, they take 50% damage from all sources unless the player shoots the one that's currently singing the high note, shown by its glowing throat), Pulse (every 30 s, a blast of sound: knockback, 40 damage, extinguishes all lights and flashlights for 3 s; the room's emergency lights flicker), Choir of the Drowned (the floodwater spawns Hollows each time a singer dies), Rising Water (the room floods from 0 to 2.2 m over 4 minutes; if the fight takes too long, players have to swim).

Loot: the LANTERN Response Armor (Class 6), LANTERN Hard Drive (contract and valuable), Heart of the Tide (30%), 3 to 6 Salt Clusters, the Lantern finish (first kill), the LANTERN Keycard charm, and lore notes that advance the main mystery.

### 13.5.3 Boss design rules

Every boss ability has a visual and audio tell at least 0.8 s before it lands. Every boss can be beaten by a skilled solo player with good gear (hard but possible), and comfortably by a coordinated squad. Bosses never heal. Bosses don't leave their arena (they reset to full HP and their spawn after 60 s without players in the arena). Boss fights attract other players (the noise), which is the real danger.

## 13.6 NAVIGATION IN A FLOODING WORLD

The water level changes during the raid, and the AI needs to know what's walkable, wadeable and deep.

The nav mesh is generated for the dry map (at datum, low tide). Custom nav areas: `NavArea_Shallow` (water up to 0.6 m: normal cost for Hollows, 1.5× for Wardens), `NavArea_Wade` (0.6 to 1.4 m: 2× for Hollows, Wardens avoid unless necessary at 5×), `NavArea_Deep` (over 1.4 m: Hollows walk the bottom at 3× cost, Wardens never), plus static areas for roofs, ladders and jump links.

Dynamic updates: when the Surge changes water levels, the AI director updates nav area costs through a coarse grid: each nav poly's area class is determined by its height relative to the zone's current water level. Don't regenerate the nav mesh (expensive). Instead, query costs through a custom navigation query filter that reads the water subsystem's height grid (part 04) per poly at path-finding time. Use `FRecastQueryFilter` subclass with a custom `getCost` override that checks the poly's average height against the current water level from the water subsystem. That's the clean way to make paths react to rising water with zero nav rebuilds.

Nav links: mantle points (window sills, fences, walls) are smart links that AI uses with the same mantle system as players (Wardens mantle; Hollows mostly climb clumsily over low obstacles and can't mantle above 1.2 m, which gives players escape routes: get on a roof and Shamblers can't follow). Ladders: Wardens use ladders. Hollows don't (another escape route). Brutes can smash through certain doors and fences (marked as breakable), which takes 2 s.

## 13.7 COMBAT AI DETAILS

### 13.7.1 Cover generation

At build time (editor-only commandlet or an editor utility), generate cover points on the nav mesh: for each nav mesh edge adjacent to a wall or obstacle at least 0.9 m tall (low cover) or 1.6 m tall (high cover), place points every 1 m with a facing direction and a cover height. Store them in a per-level `USMCoverData` asset in a spatial hash. EQS queries use them. Mark them invalid dynamically when they flood (under water above 1 m).

### 13.7.2 Target selection

Each AI picks a target by a score: distance, visibility, threat (who shot me most recently), proximity to squadmates, whether the target is wounded, whether the target is carrying salt (Hollows only), whether the target is a Hollow (Wardens prefer players over Hollows unless a Hollow is within 6 m). Retarget at most every 2 s unless a new damage stimulus arrives.

### 13.7.3 Friendly fire

AI respects friendly fire: Wardens don't fire if a squadmate is within a 2° cone of their shot path at closer range than the target. They'll reposition instead. Hollows don't care about each other at all (Bloats bursting damages other Hollows, which is a deliberate and funny tactic).

## 13.8 DIFFICULTY

There's no difficulty setting in Standard raids (everyone in a multiplayer raid faces the same AI). The AI scales with:

Raid type: Shakedown (easier: Warden reaction 1.4×, aim error 1.5×, Hollow density 0.5×, no Wardens actually, per part 03), Standard (baseline), Night (Hollow density 1.3×, Hollow sight -30% (they don't see well in the dark either), Wardens use flashlights and NVGs at 40%).

Player count: Hollow population scales with players (13.9), Warden count does not (they're fixed by the map, which keeps the best loot equally contested).

Practice mode has a slider: Easy, Normal, Hard, Brutal (affecting reaction, aim error, settle time, Hollow damage, detection rates).

## 13.9 PERFORMANCE BUDGET

The host's machine runs the server and a client at once. Target AI cost on the host: under 3.0 ms per frame of game thread at 60 Hz with 60 active Hollows and 15 Wardens, on a 6-core 2020-era CPU (Ryzen 5 3600 class).

How to hit it:

Significance manager (`USignificanceManager`): every AI gets a significance based on distance to the nearest player and visibility. High significance (within 50 m of a player or in view): full tick rate for StateTree (10 Hz is plenty for decisions), perception every 0.2 s, full CMC movement, full animation. Medium (50 to 150 m): StateTree at 4 Hz, perception at 0.5 s, simplified movement (CMC with lower tick rate), animation via update rate optimization (URO). Low (over 150 m, not visible to anyone): StateTree at 1 Hz, perception off except hearing, movement on nav paths without full physics (or freeze in place if Idle), animation off (no skeletal update on the server at all).

Server animation: the server doesn't need to run animations for Hollows except for hit detection. Use "only tick montages when not rendered" and the `VisibilityBasedAnimTickOption` set appropriately on the server. Lag compensation for AI hitboxes isn't needed (AI don't have ping); hitboxes on the server need to match roughly what clients see, so keep root motion off and animations deterministic enough. For hit detection against AI on the server, a cheaper option: hitbox approximations from the capsule plus bone positions sampled from a pose snapshot taken at 10 Hz.

Animation budget allocator: on clients, use the Animation Budget Allocator plugin to cap the cost of 60+ animated characters, and animation sharing for distant Hollows (Shamblers sharing a few animation states). On clients, use the Skeletal Mesh "Update Rate Optimizations" and aggressive LODs (Hollows at 50 m use LOD2, which keeps the skeleton but reduces mesh complexity and drops finger and facial bones through bone reduction).

Population limits (max alive at once, for a full 12-player raid): Hollows 60 (Night 72), Wardens 18, bosses 1. For fewer players: Hollows = 24 + 3 × players, capped. Wardens fixed per map.

Replication: AI characters use a lower net update frequency (Hollows 10 Hz when relevant and nearby, 2 Hz when far; Wardens 20 Hz when engaged). Use dormancy for idle Hollows (they go dormant when Unaware and stationary; wake on perception). Movement replication for Hollows uses CMC's simulated proxy smoothing; it's fine at 10 Hz for slow-moving zombies.

Mass AI / Mass Entity: don't use it for v1. It's the "right" tool for huge crowds, but our numbers (60) don't need it, and the integration cost with GAS, perception and replicated characters is huge. Revisit in Tier 4 if we want 200-Hollow events.

## 13.10 AI DEBUG TOOLS

Build debug views from day one: a console command `sm.ai.debug 1` that shows over every AI its archetype, awareness state, current StateTree state, target, detection meters, significance tier, and nav path. `sm.ai.spawn <archetype>` spawns one at the crosshair. `sm.ai.freeze`, `sm.ai.kill all`, `sm.ai.wave <n>` (forces a Surge wave spawn), `sm.ai.blind` (AI ignore players), `sm.ai.budget` (prints the AI frame cost breakdown). Use the Gameplay Debugger (apostrophe key) categories for AI perception and EQS, which Unreal provides.

## 13.11 AI ACCEPTANCE TESTS

A Shambler at 20 m that hears a gunshot investigates the shot location within 1 s and reaches it within 15 s.

A grabbed player can break free by mashing within 2.5 s, and a squadmate's shot to the Hollow breaks the grab.

Hollows path around fire; burning Hollows flee.

Hollows can't reach a player standing on a roof accessible only by ladder or a mantle above 1.2 m.

Wardens take cover, flank and throw grenades in the combat test arena (a scripted test with a dummy player target that stays behind cover).

A Warden shooting at a stationary target at 100 m with a Bora lands a hit rate between 25% and 45% in the first 3 seconds (verify the aim model isn't too good).

The AI frame cost on the server stays under 3.0 ms with 60 Hollows and 15 Wardens in the AI soak test level (part 37), on the reference CPU.

When the water rises, Wardens stop using paths through flooded streets within 2 s of the level change.

---

End of part 13. Next: `14_THE_MAP_SALTMARROW.md`.
