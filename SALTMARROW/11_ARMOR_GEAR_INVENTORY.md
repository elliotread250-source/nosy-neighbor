# SALTMARROW: PART 11, ARMOR, GEAR AND THE INVENTORY

The inventory is where the player spends a third of their time in the raid and half their time out of it. It's where greed becomes physical: a backpack has room for exactly so much, and a rifle takes up four cells you could fill with salt. Build it in C++ as a server-authoritative grid system with a fast, beautiful UMG front end. Then make it feel like Tetris played with treasure.

---

## 11.1 THE EQUIPMENT SLOTS

A character has these equipment slots. Each slot holds one item of the matching category.

| Slot | Holds | Visible on character | Notes |
|---|---|---|---|
| Primary (back) | Long gun | Yes, slung on back | Draw time 0.9 s from back |
| Secondary (sling) | Long gun | Yes, on the front sling or across the back | Draw time 0.6 s |
| Holster | Handgun | Yes, on the hip or chest rig | Draw time 0.35 s |
| Melee | Knife | Yes, on the rig or belt | Fixed item (salvager's knife or cosmetic variants) |
| Helmet | Helmet | Yes | Head armor |
| Face | Face shield, gas mask, goggles, balaclava-armor | Yes | Some helmets block this |
| Ears | Headset | Yes | Hearing amplification (11.3.3) |
| Body Armor | Armor vest or plate carrier | Yes | |
| Rig | Chest rig or belt | Yes | Holds magazines and small items in its grid |
| Backpack | Backpack | Yes | The main storage |
| Pockets | 4 × 1×1 cells | No | Every character has these |
| Secure Pouch | Secure container | No | Never lost |
| Radio | Radio (fixed) | Small, on the shoulder strap | Fixed, never lost |
| Compass | Compass (fixed) | No | Fixed, shows heading on HUD when held |
| Quick slots | 1 to 6: references to items in the rig/pockets | No | Bindings, not storage |

Some armor items combine slots: a plate carrier with integrated pouches is both Body Armor and Rig (it fills both slots and blocks a separate rig). Some helmets have integrated ears or face shields. That's a classic genre tradeoff, and it works through the same slot-block system as the gunsmith (tags).

## 11.2 BODY ARMOR AND HELMETS CATALOG

Mechanics are in part 05. Here are the items. Durability is in points. Movement penalty applies to jog and sprint speed. Turn penalty reduces max turn rate (mouse look is never slowed; this affects body turning only). Ergo penalty is subtracted from weapon ergonomics while worn.

### 11.2.1 Body armor

| ID | Name | Class | Coverage | Material | Durability | Weight | Move | Turn | Ergo | Blunt | Size | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ARM_Hiviz ★ | Ferry Crew Hi-Vis Vest (padded) | 1 | Thorax | Aramid | 20 | 1.2 | 0 | 0 | 0 | 0.40 | 3×3 | 3,000 | C |
| ARM_PoliceSoft ★ | Saltmarrow Police Stab Vest | 2 | Thorax, Stomach | Aramid | 35 | 2.4 | -1% | 0 | -1 | 0.35 | 3×3 | 12,000 | C |
| ARM_Lifeboat | Lifeboat Crew Flotation Armor | 2 | Thorax | Aramid | 30 | 2.1 | -1% | 0 | -1 | 0.35 | 3×3 | 14,000 | U | Floats: +0.08 buoyancy (part 04) |
| ARM_Surplus3 | Surplus Flak Jacket | 3 | Thorax, Stomach, Upper Arms | Aramid + steel inserts | 45 | 5.8 | -5% | -6% | -4 | 0.30 | 3×3 | 22,000 | C |
| ARM_CDSPlate3 ★ | CDS Low-Vis Plate Carrier (L3) | 3 | Thorax | UHMWPE | 40 | 3.6 | -2% | -2% | -2 | 0.28 | 3×3 | 28,000 | U | Has a small integrated rig (2 mag pouches) |
| ARM_CDSPlate4 | CDS Plate Carrier (L4) | 4 | Thorax, Stomach | Ceramic | 50 | 6.9 | -4% | -4% | -4 | 0.24 | 3×3 | 52,000 | R |
| ARM_WardenCuirass | Warden Cuirass | 4 | Thorax, Stomach | Steel | 70 | 10.2 | -8% | -8% | -6 | 0.22 | 3×4 | 46,000 | R | Heavy, cheap to repair, loud (creak) |
| ARM_VMWHeavy5 | VMW Assault Armor (L5) | 5 | Thorax, Stomach, Arms | Ceramic + titanium | 75 | 12.5 | -10% | -10% | -8 | 0.20 | 4×4 | 96,000 | E |
| ARM_Lantern6 | LANTERN Response Armor (L6) | 6 | Thorax, Stomach | Composite | 85 | 11.0 | -8% | -7% | -6 | 0.18 | 4×4 | raid only | L |
| ARM_DiverVest | Commercial Diver's Harness | 1 | Thorax | Aramid | 15 | 1.8 | 0 | 0 | 0 | 0.40 | 3×3 | 18,000 | U | -50% swim speed penalty from weight; sinks you less |

### 11.2.2 Helmets

| ID | Name | Class | Coverage | Ricochet | Durability | Weight | Ergo | Hearing | Face slot | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|---|
| HLM_Hardhat ★ | Cannery Hard Hat | 1 | Top | 10% | 15 | 0.4 | 0 | 0 | open | 2,000 | C |
| HLM_Lifeboat | Lifeboat Crew Helmet | 2 | Top, Back | 20% | 25 | 0.9 | 0 | -5% | visor (Class 1) | 9,000 | U |
| HLM_Police | Police Riot Helmet | 2 | Top, Back, Ears | 15% | 30 | 1.4 | -1 | -25% | face shield (Class 2, can be flipped) | 14,000 | C |
| HLM_SurplusSteel | Surplus Steel Pot | 3 | Top, Back | 35% | 40 | 1.5 | -1 | 0 | open | 12,000 | C |
| HLM_CDSHighCut ★ | CDS High-Cut Ballistic | 3 | Top, Back | 30% | 32 | 1.0 | 0 | 0 (allows headset) | NVG mount, face rail | 31,000 | U |
| HLM_CDSFull | CDS Full-Cut Ballistic | 4 | Top, Back, Ears | 25% | 40 | 1.4 | -1 | -15% | NVG mount | 48,000 | R |
| HLM_WardenSallet | Warden Sallet (welded) | 4 | Top, Back, Ears, Face (partial) | 45% | 55 | 2.6 | -3 | -30% | integrated slit visor | 39,000 | R |
| HLM_VMWAssault | VMW Assault Helmet with Visor | 5 | Top, Back, Ears, Face | 20% | 50 | 3.4 | -4 | -35% | integrated visor (Class 4) | 92,000 | E |
| HLM_Diving | Commercial Diving Helmet | 2 | Full head | 40% | 30 | 4.8 | -6 | -60% | integrated | 60,000 | E | 120 s air underwater; very slow, very funny, very Night raid |

### 11.2.3 Face and ears

Face: Shooting Glasses (protects from flashbang 30%, cosmetic tint), Ballistic Goggles (flashbang 50%, Class 1 eyes), Gas Mask (immune to smoke coughing, salt sickness from Bloats reduced 70%, breathing sound, narrows FOV vignette by 8%), Armored Balaclava (Class 1 face and jaw), Welder's Mask (Class 2 face, -25% FOV vignette; salvage meme).

Ears (headsets): Fairweather Ear Defenders (reduce gunshot loudness for you by 40%, reduce footstep hearing by 10%: a comfort item), CDS Comtac-style Headset (amplifies footsteps and quiet sounds by 35%, compresses loud sounds: the competitive item), VMW Headset (amplifies 20%, cheaper, a little hiss), Sparks's Custom Set (Tier 3 reward: amplifies 40%, plus shows a faint direction indicator for gunshots within 100 m in the HUD compass).

Headsets matter because sound matters (part 28): with a good headset, you hear the creak upstairs.

## 11.3 RIGS AND BACKPACKS

Rigs and backpacks are containers: items with their own internal grids. A rig's grid is accessible fast (magazines and quick slots come from it), a backpack's is slower (reloading or using items from it takes +1.5 s).

### 11.3.1 Rigs

Rigs don't have a single rectangle grid; they have a layout of small grids (pouches), each 1×1, 1×2, 2×2, etc., in a defined arrangement that matches the rig's visual pouches. That's exactly how Tarkov does it and it makes rig choice interesting: a rig with six 1×2 pouches is perfect for rifle magazines, and useless for a 2×2 medkit.

| ID | Name | Layout | Cells | Armor | Weight | Size | Price | Rarity |
|---|---|---|---|---|---|---|---|---|
| RIG_Belt ★ | Salvager's Belt | 1×2, 1×2, 1×1, 1×1 | 6 | none | 0.6 | 2×2 | 2,500 | C |
| RIG_FishingVest | Fishing Vest | 1×1 × 8, 2×1 × 2 | 12 | none | 0.8 | 2×3 | 4,800 | C |
| RIG_Chest6 ★ | CDS Chest Rig (6 mag) | 1×2 × 6, 1×1 × 4 | 16 | none | 1.4 | 3×3 | 14,000 | U |
| RIG_AKChest | VMW Chicom-pattern Chest Rig | 1×2 × 3, 1×1 × 4, 2×2 × 1 | 14 | none | 1.1 | 3×2 | 9,500 | C |
| RIG_Medic | Medic's Bandolier | 1×1 × 4, 2×2 × 2 | 12 | none | 1.0 | 2×3 | 12,000 | U | Medical item use time -20% when stored here |
| RIG_Shotgun | Shell Bandolier | 1×1 × 10 (shells only) | 10 | none | 0.7 | 2×2 | 5,500 | C | Shotgun reloads from here -15% time |
| RIG_Plate (integrated) | (CDS Plate Carrier L3's built-in rig) | 1×2 × 2, 1×1 × 2 | 6 | (from armor) | | | | | |
| RIG_Warden | Warden Battle Belt | 1×2 × 4, 1×1 × 4, 2×2 × 1 | 16 | none | 1.6 | 3×3 | 21,000 | R |
| RIG_LanternRig | LANTERN Response Rig | 1×2 × 6, 1×1 × 6, 2×2 × 2 | 26 | none | 2.4 | 3×4 | raid only | L |

### 11.3.2 Backpacks

Backpacks have one or more rectangular grids. Bigger backpacks are heavier, louder (gear rattle), more visible (silhouette), and they slow your swim (part 04). Wearing a big backpack also blocks wearing a long gun on the back slot comfortably: with packs flagged "Large", the Primary weapon is slung on the side instead, which takes longer to draw (+0.3 s).

| ID | Name | Grids | Total cells | Weight | Size (folded) | Flags | Price | Rarity |
|---|---|---|---|---|---|---|---|---|
| BAG_Sling ★ | Canvas Sling Bag | 3×3 | 9 | 0.4 | 2×2 | | 2,800 | C |
| BAG_School | Schoolbag (Saltmarrow Primary) | 4×4 | 16 | 0.6 | 3×3 | | 4,200 | C | (a small gruesome detail: it has a name tag) |
| BAG_Daypack ★ | Tidewater Daypack | 4×5 | 20 | 0.9 | 3×3 | | 9,500 | C |
| BAG_Fishing | Fisherman's Kit Bag | 5×5 | 25 | 1.4 | 4×3 | | 14,000 | U | Waterproof: items inside don't get waterlogged |
| BAG_Assault | CDS Assault Pack | 5×4, 2×2 side pouches × 2 | 28 | 1.6 | 4×4 | | 26,000 | U |
| BAG_Hiking | Tidewater 60L Hiker | 6×6, 2×3 lid | 42 | 2.3 | 5×4 | Large | 38,000 | R |
| BAG_Military | VMW Raid Pack | 6×7, 2×2 × 2 | 50 | 3.1 | 5×5 | Large | 52,000 | R |
| BAG_Salt | Salt Hauler's Frame Pack | 7×8 | 56 | 3.8 | 5×6 | Large, Loud | 68,000 | E | Marrow Salt items take 50% less space when inside (packed tight) |
| BAG_Dry | Waterproof Dry Bag | 4×6 | 24 | 0.8 | 3×3 | Floats | 22,000 | R | If dropped in water it floats instead of sinking; waterproof |

### 11.3.3 The secure pouch

| Level | Size | How |
|---|---|---|
| Waist Pouch | 2×2 | Default |
| Lockbox | 3×3 | Halcyon Locksmith station level 2 |
| Strongbox | 3×4 | Locksmith level 3 |
| Captain's Strongbox | 4×4 | Captain's contract line finale |

Can hold: anything 2×2 or smaller that isn't a weapon, armor, rig, backpack, or a "Hot" item (some contract items and the biggest salt cores are flagged Hot: they can't go in the secure pouch, so you have to carry them in the open). That rule makes contract items and big salt a real risk.

## 11.4 THE GRID INVENTORY MODEL

### 11.4.1 Items in grids

Every item has a size in cells (W×H) and can be rotated 90° (R while dragging). Items occupy a rectangle in a grid. Grids are W×H arrays of cells. A cell holds a reference to the item occupying it.

Items that are containers (backpacks, rigs, cases, weapons with magazines, magazines with rounds) hold their own contents. A backpack in your stash with items inside is still a backpack-with-items. You can put a backpack inside a bigger backpack only if the inner backpack is empty (like Tarkov), except for small cases designed for it (item cases, ammo cases, medical cases: specific container items that fit inside bags and hold specific item categories, which become important for stash organization).

Stackable items (ammo, Scrip, some materials, some consumables) stack up to a max per cell: ammo 60 per stack for rifle rounds, 100 for pistol rounds, 25 for shotgun shells, Scrip 50,000 per stack, salt crystals 10 per stack (small ones only). Stack splitting with Shift-drag or a split dialog.

### 11.4.2 Data model

```cpp
USTRUCT() struct FSMItemInstance
{
    FGuid InstanceId;               // server-issued, globally unique
    FPrimaryAssetId DefinitionId;   // item definition
    int32 StackCount = 1;
    float Durability = -1.f;        // -1 = n/a
    uint8 Flags;                    // FoundInRaid, Shakedown, Hot, Insured(reserved), Locked
    FSMItemCustomData Custom;       // weapon config, magazine contents, uses remaining, key id, note id etc. (variant)
    TArray<FSMItemHistoryEvent> History; // last 10 events (stored on backend, not replicated in raid)
};

USTRUCT() struct FSMGridPlacement
{
    FGuid InstanceId;
    FGuid ContainerId;              // which container's grid (the item that owns it)
    uint8 GridIndex;                // which grid in the container (backpacks can have several)
    uint8 X, Y;
    bool bRotated;
};
```

The inventory component (`USMInventoryComponent`) on the character owns the equipment slots and the item instances in them (recursively: the backpack instance, its contents, their contents). The server holds the truth. The owning client gets the full inventory replicated (with a fast array serializer, `FFastArraySerializer`, for efficient delta updates). Other clients only get equipment slot visuals (what the character is wearing and holding), never the contents.

### 11.4.3 Operations

All inventory operations are server RPCs from the client, predicted locally for responsiveness (the item moves in the UI immediately, greyed slightly until confirmed, and snaps back if the server rejects it, which should almost never happen because the client runs the same validation).

Operations: Move (item from placement A to placement B), Rotate, Split stack, Merge stack, Equip (to a slot), Unequip, Drop (to the world, spawns a pickup actor), Pick up (from the world), Transfer (from a world container or body to your inventory, and back), Use (consumables), Load ammo into magazine, Unload magazine, Discard (only out of raid: destroy an item, with confirmation), Examine (unknown items must be examined once to reveal their name and stats: a 1 to 4 second timer the first time you see an item type ever, account-wide; that's a Tarkov feature and it makes discovering items more special. Optional setting to skip it in the first 10 raids for onboarding).

Every operation is validated: the item exists and is owned by the requester (or in a container the requester has open and is within reach of), the target placement is free and fits, the item is allowed in the target container (category rules), the item is allowed in the target slot (equipment rules), the requester isn't dead or downed, and for operations from the world, the distance and line of sight checks pass.

### 11.4.4 Speed in the raid

In the raid, moving items between containers isn't instant:

Within your own inventory (pockets, rig, backpack): instant, but the character can't sprint while the inventory screen is open, and walking speed is capped at walk speed.

From a world container or body to your inventory: instant for items already searched (revealed), but searching reveals items one by one (part 03).

Quick-move (Ctrl+click): moves an item to the best free place (rig, then pockets, then backpack for small items; backpack first for large).

Loading magazines: 0.4 s per round (part 05), during which the inventory screen stays open and the player can move slowly.

Using a medical item from the inventory screen: the use time applies, and the inventory closes during use unless "Keep inventory open while healing" is enabled.

### 11.4.5 Found in Raid

Items picked up in a raid and extracted get the "Found in Raid" (FiR) flag, shown with a small checkmark icon. Some contracts require FiR items ("Hand over 3 Found in Raid bandages"), which stops players just buying them. Items bought from traders don't have it. Items you brought in and extracted with keep whatever flag they had. Shakedown loot is flagged Shakedown instead.

## 11.5 THE STASH

The stash is the player's persistent storage between raids, a big grid (10 columns × 40 rows at start, expanding with the Halcyon's Stores station upgrades to 10 × 60, 10 × 80, 10 × 100 and 10 × 120). It lives on the backend.

Stash rules: items in the stash can be organized freely (no time cost). Containers (cases) inside the stash hold items and help organization. Sorting: an "Auto-sort" button sorts by category then size (with a confirmation, since it scrambles a carefully arranged stash). Search: a text search filters the grid (highlights matches, dims the rest). Filters by category tabs (Weapons, Attachments, Ammo, Armor, Gear, Medical, Food, Valuables, Salt, Keys, Notes, Barter).

Stash sync: every stash operation calls the backend (`PATCH /v1/stash` with a list of operations and the stash's current version number for optimistic concurrency, part 20). The client applies the change immediately and rolls back on rejection. Operations batch: drag ten items in two seconds and it sends one request with ten operations after a 300 ms debounce.

## 11.6 LOOTING BODIES AND CONTAINERS

### 11.6.1 Containers

World containers are actors with a `USMLootContainerComponent`: a grid definition (size), a loot table reference (part 12), a search time multiplier, a lock (optional), a sound set (opening, rummaging), and a "searched by" set (which players have revealed which items; search state is per player for UI, but contents are shared: if one player takes an item, it's gone for everyone).

Interaction: Interact to open (plays the open animation on the container: drawer slides out, locker door swings, crate lid lifts), which opens the loot UI side by side with the player's inventory. Items reveal one by one with a search sound (each item takes 0.4 to 1.2 s to reveal, scaled by item size, and a "magnifying glass" icon spins on unrevealed cells). Closing the UI pauses the search. Other players opening the same container see items already taken as gone and their own search progress separately.

Container types (with their typical loot tables): Drawer, Filing Cabinet, Desk, Locker, Toolbox, Crate (small, medium, large), Medical Cabinet, Fridge, Safe (locked, high value), Cash Register, Weapon Locker (locked), Ammo Box, Duffel Bag, Jacket (hanging coat, pockets), Car Boot, Car Glovebox, Fish Crate, Bin, Suitcase, Bedside Table, Kitchen Cupboard, Display Case (glass: break to open, loud), Wardrobe, Salt Deposit (special: harvested, part 12), Flotsam (washed up after a Surge), Supply Cache (Halcyon dead drops for contracts).

### 11.6.2 Bodies

Dead players and AI become bodies with a lootable inventory: the equipment slots (shown as a doll layout) plus the contents of their rig, backpack and pockets (not their secure pouch). Searching a body is faster than a container (0.3 s per item) because it's organized. You can take equipment straight off the body (drag the backpack to your back slot if empty, or into your backpack), which is the classic "swap backpacks" move.

Bodies are ragdolls that settle, then freeze (switch to a static pose) after 3 seconds to save physics cost. They persist all raid. They don't despawn. In water, they float (if lighter than the buoyancy threshold) or sink (part 03). The Hollows sometimes drag bodies into the water during a Surge (a Tier 3 detail: a Hollow grabs a body and wades away, which is creepy and creates "chase the body" moments).

### 11.6.3 Loot UI

The loot UI layout (part 24 has visuals): left panel is your inventory (equipment doll, rig, pockets, backpack), right panel is the container or body. Drag between them. Ctrl+click quick-moves. A "Take All" button exists only for small containers (under 12 cells), never for bodies (you have to choose). Hovering an item shows a tooltip with its value (if you know it: estimated trader sell price, shown once you've sold or bought one of that type, or if you have the "Appraiser" Halcyon upgrade), weight and size, and FiR status.

## 11.7 WEIGHT AND CARRYING

Total weight is the sum of everything equipped and carried. Thresholds and effects are in part 04. The inventory UI shows a weight bar with the thresholds marked, and the bar color changes (white, yellow at Burdened, orange at Overloaded, red at Immobile). Every item tooltip shows its weight. Containers show their content weight.

## 11.8 KEYS AND LOCKS

Keys are items that open specific locked doors and containers on the map. They're among the most valuable things in the economy because locked rooms have the best loot. Each key has a number of uses (some infinite, most 10 to 40 uses) and a location hint in its description ("A brass key on a fob marked 'NFB Vault Anteroom'"). 40 keys on the main map at Tier 2. Keys live in a Key Ring container (a small case that holds only keys, 4×4, fits in the secure pouch when compact).

Locks: doors and containers flagged as locked require a key with the matching `KeyId`. Lockpicks (Tier 2): a consumable that opens basic locks (not safes, vaults or military locks) with a 6 s timed interaction and a 30% chance to break the pick. Padlocks can be shot off (part 05). Safes need the specific code (found on notes) or a key, or explosives (C4-like breaching charges, rare, Tier 3: destroys 30% of the contents).

## 11.9 THE INVENTORY SCREEN IN RAID

Opening the inventory in a raid (Tab) does not pause the game, obviously. The character crouches into a "rummaging" pose if standing still (visible to others), can walk at 1.0 m/s, can't sprint, can't ADS. The inventory UI is full-screen with a translucent background that shows the live game blurred behind it, and a "threat indicator" ring at the edge of the screen shows the direction of any gunshot or loud sound that happens while the inventory is open. Closing it is instant (Tab or Esc).

## 11.10 THE INVENTORY ACCEPTANCE TESTS

Moving an item to a placement that overlaps another item fails in both the client prediction and the server check.

Rotated items fit exactly where expected.

Nested containers: putting a non-empty backpack into another backpack fails; putting an empty one succeeds; putting an ammo case with ammo into a backpack succeeds.

Every rig layout's pouches accept and reject the right sizes.

1,000 random operations by a bot client against the server leave no duplicated or lost item instances (the "conservation test": the multiset of instance IDs before and after is equal except for intentional create/destroy operations).

The secure pouch accepts small valuables and rejects weapons, armor and Hot items.

Disconnect during a transfer: the item ends up in exactly one place.

Stash sync with 50 operations in 2 seconds sends at most 7 requests and ends with the backend and client stash identical.

---

End of part 11. Next: `12_ITEMS_LOOT_ECONOMY.md`.
