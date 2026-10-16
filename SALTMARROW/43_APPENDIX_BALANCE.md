# SALTMARROW: PART 43, APPENDIX: BALANCE TABLES AND FORMULAS

The numbers. This part consolidates every formula and the calibrated tables that make the systems in earlier parts agree with each other. Where a value here differs from an earlier part, this part wins (it was computed, the earlier ones were drafted), and the earlier part should be updated to match when you implement it. Every table here comes from the formulas below, so regenerate the tables with a script (`tools/balance/generate.py`) when a formula changes, and keep the script in the repo.

All of these values live in data (`economy.json`, curve assets, data assets). Tuning happens there, not in code.

---

## 43.1 BALLISTICS CALIBRATION

Part 05.3 introduced the drag model. Its drag constants were placeholders. The calibrated model:

Velocity over distance: with `dv/dt = -K v²`, velocity as a function of distance travelled is `v(x) = v0 · e^(-K·x)`, with K in units of 1/m. Calibrate K per ammo so the velocity retention matches these targets (which are close to real-world ballistics for the reference cartridges):

| Ammo | v0 (m/s) | Retention target | K (1/m) | v at 100 m | v at 300 m |
|---|---|---|---|---|---|
| 9x19 FMJ | 365 | 0.80 at 100 m | 2.23e-3 | 292 | 187 |
| 9x19 HP | 350 | 0.79 at 100 m | 2.40e-3 | 275 | 170 |
| .45 ACP FMJ | 260 | 0.85 at 100 m | 1.63e-3 | 221 | 159 |
| .357 JSP | 440 | 0.78 at 100 m | 2.50e-3 | 343 | 208 |
| 5.7x28 | 715 | 0.65 at 200 m | 2.15e-3 | 577 | 375 |
| 5.56 M855 | 940 | 0.72 at 300 m | 1.095e-3 | 843 | 677 |
| 5.45 PS | 880 | 0.70 at 300 m | 1.19e-3 | 781 | 616 |
| 7.62x39 PS | 715 | 0.65 at 300 m | 1.44e-3 | 619 | 464 |
| .300 BLK subsonic | 310 | 0.88 at 100 m | 1.28e-3 | 273 | 211 |
| 7.62x51 M80 | 840 | 0.75 at 300 m | 0.96e-3 | 763 | 630 |
| 7.62x54R LPS | 830 | 0.75 at 300 m | 0.96e-3 | 754 | 622 |
| .338 | 900 | 0.85 at 500 m | 0.325e-3 | 871 | 816 |
| .45-70 | 580 | 0.70 at 200 m | 1.78e-3 | 485 | 340 |
| 12ga 00 buckshot | 400 | 0.55 at 40 m | 14.9e-3 | 90 | 5 (destroyed) |
| 12ga slug | 430 | 0.70 at 100 m | 3.6e-3 | 300 | 146 |

Variants of the same caliber (AP, match, soft point) use the base K ±5% (heavier, longer AP bullets retain slightly more).

Gravity is 9.81 m/s². Drop then emerges from the simulation; don't hand-tune drop.

### 43.1.1 Damage falloff curves (velocity fraction → damage multiplier)

Four curve families, assigned per ammo:

| Family | Used by | Curve points (fraction: multiplier) |
|---|---|---|
| Pistol | 9x19, .45, .357, .300 BLK subsonic | 0.90: 1.00, 0.80: 0.85, 0.65: 0.65, 0.50: 0.45, 0.30: 0.25 |
| Rifle | 5.56, 5.45, 7.62x39, 5.7x28, .45-70, .300 BLK supersonic | 0.80: 1.00, 0.70: 0.90, 0.55: 0.75, 0.40: 0.55, 0.25: 0.35 |
| Full power | 7.62x51, 7.62x54R, .338 | 0.70: 1.00, 0.60: 0.90, 0.45: 0.75, 0.30: 0.55, 0.20: 0.35 |
| Shotgun | buckshot, flechette, slug, Dragon's Breath | 0.85: 1.00, 0.70: 0.75, 0.55: 0.50, 0.40: 0.30, 0.25: 0.15 |

Projectiles below 15% of muzzle velocity are destroyed. Penetration scales linearly with the velocity fraction.

### 43.1.2 Resulting damage by distance (thorax, unarmored, before zone multipliers)

| Ammo | 10 m | 50 m | 100 m | 200 m | 300 m | 500 m | Thorax hits to kill (85 HP) at 10 / 100 / 300 m |
|---|---|---|---|---|---|---|---|
| 9x19 FMJ | 54 | 54 | 46 | 34 | 25 | 15 | 2 / 2 / 4 |
| 9x19 HP | 70 | 69 | 58 | 43 | 31 | 18 | 2 / 2 / 3 |
| .45 ACP FMJ | 72 | 72 | 67 | 54 | 43 | 28 | 2 / 2 / 2 |
| .357 JSP | 92 | 90 | 76 | 54 | 39 | 23 | 1 / 2 / 3 |
| 5.7x28 | 42 | 42 | 42 | 36 | 30 | 20 | 3 / 3 / 3 |
| 5.56 M855 | 50 | 50 | 50 | 50 | 46 | 39 | 2 / 2 / 2 |
| 5.45 PS | 50 | 50 | 50 | 49 | 45 | 38 | 2 / 2 / 2 |
| 7.62x39 PS | 60 | 60 | 60 | 57 | 51 | 40 | 2 / 2 / 2 |
| .300 BLK subsonic | 66 | 66 | 64 | 54 | 46 | 32 | 2 / 2 / 2 |
| 7.62x51 M80 | 78 | 78 | 78 | 78 | 78 | 72 | 2 / 2 / 2 |
| 7.62x54R LPS | 82 | 82 | 82 | 82 | 82 | 75 | 2 / 2 / 2 |
| .338 | 120 | 120 | 120 | 120 | 120 | 120 | 1 / 1 / 1 |
| .45-70 | 130 | 130 | 130 | 117 | 102 | 73 | 1 / 1 / 1 |
| 12ga buckshot (per pellet) | 24 | 10 | 4 | n/a | n/a | n/a | 1 (at 60% pellets on target) / 5 / n/a |
| 12ga slug | 140 | 137 | 104 | 58 | 34 | 21 | 1 / 1 / 3 |

Reading it: inside 100 m, nearly everything kills an unarmored target with two thorax hits, which is exactly the "fast to kill if you hit" pillar. The differences are in recoil (how fast you land the second hit), range (pistols fall off), and armor (43.2).

## 43.2 ARMOR PENETRATION MATRIX

Penetration chance with fresh armor (durability 100%), at 10 m, from `P = 1 / (1 + e^(-(Pen - Threshold) / 2))`, thresholds C1 5, C2 9, C3 14, C4 19, C5 25, C6 31 (part 05.8.2). The last column is Class 4 at 200 m.

| Ammo | Pen | C1 | C2 | C3 | C4 | C5 | C6 | C4 @200 m |
|---|---|---|---|---|---|---|---|---|
| 9x19 FMJ | 4 | 37% | 7% | 1% | 0% | 0% | 0% | 0% |
| 9x19 AP-S | 9 | 87% | 48% | 7% | 1% | 0% | 0% | 0% |
| .45 FMJ | 3 | 26% | 5% | 0% | 0% | 0% | 0% | 0% |
| .357 Hardcast | 11 | 95% | 70% | 16% | 2% | 0% | 0% | 0% |
| 5.7x28 SS | 13 | 98% | 87% | 35% | 4% | 0% | 0% | 1% |
| 5.56 M855 | 14 | 99% | 92% | 48% | 7% | 0% | 0% | 2% |
| 5.56 Soft point | 6 | 61% | 18% | 2% | 0% | 0% | 0% | 0% |
| 5.56 AP | 24 | 100% | 100% | 99% | 92% | 35% | 3% | 58% |
| 5.45 PS | 13 | 98% | 87% | 36% | 4% | 0% | 0% | 1% |
| 5.45 BT | 20 | 100% | 100% | 95% | 60% | 7% | 0% | 17% |
| 7.62x39 PS | 13 | 98% | 87% | 36% | 4% | 0% | 0% | 1% |
| 7.62x39 BP | 21 | 100% | 100% | 97% | 70% | 10% | 1% | 17% |
| .300 BLK supersonic | 12 | 97% | 81% | 25% | 3% | 0% | 0% | 1% |
| 7.62x51 M80 | 18 | 100% | 99% | 87% | 36% | 3% | 0% | 11% |
| 7.62x51 AP | 30 | 100% | 100% | 100% | 100% | 91% | 35% | 95% |
| 7.62x54R LPS | 19 | 100% | 99% | 92% | 48% | 4% | 0% | 16% |
| .338 | 32 | 100% | 100% | 100% | 100% | 97% | 61% | 100% |
| 12ga slug | 6 | 60% | 17% | 2% | 0% | 0% | 0% | 0% |
| 12ga flechette | 5 | 45% | 10% | 1% | 0% | 0% | 0% | 0% |

Damaged armor is weaker (effective class scales with the square root of the durability fraction, part 05.8.2), so a Class 4 plate at 50% durability behaves like about Class 2.8, and M855 goes through it about 70% of the time. That's the intended arc of a firefight: the first few hits on armor are stopped, then it gives.

Design reading: Class 3 is the sweet spot for most players (stops pistols and soft rounds, half of standard rifle rounds), Class 4 stops standard intermediate rounds reliably until it wears down, Class 5 and 6 need AP or full-power AP. AP ammo is therefore the most valuable consumable in the game; keep its trader stock tight (43.6).

## 43.3 THE TIME-TO-KILL SIMULATION

The unit test (part 37) runs this simulation; it must produce these medians within ±15%:

Setup: shooter at 30 m, target stationary, hits distributed as 45% thorax, 20% stomach, 15% arms, 15% legs, 5% head (a "decent player" distribution), shooter accuracy 70% of shots hit (hip and ADS mixed), recoil included via the weapon's fire interval.

| Weapon (ammo) | Target unarmored | Target Class 3 vest + Class 3 helmet | Target Class 4 plate + Class 4 helmet |
|---|---|---|---|
| Kestrel 9 (FMJ) | 0.55 s | 1.6 s | 3.0 s |
| Gannet (FMJ) | 0.30 s | 0.95 s | 1.8 s |
| Gannet (AP-S) | 0.33 s | 0.60 s | 1.2 s |
| Mako (M855) | 0.32 s | 0.55 s | 1.1 s |
| Mako (AP) | 0.34 s | 0.38 s | 0.48 s |
| Bora (PS) | 0.40 s | 0.65 s | 1.3 s |
| Albatross (M80) | 0.42 s | 0.50 s | 0.85 s |
| Fathom (M80), one shot then cycle | 1 to 2 shots | 2 shots | 2 to 3 shots |
| Breaker (buck, 8 m) | 1 shot | 1 to 2 shots | 2 to 3 shots |

If the simulation drifts outside the band after a balance change, either the change was wrong or the target band needs a conscious update in this table (with a note in DECISIONS).

## 43.4 RECOIL AND ERGONOMICS REFERENCE CONSTANTS

Per weapon class, the reference values the stat calculator normalizes against (part 08.5.4). Tune so stock weapons reproduce parts 06 and 07.

| Class | M_ref (kg) | I_ref (kg·m²) | x_ideal (cm forward of grip) | BaseADSTime_class (s) | BaseSway_class |
|---|---|---|---|---|---|
| Pistol | 0.85 | 0.004 | 6 | 0.16 | 0.6 |
| SMG / PDW | 2.7 | 0.06 | 10 | 0.24 | 0.8 |
| Carbine / AR | 3.3 | 0.16 | 12 | 0.29 | 1.0 |
| Bullpup | 3.8 | 0.08 | 4 | 0.31 | 0.9 |
| Battle rifle | 4.3 | 0.30 | 14 | 0.36 | 1.2 |
| DMR / bolt | 4.1 | 0.34 | 15 | 0.35 | 1.1 |
| Shotgun | 3.4 | 0.24 | 14 | 0.28 | 1.0 |
| LMG | 8.0 | 0.80 | 18 | 0.50 | 1.6 |

BalanceFactor: 1.2 ergonomics points per cm beyond x_ideal.

## 43.5 MOVEMENT AND STAMINA REFERENCE

From part 04 (repeated for the balance script): jog 3.6 m/s, sprint 5.6 m/s, sprint drain 9/s, regen 14/s after 1.2 s, exhausted until 30. A full stamina bar sprints for 11.1 s (62 m). Sprinting from the cannery to the ferry ramp (about 230 m) takes 3 sprint bursts with 2 jog recoveries: about 52 s. That's the "can I make the boat" math players will learn.

Encumbrance: speed multiplier = 1.0 below 22 kg; linear to 0.85 at 40 kg; linear to 0.60 at 60 kg; 0.28 (walk only, 1.0 m/s) above 60. Typical loadouts: light (Gannet, Class 2, daypack): 12 to 16 kg. Medium (Mako, Class 4 plate, assault pack, 6 mags): 22 to 28 kg. Heavy (Albatross, Class 5, raid pack): 32 to 40 kg before loot. A full Salt Hauler's pack adds 15 to 25 kg.

## 43.6 ECONOMY TABLES

### 43.6.1 Ammo prices and stock (per round, from traders)

| Ammo | Price per round | Trader | Loyalty | Stock per restock |
|---|---|---|---|---|
| 9x19 FMJ | 45 | Captain | 1 | 600 |
| 9x19 HP | 70 | Tomasz | 1 | 300 |
| 9x19 AP-S | 160 | Tomasz | 2 | 120 |
| 9x19 Subsonic | 85 | Tomasz | 2 | 200 |
| .45 ACP FMJ | 70 | Captain | 1 | 300 |
| .45 ACP HP | 95 | Tomasz | 2 | 150 |
| .357 JSP | 120 | Tomasz | 1 | 120 |
| .357 Hardcast | 210 | Tomasz | 2 | 60 |
| 5.7x28 SS | 260 | Tomasz | 3 | 150 |
| 5.56 M855 | 140 | Tomasz | 1 | 450 |
| 5.56 Soft point | 110 | Captain | 1 | 300 |
| 5.56 AP | 950 | Nils | 4 | 60 |
| 5.45 PS | 120 | Nils | 1 | 450 |
| 5.45 BT | 520 | Nils | 3 | 90 |
| 7.62x39 PS | 130 | Nils | 1 | 450 |
| 7.62x39 HP | 110 | Nils | 1 | 300 |
| 7.62x39 BP | 610 | Nils | 3 | 90 |
| .300 BLK subsonic | 260 | Tomasz | 2 | 150 |
| .300 BLK supersonic | 210 | Tomasz | 2 | 150 |
| 7.62x51 M80 | 300 | Tomasz | 2 | 200 |
| 7.62x51 Match | 520 | Tomasz | 3 | 80 |
| 7.62x51 AP | 1,600 | Nils | 4 | 40 |
| 7.62x54R LPS | 280 | Nils | 2 | 200 |
| .338 FMJ | 3,800 | none (raid only) | n/a | n/a |
| 12ga 00 buck | 120 | Captain | 1 | 200 |
| 12ga slug | 180 | Captain | 1 | 120 |
| 12ga flechette | 420 | Tomasz | 3 | 60 |
| 12ga Dragon's Breath | 650 | Nils | 3 | 30 |
| .45-70 | 380 | Captain | 2 | 80 |
| 40mm HE | 9,500 | Nils | 4 | 6 |
| Signal flare | 900 | Captain | 1 | 20 |
| Harpoon bolt | 1,800 | Captain | 3 | 10 |

### 43.6.2 Repair costs

Weapon repair (Tomasz): `cost = BaseValue × (target - current) / 100 × 0.35`, and max durability drops by `(target - current) × 0.06` (so repairing from 40 to 100 costs 21% of the weapon's value and lowers max durability to 96.4). The Gunsmith's Bench L2 does it at 40% of that price with half the max durability loss.

Armor repair (the Captain for Class 1 to 3, Tomasz for 4 to 6): `cost = BaseValue × (missing durability fraction) × MaterialCostFactor`, MaterialCostFactor: Aramid 0.6, UHMWPE 0.7, Steel 0.3, Ceramic 0.9, Titanium 0.8, Composite 1.0. Max durability loss per repair: Aramid 6%, UHMWPE 5%, Steel 2%, Ceramic 10%, Titanium 4%, Composite 6% of repaired amount.

### 43.6.3 Expected raid value

Target expected total loot value on the map for a Standard raid, from the loot tables: 4.1 M Scrip mean (part 32.16 export), of which Harbourside holds 35%, the High Street 25%, the East End 12%, the Moor 15%, the islets 13%. Night: +28%. A median extracting player takes 2% to 6% of the map's value (80k to 250k), a strong player 10%+.

Target loadout values: a Scavenger kit 8k to 20k, a cheap kit 40k to 70k, a mid kit 120k to 220k, a heavy kit 350k to 700k.

### 43.6.4 Station costs (all stations, Scrip and key items)

| Station | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| Gunsmith's Bench | free | 120k, 4 Weapon Parts, 2 Gun Oil, 30 min | 450k, 6 Weapon Parts, 2 Optics Glass, 4 Bolts, Tomasz L2, 3 h | | |
| Stores | free | 150k, 5 Bolts, 3 Nails, 2 Duct Tape, 30 min | 400k, 4 Steel Plate, 6 Bolts, 2 Hose Clamps, lvl 15, 2 h | 900k, 8 Steel Plate, 4 Electric Motor, Locksmith L2, 4 h | 1.8M, 12 Steel Plate, 6 Salt-Etched Metal, 2 Solar Cell, lvl 35, 8 h |
| Locksmith | 80k, 2 Bolts, 1 Duct Tape, 15 min | 300k, 4 Steel Plate, 2 Pressure Gauge, Nils L2, 2 h | 1.1M, 6 Steel Plate, 4 Salt-Etched Metal, lvl 25, 6 h | | |
| Sick Bay | 60k, 4 Antiseptic, 2 Medical Tubing, 20 min | 260k, 6 Antiseptic, 4 Medical Tubing, 2 Water Filter, Agnes L2, 2 h | 900k, 4 Marrow Salt Shards, 6 Antiseptic, 2 Circuit Board, lvl 25, 5 h | | |
| Galley | 40k, 2 Fuel Can, 1 Copper Wire, 15 min | 180k, 2 Electric Motor, 4 Copper Wire, Captain L2, 1.5 h | | | |
| Workshop | 90k, 4 Bolts, 2 Nails, 2 Duct Tape, 20 min | 350k, 2 Electric Motor, 4 Circuit Board, 4 Copper Wire, lvl 12, 2.5 h | 1.0M, 6 Circuit Board, 4 Steel Plate, 2 Radio Valve, Tomasz L3, 6 h | | |
| Boathouse (Tier 2) | 250k, 4 Rope Coil, 2 Tarpaulin, 2 Fuel Can, lvl 15, 1 h | 500k, 2 Spark Plugs, 2 Diesel Filter, 4 Rope Coil, Nils L2, 3 h | 1.4M, 4 Electric Motor, 6 Steel Plate, 4 Fuel Can, lvl 30, 6 h | 2.6M, 10 Steel Plate, 4 Salt-Etched Metal, 2 Antenna, lvl 40, 8 h | |
| Radio Room | 120k, 2 Radio Valve, 2 Copper Wire, 1 Antenna, 30 min | 400k, 4 Circuit Board, 2 Antenna, 2 Radio Valve, lvl 18, 3 h | | | |
| Lookout | 90k, 2 Optics Glass, 1 Antenna, 30 min | 350k, 4 Optics Glass, 1 Military Encrypted Tablet, lvl 20, 3 h | | | |
| Cabin | free | 60k, 2 Tarpaulin, 2 Wool, 30 min | 200k, 2 Fishing Trophy, 1 Ship in a Bottle, 1 h | | |
| Chapel | 25k, 4 Light Bulbs (candles), 10 min | | | | |

## 43.7 ACCOUNT LEVEL XP TABLE

`XPToNext(L) = round((800 + 60 × L^1.5) / 50) × 50`. A typical good raid earns 1,500 to 3,000 XP, a death about half that, so level 10 arrives in about 6 to 8 raids and level 60 in about 300.

| Level | XP to next | Cumulative |
|---|---|---|
| 1 → 2 | 850 | 850 |
| 2 → 3 | 950 | 1,800 |
| 3 → 4 | 1,100 | 2,900 |
| 4 → 5 | 1,300 | 4,200 |
| 5 → 6 | 1,450 | 5,650 |
| 6 → 7 | 1,700 | 7,350 |
| 7 → 8 | 1,900 | 9,250 |
| 8 → 9 | 2,150 | 11,400 |
| 9 → 10 | 2,400 | 13,800 |
| 10 → 11 | 2,700 | 16,500 |
| 11 → 12 | 3,000 | 19,500 |
| 12 → 13 | 3,300 | 22,800 |
| 13 → 14 | 3,600 | 26,400 |
| 14 → 15 | 3,950 | 30,350 |
| 15 → 16 | 4,300 | 34,650 |
| 16 → 17 | 4,650 | 39,300 |
| 17 → 18 | 5,000 | 44,300 |
| 18 → 19 | 5,400 | 49,700 |
| 19 → 20 | 5,750 | 55,450 |
| 20 → 21 | 6,150 | 61,600 |
| 21 → 22 | 6,550 | 68,150 |
| 22 → 23 | 7,000 | 75,150 |
| 23 → 24 | 7,400 | 82,550 |
| 24 → 25 | 7,850 | 90,400 |
| 25 → 26 | 8,300 | 98,700 |
| 26 → 27 | 8,750 | 107,450 |
| 27 → 28 | 9,200 | 116,650 |
| 28 → 29 | 9,700 | 126,350 |
| 29 → 30 | 10,150 | 136,500 |
| 30 → 31 | 10,650 | 147,150 |
| 31 → 32 | 11,150 | 158,300 |
| 32 → 33 | 11,650 | 169,950 |
| 33 → 34 | 12,150 | 182,100 |
| 34 → 35 | 12,700 | 194,800 |
| 35 → 36 | 13,200 | 208,000 |
| 36 → 37 | 13,750 | 221,750 |
| 37 → 38 | 14,300 | 236,050 |
| 38 → 39 | 14,850 | 250,900 |
| 39 → 40 | 15,400 | 266,300 |
| 40 → 41 | 16,000 | 282,300 |
| 41 → 42 | 16,550 | 298,850 |
| 42 → 43 | 17,150 | 316,000 |
| 43 → 44 | 17,700 | 333,700 |
| 44 → 45 | 18,300 | 352,000 |
| 45 → 46 | 18,900 | 370,900 |
| 46 → 47 | 19,500 | 390,400 |
| 47 → 48 | 20,150 | 410,550 |
| 48 → 49 | 20,750 | 431,300 |
| 49 → 50 | 21,400 | 452,700 |
| 50 → 51 | 22,000 | 474,700 |
| 51 → 52 | 22,650 | 497,350 |
| 52 → 53 | 23,300 | 520,650 |
| 53 → 54 | 23,950 | 544,600 |
| 54 → 55 | 24,600 | 569,200 |
| 55 → 56 | 25,250 | 594,450 |
| 56 → 57 | 25,950 | 620,400 |
| 57 → 58 | 26,600 | 647,000 |
| 58 → 59 | 27,300 | 674,300 |
| 59 → 60 | 28,000 | 702,300 |

## 43.8 AI POPULATION AND DIFFICULTY TABLES

Hollow population cap by player count (Standard): `24 + 3 × players`, capped at 60 (Night: `30 + 3.5 × players`, capped at 72).

| Players | Static at start | Wave 1 | Wave 2 | Wave 3 | Cap |
|---|---|---|---|---|---|
| 1 to 3 (squad) | 18 | 10 | 14 | 18 | 33 |
| 4 to 6 | 26 | 14 | 18 | 24 | 42 |
| 7 to 9 | 34 | 16 | 20 | 26 | 51 |
| 10 to 12 | 42 | 18 | 24 | 30 | 60 |

Wave composition (fractions): wave 1 Shambler 0.75, Crawler 0.25; wave 2 Shambler 0.55, Crawler 0.15, Wailer 0.1, Bloat 0.1, Drowner 0.1; wave 3 Shambler 0.45, Crawler 0.1, Wailer 0.1, Bloat 0.1, Drowner 0.15, Brute 0.1.

Wardens per raid (fixed by map): power station 6 to 9 (1 officer), LISTENER 8 to 12 (2 officers), police station 3 to 4 (after Surge 2 only, retreating there), two roaming patrols of 3 to 4 (one officer between them, 50% chance). Total 20 to 29 spawned over a raid, alive cap 18.

AI aim model: base aim error 3.0° (Rifleman), 1.6° (Marksman), 4.0° (Gunner, but suppressive), settle time 2.0 s to 0.25° error at 100 m for Riflemen. Error multipliers: AI moving 1.8, target moving fast 1.5, AI suppressed 2.0, AI wounded 1.4, Night without NVG 1.6, rain 1.2, fog: proportional to visibility. Reaction time 0.45 to 0.9 s (+0.3 s at night without NVG).

## 43.9 CONTRACT REWARD BANDS

| Contract type | XP | Scrip | Reputation | Items |
|---|---|---|---|---|
| Early main line (1 to 4) | 1,000 to 2,500 | 15k to 40k | +0.02 to +0.04 | Starter gear, a key part |
| Mid main line (5 to 12) | 3,000 to 8,000 | 50k to 150k | +0.04 to +0.08 | Rare parts, stock unlocks |
| Late main line (13+) | 10,000 to 25,000 | 200k to 600k | +0.08 to +0.15 | Epic items, cosmetics, station materials |
| Side | 1,500 to 6,000 | 25k to 120k | +0.02 to +0.05 | Barter items |
| Daily | 800 to 1,500 | 15k to 35k | +0.01 | Barter |
| Weekly | 4,000 to 8,000 | 80k to 160k | +0.03 | A rare item |

## 43.10 THE BALANCE SCRIPT

`tools/balance/generate.py` reads the formulas' constants from `design/data/balance.yaml`, writes these tables to `design/bible/43_APPENDIX_BALANCE.md` (between generated markers), writes the curve assets' JSON (falloff curves, the XP table) for import, and runs sanity checks (every weapon's stock config reproduces its base stats, the TTK simulation lands in band, the economy's expected raid value is consistent with the loot tables). Run it after any balance change and commit both the YAML and the outputs.

---

End of part 43. Next: `44_NARRATIVE_NOTES.md`.
