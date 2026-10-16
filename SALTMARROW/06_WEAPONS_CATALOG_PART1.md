# SALTMARROW: PART 06, WEAPONS CATALOG, PART 1 (HANDGUNS, SMGS, ASSAULT RIFLES)

This part and part 07 list every weapon in the game. Each weapon is a `USMWeaponDefinition` Data Asset (part 32 has the schema), with a matching set of attachment slots (part 08) and a part catalog (part 09). The weapon names are fictional, the manufacturers are the fictional ones from part 02, and the designs are inspired by real operating principles without copying any real trademarked design exactly. Make every one of them look and feel different. If two weapons feel the same in the hand, one of them is wasted.

---

## 6.1 HOW TO READ AN ENTRY

Every entry follows the same format, which matches the data asset fields one-to-one so you can turn these tables straight into data.

Identity: name, internal ID, manufacturer, class, tier (when it's built), rarity, trader and loyalty level to buy it, base price in Scrip.

Fiction: the description that appears in the item inspect panel, in-world voice.

Operation: the mechanical principle, which drives the animation set and the sound layers.

Base stats: the weapon with its default parts installed (the "stock" configuration that the trader sells). Every stat is affected by attachments in part 08's formulas.

Slots: the attachment slots on the base receiver (sub-slots on parts are listed in part 09).

Look: what the model looks like, in enough detail to model, kitbash or source it.

Sound: what the sound layers are (part 28 explains the layer system).

Animation notes: anything weapon-specific beyond the class animation set.

### 6.1.1 The stat block fields

| Field | Meaning | Unit |
|---|---|---|
| Caliber | Ammo family | |
| Default mag | Stock magazine and capacity | rounds |
| Fire modes | Supported modes | |
| RPM | Cyclic rate in auto, or max for semi | rounds/min |
| Weight | Base weight with stock parts, empty mag | kg |
| Length | Overall length with stock parts | cm |
| Barrel | Stock barrel length | inches (gun people think in inches; display both) |
| Muzzle velocity | With stock barrel and reference ammo | m/s |
| Ergonomics | 0 to 100, drives ADS speed, sway, and turn inertia | points |
| Vertical recoil | Base vertical kick per shot | degrees |
| Horizontal recoil | Base max horizontal deviation per shot | degrees |
| Accuracy | Mechanical dispersion | MOA |
| ADS time | Hip to full ADS with stock parts | seconds |
| Reload (tac / empty) | Reload durations | seconds |
| Durability burn | Durability lost per shot with reference ammo | points |
| Effective range | Range for UI and AI, not a hard limit | m |
| Sound radius | Unsuppressed audible radius for AI and the sound system | m |

## 6.2 HANDGUNS

Handguns go in the holster slot and are always quick to draw (0.35 s from holster). Every player can carry one handgun plus two long guns (one on the back, one slung). Handguns are the backup weapon, the Scavenger weapon, and the swimming-depth weapon (they can be fired at chest-deep wading, part 04).

### 6.2.1 Kestrel 9

| Identity | |
|---|---|
| ID | `WPN_Kestrel9` |
| Manufacturer | Northern Arsenal |
| Class | Pistol |
| Tier | 0 |
| Rarity | Common |
| Trader | The Captain, loyalty 1 |
| Price | 9,800 Scrip |

Fiction: "The Mainland's service pistol for twenty years. Every police station on the islands had a drawer full of them. Polymer frame, steel slide, a trigger like a stapler. Never jams. Never wins a beauty contest."

Operation: short recoil, tilting barrel, striker-fired, polymer frame. Locked breech, slide locks back on empty.

| Stat | Value |
|---|---|
| Caliber | 9x19 |
| Default mag | 15-round double stack |
| Fire modes | Semi |
| RPM | 450 (max semi rate) |
| Weight | 0.72 kg |
| Length | 19.0 cm |
| Barrel | 4.1 in (10.4 cm) |
| Muzzle velocity | 365 m/s (FMJ) |
| Ergonomics | 92 |
| Vertical recoil | 1.9° |
| Horizontal recoil | 0.6° |
| Accuracy | 7.0 MOA |
| ADS time | 0.18 s |
| Reload | 1.55 s / 1.95 s |
| Durability burn | 0.03 |
| Effective range | 35 m |
| Sound radius | 160 m |

Slots: Muzzle (threaded barrel only), Optic (slide cut, only with the "Optics Cut" slide), Underbarrel Rail (light/laser), Slide, Barrel, Magazine, Frame Grip (stippled or rubber wrap), Trigger, Charm.

Look: a blocky, boxy polymer pistol in matte black with a flat grey slide. Squared-off trigger guard, a short accessory rail on the dust cover with two slots, slanted slide serrations front and rear, three-dot sights with the rear dot painted orange (fictional Northern Arsenal standard), a crest of a stylized kestrel molded into the grip (small, about 12 mm). The magazine base plate is extended and has a lanyard loop. It should look like a plain government sidearm, a little dated.

Sound: sharp, high crack with a short tail. Slide mechanics clack (metal on polymer). Mag release is a hollow polymer click. Distant: a flat pop.

Animation notes: slide locks back on empty (visibly), and the empty reload uses the slide release, not a slingshot. Inspect animation turns the pistol to show the left side, then racks it slightly to check the chamber.

### 6.2.2 Sever

| Identity | |
|---|---|
| ID | `WPN_Sever` |
| Manufacturer | Volkov Mechanical Works |
| Class | Pistol |
| Tier | 1 |
| Rarity | Common |
| Trader | Nils, loyalty 1 |
| Price | 7,200 Scrip |

Fiction: "All steel, all angles, a hammer you can cock with your thumb. Weighs as much as a brick and kicks like a mule, but it'll go off after a month underwater. The Wardens issue it to their recruits, which tells you how much they value their recruits."

Operation: straight blowback, hammer-fired, single action/double action, all steel. Heavy slide.

| Stat | Value |
|---|---|
| Caliber | 9x19 |
| Default mag | 12-round single stack |
| Fire modes | Semi |
| RPM | 400 |
| Weight | 0.96 kg |
| Length | 18.4 cm |
| Barrel | 3.7 in |
| Muzzle velocity | 355 m/s |
| Ergonomics | 82 |
| Vertical recoil | 2.6° |
| Horizontal recoil | 0.9° |
| Accuracy | 8.5 MOA |
| ADS time | 0.21 s |
| Reload | 1.70 s / 2.10 s |
| Durability burn | 0.02 |
| Effective range | 30 m |
| Sound radius | 165 m |

Slots: Muzzle (threaded barrel only), Slide, Barrel, Magazine, Frame Grip (wood, bakelite or rubber panels), Hammer (bobbed hammer: faster draw), Charm.

Look: a heavy, angular blued-steel pistol with a long slide that almost covers the barrel, a rounded hammer spur, and brown checkered bakelite grip panels with a five-pointed star inside a gear (VMW's logo). Fixed sights with a deep U-notch. Visible machining marks on the slide flats. The finish is worn silver at the slide edges and the muzzle.

Sound: deeper and harsher than the Kestrel, more mechanical, a loud metallic clack on the slide return. A heavy, ringing tail.

Animation notes: a visible hammer that cocks on each shot. The first shot from holster is double action (longer trigger pull, 0.08 s delay before firing, slightly more recoil). Shooting an empty Sever drops the hammer on nothing with a satisfying "click".

### 6.2.3 Harbormaster .45

| Identity | |
|---|---|
| ID | `WPN_Harbormaster` |
| Manufacturer | Marlowe Firearms |
| Class | Pistol |
| Tier | 1 |
| Rarity | Uncommon |
| Trader | Tomasz, loyalty 2 |
| Price | 16,500 Scrip |

Fiction: "A hundred-year-old design in .45, built by people who think the hundred years were a mistake. Single stack, single action, a trigger like breaking glass. The harbormaster kept one in his desk for the seals, he said. There were never any seals."

Operation: short recoil, tilting barrel with swinging link, single action only, grip safety, thumb safety. The classic 1911 operating principle.

| Stat | Value |
|---|---|
| Caliber | .45 ACP |
| Default mag | 8-round single stack |
| Fire modes | Semi |
| RPM | 380 |
| Weight | 1.10 kg |
| Length | 21.6 cm |
| Barrel | 5.0 in |
| Muzzle velocity | 260 m/s |
| Ergonomics | 86 |
| Vertical recoil | 3.0° |
| Horizontal recoil | 0.7° |
| Accuracy | 5.0 MOA |
| ADS time | 0.20 s |
| Reload | 1.60 s / 1.90 s |
| Durability burn | 0.03 |
| Effective range | 40 m |
| Sound radius | 150 m (subsonic natively) |

Slots: Muzzle (threaded barrel), Optic (slide cut), Underbarrel Rail (rail frame only), Slide, Barrel, Magazine, Grip Panels (wood, ivory-look, G10, rubber), Trigger, Hammer, Mag Well (flared), Charm.

Look: classic 1911 lines, stainless steel slide with a blued frame (two-tone), walnut grip panels with a fouled anchor engraving, a long trigger with holes drilled in it, a beavertail grip safety, and a skeletonized hammer. Marlowe's logo (a rope knot) on the right side of the slide.

Sound: a deep, round "boom" with less crack than the 9mm. Satisfyingly mechanical slide.

Animation notes: thumb safety is visibly swiped off on draw. Slide locks back on empty.

### 6.2.4 Rook

| Identity | |
|---|---|
| ID | `WPN_Rook` |
| Manufacturer | Marlowe Firearms |
| Class | Revolver |
| Tier | 1 |
| Rarity | Uncommon |
| Trader | Tomasz, loyalty 2 |
| Price | 19,000 Scrip |

Fiction: "Six rounds of .357, a four-inch barrel, and a cylinder you can hear across the street when you close it. Police on the islands carried these until the nineties. The lifeboat coxswain kept his in an oilskin pouch in the wheelhouse, loaded. Nobody asked him why."

Operation: double-action revolver, swing-out cylinder, 6 rounds.

| Stat | Value |
|---|---|
| Caliber | .357 Magnum |
| Default mag | 6-round cylinder |
| Fire modes | Double action (semi with delay) |
| RPM | 220 |
| Weight | 1.10 kg |
| Length | 24.0 cm |
| Barrel | 4.0 in |
| Muzzle velocity | 440 m/s |
| Ergonomics | 80 |
| Vertical recoil | 4.4° |
| Horizontal recoil | 1.0° |
| Accuracy | 4.0 MOA |
| ADS time | 0.22 s |
| Reload | 1.10 s per round, 2.60 s with speed loader |
| Durability burn | 0.02 |
| Effective range | 50 m |
| Sound radius | 220 m |

Slots: Barrel (2.5 in snub, 4 in, 6 in), Grip (wood, rubber, target), Optic (only with 6 in barrel's top rail), Cylinder (speed loader compatibility comes from the item, not a slot), Hammer (bobbed), Charm.

Look: a medium-frame revolver with a full-lug barrel, a ventilated rib on top, blued steel worn grey at the edges, and checkered wood grips with a small rook (the bird) silhouette inlaid. The cylinder has fluted chambers.

Sound: a huge, booming crack, by far the loudest handgun. The cylinder clicks round on each pull (audible up close), and closing the cylinder is a satisfying snap. Spent casings stay in the cylinder until ejected on reload (the ejector rod animation sends six brass casings falling).

Animation notes: a double-action trigger pull with a visible hammer rise and fall. A per-round reload for loose rounds (open cylinder, eject all, insert one at a time) and a speed-loader reload (all six at once). If the player tactical-reloads with rounds left, the reload ejects all six (spent and unspent). The unspent ones go back into the inventory as loose rounds (realistic and kind).

### 6.2.5 Hornet

| Identity | |
|---|---|
| ID | `WPN_Hornet` |
| Manufacturer | Coastline Defense Systems |
| Class | Machine pistol |
| Tier | 2 |
| Rarity | Rare |
| Trader | Nils, loyalty 3 |
| Price | 34,000 Scrip |

Fiction: "A pistol that thinks it's a submachine gun. Select-fire, 1,100 rounds a minute, and about as controllable as an angry cat in a bag. CDS made them for VIP protection. You are not a VIP. It works anyway."

Operation: short recoil, select-fire, striker-fired, with a folding forward grip under the dust cover.

| Stat | Value |
|---|---|
| Caliber | 9x19 |
| Default mag | 20-round extended |
| Fire modes | Semi, Auto |
| RPM | 1,100 |
| Weight | 0.98 kg |
| Length | 21.0 cm (31 cm with the stock extended) |
| Barrel | 4.5 in |
| Muzzle velocity | 370 m/s |
| Ergonomics | 84 |
| Vertical recoil | 1.6° (per shot, but at 1,100 RPM) |
| Horizontal recoil | 1.4° |
| Accuracy | 7.5 MOA |
| ADS time | 0.20 s |
| Reload | 1.65 s / 2.05 s |
| Durability burn | 0.04 |
| Effective range | 25 m |
| Sound radius | 160 m |

Slots: Muzzle (comp only, it's not threaded for suppressors by default; the threaded barrel part unlocks suppressors), Optic (integrated on the slide), Underbarrel (folding grip, fixed), Stock (clip-on folding stock), Magazine (20, 33 stick), Barrel, Charm.

Look: a sleek pistol in flat dark earth with an aggressive compensator cut into the slide nose, a folding vertical grip under the frame that's visibly hinged, and an optional skeletal wire stock that clips to the back of the frame. Long magazines stick out well below the grip.

Sound: a high-pitched, fast ripping burst, like tearing canvas. Distinct enough that players learn to recognize it.

Animation notes: on equip, the folding grip snaps down. With the stock attached, it's held like an SMG (shoulder animation set) instead of a pistol.

### 6.2.6 Signal Pistol (Flare Gun)

| Identity | |
|---|---|
| ID | `WPN_SignalPistol` |
| Manufacturer | Fairweather Marine |
| Class | Utility pistol |
| Tier | 1 |
| Rarity | Common |
| Trader | The Captain, loyalty 1 |
| Price | 3,500 Scrip |

Fiction: "Orange plastic, a fat barrel, a single shot. Every boat on the islands had one in the grab bag. Fire it into the sky to call a ride. Fire it into a man's chest and he will remember the day forever, which won't be long."

Operation: break-open, single shot, 26.5mm flare.

| Stat | Value |
|---|---|
| Caliber | Flare (red, green, white, orange smoke variants) |
| Default mag | 1 |
| Fire modes | Single |
| Weight | 0.42 kg |
| Length | 22 cm |
| Muzzle velocity | 60 m/s |
| Ergonomics | 95 |
| Vertical recoil | 3.5° |
| Horizontal recoil | 0.5° |
| Accuracy | 25 MOA |
| ADS time | 0.15 s |
| Reload | 2.0 s |
| Effective range | 40 m (as a weapon) |
| Sound radius | 120 m |

Slots: Charm only.

Look: a bright orange plastic flare pistol with a fat barrel, a white trigger and a lanyard ring. Instantly recognizable as a safety item.

Use: flares fired upward reach 120 m and burn for 12 s, lighting the area (a dynamic light, the brightest in the game) and being visible from anywhere on the map. Red flares at a "flare extraction" (part 16) call a boat. Green flares signal your squad. White flares light a night raid. Fired at a target, a flare does 15 damage and sets them burning (5.9). Fired at a fuel drum, it ignites it.

## 6.3 SUBMACHINE GUNS

SMGs are long guns (they take a primary slot) but carry like pistols: fast ADS, high ergonomics, great hip-fire, short range. They're the indoor weapon, and the town has a lot of indoors.

### 6.3.1 Gannet

| Identity | |
|---|---|
| ID | `WPN_Gannet` |
| Manufacturer | Coastline Defense Systems |
| Class | SMG |
| Tier | 0 |
| Rarity | Common |
| Trader | The Captain, loyalty 1 |
| Price | 21,000 Scrip |

Fiction: "CDS took their rifle, shrank it, and fed it pistol magazines. It has every rail and every slot the big one has, which means you can make it either very good or very silly. The listening station's guards carried these. Plenty of them are still on the island, one way or another."

Operation: blowback-operated AR-pattern 9mm carbine, closed bolt, uses pistol-style double-stack magazines (the same as the Kestrel 9 family's extended mags, plus its own 32-round sticks).

| Stat | Value |
|---|---|
| Caliber | 9x19 |
| Default mag | 32-round stick |
| Fire modes | Semi, Auto |
| RPM | 850 |
| Weight | 2.60 kg |
| Length | 66 cm (stock extended) |
| Barrel | 7.5 in |
| Muzzle velocity | 395 m/s |
| Ergonomics | 76 |
| Vertical recoil | 0.95° |
| Horizontal recoil | 0.45° |
| Accuracy | 4.5 MOA |
| ADS time | 0.26 s |
| Reload | 2.15 s / 2.75 s |
| Durability burn | 0.03 |
| Effective range | 60 m |
| Sound radius | 180 m |

Slots: Muzzle, Barrel, Handguard, Upper Receiver (with optic rail), Optic, Rear Sight, Front Sight, Charging Handle, Stock (via buffer tube), Pistol Grip, Magazine, Trigger, Charm. Handguard sub-slots add Underbarrel, Side Rail Left, Side Rail Right, Top Rail Front.

Look: a compact AR-15-pattern SMG in black anodized aluminum. Its distinguishing feature is the thin, vertical magazine well for pistol mags (a shape very unlike a rifle mag well). The stock handguard is a short 7-inch M-LOK tube, and it comes with a collapsible six-position stock and a basic A2-style pistol grip. Flip-up iron sights. A gannet (seabird) diving, laser-etched on the mag well.

Sound: a fast, punchy, slightly hollow "bap-bap-bap". The buffer spring makes a faint boing on each shot if you're the shooter (a beloved AR detail). The bolt hold-open on empty locks back.

Animation notes: shares the AR rifle animation set (part 29) with SMG-specific reload timing for the pistol-mag shape (mags go in straight, no rock-in). Bolt catch release with the left hand.

### 6.3.2 Fulmar

| Identity | |
|---|---|
| ID | `WPN_Fulmar` |
| Manufacturer | Teller-Kaas |
| Class | SMG |
| Tier | 1 |
| Rarity | Uncommon |
| Trader | Tomasz, loyalty 2 |
| Price | 31,000 Scrip |

Fiction: "Roller-delayed, closed bolt, built like a Swiss watch by people who think the Swiss are sloppy. It shoots where you point it, every time, and it costs as much as a car. The police tactical unit on the Mainland had four. One of them came out to the islands on the last ferry and never left."

Operation: roller-delayed blowback, closed bolt, curved magazine, the HK-style "slap" charging handle on the left side of the forward tube.

| Stat | Value |
|---|---|
| Caliber | 9x19 |
| Default mag | 30-round curved |
| Fire modes | Semi, 3-round burst, Auto |
| RPM | 800 |
| Weight | 2.70 kg |
| Length | 68 cm (stock extended) |
| Barrel | 8.9 in |
| Muzzle velocity | 400 m/s |
| Ergonomics | 74 |
| Vertical recoil | 0.80° |
| Horizontal recoil | 0.35° |
| Accuracy | 3.5 MOA |
| ADS time | 0.27 s |
| Reload | 2.30 s / 3.00 s |
| Durability burn | 0.025 |
| Effective range | 70 m |
| Sound radius | 175 m |

Slots: Muzzle (three-lug, quick-attach, or threaded), Handguard (classic slim, wide tropical, rail), Stock (fixed, retractable, folding, none), Optic Mount (claw mount on the receiver top), Optic, Rear Sight (drum sight, built in), Pistol Grip / Trigger Group (the trigger group is one part that sets the fire modes: SEF, "Navy" group, burst group), Magazine, Charm.

Look: the classic MP5 silhouette, reinterpreted: a stamped steel receiver in black with a slight grey parkerized texture, the cocking tube over the barrel, a slim plastic handguard, a drum rear sight and a hooded front sight, a curved magazine. Teller-Kaas's logo (two interlocking T and K letters in a circle) stamped on the magazine well. Wear: silver showing through on the receiver edges and the cocking handle.

Sound: a smooth, tight, mechanical "chk-chk-chk" with a lower, more refined report than the Gannet. Its charging handle slap ("the HK slap") is a signature sound and animation.

Animation notes: the empty reload uses the HK slap (pull the charging handle back and lock it in the notch before the mag swap, then slap it down). The tactical reload skips that.

### 6.3.3 Shearwater

| Identity | |
|---|---|
| ID | `WPN_Shearwater` |
| Manufacturer | Coastline Defense Systems |
| Class | PDW |
| Tier | 2 |
| Rarity | Rare |
| Trader | Tomasz, loyalty 3 |
| Price | 46,000 Scrip |

Fiction: "Tiny rounds, very fast, very many. The little 5.7 bullet goes through soft armor like it isn't there and then tumbles once it gets inside. The listening station's response team carried these. The response team is now wearing kelp."

Operation: gas-operated short-stroke piston PDW, top-mounted horizontal 50-round magazine (a P90-like layout, but with a conventional pistol grip and a short folding stock rather than a bullpup thumbhole), ejecting downward.

| Stat | Value |
|---|---|
| Caliber | 5.7x28 |
| Default mag | 50-round top-loading |
| Fire modes | Semi, Auto |
| RPM | 900 |
| Weight | 2.80 kg |
| Length | 55 cm (stock extended) |
| Barrel | 10.4 in |
| Muzzle velocity | 715 m/s |
| Ergonomics | 72 |
| Vertical recoil | 0.70° |
| Horizontal recoil | 0.40° |
| Accuracy | 3.0 MOA |
| ADS time | 0.28 s |
| Reload | 2.90 s / 3.50 s |
| Durability burn | 0.03 |
| Effective range | 120 m |
| Sound radius | 210 m |

Slots: Muzzle, Optic (integrated rail on the mag housing), Side Rail (light/laser), Stock, Pistol Grip, Magazine, Foregrip (integrated hand stop or vertical grip), Charm.

Look: a strange, compact, futuristic PDW in olive drab polymer with the translucent smoky magazine lying flat along the top of the receiver (you can see the round count through it, which is a gameplay feature: the player can see their remaining ammo by looking at the gun). The body is smooth, rounded and wedge-shaped. A folding skeletal stock on the right side.

Sound: a sharp, high-pitched, snappy crack with a buzzy auto sound. Supersonic crack when rounds pass by.

Animation notes: the reload is unusual: the mag is pulled up and back off the top, and the new one pressed down and forward. Because of the translucent mag, the "check magazine" input shows the exact count.

### 6.3.4 Grackle

| Identity | |
|---|---|
| ID | `WPN_Grackle` |
| Manufacturer | Coastline Defense Systems |
| Class | SMG |
| Tier | 1 |
| Rarity | Uncommon |
| Trader | Tomasz, loyalty 1 |
| Price | 24,500 Scrip |

Fiction: "A .45 SMG that fires slowly enough to count the rounds and hits hard enough that you won't need to. Polymer, cheap, honest. The police station had a rack of these for 'public order situations', which on Saltmarrow meant the Kittiwake on a Saturday."

Operation: straight blowback, closed bolt, polymer receiver, 25-round double stack magazine, side-folding stock (UMP-like).

| Stat | Value |
|---|---|
| Caliber | .45 ACP |
| Default mag | 25-round |
| Fire modes | Semi, 2-round burst, Auto |
| RPM | 600 |
| Weight | 2.50 kg |
| Length | 69 cm |
| Barrel | 8.0 in |
| Muzzle velocity | 275 m/s |
| Ergonomics | 78 |
| Vertical recoil | 1.15° |
| Horizontal recoil | 0.40° |
| Accuracy | 4.2 MOA |
| ADS time | 0.25 s |
| Reload | 2.20 s / 2.80 s |
| Durability burn | 0.025 |
| Effective range | 55 m |
| Sound radius | 150 m |

Slots: Muzzle, Optic (top rail), Side Rails (left, right), Underbarrel, Stock, Magazine, Barrel, Charm.

Look: a chunky, slab-sided polymer SMG in grey with a skeletonized side-folding stock, integrated rails at 3, 6, 9 and 12 o'clock, and a ribbed magazine. It looks cheap and businesslike. The ejection port is big, and the brass is fat.

Sound: a deep "thump-thump-thump", slow and heavy, quieter than 9mm SMGs (subsonic round).

Animation notes: slow, deliberate reload with a center-mounted charging handle on top.

### 6.3.5 Bilge Pump

| Identity | |
|---|---|
| ID | `WPN_BilgePump` |
| Manufacturer | Salvage-made (the Halcyon workshops) |
| Class | SMG |
| Tier | 1 |
| Rarity | Common |
| Trader | Nils, loyalty 1, and Scavenger loadout pool |
| Price | 6,500 Scrip |

Fiction: "A steel tube, a spring, a bolt and a trigger, welded together in the engine room by a man who learned welding from a book. It fires from an open bolt, so it fires the moment you so much as look at it. Keep your finger off the trigger. Keep your hand off the magazine well. Keep your dignity somewhere else."

Operation: open bolt, straight blowback, side-mounted magazine (Sten-like), stamped and welded steel tube receiver. A deliberately crude design.

| Stat | Value |
|---|---|
| Caliber | 9x19 |
| Default mag | 32-round side-loading |
| Fire modes | Auto only |
| RPM | 550 |
| Weight | 3.10 kg |
| Length | 76 cm |
| Barrel | 7.8 in |
| Muzzle velocity | 360 m/s |
| Ergonomics | 58 |
| Vertical recoil | 1.10° |
| Horizontal recoil | 0.80° |
| Accuracy | 9.0 MOA |
| ADS time | 0.32 s |
| Reload | 2.50 s / 3.10 s |
| Durability burn | 0.06 |
| Effective range | 40 m |
| Sound radius | 170 m |

Slots: Muzzle (suppressor shroud only: the "Bilge Pump Can", a welded-on oil filter suppressor), Stock (wire, wooden, none), Magazine, Sight (welded peep sight or a cheap red dot zip-tied on, which is a real part called "Zip-Tie Mount"), Charm.

Look: a grey steel tube with visible weld beads, rust spots, a wire skeleton stock with a piece of rubber tube wrapped on the butt for padding, a side magazine sticking out to the left, and a trigger guard made from a bent piece of rebar. Painted with a crude hand-stenciled "HALCYON" in white on the receiver. A safety catch made from a bolt in a slot. It's ugly, charming and slightly dangerous.

Sound: a rattling, clanky, metallic "brrrap" with lots of mechanical noise. The bolt slamming forward on an open-bolt gun has a distinct "clunk" before each burst.

Special rules: open bolt: there's no round in the chamber, and the first shot of each burst has a 0.05 s delay (the bolt travel). 1% chance per shot at any durability to "run away" (keep firing for 3 to 6 rounds after releasing the trigger). It's funny, rare and on-brand. Dropping a Bilge Pump on the ground has a 10% chance to fire a round (it's an open-bolt gun without a proper safety).

## 6.4 ASSAULT RIFLES AND CARBINES

The backbone of the game. Most players will carry one. They're good at everything from 10 to 300 m and great at nothing in particular, which is exactly why the gunsmith matters most for them.

### 6.4.1 Mako AR

| Identity | |
|---|---|
| ID | `WPN_Mako` |
| Manufacturer | Coastline Defense Systems |
| Class | Assault rifle |
| Tier | 0 |
| Rarity | Uncommon |
| Trader | Tomasz, loyalty 1 |
| Price | 38,000 Scrip |

Fiction: "The rifle everyone knows. Aluminum receivers, a gas tube, a buffer tube, and enough aftermarket parts in the world to build a second one out of nothing but accessories. Tomasz says the trigger is bad. Tomasz says everything is bad until he's touched it."

Operation: direct impingement gas system, rotating bolt, AR-15 pattern. 5.56x45 STANAG-style magazines. This is the gunsmith showcase weapon: it has the most slots and the largest part catalog in the game.

| Stat | Value |
|---|---|
| Caliber | 5.56x45 |
| Default mag | 30-round STANAG-style |
| Fire modes | Semi, Auto |
| RPM | 750 |
| Weight | 3.20 kg |
| Length | 84 cm (stock extended) |
| Barrel | 14.5 in |
| Muzzle velocity | 900 m/s (M855-type, reduced from reference by barrel length) |
| Ergonomics | 64 |
| Vertical recoil | 1.15° |
| Horizontal recoil | 0.40° |
| Accuracy | 2.6 MOA |
| ADS time | 0.31 s |
| Reload | 2.40 s / 3.05 s |
| Durability burn | 0.035 |
| Effective range | 300 m |
| Sound radius | 320 m |

Slots: Muzzle, Gas Block, Barrel, Handguard, Upper Receiver, Optic Mount, Optic, Rear Sight, Front Sight, Charging Handle, Lower Receiver, Pistol Grip, Trigger, Buffer Tube, Stock, Magazine, Dust Cover, Charm, plus handguard sub-slots: Top Rail Front, Underbarrel, Side Left, Side Right, Bottom Front, and stock sub-slots: Cheek Riser, Butt Pad.

That's 18 base slots, and over 25 with sub-slots. It's the deepest weapon in the game on purpose.

Look: the stock Mako is a 14.5-inch carbine with a black anodized upper and lower, an 11-inch free-float M-LOK handguard, a pinned muzzle brake (A2-style birdcage by default), a carbine-length gas tube under the handguard, a six-position collapsible stock, an A2 pistol grip, a forward assist and a dust cover, and flip-up BUIS. A Mako shark logo laser-engraved on the magwell's left side, with "CDS MAKO 5.56 NATO" on the right. It should look like a real-world AR without being any specific brand.

Sound: a sharp crack with a slightly springy mechanical layer (the buffer). Auto fire is a fast, even "tak-tak-tak-tak". The gas system's "psst" is audible in suppressed configurations, along with the buffer spring.

Animation notes: AR manual of arms: mag release on the right with the trigger finger, bolt catch on the left, charging handle pull on empty for some charging handle parts (the ambidextrous charging handle part enables a one-handed rack animation). Forward assist bump is part of the inspect animation.

### 6.4.2 Skerry Carbine

| Identity | |
|---|---|
| ID | `WPN_Skerry` |
| Manufacturer | Coastline Defense Systems |
| Class | Carbine |
| Tier | 1 |
| Rarity | Uncommon |
| Trader | Tomasz, loyalty 2 |
| Price | 44,000 Scrip |

Fiction: "Short, quiet, nasty. A ten-inch piston carbine in .300 Blackout, which means it hits like a rifle and, with the right can and subsonic loads, sounds like a stapler. The listening station's security team liked them for night patrols. You'll like it for the same reason."

Operation: short-stroke gas piston, rotating bolt, AR-pattern lower with a proprietary upper. Uses the same 30-round magazines as the Mako (in .300 BLK, which fits STANAG mags), but with a ".300" painted base plate to avoid mixing.

| Stat | Value |
|---|---|
| Caliber | .300 BLK |
| Default mag | 30-round |
| Fire modes | Semi, Auto |
| RPM | 780 |
| Weight | 2.90 kg |
| Length | 72 cm (stock extended) |
| Barrel | 10.5 in |
| Muzzle velocity | 300 m/s subsonic, 640 m/s supersonic |
| Ergonomics | 70 |
| Vertical recoil | 1.25° |
| Horizontal recoil | 0.50° |
| Accuracy | 3.0 MOA |
| ADS time | 0.28 s |
| Reload | 2.35 s / 2.95 s |
| Durability burn | 0.03 |
| Effective range | 150 m subsonic, 250 m supersonic |
| Sound radius | 280 m |

Slots: same as the Mako minus Gas Block (the piston system has an adjustable gas regulator instead, as a slot: "Gas Regulator", with settings for suppressed or unsuppressed that change recoil and reliability), and with a shorter handguard family.

Look: stubby and purposeful, with a 10-inch slotted handguard, a chunky piston-housing visible through the handguard slots, a flat dark earth finish, and a minimalist stock. The upper has a different profile from the Mako: slightly taller, with a non-reciprocating side charging handle on the left.

Sound: unsuppressed, a deep and short crack. Suppressed with subsonic: a quiet thud and a click, mechanical noise louder than the shot.

Animation notes: side charging handle on the left for empty reloads.

### 6.4.3 Bora

| Identity | |
|---|---|
| ID | `WPN_Bora` |
| Manufacturer | Volkov Mechanical Works |
| Class | Assault rifle |
| Tier | 0 |
| Rarity | Common |
| Trader | Nils, loyalty 1 |
| Price | 29,000 Scrip |

Fiction: "Stamped steel, laminated wood and a gas piston the size of a broom handle. You could leave it in the harbor mud for a year, pull it out, and it would fire. You could also hit a barn with it at two hundred meters, eventually. The Wardens love it. Everybody else respects it."

Operation: long-stroke gas piston, rotating bolt, stamped steel receiver, side-mounted dust cover, AK-pattern. 7.62x39, 30-round curved magazines.

| Stat | Value |
|---|---|
| Caliber | 7.62x39 |
| Default mag | 30-round curved steel |
| Fire modes | Auto, Semi (the selector goes safe, auto, semi, the AK order) |
| RPM | 620 |
| Weight | 3.60 kg |
| Length | 88 cm |
| Barrel | 16.3 in |
| Muzzle velocity | 715 m/s |
| Ergonomics | 52 |
| Vertical recoil | 1.60° |
| Horizontal recoil | 0.65° |
| Accuracy | 3.8 MOA |
| ADS time | 0.34 s |
| Reload | 2.55 s / 3.20 s |
| Durability burn | 0.02 |
| Effective range | 250 m |
| Sound radius | 340 m |

Slots: Muzzle, Gas Tube / Upper Handguard, Lower Handguard, Dust Cover (the rail dust cover allows a forward optic position), Side Mount (for optics, the classic side rail on the left of the receiver), Optic, Rear Sight, Front Sight Block, Pistol Grip, Stock, Magazine, Trigger, Charm. Lower handguard sub-slots: Underbarrel, Side Rails.

Look: the AK silhouette with distinctive VMW touches: a laminated birch handguard and stock in a reddish-brown "plum" laminate, a slant muzzle brake, a stamped steel receiver in a black-grey phosphate finish with visible rivets, a sling swivel on the front sight block, and a Bakelite-look orange-brown magazine. Wear: the finish worn to bright steel on the dust cover and magazine edges, the wood darkened with handling.

Sound: a heavy, harsh "ka-chunk" report with a deep low end and a rattly mechanical tail. Auto is a slower, chunkier "dug-dug-dug". The selector's loud clack is famous.

Animation notes: AK manual of arms: rock-in magazine insertion (hook the front, rock back), paddle mag release, right-hand charging handle reach-over on empty. The tactical reload uses the "mag-on-mag" technique (strip the old mag with the new mag), which looks great and is a well-known move.

### 6.4.4 Bora-S

| Identity | |
|---|---|
| ID | `WPN_BoraS` |
| Manufacturer | Volkov Mechanical Works |
| Class | Assault rifle |
| Tier | 1 |
| Rarity | Uncommon |
| Trader | Nils, loyalty 2 |
| Price | 36,000 Scrip |

Fiction: "The same rifle with a smaller, faster round and a big brake on the front to stop it climbing. Shoots flatter, kicks less, wounds worse. The Wardens' officers carry the S. Take that as a warning or a shopping list."

Operation: as the Bora, in 5.45x39, with a large two-chamber muzzle brake, a polymer furniture set, and a side-folding skeletal stock.

| Stat | Value |
|---|---|
| Caliber | 5.45x39 |
| Default mag | 30-round polymer |
| Fire modes | Auto, Semi |
| RPM | 650 |
| Weight | 3.40 kg |
| Length | 94 cm (stock extended) |
| Barrel | 16.3 in |
| Muzzle velocity | 880 m/s |
| Ergonomics | 56 |
| Vertical recoil | 1.05° |
| Horizontal recoil | 0.40° |
| Accuracy | 3.0 MOA |
| ADS time | 0.33 s |
| Reload | 2.50 s / 3.15 s |
| Durability burn | 0.02 |
| Effective range | 300 m |
| Sound radius | 330 m |

Slots: as the Bora.

Look: black polymer furniture with plum polymer magazines, a side-folding triangle stock, the big two-port brake that's a defining silhouette, and a slightly cleaner phosphate finish than the Bora.

Sound: sharper and snappier than the Bora, with a loud brake blast that's very unpleasant to stand beside.

### 6.4.5 Petrel

| Identity | |
|---|---|
| ID | `WPN_Petrel` |
| Manufacturer | Northern Arsenal |
| Class | Bullpup assault rifle |
| Tier | 2 |
| Rarity | Rare |
| Trader | The Captain, loyalty 3 |
| Price | 52,000 Scrip |

Fiction: "The Mainland army's rifle, a bullpup with a long barrel in a short body and an optic built into the carry handle. The trigger is mushy and the magazine change is awkward. It's also the most accurate rifle you can fit through a ferry door. A whole crate came over for the listening station in Year 0 and went missing in Year 1."

Operation: short-stroke gas piston, rotating bolt, bullpup (the magazine and action are behind the trigger, in the stock). 5.56x45, STANAG magazines. Integrated 1.5x optic in the carry handle (removable for a rail).

| Stat | Value |
|---|---|
| Caliber | 5.56x45 |
| Default mag | 30-round STANAG-style |
| Fire modes | Semi, Auto |
| RPM | 700 |
| Weight | 3.80 kg |
| Length | 72 cm |
| Barrel | 20.0 in |
| Muzzle velocity | 960 m/s |
| Ergonomics | 60 |
| Vertical recoil | 0.95° |
| Horizontal recoil | 0.30° |
| Accuracy | 1.8 MOA |
| ADS time | 0.33 s |
| Reload | 2.85 s / 3.50 s |
| Durability burn | 0.03 |
| Effective range | 400 m |
| Sound radius | 330 m |

Slots: Muzzle, Optic (integrated carry handle optic, or a top rail replacing it), Handguard (short rail options), Underbarrel, Side Rail, Magazine, Butt Pad, Charm. Fewer slots than the Mako; bullpups trade customization for barrel length.

Look: a boxy, angular bullpup in matte green-grey polymer, a big trigger guard that covers the whole hand, the integrated optic sitting high in a carrying handle on top, the magazine well behind the pistol grip, and an ejection port on the right side only (left-shoulder firing ejects brass into your face; this is a joke for the inspect animation, not a mechanic). Northern Arsenal's three-crown stamp on the stock.

Sound: a sharp crack slightly louder in first person (the action is next to your face). A distinct, muffled mechanical sound because the action's inside the stock.

Animation notes: bullpup reload: the mag is behind the grip, so the left hand reaches back to the stock. The charging handle is under the front of the handguard on the left. Shoulder swap in third person doesn't flip the gun (it's right-hand only).

### 6.4.6 Corsair

| Identity | |
|---|---|
| ID | `WPN_Corsair` |
| Manufacturer | Teller-Kaas |
| Class | Assault rifle |
| Tier | 2 |
| Rarity | Rare |
| Trader | Tomasz, loyalty 3 |
| Price | 61,000 Scrip |

Fiction: "Teller-Kaas looked at the CDS rifle and decided it was too dirty, so they put a piston in it, a heavier bolt carrier, a thicker barrel, and a price tag that should be illegal. It runs wet, it runs salted, it runs suppressed all day. It is the best 5.56 rifle on the islands, and the people who know that are the people you don't want to meet."

Operation: short-stroke gas piston, rotating bolt, AR-compatible lower with a proprietary upper, adjustable two-position gas regulator. Takes STANAG magazines and most Mako lower parts (pistol grips, stocks, buffer tubes, triggers), which is a nice gunsmith interaction: parts from your Mako move over.

| Stat | Value |
|---|---|
| Caliber | 5.56x45 |
| Default mag | 30-round STANAG-style (Teller-Kaas polymer) |
| Fire modes | Semi, Auto |
| RPM | 820 |
| Weight | 3.60 kg |
| Length | 85 cm (stock extended) |
| Barrel | 14.5 in (heavy profile) |
| Muzzle velocity | 910 m/s |
| Ergonomics | 62 |
| Vertical recoil | 0.98° |
| Horizontal recoil | 0.32° |
| Accuracy | 1.9 MOA |
| ADS time | 0.32 s |
| Reload | 2.40 s / 3.00 s |
| Durability burn | 0.02 |
| Effective range | 350 m |
| Sound radius | 320 m |

Slots: as the Mako, with Gas Regulator replacing Gas Block and a proprietary handguard family (Teller-Kaas handguards only).

Look: an AR silhouette in a distinctive grey-tan "RAL 8000"-type finish with a thick, rounded, quad-rail handguard, a big flat-sided upper with a piston bulge, and a distinctive slim stock with a storage compartment. Teller-Kaas's logo is on the magwell. It looks like an AR's more expensive cousin.

Sound: a slightly deeper, tighter crack than the Mako, with less "boing" and more "clunk". Very smooth auto fire.

## 6.5 THE STARTING ARSENAL RULE

For Tier 0, build these four first, completely, before any other weapon: Kestrel 9, Gannet, Mako, Fathom (from part 07). They cover the four main animation sets (pistol, AR-pattern, bolt-action) and the four main ballistic profiles (pistol, SMG, intermediate rifle, full-power rifle). Every system (ballistics, recoil, sway, reloads, malfunctions, gunsmith, VFX, audio, animation) must be proven on these four before you add the fifth.

---

End of part 06. Next: `07_WEAPONS_CATALOG_PART2.md`.
