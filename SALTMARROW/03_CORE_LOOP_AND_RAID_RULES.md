# SALTMARROW: PART 03, CORE LOOP, SESSION FLOW AND RAID RULES

This part defines what the player does, in what order, and by what rules. It's the contract between the game systems. If you're ever unsure what happens when, say, a player disconnects while carrying a squadmate's backpack on a boat that's about to extract, the answer is in here. If it isn't, add it here, then build it.

---

## 3.1 THE THREE LOOPS

SALTMARROW runs on three nested loops, and you need to design and test each one on its own terms.

### 3.1.1 The moment loop (seconds)

Look, listen, decide, act. In the raid, the player is constantly scanning for threats, reading sound cues, choosing a path, and either moving, looting, hiding, or fighting. The moment loop has to feel good on its own, with no meta-progression at all. That's why Tier 0 is a gun range: if walking, aiming and shooting aren't fun in an empty room, nothing built on top will rescue them.

The key interactions in the moment loop, all of which need the best feel we can give them: moving (jog, sprint, crouch, prone, vault, mantle, wade, swim, climb ladders, enter/exit boats), aiming (hip, ADS, lean, swap shoulder, hold breath for scoped weapons), shooting (single, burst, auto, reload, tactical reload, check magazine, clear malfunction), looting (open container, search, pick up, quick-move items, drop), healing (bandage, splint, injector, painkillers, surgery kit), and communicating (proximity voice, squad voice, ping, emotes).

### 3.1.2 The raid loop (25 to 30 minutes)

Prepare, deploy, scavenge, survive, extract. One raid, from the boat landing to either the boat leaving or the player dying. The raid loop is where tension lives. It needs a clear shape: a calm opening where players spread out and loot, a middle where the first Surge wave hits and squads start colliding as the water pushes them together, and a desperate end where the final flood shuts down most of the map and everyone's fighting for the last extractions.

### 3.1.3 The meta loop (hours to weeks)

Raid, return, sell, buy, build, upgrade, raid again. The meta loop is everything outside the raid: the stash, the traders, the gunsmith, the hideout upgrades, the contracts, the reputation tracks, the cosmetics. It gives raids meaning beyond the immediate thrill. It must never be so punishing that a few bad raids make the game unplayable (the floor is the free Scavenger loadout, see 3.6), and it must never be so generous that losing gear doesn't sting.

## 3.2 THE SESSION FLOW, END TO END

This is the flow of one play session. Each step lists the screen or space, the systems involved and the backend calls. Use it as the integration test script for Tier 1 (part 37 turns it into automated tests).

1. Launch: the game boots, plays the splash, loads the title map (the Halcyon's bow at dusk). Systems: game instance init, EOS SDK init, online subsystem init. Backend: `GET /v1/status` (version check, server news, maintenance flag).

2. Sign-in: on "press any key", the client logs in to EOS Connect with Device ID (creating the Device ID on first run), gets a Product User ID (PUID) and an ID token, and exchanges it with our backend for a session JWT. Backend: `POST /v1/auth/eos` with the EOS ID token, returns `{ jwt, refreshToken, profile }`. If the profile is new, the client shows the callsign modal and calls `POST /v1/profile/callsign`.

3. Halcyon (main menu): the player can go to any menu screen. The 3D scene is the Halcyon, with the camera moving between spots for each screen (part 23). Backend: `GET /v1/profile`, `GET /v1/stash`, `GET /v1/traders`, `GET /v1/contracts`, all cached client-side with ETags.

4. Squad up: the player can invite friends through their friend code, the EOS friends list (if they linked an Epic account), or a lobby join link. The squad is an EOS Lobby with up to 3 members and the "squad" bucket ID. The leader is the lobby owner. Systems: EOS Lobby interface, presence. Backend: `POST /v1/squad/notify` (optional, for showing squad state on our web dashboard later; no gameplay dependency).

5. Raid setup: the squad leader picks the raid type (Standard, Shakedown, Night, Skirmish, Practice) and the server region preference, then either hosts or searches. Players set their loadout (Loadout screen). Backend: `POST /v1/loadout/validate` for each player, which checks every item in the loadout exists in their stash and locks those items as "in transit".

6. Matchmaking: one of two paths. Path A (host): the squad leader's machine creates a raid lobby (EOS Lobby, "raid" bucket, up to 12 members, with attributes for map, raid type, region, version, slots open) and starts a listen server. Path B (join): the squad searches for open raid lobbies with matching attributes and joins one, or, if none found within 20 seconds, falls back to Path A and becomes the host. The host's game creates a raid on the backend. Backend: `POST /v1/raids` returns a `raidId`, a `raidSeed` and a signed `raidTicket`. Each joining player calls `POST /v1/raids/{raidId}/join` with their validated loadout, which returns their `entryManifest` (every item with its server-issued instance ID).

7. Loading: players travel to the raid map. The deployment screen shows the squad on a boat with a countdown (the boat ride is a 20 second in-engine cinematic of the boat crossing toward their insertion point; it masks loading). Systems: seamless travel, level streaming of the start zone first.

8. Insertion: each squad lands at a different insertion point (part 14 lists 8). The host's server assigns insertion points so squads start far apart.

9. The raid: 28 minutes of looting, fighting, the Surge, extracting or dying. Detailed rules from 3.4 onward.

10. Raid end for a player: extraction, death, disconnection timeout, or raid timeout (still on the island at 28:00, counts as missing in action, MIA). The host's server sends a signed per-player report to the backend: `POST /v1/raids/{raidId}/report`. The backend validates it against the entry manifest and the raid's loot ledger, commits the result to the stash, and returns the summary.

11. Raid summary: the post-raid screens (part 24): status (Extracted, Killed, MIA), time in raid, kills (players, Hollows, Wardens), damage dealt and taken, items gained and lost, XP gained, reputation gained, contract progress, the killer's name and weapon (if killed by a player), and a kill-cam summary (Tier 3).

12. Back to the Halcyon: the stash is updated. The player can sell loot, repair gear, upgrade the hideout, accept contracts and build their next loadout. Then back to step 4.

## 3.3 RAID TYPES

Five raid types exist in the final game. Tier 1 needs Standard and Shakedown. The others come in Tier 2 and 3.

### 3.3.1 Standard

The main mode. 28 minutes, up to 12 players, full Surge cycle, full loot, full risk. Everything you bring is at risk, and everything you find is yours if you get out.

### 3.3.2 Shakedown

The tutorial raid and the safe practice mode. Played on the same map, but only one squad (no other players), reduced Hollows (half density), no Wardens, and nothing brought in is at risk (the backend marks the raid as `riskless`, so on death the loadout returns to the stash). Loot found in Shakedown is tagged "Shakedown" and can be sold for half value but not kept, so there's a small reward without making it a farm. The first Shakedown is the guided onboarding (part 39). After that it's always available.

### 3.3.3 Night

Unlocked at account level 10. The same map at night, with the Surge cycle faster (22 minutes), more Hollows, and better loot (+25% rarity weight). Flashlights and night vision matter. The lighthouse is your best friend. The church bell rings on the hour.

### 3.3.4 Skirmish (Tier 3)

A quick PvP mode with no persistence, for when friends just want to shoot each other. Squads of 1 to 3 on one district of the map, round-based (first to 5 round wins), everyone picks from a set of preset loadouts or their own builds (copied, not at risk), no Hollows, no loot. The Surge acts as a shrinking zone: the water rises from the edges, and players in deep water take damage. 3 minute rounds. This is the "send to anyone" mode for people who don't want to learn the extraction loop.

### 3.3.5 Practice (offline)

A single-player offline mode against bots on any district, with configurable Hollow density, Warden presence, Surge timing and loadout (any weapon and attachment, regardless of stash). It's a sandbox for testing builds and learning the map. No progression. The gun range on the Halcyon is always available too.

## 3.4 THE RAID TIMELINE

Every Standard raid follows the same phase structure. The exact timings vary with the seed (± 60 seconds for each phase start) so players can't time it to the second.

| Time | Phase | What happens |
|---|---|---|
| 0:00 | Landing | Squads land at insertion points. Calm weather. Low tide. Causeways passable. Sparks's opening broadcast. |
| 0:00 to 7:00 | Calm | Light rain at most. Normal Hollow density (shamblers and crawlers, mostly asleep in buildings). Good visibility. |
| 6:00 | First warning | Sky starts to change color in the Surge direction. Sparks: "Pressure dropping." Wind rises. |
| 7:30 | Surge 1 begins | The storm front arrives from the chosen direction. Rain heavy. Water rises +1.2 m in the lowest zones over 90 seconds. Causeways flood. Hollow wave 1 spawns from the water. |
| 9:00 to 14:00 | Lull 1 | Storm passes partly, rain eases, water stays at +1.2 m and very slowly recedes 0.2 m. Salt deposits appear where the water reached (high value loot). |
| 14:00 | Second warning | Sky darkens again, greener. Thunder. |
| 15:00 | Surge 2 begins | Heavier storm. Water rises to +2.4 m in low zones over 90 seconds, flooding ground floors in Harbourside. Hollow wave 2 (includes Wailers and Bloats). Some extractions close. |
| 17:00 to 21:00 | Lull 2 | Partial recede to +2.0 m. Second salt deposit wave. Boss can spawn (25% chance per raid). |
| 21:00 | Final warning | The sky goes black-green. Sparks: "This is the big one." Klaxon from the Halcyon audible across the map. |
| 22:00 | The Surge | Full storm. Water rises to max (+3.8 m in the lowest zones) over 2 minutes. Massive Hollow wave including Brutes. Most low extractions close. |
| 24:00 | High water | The flood is at its peak. Only high-ground extractions and boat extractions remain. Visibility very low. |
| 26:00 | Last boats | Final extraction calls. |
| 28:00 | Raid end | Anyone still on the island is MIA. Everything they carried is lost. |

### 3.4.1 Surge direction

At raid start the server picks one of 8 compass directions (N, NE, E, SE, S, SW, W, NW) for the Surge to arrive from, weighted by the seed. The storm front is a visible wall of cloud and rain that crosses the map from that direction at about 7 m/s, and the water rise follows it, so the side of the map the storm reaches first floods first. That means the same building might be dry until 16:00 in one raid and drowned at 8:00 in another. Part 15 has the full simulation.

### 3.4.2 Reading the storm

Players should be able to predict the Surge if they pay attention, and be surprised by it if they don't. Cues in order of subtlety: barometer item in inventory (shows a pressure graph), gulls leaving (flocks fly away from the storm direction 90 seconds before a wave), the sky's color shifting on the storm side, wind direction changing (visible on grass, flags, smoke and rain angle), distant thunder, Sparks's radio warning, the Halcyon's klaxon, and finally the storm wall itself, which is visible from 800 m away as a towering dark curtain.

## 3.5 RISK AND REWARD RULES

### 3.5.1 What you risk

Everything in your loadout is at risk: your weapons (with all their attachments), armor, helmet, rig, backpack, and everything in your pockets and bag. The exceptions:

The Secure Pouch: every player has a small secure container (2x2 at start, upgradable to 3x3 and 3x4 through the Halcyon's Locksmith station). Items in it are never lost. You can't put weapons or armor in it (size rule and a tag rule), so it's for keys, notes, salt, money and small valuables. It's an important feature for new players because it means they always come home with something.

The Radio, Compass and Knife: every player has a default radio (for Sparks's broadcasts and squad comms), a compass and a salvager's knife in fixed slots. They can't be lost, dropped, or looted. Cosmetic variants exist.

Cosmetics are never lost. Skins, charms and character cosmetics are account-level, not items in the stash. A skinned weapon that gets lost loses its skin application, but the skin stays unlocked on the account.

### 3.5.2 What you gain

Anything you extract with is yours. That includes items you found and items you looted from other players and AI. Looted player items keep their attachments, wear level and ammo state. They lose cosmetic skins (because the skin belongs to the dead player's account), revert to the default finish and show the killer's name and the previous owner's callsign in the item history (a small, fun detail: "Previously owned by Gull_4471. Killed at the Haldane Cannery.").

XP for your account level, reputation with traders, and contract progress are granted at extraction. If you die, you keep 50% of the XP earned in that raid (rounded down), and contract objectives that completed in the raid stay completed (except "extract with X" objectives, which obviously fail).

### 3.5.3 The Scavenger loadout (the floor)

So nobody ever gets stuck with an empty stash, every player can take a free Scavenger loadout every 15 minutes of real time (cooldown stored on the backend). It's a random low-tier kit: a salvage-made or very cheap weapon, two magazines, a bandage, a cheap backpack and no armor. If you extract with it, you keep it all plus what you found. If you die, you lose nothing that cost you. Scavenger runs are the safety net, and they're also a fun "nothing to lose" mode.

## 3.6 THE IN-RAID RULES

### 3.6.1 Squads and friendly fire

Squadmates are shown with a colored outline (default cyan, configurable for colorblind modes) at any distance where line of sight exists, and a name tag above their head within 60 m. Squadmates have map markers on the in-raid map, but other squads don't, ever.

Friendly fire is on. It's at 100% damage for bullets, explosives and fire. This is a deliberate choice: it makes squad fights messier and more tense, and it's genre-standard. Accidental team kills are a thing that will happen, and they're funny the first time. Mitigation: the first time per raid you hit a squadmate, a toast appears ("You hit Gull_4471"), and there's an optional setting to block fire when the crosshair is over a squadmate's outline at less than 5 m.

### 3.6.2 Downed and revived

When a player's health reaches zero in the thorax or head zone, or total HP reaches zero, they die. But if the damage that killed them was not to the head and they have at least one living squadmate in the raid, they enter the Downed state instead.

Downed: the player falls, can crawl slowly (0.6 m/s), can't use weapons or items, can ping, can talk. They bleed out over 60 seconds (shown as a ring timer). A squadmate can revive them by holding Interact for 6 seconds (4 seconds with a Medic's Kit equipped). Revived players come back at 30% HP spread across their zones, with a "Shaken" debuff (more sway and slower stamina regen for 60 seconds). Each player can only be downed twice per raid; the third time, they die outright. An enemy can finish a downed player by shooting them or using a knife (a "finish" interaction that takes 1.5 seconds and is interruptible).

Solo players have no downed state. They just die.

### 3.6.3 Death

On death, the player's character becomes a lootable body that persists for the rest of the raid (bodies never despawn in a raid). The camera transitions to a spectator view of the killer for 5 seconds (the "death cam"), then to a squad spectator view if squadmates are alive, or to the raid summary if not. Dead players can still use squad voice to talk to living squadmates. They can't ping.

### 3.6.4 Disconnection

If a player disconnects (client crash, network failure), their character stays in the world in a "linkdead" state: crouched in place, invulnerable for 5 seconds, then vulnerable but not moving. They have 180 seconds to reconnect to the same raid (the client remembers the raid lobby and session). If they reconnect, they resume control exactly where they were. If they don't, at 180 seconds their character becomes a body like any death, and their raid result is "Disconnected", which the backend treats like MIA.

That sounds harsh, so here's the important exception: if the disconnection was caused by the host (host quit, host crash), see 3.6.5.

### 3.6.5 Host migration and host loss

This is the hardest problem in the whole game, and it needs to be right because of Pillar 5. We have a listen-server host. If the host leaves or crashes, the raid has to deal with it. Unreal doesn't support true host migration out of the box. Here's what we do.

The host periodically (every 10 seconds) sends a compact raid state snapshot to the backend: `POST /v1/raids/{raidId}/checkpoint`. The snapshot holds every connected player's PUID, position, health, inventory (as item instance IDs), and the raid clock. It's small: under 20 KB per snapshot for 12 players.

If the host quits on purpose (presses Leave Raid), the host's game warns them first ("You're the host. Leaving will end the raid for everyone. Extract instead?"). If they confirm, the raid ends with every remaining player marked "Host Ended", and the backend restores every player's loadout from the latest checkpoint plus what they've picked up since the last checkpoint as recorded. In plain words: nobody loses their gear because the host rage-quit.

If the host crashes or loses connection, every client detects the loss within 5 seconds. Each client calls `POST /v1/raids/{raidId}/host-lost`. The backend waits up to 10 seconds for the reports, then resolves every player the same way as "Host Ended": they keep everything they had at the last checkpoint (including found loot). It's generous, and it means a host crash is annoying, not devastating.

In Tier 4, real host migration: when the host is lost, the backend picks the client with the best connection quality (they all report ping to each other via EOS P2P), and that client restarts the raid as a listen server from the last checkpoint, and everyone else reconnects. That's a big feature and it needs a full raid-state serializer, which is why it's Tier 4.

The host also can't extract and then keep the raid running. When the host extracts or dies, the host's machine is still the server. The host's client goes into the summary screen, but the server keeps running in the background until the raid ends. The host can't play another raid until that one is finished, though they can browse menus. This is clearly shown ("You're still hosting. 3 players remain in raid. 6:21 left.") and is the standard way listen-server extraction games handle it.

### 3.6.6 Voice chat

Two channels. Squad voice: always on for squadmates, wherever they are on the map, as if on the radio, with a radio filter (band-pass, light distortion, a squelch click at start and end). Proximity voice: everyone within 40 m hears you, with distance attenuation and occlusion, no radio filter. Push-to-talk by default for both, with separate keys, and an option for voice activation. Implemented with EOS Voice (the RTC interface), with the proximity channel driven by positional audio from Unreal (part 28).

### 3.6.7 Pings and markers

Players can ping a location (middle mouse or a configurable key), which places a marker visible to squadmates on the HUD and the map for 10 seconds. Context-sensitive: ping an item and it says the item's name; ping an enemy and it marks them in red for 3 seconds (and the marked position doesn't update, so it's just "I saw someone there"); ping a container and it says "Loot here". Double-tap ping places a "Danger" marker. A ping wheel (hold the key) gives: Going Here, Enemy, Loot, Danger, Need Ammo, Need Healing, Regroup, Extract.

## 3.7 EXTRACTION RULES

Extraction is the climax of the raid loop, and each extraction type creates a different kind of tension. Part 16 has the full extraction catalog per location with conditions. Here are the types.

### 3.7.1 Boat extractions

The main type. A Halcyon boat (an old fishing boat or a RIB, in fiction run by the Halcyon's crew) comes to a specific pier, slipway or beach at a specific time, waits for 60 to 90 seconds, then leaves. Players must be on board when it leaves. Boats are called by Sparks on the radio at set times in the raid ("Boat at the cannery slip in two minutes"). Boats make noise as they approach (engine audible from 300 m), which everyone hears. The boat's horn blasts at 30 seconds and 10 seconds before leaving. Being on board when the boat leaves extracts you. If you step off, you're not extracted.

### 3.7.2 Fixed extractions

Always-open locations, typically on high ground or at the map's edges (the moor road checkpoint, the lighthouse helipad by night). Players stand in an extraction zone (a visible area marked by a flare or a beacon) for 8 seconds uninterrupted (being shot interrupts, taking damage interrupts). Some fixed extractions are only open during certain phases.

### 3.7.3 Conditional extractions

Extractions with a cost or a requirement: pay 7,500 Scrip to a smuggler's dinghy, bring a specific key to open the sea wall gate, use a flare gun to call a ride, power up the lifeboat station winch (find a fuse in the power station), or carry no backpack through a narrow cave. These create interesting choices and give items a use.

### 3.7.4 Your own boat (Tier 2)

From Tier 2, a squad can bring its own boat (if the hideout's Boathouse station is built) and park it at a landing. If you get back to your boat, you can extract from any open water edge of the map by driving out past the buoys. But your boat can be stolen or sunk by other squads, which adds a new layer.

### 3.7.5 Extraction visibility

All players can see all extraction points on their map from the start of the raid. Their state (open, closed, opening at time X, requires Y) is shown when you hover. This is intentional: everyone knows where the exits are, which turns them into natural ambush points and drives conflict.

## 3.8 LOOT RULES

Part 12 has the item catalog and the loot tables. Here are the rules.

Loot spawns at raid start, seeded from the raid seed, so all clients see the same loot (the server is authoritative, but clients can predict container contents for searching animations).

Containers are searched, not opened instantly. Searching a container reveals items one by one over time (0.4 to 1.2 seconds per item depending on item size), with a sound. Searching can be interrupted. Some containers are locked and need a key or a lockpick (Tier 2).

Loose loot sits in the world as physics-enabled actors (static once settled) and can be picked up with a tap of Interact.

Loot respawns: new loot appears in the world when the water recedes after each Surge (salt deposits, washed-up crates, flotsam). This is the main way the Surge creates reward: risky, high-value loot appears where the water just was, while the next wave is coming.

Loot quality scales with danger: zones are rated 1 to 5 for loot tier (part 14), and the higher the tier, the more Hollows and the earlier it floods.

## 3.9 SCORING AND XP

Account XP is granted for (with base values, tuned in part 43):

Extracting: 400 XP, plus 10 XP per minute survived.
Killing a player: 300 XP.
Killing a Warden: 150 XP.
Killing a Hollow: 20 to 120 XP depending on type (bosses 1,000).
Looting a container for the first time: 5 XP.
Finding a new item type (first time ever): 50 XP.
Healing a squadmate: 10 XP per 50 HP healed.
Reviving a squadmate: 100 XP.
Completing a contract objective: varies.
Surviving a full Surge outdoors: 150 XP.

Account levels go from 1 to 60. Levels unlock raid types, hideout stations, trader tiers and cosmetic rewards (part 17).

## 3.10 EDGE CASES YOU MUST HANDLE

These are the weird cases. Each one gets a functional test in part 37.

A player extracts on a boat while carrying a downed squadmate: carried players aren't a mechanic. Downed players can't board a boat. They must be revived first. This creates the great moment of reviving someone while the horn blows.

A player is on a boat when it leaves, but is downed on the boat: they extract (anyone on the boat deck volume when it leaves extracts, downed or not). That's a reward for getting a downed friend onto the boat by reviving them on the pier and having them get on, then they're shot on deck.

Two squads on the same extraction boat: both extract. Boats don't care. That creates tense standoffs and occasional temporary truces. Shooting on the boat is allowed, and the boat crew doesn't intervene.

A player dies in deep water: their body sinks to the bottom (or floats, if the water's under 2 m deep), and it can be looted by diving. If it's under more than 4 m of water, it can't be reached without a diving item (Tier 2: the Rebreather). After the water recedes, the body is on the ground where it sank.

A player drops an item into deep water: same as a body. Items in water sink at a rate based on their weight and can be recovered by wading or diving.

A player is inside a building that fully floods: they can swim, hold their breath (stamina doubles as breath underwater, 30 seconds at full stamina), and find air pockets (the upper floors, any room with a ceiling above the water line). If they run out of breath, they take drowning damage (20 HP/s across the thorax) until they surface or die.

The water rises over an extraction point that's still "open": boat extractions at a flooded pier still work (the boat comes higher). Fixed extractions that flood close automatically with a radio call and a warning on the map 60 seconds before.

A player is in a locked room (the bank vault) when the timer closes it: the vault's timer is visible, and the vault can be opened from inside. Never trap players with no way out.

A player picks up an item and disconnects within the same server tick: the server-authoritative inventory and the item instance ID system mean the item is either in their inventory or on the ground, never both, never neither. The checkpoint system records the last known state.

A player tries to bring the same item into two raids at once (two clients with one account): the backend's "in transit" lock on the loadout prevents it. A second login of the same account kicks the first session.

The raid's last player extracts at 27:59: the raid ends immediately when no players remain on the island; the server shuts down the session and reports.

Everyone in the raid dies at 12:00: the raid ends immediately, the server reports, and the summary shows for everyone. No reason to run the server for 16 more minutes with nobody in it.

## 3.11 THE NUMBERS FOR PACING

Use these to tune the raid loop in playtests. They're targets, measured by telemetry (part 38).

Median time to first player encounter in a 12-player raid: 6 to 9 minutes.
Median time to first Hollow encounter: under 90 seconds.
Extraction rate (players who extract / players who entered), all players: 45% to 55%.
Extraction rate for players in their first 10 raids: 55% to 65% (helped by matchmaking new players together, part 18).
Median raid length for players who extract: 18 to 22 minutes.
Percentage of raids where at least one PvP kill happens: 85%+ in a full lobby.
Average Scrip value extracted by a successful player: 2 to 4 times the value of a mid-tier loadout.

If extraction rate drops under 35%, the game is too punishing. If it goes above 70%, the tension's gone.

---

End of part 03. Next: `04_PLAYER_CHARACTER_MOVEMENT_CAMERA.md`.
