# SALTMARROW: PART 48, HIGH STREET AND KIRKHILL ROOM BY ROOM

The Tier 2 continuation of part 47: the hero buildings of the High Street and Kirkhill, room by room, with the same conventions (building-local coordinates, floor heights, containers with loot tables, story props, AI, cover, sightlines and flooding). The High Street is mostly above the flood line, so it's where squads go when Harbourside drowns, which makes it the busiest district in the second half of a raid. Kirkhill is the island's high ground: the church belfry sees everything, which makes the hill the most contested real estate on the map during the final Surge.

---

## 48.1 THE NORTHERN FISHERIES BANK

Building origin: world (-90, -35, 10.0). Footprint 16 × 22 m. Ground floor 4.2 m (a grand Victorian banking hall), first and second floors 3.2 m, basement (vault) at Z -3.6. Granite walls 0.6 m thick (impenetrable to anything but the Leviathan's AP at point blank). Windows: tall arched on the ground floor with iron bars (you can shoot through the glass, not climb through the bars), sash windows above.

### 48.1.1 Ground floor

Banking Hall (14 × 12 m): a marble floor, a high plaster ceiling with a dome skylight (cracked), the counter with bulletproof glass screens and four teller positions (the glass stops pistol rounds; rifle rounds crack it after 3 hits and break it after 6), a waiting area with leather benches, a tall clock stopped at 22:40, a brass plaque ("NORTHERN FISHERIES BANK, EST. 1871"), deposit slips scattered on the floor, the ATM lobby off the entrance (an ATM with its front panel pried open: empty). Containers: 4 teller drawers [LT_TellerDrawer: Mainland notes, coins], 1 waiting area bin, 1 leaflet stand. AI: 1 Shambler in a security guard's uniform at the door (memory point: "guarding").

Manager's Office (6 × 5 m, behind the counter): a mahogany desk, the letter to Margaret (N11), a family photo (a wife and two girls), the time lock release lever on the wall (pull it: 90 s delay, the alarm bell rings across the High Street for the whole delay plus the 4 minutes the vault stays open; part 14.5.1), a cabinet, a coat stand with his coat (a container: [LT_Coat: the NFB Vault Anteroom Key is here 40% of the time; otherwise on the manager Hollow in the vault]). Containers: desk [LT_Desk_Manager], cabinet [LT_Filing].

Back Office (8 × 6 m): desks, the cash drawer strongroom (a small walk-in room with a steel door, unlocked, with empty shelves and one locked cash box [LT_CashBox_Locked: shoot or pick]), filing cabinets (4), the vault timer instructions (N12) on the wall. Containers: 4 desks, 4 filing cabinets.

Staff Room and toilets: a kitchen, a table, lockers ×4 [LT_Locker_Office].

### 48.1.2 Basement (the vault)

Vault Anteroom (6 × 4 m): a barred gate (NFB Vault Anteroom Key) at the foot of the stairs, the safe deposit box wall (40 small boxes; 24 already forced open and empty, 12 closed and lootable [LT_DepositBox: jewelry, old coins, documents, rarely a pistol], 4 locked needing the key or lockpicks [LT_DepositBox_Rich]), two skeletons in salvager gear on the floor (an earlier crew: lootable bodies with old, low-durability gear [LT_OldSalvager]), scratch marks on the inside of the vault door.

The Vault (5 × 6 m, behind a 0.5 m round steel door): opened by the time lock. Inside: shelving with deposit crates and money bags [LT_Vault: the richest container set in the High Street: Scrip stacks, gold, the Old Coin Collection, a Gold Chain, valuables; a Legendary item 3%], the bank manager as a Hollow in a suit (a Shambler with +50% HP, "Donald Ross", carrying the Master Key 60% [opens the 4 rich deposit boxes]). The emergency handle on the inside (always usable). The vault floods to 0.3 m at Surge 3 (ground water).

Gameplay: the vault is a classic greed test. Pulling the lever announces you to the whole town for nearly six minutes. Squads who hear it race to the bank. The vault door closes after 4 minutes; the inside handle lets you out, but whoever is waiting in the banking hall knows exactly which door you'll come out of.

### 48.1.3 Upper floors and roof

First floor: regional offices (4 rooms, desks and filing [LT_Desk_Office]), a boardroom with a long table and portraits of past managers, the archive room (shelves of ledgers: barter paper, one note pool spawn). Second floor: archives, the plant room (boilers, water tank), roof access through a hatch. The roof: slate pitched with a flat lead walkway behind the parapet on the street side (cover, 0.9 m), and the dome over the banking hall (glass: fall through it 7 m onto marble). The roof sees the High Street east and west (200 m each way) and down Kirk Wynd to the harbor.

## 48.2 THE POLICE STATION

Building origin: world (-115, +30, 9.0). Footprint 14 × 18 m. Two floors (3.2 m each). Brick, with the blue lamp over the door (still works on battery: a blue glow at night).

Ground floor: Front Desk (a counter, a waiting bench, wanted posters, the "Lost and Found" box [LT_LostProperty]), Interview Rooms ×2 (a table, chairs, a tape recorder; one has an evidence bag on the table), Custody Suite (the custody desk with the record N13, two cells: Cell 1 empty, Cell 2 locked with Kenneth Mowat inside as a Hollow (he can't get out; he presses against the bars when players are near; he's killable through the bars; the cell key is at the custody desk if you want to open it, which is a bad idea but the loot is a notebook with a lifeboat sketch)), the Evidence Store (a caged room, locked: key in the sergeant's desk upstairs; inside [LT_Evidence: confiscated items: drugs (barter: medical), a few weapons, ammo, cash; and the council minutes for CAP16 in the evidence safe, which needs the code from the Captain's contract]), the Armory (a steel-doored room, open and raided: empty racks, ammo boxes torn open, a body; the hidden cache behind the loose panel on the back wall: an interaction "Inspect loose panel", 3 s, revealing [LT_ArmoryCache: the Harbormaster pistol, 2 mags, .45 ammo, a Police Riot Helmet]), the locker room (lockers ×8 [LT_Locker_Police: police armor 15%, pepper spray (barter), uniforms (barter fabric)]).

First floor: the CID office (desks, a case board with photos and string about "LANTERN contractors' vans", filing [LT_Filing]), the sergeant's office (the memo N14, the evidence store key in the desk [LT_Desk_Police]), the radio room (a radio set, a map of the island with patrol beats), a kitchen, a cell for drunks (empty, comfy).

During Surge 2, Wardens retreating from the town fall back to the police station (3 to 4 Wardens: part 43.8), so it becomes a fortified position late in the raid.

## 48.3 THE HALDANE ARMS HOTEL

Building origin: world (-60, -205, 13.0). Footprint 20 × 40 m. Basement (Z -3.0), ground floor (Z 0, 4.0 m: grand), first and second floors (Z 4.0 and 7.2, 3.2 m each), third floor (Z 10.4, 2.8 m: staff, under the roof). Victorian sandstone with bay windows.

### 48.3.1 Ground floor

Lobby (10 × 12 m): a revolving door (jammed half open: you squeeze through one at a time, a chokepoint), a reception desk with key pigeonholes (keys for rooms 101 to 215: some room doors are locked and need their key from the pigeonholes, a lovely small puzzle: 30% of room keys are present), a brass luggage trolley, a chandelier (shootable: it falls, 30 damage in a 2 m area, very loud), a grand staircase to the first floor, a lift (stuck between floors: the lift shaft is climbable via the maintenance ladder, a secret route between floors). Containers: reception desk [LT_Desk_Reception], a luggage room behind it with 8 suitcases [LT_Luggage_Large].

The Laird's Bar (8 × 10 m): leather armchairs, a long bar, a fireplace, whisky (the Saltmarrow 12 Year 25% per bar spawn), the bar radio (TOM20), stag heads, a piano. Containers: 3 bar cupboards [LT_Bar_Hotel], a till.

The Restaurant (12 × 10 m): tables set for dinner, a sideboard with silver (valuables), a dumbwaiter to the kitchen (a tiny shaft: items only). Containers: 2 sideboards [LT_Sideboard].

The Kitchen (10 × 8 m): commercial ranges, a walk-in fridge and freezer (food), knives, the back door to the service yard. Containers: 4 kitchen cupboards [LT_Kitchen_Commercial].

The Ballroom (14 × 16 m, double height 6 m with a gallery at 4 m): parquet floor, mirrored walls (shootable glass: shards everywhere), a bandstand, chairs stacked against the walls, the Laird's Portrait on the end wall (3×3, heavy, NIL11, a once-per-raid spawn), and the gallery (reached from the first floor) overlooking the floor: a fighting space with vertical play. AI: 3 Shamblers in evening wear on the dance floor (memory point: "dancing": they sway together), 1 on the bandstand.

### 48.3.2 Guest floors

First floor rooms 101 to 115 and second floor 201 to 215: each 4 × 5 m with an ensuite (2 × 2 m): a bed, a wardrobe, a desk, a TV, a minibar, a room safe (open and empty 60%, locked 40%: codes on notes in the room or the housekeeping office), a bathroom cabinet. Containers per room: 4 to 6 [LT_HotelRoom]. Room types: standard (24), sea view (4: overlooking the harbor, the best windows for sniping the quay from 200 m), suites (2: 104, 204, double size with a sitting room). Six rooms have story details (a packed suitcase never taken, a honeymoon couple's champagne, a child's toys, a businessman's laptop bag with Ministry letterhead, a birdwatcher's binoculars and log, a room barricaded from inside with a skeleton in the bath). Room 214: Dr. Strand's (part 02, N15 to N17): jars of salt on the windowsill (glowing faintly), notebooks, a cold room (the window is open, rain comes in), the safe (code from her notebook page 1: the date of sample 7's extraction, "0331"), with the Strand Briefcase (NIL02) and notebook page 2.

The housekeeping office (first floor): a desk, the housekeeping note (N15), a key board, linen cupboards [LT_Linen: barter fabric].

### 48.3.3 Third floor and basement

Third floor: staff bedrooms (6 small rooms, [LT_StaffRoom]), the manager's flat (a living room, a bedroom, an office with the hotel safe [LT_Safe_Hotel], a balcony on the roof with a view across the whole High Street west end and the lifeboat station). Basement: the wine cellar (racks of wine and whisky: valuable and heavy, [LT_WineCellar]), the laundry (machines, linen), the boiler room (barter), a coal cellar with a chute to the service yard.

Flooding: never (13 m), except the basement takes 0.2 m at Surge 3.

## 48.4 HIGH STREET SHOPS (THE REST)

Fraser's Pharmacy (8 × 12 m, flat above): shop floor with shelves (painkillers, bandages, toiletries barter) [LT_Pharmacy_Shop ×4], the dispensary behind a locked door (the pharmacist's key in the flat above, or lockpicks) [LT_Pharmacy_Dispensary: antibiotics, insulin 20%, morphine 10%, surgical kit 5%], the delivery slip (N19). Upstairs: the dentist's surgery (a chair, instruments, gold teeth in a jar [LT_Dentist]) and the pharmacist's flat.

The Post Office (10 × 12 m): a counter with grilles, a sorting room with parcels (each a small container [LT_Parcel]: random items from the Mainland, mostly junk, occasionally rare), a safe [LT_Safe_Small], postboxes (2: open them with a screwdriver interaction for letters: notes pool).

The Heritage Centre (16 × 14 m, two floors): galleries with glass cases (break them, loud): the fishing gallery (old tools, ship models), the whaling gallery (the harpoon display), the coin collection case, the listening station exhibit (N20), a gift shop (postcards, tea towels and puffin plushes, all lootable as a barter "Souvenir" item, since charms never drop in raids), a basement store of uncatalogued objects (crates [LT_Museum_Store: antiques]).

The Kittiwake (12 × 14 m, two floors): the tourists' pub. A lounge bar, the beer garden at the back with a view down to the harbor (a terrace with picnic tables and a low wall: an excellent firing position over the quay), the function room upstairs (quiz night: N18), the landlord's flat. Containers: bar ×3, till, function room cupboards, flat ×5.

Lowrie's Supermarket (24 × 30 m, single floor with a stockroom and an office): aisles (6 aisles of shelving at 1.8 m, full sightlines down each aisle, crossing gaps at the ends and middle), checkout tills (4), a deli counter, a frozen section (dead freezers, terrible smell), the stockroom (pallets, a loading bay), the office (the staff rota N22, a safe). Containers: shelving units (lots: 24 [LT_Shelf_Grocery: food, drink, batteries, barter]), tills [LT_CashBox], stockroom pallets [LT_Pallet_Grocery], office safe. A great close-quarters arena.

Brodie's Hardware (10 × 14 m, a yard behind): tools, paint, rope, nails, bolts, duct tape, fuel cans, a key-cutting machine (flavor), the rival dead drop (NIL03) behind a loose floorboard. Containers: 8 shelf units [LT_Hardware], a yard shed.

The Bookies (6 × 10 m): screens, betting slips, the board (N21), a safe [LT_Safe_Small].

Butcher (6 × 10 m): a counter, a cold room with hooks (a horror beat: hanging carcasses, and one of them is a Hollow that drops when you pass), a chopping block with a cleaver in it (set dressing: melee is the knife only in v1).

Others (each 6 × 10 m with a flat above, 4 to 8 containers each): the Bakery, the Charity Shop, the Library (notes pool, a reading room), the Solicitor's Office (documents, a safe: deeds and a will that's a lore seed about the Haldanes), the Newsagent (newspapers dated 14 November with the headline "SEVERE WEATHER WARNING: ISLANDS BRACE FOR STORM"), the Hairdresser, the Launderette and a cafe, "The Copper Kettle".

The flats: every shop has a flat above with 3 to 5 containers [LT_Flat_*], and every flat has one story detail from the set of 20 (part 47.5).

## 48.5 ST. BRENDAN'S CHURCH

Building origin: world (110, -55, 74.0). Nave 10 × 24 m (east-west), chancel 8 × 8 m at the east end, vestry 4 × 5 m on the north side of the chancel, tower 6 × 6 m at the west end rising to the belfry at Z 18 (92 m above datum) and a spire to Z 32. Crypt under the chancel (Z -3.0).

### 48.5.1 Rooms

The Nave: pews in rows (wooden: penetrable cover, 1.0 m), a central aisle, stone columns (cover), tall stained glass windows (break them for firing positions: they're the best way to watch the hill paths), the font, the refuge clutter from the first Surge (sleeping bags on pews, candles in jars, water bottles, a camp stove, a board by the door with the refuge list N23). Containers: 6 refuge piles [LT_Refuge: food, water, blankets, medical basics].

The Chancel: the altar (the communion silver in a locked aumbry (a small wall cupboard): key in the vestry) [LT_Aumbry: the Silver Communion Cup], the choir stalls, the organ (playable: an interaction that plays a chord, audible across Kirkhill: why not; it's a noise event).

The Vestry: Mother Agnes's old office: a desk with her notes (N24), robes on hooks, a filing cabinet with parish records, a kettle, a photo of a younger Agnes with a man (her late husband), the aumbry key on a hook. Containers: desk, cabinet [LT_Vestry].

The Tower: a narrow stone spiral stair (1 m wide: one person at a time, deadly to fight on) to the ringing chamber (the bell ropes, Peter's note N25, the barricade of pews and planks at the top of the stairs: breaking it takes 4 melee hits or a shotgun blast) and up a ladder to the belfry (the bell frame with three bells, louvred openings on all four sides: firing positions with 360° views over the entire island and all three islets). The bell can be rung from the ringing chamber (AGN14; a whole-map noise event).

The Crypt: reached by steps behind the altar: old tombs, the dry refuge supply stash (water, food, a medical kit) [LT_Crypt_Stash], and a locked iron grille to a deeper vault (a Tier 3 seed).

### 48.5.2 Gameplay

The church is the safe high ground during the Surge (it never floods), the best overwatch on the map (the belfry), and the end-of-raid magnet: the Hilltop Flare extraction (E5) is in the graveyard below, and squads fleeing the floods come up the hill. Approaches: Kirk Wynd and the Brae from the High Street (steep, walled, with garden cover), the graveyard paths from the east (gravestones as cover), the moor track from the north (open, long sightlines), and the manse garden from the south (hedges). The tower's stair is the deadliest chokepoint in the game.

## 48.6 THE MANSE, THE GRAVEYARD AND THE HILL HOUSES

The Manse (12 × 14 m, two floors and an attic): Mother Agnes's old home. Ground: the hall, the study (her late husband's: books, a desk, a globe, the gun cabinet with the Tern lever action 25% [LT_GunCabinet_Manse], key in the study desk), the sitting room, the kitchen (the calendar N28), a scullery. Upstairs: three bedrooms (one kept as it was, with a man's clothes still in the wardrobe), a bathroom. The attic: boxes of parish history (barter paper, a note pool spawn). The garden: overgrown, with a greenhouse (broken glass) and a shed.

The Graveyard (80 × 60 m on the hill's east slope): gravestones in rows (cover, 0.6 to 1.4 m), table tombs (full cover), Celtic crosses, a lych gate, the Haldane Mausoleum (a small stone building with an iron door: Haldane Mausoleum Key [LT_Mausoleum: the family's grave goods, valuables, the rubbing N26]), the E5 flare zone marked by an old flagpole at the top.

The Hill Houses (6 Victorian villas, each 12 × 14 m, two floors, garden): Haldane House (the cannery owner's: the largest, with a study, a gun room [LT_GunRoom: a shotgun 50%, a rifle 20%, ammo], a cellar [LT_Cellar_Rich]: Tier 4), the doctor's house (Dr. Moar: a surgery room with medical [LT_Surgery_Home], the case notes N27), the schoolteacher's house (books, children's work), two holiday lets (sparse, tourist belongings), and a B&B (4 guest rooms).

## 48.7 THE WYNDS AND STREET FURNITURE

Each wynd (part 14.5.5) is built as a stepped alley with a specific character: Kirk Wynd (the widest, 3 m, with a handrail and a mid-landing with a bench: the main pedestrian route from the harbor to the church), Fish Wynd (narrow, 2 m, steep, slippery-looking cobbles, cottage back doors), Cooper's Steps (a long straight flight of 80 steps with a view straight down to the cannery: a long, exposed sightline), Mercat Close (a covered passage under a building for 8 m, then steps: dark, an ambush spot), and Tolbooth Steps (a dogleg with a high wall).

Street furniture across the High Street (all with physical materials and collision): a red phone box (enterable: it's glass), a bus stop with a shelter and a bus (enterable, seat pockets), the war memorial in the small square at the street's center (a stone cross on a plinth: cover), benches, bins, bollards, a post box, lamp posts, a parked post van (lootable: parcels), abandoned cars (12), a cash machine, shop signs (some hanging by one bracket, swinging in the wind), Christmas lights strung across the street (unlit, never taken down: it was November).

## 48.8 HIGH STREET AND KIRKHILL LOOT ZONES

| Zone | Contents | Tier |
|---|---|---|
| HST_West | Hotel, museum, lifeboat brae end | 4 |
| HST_Central | Bank, police, post office, pharmacy, square | 4 (vault 5) |
| HST_East | Kittiwake, Lowrie's, hardware, bookies, butcher | 3 |
| HST_Wynds | The five wynds and their back gardens | 2 |
| KH_Church | Church, tower, crypt | 3 |
| KH_Graveyard | Graveyard, mausoleum | 3 |
| KH_Houses | Manse, Haldane House, villas | 3 (Haldane House 4) |

AI at raid start: the High Street has 8 to 10 Shamblers spread through the buildings (memory points: at shop counters, at the bus stop, at the war memorial), 2 Crawlers in Lowrie's stockroom, 1 Wailer on the hotel's third floor 30%, the bank guard and the bank manager, Kenneth Mowat in his cell. Kirkhill: 3 Shamblers in the graveyard (standing at specific graves), 1 in the church (in a pew, praying pose), none in the tower (Peter's note: "they don't come up").

During Surges, Hollows from the flooded districts climb the wynds toward the High Street (wave spawns at the wynds' lower ends, pushing up), so the wynds become dangerous in the second half of a raid.

## 48.9 HIGH STREET LIGHTING AND SOUND NOTES

The square's Christmas lights flicker on during power surges from the power station (a scripted moment: once per raid, for 30 s, the lights come on, and then go off: a gorgeous, eerie beat, and it lights everyone in the square). The bank's alarm bell (when the vault is opened) and St. Brendan's bells are the two loudest "player-caused" sounds in the game. Shop signs creak in the wind. The phone box's light buzzes. The hotel's chandelier tinkles when the wind blows through the broken revolving door.

---

End of part 48. Next: `49_EAST_END_MOOR_ISLETS_ROOM_BY_ROOM.md`.
