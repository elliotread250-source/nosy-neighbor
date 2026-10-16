# SALTMARROW: PART 47, HARBOURSIDE ROOM BY ROOM

Harbourside is the Tier 1 district and the first thing friends will play, so it gets a full room-by-room specification: dimensions, floor heights, what's in each room, containers and loot tables, story props, AI placement, cover, sightlines and how each space floods. Use this as the level designer's brief. Part 14.4 has the district overview; this part zooms in.

Conventions: coordinates in meters relative to each building's own origin (its southwest ground-floor corner at floor level), +X north, +Y east, +Z up. Floor-to-floor heights are given per building. Elevation is the building's ground floor above the datum. Container counts give the loot table in brackets (part 12 tables, named `LT_<Room>`). "Memory point" means a Hollow idle point (part 13.3.2). Flood depth figures are water above the ground floor at each Surge peak for the most exposed direction (S, SE); other directions scale per the zone's exposure table.

---

## 47.1 THE HALDANE CANNERY

Building origin: world (-300, +110, 2.5). Footprint 45 m (X) by 80 m (Y). Three floors: ground (Z 0, height 6.0 m: industrial), first (Z 6.0, height 4.0 m), second (Z 10.0, height 3.6 m). Roof at Z 13.6, with the chimney at the northeast corner rising to Z 30. Cold store: a separate block east of the main building, 25 m by 30 m, ground floor at Z 0 (same elevation) and a basement at Z -4.0. Connected by a covered bridge at first floor level (Z 6.0) and a tunnel in the basement.

Flood depths (ground floor): Surge 1: 0 (the basement floods fully), Surge 2: 0.3 m, Surge 3: 1.3 m. The basement is wet at raid start (0.4 m) and drowned (over head height) from Surge 1 onward.

### 47.1.1 Ground floor

Receiving Bay (south side, Y 0 to 20, X 0 to 45): a tall open bay with four roller doors onto the jetty (two open, one half open, one shut), a weighing station, a stack of fish boxes 3 high in rows (cover, 1.2 to 1.8 m), two forklifts (one on its side), tipping hoppers (big steel funnels on legs) feeding a conveyor that runs north into the processing hall. Containers: 6 fish crates [LT_FishCrate], 2 toolboxes [LT_Toolbox], the weighbridge office (a small glass booth, 3 × 3 m) with a desk [LT_Desk_Office] and a filing cabinet [LT_Filing]. Story: the conveyor still has boxes of herring on it, salted over. A union noticeboard. Memory point: a Shambler in cannery overalls at the weighing station, staring at the scale.

Processing Hall (Y 20 to 60, X 0 to 45): the heart of the building. Two long lines (gutting tables, conveyor belts on 0.9 m frames, can sealers, a cooking retort room at the east end: two huge pressure vessels behind a glass wall). Steel columns every 6 m. Floor drains. Hanging fluorescent lights (some work, flickering). The mezzanine walkway runs around the hall at Z 4.0 on the north, east and west walls, reached by two steel stairs (west and east) and a ladder (south). From the mezzanine, you see the whole hall. Containers: 8 gutting stations with under-bench bins [LT_Bench_Cannery], 2 lockers [LT_Locker_Worker], 1 tool cage (locked, padlock: shoot it) [LT_ToolCage]. Cover: the conveyor frames (0.9 m, low cover), the retort vessels (full cover), the columns. Combat character: long sightlines down the lines (40 m), vertical play with the mezzanine. AI: 4 Shamblers idle along the lines (memory points: at the gutting tables, as if working), 1 Crawler under the east conveyor.

Labeling and Packing (Y 60 to 80, X 0 to 25): stacks of flat-packed boxes and pallets of labeled cans ("HALDANE'S FINEST"), a shrink-wrap machine, a pallet jack. Containers: 4 pallets of tins [LT_Pallet_Tins: food], 1 desk [LT_Desk_Office]. Exit: a door north to the loading yard.

Engine Room access (Y 60 to 80, X 25 to 45): a corridor to the cold store tunnel stairs (going down to the basement) and to the boiler house door. Containers: 1 electrical cabinet [LT_Electrical: fuses, copper wire; the Slipway Fuse spawns here 40% of the time], 1 toolbox.

Gatehouse (outside, at the loading yard's north gate, 4 × 4 m): the night watchman's body (N05, the Cannery Safe Key), a desk, a kettle, a radio, a small heater. Containers: 1 desk, 1 locker.

### 47.1.2 First floor (Z 6.0)

Offices along the north side (X 30 to 45), reached from the west and east stairs and the mezzanine:

Manager's Office (8 × 6 m): a big desk, a leather chair, framed photos of the Haldane family and the fleet, a drinks cabinet, a window overlooking the processing hall (one-way: looking down from the office you see the hall; it's a great overwatch), and the safe (a floor safe behind the desk: Cannery Safe Key or code 0714 from the payroll office note) [LT_Safe_Cannery: Scrip, valuables, the 12 Year whisky, a pistol 20%]. Containers: desk [LT_Desk_Manager], drinks cabinet [LT_DrinksCabinet], filing cabinet. Story: union dispute letters, a letter from the Ministry about "rented cold storage", a model trawler on the desk.

Payroll Office (5 × 5 m): a counter with a grille, a small safe (unlocked, empty: already looted), filing. A note with the safe code is pinned behind the door (a sticky note with "0714" and "G.H. bday"). Containers: 2 filing cabinets, 1 desk, 1 cash box [LT_CashBox].

Union Room (5 × 6 m): a table, chairs, tea urn, the minutes (N04). Containers: 1 cupboard [LT_Cupboard_Office].

Canteen (12 × 8 m): tables, a serving counter, a kitchen behind. Containers: 3 kitchen cupboards [LT_Kitchen_Commercial], 1 fridge [LT_Fridge], vending machine (break the glass for snacks: loud) [LT_Vending].

First Aid Room (4 × 4 m): a cot, a medical cabinet [LT_Medical_Cabinet_Industrial: bandages, splints, painkillers, rarely an IFAK], an eyewash station.

Toilets and changing rooms (male, female): lockers ×10 [LT_Locker_Worker].

The covered bridge (on the east side, 18 m long, 3 m wide, enclosed with windows): the connection to the cold store. A chokepoint and a death trap: windows on both sides, glass that breaks. It's the only dry way into the cold store after Surge 1.

### 47.1.3 Second floor (Z 10.0) and roof

Storage (open floor, 40 × 25 m over the north half): racks of empty cans, label rolls, machinery spare parts (crates), old fishing gear, and the water tank room (two big tanks). Containers: 10 crates [LT_Crate_Industrial: barter], 2 toolboxes, 1 weapon cache on a top shelf (25% chance: a Breaker with 10 shells, from a previous salvager crew) [LT_Cache_Salvager].

Roof access: a stair to a roof hatch. The roof is flat felt with skylights over the processing hall. The skylight glass breaks and doesn't hold weight: you can shoot through it or fall through it, and the 7.6 m drop onto the conveyor is a damaging fall (part 04.4: about 170 HP to the legs and a likely fracture). The roof has a parapet (1.0 m) on all sides: cover. The chimney's base is on the roof at the northeast, with a door into its internal ladder.

The chimney: brick, 30 m above the roof (Z 30 from the building origin, 32.5 above datum). Internal steel ladder (slow: 1.3 m/s, about 13 s to climb from the roof to the top platform, exposed to anyone inside the chimney's base below). The top platform (a ring 1 m wide around the opening, with a rusted railing) at Z 28 sees: the whole harbor basin (300 m), the terminal yard (380 m), the quay, the back lanes, the High Street rooftops. The most powerful and most dangerous position in Harbourside. Lightning targets it during Surges (part 15.6).

### 47.1.4 The cold store

Ground floor (Z 0): the cold store hall (an insulated box, 20 × 25 m, with plastic strip curtains at the doors), three cold rooms off it: Freezer 1 (empty racks, frost and ice on the floor, purely visual: there's no slippery-surface mechanic in v1), Freezer 2 (frozen fish on racks, crates), Freezer 3 (the sealed deep freeze: a heavy insulated door with a newer padlock and a keypad: opened with the Vigil contract or by shooting the padlock and then the keypad needs the code from Dr. Strand's notebook; inside, the LANTERN sample crate and a strange frost pattern on the walls that glows faintly). The refrigeration engine room (compressors, still humming: the power station feeds this building), with a ladder down to the basement.

Basement (Z -4.0): the deep cold store tunnel and the drainage sump. Always flooded at least partially. The Hollow nest: 8 to 12 Shamblers and Crawlers lying submerged in the water at raid start (they rise when disturbed), a Brute 30% of the time. The richest salt deposits in Harbourside spawn here after every Surge recedes (the basement drains only partially, so harvesting is done waist-deep in the dark). Containers: 4 crates [LT_Crate_Flotsam], salt deposits (dynamic).

### 47.1.5 The jetty and the loading yard

The jetty: a 40 m concrete pier south of the receiving bay, 6 m wide, with bollards, a crane (static, climbable to its cab at 8 m via a ladder: a lookout), and the E2 extraction boat berth at its end. The jetty floods at Surge 2 (0.4 m) and Surge 3 (1.6 m: the Gull boat comes in higher and the deck is level with the water).

The loading yard (north): a fenced yard with three lorries (one refrigerated, its back open: a container [LT_Lorry]), a skip, stacked pallets, the gatehouse, a gate onto Cannery Row. Cover: the lorries (engine blocks stop rounds, part 05.6).

### 47.1.6 Sightlines and approaches

Approaches to the cannery: from the quay (west, through the receiving bay: exposed), from Cannery Row (north, through the loading yard: covered by the gatehouse and lorries), from the fish market (east, along the shore: flooded early), from the water (south, by swimming or boat to the jetty: exposed to the chimney), and from the roofs of the Cannery Row terraces (via a mantle chain onto the loading yard wall and the drainpipe climb to the cannery roof). Five approaches. Good.

Key sightlines into the cannery: the Kittiwake Lass wheelhouse to the receiving bay doors (220 m), the terminal staff office windows to the jetty (300 m), the Drowned Man's upstairs to the loading yard (160 m).

## 47.2 THE FERRY TERMINAL

Building origin: world (-345, -220, 2.5). Footprint 18 m (X) by 40 m (Y). Two floors: ground (height 4.0 m) and first (height 3.5 m). The marshalling yard south and east of it at elevation 2.0. The linkspan ramp extends south from the yard's south edge into the water (a 30 m steel ramp on a hinge, sloping down to the water: the Ferryman's entrance and the E1 boat berth).

Flood depths: yard: Surge 2 0.4 m, Surge 3 1.8 m. Building ground floor: Surge 3 1.3 m.

### 47.2.1 Ground floor

Waiting Room (16 × 18 m): rows of plastic seats bolted to frames (low cover), a departures board (dead, one line still lit: "22:30 MAINLAND CANCELLED"), vending machines (2), a children's play corner with a ball pit (a horrible, perfect detail), posters for the islands' tourism ("COME FOR THE BIRDS, STAY FOR THE WHISKY"). Containers: 2 vending machines [LT_Vending], 4 abandoned bags under seats [LT_Luggage_Small], 1 lost property shelf behind the information desk [LT_LostProperty]. AI: 2 Shamblers seated in the rows (they look like corpses until you're within 6 m: "sit slumped" idle).

Ticket Office (6 × 5 m, behind a counter with glass): the handwritten sign on the window (LAST BOAT GONE. GO TO THE CHURCH.), the cash safe (Terminal Office Key, found in the cafe on a body) [LT_Safe_Small: Scrip, the last ferry ticket note N64 30%], ticket printers, a desk. Containers: 1 desk, 1 cash drawer [LT_CashBox], 1 safe.

Cafe (8 × 10 m): a counter, tables, a kitchen, a body behind the counter (the cafe owner, with the Terminal Office Key). Containers: 2 kitchen cupboards, 1 fridge, 1 till [LT_CashBox].

Toilets, a baby change room, a cleaner's cupboard [LT_Cupboard_Cleaning].

Baggage Hall (rear, 10 × 12 m): a short conveyor, trolleys, unclaimed suitcases (6) [LT_Luggage_Large: clothing barter, valuables 10%, a weapon 3%].

### 47.2.2 First floor

Staff Office (10 × 8 m): desks, a window wall overlooking the yard and the linkspan (the best view of the yard: 60 m to the ramp), the CCTV room (2 × 3 m: monitors, the log N07), lockers. Containers: 3 desks, 2 lockers, 1 filing cabinet, 1 first aid box [LT_Medical_Small].

Port Manager's Office (5 × 5 m): a desk, a key cabinet (2 random keys) [LT_KeyCabinet], a radio, tide charts.

Staff Room (6 × 5 m): a kitchen, a sofa, a TV. Containers: 1 fridge, 1 cupboard.

The roof (flat, reached by a hatch from the staff office corridor): a parapet, an aerial mast, the terminal sign ("SALTMARROW FERRY TERMINAL" in big letters, with some missing). A roof position over the yard and the harbor.

### 47.2.3 The marshalling yard

90 m (Y) × 60 m (X), tarmac with painted lanes (6 lanes), lamp posts, the queue of 60 abandoned cars (each with a glovebox and a boot as containers: [LT_Car_Glovebox], [LT_Car_Boot]; 30% of cars are lootable, the rest have empty or jammed compartments), two lorries (one with a curtain side, half open: a container with 3 crates), a camper van (enterable: a tiny kitchen, a bed, a toilet; 4 containers), a tour coach (enterable: 20 seat pockets [LT_SeatPocket], the overhead racks, the luggage hold underneath (6 suitcases), the driver's cabin with a first aid kit). Cars are cover (doors don't stop rifle rounds; engine blocks do). Some cars crashed into each other at the gate to the ramp (a pile-up: a choke).

A lamppost with a dog lead tied to it (SIDE01).

The linkspan: a steel ramp with handrails, sloping into the water, slippery-looking (no mechanic), the E1 boat berth at its foot. At Surge 3, only the top third of the ramp is above water.

Boss arena: when the Ferryman spawns (Surge 2), he walks up the linkspan out of the water, rings the terminal's bell (a ship's bell mounted on a frame at the top of the ramp: added as a set piece; it's the Halcyon's old regatta bell's twin), and patrols the yard. The yard's cars and the coach are the arena's cover. The strongroom (behind the baggage hall, a steel door with a lock that only Gault's Ticket Punch opens) holds a weapon crate [LT_Strongroom: a rare weapon, Class 4 armor, and, for CAP15, the Halcyon's Bell].

## 47.3 THE LIFEBOAT STATION

Building origin: world (-300, -250, 9.0) for the boathouse floor. The slipway runs from the boathouse (at 9.0) down to the water (at -1.0) over 45 m, a 13° slope.

### 47.3.1 Rooms

Boathouse (12 × 30 m, 10 m tall): the lifeboat Saltmarrow Spirit on its carriage at the top of the slip (orange hull, navy wheelhouse, a hole in the bow: walk-in through the hole into its cabin: 2 containers [LT_Lifeboat]), a winch at the head of the slip (the fuse box for E3 on the wall beside it), tractor (for launching), racks of lifejackets and helmets (helmet spawns: Lifeboat Crew Helmet 40%), hoses. Containers: 2 equipment racks [LT_Rescue], 1 workshop bench [LT_Toolbox].

Crew Room (8 × 6 m): lockers (8: the crew's names on them, three empty pegs above: part 14.4.3; the coxswain's locker has the Rook 30%) [LT_Locker_Crew], a kitchen corner, a sofa, a TV, photographs of crews and rescues on the walls, the station's service board.

Drying Room (4 × 4 m): racks of drysuits and oilskins (set dressing only, because clothing is cosmetic; the lootable racks hold barter fabric), a heater.

Radio Room (4 × 4 m): the radio set, the callout log (N01), charts. Containers: 1 desk, 1 cabinet [LT_Electrical].

Medical Store (3 × 3 m): [LT_Medical_Lifeboat: the best medical in Harbourside: Lifeboat Trauma Kit 15%, IFAKs, splints, tourniquets].

Lookout Tower (a 3 × 3 m tower at the boathouse's north corner, 12 m tall, a spiral stair to a glazed lookout room at the top with a 360° view: the harbor mouth, the terminal, Gannet Rock, the open sea). A sniper position with glass all round (glass you can be shot through).

### 47.3.2 Approaches

From the High Street's west end (down a steep lane, the Lifeboat Brae, 70 m), from the slip (up from the water: exposed), from the cliffs above (a cliff path from the hotel's grounds, narrow, with a 10 m drop: falling is possible), and from the terminal (along the shore at low tide: a rocky foreshore path that floods at Surge 1).

## 47.4 THE DROWNED MAN

Building origin: world (-215, +30, 3.0). Footprint 14 × 20 m. Two floors (ground 3.0 m, first 2.7 m) and a cellar (Z -2.4).

Flood: Surge 2: 0.5 m, Surge 3: 1.4 m. Cellar always partly flooded (0.6 m), full at Surge 1.

### 47.4.1 Rooms

Public Bar (10 × 8 m): a long wooden bar with brass rail and a mirror behind full of bottles (shootable: glass and liquid), a stuffed gannet in a case, low beams (2.3 m: tall players' cameras must handle it), a fireplace, tables and stools, the darts board with the league table, a jukebox (dead), a fruit machine (break it: Scrip in coins) [LT_FruitMachine]. Containers: behind the bar: 3 cupboards [LT_Bar: whisky, lager, Scrip in the till], the till [LT_CashBox]. AI: a Shambler behind the bar (memory point: "serving").

The Snug (4 × 4 m): a tiny room with a hatch to the bar, two settles, a table with dominoes mid-game.

Function Room (10 × 10 m, at the back): the wedding reception (part 02): a banner ("CONGRATULATIONS KIRSTY & CALLUM"), round tables with place settings and salt-crusted food, a top table, a gifts table [LT_WeddingGifts: valuables, Scrip envelopes, a silver cake knife], the seating plan (N02), the cake on a stand (collapsed, crusted white, eerie). AI: 3 Shamblers in wedding clothes seated at the tables (sit slumped), 1 standing at the top table (memory point). The emotional center of Harbourside. Light it softly: a window, dust motes.

Kitchen (5 × 6 m): range, cupboards [LT_Kitchen_Commercial], a walk-in larder, a back door to Fish Lane.

Cellar (10 × 8 m): kegs, crates of bottles, a trapdoor to the quay (a hatch in the outer wall at water level: a sneaky route in and out, which floods first), barter (gas cylinders, tools). Containers: 3 crates [LT_Crate_Pub].

Landlord's Flat (first floor): a living room (sofa, TV, a gun cabinet with the Coach Gun 40% [LT_GunCabinet]: locked, key in the bedside table), a bedroom (bedside table with the key and [LT_Bedside]), a bathroom (medicine cabinet [LT_Medicine_Home]), a kitchen, and the landlord's safe in the wardrobe [LT_Safe_Small]. Windows over the quay (good view of the harbor front, 120 m both ways).

## 47.5 HARBOUR FRONT BUILDINGS

Harbour Master's Office (two floors, 8 × 10 m): ground: the public counter, tide tables (N03), a chart table, the key cabinet (2 keys) [LT_KeyCabinet], a VHF radio; upstairs: the harbour master's office with a big window over the basin (overwatch), a barometer on the wall (an item!), a desk [LT_Desk_Office], and a bunk. Flood: Surge 2 0.4 m.

The Chandlery (one floor and a loft, 10 × 12 m): shelves of boat gear [LT_Chandlery: rope, flares, fuel cans, lifejackets, the Waterproof Dry Bag 8%, Signal Pistol 10%], the stock note (N09), a counter with a till.

Bait Shed (6 × 8 m): fish boxes, freezers (dead), a terrible smell (an audio cue of flies), hooks, a hiding place behind the freezers.

Net Lofts (two buildings, 6 × 12 m each, two floors: ground floor boat store with a dinghy (the rowing dinghy spawns here in Tier 2), upper floor reached by external stone stairs: nets hung from the rafters (soft cover, they block sight but not bullets), a workbench, the crew's cache (CAP07) in the west loft).

The Golden Haddock (fish and chip shop, 8 × 10 m, flat upstairs): fryers, a counter, a menu board, the flat [LT_Flat_Small ×4 containers].

Jade Harbour (takeaway, 6 × 8 m, flat upstairs): a counter, a kitchen, the flat [LT_Flat_Small ×4].

Fishermen's Cottages (8, each 5 × 8 m, two up two down): the terrace archetype from part 14.13.3. Each has 6 to 9 containers (kitchen cupboards, a dresser, bedside tables, a wardrobe, a bathroom cabinet) [LT_Home_*], and each has one personal story detail picked from a set of 20 (a fishing photo, a half-knitted jumper on a chair, a child's drawing, a ship model, a broken window boarded from inside, a table set for two, a dog bed, a pile of letters inside the door). 6 are enterable, 2 are locked.

## 47.6 THE FISH MARKET AND THE EAST BREAKWATER

Market Hall (50 × 20 m, steel frame, corrugated roof at 7 m, open sides): stacked fish boxes in rows (cover, 1 to 2.4 m), auction stands, a weighing scale, hoses, drains. Containers: 12 fish crates [LT_FishCrate]. Auction Office (a small two-storey block at the hall's west end: N06, desks, a safe with the auction float [LT_Safe_Small]). Ice Plant (a block with an ice machine and the locked tool cage [LT_ToolCage]). Flood: Surge 1 0.3 m, Surge 2 1.1 m, Surge 3 2.3 m (the hall is a lake; the boxes float: physics-enabled stacks that topple and drift in Surge 2 and 3, a lovely dynamic detail if the performance budget allows: cap 40 floating boxes).

The East Breakwater: 180 m of curved stone, 5 m wide, 3.5 m above datum at its crest, with a parapet on the seaward side (cover from the sea, not from the harbor), iron rings and ladders, and the navigation light at the end (a white tower 6 m tall with a green light: the E4 fixed extraction volume is at its base). Waves overtop it during Surges (part 14.4.5).

## 47.7 THE BACK LANES AND THE WYNDS (HARBOURSIDE PART)

Fish Lane (behind the harbor front buildings, 3 m wide, 250 m long): back doors, yards with walls (1.8 m: mantleable), bins, sheds (each a container [LT_Shed]), washing lines, a coal bunker or two, a lot of cats' bowls (no cats). Ropewalk (a long straight lane, 120 m, between the net lofts and the High Street's south side: where rope was made, with a long low shed along one side). Kirk Wynd and Fish Wynd (steps up to the High Street: part 14.5.5).

Flood: Fish Lane is at 3.0 to 4.5 m elevation, so it floods only at Surge 3 (the lower end, 0 to 0.8 m), becoming the main escape route from the quay during Surge 2.

## 47.8 THE KITTIWAKE LASS (THE AGROUND TRAWLER)

A 24 m steel trawler aground on the mud at the harbor's west side, listing 12° to port. Reachable by wading at low tide (0.6 m), swimming after Surge 1. The wheelhouse (3 × 4 m, elevated 4 m above the deck, glass on all sides, mostly broken) is the harbor's best sniper position with 300 m views across the basin. Below deck: the fish hold (dark, flooded to 1.2 m: Crawlers), the crew mess and bunks (4 containers [LT_Boat_Crew]), the engine room (barter). The deck has a winch, nets and fish boxes (cover). Climbing aboard: a ladder on the starboard side and a mantle from the gunwale.

## 47.9 HARBOURSIDE LOOT ZONES AND TIERS

| Zone | Buildings | Tier | Notes |
|---|---|---|---|
| HS_Cannery | Cannery, cold store, jetty, yard | 4 (cold store basement 5) | The hot zone |
| HS_Terminal | Terminal, yard, coach, linkspan | 4 | Many low-value containers, a safe, the strongroom |
| HS_Lifeboat | Lifeboat station | 3 | Best medical |
| HS_Quay | Harbour front buildings, cottages, Drowned Man | 3 | |
| HS_FishMarket | Market, ice plant, breakwater | 3 | Floods first |
| HS_Basin | Boats in the harbor, the Kittiwake Lass | 3 | Wet loot |
| HS_Lanes | Fish Lane, Ropewalk, sheds | 2 | |

Expected loot value in Harbourside per Standard raid: about 1.45 M Scrip (35% of the map, part 43.6.3), distributed: cannery 30%, terminal 22%, quay 18%, lifeboat 8%, fish market 7%, basin 8%, lanes 7%.

## 47.10 HARBOURSIDE AI PLACEMENT AT RAID START

| Location | Hollows | Notes |
|---|---|---|
| Cannery ground floor | 4 Shamblers, 1 Crawler | Memory points along the lines |
| Cold store basement | 8 to 12 Shamblers and Crawlers, Brute 30% | Submerged |
| Terminal waiting room | 2 Shamblers | Seated |
| Terminal yard | 3 Shamblers | Among the cars |
| Drowned Man | 5 Shamblers | Function room and bar |
| Quay | 2 Shamblers | Staring at the water |
| Fish market | 2 Crawlers | Under the boxes |
| Kittiwake Lass hold | 2 Crawlers | |
| Lanes | 1 to 2 Shamblers | Wandering |

Tide spawn points (for Surge waves): the slipway foot, the linkspan, the jetty, the quay ladders (6), the fish market shore, the cannery's south shore, the harbor basin floor (rising in the basin and wading ashore).

## 47.11 HARBOURSIDE AUDIO AND LIGHTING NOTES

Lighting: the quay has three working streetlights (powered intermittently), the cannery has flickering fluorescents in the processing hall and a dead dark cold store, the Drowned Man has daylight through dirty windows and nothing else, the terminal's departures board glows. The Kittiwake Lass's navigation light still blinks (battery). At night, the town's working windows are few and precious: about 12 lit windows across Harbourside.

Audio: the basin's boats knocking and creaking, bell buoys at the harbor mouth, gulls on the cannery roof (who burst into the air at gunshots), the cannery's refrigeration hum (from the cold store engine room: audible from the yard, louder inside, deep and unsettling, and in tune with the Hollows' hum: Agnes will tell you why later), the terminal's flapping banner, water dripping everywhere after Surges.

---

End of part 47. Next: `48_HIGH_STREET_AND_KIRKHILL_ROOM_BY_ROOM.md`.
