# SALTMARROW: PART 38, TELEMETRY, LIVE OPS AND ACHIEVEMENTS

You can't balance what you can't see. This part defines the telemetry events and dashboards that tell us whether the game is working, the live-ops levers we can pull without a client patch, the seasonal event framework, and the achievement list.

Privacy first (part 21.7): telemetry is gameplay data tied to the player ID, no personal information, documented in the privacy notice, and players can opt out of non-essential telemetry in Settings > Account (essential events, those needed for raid integrity and anti-cheat flags, stay on).

---

## 38.1 THE EVENT CATALOG

Events are sent batched from the client (`POST /v1/telemetry`, part 20.12) and from the host's server for raid events (included in checkpoints and reports where possible to save requests). Each event has a name, a timestamp, the player ID, the raid ID (if in a raid), the build, and properties.

Session and menus: `session_start` (build, hardware summary: CPU cores, GPU name, RAM, resolution, preset), `session_end` (duration), `login` (new or returning), `screen_view` (screen name, time on previous screen), `settings_changed` (setting, from, to; only for graphics preset, sensitivity, camera mode and accessibility toggles), `tutorial_step` (part 39), `squad_formed` (size), `invite_sent`, `invite_accepted`.

Economy: `trader_buy` (trader, item, price, count), `trader_sell` (trader, items, total), `station_upgrade_started` (station, level), `craft_started`, `build_assembled` (preset or custom, bought parts count, total price), `gunsmith_session` (weapon, duration, parts changed count, test fired).

Raid lifecycle: `raid_created` (type, host score, region), `raid_joined` (loadout value, weapon, armor class, backpack size, scav), `raid_start` (players, squads), `raid_end` (players, extract count, duration).

In raid (per player, from the server): `insertion` (point), `first_encounter` (type: Hollow, Warden, player; time), `kill` (victim type, weapon, ammo, distance, zone hit, victim armor class, victim's weapon, during Surge, killer position zone), `death` (killer type, weapon, distance, zone, time, position zone, carried value), `downed`, `revived`, `extract` (point, time, carried value, found value), `mia`, `disconnect`, `reconnect`, `contract_objective` (contract, objective), `loot_container` (type, zone; sampled at 10% to limit volume), `salt_harvest` (size, zone, time since recede), `boss_spawned`, `boss_killed` (time to kill, squad size), `surge_wave` (wave, players outdoors, players in water), `drowned`, `smoke_used`, `heal` (item, zone), `malfunction` (weapon, durability).

Combat aggregates (per player per raid, from the server, for balance and cheat detection): shots fired per weapon, hits per weapon by zone and by distance band, headshot ratio, average engagement distance, reaction time samples (time from target relevant to first shot), damage dealt and taken by source type, hits on non-relevant targets (should be 0), dropped shots (validation failures).

Performance: `perf_sample` every 60 s in raid (average and 1% low frame time, GPU time, game thread time, ping to host, packet loss, preset, resolution), `hitch` (over 100 ms: duration, cause stat if known, map position zone), `crash` (via the crash reporter), `host_perf` (server tick distribution, AI count, players).

## 38.2 STORAGE AND ROLLUPS

Raw events go to `telemetry_events` (part 19), partitioned by month. The worker rolls them up hourly into aggregate tables: `agg_raids_daily` (raids by type, extraction rate, average duration), `agg_weapon_daily` (per weapon: kills, deaths with, pick rate in loadouts, win rate in duels where both weapons are known, average engagement distance), `agg_economy_daily` (Scrip in circulation, median net worth by level band, trader volume by item), `agg_progression` (median level by hours played, contract completion funnels), `agg_perf_daily` (by GPU and preset: average fps, 1% lows, hitch rate), `agg_retention` (D1, D7, D30 by cohort).

Raw events are kept for 90 days, aggregates forever.

## 38.3 DASHBOARDS

A simple admin dashboard page served by the web service (behind the admin token, never public): charts from the aggregate tables. Use a small charting library (Chart.js or similar) in plain HTML. Sections: Health (players online, raids running, api error rate, worker queue depth, crash rate per build), Raids (extraction rate by type and by player experience band, raid duration, deaths by cause, Surge drownings), Weapons (pick rates, kills, TTK samples, duels), Economy (net worth distribution, Scrip sources and sinks, top traded items, inflation index), Progression (level distribution, contract funnels, station levels), Performance (fps by GPU and preset, hitch rate, ping distribution, host tick distribution), Retention (cohort curves).

You can also query the database through the Railway MCP (read-only, for analysis) and write me reports in `design/reports/<date>.md` when I ask how the game is doing.

## 38.4 THE KEY METRICS AND THEIR TARGETS

From part 03.11 and part 17.7, plus:

| Metric | Target | Lever if off |
|---|---|---|
| Extraction rate, all players | 45 to 55% | AI density, Surge timing, extraction windows |
| Extraction rate, first 10 raids | 55 to 65% | New-player matchmaking bucket, Shakedown nudges |
| Time to first encounter (players) | 6 to 9 min | Insertion spacing, loot hot zone placement |
| Raids per session | 3+ | Pacing, raid length, loading times |
| D1 retention (friends cohort) | 60%+ | Onboarding, first raid experience |
| Weapon pick rate spread | No weapon above 25% of loadouts | Weapon balance |
| Median net worth at 20 raids | 0.8 to 2.0 M Scrip | Economy config |
| Crash rate | Under 1 per 50 hours | Fixes |
| Average fps on reference laptop Medium | 60+ | Optimization |

## 38.5 LIVE OPS LEVERS (NO CLIENT PATCH)

The backend's `economy.json` (part 12) and a `liveops.json` config (reloaded with the admin endpoint) control:

Economy: trader markups and buy rates, stock counts and restock times, station costs, contract rewards, scav cooldown, starting Scrip.

Raids: raid-type availability (enable Night raids on weekends only, for example), the boss spawn chance, the salt bloom chance, the loot rarity multipliers matrix, Hollow density multipliers per raid type, the XP multiplier (double XP weekends).

News: the `/status` news feed.

Events: event definitions (38.6).

Clients receive these values in `/status` and `/traders` responses and in the raid creation response (the host applies raid-side values: `raidConfig` in the `POST /v1/raids` response carries the multipliers so every host uses the same live config).

## 38.6 SEASONAL EVENTS FRAMEWORK (TIER 3)

An event is a data bundle: a time window, a name and description, raid modifiers (weather overrides, special spawns, loot table additions), event contracts (a small contract line), event cosmetics (rewards), and a Halcyon menu decoration set (data layer in the menu level, toggled by the event flag).

Planned events:

The Long Night (winter): permanent night raids for a week, frost on everything (the Tier 3 frost layer), the Lighthouse Wakes event guaranteed, a Mother Agnes contract line about the solstice, the Whiteout finish and a knitted hat cosmetic.

Herring Run (spring): the cannery reopens briefly (more loot there), fish everywhere, a fishing mini-contract ("bring Captain Kerrigan 20 Fresh Herring": a new item from flooded fish crates), a gull-themed cosmetic set.

Regatta (summer): boat races between squads (a Skirmish variant on the water, Tier 4 if boats are solid), bunting on the Halcyon, sailing cosmetics.

The Drowned Fair (autumn, Halloween-adjacent): more Hollows, the Ferryman guaranteed, neeps instead of pumpkins (turnip lanterns, the old Scottish tradition, which fits the setting far better), and a Hollow mask cosmetic.

## 38.7 ACHIEVEMENTS

80 achievements in v1. Each has a title, a description, a hidden flag, a reward (a cosmetic), and a stat trigger. A selection, which is the full list you should implement (the remainder of the 80 come from weapon mastery and contract completion milestones, generated from data):

| Title | Description | Reward |
|---|---|---|
| Fresh Off the Boat | Complete the Shakedown | Banner: The Ramp |
| Home and Dry | Extract for the first time | Title: Salvager |
| Ten Out | Extract 10 times | Emblem: Anchor |
| Old Hand | Extract 100 times | Title: Old Hand |
| Tidewalker | Survive a full Surge outdoors (from arrival to lull without entering a building) | Title: Tidewalker |
| Stormchaser | Extract during the final Surge's peak | Finish: Storm |
| Last Boat | Extract on the last boat of a raid with under 30 seconds left | Emote: Wave from the Boat |
| Full Bag | Extract with a backpack over 90% full | Charm: Overstuffed Bag |
| Greed Is Good | Extract with over 500,000 Scrip of loot | Title: Greedy |
| Heart of the Tide | Extract with the Heart of the Tide | Charm: Marrow Salt Crystal (large) |
| Salt of the Earth | Harvest 100 salt deposits | Face paint: Salt Streaks |
| First Blood | Kill a salvager | Emblem: Crossed Knives |
| Hunter | Kill 100 salvagers | Title: Hunter |
| Hollow Hunter | Kill 500 Hollows | Charm: Hollow's Tooth, Title: Hollow Hunter |
| Wail No More | Kill a Wailer before it screams | Emblem: Closed Mouth |
| Pop | Kill a Bloat from over 30 m | Charm: Popped Balloon |
| Brute Force | Kill a Brute with melee | Title: Brute Force |
| Drown the Drowner | Kill a Drowner while swimming (Whaler only) | Charm: Harpoon Tip |
| Warden Bane | Kill 50 Wardens | Title: Warden Bane, Clothing: Warden Smock |
| Fare Paid | Kill the Ferryman | Charm: Ferryman's Coin |
| Toll Collector | Kill the Ferryman without him taking a Fare | Finish: Ferryman |
| Encore | Kill the Lantern Choir | Finish: Lantern |
| Long Shot | Kill a salvager from over 400 m | Title: Long Shot |
| Across the Water | Kill a target on another island from the main island | Banner: Across the Water |
| Crack Shot | 10 headshot kills in one raid | Reticle: Anchor |
| Silent Night | Kill 5 enemies in one raid with a suppressed weapon and subsonic ammo without being heard (no enemy alerted) | Finish: Night Ops |
| Conductor | Get struck by lightning | Title: Conductor |
| Rubber Duck | Drown 10 times | Charm: Rubber Duck |
| Barefoot | Extract wearing no boots | Clothing: Barefoot |
| Naked and Afraid | Extract with nothing but your knife, radio and compass | Title: Unburdened |
| Gunsmith | Build a weapon with 20 or more parts | Title: Gunsmith |
| Featherweight | Build a rifle under 2.6 kg with an optic and a suppressor | Charm: Feather |
| Laser Beam | Build a Mako with vertical recoil under 0.6° | Finish: Precision |
| Junk Rifle | Kill a salvager with the Jury | Title: Guilty |
| Bang | Kill a salvager with the Pipe | Charm: Bang Flag |
| It Decides | Win a fight while your weapon malfunctioned during it | Emote: Smack the Gun |
| Medic | Revive squadmates 25 times | Clothing: Lifeboat Crew Jacket (alt color) |
| Never Leave a Mate | Revive a squadmate under fire during a Surge | Title: Lifeboat |
| Bell Ringer | Ring St. Brendan's bell during a Surge | Charm: Bell |
| Lights Out | Shoot out 50 lights | Emblem: Broken Bulb |
| Locksmith | Open 50 locked doors or containers | Title: Locksmith |
| Vault Raider | Loot the NFB vault | Banner: The Vault |
| Laird's Portrait | Extract with the Laird's portrait | Emote: Present the Painting |
| Founder's Cask | Extract with the Founder's Cask | Charm: Whisky Cork (gold) |
| Cartographer | Visit every POI | Title: Cartographer |
| Island Hopper | Visit all three islets in one raid | Charm: Sea Glass (rare color) |
| Boatman | Extract on your own boat 10 times | Title: Boatman (Tier 2) |
| Pirate | Extract on a boat that belonged to another squad | Title: Pirate (Tier 2) |
| Lamb Chop | You know what you did | Charm: Little Sheep (hidden) |
| Drowned Twice | Die by drowning twice in one raid | Title: Drowned Twice (hidden) |
| Captain's Favorite | Complete the Captain's main line | Title, set |
| Tomasz Approves | Complete Tomasz's main line | Title, finish |
| Mother's Child | Complete the Vigil (Tier 2) | Title, finish |
| Nils Owes You Money | Complete Undertow | Title |
| Halcyon Proud | All stations at max level | Finish: Halcyon Brass (alt) |
| Old Salt | Reach level 60 | Title: Old Salt |

Achievements are tracked on the backend through stats (part 19's `player_stats`), checked by the worker after each raid report and each relevant menu action. EOS has its own achievements system (`bMirrorAchievementsToEOS`) which we don't use in v1 (it needs Epic accounts to be visible); Steam achievements later if the game goes to Steam.

## 38.8 TELEMETRY ACCEPTANCE TESTS

Every event in the catalog is emitted at least once during the scripted raid test and lands in the database with the right properties.

The rollup job produces aggregates that match raw counts for a test day.

Opting out stops non-essential events immediately.

The dashboard loads in under 2 s with a month of data.

---

End of part 38. Next: `39_ONBOARDING_TUTORIAL_PRACTICE.md`.
