# SALTMARROW: PART 09, THE ATTACHMENT CATALOG

This is the parts list. Every entry becomes a `USMAttachmentDefinition` asset. Stats use the modifier notation from part 08: `Ergo +6` is AddFlat to ergonomics, `VRec -8%` is AddPercent to vertical recoil, `HRec -5%` horizontal recoil, `Acc -4%` is a 4% tighter MOA (lower is better), `Snd -55%` is sound radius reduction, `ADS +0.03s` is an ADS time penalty, `Vel +2%` muzzle velocity. Weight in kg. Size in inventory cells (W×H). Price in Scrip. Rarity: C (common), U (uncommon), R (rare), E (epic), L (legendary).

Where a part has sub-slots, they're listed. Where a part is shared by weapon families through interface tags, the "Fits" column names the interface, not the weapon.

The catalog is large. Build it in this order: the Mako's full tree first (it exercises every system), then universal parts (optics, lights, lasers, foregrips), then each weapon family. Tier 0 needs at least the parts marked ★.

---

## 9.1 OPTICS

Optics are the most visible, most valued and most technically complex parts. Every optic has: a reticle (part 26 builds them procedurally as materials), a magnification (fixed or variable range), an eye relief range, a field of view in the scope, an ADS penalty, a zeroing range and step, illumination (some have brightness levels, with a key to cycle), and a lens material set (tint, glare, dirt, rain droplets during the Surge, fogging after water).

Mounting: red dots and holographics mount directly to picatinny (`Rail.Picatinny`). Tube scopes need rings or a one-piece mount (`Mount.Rings30mm`, `Mount.Rings34mm`). Some optics have their own integrated mount. The AK family uses a side dovetail (`Rail.Dovetail.AK`) through a side mount part that provides a picatinny top. The HK family uses a claw mount (`Rail.ClawHK`).

### 9.1.1 Reflex and red dot sights (1x)

| ID | Name | Mfr | Fits | Reticle | Weight | Size | Ergo | ADS | Price | Rarity | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPT_LumenMRD ★ | Lumen MRD | Lumen Precision | Picatinny, Pistol slide cut | 3 MOA dot | 0.04 | 1×1 | 0 | +0.00 | 4,800 | C | Tiny pistol dot, also fits rifles on a riser |
| OPT_LumenR2 ★ | Lumen R2 | Lumen Precision | Picatinny | 2 MOA dot | 0.12 | 1×1 | -1 | +0.01 | 9,500 | C | The standard tube red dot, low mount included |
| OPT_LumenR2T | Lumen R2-T | Lumen Precision | Picatinny | 2 MOA dot + 65 MOA ring | 0.14 | 1×1 | -1 | +0.01 | 13,000 | U | Circle-dot reticle, better for close range |
| OPT_LumenLH1 ★ | Lumen LH-1 Holographic | Lumen Precision | Picatinny | 1 MOA dot + 68 MOA ring | 0.31 | 2×1 | -3 | +0.02 | 21,000 | U | Holographic: the reticle stays sharp with astigmatism (fluff), works with a magnifier, large window |
| OPT_LumenLH2 | Lumen LH-2 Holographic | Lumen Precision | Picatinny | 1 MOA dot + 65 MOA ring + BDC dots | 0.33 | 2×1 | -3 | +0.02 | 28,000 | R | Two holdover dots for 300 m and 500 m (5.56) |
| OPT_TidewaterRDS | Tidewater Sportsman Red Dot | Tidewater | Picatinny, Dovetail 11mm | 4 MOA dot | 0.22 | 2×1 | -2 | +0.02 | 3,500 | C | Cheap, blurry glass (slight tint and a soft dot), battery dies at 5% chance per raid (dot disappears; replace battery item) |
| OPT_ZipTie | Zip-Tie Red Dot | Salvage | Zip-Tie Mount | 6 MOA dot | 0.18 | 1×1 | -2 | +0.02 | 1,200 | C | A cheap dot zip-tied to a salvage gun. Shifts zero by up to 3 MOA every 20 shots |
| OPT_VMWKobra | VMW Kobra-pattern Reflex | VMW | Dovetail AK | Selectable: dot, chevron, post | 0.25 | 2×1 | -2 | +0.02 | 11,000 | U | AK side mount reflex, three selectable reticles |
| OPT_LumenPrism1x | Lumen 1x Prism | Lumen Precision | Picatinny | Etched circle-dot (works without battery) | 0.26 | 1×1 | -2 | +0.02 | 16,000 | U | Etched reticle visible with dead battery |

### 9.1.2 Magnifiers

Magnifiers sit behind a 1x optic on the same rail and flip to the side (a toggle with Left Alt in ADS). They multiply the optic's magnification.

| ID | Name | Mag | Weight | Size | Ergo | ADS | Price | Rarity |
|---|---|---|---|---|---|---|---|---|
| OPT_LumenMag3 | Lumen 3x Flip Magnifier | 3x | 0.34 | 2×1 | -4 | +0.03 | 19,000 | U |
| OPT_LumenMag5 | Lumen 5x Flip Magnifier | 5x | 0.42 | 2×1 | -5 | +0.04 | 31,000 | R |

### 9.1.3 Prism and low-power magnified optics

| ID | Name | Mfr | Fits | Mag | Reticle | Weight | Size | Ergo | ADS | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPT_HarrowP3 | Harrow P3 Prism | Harrow Optical | Picatinny | 3x | BDC chevron (5.56) | 0.42 | 2×1 | -4 | +0.04 | 26,000 | U |
| OPT_HarrowA4 ★ | Harrow ACR-4 | Harrow Optical | Picatinny (integrated mount) | 4x | BDC chevron with fiber optic illumination (5.56 or 7.62 versions) | 0.45 | 2×1 | -4 | +0.05 | 38,000 | R |
| OPT_PetrelSight | Northern Arsenal SUSAT-pattern | Northern Arsenal | Petrel carry handle (integrated) | 1.5x | Post | 0.30 | n/a | 0 | 0 | stock | C |
| OPT_VMWPSO | VMW PSO-pattern | VMW | Dovetail AK, Side Mount Drakon | 4x | Chevron with rangefinder curve | 0.62 | 3×1 | -5 | +0.05 | 24,000 | U |

### 9.1.4 Variable power scopes (LPVO and above)

Variable power: the player cycles magnification with the mouse wheel while ADS (with a modifier key so the wheel doesn't change zero at the same time; configurable). The scope's field of view changes with magnification. First focal plane (FFP) reticles scale with zoom (BDC marks stay correct at every zoom); second focal plane (SFP) reticles stay the same size (BDC marks only correct at max zoom). Both types exist because the difference matters to enthusiasts and is easy for us (one boolean in the reticle material).

| ID | Name | Mfr | Mount | Mag range | FFP/SFP | Reticle | Weight | Size | Ergo | ADS | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OPT_HarrowL6 | Harrow L1-6 | Harrow | 30mm rings | 1x to 6x | SFP | Illuminated dot in a horseshoe, BDC below | 0.58 | 3×1 | -6 | +0.06 | 42,000 | R |
| OPT_HarrowL8 | Harrow L1-8 | Harrow | 34mm rings | 1x to 8x | FFP | Illuminated center, mil-hash tree | 0.70 | 3×1 | -7 | +0.07 | 58,000 | E |
| OPT_TidewaterHunter | Tidewater 3-9x40 | Tidewater | 1 inch rings (uses Rings30 with adapter tag) | 3x to 9x | SFP | Duplex | 0.48 | 3×1 | -5 | +0.06 | 14,000 | C |
| OPT_HalvorsenH12 ★ | Halvorsen Optikk 3-12x50 | Halvorsen | 30mm rings | 3x to 12x | FFP | Mil-dot | 0.74 | 3×1 | -7 | +0.07 | 46,000 | R |
| OPT_HarrowLR25 | Harrow Long Range 5-25x56 | Harrow | 34mm rings | 5x to 25x | FFP | Christmas tree mil reticle with wind holds | 1.05 | 4×1 | -10 | +0.10 | 88,000 | E |
| OPT_LeviathanScope | Halvorsen Leviathan 6-30x | Halvorsen | Leviathan rail | 6x to 30x | FFP | Leviathan reticle | 1.20 | 4×1 | -11 | +0.11 | raid only | L |

### 9.1.5 Thermal and night optics (Tier 2)

| ID | Name | Mag | Mode | Weight | Size | Ergo | ADS | Price | Rarity | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| OPT_NordlysThermal | Nordlys TS-2 Thermal | 2x/4x digital | White-hot, black-hot, iron-red palettes | 0.82 | 3×2 | -9 | +0.08 | 140,000 | E | Hollows are cold (they show dim blue-grey, which is a great lore detail: dead bodies are cold). Players show hot. The Surge's rain lowers thermal contrast. Battery 30 minutes of use. |
| OPT_NordlysNV | Nordlys NS-1 Night Sight | 3x | Gen 2 green phosphor | 0.70 | 3×1 | -8 | +0.07 | 92,000 | E | Blooms near bright lights. Useless in daylight (whiteout). |

### 9.1.6 Mounts and risers

| ID | Name | Fits on | Provides | Height | Weight | Ergo | Price | Rarity |
|---|---|---|---|---|---|---|---|---|
| MNT_LumenRiserLow ★ | Lumen Low Mount | Picatinny | Picatinny (short) | 0.83 in | 0.05 | 0 | 1,800 | C |
| MNT_LumenRiserAbs ★ | Lumen QD Riser 1.93 | Picatinny | Picatinny (short) | 1.93 in | 0.09 | -1 | 4,200 | C |
| MNT_Rings30Low | Fen 30mm Rings Low | Picatinny | Rings30 | 0.9 in | 0.11 | -1 | 3,100 | C |
| MNT_Rings30Med ★ | Fen 30mm Rings Medium | Picatinny | Rings30 | 1.1 in | 0.12 | -1 | 3,400 | C |
| MNT_Rings34 | Fen 34mm Rings | Picatinny | Rings34 | 1.1 in | 0.14 | -1 | 4,800 | U |
| MNT_Cantilever30 | Brack 30mm Cantilever | Picatinny (long rail only) | Rings30, plus a 45° offset picatinny | 1.54 in | 0.27 | -2 | 9,800 | U |
| MNT_Cantilever34 | Brack 34mm Cantilever | Picatinny (long rail only) | Rings34, plus 45° offset | 1.54 in | 0.30 | -2 | 11,500 | R |
| MNT_Offset45 | Fen 45° Offset Mount | Picatinny | Picatinny (canted, secondary sight) | n/a | 0.04 | 0 | 2,600 | U |
| MNT_AKSideRail | VMW Side Rail Mount | Dovetail AK | Picatinny | n/a | 0.24 | -2 | 6,200 | C |
| MNT_AKSideB13 | Fen Low-Profile AK Side Mount | Dovetail AK | Picatinny (low over bore) | n/a | 0.20 | -1 | 9,000 | U |
| MNT_HKClaw | Teller-Kaas Claw Mount | Claw HK | Picatinny | n/a | 0.20 | -1 | 7,500 | U |
| MNT_ScoutRail | Wren Scout Rail | Tern barrel, Old Mariner scout | Picatinny (forward) | n/a | 0.10 | 0 | 4,500 | U |
| MNT_ZipTie | Zip-Tie Mount | Salvage weapons | Zip-Tie | n/a | 0.01 | 0 | 50 | C |

Heights matter: higher mounts need a cheek riser for a proper cheek weld, and without one the ADS sway increases by 10% (a "poor cheek weld" penalty), shown as a warning in the gunsmith.

## 9.2 IRON SIGHTS

| ID | Name | Fits | Type | Weight | Price | Rarity |
|---|---|---|---|---|---|---|
| SGT_FlipRear ★ | Fen Flip-Up Rear | Picatinny | Aperture, flips down when an optic is mounted in front of it | 0.06 | 1,500 | C |
| SGT_FlipFront ★ | Fen Flip-Up Front | Picatinny (gas block or handguard front) | Post | 0.05 | 1,500 | C |
| SGT_FixedRear | CDS Carry Handle Rear | Picatinny | A2-style carry handle | 0.20 | 2,200 | C |
| SGT_FSBFront | CDS A-Frame Front Sight | Gas block slot (FSB) | Post on gas block | 0.11 | 1,400 | C |
| SGT_OffsetIrons | Fen 45° Offset Irons | Picatinny (side) | Canted secondary sight | 0.07 | 3,800 | U |
| SGT_GhostRing | Marlowe Ghost Ring | Shotgun receiver rail | Large aperture | 0.08 | 2,000 | C |
| SGT_TritiumPistol | Lumen Night Sights (pistol) | Pistol slide | Glowing three-dot | 0.01 | 3,500 | U |
| SGT_FiberFront | Fen Fiber Front | Pistol slide, shotgun bead | Bright red fiber optic post | 0.01 | 1,800 | U |

## 9.3 MUZZLE DEVICES

### 9.3.1 Flash hiders, brakes and compensators

| ID | Name | Fits | Weight | Ergo | VRec | HRec | Acc | Snd | Flash | QD interface | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MZL_A2Birdcage ★ | CDS A2 Birdcage | Thread 556 | 0.06 | 0 | -2% | -2% | 0 | 0 | -40% | none | 900 | C |
| MZL_KittredgeK2 ★ | Kittredge K2 Brake | Thread 556 | 0.09 | -1 | -12% | -10% | +3% | +15% | +10% | QD.Kittredge | 6,800 | U |
| MZL_KittredgeK3 | Kittredge K3 Compensator | Thread 556 | 0.10 | -1 | -15% | -6% | +2% | +12% | +5% | QD.Kittredge | 8,500 | U |
| MZL_QuietusFH | Quietus Flash Hider QD | Thread 556 | 0.08 | 0 | -4% | -3% | 0 | 0 | -70% | QD.Quietus | 5,500 | U |
| MZL_QuietusBrake | Quietus Muzzle Brake QD | Thread 556 | 0.11 | -1 | -11% | -9% | +2% | +18% | +15% | QD.Quietus | 7,900 | R |
| MZL_TidewaterComp | Tidewater Linear Comp | Thread 556 | 0.12 | -1 | -6% | -4% | 0 | -5% (pushes sound forward) | -20% | none | 3,200 | C |
| MZL_AKSlant ★ | VMW Slant Brake (7.62) | Thread 762x39 | 0.04 | 0 | -6% | -5% | 0 | 0 | 0 | none | 700 | C |
| MZL_AK74Brake | VMW Two-Chamber Brake (5.45) | Thread 545 | 0.07 | 0 | -14% | -8% | 0 | +15% | +10% | none | 2,400 | C |
| MZL_AKKittredge | Kittredge AK Brake | Thread 762x39, Thread 545 (variants) | 0.10 | -1 | -16% | -11% | +2% | +20% | +15% | QD.Kittredge | 9,500 | R |
| MZL_HK3Lug | Teller-Kaas 3-Lug Adapter | Fulmar barrel | 0.05 | 0 | 0 | 0 | 0 | 0 | 0 | QD.HK3Lug | 2,800 | U |
| MZL_HKFlash | Teller-Kaas Prong Flash Hider | Albatross barrel | 0.08 | 0 | -3% | -2% | 0 | 0 | -60% | none | 1,800 | C |
| MZL_762Brake | Kittredge K7 Brake (7.62x51) | Thread 762 | 0.15 | -2 | -18% | -12% | +2% | +22% | +20% | QD.Kittredge | 12,000 | R |
| MZL_PistolComp | Kittredge Pistol Comp | Pistol threaded barrel | 0.04 | -1 | -15% | -5% | 0 | +10% | +20% | none | 4,500 | U |
| MZL_Breacher | Marlowe Breaching Choke | Breaker breacher barrel | 0.10 | -1 | -5% | 0 | +10% | +5% | 0 | none | 3,000 | U | Melee damage +40% with this muzzle |
| MZL_ThreadProtector | Thread Protector | Any thread | 0.01 | 0 | 0 | 0 | 0 | 0 | 0 | none | 100 | C |

### 9.3.2 Suppressors

| ID | Name | Rating | Mount | Weight | Length | Ergo | VRec | Acc | Snd (super) | Snd (sub) | Heat/shot | Durability burn | POI shift | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SUP_QuietusQ9 ★ | Quietus Q9 | Pistol (9mm, .45, 5.7) | Direct thread (pistols, SMGs) | 0.24 | 16 cm | -4 | -10% | 0 | -55% | -85% | 0.6% | +10% | 0.5 MOA | 18,000 | U |
| SUP_QuietusQ5 ★ | Quietus Q5 | Intermediate (5.56, 5.45, .300) | QD.Quietus | 0.45 | 17 cm | -6 | -12% | +2% | -55% | -82% | 0.8% | +15% | 1.0 MOA | 32,000 | R |
| SUP_QuietusQ7 | Quietus Q7 | Full power (7.62x51, 7.62x54R, x39) | QD.Quietus | 0.62 | 20 cm | -8 | -14% | +2% | -50% | -78% | 0.9% | +18% | 1.2 MOA | 46,000 | R |
| SUP_KittredgeKS | Kittredge KS-1 | Intermediate | QD.Kittredge | 0.52 | 15 cm | -6 | -14% | +2% | -50% | -80% | 0.9% | +20% | 1.5 MOA | 28,000 | U |
| SUP_KittredgeKS7 | Kittredge KS-7 | Full power | QD.Kittredge | 0.70 | 19 cm | -9 | -15% | +3% | -48% | -75% | 1.0% | +22% | 1.8 MOA | 42,000 | R |
| SUP_HKCan | Teller-Kaas TK-SD | Pistol | QD.HK3Lug | 0.38 | 18 cm | -5 | -8% | 0 | -60% | -88% | 0.5% | +8% | 0.3 MOA | 26,000 | R |
| SUP_VMWPBS | VMW PBS-pattern | Intermediate (AK 7.62, AK 5.45) | Direct thread AK | 0.55 | 20 cm | -7 | -10% | +3% | -45% | -80% | 1.1% | +25% | 2.0 MOA | 21,000 | U |
| SUP_OilFilter | Oil Filter Suppressor | Pistol and intermediate | Direct thread (any, with adapter) | 0.40 | 14 cm | -6 | -6% | +8% | -35% | -60% | 1.5% | +40% | 4.0 MOA | 2,500 | C | Degrades 10% per magazine fired. At 0, it's useless and must be replaced. |
| SUP_Leviathan | Halvorsen Leviathan Can | Magnum | Leviathan thread | 0.95 | 24 cm | -10 | -18% | +2% | -45% | n/a | 0.7% | +15% | 1.0 MOA | raid only | L |
| SUP_ShotgunCan | Quietus Q12 | Shotgun | Thread 12ga (breaker field barrel, Squall) | 0.82 | 26 cm | -10 | -8% | +5% | -40% | n/a | 0.8% | +20% | n/a | 34,000 | E |
| SUP_Integral | Skerry Integral Shroud | Intermediate | Skerry barrel replacement (barrel part with integral can) | 0.85 | 26 cm | -7 | -16% | 0 | -60% | -88% | 0.5% | +10% | 0 | 48,000 | E |

## 9.4 BARRELS

Barrels change length (velocity, weight, length, ergonomics via balance), MOA, durability and sometimes caliber. Each weapon family has its own barrels. The table gives the main ones.

### 9.4.1 AR-15 family barrels (Mako, Corsair uses its own; Skerry uses .300 versions)

| ID | Name | Length | Caliber | Gas | MOA | Weight | Ergo | Durability mult | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|
| BRL_AR_10_556 | CDS 10.3in Pencil | 10.3 in | 5.56 | Carbine | 3.0 | 0.52 | +3 | 1.0 | 9,000 | U |
| BRL_AR_145_556 ★ | CDS 14.5in Government | 14.5 in | 5.56 | Carbine | 2.6 | 0.76 | 0 | 1.0 | 8,500 | C |
| BRL_AR_16_556 | CDS 16in Mid-length | 16.0 in | 5.56 | Mid | 2.3 | 0.80 | -1 | 1.0 | 10,500 | U |
| BRL_AR_18_556 | Halvorsen 18in Match | 18.0 in | 5.56 | Rifle | 1.4 | 0.95 | -3 | 1.1 | 26,000 | R |
| BRL_AR_20_556 | Halvorsen 20in Heavy Match | 20.0 in | 5.56 | Rifle | 1.1 | 1.20 | -5 | 1.2 | 38,000 | E |
| BRL_AR_145_CL | CDS 14.5in Chrome-Lined | 14.5 in | 5.56 | Carbine | 2.8 | 0.78 | 0 | 1.5 (durability burn -30%) | 14,000 | U |
| BRL_AR_9_300 | CDS 9in .300 BLK | 9.0 in | .300 BLK | Pistol | 2.8 | 0.50 | +3 | 1.0 | 12,000 | U |
| BRL_AR_16_300 | CDS 16in .300 BLK | 16.0 in | .300 BLK | Carbine | 2.4 | 0.78 | -1 | 1.0 | 13,500 | U |
| BRL_AR_145_762x39 | Fen 14.5in 7.62x39 Conversion | 14.5 in | 7.62x39 | Carbine | 3.2 | 0.82 | -1 | 1.0 | 16,000 | R | Needs the 7.62x39 AR magazine (not STANAG) |

Sub-slots on all AR barrels: Muzzle, Gas Block.

### 9.4.2 Other barrel families (summary)

AK barrels (Bora, Bora-S, Bora-L, Squall have their own fixed barrel sets): short "Krink" 8.3 in (huge flash, +5 ergo, poor MOA), standard 16.3 in, RPK-length 23.2 in (Bora-L only, or as a conversion on Bora: +MOA, -8 ergo, adds a bipod sub-slot). Each in 7.62x39 or 5.45x39 versions.

Fulmar barrels: 4.5 in "Kurz" (compact, +6 ergo, much lower velocity), 8.9 in standard, 8.9 in with integral suppressor ("SD", -85% sound with subsonic, but heavy and hurts velocity by 15%).

Albatross barrels: 12.4 in "K" (short, very loud, flash +40%), 17.7 in standard, 19.7 in "SG1" precision (better MOA, heavy).

Frigate barrels: 13 in, 16 in, 20 in quick-change (swap in the field in 4 s).

Fathom barrels: 18 in scout (light, +4 ergo, MOA 0.9), 22 in standard (MOA 0.7), 26 in heavy fluted (MOA 0.5, -6 ergo, +velocity).

Skua barrels: 18, 20, 24 in.

Breaker barrels: 14 in breacher (no choke slot, takes the breaching muzzle), 18.5 in standard (fixed cylinder bore), 24 in field (choke slot, ventilated rib).

Selkie and Coach barrels: field length, coach length, sawn-off. Sawn-off: +12 ergo, spread doubles, pellets lose damage faster, the shot is 20% louder, and it looks amazing.

Pistol barrels: standard and threaded (threaded allows muzzle devices and suppressors), compensated (built-in comp ports, -10% VRec, +flash).

Rook barrels: 2.5 in snub (+10 ergo, worse range), 4 in, 6 in with top rail (allows optic).

## 9.5 HANDGUARDS AND RAILS

### 9.5.1 AR-15 handguards

| ID | Name | Length | Type | Sub-slots | Weight | Ergo | Blocks | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|
| HG_AR_DropIn | CDS Drop-In Carbine Handguard | 7 in | Drop-in polymer (FSB compatible) | Underbarrel (with rail adapter) | 0.25 | +2 | none | 1,800 | C |
| HG_AR_Quad7 | Fen 7in Quad Rail | 7 in | Free float, picatinny on 4 sides | Top, Bottom, Left, Right (each 8 slots) | 0.42 | 0 | FSB | 7,800 | U |
| HG_AR_MLOK11 ★ | Fen 11in M-LOK | 11 in | Free float M-LOK | Top Rail (full length picatinny), Bottom M-LOK (5 positions), Left M-LOK (5), Right M-LOK (5) | 0.31 | +3 | FSB | 9,500 | C |
| HG_AR_MLOK13 | Fen 13in M-LOK | 13 in | Free float M-LOK | Top, Bottom (6), Left (6), Right (6), Front Bottom QD socket (bipod) | 0.35 | +2 | FSB, Carbine gas with a standard gas block | 11,000 | U |
| HG_AR_MLOK15 | Fen 15in M-LOK Competition | 15 in | Free float M-LOK, slim | Top, Bottom (7), Left (7), Right (7), Front QD | 0.39 | +1 | FSB, any front sight on gas block | 14,500 | R |
| HG_AR_Brack10 | Brack Carbon 10in | 10 in | Carbon fiber, M-LOK at 3, 6, 9 | Bottom (4), Left (4), Right (4) | 0.20 | +5 | FSB | 22,000 | R |
| HG_AR_Tidewater | Tidewater Tubular Free-Float | 12 in | Round aluminum tube, no rail, single sling stud | Underbarrel (stud only: bipod) | 0.36 | +1 | FSB | 3,000 | C |

M-LOK positions are discrete; picatinny rails are slotted (part 08.4).

### 9.5.2 Rail sections (M-LOK to Picatinny)

| ID | Name | Length | Weight | Ergo | Price | Rarity |
|---|---|---|---|---|---|---|
| RAIL_MLOK3 ★ | Fen 3-slot M-LOK Rail | 3 slots | 0.02 | 0 | 900 | C |
| RAIL_MLOK5 | Fen 5-slot M-LOK Rail | 5 slots | 0.03 | 0 | 1,200 | C |
| RAIL_MLOK7 | Fen 7-slot M-LOK Rail | 7 slots | 0.04 | 0 | 1,500 | C |
| RAIL_MLOKAngled | Fen 45° M-LOK Offset Rail | 2 slots | 0.02 | 0 | 1,400 | U |
| RAIL_HandStop | Fen M-LOK Hand Stop | n/a | 0.02 | +2 | 1,600 | C |

### 9.5.3 Other handguards (summary)

AK: wood lower handguard (stock), polymer (lighter, +2 ergo), VMW rail handguard (picatinny bottom and sides), Fen M-LOK AK handguard (free float-ish, +4 ergo, top rail when paired with a gas tube rail), and a gas tube top cover with a picatinny rail (a low-mounted red dot position, the "AK gas tube optic" which is a beloved budget setup).

Fulmar: slim (stock), wide "tropical" (+1 ergo, better heat), rail handguard (bottom and sides).

Albatross: slim, wide, Fen M-LOK.

Breaker: wood corncob pump, synthetic pump, rail pump (bottom picatinny for a light), vertical grip pump (+6 ergo, -10% pump time).

## 9.6 FOREGRIPS, BIPODS AND HAND STOPS

| ID | Name | Fits | Weight | Ergo | VRec | HRec | Hip spread | ADS | Hand pose | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FG_Vertical ★ | Fen Vertical Grip | Picatinny, M-LOK | 0.10 | +3 | -3% | -8% | -5% | 0 | Vertical | 2,800 | C |
| FG_Stubby | Fen Stubby Grip | Picatinny, M-LOK | 0.06 | +4 | -2% | -5% | -3% | -0.01 | Stubby | 3,200 | C |
| FG_Angled ★ | Fen Angled Foregrip | Picatinny, M-LOK | 0.07 | +5 | -4% | -4% | 0 | -0.02 | Angled | 4,200 | U |
| FG_Handstop | (see Rail_HandStop) | M-LOK | 0.02 | +2 | -1% | -2% | 0 | -0.01 | C-clamp | 1,600 | C |
| FG_BipodGrip | Fen Grip-Pod | Picatinny | 0.28 | +1 | -3% | -6% | -3% | 0 | Vertical, deploys as a short bipod | 9,500 | R |
| FG_Barricade | Fen Barricade Stop | M-LOK | 0.04 | +2 | 0 | -2% | 0 | 0 | C-clamp; doubles the brace bonus against cover (Tier 2) | 3,500 | U |
| BP_Harris | Tidewater Sporting Bipod | Sling stud, picatinny (with adapter) | 0.38 | -3 | (deployed) -60% all recoil, sway ×0.15 | | | | n/a | 6,500 | U |
| BP_Atlas | Fen Precision Bipod | Picatinny, M-LOK QD | 0.32 | -2 | (deployed) as above, plus pan and cant | | | | n/a | 14,000 | R |
| BP_Integral | Grom / Bulwark integral | LMG | stock | 0 | as above | | | | n/a | stock | C |

Bipods deploy automatically when the player goes prone, or when ADS within 10 cm above a horizontal surface (window sills, car roofs, walls) and pressing the deploy key (X). Deployed: a mount point is fixed, the player can rotate ±35° yaw without moving, and recoil/sway get the deployed bonus. Moving undeploys.

## 9.7 STOCKS, BUFFER TUBES, CHEEK RISERS AND BUTT PADS

### 9.7.1 AR-15 stocks

| ID | Name | Fits | Weight | Ergo | VRec | HRec | Positions | Sub-slots | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|
| BUF_MilSpec ★ | Mil-Spec Buffer Tube | AR lower | 0.12 | 0 | 0 | 0 | 6 | Stock | 1,500 | C |
| BUF_Commercial | Commercial Buffer Tube | AR lower | 0.12 | 0 | 0 | 0 | 6 | Stock (commercial only) | 1,000 | C |
| BUF_Fixed | Rifle-Length Fixed Tube | AR lower | 0.20 | -1 | -3% | 0 | 1 | Stock (fixed) | 2,000 | U |
| STK_CDS6 ★ | CDS Six-Position Stock | MilSpec | 0.22 | +1 | -12% | -4% | 6 | Butt Pad | 2,400 | C |
| STK_BrackBS7 | Brack BS-7 Collapsible | MilSpec | 0.28 | +2 | -16% | -6% | 6 | Cheek Riser, Butt Pad | 6,800 | U |
| STK_BrackPRS | Brack PRS-Pattern Precision | Fixed tube | 0.72 | -3 | -24% | -8% | adjustable LOP and comb | Butt Pad, Monopod | 21,000 | R |
| STK_FenMinimal | Fen Minimalist | MilSpec | 0.13 | +4 | -8% | -2% | 6 | none | 7,500 | U |
| STK_A2Fixed | CDS A2 Fixed Stock | Fixed tube | 0.45 | -1 | -20% | -6% | 1 | Butt Pad | 3,500 | C |
| STK_PDWFolding | Brack PDW Folding Adapter | MilSpec | 0.30 | +3 (folded: +10 ergo, +60% recoil) | -10% | -4% | folding | Stock | 9,500 | R |

Stock position: collapsible stocks can be extended or collapsed (6 positions) in the gunsmith; collapsed gives +3 ergo, +6% VRec. In the raid, the stock can be folded (on folding stocks) with a hold of the fire-mode key; folded stocks are great for indoors and terrible for accuracy.

### 9.7.2 Cheek risers and butt pads

| ID | Name | Fits | Weight | Effect | Price | Rarity |
|---|---|---|---|---|---|---|
| CHK_Riser05 | Brack Cheek Riser 0.5in | Brack stocks | 0.04 | Fixes cheek weld for mid-height optics | 1,800 | C |
| CHK_Riser075 | Brack Cheek Riser 0.75in | Brack stocks | 0.05 | Fixes cheek weld for tall optics | 2,000 | C |
| CHK_Universal | Strap-On Cheek Riser | Any fixed stock | 0.06 | Fixes cheek weld for one tier, -1 ergo | 900 | C |
| BTP_Rubber ★ | Brack Rubber Butt Pad | Brack, CDS stocks | 0.06 | VRec -3% | 1,200 | C |
| BTP_Thick | Tidewater Thick Recoil Pad | Most stocks | 0.12 | VRec -6%, Ergo -1 | 1,600 | C |

### 9.7.3 Other stock families (summary)

AK: wood fixed (stock), polymer fixed, side-folding triangle (Bora-S stock), Fen AK buffer tube adapter (lets AK take AR stocks: a real-world adapter and a big gunsmith moment), skeletal underfolder. Fulmar: fixed A2, retractable A3, Brack collapsible adapter, none (stockless, +15 ergo, +70% recoil). Fathom and Skua: synthetic, laminated, chassis conversion (adds an AR-style buffer tube interface, so precision AR stocks fit), thumbhole walnut (Skua stock). Breaker: wood, synthetic, pistol-grip-only (no stock, +12 ergo, +80% recoil), folding top-folder. Old Mariner: original wood, "obrez" cut-down (pistol grip only), Fen modern chassis.

## 9.8 PISTOL GRIPS

| ID | Name | Fits | Weight | Ergo | VRec | Reload | Price | Rarity |
|---|---|---|---|---|---|---|---|---|
| PG_A2 ★ | CDS A2 Grip | Grip.AR | 0.07 | 0 | 0 | 0 | 600 | C |
| PG_FenErgo | Fen Ergonomic Grip | Grip.AR | 0.08 | +3 | -1% | 0 | 2,600 | C |
| PG_FenVertical | Fen Vertical Grip (Near-Vertical) | Grip.AR | 0.07 | +4 | 0 | -3% | 3,400 | U |
| PG_Brack | Brack Rubberized Grip | Grip.AR | 0.10 | +2 | -2% | 0 | 3,000 | U |
| PG_AKWood | VMW Bakelite Grip | Grip.AK | 0.07 | 0 | 0 | 0 | 500 | C |
| PG_AKFen | Fen AK Grip | Grip.AK | 0.08 | +4 | -1% | 0 | 3,200 | U |
| PG_HKNavy | Teller-Kaas Ambi Navy Grip | Grip.HK (trigger group) | 0.21 | +1 | 0 | 0 | 12,000 | R | Changes fire modes to Safe, Semi, Burst, Auto with an ambidextrous selector |
| PG_HKSEF | Teller-Kaas SEF Grip | Grip.HK | 0.20 | 0 | 0 | 0 | stock | C | Safe, Semi, Auto |

## 9.9 TRIGGERS, CHARGING HANDLES, GAS BLOCKS, REGULATORS

| ID | Name | Fits | Effect | Price | Rarity |
|---|---|---|---|---|---|
| TRG_AR_MilSpec ★ | CDS Mil-Spec Trigger | AR lower | Baseline | stock | C |
| TRG_AR_Match | Halvorsen Two-Stage Match Trigger | AR lower | Acc -10% (tighter), semi fire rate +10% | 14,000 | R |
| TRG_AR_Flat | Fen Flat-Face Trigger | AR lower | Acc -5%, ergo +1 | 8,000 | U |
| TRG_AR_Burst | CDS Burst Group | AR lower | Fire modes become Semi, Burst (3) | 9,000 | R |
| TRG_FathomAdj | Halvorsen Adjustable Trigger | Fathom, Skua | Acc -8% | 9,500 | U |
| TRG_PistolFlat | Fen Flat Pistol Trigger | Kestrel, Harbormaster | Acc -5%, semi fire rate +8% | 3,500 | U |
| CH_AR_MilSpec ★ | CDS Charging Handle | AR upper | Baseline | stock | C |
| CH_AR_Ambi | Brack Ambi Charging Handle | AR upper | Empty reload -0.2 s, enables one-hand rack | 6,500 | U |
| CH_AR_Gas | Brack Gas-Busting Charging Handle | AR upper | Removes the suppressed gas-in-face sway penalty (+10% sway with suppressor on DI rifles without this) | 7,500 | R |
| GB_LowPro ★ | Fen Low-Profile Gas Block | AR barrel gas slot | Baseline, fits under any handguard | 1,800 | C |
| GB_Adjustable | Fen Adjustable Gas Block | AR barrel gas slot | Setting: Normal/Suppressed. Suppressed setting removes the backpressure penalty | 7,800 | U |
| REG_Piston | Gas Regulator | Skerry, Corsair, Frigate | Setting: Normal/Suppressed/Adverse. Adverse: reliability up in salt and mud, recoil +8% | stock | C |
| BUF_H2 | H2 Heavy Buffer | AR buffer (internal) | VRec -4%, fire rate -6% | 2,500 | U |
| BUF_Light | Carbine Light Buffer | AR buffer (internal) | VRec +3%, fire rate +5% | 1,500 | C |

(Buffer weights are an internal sub-slot of the buffer tube, shown in the gunsmith as a small "Internals" slot.)

## 9.10 MAGAZINES

Magazines are items with capacity, caliber, size and reload modifiers. They hold ammo.

| ID | Name | Caliber | Capacity | Size | Weight (empty) | Ergo | Reload | Malfunction | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|---|
| MAG_STANAG30 ★ | CDS 30rd Aluminum | 5.56 / .300 | 30 | 1×2 | 0.12 | 0 | 0 | 0 | 1,800 | C |
| MAG_STANAG30P | Brack 30rd Polymer | 5.56 / .300 | 30 | 1×2 | 0.13 | 0 | -3% | -10% | 2,400 | C |
| MAG_STANAG20 | CDS 20rd | 5.56 / .300 | 20 | 1×1 | 0.09 | +2 | -5% | 0 | 1,600 | C |
| MAG_STANAG40 | Brack 40rd | 5.56 / .300 | 40 | 1×2 | 0.17 | -2 | +5% | 0 | 4,500 | U |
| MAG_STANAG60 | Brack 60rd Quad Stack | 5.56 | 60 | 1×3 | 0.39 | -6 | +15% | +30% | 18,000 | R |
| MAG_Drum100 | Tidewater 100rd Drum | 5.56 | 100 | 2×2 | 1.00 | -12 | +60% | +50% | 32,000 | E |
| MAG_AK30 ★ | VMW 30rd Steel (7.62) | 7.62x39 | 30 | 1×2 | 0.33 | 0 | 0 | 0 | 1,400 | C |
| MAG_AK30B | VMW 30rd Bakelite (7.62) | 7.62x39 | 30 | 1×2 | 0.24 | +1 | 0 | 0 | 2,200 | U |
| MAG_AK40 | VMW 40rd RPK-pattern | 7.62x39 | 40 | 1×2 | 0.40 | -2 | +5% | 0 | 3,500 | U |
| MAG_AK75 | VMW 75rd Drum | 7.62x39 | 75 | 2×2 | 0.90 | -10 | +50% | +20% | 18,000 | R |
| MAG_AK545_30 | VMW 30rd Polymer (5.45) | 5.45x39 | 30 | 1×2 | 0.22 | 0 | 0 | 0 | 1,600 | C |
| MAG_AK545_45 | VMW 45rd RPK74-pattern | 5.45x39 | 45 | 1×2 | 0.30 | -2 | +5% | 0 | 4,200 | U |
| MAG_Kestrel15 ★ | Northern Arsenal 15rd | 9x19 | 15 | 1×1 | 0.08 | 0 | 0 | 0 | 800 | C |
| MAG_Kestrel21 | Northern Arsenal 21rd Extended | 9x19 | 21 | 1×1 | 0.10 | -1 | 0 | 0 | 1,800 | U |
| MAG_Kestrel33 | Northern Arsenal 33rd Stick | 9x19 | 33 | 1×2 | 0.14 | -3 | +10% | +10% | 3,200 | U |
| MAG_Gannet32 ★ | CDS Gannet 32rd | 9x19 | 32 | 1×2 | 0.13 | 0 | 0 | 0 | 1,600 | C |
| MAG_Fulmar30 | Teller-Kaas 30rd Curved | 9x19 | 30 | 1×2 | 0.12 | 0 | 0 | 0 | 2,400 | C |
| MAG_Fulmar15 | Teller-Kaas 15rd | 9x19 | 15 | 1×1 | 0.08 | +2 | -5% | 0 | 1,800 | C |
| MAG_AR10_20 | CDS 20rd 7.62 | 7.62x51 | 20 | 1×2 | 0.20 | 0 | 0 | 0 | 3,500 | C |
| MAG_Fathom5 ★ | Halvorsen 5rd Box | 7.62x51 | 5 | 1×1 | 0.09 | +1 | 0 | 0 | 2,200 | C |
| MAG_Fathom10 | Halvorsen 10rd Box | 7.62x51 | 10 | 1×1 | 0.13 | 0 | +5% | 0 | 4,200 | U |
| MAG_Squall8 | VMW 8rd 12ga Box | 12 ga | 8 | 1×2 | 0.30 | 0 | 0 | 0 | 3,000 | C |
| MAG_Squall20 | VMW 20rd 12ga Drum | 12 ga | 20 | 2×2 | 1.10 | -10 | +50% | +15% | 22,000 | R |

Magazines with a witness window (Brack polymer, Teller-Kaas, Shearwater) show their round count in the "check magazine" action exactly.

## 9.11 TACTICAL DEVICES: LIGHTS AND LASERS

| ID | Name | Mount | Type | Output | Weight | Ergo | Hip spread | Price | Rarity |
|---|---|---|---|---|---|---|---|---|---|
| TAC_NordlysNL100 ★ | Nordlys NL-100 | Picatinny, M-LOK | Light | 300 lm, 25° beam | 0.09 | -1 | 0 | 3,800 | C |
| TAC_NordlysNL300 | Nordlys NL-300 | Picatinny, M-LOK | Light | 1,000 lm, 15° beam, strobe | 0.13 | -1 | 0 | 9,500 | U |
| TAC_NordlysNL500 | Nordlys NL-500 Scout | M-LOK direct | Light | 1,400 lm, 12° beam, strobe | 0.12 | 0 | 0 | 14,000 | R |
| TAC_PistolLight | Nordlys PL-1 | Pistol rail | Light | 600 lm, 20° | 0.07 | -1 | 0 | 5,500 | U |
| TAC_LaserRed | Nordlys LR-5 Red Laser | Picatinny | Laser (red) | 5 mW | 0.06 | 0 | -18% | 6,000 | U |
| TAC_LaserGreen | Nordlys LG-5 Green Laser | Picatinny | Laser (green) | 5 mW | 0.07 | 0 | -22% | 9,500 | R |
| TAC_Combo | Nordlys CL-2 Combo | Picatinny | Light 600 lm + green laser | | 0.18 | -2 | -20% | 18,000 | R |
| TAC_IRLaser | Nordlys IR-4 Aiming Laser | Picatinny | Laser (IR) + IR illuminator | 30 mW IR | 0.20 | -2 | -25% (only with NV) | 46,000 | E |
| TAC_PressurePad | Nordlys Tape Switch | Handguard (attaches to a light or laser) | Momentary switch | n/a | 0.01 | +1 | 0 | 1,200 | C | Changes the left-hand thumb pose; light flicks on while ADS only (option) |

## 9.12 SHOTGUN-SPECIFIC PARTS

| ID | Name | Fits | Effect | Price | Rarity |
|---|---|---|---|---|---|
| CHK_Cylinder | Cylinder Choke | Field barrels | Widest spread | 900 | C |
| CHK_Improved | Improved Cylinder Choke | Field barrels | Spread -20% | 1,200 | C |
| CHK_Modified | Modified Choke | Field barrels | Spread -40% | 1,600 | U |
| CHK_Full | Full Choke | Field barrels | Spread -55%, slugs Acc +10% (worse) | 2,000 | U |
| SHT_TubeExt2 | Marlowe +2 Tube Extension | Breaker | +2 capacity, -2 ergo | 3,500 | U |
| SHT_TubeExt4 | Marlowe +4 Tube Extension | Breaker (field barrel only) | +4 capacity, -4 ergo | 5,500 | R |
| SHT_SideSaddle | Fen Side Saddle (6) | Breaker, Selkie (butt cuff variant) | Shells loaded from here reload 25% faster | 2,800 | C |
| SHT_ButtCuff | Leather Shell Cuff | Wood stocks | Holds 5 shells, reload from cuff 15% faster | 1,800 | C |

## 9.13 CHARMS AND COSMETIC PARTS

Charms hang from a charm slot (a small socket near the rear of the receiver or on a sling point). They dangle with simple physics (a 2-bone rope with a pendulum, simulated on the client only, not replicated beyond the charm's ID). They're pure cosmetics, mostly earned from contracts, achievements and the seasonal events. Charms are account cosmetics and are never lost (part 10). The charm slot is a cosmetic slot, not an item slot.

Engravings: the Selkie, Coach, Tern, Harbormaster and Rook have an Engraving cosmetic slot (part 10 lists engravings).

## 9.14 DESIGNER PRESETS

Build these presets with the parts above. Each is a template stored as a data asset `USMWeaponPreset`. Prices are the total of trader prices at loyalty 1 to 3.

Mako, "Harbor Patrol" (budget, Tier 0): 14.5 in barrel, A2 birdcage, low-pro gas block, 11 in M-LOK handguard, 3-slot rail with vertical grip, Lumen R2 on a low mount, flip-up rear and front, CDS six-position stock, A2 grip, 30 rd aluminum mag. About 48,000.

Mako, "Quiet Professional": 14.5 in chrome-lined barrel, Quietus flash hider QD with Q5 suppressor, adjustable gas block set to suppressed, 13 in M-LOK, angled foregrip, NL-300 light with pressure pad, Lumen LH-1 holographic on the 1.93 riser with the 3x magnifier, Brack BS-7 with 0.5 in cheek riser, Fen ergonomic grip, gas-busting charging handle, flat-face trigger, 30 rd polymer mags. About 160,000.

Mako, "Marksman": 18 in match barrel, Kittredge K2 brake, mid-length low-pro gas block, 15 in M-LOK, Atlas bipod on the front QD, Harrow L1-8 on 34mm cantilever, Brack PRS stock on a fixed tube, near-vertical grip, match trigger, H2 buffer, 20 rd mags. About 215,000.

Mako, "Corridor": 10.3 in pencil barrel, K3 compensator, 7 in quad rail, stubby grip, combo light/laser, Lumen R2-T on low mount, PDW folding stock, Brack grip, 40 rd mags. About 85,000.

Gannet, "Pocket Rocket": stock barrel, Quietus Q9, short handguard, stubby grip, NL-100, Lumen MRD on low mount, Fen Minimalist stock, 33 rd stick. About 64,000.

Fulmar, "SD": SD integral barrel, wide handguard with NL-100, claw mount with Lumen R2, A3 retractable stock, Navy grip. About 92,000.

Bora, "Bog Standard" (stock): exactly the trader's stock weapon.

Bora, "Gas Tube Special": stock barrel, Kittredge AK brake, gas tube rail top cover with a Lumen R2 low-mounted, polymer lower handguard, Fen AK grip, AR buffer tube adapter with a Brack BS-7, bakelite mags. About 75,000.

Fathom, "Ghillie": 26 in heavy barrel, Quietus Q7, Halvorsen 3-12x50 in medium rings, chassis stock with PRS stock, adjustable trigger, Atlas bipod, 10 rd mag. About 175,000.

Fathom, "Scout": 18 in scout barrel, thread protector, Harrow ACR-4 (7.62 BDC) on a picatinny base, synthetic stock, extended bolt knob, 5 rd mag. About 82,000.

Breaker, "Door Knocker": breacher barrel with breaching muzzle, vertical grip pump, pistol grip only, side saddle, NL-100 on the receiver rail (the vertical grip pump and the rail pump share one slot, so the light can't go on the pump). About 34,000.

Run every preset through the validator. If a preset fails, fix the preset, not the validator.

## 9.15 THE CATALOG SIZE

Counting everything above plus the per-family variants summarized in prose, the catalog is about 260 parts at Tier 2. Tier 0 needs the ★ parts (about 40). Tier 1 needs the full Mako tree, the full Gannet, Bora, Fathom, Kestrel and Fulmar trees, and all universal parts (about 140).

To make 260 parts tractable, write a toolset (part 30, using the `create-toolset` skill) called `GunsmithAuthoringTools` with functions like `CreateAttachmentFromTemplate(Category, Id, DisplayName, MeshPath, Stats)`, `ValidateAllPresets()`, `GenerateIconsForAttachments()` (renders each part in a lightbox scene to a texture for its inventory icon), `ExportCatalogJson()`, and `FindOrphanParts()` (parts that fit nothing). Then the catalog is data entry, which you're good at.

---

End of part 09. Next: `10_COSMETICS_AND_CHARACTER_CUSTOMIZATION.md`.
