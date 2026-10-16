# SALTMARROW: PART 08, THE GUNSMITH SYSTEM

Pillar 2 says the gun is yours. This part is how. The gunsmith is a data-driven tree of parts, each with a mesh, a set of sockets, a set of stat modifiers and a set of compatibility rules, assembled at runtime into one weapon actor whose behavior in the raid comes entirely from its parts. Build this system right and adding the 300th attachment takes five minutes. Build it wrong and every new part is a bug.

---

## 8.1 THE CORE MODEL: A TREE OF PARTS

A weapon is not one mesh. A weapon is a root receiver part plus a tree of child parts, each attached to a named slot on its parent.

```
Mako (receiver root: Lower Receiver "CDS Mako Lower")
├── Upper Receiver: "CDS Mako Upper (flat top)"
│   ├── Barrel: "CDS 14.5in Govt Profile"
│   │   ├── Gas Block: "Low-profile gas block"
│   │   └── Muzzle: "Kittredge K2 Brake"
│   │       └── (Muzzle sub-slot: Suppressor mount) "Quietus Q-Mount adapter"
│   │           └── Suppressor: "Quietus Q5 5.56"
│   ├── Handguard: "Fen Tactical 13in M-LOK"
│   │   ├── Top Rail Front: "Fen 5-slot M-LOK rail"
│   │   │   └── Front Sight: "Flip-up front"
│   │   ├── Underbarrel: "Fen angled foregrip"
│   │   ├── Side Left: "Fen M-LOK light mount"
│   │   │   └── Light: "Nordlys NL-300 weapon light"
│   │   └── Side Right: (empty)
│   ├── Optic Mount: "Lumen QD riser 1.93in"
│   │   └── Optic: "Lumen LH-1 holographic"
│   │       └── Magnifier slot: "Lumen 3x flip magnifier"
│   ├── Rear Sight: "Flip-up rear"
│   ├── Charging Handle: "Brack ambi charging handle"
│   └── Dust Cover: "CDS dust cover"
├── Pistol Grip: "Fen ergonomic grip"
├── Trigger: "CDS mil-spec trigger"
├── Buffer Tube: "Mil-spec buffer tube"
│   └── Stock: "Brack BS-7 collapsible"
│       ├── Cheek Riser: (empty)
│       └── Butt Pad: "Brack rubber butt pad"
├── Magazine: "CDS 30rd aluminum" (holds ammo)
└── Charm: "Gull feather charm"
```

The tree is the weapon's configuration, `FSMWeaponConfig`, and it's the single source of truth. It's what's stored in the stash, what replicates, what the gunsmith edits, and what the stat calculator reads. The weapon actor in the raid is built from it.

### 8.1.1 Data shape

```cpp
USTRUCT(BlueprintType)
struct FSMPartNode
{
    GENERATED_BODY()
    UPROPERTY() FPrimaryAssetId PartId;            // the attachment definition
    UPROPERTY() FGuid InstanceId;                  // server-issued item instance id (every part is an item)
    UPROPERTY() float Durability = 100.f;          // per-part durability (barrels, triggers matter most)
    UPROPERTY() uint8 ParentIndex = 255;           // index into the flat array, 255 = root
    UPROPERTY() FName ParentSlot;                  // slot name on the parent
    UPROPERTY() uint8 CosmeticSkinIndex = 0;       // index into the owner's skin table, 0 = default (part 10)
};

USTRUCT(BlueprintType)
struct FSMWeaponConfig
{
    GENERATED_BODY()
    UPROPERTY() FPrimaryAssetId WeaponId;          // the weapon definition
    UPROPERTY() FGuid InstanceId;                  // weapon item instance id
    UPROPERTY() TArray<FSMPartNode> Parts;         // flat array, parents always before children
    UPROPERTY() FSMMagazineState LoadedMagazine;   // rounds by ammo id, in order
    UPROPERTY() FPrimaryAssetId ChamberedRound;    // or none
    UPROPERTY() float ReceiverDurability = 100.f;
    UPROPERTY() float Heat = 0.f;                  // runtime only, not persisted
    UPROPERTY() uint8 FireModeIndex = 0;
    UPROPERTY() int16 ZeroDistanceMeters = 100;
    UPROPERTY() FSMWeaponCosmetics Cosmetics;      // skin, wear override, engraving text (part 10)
};
```

A flat array with parent indices is much easier to replicate, serialize to JSON for the backend, and diff than a nested tree. Always keep parents before children in the array so a single forward pass can assemble or evaluate it.

Every part is an item with its own instance ID. That matters: when you strip a scope off a dead player's rifle, it becomes an item in your inventory with its own durability and history. Weapons are containers of parts.

## 8.2 ATTACHMENT DEFINITIONS

Each part is a `USMAttachmentDefinition` Data Asset (primary asset type `Attachment`). Fields (part 32 has the full schema):

Identity: ID, display name, short name (for tight UI), manufacturer, description, category (Muzzle, Suppressor, Barrel, Handguard, Rail, Optic, Magnifier, Sight, Mount, Stock, Grip, Foregrip, Bipod, Light, Laser, Magazine, Trigger, Charging Handle, Gas Block, Buffer, Receiver, Choke, Charm, etc.), rarity, base price, weight (kg), inventory size (W×H cells), icon.

Mesh: a static mesh (most parts) or skeletal mesh (parts that animate: stocks that collapse, bipods that fold, flip-up sights, magnifiers that flip, magazines that need a follower bone if you want to be fancy, charging handles), plus optional LODs. The part's origin is its attachment point.

Attach socket: the socket on the parent the part attaches to is defined by the parent's slot, not the part. The part defines its own "attach point" as the mesh origin, and an optional offset.

Slots: the slots this part provides for children. Each slot: name, socket name on this part's mesh, accepted category set, accepted tag query (8.3), required or optional, default part (for the trader's stock configuration), position limits (for rails, 8.4).

Stat modifiers: a list of modifiers applied by this part (8.5).

Functional data: category-specific structs. Optics have zoom, reticle, eye relief and render data. Muzzles have sound and flash profiles. Barrels have length and twist. Magazines have capacity, caliber and reload profile. Lights have lumens, beam angle and modes. Lasers have color and power. Stocks have length of pull and positions. Bipods have deploy height.

Tags: a Gameplay Tag container describing the part for compatibility (8.3).

Blocks: a tag query of slots this part blocks when installed (8.3.3).

## 8.3 COMPATIBILITY RULES

Compatibility is the heart of the gunsmith's depth and the main source of bugs. We express all compatibility with Gameplay Tags. No special-case code per weapon, ever.

### 8.3.1 Interface tags

Every slot declares an interface it accepts, and every part declares the interfaces it provides. A part fits a slot if the part has the slot's required interface tag and none of its excluded tags.

Interface tag families (under `Attachment.Interface.`):

Rails and mounts: `Rail.Picatinny`, `Rail.MLOK`, `Rail.KeyMod` (don't bother with KeyMod; skip it to keep the catalog smaller), `Rail.Dovetail.AK`, `Rail.Dovetail.11mm`, `Rail.ClawHK`, `Mount.Rings30mm`, `Mount.Rings34mm`, `Mount.Scout`.

Muzzle threads: `Thread.556.1-2x28`, `Thread.762.5-8x24`, `Thread.545.24x1.5`, `Thread.9mm.1-2x28`, `Thread.45.578x28`, `Thread.Pistol.13.5x1LH` and so on. Then muzzle device to suppressor interfaces: `QD.Quietus`, `QD.Kittredge`, `QD.HK3Lug`, `Direct.Thread`.

Barrel interfaces: `Barrel.AR15`, `Barrel.AR10`, `Barrel.AK`, `Barrel.Fulmar`, `Barrel.Fathom`, etc.

Receiver families: `Receiver.AR15.Upper`, `Receiver.AR15.Lower`, `Receiver.AR10.Upper`, etc.

Stock interfaces: `Buffer.AR.MilSpec`, `Buffer.AR.Commercial`, `Stock.AK.Fixed`, `Stock.AK.Folding`, `Stock.HK.Slot`.

Grip interfaces: `Grip.AR`, `Grip.AK`, `Grip.HK`, `Grip.Pistol.Frame`.

Magazine wells: `Mag.STANAG`, `Mag.AK.762`, `Mag.AK.545`, `Mag.Kestrel9`, `Mag.Gannet`, `Mag.Fulmar`, `Mag.AR10`, `Mag.Fathom`, etc. Caliber is a separate check (8.3.2).

### 8.3.2 Caliber and gas rules

Some compatibility is about physics, not interfaces. Express these as tags too:

Calibers: `Caliber.556`, `Caliber.300BLK`, `Caliber.762x39`, etc. A magazine has a caliber tag. A barrel has a caliber tag. The weapon's effective caliber is the barrel's caliber. A magazine must match it. That allows a real gunsmith feature: put a .300 BLK barrel on the Mako upper and it becomes a .300 BLK rifle that takes the same magazine body with .300 rounds. Ammo loading checks against the magazine's caliber.

Suppressor ratings: a suppressor is rated for a maximum caliber class (`SuppressorRating.Pistol`, `.Intermediate`, `.FullPower`, `.Magnum`), and a weapon's caliber has a class. You can't put a pistol can on a 7.62x51 rifle.

Gas length: AR barrels have gas system lengths (`Gas.Pistol`, `Gas.Carbine`, `Gas.Mid`, `Gas.Rifle`), and handguards don't care, but gas blocks do: low-profile gas blocks fit under any free-float handguard, standard A-frame front sight gas blocks only fit with drop-in handguards or handguards marked `Handguard.FSBCompatible`.

### 8.3.3 Blocking and physical clearance

Some parts block other slots. The classic example: a long handguard covers the gas block area and blocks an A-frame front sight. A foregrip that sits far forward blocks a bipod. A big magnified optic on a low mount blocks the rear sight. A full-length top rail on some handguards conflicts with a certain optic mount.

Each part declares a `BlockedSlots` tag query evaluated against slot names in its subtree and siblings. When a part is installed, blocked slots show as locked in the UI with a tooltip naming the blocking part ("Blocked by: Fen Tactical 15in M-LOK").

Rail length is a physical constraint too (8.4).

### 8.3.4 Required slots and functional validity

Some slots are required for the weapon to fire: receiver, barrel, magazine well (a magazine isn't required to exist, but the well is), bolt (implicit), trigger, charging handle on ARs, pistol grip (on weapons that have one; a weapon with no grip can't fire). A weapon missing any required part is "Incomplete": it can sit in the stash but can't go into a loadout, and the gunsmith shows a red banner listing what's missing. A weapon without a stock or sights can fire (just badly). A weapon without a muzzle device fires fine (bare muzzle).

### 8.3.5 Validation runs everywhere

The same validation function (`USMGunsmithLibrary::ValidateConfig`) runs in three places: the gunsmith UI (to grey out incompatible parts), the server in raid (when a player modifies a weapon in the field, Tier 2; before Tier 2 field modding isn't allowed), and the backend (when a stash update arrives). The backend can't run C++, so the rules have to exist as data the backend can read. Export every weapon and attachment definition to a JSON catalog as part of the build (a commandlet: `SaltmarrowEditor -run=ExportCatalog`), and the backend uses a TypeScript port of the validator against that catalog. The two validators must agree; part 37 includes a test that runs both on 5,000 random configs and diffs the results.

## 8.4 RAILS AND POSITIONS

Rail-mounted parts (optics on top rails, lights and lasers on side rails, foregrips on bottom rails) can be positioned along the rail. This is a deep feature that real gun people care about and it changes things (eye relief for optics, reach for foregrips).

Each rail slot has a length in "slots" (for picatinny, one slot is 10 mm; for M-LOK, one slot is 40 mm with mounting points on the 20 mm grid). Each rail-mounted part has a footprint in slots. A rail slot can hold multiple parts as long as they don't overlap (e.g. a top rail can take an optic and a magnifier behind it). The UI lets the player drag the part along the rail, snapping to slot positions, with a ghost showing valid positions in green and invalid in red.

Implementation: a rail slot is a slot type with `bIsRail = true`, a socket at the rail's start, a direction vector, a length in slots and a slot pitch. Installed parts on a rail store a position index in their node (`RailPosition`). Overlap is checked by footprint. The mesh is attached at `RailStartSocket + Direction * Pitch * Position`.

Optic eye relief: for magnified optics, the distance from the optic's eyepiece to the character's eye in ADS matters. Each optic has an ideal eye relief range. If the position puts it too far forward or back, the scope image shows "scope shadow" (a dark ring vignette, part 26) and the ADS animation adapts (the head moves forward or back up to a limit). This is a delightful detail and it's what makes rail positioning matter. The default position for each optic is its ideal eye relief.

## 8.5 STAT MODIFIERS AND THE STAT CALCULATOR

Every part changes stats. The calculator turns a config into a final stat sheet (`FSMWeaponStats`). It's deterministic and pure: same config, same stats, every time. It runs on the client (UI), server (raid) and backend (TypeScript port, for showing stats on the web later and for validation of weight).

### 8.5.1 Modifier types

Each modifier: target stat, operation, value. Operations: `AddFlat`, `AddPercent` (summed then applied: two +10% become +20%, not 21%), `Multiply` (applied after all AddPercent), `Override` (for things like fire modes from a trigger group), `Min`, `Max`.

Order of operations for each stat: base value from the weapon definition, then all AddFlat, then (1 + sum of AddPercent), then each Multiply in order, then Override (last one wins, by priority), then clamp to the stat's valid range.

### 8.5.2 The stats

| Stat | Base from | Modified by | Notes |
|---|---|---|---|
| Weight | Sum of all parts' weight + receiver + loaded mag | Everything | Physical sum, no modifiers |
| Length | Computed from the geometry (8.5.4) | Barrel, muzzle, suppressor, stock | Affects wall collision and turn speed |
| Ergonomics | Weapon base | AddFlat from each part (grips +, heavy parts -) | 0 to 100; drives ADS time, sway, turn inertia |
| Vertical recoil | Weapon base | AddPercent (stocks, muzzles, grips), Multiply (mass) | |
| Horizontal recoil | Weapon base | AddPercent | |
| Accuracy (MOA) | Barrel's base MOA | AddPercent from muzzle devices (some hurt accuracy), triggers, ammo | |
| Muzzle velocity | Ammo's reference velocity | Barrel length formula (8.5.3), suppressors (+1 to 3%) | |
| ADS time | Computed from ergonomics and weight | Optic's ADS penalty | |
| Sway amplitude | Computed from ergonomics and weight distribution | Stock, foregrip | |
| Hip spread | Weapon base | Lasers, foregrips | |
| Fire rate | Weapon base | Gas regulator, buffer weight, triggers | ±10% max |
| Reload speed | Weapon base | Magazine (some mags are faster), mag well (flared), pistol grip | |
| Durability burn | Weapon base | Suppressor (+), barrel (chrome-lined -) | |
| Sound radius | Weapon base | Muzzle device and suppressor, ammo (subsonic) | |
| Flash visibility | Weapon base | Muzzle device (flash hiders) | Affects muzzle flash VFX and AI detection |
| Malfunction chance | Weapon base | Magazine quality, gas regulator, suppressor | |
| Heat per shot | Weapon base (LMGs) | Barrel profile | |

### 8.5.3 Barrel length and velocity

Muzzle velocity for a configuration: `V = V_ref × (1 + k × (L_barrel - L_ref))`, where `V_ref` and `L_ref` come from the ammo definition (reference velocity and reference barrel length in inches), and `k` is the caliber's velocity sensitivity (rifle calibers 0.015 per inch, short intermediate like .300 BLK 0.008, pistol calibers 0.010, shotguns 0.004). Clamp to ±25%. Suppressors add +2% (the bore extension effect), as a Multiply.

Longer barrels also improve MOA slightly (each barrel part has its own MOA, so this is set per part, not computed) and add weight and length (which hurts ergonomics and makes the weapon catch on walls).

### 8.5.4 Weight distribution and ergonomics

This is the part that makes the gunsmith feel real: a gun with a heavy suppressor and a light on a long handguard is front-heavy and swings sluggishly. A light, short gun is snappy.

Each part has a mass and its attach position on the weapon in the weapon's local space (from the socket transforms, computed once when assembled in the editor's preview and cached in the definition for each slot, or computed at runtime from the socket transforms; cache it). The calculator computes:

Total mass M.
Center of mass along the weapon's forward axis, relative to the pistol grip (the hand's pivot): `x_cm = Σ(m_i × x_i) / M`.
Moment of inertia about the grip's vertical axis: `I = Σ(m_i × x_i²)`.

Then:

`ErgoPenaltyFromBalance = clamp((x_cm - x_ideal) × BalanceFactor, 0, 30)` where `x_ideal` is the weapon class's ideal center of mass (just forward of the grip, about 8 to 15 cm), so front-heavy guns lose ergonomics.

`FinalErgonomics = clamp(BaseErgo + Σ(part ergo AddFlat) - ErgoPenaltyFromBalance, 0, 100)`.

`ADSTime = BaseADSTime_class × (1.5 - FinalErgonomics / 100) × (1 + (M - M_ref_class) × 0.06) + OpticADSPenalty`.

`SwayAmplitude = BaseSway_class × (1.6 - FinalErgonomics / 100) × sqrt(I / I_ref_class)`.

`TurnInertia` (how much the weapon lags behind fast camera turns in the procedural layer) `= I / I_ref_class`, clamped 0.6 to 2.5.

`RecoilMassFactor = sqrt(M_ref_class / M)` applied as a Multiply on vertical and horizontal recoil, so heavier guns kick less.

Tune the `_ref_class` constants so the stock configuration of each weapon class reproduces the base stats in parts 06 and 07 exactly. Unit test that.

### 8.5.5 Stat display

The gunsmith UI shows the stat sheet with bars. For each stat, show the current value, and when hovering a candidate part, show the delta: green for better, red for worse, with the numeric change. Bars for: Ergonomics, Vertical recoil, Horizontal recoil, Accuracy, ADS time, Sway, Weight, Length, Muzzle velocity, Effective range, Sound (suppression), Fire rate. A "Details" toggle shows every stat with the full breakdown of which parts contribute what (a tree of modifiers, which is a delight for power users and invaluable for debugging).

## 8.6 ASSEMBLY: BUILDING THE WEAPON ACTOR

### 8.6.1 Runtime assembly

The weapon actor (`ASMWeapon`) has a root skeletal mesh component for the receiver (skeletal because the receiver animates: bolt, charging handle, trigger, mag release, selector, ejection port cover), and creates a child component for each part, attached to its parent's socket. Static parts use `UStaticMeshComponent`; animated parts use `USkeletalMeshComponent` with leader pose or their own small anim blueprint.

Assembly order: walk the flat array (parents first), create components, attach to sockets (with rail positions applied). Cache everything. Rebuilding on change should take under 2 ms for a 25-part weapon.

Draw call cost: a 25-part weapon is 25+ draw calls, which is fine for the local player and expensive for 12 players' weapons in view. Solutions, in order:

1. Use a distance-based silhouette representation for simulated proxies (runtime mesh merging is too slow per config, and instancing doesn't help because each part is usually unique): for third-person views of other players' weapons beyond 15 m, swap to a simplified "silhouette" representation: the receiver mesh plus the optic, suppressor and stock (the parts that change the silhouette), and drop the small parts (rails, lights, grips, sights). Beyond 40 m, receiver only. That's just a visibility toggle per part with a "silhouette importance" value (High: optic, suppressor, stock, barrel, magazine, bipod; Low: everything else).
2. Use Nanite for weapon part static meshes if the installed engine version supports Nanite on these meshes with the materials we need (Nanite supports masked and WPO now). For first-person close-ups, Nanite detail is lovely.

### 8.6.2 Animation integration

The receiver's skeleton has bones for: bolt, charging handle, trigger, selector, mag release, bolt catch, ejection port cover, magazine attach point, and (for some weapons) hammer, cylinder, lever, pump forend, barrels (break action). Weapon animations (part 29) drive these bones, in sync with the character's montages.

Hand placement: the character's left-hand IK target comes from the weapon. Each weapon config has a left-hand grip point, determined by the parts: if a foregrip is installed, the hand goes on the foregrip's grip socket (and the hand pose changes: vertical grip pose, angled grip pose, handstop pose); otherwise it goes on the handguard's default grip socket. If a light is installed with a pressure pad, the left thumb pose changes. The procedural pose library (part 29) has hand poses per grip type.

The right hand always holds the pistol grip. The pistol grip part defines the right hand's grip socket and pose (different grips have different angles).

The stock defines the shoulder contact point, which positions the weapon in the character's shoulder in third person and positions the sight line relative to the eye in ADS (with the optic's height above bore). Cheek risers raise the eye position for high optics.

### 8.6.3 ADS alignment

In ADS, the camera must align exactly with the active sight's aim point. The active sight is: the optic if one is installed; else the iron sights (rear and front, aligned); else a "point shooting" fallback down the barrel axis (silly and inaccurate, but legal).

Each optic and sight has an `AimPoint` socket and an `EyeRelief` value. When ADS, the camera's location is `AimPoint + (-Forward × EyeRelief)`, and the weapon is positioned by the ADS animation pose plus an IK correction that moves the weapon so the aim point lands on the camera's center line. That correction is what lets any optic on any rail position work without hand-authored ADS poses per configuration. Clamp the correction to sane limits (the head can move ±6 cm, the weapon ±8 cm) and warn in the gunsmith if a configuration exceeds them ("Eye relief: too far forward").

Canted sights and offset optics (an angled red dot on a 45° side mount, a common real-world setup): a key toggles between the primary and secondary sight (default: Left Alt while ADS, rebindable; V is shoulder swap and middle mouse is ping, so neither is available). The weapon cants 45° in the hands to bring the offset sight to the eye, over 0.2 s. A magnifier behind a red dot flips in and out with the same key.

### 8.6.4 Zeroing

Every optic and iron sight has zeroing: the distance at which the sight line and the bullet's path intersect. Default 100 m. Players adjust with Page Up / Page Down (or the mouse wheel while ADS with a modifier key) in steps defined by the optic (red dots: 50, 100, 150, 200 m; magnified scopes: 100 to 800 m in 50 m steps, or up to 1,000 m for long-range scopes). The current zero shows on the HUD in ADS. The math: the sight's aim line is tilted relative to the bore by the angle that makes the projectile cross the aim line at the zero distance, computed by simulating the trajectory of the current chambered ammo (cache a lookup table per ammo per zero).

Scopes with BDC reticles (ranging marks for holdover) are an alternative: their reticle marks match the ballistics of a specific caliber at specific distances, and the reticle texture has those marks (part 26 builds reticles procedurally, so marks can be generated from the actual ballistics, which is a lovely touch: the BDC reticle on a Fathom is actually correct for 7.62x51 M80).

### 8.6.5 Lights and lasers

Weapon lights: a spot light component on the light part, toggled by a key (default T). Modes per light: constant, strobe (disorients at under 10 m: a mild sway and a flash effect for the target), off. Lights are visible to other players and AI, and the beam has a volumetric light shaft effect (part 26). Lights reveal the player's position and make them a target. Lights also make Hollows react (some are attracted, Wailers are agitated). Lumen rating sets intensity and range.

Lasers: a beam visible in dust, rain, smoke and fog (a translucent cylinder mesh with a material that fades with distance and shows only in particulate media; the dot is a decal or a small emissive sprite at the hit point). Lasers reduce hip-fire spread (by 15% to 35%). Colors: red (visible to all), green (brighter, visible to all), IR (only visible with night vision; Tier 2). Lasers are a big tell, and that's the tradeoff.

Light and laser state replicates (one byte per device).

### 8.6.6 Suppressors

Suppressors are a big part of the extraction gunplay meta, so they get real behavior:

Sound: the suppressor's `SoundReduction` value reduces the weapon's sound radius (typical cans: 45% to 70% reduction for supersonic ammo, 75% to 90% for subsonic) and swaps the weapon's audio to its suppressed layer set (part 28). Supersonic rounds still crack downrange, so a suppressed rifle with supersonic ammo can be located by the crack direction from the target's position, but much less precisely than an unsuppressed shot.

Flash: removes muzzle flash almost entirely (a tiny flicker at night).

Heat: suppressors heat up (like LMG barrels: 0.8% per shot), and above 60% heat the can glows faintly and creates a heat shimmer over the barrel (a refraction effect, part 26), which degrades the sight picture. Heat dissipates at 3% per second.

Durability: suppressors increase the weapon's durability burn by 10% to 30%.

Point of impact shift: some suppressors shift the point of impact by a small fixed amount (part data, 0.5 to 2 MOA), which a player can correct by zeroing. That's realistic and gives zeroing a reason to exist even at short range.

Backpressure: +2% to 6% fire rate on gas guns, and +5% malfunction chance unless the gas regulator part is set to "Suppressed" (on piston weapons that have a regulator).

## 8.7 PRESETS AND BUILDS

Players can save a configuration as a named Build. A Build is a template: a config with part definition IDs but no instance IDs. Builds are stored on the backend (up to 30 per player, more with a hideout upgrade).

"Assemble from Build" in the gunsmith tries to build the template from the player's stash: for each part, use a matching part from the stash if available (preferring higher durability); if not, show it as "missing" with a price from the trader who sells it, and a "Buy missing parts" button that purchases them all in one transaction (with the total price shown first). This is Tarkov's best quality-of-life feature, and it's the difference between the gunsmith being joyful and being homework.

Presets: every weapon has 2 to 4 designer presets visible in the gunsmith (e.g. "Mako: CQB", "Mako: Marksman", "Mako: Quiet Professional", "Mako: Budget Build"), which work exactly like Builds. These are written by you, using parts from part 09, and they're the best way to show players what's possible.

Build sharing (Tier 3): a Build can be exported as a short code (base64 of a compressed template) that another player can import. Small, viral, and lovely in a game you're sending to friends.

## 8.8 THE GUNSMITH SCREEN

The gunsmith is a workbench, not a spreadsheet. Part 23 has the full UI layout. The core interaction:

The 3D view: the weapon sits on a workbench in the Halcyon's car deck workshop under a warm lamp. The camera orbits (right-drag), zooms (wheel) and pans (middle-drag). Hovering a part highlights it (an outline). Clicking a part focuses the camera on it and opens that slot's part list.

Slot markers: every slot on the weapon has a small circular marker floating at its socket position in 3D, connected by a thin leader line to a label ("MUZZLE", "OPTIC"). Empty slots show a "+"; filled slots show the part's icon. Blocked slots show a lock. Required empty slots pulse red.

The part list: a panel on the right listing every compatible part, grouped as: In your stash (with count and best durability), Available from traders (with price and trader icon; greyed if loyalty too low, with the requirement shown), and Locked (known parts you haven't found or unlocked; a silhouette and "???" until first found, which makes discovery a reward). Sorting by any stat. Filters by manufacturer. Hovering a part in the list installs a "ghost preview" on the 3D model instantly, and the stat bars show the delta. Clicking installs it (if from the stash) or opens a "Buy and install" confirmation (if from a trader).

Drag and drop: players can also drag parts from the stash grid (an optional side panel) directly onto slot markers or onto the 3D model near a slot.

Field strip view: a toggle that explodes the weapon into its parts along their attachment axes, animated over 0.6 s, floating in the air above the bench with labels. It's mostly showing off, and it's also the clearest way to see a 25-part tree. Players love it.

Firing test: a button "Test Fire" that drops the player into the Halcyon's firing range (part 39) with this exact configuration, without leaving the gunsmith context (it's a sub-level streamed in), and a button there to return to the bench.

Undo/redo: every change is undoable (Ctrl+Z, Ctrl+Y) until the player leaves the screen. Changes to the weapon are only committed to the stash when the player clicks "Done" (or leaves the screen and confirms), so experimentation is free. Parts removed go back to the stash. Parts bought are bought immediately (Scrip deducted), with an undo that refunds within the same session.

## 8.9 FIELD MODIFICATION (TIER 2)

In the raid, a player can open the gunsmith-lite on any weapon in their inventory (in the inventory screen, right-click > Modify), with no 3D bench, just a 2D slot tree with icons. They can only use parts from their own inventory. Swapping a part takes time (1 to 4 seconds per part, depending on the slot: a suppressor is 1.5 s, a barrel is 4 s, an optic is 2 s, a rail-mounted light is 1.2 s), and during that time the player is in the inventory and vulnerable. The server validates every change. It enables picking up a dead player's scope and putting it on your gun in the raid, which is a big moment.

## 8.10 ITEM HISTORY AND PROVENANCE

Every weapon and every part has a short history log (last 10 events) stored on the backend: "Bought from Tomasz Wren", "Found in Haldane Cannery cold store", "Looted from Gull_4471's body at the Northern Fisheries Bank", "Extracted from raid 7 Nov (Night)", "Used to kill 14 Hollows and 2 salvagers". The inspect panel shows it. It costs us a few bytes per item and gives every gun a story. The kill counter per weapon is the most important stat in it ("This Mako has 37 kills").

## 8.11 PERFORMANCE AND REPLICATION OF CONFIGS

The full config replicates to the owning client and to clients for whom the player's character is relevant. Use a custom `NetSerialize` for `FSMWeaponConfig` that writes part IDs as compact indices into a replicated catalog table (part IDs to 16-bit indices, built at startup from the asset registry in a fixed order and checked by a hash at join time), durability as bytes, rail positions as bytes. A 25-part config serializes to under 120 bytes. Instance IDs are only sent to the owning client (other clients don't need them).

The weapon's runtime state (ammo in mag, chambered round, heat, fire mode, light state) replicates separately as a small struct with frequent updates for the owner and infrequent for others.

## 8.12 ACCEPTANCE TESTS FOR THE GUNSMITH

Every part in the catalog can be installed on at least one weapon (catalog test).

Every weapon's stock configuration reproduces the base stats in parts 06 and 07 within 1%.

Every designer preset is valid.

Random config fuzzing: generate 5,000 random valid configs per weapon by random walks through the slot tree; each one assembles without errors, validates identically in C++ and TypeScript, computes stats within valid ranges, and ADS-aligns within the IK limits or reports an eye relief warning.

Removing a part removes its children back to the stash (or, if they could stay on the new part in the same slot, keeps them: swapping a handguard keeps the rail accessories if the new handguard has compatible slots with the same names, which is a nice touch; implement it by matching slot names).

Changing a barrel to a different caliber unloads the magazine and chamber and moves the rounds to the inventory.

Assemble from Build picks the highest durability parts and buys exactly the missing ones.

---

End of part 08. Next: `09_ATTACHMENT_CATALOG.md`.
