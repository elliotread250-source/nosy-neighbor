# SALTMARROW: PART 17, PROGRESSION, TRADERS, CONTRACTS AND THE HALCYON

This is the meta loop. Four progression tracks run in parallel: account level (from XP), trader loyalty (from reputation and spending), contracts (quest lines), and the Halcyon hideout (upgrade stations built with Scrip and materials). Together they give every raid a purpose beyond "get loot", and they gate content so a new player isn't drowned in 260 attachments on day one.

All progression state lives on the backend (part 19). The client displays it. Contract objective tracking happens in the raid on the host's server and is reported with the raid result (part 20), and the backend decides what counts.

---

## 17.1 ACCOUNT LEVEL

Levels 1 to 60. XP sources in part 03. The XP curve: `XPToNext(level) = round(1000 × level^1.35 / 50) × 50`, which gives about 1,000 XP for level 2, 6,300 XP for level 20, 15,000 for level 40 and 25,000 for level 59. Total to level 60 is roughly 700,000 XP. A good raid is 1,500 to 3,000 XP, so level 60 is about 300 raids: a long tail for dedicated players without making early levels slow.

Level unlocks (the important ones; the rest are cosmetics):

| Level | Unlock |
|---|---|
| 1 | Standard and Shakedown raids, the Captain, Tomasz (loyalty 1) |
| 2 | Nils (loyalty 1) |
| 3 | The gunsmith's Build save slots (5) |
| 5 | Mother Agnes, Halcyon stations level 1 |
| 8 | Squad leader can choose insertion side preference (east/west) |
| 10 | Night raids, Practice mode presets |
| 12 | Gunsmith field modification in raid (Tier 2) |
| 15 | Boathouse station (Tier 2) |
| 20 | Trader loyalty 3 eligibility |
| 25 | Skirmish custom match settings (map district, round count, loadout rules) |
| 30 | Trader loyalty 4 eligibility |
| 40 | Prestige cosmetics |
| 60 | The "Halcyon Brass" finish, title "Old Salt" |

There's no ranked mode in v1.

## 17.2 TRADER LOYALTY

Each trader has 4 loyalty levels. Reaching a level needs: account level, reputation with that trader (a number from 0.00 to 1.00 earned from contracts and lost from some actions), and total Scrip spent with that trader.

| Level | Account level | Reputation | Spent | Unlocks |
|---|---|---|---|---|
| 1 | 1 (Agnes: 5, Nils: 2) | 0.00 | 0 | Basic stock |
| 2 | 10 | 0.20 | 400,000 | More stock, 3% discount, better buy rate |
| 3 | 20 | 0.40 | 1,200,000 | Rare stock, contracts tier 3 |
| 4 | 30 | 0.75 | 3,000,000 | Epic stock, finale contracts |

Reputation changes: completing a contract (+0.02 to +0.15), failing a contract (-0.01 to -0.05), Nils-specific: completing his "dirty" contracts lowers the Captain's reputation by a small amount (-0.02), and vice versa for some Captain contracts that go against Nils. It's a light faction tension, not a hard choice in v1.

## 17.3 CONTRACTS

Contracts are quests from traders. Each contract is a `USMContractDefinition` with: ID, trader, title, description (in the trader's voice), prerequisites (account level, loyalty level, other contracts completed), objectives (a list, each with a type, parameters and a count), rewards (XP, reputation, Scrip, items, cosmetic unlocks, trader stock unlocks), and flags (repeatable, requires single raid, fail conditions).

### 17.3.1 Objective types

| Type | Parameters | Example |
|---|---|---|
| Kill | target type (player, Hollow type, Warden type, boss), zone (optional), weapon class or specific weapon (optional), conditions (headshot, at distance > X, while suppressed, during a Surge, at night) | "Kill 10 Shamblers in the Cannery" |
| Collect and hand over | item ID or category, count, FiR required | "Hand over 5 Found in Raid Field Dressings" |
| Find and extract | item ID (contract item, spawns for you), extract required | "Find the insulin in St. Columba's cold room and extract with it" |
| Visit | location volume | "Locate the LANTERN sample crate in the cannery's Freezer 3" |
| Place | item ID, location (a placement point where you interact for 5 s) | "Plant a radio beacon on the Orla Brae's bridge" |
| Survive | conditions (extract after surviving a full Surge outdoors, extract from a specific extraction, extract with less than X weight, extract without firing a shot) | "Extract from Gannet Rock Helipad" |
| Use | item ID, count | "Use 3 flares to call extractions" |
| Build | gunsmith config conditions (a weapon with ergonomics > X and recoil < Y), checked when handing over a weapon | Tomasz's "Gunsmith" chain, like Tarkov's |
| Interact | specific world interaction | "Ring St. Brendan's bell during a Surge" |
| Stat | lifetime stat thresholds | "Extract 5 times" |

The raid server tracks objective progress live (so the HUD can show "4/10 Shamblers" when a contract is pinned) and reports progress events with the raid result. The backend applies them (only on extraction for "extract" objectives; immediately for others, even on death, per part 03).

### 17.3.2 Contract lines

Each trader has a main line (12 to 20 contracts, story-driven) and a set of side contracts and repeatables. Part 44 has the full text. Here's the shape.

The Captain, "Keeping Her Afloat" (16 contracts): the Halcyon's survival. Insulin from the hospital (Cold Storage), parts for the desalinator from the water works, the missing boat crew (find the wreck of the Bonnie Jean on the east shore and recover the logbook), medicine runs, rescuing a stranded salvager's stash, ammunition for the Halcyon's defense, a hunt for the Ferryman when he takes a boat crew, and the finale "Last Boat": recover the Halcyon's original ship's bell from the ferry terminal strongroom (the Ferryman's key). Rewards: the Captain's Strongbox (4×4 secure container), the Ferry Crew cosmetic set, and title "Captain's Favorite".

Tomasz, "The Gunsmith" (20 contracts): a sequence of build challenges ("Bring me a Mako with ergonomics over 60 and vertical recoil under 0.9°, with a suppressor"), weapon-specific kill challenges, recovering lost weapon shipments (the police armory cache, the LISTENER armory, the Orla Brae cargo), finding rare optics, and the finale "Masterwork": bring him a full set of Leviathan parts and he builds you a Leviathan with engraving. Rewards: the Engraver's Masterwork finish, weapon mastery accelerators, stock unlocks, and the gunsmith bench upgrades.

Mother Agnes, "The Vigil" (18 contracts, the main story): salt samples from specific locations, observing Hollows (survive near them without killing for a time; listen for the hum: an interaction near an Idle Hollow), the children's ward (who's leaving the flowers: it's her, and the contract asks you to replace them during a Surge), Dr. Strand's notes in the hotel, the LANTERN crate in the cannery's Freezer 3, the listening station's records, and the finale (Tier 2), "The Choir": enter the LANTERN control room and face the Lantern Choir. Rewards: the Salt-Crusted finish, the salt tinctures, the Lantern finish, and the lore entries that set up the future.

Nils, "Undertow" (14 contracts): dirty work. Steal a rival crew's stash (a dead drop location on the map: take the contents and extract), retrieve the briefcase from room 214's safe, plant trackers on Warden radios, kill other salvagers with specific conditions, recover the Founder's Cask from the distillery, smuggle salt (extract with a full Salt Hauler's pack), and the finale "Everything Has a Price": a contract that asks you to sell him intel on the Halcyon's council (a choice: complete it and the Captain's reputation drops by 0.15; refuse and Nils's line ends there with a smaller reward). Rewards: the Smuggler extraction access, the Nils Owes You Money title, fuel discounts, the military gear stock.

Side contracts: 40 more across the traders, short (1 to 3 objectives), for specific locations and items.

Repeatables: dailies and weeklies (3 daily from a pool of 60, 2 weekly from a pool of 30), each with small rewards (Scrip, XP and barter items; there's no separate cosmetic currency). Dailies refresh at 04:00 UTC.

### 17.3.3 Contract UI

In the Traders screen (part 23): each trader's contracts tab lists Available, Active, Completed. Accepting a contract makes it Active. Up to 10 active at once. Players can pin 3 to the HUD (the in-raid tracker shows pinned objectives with progress). The Journal (part 23) logs completed contract stories.

## 17.4 THE HALCYON STATIONS (HIDEOUT)

The Halcyon is the hideout. Instead of a separate hideout map, stations are places on the ship that the player has rights to, upgraded with Scrip and materials. Each station has levels with requirements and effects. Upgrades take real time to build (from 10 minutes to 8 hours), which gives players a reason to come back, without blocking play.

| Station | Location on the Halcyon | Levels | Effects |
|---|---|---|---|
| Gunsmith's Bench | Car deck workshop | 1 to 3 | L1: gunsmith screen (always available, the bench is your free starter); L2: weapon repair at the bench for 40% of trader price, and repair degrades max durability less; L3: Build slots +15, test fire range with moving targets, "Precision tuning" (parts' durability shown precisely) |
| Stores (stash) | Deck 5 lockers | 1 to 5 | Stash rows 40 → 60 → 80 → 100 → 120 |
| Locksmith | Car deck, Nils's corner | 1 to 3 | Secure pouch 2×2 → 3×3 → 3×4; L3 unlocks lockpick crafting |
| Sick Bay | Mother Agnes's sick bay | 1 to 3 | L1: medical crafting (bandages from fabric, splints from wood and tape); L2: post-raid health restoration buff (start the next raid with +10% max HP for 1 raid, limited to once per 3 hours); L3: salt tincture crafting |
| Galley | Deck 4 kitchen | 1 to 2 | Craft food and drink from barter; L2: hot drinks (Cold resistance consumables) |
| Workshop | Car deck | 1 to 3 | Crafting: ammo reloading (convert brass casings + powder + bullets into ammo), basic attachments from barter, repair kits |
| Boathouse | Stern ramp | 1 to 4 (Tier 2) | L1 skiff, L2 skiff upgrades, L3 RIB, L4 Gull Launch |
| Radio Room | Behind the bridge (Sparks) | 1 to 2 | L1: barometer forecast in the raid setup screen (see the Surge direction before the raid starts!); L2: scanner frequency for Warden chatter |
| Lookout | Forward deck | 1 to 2 | L1: the in-raid map shows the Surge front's position live; L2: extraction boat status shown in more detail |
| Cabin | Deck 5, your cabin | 1 to 3 | Cosmetic: decoration slots; L3: a trophy wall that displays boss trophies |
| Chapel | Deck 4 | 1 | A place to remember: the Wall of the Lost shows the callsigns of squadmates who died in raids with you (cosmetic, sentimental) |
| Bar (the Spindrift) | Deck 4 | 1 | Social: the lobby space (Tier 3: your squad can hang out in 3D in the bar between raids, see 17.6) |

### 17.4.1 Station requirements (example: Stores)

| Level | Requirements | Build time |
|---|---|---|
| 2 | 150,000 Scrip, 5 Bolts, 3 Nails, 2 Duct Tape | 30 min |
| 3 | 400,000 Scrip, 4 Steel Plate, 6 Bolts, 2 Hose Clamps, account level 15 | 2 h |
| 4 | 900,000 Scrip, 8 Steel Plate, 4 Electric Motor, Locksmith L2 | 4 h |
| 5 | 1,800,000 Scrip, 12 Steel Plate, 6 Salt-Etched Metal, 2 Solar Cell, account level 35 | 8 h |

Write requirement tables for every station in data (part 43 balances them). Rules: early levels are cheap and fast (first session), later levels need FiR barter from specific map areas (pushing players to new locations), and the final levels need salt-tier materials.

### 17.4.2 Crafting

Stations with crafting (Sick Bay, Galley, Workshop) have recipes: inputs (items from the stash), output (item), time (real time, 2 to 60 minutes), and station level requirement. Crafting happens in a queue per station (one at a time, more slots at higher levels). Crafted items are not Found in Raid, so they can't satisfy FiR contract objectives.

## 17.5 MASTERY

Weapon mastery: per weapon, kills with it unlock mastery levels (25, 100, 250, 500, 1,000), each giving cosmetics (part 10.8) and, at 100 kills, the weapon's "Familiarity" perk: +5% reload speed and -5% ADS time with that weapon only. That's the only stat bonus from progression in the game, and it's small. It rewards loyalty to a weapon without power creep.

Trader mastery isn't a thing. Map mastery: the Journal tracks POIs visited, and visiting every POI gives cosmetics and the "Cartographer" title.

## 17.6 THE HALCYON AS A SOCIAL SPACE (TIER 3)

In Tier 3, the Halcyon becomes walkable between raids: your squad can be together on the ship, as a small instanced listen-server session hosted by the squad leader, walking around the car deck, the bar and the decks, with the stations and traders as interactable places (the menus still exist, accessed by walking up to the trader or opening the menu with Esc). It's the "friends hanging out" layer. Darts and a jukebox in the Spindrift. A firing range on the car deck. It's optional: players can always use the menus instead. Build it only once the menu version is solid.

## 17.7 PROGRESSION PACING TARGETS

After 1 session (3 hours, ~7 raids): level 6 to 8, Stores L2, a few attachments, completed the first 4 Captain contracts and the first 3 Tomasz contracts, owns 2 or 3 weapons they like.

After 1 week of casual play (10 hours): level 15 to 20, Gunsmith Bench L2, Locksmith L2, loyalty 2 with two traders, a favorite build.

After 1 month (40 hours): level 30 to 40, most stations L3, loyalty 3 with all, first boss kills, the Vigil line well underway.

Track these with telemetry (part 38). If players are hitting the 1-week mark in 4 hours, slow it down. If they're stalled at level 10 after 15 hours, speed it up.

## 17.8 PROGRESSION ACCEPTANCE TESTS

Completing a contract's objectives in a raid and extracting completes the contract and grants rewards exactly once (no double grant on retry, network failure, or duplicate report).

A contract with a FiR requirement rejects bought items.

Station upgrades can't be started without all requirements, and requirements are consumed atomically.

Trader stock respects loyalty level and restock timers.

The XP curve gives the expected level for a given XP total (unit test).

---

End of part 17. Next: `18_MULTIPLAYER_ARCHITECTURE.md`.
