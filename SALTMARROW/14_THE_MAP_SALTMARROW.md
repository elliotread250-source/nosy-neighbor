# SALTMARROW: PART 14, THE MAP

This part describes the map: its shape, its districts, every point of interest, the insertion and extraction points, the loot zones, the flood behavior, and how to build it in Unreal without hand-placing 40,000 objects. The map is the single largest piece of content in the game. Build it in passes: blockout first (playable greybox with correct scale, heights and sightlines), then the modular kit, then dressing with PCG, then lighting, then the hero buildings' interiors. Harbourside is the Tier 1 district; build it to final quality first, and the rest of the island to blockout, before going further.

---

## 14.1 COORDINATES AND SCALE

Unreal units: 1 uu = 1 cm. All coordinates in this part are in meters for readability. Convert by multiplying by 100.

Axes: +X is north, +Y is east, +Z is up (Unreal's default top-view orientation, where north is up the screen and east is to the right). The origin (0, 0, 0) is the center of the main island at the datum (sea level at low tide, raid start). St. Brendan's church tower is at about (120, -40, 74).

Playable bounds: X from -560 to +620, Y from -720 to +700. That's about 1.18 km north-south by 1.42 km east-west including the islets and the water between them. Outside that, open sea with an invisible "Open Water" boundary (part 04) at the buoy line, plus distant set-dressing (more islands, the Halcyon at anchor 2.5 km to the south-southeast, the mainland's lights on the horizon at night).

## 14.2 THE SHAPE OF THE ISLAND

Read this like a local giving directions.

The main island is a lopsided bowl tipped toward the south. The harbor is on the south coast, a natural inlet about 220 m wide, sheltered by two curving breakwaters. Behind the harbor, the town climbs north up a slope: the waterfront at 1 to 4 m elevation, the High Street at 6 to 14 m, and then houses scattered up the side of Kirkhill to the church at 74 m. East of the harbor, the land stays low and flat along the shore (Cannery Row and the East End, 2 to 10 m), which is why the cannery, the hospital and the terraces flood badly. West of the harbor, the land rises fast to cliffs (the hotel and the lifeboat station sit on a shelf at 8 to 12 m above the slipway). North of Kirkhill, the island opens into rolling moorland at 20 to 50 m, with the power station in the northwest, the old airfield's runway on a flat in the west, the caravan park and the distillery on the north coast, and cliffs dropping 18 to 30 m to the sea all round the north and west.

Three islets: Gannet Rock, a 40 m tall stack 260 m southwest of the harbor mouth; Kirk Holm, a low flat islet 180 m east of the East End, joined by a stone causeway that floods; and the Teeth, a cluster of skerries 200 m north of the north coast, the largest of which holds the listening station LISTENER.

### 14.2.1 The ASCII map

North is up. Each character is about 25 m. This is the designer's reference, not a final layout; the blockout will refine it.

```
                         ~~~ THE TEETH ~~~
                      ~~ [LISTENER] ~~ /OrlaBrae\ ~~
                    ~~~~  ^^^^^^^   ~~~ \_____/ ~~~~
                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   ~~~~~~~~~~~~~~~~~~~ cliffs ~~~~~~~~ cliffs ~~~~~~~~~~~~~~~~~~
  ~~~  ____________[CARAVAN PARK]______[DISTILLERY]__________ ~~~
  ~~~ /  [POWER STN]   .  .  moor  .  .  .  [WATER WORKS]     \ ~~
  ~~ |   ===tank farm     .  wind turbines  .  .  .            | ~~
  ~~ |  [AIRFIELD]==============       .  [GOLF CLUBHOUSE]     | ~~
  ~~ |   runway     .  .  .  .  .  .  .  .  .  .  .  .         | ~~
  ~~ |  cliffs  .  .  .   ___[KIRKHILL]___  .  .  .  .         \~~~
  ~~  \    .  .  .  .   /  [ST BRENDAN'S]  \  [PRIMARY SCHOOL]  \~~~~~ [KIRK HOLM]
  ~~   |  [HALDANE  ]  |  graveyard  manse |  [EAST END TERRACES] |~~ causeway ==[QUARANTINE]
  ~~   |  [ARMS HTL ] \_______________ ____/  [ST COLUMBA'S]      |~~~~~         [CHAPEL]
  ~~~  |  ===HIGH STREET==[BANK]=[POLICE]=[KITTIWAKE]=[LOWRIE'S]== |~~
  ~~~  | [LIFEBOAT]  [MUSEUM] [CHEMIST] [POST]  [DROWNED MAN]      |~~~
  ~~~~ |  slipway     \__ harbour front ____  [CANNERY]==[COLD STORE]~~
  ~~~~~ \___[TERMINAL]===\   HARBOUR BASIN   /==[FISH MARKET]___/~~~~~
  ~~~~~~~  marshalling yard\_________________/  breakwater  ~~~~~~~~
  ~~~~~~~~~ breakwater W ~~~~   harbour mouth  ~~~ breakwater E ~~~~
  ~~~ [GANNET ROCK] ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ~~~ lighthouse  ~~~~~~~~~~~~~~ (Halcyon is 2.5 km SSE) ~~~~~~~~~~
```

## 14.3 DISTRICTS AND LOOT ZONES

Each district is split into loot zones. Each zone has: a loot tier (1 to 5, part 12), a danger level (static Hollow density multiplier), a flood band (the elevation range, which decides when it floods), and a list of POIs.

| District | Zones | Elevation | Loot tier | Danger | Floods at |
|---|---|---|---|---|---|
| Harbourside | Ferry Terminal, Harbour Front, Cannery, Fish Market, Lifeboat Station, Breakwaters | 0.5 to 4 m | 3 to 5 | High | Surge 1 (low parts), Surge 2 (most), Surge 3 (all) |
| High Street | West High Street (hotel, museum), Central High Street (bank, police, chemist, post office), East High Street (Kittiwake, Lowrie's, takeaway, bookies) | 5 to 14 m | 3 to 4 | Medium-High | Surge 3 only in the lowest east end (below 7 m) |
| Kirkhill | Church, Graveyard, Manse, Hill Houses | 20 to 74 m | 2 to 3 | Medium | Never |
| East End | Terraces, St. Columba's Hospital, Primary School, Allotments | 2 to 10 m | 2 to 4 | Medium | Surge 2 (low terraces), Surge 3 (hospital ground floor) |
| The Moor | Power Station, Airfield, Wind Farm, Golf Course, Caravan Park, Distillery, Water Works | 15 to 50 m | 1 to 5 | Low to Very High (power station) | Never (except the caravan park's beach at Surge 3) |
| Gannet Rock | Lighthouse, Keeper's Cottages, Landing | 2 to 40 m | 3 | Low | Landing only |
| Kirk Holm | Quarantine Hospital, Graveyard, Sunken Chapel, Causeway | 1 to 8 m | 3 to 4 | Medium | Causeway at Surge 1, chapel crypt at Surge 1, the rest at Surge 3 |
| The Teeth | LISTENER, Orla Brae, Skerries | 0 to 22 m | 5 | Very High (Wardens) | Orla Brae lower holds at Surge 1 |

## 14.4 HARBOURSIDE (TIER 1 DISTRICT, BUILD FIRST)

Harbourside is the heart of the map and the Tier 1 vertical slice. It's roughly X from -380 to -150, Y from -260 to +260. It needs to be playable on its own as a complete raid map in Tier 1, with its own insertions and extractions, before the rest of the island exists (the rest of the island appears as a distant non-playable backdrop with a fence or a cliff edge as the playable boundary in Tier 1).

### 14.4.1 The Harbour Basin

The basin is the water inside the breakwaters: about 220 m wide (east-west), 160 m deep (north-south), water depth 2 to 6 m at low tide. Moored in it: 6 fishing boats (two half-sunk, one capsized, three floating and boardable: they're loot locations and cover), a dozen small dinghies, mooring buoys, and an old trawler, the Kittiwake Lass, run aground on the west side mud with its wheelhouse above water (a sniper nest with a view across the whole harbor, and a classic death trap).

The harbor front is a stone quay running around the basin's north side at 2.2 m elevation, with bollards, ladders down to the water every 30 m, lobster pots, nets, crates, and a row of small harbor buildings (a harbor master's office, a chandlery, a bait shed, net lofts). The quay floods at Surge 1 (water reaches +1.2 m at the quay edge on the storm side, so shin-deep), knee-to-waist deep at Surge 2, and fully under at Surge 3.

### 14.4.2 The Ferry Terminal (POI)

Location: the southwest of the harbor, around (-330, -190). Elevation: 2.0 m (yard), 2.5 m (building floor). Size: the terminal building is 40 m × 18 m, two floors.

What it is: the island's ferry terminal, with a long linkspan ramp where the ferry's bow door used to land, a waiting room, a ticket office, a cafe, toilets, a staff office upstairs with windows over the yard, and the marshalling yard: a fenced tarmac area of about 90 m × 60 m with marked lanes full of abandoned cars (60 cars, many with suitcases strapped on, doors open, some crashed into each other at the ramp), two lorries, a camper van and a tour coach (enterable).

Loot: Tier 4. The cars are a huge number of small containers (glovebox and boot each): 120 containers in the yard, mostly low-value (barter, food, clothing, valuables in the odd suitcase). The ticket office has a cash safe (locked, key: "Terminal Office Key", found on a body in the cafe). The staff office has the CCTV room (a note), lockers. The coach has 20 seat-pockets and the luggage hold (6 suitcases).

Boss: the Ferryman's arena (part 13). When he spawns, he walks up the linkspan ramp out of the water.

Flooding: the yard is at 2.0 m, so it floods at Surge 2 (to about 0.4 m, ankle-to-knee depth with cars sticking out), and at Surge 3 to about 1.8 m (the cars roofs at 1.5 m are just under; you can stand on the coach roof and the lorry roofs). The building's ground floor floods at Surge 3; the upstairs office stays dry.

Story: the sign on the ticket office: LAST BOAT GONE. GO TO THE CHURCH. A queue of cars with families' belongings. A child's car seat. A dog lead tied to a lamppost with no dog. These small details matter.

Extraction: Ferry Ramp boat extraction (part 16).

### 14.4.3 The Lifeboat Station (POI)

Location: the west side of the harbor, on the shelf below the cliffs at (-290, -235). Elevation: slipway runs from 0 to 9 m; the boathouse floor is at 9 m.

What it is: a stone boathouse with a steep concrete slipway down into the harbor, the damaged lifeboat (the Saltmarrow Spirit, orange and navy, a hole in her bow) on the carriage, a crew room with lockers and a kitchen, a drying room, a workshop, a radio room, and a lookout tower (12 m tall, a great overwatch on the harbor mouth).

Loot: Tier 3, with good medical (the lifeboat's medical stores: Lifeboat Trauma Kits), rescue gear (flares, signal pistols, the flotation armor, rope), and the crew lockers (8 lockers, each with personal effects and a chance of a weapon: the coxswain's Rook revolver is in his locker 30% of the time).

Flooding: the bottom of the slipway is always wet; the boathouse never floods. It's a safe high point next to the harbor.

Story: the callout log on the radio room desk (part 02). Three empty pegs in the crew room with names above them.

Extraction: Lifeboat Slipway (conditional: requires powering the slipway winch with a fuse from the power station or the cannery's electrical room; then the lifeboat crew's spare RIB launches as an extraction at Surge 2 or later).

### 14.4.4 The Haldane Cannery (POI, the hot zone)

Location: the east side of the harbor, around (-260, +150). Elevation: 2.5 m (ground floor). Size: the main building is 80 m × 45 m, three floors, plus the cold store (30 m × 25 m, partly below ground), the boiler house with its 30 m chimney, a loading yard and a jetty.

What it is: an industrial fish cannery from the 1950s, extended in the 1970s. Ground floor: the receiving bay (where fish came in from the jetty, with conveyor belts, tipping hoppers and steel tanks), the processing hall (two long lines of gutting tables, conveyor belts, can sealers, a cooking retort room, a labeling and packing area), the loading dock. First floor: offices (manager's office, payroll, union room, canteen, toilets, first aid room), a mezzanine walkway overlooking the processing hall with gantries and catwalks (great vertical combat). Second floor: storage (cans, labels, machinery parts), the roof access, and the water tank room. The cold store: a separate building connected by a covered bridge on the first floor and a tunnel in the basement, with three cold rooms (frozen fish, frozen fish, and a sealed deep freeze), an engine room for the refrigeration plant, and the deep cold store in the basement, which floods first and is where Hollows nest.

Loot: Tier 5 in the cold store and the manager's office, Tier 4 everywhere else. The manager's office has a safe (key: "Cannery Safe Key", on the night watchman's body in the gatehouse, or a code on a note in the payroll office). The first aid room has medical. The engine room has barter (motors, gauges, copper). The cold store is where flotsam salt deposits are richest after Surges (because it floods and drains).

Boss/elite: no boss; but the cold store basement is the Hollow nest: 8 to 12 Shamblers and Crawlers submerged in its flooded floor at raid start, plus a 30% chance of a Brute.

Flooding: the cannery floor is at 2.5 m. The basement cold store is at -1.5 m and is always wet (knee-deep at raid start), fully flooded at Surge 1. The ground floor floods to 0.3 m at Surge 2 and to 1.3 m at Surge 3 (chest-deep in the processing hall: the gantries and the first floor become the only dry routes). The roof and the chimney stay dry.

Vertical play: the chimney has an internal ladder to a platform at 28 m: the best sniper perch in Harbourside, and a terrible place to be caught. The roof is reachable from the second floor stairs and from a drainpipe climb on the north side (a mantle chain).

Story: the processing line still loaded with rotting fish in salt. Union dispute notes about LANTERN's contractors buying the cannery's freezer space ("They're storing something in Freezer 3 and they won't say what"). Freezer 3 (the sealed deep freeze) holds a LANTERN sample crate (a Vigil contract objective, Tier 2).

Extraction: Cannery Jetty boat extraction.

### 14.4.5 The Fish Market and the East Breakwater (POI)

Location: (-300, +230) to (-340, +300). Elevation 1.5 m. An open-sided covered market hall (50 m × 20 m, steel frame with a corrugated roof), auction offices, ice plant, fish boxes stacked high (cover), and the start of the east breakwater: a 180 m curved stone arm with a navigation light at the end.

Loot: Tier 3, mostly barter and food, some salt after Surges. The ice plant has a locked tool cage.

Flooding: floods at Surge 1 (the lowest point in the district). The breakwater is overtopped by waves during every Surge. Waves don't do damage, but they knock players down: on the breakwater during a Surge, a big wave every 10 to 20 s washes across, with a 2 s audio and visual warning, knocking players over and possibly into the water. That's the danger of using the breakwater as a route).

Extraction: Breakwater Light (fixed extraction at the end of the east breakwater, open until Surge 2 begins, then closed because of the waves).

### 14.4.6 The Drowned Man Pub (POI)

Location: harbor front, north side, (-200, +40). Elevation 3.0 m. A two-storey stone pub with a low-ceilinged bar, a snug, a function room (with the wedding reception, part 02), a kitchen, a cellar (always partly flooded, with kegs and a trapdoor to the quay), and the landlord's flat upstairs.

Loot: Tier 3. Whisky (valuable), Scrip in the till and the landlord's safe, the darts trophies, food, and the wedding gifts table (valuables: a silver cake knife, an envelope of cash, a gold watch). The landlord's flat has a shotgun cabinet (Coach Gun 40%).

Flooding: Surge 2 (to 0.5 m), Surge 3 (to the bar top: 1.4 m).

### 14.4.7 Harbour Front buildings

Along the quay, between the terminal and the cannery: the Harbour Master's Office (two floors, a radio, tide tables, a key cabinet with 2 random keys), the Chandlery (boat supplies: rope, flares, fuel cans, lifejackets, the dry bag backpack), the Bait Shed (gross, fish crates, a good hiding spot), two Net Lofts (upper floors over boat stores, reached by external stairs), the Ice House, a public toilet, a fish and chip shop ("The Golden Haddock", with a flat upstairs), a Chinese takeaway ("Jade Harbour"), a row of 8 fishermen's cottages (each 2 rooms down, 2 up, tiny, with personal effects).

### 14.4.8 Harbourside insertion points (Tier 1)

In Tier 1, when Harbourside is the whole map: 4 insertion points (west slipway, the terminal's marshalling yard south fence, the cannery jetty, and the high street's west end at the hotel steps), each a boat landing cinematic or a walk-in. In Tier 2 (full island), Harbourside has 2 of the 8 insertions (14.11).

### 14.4.9 Harbourside routes and sightlines

The key sightlines: the Kittiwake Lass wheelhouse sees the whole basin (300 m), the cannery chimney sees the basin and the terminal yard (350 m), the lifeboat lookout sees the harbor mouth and the terminal (250 m), the Drowned Man's upstairs sees the quay. The key routes: the quay (fast, exposed), the back lanes behind the harbor front (Fish Lane, Ropewalk, Kirk Wynd: narrow, walled, cottage gardens, lots of cover), the high street above (parallel, safer), the water (boats, swimming: dangerous but fast during floods).

Build the blockout and run sightline checks: no single position should see more than 2 of the 4 insertion points, and every major POI should have at least 3 approach routes.

## 14.5 HIGH STREET

The High Street runs east-west across the slope above the harbor, from the Haldane Arms in the west to Lowrie's in the east, about 420 m long, at 6 to 14 m elevation (rising to the west). It's a dense street of 2 and 3 storey stone buildings with shops below and flats above, with wynds (narrow alleys) and steps running down to the harbor and up to Kirkhill. The road is cobbled in the west end (old town) and tarmac in the east. Abandoned cars, a bus at the bus stop, a post van, overturned bins, a phone box, a war memorial.

### 14.5.1 Northern Fisheries Bank (POI, hot zone)

Location: Central High Street, north side, (-90, -20). Elevation 10 m. Three storeys plus a vault basement. Ground floor: the banking hall (counters with bulletproof glass, a manager's office, a waiting area, an ATM lobby), the back office (filing, a strongroom for cash drawers). First floor: regional offices, the staff room and archives. Second floor: archives and the roof plant room. Basement: the vault, with an anteroom, safe deposit boxes (40, each a tiny container, some locked), and the main vault (a timed lock: opens 90 s after someone pulls the lever in the manager's office, with an alarm bell that rings across the town, attracting Hollows and players; and it stays open for 4 minutes, then closes, and can be opened from inside).

Loot: Tier 5 in the vault (Scrip, gold, valuables, the bank manager Hollow (part 02) carries the "NFB Master Key"), Tier 4 elsewhere.

Flooding: never (10 m), but the vault basement takes ground water at Surge 3 (to 0.3 m).

### 14.5.2 Police Station (POI)

Location: Central High Street, south side, (-110, +40). Elevation 9 m. Two storeys. Front desk, two interview rooms, the custody suite (two cells, one with a Hollow locked in it, part 02), the evidence store (locked, key in the sergeant's desk), the armory (raided, but a hidden cache behind a false panel in the back has a Harbormaster pistol and ammo, found by interacting with a loose panel), the CID office upstairs, the locker room, the radio room.

Loot: Tier 4, weapons and ammo, police armor and helmets, keys (the station's key cabinet holds 4 random building keys).

### 14.5.3 Haldane Arms Hotel (POI)

Location: West High Street, north side, (-60, -190). Elevation 13 m. Three storeys plus a basement. Ground floor: lobby, reception, the bar ("the Laird's Bar"), the restaurant, the kitchen, the ballroom (with the Laird's portrait, part 12). First and second floors: 30 guest rooms (rooms 101 to 115, 201 to 215), each with a bed, a wardrobe, a bathroom and a room safe (most open and empty, some locked with codes found on notes). Room 214 is Dr. Strand's (part 02). Third floor: staff quarters and the manager's flat. Basement: the wine cellar, laundry, boiler room.

Loot: Tier 4. Valuables in rooms, whisky in the bar, the portrait in the ballroom.

### 14.5.4 Other High Street buildings

The Chemist (Boots-like, "Fraser's Pharmacy": medical loot, Tier 3, with a locked dispensary), the Post Office (parcels as containers, a safe, Tier 3), the Museum (Saltmarrow Heritage Centre: old coins, ship models, a whaling harpoon display (the display case holds a barter item, "Antique Harpoon Head"), the antique sextant, an exhibit about the listening station's "weather research", Tier 3), the Kittiwake pub (part 02, Tier 3), Lowrie's supermarket (food, drink, barter, Tier 2, big open floor with aisles: a great close-quarters fight space), the Hardware Shop (Brodie's: tools, barter, duct tape, Tier 2), the Bookies (cash, Tier 2), the Butcher (meat hooks, a cold room, Tier 1), the Dentist (upstairs over the chemist: medical, gold teeth, Tier 2), a Bakery, a Charity Shop (barter only, wool and fabric, because clothing is cosmetic and never loot), the Library (notes, Tier 1), a Solicitor's office (documents, a safe, Tier 3), a Newsagent, a Hairdresser, a Launderette, and flats above every shop (each a small apartment with 3 to 5 containers).

### 14.5.5 The Wynds

Five wynds (alleys with steps) connect the High Street to the harbor: Kirk Wynd, Fish Wynd, Cooper's Steps, Mercat Close and Tolbooth Steps. Each is a narrow, walled, stepped alley 2 to 3 m wide, with back gardens, sheds, washing lines and doors. Two connect up to Kirkhill (Kirk Wynd and the Brae). These are the close-quarters arteries of the town, the places where you meet someone around a corner with a shotgun.

## 14.6 KIRKHILL

The hill north of the High Street, rising to 74 m. Terraced gardens, stone walls, a few big houses, the manse, the graveyard, and St. Brendan's at the top.

### 14.6.1 St. Brendan's Church (POI)

Location: (120, -40). Elevation 74 m (the base of the tower; the belfry is at 92 m). A Victorian granite church with a square tower. Nave, chancel, vestry (Mother Agnes's old office: notes, a Vigil contract item), the bell tower (a ladder and stairs to the belfry, barricaded from the inside: breaking in takes 4 melee hits or a shotgun blast), the crypt (dry, with old tombs and the refuge supplies from the first Surge: sleeping bags, food, water, a medical stash).

Role: the safe high ground. Never floods. During Surges, the church is the one place you can see the whole map from (the belfry has 360° views across the entire island and all three islets). That makes it the most contested sniper spot in the game. The bell can be rung (an interaction): it's audible across the map, attracts Hollows to the church, and Sparks comments. Players will use it to trap each other. Good.

Loot: Tier 3 (the communion silver, the refuge stash, Mother Agnes's notes).

Extraction: none at the church itself. The Hilltop Flare extraction is in the graveyard (part 16).

### 14.6.2 The Manse, the Graveyard and the Hill Houses

The Manse (the minister's house: Mother Agnes's old home: personal items, her late husband's study, a gun cabinet with the Tern lever action 25%), the Graveyard (gravestones as cover, a mausoleum with a locked door: key "Haldane Mausoleum", inside a family vault with valuables and a note), the Hill Houses (6 detached Victorian villas on the slope: doctor's house, the cannery owner's house (Haldane House, large, with a study, a gun room, a cellar: Tier 4), the schoolteacher's house, two holiday lets, a B&B).

## 14.7 THE EAST END

Low ground east of the cannery and the High Street, 2 to 10 m elevation, running to the shore facing Kirk Holm.

### 14.7.1 St. Columba's Cottage Hospital (POI)

Location: (-40, +330). Elevation 4 m (ground floor). Two storeys plus a basement. Ground floor: A&E (a small emergency room with 3 bays), the reception, a pharmacy (locked), X-ray, outpatients, the kitchen. First floor: two wards (men's and women's, 8 beds each), the children's ward (part 02), the nurses' station, the matron's office, the operating theater. Basement: the cold room (the insulin contract), the morgue (Hollows on slabs: some are Hollows waiting, some are props), the boiler room, the generator room.

Loot: Tier 4 medical (the best medical loot on the map: surgical kits, trauma kits, stimulants in the pharmacy, which needs the "Pharmacy Key" from the matron's office).

Flooding: the basement floods at Surge 1, the ground floor at Surge 3 (to 0.8 m).

### 14.7.2 The Terraces

Four rows of terraced fishermen's houses (Harbour Terrace, Kirk Holm View, Cannery Row, Shore Street), 12 houses each, two up two down, small back yards with sheds and coal bunkers, front doors onto the street. Tier 2 loot spread widely. The lowest row (Shore Street) floods at Surge 2. These are built entirely from the modular kit and dressed procedurally (14.13).

### 14.7.3 The Primary School

Location: (60, +260). Elevation 9 m. Single storey, two classrooms, a hall, a kitchen, the head's office, a playground. Tier 1 loot (barter, food, the weather diary note, part 02). It's a quiet, sad place. Leave the Hollow density low here.

### 14.7.4 The Shore and the Causeway

The east shore: a shingle beach, an old boat noust (stone boat shelters), and the stone causeway to Kirk Holm: 180 m long, 3 m wide, at 0.8 m elevation, with a low parapet. It's walkable at raid start and floods at Surge 1 (becoming waist-deep with currents, then too deep). Kirk Holm becomes a boat-only island after the first Surge.

## 14.8 THE MOOR

The north and west of the island: open, rolling heather moorland at 15 to 50 m, with stone dykes (field walls), peat banks, burns (streams), sheep fences, a few croft houses, and the island's infrastructure. Long sightlines, little cover except walls and terrain: a sniper's and a vehicle's (Tier 4) landscape.

### 14.8.1 The Power Station (POI, Warden stronghold)

Location: (300, -420). Elevation 22 m. A fenced compound of 150 m × 100 m: three generator halls (big diesel engines, gantries, control panels), a control room building (two storeys), a fuel tank farm (6 large tanks, which can be shot to leak, and ignited: a massive fire event), a workshop, a store, a gatehouse, and the Wardens' barracks (a prefab block). The Grom LMG sits on the control room roof behind sandbags.

Loot: Tier 5 (Warden loot, fuses for the lifeboat winch, engine parts, the patrol whiteboard intel). Wardens: 6 to 9 at raid start (one officer).

### 14.8.2 The Airfield

Location: (100, -560) to (300, -620). Elevation 30 m. A single 600 m tarmac runway on a flat, a small terminal hut, a hangar (with a light aircraft, wrecked, and an air ambulance helicopter, intact but unflyable: it's a landmark and a container), a fuel bowser, a windsock, and a fire tender garage.

Extraction: the Airfield Helipad (fixed, Night raids only: a Halcyon contact flies a light helicopter in at 20:00 raid time; or conditional for Standard raids: fire a green flare from the pad).

### 14.8.3 Other Moor POIs

The Wind Farm (6 turbines, three of them turning slowly, one collapsed; each has a base hut with a ladder up inside to the nacelle: climbable, a great lookout, terrible cover), the Golf Clubhouse (a small clubhouse with a bar and the pro shop; Tier 2), the Caravan Park (north coast, 40 static caravans, a shower block, the site shop, the barricaded caravan (part 02): Tier 1 to 2, the new-player area), the Distillery (Saltmarrow Distillery: the still house with copper pot stills, the warehouses of casks, the visitor shop, the manager's office with the Founder's Cask safe; Tier 4), the Water Treatment Works (tanks, a filter house, a pump room; Tier 2), Crofts (6 small farmhouses scattered on the moor; Tier 1), and the Peat Road (the single road across the moor from the High Street to the power station and the airfield, with a cattle grid, a bus shelter and a phone box).

## 14.9 THE ISLETS

### 14.9.1 Gannet Rock

A 40 m sea stack, 260 m southwest of the harbor mouth. Reachable by boat only (a small landing stage at the base, with a steep set of 140 steps cut into the rock and an iron handrail, and a cargo winch). On top: the lighthouse (a 22 m white tower with a red band, a spiral staircase, the lamp room with the lens prism, and a gallery around the outside), two keeper's cottages (Old Cormac's, with the diary, part 02), a fog signal house, a helipad (painted circle on concrete).

Role: an overwatch over the harbor and the west coast, and a self-contained loot spot for squads with a boat. Gannets nest everywhere (bird VFX and sound; the birds burst off the cliffs when anyone fires a shot within 100 m, which is a tell visible across the map).

Extraction: Gannet Rock Helipad (fixed, open all raid, but you have to get there by boat).

### 14.9.2 Kirk Holm

A low islet, 300 m long, 1 to 8 m elevation. The Victorian Quarantine Hospital (a ruined two-storey stone building around a courtyard, roofless in the east wing, with wards, a mortuary, a laundry), the graveyard (old and new graves, the mass grave with a cairn), the Sunken Chapel (half collapsed into subsided ground, its crypt flooding at Surge 1 and revealing a passage into the rock: a locked iron gate in v1, a seed for later), and a jetty.

Loot: Tier 3 to 4 (the hospital's old dispensary, Mother Agnes's contract items, salt deposits from the chapel crypt).

### 14.9.3 The Teeth (Tier 2)

Six rocky skerries 200 m north of the north coast. The largest (about 160 m × 90 m, up to 22 m elevation) holds LISTENER: a fenced compound with a barracks, an operations building with a radome on the roof, a generator shed, a helipad, a jetty, and the underground levels (the control room behind a blast door, the pump room, the Lantern Choir's arena). Wardens hold it: 8 to 12, with two officers.

The MV Orla Brae is beached across two other skerries, a 90 m cargo ship broken in half, with the bow on one rock and the stern on another and a gap of water between. The stern has the bridge (the captain's cabin with the safe, the chronometer), crew quarters and the engine room; the bow has the forward hold. Both holds flood at Surge 1. Hollows nest in them.

Getting there: by boat, or by swimming from the north coast (200 m in cold water: Cold buildup, currents, Drowners), or by a zip line (a rusty cable from the caravan park's clifftop to the largest skerry, left by previous salvagers; usable once per raid per player in Tier 2: a fun traversal moment, and you're very visible on it).

## 14.10 FLOOD BEHAVIOR PER DISTRICT

Part 15 has the Surge simulation. For the map, each zone has a flood profile: a function from (Surge phase, Surge direction) to water level. In the data, define for each zone: the base flood height per phase (Surge 1: +1.2 m, Surge 2: +2.4 m, Surge 3: +3.8 m at the most exposed point), a direction exposure table (8 directions, each a multiplier from 0.6 to 1.2: the cannery is most exposed to storms from the S, SE and E), and a delay table (the time after the Surge front passes until the zone reaches its peak).

The water level in a zone is uniform across the zone (one plane) in v1. That's a simplification: real floods have slopes. It's acceptable because zones are small (50 to 150 m), and neighboring zones with different levels meet at natural steps (sea walls, steps, slopes) where a level change looks plausible. Where zones meet without a natural step, use a hidden "spill" where the higher zone's water pours visibly over a low wall into the lower (a waterfall VFX). Part 15 covers the water rendering.

## 14.11 INSERTIONS (FULL MAP)

Eight insertion points. Squads spawn by boat landing (a 20 s cinematic of the boat arriving, then the players step off) or by walking in from the map edge (two land insertions). The server assigns insertion points to maximize the distance between squads.

| # | Name | Location | Type |
|---|---|---|---|
| 1 | West Slipway | Lifeboat station slipway | Boat |
| 2 | Terminal Fence | South edge of the marshalling yard | Boat (via the breakwater landing) |
| 3 | Cannery Jetty | Cannery | Boat |
| 4 | East Shore Noust | East End beach | Boat |
| 5 | Caravan Park Beach | North coast | Boat |
| 6 | Distillery Pier | North coast | Boat |
| 7 | Peat Road Checkpoint | Northwest moor, near the power station | Walk-in (from the mainland's old road ferry slip, fiction) |
| 8 | Airfield Hangar | West moor | Walk-in |

## 14.12 EXTRACTIONS (FULL MAP)

Part 16 lists every extraction with conditions and timing. Summary: Ferry Ramp (boat, scheduled), Cannery Jetty (boat, scheduled), Lifeboat Slipway (conditional: winch power), Breakwater Light (fixed, until Surge 2), Hilltop Flare (conditional: flare, graveyard, any time), Distillery Pier (boat, scheduled), Caravan Cliff Path (fixed, Calm and Lull phases only), Peat Road Checkpoint (fixed, all raid, but it's a long way from the loot), Airfield Helipad (Night, or flare), Gannet Rock Helipad (fixed), Kirk Holm Jetty (boat, scheduled), the Smuggler (conditional: pay 7,500 Scrip; a dinghy at a random cove among three; Nils's contact), LISTENER Helipad (Tier 2, conditional: the Warden officer's radio code).

## 14.13 BUILDING THE MAP IN UNREAL

### 14.13.1 World Partition

Use World Partition for the main map (`L_Saltmarrow`), with a grid cell size of 128 m and a loading range of 384 m for the main grid (the full playable area is small enough that, on the server, everything is loaded; World Partition matters for clients). Use Data Layers for: the Surge's flood-related content (debris washed up), the Night variant (lighting, extra props), the Tier boundary (in Tier 1, a data layer with the Harbourside-only boundary walls). Use One File Per Actor (OFPA), so you and the MCP tooling don't fight over one giant level file.

Server note: dedicated or listen server, the server must have the whole map loaded for AI and physics. World Partition's server streaming can be set to load everything (it's only a 1.4 km map). Verify the memory footprint on the host: target under 6 GB RAM for the full game client plus server on the host.

HLODs: build HLODs for distant views (World Partition HLOD layers: instanced for foliage and small props, merged/simplified for buildings). This is what makes the view from the church belfry render fast.

### 14.13.2 Terrain

The landscape: a single Landscape actor covering 2 km × 2 km (the playable area plus margin), with a heightmap authored to match this part's elevations (generate it procedurally from a few control splines and a noise layer, using the Landscape tools, then hand-sculpt the key areas: the harbor bowl, Kirkhill, the cliffs). Resolution: 1 m per vertex is plenty (2017 × 2017 or so, with World Partition landscape streaming proxies). Layers for the landscape material (part 26): grass, heather, peat, rock, shingle, sand, mud, tarmac, cobble, wet sand/kelp line. The sea is a separate Water plugin ocean (part 26).

Cliffs and rocks: use rock meshes (Nanite) from a free Megascans/Fab set or create them with the Modeling tools, scattered with PCG along cliff splines.

### 14.13.3 The modular building kit

Most of the town is built from a modular kit. The kit's grid: 50 cm. Wall modules 1 m, 2 m and 4 m wide, 3.0 m tall (ground floor of shops: 3.5 m). Floor/ceiling thickness 0.3 m. Door openings 1.0 m × 2.1 m. Window openings 1.0 m × 1.4 m and 1.4 m × 1.6 m. Stair modules: straight runs with 18 cm risers and 28 cm treads (real-world). Roof modules: 35°, 45° pitched slate, flat felt roof, corrugated iron. Wall materials: harled (white render), painted render (pastel colors: the classic fishing town palette of white, cream, pale blue, pale green, ox-blood, ochre), bare granite, red sandstone, brick (for the industrial buildings), corrugated metal, timber cladding. Every wall module has an inside and an outside face with separate materials, and real thickness (0.3 m for stone, 0.15 m for internal walls). Every module has simple collision (boxes), and correct physical materials for penetration (part 05).

Interior kit: skirting, door frames, doors (part 04's door actor), windows (frames, glass that breaks), fireplaces, kitchen units, bathroom units, shop counters, shelving.

House archetypes: define 12 house archetypes as Level Instances or Packed Level Actors built from the kit (2-up-2-down terrace, end terrace, detached cottage, villa, shop with flat, double shop, pub, harbor shed, net loft, church hall, croft, static caravan). Each archetype has variants (mirrored, different wall colors, different roof materials, a few window patterns). The terraces and the High Street are built from these. Hero buildings (the cannery, the bank, the hotel, the hospital, the terminal, the church, the police station, the power station, LISTENER, the Orla Brae) are custom builds using the same kit plus unique pieces.

Interiors: every enterable building has a full interior. Not every building is enterable: about 70% of houses are enterable (doors work, rooms dressed), 30% have locked doors and boarded windows (they're cover and backdrop). This keeps the scope sane while making the town feel dense. Never put an enterable-looking open door on a non-enterable building.

### 14.13.4 Procedural dressing with PCG

Use the PCG framework (Procedural Content Generation, production-ready in recent UE5 versions) for: foliage on the moor (heather, grass, gorse, bracken, rocks), kelp and seaweed along the high tide line and in the flood zones (static from the start; the dynamic post-Surge debris is spawned at runtime, part 15), litter and debris in streets (bins, bags, leaves, paper, broken glass), garden dressing (hedges, sheds, washing lines, flower beds gone wild), harbor clutter (lobster pots, nets, rope coils, crates, buoys), cars (abandoned car placement along streets with rules: parked along curbs, some crashed, doors open, 30% of them lootable), stone dykes on the moor (along splines), fences, telegraph poles and wires along roads (splines).

Interior dressing: also PCG-assisted. Define room types (kitchen, living room, bedroom, bathroom, office, shop floor, storage) with prop sets and placement rules (against walls, on surfaces, on the floor in the middle), and let PCG fill rooms from a room volume. Then hand-place story props (part 02's environmental storytelling) on top. Loot containers come from the room type's prop set (kitchen cupboards, bedside tables, desks), each with the right loot table (part 12). Loot spawn points are placed by the same rules.

Write a toolset (part 30, `MapAuthoringTools`) with functions to: stamp a house archetype at a transform, fill a room volume with a prop set, generate cover points (part 13), validate loot container density per zone, find unreachable loot (containers with no nav mesh within 1.5 m), find floating props (props not touching a surface), and run the sightline check from 14.4.9.

### 14.13.5 Scale validation

Before dressing anything, validate the blockout's scale by playing: jog the High Street (target time in part 04), walk through a cottage (doors should feel tight but not cramped: 1 m wide, ceilings 2.4 to 2.7 m in cottages, 3.5 m in shops and the bank), check every staircase with the movement system (no snagging, no camera clipping), and check that every window a player might shoot from has a sill height of 0.9 m (good for bipods and leaning). Use the mannequin and a measuring tool (place a 1.8 m reference figure and 1 m grid decals in the blockout).

## 14.14 MAP ACCEPTANCE TESTS

Every enterable building is fully navigable by the player's movement without getting stuck (an automated "walker" bot that traverses every nav mesh poly in a building and reports any position where the player capsule gets stuck for more than 3 s).

Every loot container is reachable and openable.

No position has line of sight to more than 2 insertion points (automated sightline test with traces).

Every extraction has at least 2 approach routes that don't share a chokepoint within 50 m.

The flood profile for every zone, for every Surge direction, produces water levels that never trap a player with no escape (every flooding room has an exit to higher ground or a stair, verified by a test that floods each zone to max and checks that every nav poly that becomes deep is connected to a dry poly by a path the player can use).

The full map renders the view from St. Brendan's belfry at 60 fps on the reference GPU on Medium (part 35).

---

End of part 14. Next: `15_THE_SURGE_WEATHER_DAY_NIGHT.md`.
