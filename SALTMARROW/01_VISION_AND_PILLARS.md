# SALTMARROW: PART 01, VISION, PILLARS AND SCOPE

This is part 01 of the SALTMARROW design bible. The kickoff file (`00_START_HERE.md`) tells you, Claude Code, the order to read everything in and the order to build in. Read this part first, because every decision in every later part bends back to the pillars defined here. When two later parts seem to disagree, the pillars break the tie. When a pillar and a technical constraint disagree, tell me, pick the option that keeps the game shippable, and write down what you gave up in `design/DECISIONS.md`.

---

## 1.1 THE GAME IN ONE PARAGRAPH

SALTMARROW is a third-person, squad-based, PvPvE extraction shooter set on a drowned North Atlantic archipelago. You and up to two friends ride a battered boat out from a floating hideout ship called the Halcyon, land on the islands of Saltmarrow, and scavenge a dead fishing town for guns, parts, medicine, fuel and the strange salt crystals everyone is killing each other for. Other squads of real players are doing the same thing. So are the Hollows, the drowned dead who walk out of the water whenever the weather turns. Every raid, a storm called the Surge rolls across the map on a path you can read in the sky. It drags the sea level up with it, flooding the low streets, and the only way off the islands is to reach an extraction point before the water or another squad takes you. Whatever you carry out is yours to keep, sell, or bolt onto a gun in the Halcyon's workshop. Whatever you die with is gone.

## 1.2 THE ONE-LINE PITCH

"Hunt: Showdown's tension and Escape from Tarkov's gunsmith, on a storm-swept island where the tide is the enemy, playable with your friends tonight from a single download link."

Nobody needs to have played those games to get it, but if they have, they know the feeling we're chasing: the slow walk into a building you can hear someone else in, the decision about whether to take one more room, the shake in your hands when you finally make the boat with a full bag.

## 1.3 WHY THIS GAME, AND WHY IT SUITS THIS PIPELINE

I picked an extraction shooter on purpose, and I want you to understand the reasoning so you protect it when you're making tradeoffs later.

First, it is the genre where gun customization actually matters. In a battle royale you pick up whatever is on the floor and it's gone in twenty minutes. In an extraction game the gun you built is the gun you bring, and you lose it if you die, so the gunsmith is the emotional core of the game, the place where people spend an hour between raids fiddling with a stock. That gives us an excuse to build the deepest weapon system we can, and the system pays back every hour we put in.

Second, the genre scales down gracefully. A raid with three friends and forty AI Hollows is a complete, fun game. A raid with twelve strangers is better, but the game does not collapse when the player count is small. That matters because this is going to be sent to a handful of people at first, not launched to a million. A game that only works with sixty players dies when twelve show up.

Third, the multiplayer model is forgiving. Raids are session-based, a host can run the match as a listen server, and the only persistent state is the stash and the progression, which live on a small backend. We don't need an MMO server farm. Railway hosts the backend, Epic Online Services (free) handles the NAT punching and relays, GitHub holds the code and the releases, and Unreal does the rest.

Fourth, the setting gives us a single mechanic, the rising water, that makes every raid different without needing a giant map. A 1.2 km square island chain with a storm that floods it from a different direction every time plays like six different maps.

## 1.4 THE FIVE PILLARS

Every feature has to serve at least one of these. If something serves none of them, cut it.

### Pillar 1: Every bullet has weight

Shooting is the main verb, and it has to feel incredible from the very first prototype. That means real projectile ballistics with drop and travel time, recoil you can learn and control, sounds that crack and echo off the water, impacts that throw spray and splinters, and hit feedback that tells you exactly what you hit and how hard. Guns are slow to kill with if you miss and fast to kill with if you hit. Time to kill on an unarmored target with a mid-tier rifle lands between 0.25 and 0.45 seconds. Armor stretches that out, and the right ammunition shrinks it back down. Nothing in this game is a hitscan laser.

### Pillar 2: The gun is yours

The gunsmith is not a menu. It is a workbench. You see the weapon field-stripped on a table under a warm lamp, you drag a part onto it and watch it snap into place, and the stat bars move in real time as you do it. Every major weapon has at least eight attachment slots, and many parts have their own sub-slots (a handguard has rail sections, a rail section takes a grip or a light). Parts change the weapon's real behavior in the raid, not just a number in a tooltip: a heavier barrel actually swings slower, a suppressor actually changes how far your shots can be heard, a magnified optic actually renders a picture-in-picture scope with real parallax. Beyond function, you can paint it, wear it, charm it, engrave it. When someone kills you and picks up your rifle, they should feel like they stole something.

### Pillar 3: The tide decides

The Surge is the clock, the map-maker and the referee. It arrives on a schedule, from a direction the players can read in the sky, and it physically changes the map: the water level rises in the low districts, streets become canals, ground floors fill up, and boats become the only way through. Hollows come out of the water as it rises. Sound changes because rain drowns out footsteps. Visibility drops. Good players read the storm and plan their loot route around it. Bad players get caught on the docks with the water at their chest and a pack of Hollows climbing out of the harbor. No two raids flood the same way.

### Pillar 4: Fear and greed

The heart of the genre is the tension between wanting more and wanting to live. Every system feeds that. Loot gets better the closer you go to the storm. The richest buildings are in the lowest districts that flood first. Sounds carry, so looting a container makes noise that other squads can hear. Extraction points cost something or have a condition. The longer you stay, the more you could take home and the more you could lose. The game never tells players what to do. It just keeps raising the stakes.

### Pillar 5: Play it tonight with your friends

This is the pillar that stops us from building a beautiful game nobody can actually run. One download link. No account creation screen with eleven fields. You open the game, it signs you in with a device identity (and optionally links Epic or Steam later), you see a friend code, you send it to a friend, they join your squad, and you're on the boat inside three minutes. It runs at 60 fps on a mid-range gaming laptop (RTX 3060 Laptop class) at 1080p on the Medium preset, and at a playable 30 fps on a Steam Deck class device on Low. If the host disconnects, the raid migrates or ends gracefully and nobody loses their gear to a network failure. Everything else in this document is secondary to the game actually working for the six people I'm going to send it to first.

## 1.5 WHAT KIND OF GAME THIS IS NOT

Not a battle royale. There is no shrinking circle in the BR sense, no 100 players, no last-squad-standing win condition. Nobody "wins" a raid. You survive it or you don't.

Not a looter-shooter with damage numbers. There are no floating numbers by default (there's an option in settings for people who want them in practice mode only), no gear score, no "legendary" rifles that do 40% more damage. Better gear means better parts and better ammunition, with real tradeoffs, not bigger multipliers.

Not a survival crafting game. There's no hunger bar that drains every five minutes, no base building on the islands, no chopping trees. You have hydration and warmth, both of which matter only in specific circumstances (being in the water, being in the storm), and the hideout ship has upgrade stations, but you don't build anything in the raid.

Not a horror game, although it's tense and occasionally scary. The Hollows are a threat, not a jump-scare delivery mechanism. The real horror is another player waiting on the stairs.

Not pay-to-win, and not monetized at all in the first version. There's no store with real money. Every cosmetic is earned in play. If I want to sell cosmetics later, the backend has the shape to support it, but you don't build any payment flow.

## 1.6 THE PLAYER FANTASY

You're a salvager. Your name is whatever the player types in. You work out of the Halcyon, a ferry that was anchored off the archipelago when the Surge first hit, and which has become a floating town for the people brave or desperate enough to go back to the islands. The town on the islands, Saltmarrow, was evacuated in a hurry nine years ago. People left everything. Banks, a hospital, a military listening station, a fish cannery, a lighthouse, a church on a hill, a ferry terminal, a power station, cottages, a school, a hotel. All of it is still there, rotting and flooding and drying out again, and full of things worth taking.

The fantasy has three moods we're trying to hit, and we should feel each of them in a single good raid.

The quiet scavenge: you're alone in a dentist's office on the second floor, rain on the windows, sorting through drawers, listening. It's calm and it's tense at the same time, because you know there are other squads on the island somewhere.

The firefight: someone opens up on you from the cannery roof, your squadmate goes down, you're throwing smoke and dragging them behind a car while you return fire with a rifle you spent forty minutes building. Loud, chaotic, short.

The escape: the Surge is coming, the sky is green-black and the wind is screaming, the water is pouring over the sea wall, and you're sprinting for the boat with an injured leg and a backpack full of salt. You make it. Or you don't.

## 1.7 TARGET AUDIENCE AND PLATFORM

Platform: Windows 10/11, 64-bit, DirectX 12 (with a DX11 fallback flag for older machines). That's the only shipping platform for version 1. Linux builds exist only for the optional dedicated server (part 18 explains why we might want one later). Steam Deck support comes free through Proton if we keep the game Proton-compatible, which mostly means not doing anything weird with anti-cheat or launchers, so don't.

Players: people who like shooters with some depth, mostly 18 to 40, who either already play extraction games or have always been curious but were scared off by how brutal and confusing Tarkov is. That second group matters most. Our onboarding (part 39) has to make the first three raids gentle without making the game soft.

Squad size: 1 to 3. Lobby/raid size: up to 12 players (4 squads of 3) on a full raid, with the actual number set by the host. Solo players can queue into a raid alone or play offline practice against bots.

## 1.8 THE SCOPE TIERS

You can't build the whole of this document in one pass, and you shouldn't try. Build in tiers. Each tier is a fully playable game, shippable to my friends, and better than the last. The detailed task breakdown and acceptance criteria are in part 40. Here's the shape.

### Tier 0: The Gun Range (target: first playable)

One small test map (the Halcyon's firing range, which also ships in the final game as a tutorial area). One character, third-person camera with ADS. Four weapons fully implemented with real ballistics, recoil, sound, VFX and animations: one pistol (the Kestrel 9), one SMG (the Gannet), one assault rifle (the Mako AR) and one bolt-action rifle (the Fathom). Six attachments per weapon. Target dummies that show hit locations. Two players can join each other through EOS and shoot targets and each other. That's it. The goal is to prove the gun feel and the networking from day one. If shooting feels bad at Tier 0, nothing else matters.

### Tier 1: The First Raid (target: vertical slice)

One district of the map (Harbourside, roughly 300 m by 300 m, described fully in part 14). The Surge system with a simplified rising water. Basic Hollows AI (two types). Inventory grid, backpack, looting containers, picking up items, the extraction flow, death and losing gear. The backend live on Railway with accounts, stash persistence and raid result commits. Twelve weapons. The main menu, lobby, squad invites, loadout screen and stash screen. This is the version I send to friends first.

### Tier 2: The Full Island (target: alpha)

The whole archipelago (five districts and three outlying islets). All Hollow types including two bosses. Boats. All 30+ weapons and the full attachment catalog. The gunsmith workbench screen in full. Traders, contracts, the Halcyon hideout with upgrade stations. Cosmetics. Weather variants and day/night. Full settings menu. Proper audio pass.

### Tier 3: The Polish Pass (target: beta)

Performance pass against the budgets in part 35. Accessibility features. Every UI screen animated and finished. Skirmish mode (quick PvP). Seasonal event framework. Replays/kill-cam. Telemetry dashboards. Launcher/updater. The full sound design and music. Achievements.

### Tier 4: Stretch

Dedicated servers. A second map. Ranked mode. Spectator mode. A real anti-cheat integration (EOS Anti-Cheat). Mod support for custom cosmetics.

Don't start a tier until the previous one is solid. "Solid" means it runs, it's fun, it doesn't crash in a 30-minute session with three players, and I've signed off.

## 1.9 THE NUMBERS THAT DEFINE THE GAME

These are the anchor values. Later parts reference them. If you change one, change it here and grep for everywhere else it appears.

| Value | Number | Notes |
|---|---|---|
| Raid length (standard) | 28 minutes | Surge arrives in waves; final flood at 24:00, last extraction closes at 28:00 |
| Players per raid | up to 12 | 4 squads of 3, host-configurable 2 to 12 |
| AI Hollows alive at once | 24 to 60 | Scales with player count and storm phase |
| Map playable area | ~1.4 km x 1.1 km | Main island plus islets, plus water between |
| Main island highest point | 74 m above datum | The church hill, St. Brendan's |
| Sea level at raid start | 0.0 m datum | |
| Sea level at full Surge | +3.8 m in flooded districts | Tidal rise varies by zone, see part 15 |
| Player walk speed | 1.8 m/s | |
| Player jog speed | 3.6 m/s | Default movement |
| Player sprint speed | 5.6 m/s | Drains stamina |
| Player wading speed | 1.2 m/s at waist depth | Scales with water depth |
| Player swim speed | 1.4 m/s | Can't use weapons while swimming |
| Player base health | 440 HP total | Split across 7 body zones, see part 05 |
| Stamina | 100 points | Sprint drains 9/s, regenerates 14/s after 1.2 s |
| Unarmored TTK, mid rifle | 0.25 to 0.45 s | Body hits, at under 50 m |
| Typical engagement range | 15 to 120 m | Long sightlines across water up to 400 m |
| Max bullet simulation distance | 1200 m | Projectiles are culled after this |
| Starting Scrip | 25,000 | First-time players |
| Stash size at start | 10 columns x 40 rows | Expandable to 10 x 120 |
| Raid entry fee | none | You only risk what you bring |
| Insurance | none in v1 | Considered for Tier 3, see part 17 |

## 1.10 TONE AND REFERENCES

Visual tone: cold, wet, overcast, northern. Think the Faroe Islands, the Outer Hebrides, a Newfoundland fishing outport, the Norwegian coast in November. Slate roofs, white and ox-blood painted wooden houses, corrugated iron sheds, concrete sea walls with rust bleeding down them, kelp on everything below the high tide line, rope and netting, orange buoys, gulls. Colour is muted most of the time with sharp accents: the orange of a life ring, the yellow of a fisherman's oilskin, the red of a channel marker light. When the Surge comes, everything goes green-black and the light turns sick.

Gun tone: grounded and mechanical, a little worn. Real-world operating principles (direct impingement, short-stroke piston, roller-delayed blowback, bolt action, pump, lever) with fictional names and slightly fictional designs, so we're not licensing anything and nobody's going to sue us over a trademark. Guns look like guns that have been used. Paint wears through at the edges. Salt crusts form on gear that's been in the water.

Sound tone: big, wet and lonely. Guns crack and roll off the water. Rain is a constant bed. Wind howls in the storm. Gulls in calm weather. Distant foghorns. Creaking wood. Water slapping on hulls. The Hollows make a wet clicking, gurgling sound that you learn to fear.

Music tone: sparse. No music in the raid except stingers (extraction available, Surge warning, death) and a low drone during the Surge itself. The Halcyon has warm, melancholy folk-ambient music: fiddle, cello, low drones, a bit of sea shanty in the bar. Main menu theme is a slow, building piece that turns into the Surge drone.

Narrative tone: understated. No cutscenes with talking heads. The story is told through the traders' dialogue, item descriptions, notes found in the raid, radio chatter, and the environment itself. There's a mystery (what the Surge is, why the salt matters, what happened at the listening station) but you discover it at your own pace, and nobody forces it on you.

References to look at and steal feel from, never copy: Hunt: Showdown (sound design, tension, atmosphere), Escape from Tarkov (gunsmith, inventory, extraction loop), Arc Raiders (third-person extraction, readable PvE), The Cycle: Frontier (accessible extraction onboarding), Dark and Darker (squad play), Sea of Thieves (water and boats with friends), Gray Zone Warfare (gun handling), Ready or Not (weapon handling, weight), Insurgency: Sandstorm (gun sound), Dishonored's Dunwall (rainy coastal mood).

## 1.11 CAMERA AND PERSPECTIVE DECISION

Third-person over-the-shoulder by default, with a full first-person aim-down-sights mode when you aim. This is a decision, and it's final unless it fails in playtest.

The reasoning: third person is friendlier, shows off the character and the gear (which matters for cosmetics and for reading what other players are carrying), and makes movement through flooded streets and onto boats feel physical. First-person ADS keeps gunfights honest because you can only shoot accurately at what your character can actually see, and it puts the gun's optic and iron sights right in your face, which is where the gunsmith pays off.

Peeking around corners in third person is the classic exploit. We fix it the way Hunt and Arc Raiders do: line-of-sight checks for rendering other players are done against a point near the character's head, not the camera, and the camera is close to the shoulder (offset ~0.55 m right, 0.15 m up, 1.6 m back by default). You can swap shoulders. Part 04 has the full camera spec, including the line-of-sight relevancy trick in multiplayer so that a player whose character can't see you doesn't get your position from the server until it's relevant.

There's also an optional full first-person mode in settings (hip-fire in first person too), because some people will want it, and it costs us little once ADS already exists. Third person stays the default.

## 1.12 MULTIPLAYER MODEL DECISION, SUMMARY

Full detail is in part 18. Here's the summary so you have it in your head from the start.

The raid runs on a host player's machine as an Unreal listen server. Other players connect through EOS P2P sockets, which handle NAT traversal and fall back to Epic's relay servers when a direct connection isn't possible. That means no player needs to forward ports and the host doesn't need a public IP. EOS Lobbies handle squad parties and the raid lobby. EOS Connect handles the identity with a Device ID login that needs no Epic account (players can optionally link an Epic account later to keep progress across machines).

The persistent stuff lives on our backend on Railway: player profiles, stash, progression, trader reputation, contracts, the raid-start "manifest" (what everyone brought in) and the raid-end "report" (what everyone took out). The host's server is authoritative during the raid, and the backend validates the report against the manifest (you can't extract with more Scrip value than was physically on the map, for example, and items carry server-issued IDs so they can't be duplicated). This won't stop a determined cheater who's also the host, and I accept that for a game among friends. Part 21 lists the protections we do build and part 18 lists the path to dedicated servers if we ever need them.

## 1.13 HOW I WANT YOU TO WORK

You are building this in Unreal Engine with C++ and Blueprints, driving the editor through the unreal-mcp connection (the `unreal-engine-skills-for-claude-code:unreal-mcp` skill), and writing toolsets for things you'll do repeatedly (the `create-toolset` skill). The backend is TypeScript on Node, deployed through my GitHub to Railway pipeline. Here are the rules for how you work, beyond the ones in the kickoff file.

Build systems in C++, tune them in data. Every weapon, attachment, item, enemy, loot table, trader and contract is a Data Asset or Data Table row, not a hand-made Blueprint subclass. That's how we get to 30 weapons and 300 attachments without 330 Blueprints that slowly drift apart. Blueprints are for presentation (UI widgets, animation blueprints, simple level scripting, cosmetic VFX sequencing), not core rules.

Make it playable at every step. Never let the project sit in a state where you can't press Play and walk around for more than one working session. If you're in the middle of a big refactor, keep the old path working behind a console variable until the new one replaces it.

Prove it with tests. Part 37 sets out the automation tests, functional tests and multiplayer smoke tests. Write them as you go. A system is not done until its tests pass.

Keep a log. Maintain `design/BUILD_LOG.md` with one entry per working session: what you built, what broke, what you decided, what's next. Maintain `design/DECISIONS.md` for every deviation from this bible. Maintain `design/CREDITS.md` for every third-party asset with its license.

Ask me when it's my call, not when it's yours. Things like the game's title being taken by another product, a choice that changes the feel of a pillar, spending money, or publishing anything public. Not things like which C++ container to use.

Be honest about state. If something is a placeholder, label it in the UI with a small "WIP" tag in development builds. If a feature is half-done, say so in the log. Never tell me it works if you haven't run it.

## 1.14 THE SUCCESS TEST

I'll consider this a success when I can send a link to three friends who have never heard of the game, they download it, they get into a raid with me in under five minutes, we play three raids in a row, someone dies with a gun they spent twenty minutes building and swears loudly, and at the end of the night somebody says "one more".

That's the bar. Everything in the other 56 parts is in service of that evening.

## 1.15 GLOSSARY OF TERMS USED THROUGHOUT

You'll see these words everywhere. Use them consistently in code, UI and data.

Raid: one match on the islands, from boat landing to extraction or death.

Squad: a group of 1 to 3 players who enter a raid together and share a voice channel, map markers and friendly-fire rules.

Halcyon: the hideout ship. It's both the in-fiction home and the out-of-raid menu space (it's a 3D scene behind the menus, see part 23).

Stash: the player's persistent storage of items, as a grid.

Loadout: the gear a player brings into a raid. Everything in it is at risk.

Scrip: the currency. Paper money issued by the Halcyon's council, stamped with a gull. Physical in the raid (you can find it, carry it, lose it).

Salt, or Marrow Salt: the strange crystalline salt that the Surge leaves behind. Valuable, used for high-tier upgrades, slightly glowing. The game's name comes from it.

The Surge: the storm. Comes in phases, raises the water, spawns Hollows.

Hollows: the drowned dead. AI enemies.

Wardens: elite human AI, a militia that controls part of the island. They appear from Tier 2.

Extract, extraction: leaving the raid alive at an extraction point with your gear.

Exfil: synonym for extraction, used in UI copy only when space is tight.

Trader: one of the four NPC vendors on the Halcyon who buy, sell and give contracts.

Contract: a quest from a trader with objectives in the raid.

Insurance: not in v1.

Gunsmith: the weapon modification screen and system.

Part, attachment, mod: used interchangeably in conversation, but in code and data the term is `Attachment` for anything that goes on a weapon. "Mod" is never used in code because it collides with game modding.

Container: any lootable object in the world (a drawer, a locker, a crate, a body).

Body: a dead player or AI that can be looted.

Hot zone: an area with above-average loot and above-average danger.

Datum: the 0.0 m sea level reference.

Dry: a zone above the maximum flood height for this raid.

Wet: a zone that will flood this raid.

Drowned: a zone that is currently underwater above head height.

## 1.16 THE OPENING THIRTY SECONDS OF A FIRST-TIME PLAYER

Since onboarding is a pillar, here's exactly what the first thirty seconds look like, from double-clicking the exe. Every later part has to support this.

0 s: The game window opens to a black screen with the sound of rain on a steel deck, slowly fading in.

2 s: The studio card (just the text "a game by Elliot Read and friends" in the UI font, small, centered; I'll change the text later). It fades out after two seconds. It can be skipped with any key.

4 s: The title screen. The camera is on the deck of the Halcyon at dusk, looking out across grey water toward the archipelago. The lighthouse on Gannet Rock is sweeping its beam. Lights flicker in a few windows on the island even though nobody lives there. The SALTMARROW logotype sits in the upper left, slightly weathered. A single prompt: "Press any key".

5 s: Behind the scenes, the game has already started the EOS Device ID login and the backend handshake. When the player presses a key, they're signed in. If it's their first time, they see one modal: "What should the crew call you?" with a text field pre-filled with a random salvager name (like "Gull_4471"), a checkmark button, and nothing else. They can change it later.

10 s: The main Halcyon menu. The camera has pulled back to show the character standing at the rail in their starter gear. The menu sits on the left: PLAY, LOADOUT, STASH, GUNSMITH, TRADERS, HALCYON, SETTINGS, QUIT. A first-time player sees a pulsing marker on PLAY and a small card: "First time out? Take the Shakedown run: a guided raid with no gear at risk." (Part 39 covers the Shakedown.)

20 s: They click PLAY. They see the raid setup screen with the Shakedown highlighted, their squad slots (1 of 3, with an "Invite friends" button showing their friend code), and a big START button.

30 s: They're on the boat.

If any of those steps takes longer, it's a bug.

---

End of part 01. Next: `02_WORLD_AND_LORE.md`.
