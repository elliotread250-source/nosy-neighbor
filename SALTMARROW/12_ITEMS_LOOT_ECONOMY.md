# SALTMARROW: PART 12, ITEMS, LOOT TABLES AND THE ECONOMY

Loot is the reason anyone goes onto the islands. This part lists the item categories, gives the full catalog of non-weapon items, defines how loot is generated, and sets out how the economy keeps from inflating into nonsense after a month. The economy is server-side on the backend, so its rules live in data the backend reads (the exported catalog plus a `economy.json` config), and the game client only displays what the backend says.

---

## 12.1 ITEM CATEGORIES

Every item has exactly one category. Categories drive stash tabs, container rules, trader buy lists and loot tables.

Weapons, Attachments, Magazines, Ammunition, Armor, Helmets, Face and Ears, Rigs, Backpacks, Containers (cases), Medical, Food and Drink, Stimulants, Throwables, Tools (repair kits, lockpicks, binoculars, barometer, scanner, rebreather), Keys, Notes, Valuables (jewelry, cash, watches, art), Salt (Marrow Salt in all its forms), Barter (junk with crafting/upgrade value: electronics, fuel, hardware, fabrics, chemicals), Contract Items (quest items, flagged Hot or not), Currency (Scrip).

## 12.2 RARITY AND VALUE

Six rarity tiers with UI colors (part 22 has the exact hex values): Junk (grey), Common (off-white), Uncommon (green-teal), Rare (blue), Epic (purple), Legendary (amber). Rarity is about how often it spawns, not about power. A Legendary item is rare and valuable, but it can still be a bad choice (a Leviathan is a poor weapon for a cannery fight).

Each item has a `BaseValue` in Scrip. Traders buy at a fraction of it (12.7) and sell at a markup. The "value per cell" (BaseValue / cell count) is the number experienced players care about when packing a bag, and the UI shows it in the tooltip once the player has the Appraiser upgrade.

## 12.3 MEDICAL ITEMS

| ID | Name | Size | Weight | Uses | Use time | Effect | Value | Rarity |
|---|---|---|---|---|---|---|---|---|
| MED_Bandage ★ | Field Dressing | 1×1 | 0.05 | 1 | 3.0 s | Stops light bleed | 1,800 | C |
| MED_ArmyBandage | Army Bandage | 1×1 | 0.06 | 2 | 2.5 s | Stops light bleed, +5 HP to zone | 3,200 | C |
| MED_Tourniquet ★ | Tourniquet | 1×1 | 0.08 | 1 | 4.0 s | Stops heavy bleed on a limb; limb HP max -10% until surgery or extraction | 4,500 | U |
| MED_Hemostatic | Hemostatic Gauze | 1×1 | 0.06 | 1 | 5.0 s | Stops heavy bleed on any zone | 9,000 | U |
| MED_Splint ★ | SAM-type Splint | 1×1 | 0.12 | 1 | 6.0 s | Fixes a fracture | 4,000 | C |
| MED_SplintAlu | Aluminum Splint | 1×1 | 0.10 | 4 | 5.0 s | Fixes a fracture | 14,000 | R |
| MED_IFAK ★ | Individual First Aid Kit | 1×1 | 0.30 | 300 HP pool | 3.0 s per activation | Heals 60 HP/s to zones, also stops light bleed (costs 30 HP from pool) | 12,000 | U |
| MED_CarKit | Car First Aid Kit | 2×1 | 0.40 | 220 HP pool | 4.0 s | Heals 40 HP/s, stops light bleed | 7,500 | C |
| MED_Lifeboat | Lifeboat Trauma Kit | 2×2 | 1.20 | 600 HP pool | 4.5 s | Heals 70 HP/s, stops light and heavy bleed | 38,000 | R |
| MED_Surgical | Surgical Kit | 2×1 | 0.70 | 3 | 15.0 s | Restores a destroyed zone (part 05) | 46,000 | R |
| MED_FieldSurgical | Field Surgery Pouch | 1×1 | 0.40 | 1 | 18.0 s | Restores a destroyed zone | 22,000 | U |
| MED_Painkillers ★ | Painkillers (blister pack) | 1×1 | 0.02 | 4 | 2.0 s | Suppresses pain and fracture penalties 180 s | 2,400 | C |
| MED_Morphine | Morphine Auto-Injector | 1×1 | 0.03 | 1 | 1.0 s | Suppresses pain 300 s, -10% stamina regen | 8,000 | U |
| MED_Antibiotics | Antibiotics | 1×1 | 0.02 | 1 | 2.0 s | Contract item and barter; cures nothing in raid | 11,000 | U |
| MED_Insulin | Insulin Vials (box) | 1×1 | 0.05 | 1 | n/a | Contract item (Captain) | 6,000 | U |
| MED_SaltSalve | Mother's Salt Salve | 1×1 | 0.10 | 3 | 3.0 s | Cures Salt Sickness, +20 HP to a zone | 24,000 | R |
| MED_Warmer | Chemical Hand Warmers | 1×1 | 0.04 | 1 | 1.0 s | Cold -40 over 30 s | 1,500 | C |
| MED_Blanket | Emergency Foil Blanket | 1×1 | 0.06 | 1 | 4.0 s | Cold -80 over 20 s, can't move while using | 2,200 | C |

## 12.4 STIMULANTS

Rare, powerful, and with costs. Stimulants are where Mother Agnes's salt research shows up mechanically.

| ID | Name | Effect (duration) | Aftereffect | Value | Rarity |
|---|---|---|---|---|---|
| STM_Adrenaline | Adrenaline Shot | +15% speed, -30% sway, pain suppressed (45 s) | Exhausted, stamina regen -40% (60 s) | 18,000 | U |
| STM_Focus | Steady (beta blocker) | -50% sway, hold breath ×2 duration (120 s) | -10% speed (60 s) | 21,000 | U |
| STM_Endurance | Second Wind | Stamina regen ×2, sprint drain -40% (180 s) | Dehydration -30 | 26,000 | R |
| STM_Regen | Clotting Agent | Prevents all bleeding, +2 HP/s regen to all zones (90 s) | Heavy hunger: hydration -40 | 34,000 | R |
| STM_SaltTide | Tide Draught (salt tincture) | Hollows ignore you unless you attack or touch them (60 s); see in the dark slightly | Salt Sickness (90 s) | 48,000 | E |
| STM_SaltBreath | Deep Breath (salt tincture) | Underwater breath ×4 (120 s) | Cold +40 | 32,000 | R |
| STM_SaltClarity | Clarity (salt tincture) | Hollows and players within 30 m outlined for 3 s every 10 s, 60 s | Concussion-like blur (20 s) | 64,000 | E |
| STM_Combat | VMW "Grom" Combat Stim | +20% damage resistance (blunt and penetrating, after armor), 60 s | Tremor sway ×1.5 and -30 HP spread across zones when it ends | 58,000 | E |

## 12.5 FOOD AND DRINK

Hydration only (part 05). Food items restore a little hydration (tinned fruit, soup) and grant a short HP regen; drinks restore hydration. Each has flavor text and a value; some are valuable barter (whisky).

Water Bottle (1×2, +60 hydration, 3 s), Canteen (1×2, 3 uses of +40), Tide Cola (1×1, +25, +5 stamina regen briefly), Kittiwake Lager (1×1, +15 hydration, Cold -20, and +5% sway for 60 s; it's a joke item), Saltmarrow 12 Year Single Malt (1×2, a valuable, 42,000; drinking it is possible and very wasteful: Cold -60, sway +20% for 120 s), Haldane's Kippers (1×1, +10 hydration, +3 HP/s for 10 s), Lowrie's Tinned Peaches (1×1, +25 hydration, +2 HP/s for 15 s), Instant Soup (1×1, +30, Cold -30), Ship's Biscuit (1×1, +0 hydration, +1 HP/s 30 s), Thermos of Tea (1×2, 3 uses: +30 and Cold -30 each; the Captain's starter item for new players).

## 12.6 VALUABLES, BARTER AND SALT

### 12.6.1 Valuables

Valuables exist to be sold. They're the main income source for players who aren't doing contracts. Each has a distinct icon and inspect model, and they're the satisfying "ka-ching" items.

| Name | Size | Value | Rarity | Typical location |
|---|---|---|---|---|
| Wedding Ring | 1×1 | 6,500 | C | Bodies, bedside tables |
| Gold Chain | 1×1 | 14,000 | U | Bedrooms, safes |
| Pocket Watch | 1×1 | 18,000 | U | Old houses, the hotel |
| Wad of Mainland Notes (pre-Surge money) | 1×1 | 9,000 | C | Registers, safes, the bank |
| Old Coin Collection | 1×1 | 26,000 | R | The museum, the bank vault |
| Silver Communion Cup | 1×2 | 32,000 | R | St. Brendan's |
| Ship in a Bottle | 1×2 | 21,000 | U | Pubs, houses |
| Brass Ship's Bell | 2×2 | 38,000 | R | Lifeboat station, the Orla Brae |
| Ship's Chronometer | 2×1 | 54,000 | E | The Orla Brae bridge |
| Painting (small seascape) | 2×2 | 28,000 | U | The hotel, houses |
| Painting (the Laird's portrait) | 3×3 | 110,000 | E | The Haldane Arms ballroom, once per raid |
| Saltmarrow 12 Year Single Malt | 1×2 | 42,000 | R | Pubs, the hotel bar, the distillery shop |
| Saltmarrow 25 Year (the Founder's Cask) | 1×2 | 145,000 | L | The distillery manager's office safe |
| Military Encrypted Tablet | 2×1 | 68,000 | E | LISTENER (Wardens) |
| LANTERN Hard Drive | 1×1 | 85,000 | E | LISTENER, contract item for Mother Agnes |
| Lighthouse Lens Prism | 2×2 | 72,000 | E | Gannet Rock (once per raid) |
| Antique Sextant | 2×1 | 48,000 | R | Old houses, the museum |
| Fishing Trophy | 2×2 | 12,000 | C | Pubs, houses |
| Gold Tooth | 1×1 | 3,500 | C | Hollows (rare drop) |

### 12.6.2 Barter and upgrade materials

Barter items have low sell value but are needed for Halcyon upgrades (part 17) and some trader barters ("give me 2 car batteries and a radio, and I'll give you this scope"). They're the classic genre junk: Car Battery (2×2), Fuel Can (2×3, flammable: hit by a bullet, 25% chance to ignite), Copper Wire (1×1), Circuit Board (1×1), Radio Valve (1×1), Electric Motor (2×2), Spark Plugs (1×1), Duct Tape (1×1), Bolts (1×1), Nails (1×1), Hose Clamps (1×1), Pressure Gauge (1×1), Rope Coil (2×1), Fishing Net (2×2), Tarpaulin (2×1), Sewing Kit (1×1), Wool (1×1), Diesel Filter (1×1), Light Bulbs (1×1), Pipe Section (1×3), Steel Plate (2×2), Gun Oil (1×1), Weapon Parts (1×1, generic), Optics Glass (1×1), Antenna (1×3), Solar Cell (2×2), Water Filter (1×1), Medical Tubing (1×1), Antiseptic (1×1), Salt-Etched Metal (1×1, from Surge-soaked areas, needed for salt-tier upgrades).

### 12.6.3 Marrow Salt

Salt is the namesake and the jackpot. It comes in forms of increasing size and value, and it has rules no other item has.

| ID | Name | Size | Weight | Value | Rarity | Notes |
|---|---|---|---|---|---|---|
| SALT_Grains | Marrow Salt Grains (pouch) | 1×1 | 0.1 | 4,000 | C | Stacks to 10 |
| SALT_Shard | Marrow Salt Shard | 1×1 | 0.3 | 12,000 | U | |
| SALT_Cluster | Marrow Salt Cluster | 1×2 | 0.9 | 34,000 | R | Glows faintly |
| SALT_Geode | Marrow Salt Geode | 2×2 | 3.2 | 95,000 | E | Glows; warm; Hot flag (can't go in secure pouch) |
| SALT_Heart | Heart of the Tide | 2×3 | 7.5 | 320,000 | L | Spawns only at the deepest flood point after the final Surge, once per raid at most (20% chance). Glows strongly: it lights its surroundings, so other players can see the glow through windows and gaps within 30 m (never through solid walls). Hot. Attracts Hollows within 60 m. |

Salt rules: carrying Marrow Salt makes Hollows notice you from further away (+10% detection range per Cluster equivalent, capped at +60%). Larger pieces emit a soft light (a point light on the character, visible to others, part 26) and a faint hum (audible within 6 m). This is Pillar 4 in item form: the most valuable thing in the game makes you more visible and more hunted. Salt harvesting: Salt Deposits appear on surfaces after the water recedes (part 15), and harvesting takes 3 to 12 seconds with a loud scraping sound, using the salvager's knife (or faster with a Salt Pick tool).

Salt doesn't degrade in the stash. Never punish players for not playing. Salt is stable once extracted.

## 12.7 TRADER PRICES AND THE ECONOMY

### 12.7.1 Buy and sell prices

Each trader buys some categories and sells others. Trader sell price (what the player pays) = BaseValue × trader markup × loyalty discount. Trader buy price (what the player gets) = BaseValue × trader buy rate × condition factor × loyalty bonus.

| Trader | Sells | Buys | Markup | Buy rate |
|---|---|---|---|---|
| The Captain | Medical, food, basic armor, basic weapons, ammo (common), backpacks, rigs | Medical, food, valuables, barter | 1.15 | 0.55 |
| Tomasz | Weapons, attachments, ammo (all), magazines, repair | Weapons, attachments, magazines, ammo, gun-related barter | 1.20 | 0.60 |
| Mother Agnes | Medical, stimulants, salt tinctures | Salt (best rate), medical, LANTERN items | 1.25 | Salt 0.80, else 0.50 |
| Nils | Everything rare, explosives, military gear, boat fuel and upgrades, keys | Everything | 1.35 | 0.45 (but buys anything) |

Notes can't be sold to anyone. Reading a note logs it in the Journal; the item itself can be discarded or kept.

Condition factor: items with durability sell for BaseValue × (0.3 + 0.7 × durability / max). Weapons sell for the sum of their parts' values (each part valued separately with its own durability), which rewards selling a gun intact.

Loyalty: each trader has 4 loyalty levels (part 17). Each level gives a 3% discount on purchases and a 2% better buy rate, and unlocks more of their stock.

### 12.7.2 Trader stock and restocks

Traders have limited stock of most items, restocked on a real-time timer (every 3 hours) per player (stock is per player, not global, so a friend buying all the AP rounds doesn't stop you buying them). Each stock entry: item, quantity per restock, loyalty level required. Common items (bandages, basic ammo) have high or unlimited stock. Rare items have 1 to 3 per restock. This throttles how fast rich players can buy their way to the best gear.

### 12.7.3 Inflation control

Extraction shooter economies inflate because loot enters the economy every raid and nothing leaves. Our sinks:

Gear loss on death (the big one).
Repairs: weapon and armor repairs cost Scrip and lower max durability.
Halcyon upgrades: big Scrip and barter costs (part 17).
Consumables: everything used is gone.
Cosmetics from Dora's tailor stall.
Boat fuel and boat upgrades (Tier 2).
Trader markups vs buy rates (a 50% spread on average).
Extraction fees for conditional extractions.

And the sources:

Selling loot to traders.
Contract rewards.
Scrip found in raids.

The backend tracks the total Scrip in the economy and the per-player net worth (part 38 telemetry). If median net worth after 20 raids exceeds 2 million Scrip, prices are too generous; adjust buy rates down in `economy.json` (a live config the backend reloads without a deploy).

There is no player-to-player market in v1. A flea market (like Tarkov's) is the single biggest source of economy problems in the genre, and with a small player base it'd be empty anyway. Players can give items to squadmates by dropping them in the raid. Tier 4 could add a squad stash transfer.

## 12.8 LOOT GENERATION

### 12.8.1 Loot tables

Loot tables are Data Assets (`USMLootTable`) and also exported to the backend (for the loot ledger, 12.9). A loot table has:

A number of rolls (a range: e.g. 2 to 5 items for a desk).
A list of entries, each either an item ID with a weight and a stack range, or a reference to another loot table (nested tables, e.g. "Medical_Common") with a weight.
Conditions per entry: raid type (Standard, Night, Shakedown), zone loot tier (1 to 5), Surge phase (some entries only appear in post-Surge flotsam), required contract state (contract items only spawn for players who have the contract active, see 12.8.4).
A "nothing" weight (chance a roll yields nothing), so containers can be empty.

Tables are composed: `Container_Desk_Office` might be 3 rolls from [Barter_Office 50, Valuables_Small 10, Keys_Office 5, Notes_Office 8, Medical_Basic 7, Ammo_Pistol 5, Nothing 15].

### 12.8.2 Zone loot tier

The map is divided into loot zones (part 14), each with a tier from 1 to 5. Every container's table entries are weighted by zone tier: rarer items get more weight in higher tiers. The formula: each item's weight is multiplied by `RarityTierMultiplier[rarity][zoneTier]`, a 6×5 matrix in `economy.json`:

| Rarity \ Tier | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Junk | 1.4 | 1.2 | 1.0 | 0.8 | 0.6 |
| Common | 1.2 | 1.1 | 1.0 | 0.9 | 0.8 |
| Uncommon | 0.7 | 0.9 | 1.0 | 1.1 | 1.2 |
| Rare | 0.3 | 0.6 | 1.0 | 1.4 | 1.8 |
| Epic | 0.1 | 0.3 | 0.6 | 1.2 | 2.0 |
| Legendary | 0.0 | 0.05 | 0.2 | 0.6 | 1.2 |

Night raids add +25% to rare-and-above weights everywhere.

### 12.8.3 Seeded spawning

At raid start, the server generates all container contents and all loose loot positions from the raid seed. Loose loot uses spawn points (placed in levels as `ASMLootSpawnPoint` actors, each with a loot table and a spawn chance) so items appear in plausible places (on tables, shelves, floors, in car seats), never floating. The spawn system places the item at the spawn point's transform with a small random rotation, and settles it with a physics drop of 2 cm.

Generate all container contents at raid start on the server, so the loot ledger (12.9) is complete. It's only a few thousand items, and generation takes under 50 ms.

### 12.8.4 Contract items

Contract items (like the Captain's insulin, or a specific key) spawn only if at least one player in the raid has the relevant contract active, and only that player (and their squad) can see and pick them up. The item spawns at its fixed contract location. If nobody in the raid has the contract, it doesn't spawn. This keeps contract items from cluttering the map and from being sniped by random players.

### 12.8.5 Dynamic loot (post-Surge)

After each Surge wave recedes (part 15), new loot spawns in the areas the water covered: Salt Deposits (on walls, floors and objects at the high-water line, using a set of placement points tagged with their height), Flotsam Crates (washed up on beaches, piers and streets; each contains 2 to 4 items from the Flotsam table, which skews toward barter and occasional rare items "from the deep": things from the Orla Brae's hold, sealed military cases), and Drowned Bodies (old salvager corpses that wash up, lootable, with older gear). The amount spawned scales with how much area flooded. This is the main reward loop of the Surge.

## 12.9 THE LOOT LEDGER (ANTI-DUPLICATION)

Every item that can leave a raid must have been on the map or brought in. The backend enforces that with a ledger.

At raid start, the host's server sends the backend the generated loot list as a compact manifest (`POST /v1/raids/{raidId}/loot-manifest`: every spawned item instance's definition ID, stack count and instance ID, which the server generates as UUIDs). It also includes the entry manifests (what each player brought, already known to the backend from the join call). Dynamic loot spawns during the raid are sent as manifest additions in each checkpoint.

At raid end, each player's report lists the items they extracted with their instance IDs. The backend checks every instance ID is in the ledger (in an entry manifest or the loot manifest), and that no instance ID is claimed by two players. Items not in the ledger are rejected (and the raid is flagged for review). Stack counts can't exceed what was spawned (ammo stacks can be split between players, so the check is on totals per instance lineage: splitting a stack creates child instance IDs whose parent is recorded).

This doesn't stop a malicious host from generating a loot manifest full of Legendary items, but the backend can check the manifest against the loot tables' plausibility (the expected value of a raid's total loot is known; a manifest with a value more than 3 standard deviations above the mean for the raid type is flagged). Part 21 covers this.

## 12.10 SCRIP

Scrip is physical in the raid (paper notes, 1×1 stacks up to 50,000) and lives in the stash between raids as a number shown at the top of every Halcyon screen. Out of raid, Scrip is a balance, not items, to keep the stash clean. In the raid, you can find Scrip in registers, safes, bodies and drawers, and you can bring Scrip in (for conditional extractions and paying a smuggler), which converts part of your balance to physical notes in your inventory at raid start (a loadout slot: "Bring Scrip", in thousands).

---

End of part 12. Next: `13_AI_HOLLOWS_WARDENS_BOSSES.md`.
