# SALTMARROW: PART 05, COMBAT, BALLISTICS, DAMAGE, ARMOR AND HEALTH

This is the most important technical part of the bible after networking. Pillar 1 lives or dies here. Read it twice. Build the ballistics and damage pipeline as a standalone C++ module (`SaltmarrowCombat`) with its own unit tests for the math, so you can verify a 7.62 round at 300 m drops the right amount before you ever see it in a level.

---

## 5.1 THE SHOT PIPELINE, END TO END

Here's what happens when a player pulls the trigger, in order. Every step is specified in the sections below.

1. Input: fire pressed. The weapon's fire mode logic (semi, burst, auto, bolt, pump) decides whether a shot happens this frame, based on the fire rate timer, chamber state and malfunction state.
2. Client prediction: the owning client immediately plays the muzzle flash, sound, recoil, shell ejection and camera kick, and spawns a local cosmetic projectile. It does not apply damage.
3. Shot request: the client sends a `ServerFire` RPC with: the shot's origin (muzzle socket world position), direction (after spread and sway), the client's timestamp (the server-synchronized world time), a shot sequence number, and the random seed used for spread. This is unreliable for automatic fire beyond the first shot of a burst, reliable for semi-auto (an important balance between bandwidth and correctness; see 5.12).
4. Server validation: the server checks the shot is legal (weapon equipped, ammo in chamber, fire rate not exceeded with a 10% tolerance, origin within 0.5 m of where the server thinks the muzzle is at that timestamp, direction within the weapon's maximum spread cone plus a tolerance).
5. Server simulation: the server simulates the projectile through the world using the ballistic model (5.3), with lag compensation for player hitboxes (5.11).
6. Hit resolution: when the projectile hits something, the server computes penetration (5.6), armor (5.8), damage (5.7) and status effects (5.9), and applies them.
7. Hit replication: the server multicasts impact effects to relevant clients (unreliable, batched), and sends a reliable `ClientConfirmHit` to the shooter with the zone hit, damage dealt and whether armor absorbed it (for the hit marker, part 24).
8. Simulated proxies: other clients see the shot through a replicated "weapon fired" event (a counter plus origin and direction, compressed), and spawn their own cosmetic tracer and sound.

The client never decides damage. The server never trusts the client's hit claims. The client does predict where its shots will land so tracers and impact VFX feel instant, and the server's result arrives within one round trip to confirm or correct (a missed shot that the client thought was a hit just doesn't get a hit marker; we never draw a fake hit marker).

## 5.2 WHY PROJECTILES AND NOT HITSCAN

Every weapon fires simulated projectiles. Our engagement ranges go up to 400 m across water, and at those ranges drop and travel time are part of the skill. Hitscan would make long-range fights trivially easy and kill the bolt-action fantasy. The cost is server CPU and network complexity, which we can afford at 12 players.

Performance target: the server must simulate 600 active projectiles at once with less than 1.5 ms per frame of game thread time at 60 Hz, on the host's machine. That covers four LMGs dumping belts at once. Use a custom projectile manager (`USMProjectileSubsystem`, a world subsystem) that simulates projectiles as plain structs in an array, not as spawned actors. Actors are far too expensive. Each projectile step is a line trace from its previous position to its next position. Use async traces where possible (`AsyncLineTraceByChannel`) and batch them.

## 5.3 THE BALLISTIC MODEL

We use a simplified but physically plausible point-mass model with gravity and quadratic drag, using G1-style ballistic coefficients that are tuned, not real-world exact. It's tuned to feel right, then held fixed.

### 5.3.1 State

Each projectile has: position (cm, double precision via LWC), velocity (cm/s), ammo definition reference (drag coefficient, mass, damage profile, penetration), the shooter's ID, the weapon's ID, the time it was fired, the distance travelled, the remaining penetration power, and a flag set (tracer, subsonic, fragmented, ricocheted).

### 5.3.2 Integration

Fixed step: projectiles are stepped at 120 Hz regardless of frame rate (accumulate time, step in 1/120 s increments, maximum 8 steps per frame to avoid spiral of death). Integration: semi-implicit Euler is fine at 120 Hz for our purposes.

```
// Per step (dt = 1/120 s):
FVector v = P.Velocity;                      // cm/s
double speed = v.Size();
double dragAccel = 0.5 * AirDensity * speed * speed * Ammo.DragCoefficient * Ammo.Area / Ammo.Mass; // m/s^2 equivalent, scaled to cm
FVector a = FVector(0, 0, -Gravity) - v.GetSafeNormal() * dragAccel;
a += Wind * Ammo.WindSensitivity;            // small, from the weather system
P.Velocity = v + a * dt;
FVector next = P.Position + P.Velocity * dt;
// trace P.Position -> next, resolve hits, then:
P.Position = next;
```

Use a simpler parameterization so designers can tune without touching physics: each ammo type has a `BallisticDragK` value such that velocity decays as `dv/dt = -K * v^2`. Gravity is 9.81 m/s² (not the game's character gravity scale). Air density is constant (we're at sea level).

Wind: the weather system (part 15) exposes a wind vector. Bullets get pushed by `Wind * WindSensitivity`, where `WindSensitivity` is tiny for fast rifle rounds and meaningful for slow pistol and shotgun rounds at range. During the Surge, wind is strong enough (up to 25 m/s) that long-range shots need correction. That's a skill expression we want, but keep it subtle: at 300 m in a full Surge wind, a 7.62 round drifts about 40 cm. Outside the Surge, drift is negligible.

### 5.3.3 The ammo ballistic table

Calibers and ammo types are fictional-ish but based on real cartridges so they behave believably. Muzzle velocity listed is for the reference barrel length; part 08 explains how barrel length modifies it (±1.5% per inch from reference for rifles).

| Caliber | Ammo type | Muzzle velocity (m/s) | Drag K (×10⁻⁴) | Base damage | Penetration (mm RHA equivalent) | Armor damage % | Notes |
|---|---|---|---|---|---|---|---|
| 9x19 | FMJ | 365 | 9.0 | 54 | 4 | 35 | Pistols and SMGs |
| 9x19 | HP | 350 | 9.5 | 70 | 1 | 15 | High flesh damage, poor vs armor |
| 9x19 | AP-S (steel core) | 390 | 8.6 | 48 | 9 | 55 | |
| 9x19 | Subsonic | 300 | 9.8 | 52 | 3 | 30 | Quieter with suppressor |
| .45 ACP | FMJ | 260 | 10.0 | 72 | 3 | 30 | Subsonic natively |
| .45 ACP | HP | 255 | 10.5 | 90 | 1 | 15 | |
| .357 Magnum | JSP | 440 | 8.0 | 92 | 6 | 40 | Revolver |
| .357 Magnum | Hardcast | 430 | 7.8 | 82 | 11 | 60 | |
| 5.7x28 | SS-type | 715 | 5.0 | 42 | 13 | 50 | PDW |
| 5.56x45 | M855-type | 940 | 3.6 | 50 | 14 | 55 | |
| 5.56x45 | Soft point | 920 | 4.0 | 64 | 6 | 30 | |
| 5.56x45 | AP (tungsten) | 960 | 3.3 | 46 | 24 | 80 | Rare |
| 5.45x39 | PS-type | 880 | 3.9 | 50 | 13 | 50 | |
| 5.45x39 | BT (AP) | 880 | 3.8 | 46 | 20 | 70 | |
| 7.62x39 | PS-type | 715 | 5.2 | 60 | 13 | 52 | |
| 7.62x39 | HP | 700 | 5.6 | 76 | 5 | 28 | |
| 7.62x39 | BP (AP) | 730 | 5.0 | 56 | 21 | 75 | |
| .300 BLK | Subsonic | 310 | 7.5 | 66 | 8 | 40 | Suppressed carbine round |
| .300 BLK | Supersonic | 670 | 5.6 | 58 | 12 | 48 | |
| 7.62x51 | M80-type | 840 | 2.8 | 78 | 18 | 62 | Battle rifles, DMRs |
| 7.62x51 | Match | 800 | 2.4 | 82 | 15 | 55 | Better accuracy |
| 7.62x51 | AP | 860 | 2.6 | 72 | 30 | 90 | Rare |
| 7.62x54R | LPS-type | 830 | 2.8 | 82 | 19 | 65 | |
| .338 Lapua-type | FMJ | 900 | 1.8 | 120 | 32 | 95 | Heavy sniper, very rare |
| 12 gauge | Buckshot 00 (9 pellets) | 400 | 14.0 | 24 per pellet | 2 | 20 | |
| 12 gauge | Flechette (20) | 450 | 10.0 | 13 per flechette | 5 | 35 | |
| 12 gauge | Slug | 430 | 9.0 | 140 | 6 | 50 | |
| 12 gauge | Dragon's Breath | 350 | 18.0 | 8 per pellet + fire | 0 | 5 | Incendiary, sets fires |
| .45-70 | Lever | 580 | 6.0 | 130 | 10 | 55 | Lever action |
| 40mm | HE grenade | 76 | 15.0 | explosion | n/a | n/a | Launcher |
| Flare | Signal flare | 60 | 20.0 | 15 + fire | 0 | 0 | Flare gun |

Damage values are "base damage on an unarmored flesh hit to the thorax before range falloff." Zone multipliers are applied after.

The drag column above is a first draft. Part 43.1 has the calibrated drag constants (in 1/m, with velocity retention targets per cartridge) and the four falloff curve families. Part 43 wins wherever the two differ.

### 5.3.4 Damage over distance

Damage scales with the projectile's current kinetic energy relative to its muzzle energy, through a curve that's flat at first and then drops. Per ammo type, a `DamageFalloffCurve` maps remaining velocity fraction (current speed / muzzle speed) to damage multiplier. Default curve: 1.0 at 1.0 velocity, 1.0 at 0.85, 0.85 at 0.65, 0.6 at 0.45, 0.4 at 0.3, and 0.2 at 0.15. Projectiles below 15% of their muzzle velocity are destroyed. Penetration power scales linearly with velocity fraction.

That means pistols lose damage noticeably past 40 m, SMGs past 60 m, intermediate rifles past 200 m and full-power rifles past 400 m. The table above combined with this curve gets that shape; verify it in a unit test.

### 5.3.5 Subsonic and supersonic

Rounds traveling above 343 m/s make a supersonic crack when they pass near a player (a "near miss" event, within 3 m of a player's head; part 28 has the sound). Subsonic rounds don't crack, they whiz quietly. That makes subsonic ammo plus a suppressor the stealth build, a deliberate design.

## 5.4 ACCURACY, SPREAD AND SWAY

Accuracy is a combination of four things. Keep them separate in code. They each have different causes and different counters.

### 5.4.1 Mechanical accuracy (dispersion)

The weapon's inherent precision: the cone that a perfectly still, perfectly aimed shot falls within. Measured in MOA (minutes of angle; 1 MOA is about 2.9 cm at 100 m). Barrel quality, ammo type and the weapon's design set it. Typical values: bolt-action precision rifle 0.5 to 1.0 MOA, DMR 1.0 to 1.8, assault rifle 2.0 to 3.5, carbine 2.5 to 4.0, SMG 4 to 7, pistol 5 to 9, shotgun slug 6 to 10, shotgun pellet spread separate (5.4.5).

Dispersion is applied to every shot as a random angular offset in a cone, using a Gaussian distribution clipped at 2 sigma, where the cone's 2-sigma diameter is the MOA value.

### 5.4.2 Hip-fire spread

When not ADS, a much larger spread cone applies, expressed in degrees. Base hip spread per weapon class (before attachments): pistol 2.2°, SMG 2.6°, carbine 3.2°, assault rifle 3.6°, battle rifle 4.4°, LMG 5.0°, DMR 5.4°, bolt-action 7.0°, shotgun 3.0° (plus pellet spread). Modifiers: moving +40% at jog, +100% at sprint (and you can't fire while sprinting), crouching -15%, prone -30%, in the air +200%. Laser sight attachments reduce hip spread (part 08). There's no hip-fire crosshair by default in Standard raids (a small dot only, configurable), which pushes players to ADS.

### 5.4.3 Sway

Weapon sway is the slow wander of the aim point caused by the character's body. It's applied in ADS, and it's what scopes and breathing control fight against. Sway is a 2D Perlin-noise-driven offset with an amplitude and frequency per weapon, modified by:

Weapon weight and balance (part 08 computes "ergonomics" from the attachment loadout; lower ergonomics means more sway).
Stamina: below 50%, sway amplitude grows linearly to 2x at 0%.
Stance: crouch 0.7x, prone 0.4x, prone with bipod 0.15x, leaning against cover with "brace" (rest the weapon on a ledge or wall edge automatically when ADS within 15 cm of a surface, Tier 2) 0.3x.
Injuries: arm fracture 2.5x, heavy pain 1.5x (until painkillers).
Holding breath (scoped weapons only, hold Shift in ADS): 0.15x for up to 4 seconds, then a "breathe out" penalty of 1.6x for 1 second.
Cold (part 5.10): shivering adds a high-frequency tremor.

Sway is client-simulated and deterministic (seeded per raid and per player, synchronized with the server clock), so the server can approximately validate the direction (within tolerance) without needing every tick of sway.

### 5.4.4 Recoil

Recoil is the most important feel element of shooting. We use a hybrid model: a learnable pattern plus a random component, applied to the camera (view kick) and the weapon model (visual kick) separately.

Per weapon, recoil is defined by:

`VerticalRecoil` (degrees per shot, base), `HorizontalRecoil` (degrees per shot, max random deviation), `RecoilPattern` (a curve asset: for shot index N in a spray, the expected direction bias; e.g. an AK-pattern rifle climbs then pulls right after shot 8), `RecoilRecoveryRate` (degrees per second the view returns toward the original aim point after firing stops), `RecoilRecoveryDelay` (seconds after last shot before recovery begins), `FirstShotMultiplier` (first shot in a burst kicks this much harder, usually 1.2 to 1.5), `CameraKickRatio` (how much of the recoil moves the camera vs only the weapon model; 0.65 typical for rifles), and `VisualKickProfile` (weapon model kick back, rotation up, and roll, with springs).

Modifiers from attachments: muzzle brakes and compensators reduce vertical and horizontal recoil; stocks reduce vertical; grips reduce horizontal; heavier weapons kick less (recoil scales inversely with total weapon mass, normalized to the base weapon's mass); stance (crouch -10%, prone -25%, bipod -60%).

Recoil goes to the camera as an added rotation that the player has to pull against. Recovery pulls the camera partway back to where it was (not all the way: recovery is capped at 70% of accumulated recoil, so players still need to manage it). That's the "Tarkov/Insurgency feel" where controlling recoil is a skill and a good build makes a rifle feel like a laser.

Visual kick on the weapon model is procedural (5.4.7), so it feels physical even though the pattern is designed.

### 5.4.5 Shotgun spread

Pellet spread is a fixed pattern per ammo type (a set of 2D offsets, normalized) scaled by the weapon's choke (part 08: chokes are attachments on shotguns: cylinder, improved, modified, full) plus a small random jitter per pellet. Cylinder choke: 9 pellets in a 1.0 m circle at 15 m. Full choke: 0.45 m at 15 m. Each pellet is its own projectile (lightweight, same subsystem). Slugs use normal mechanical dispersion.

### 5.4.6 Aim punch and flinch

Getting hit while ADS kicks your view. Aim punch amount scales with the damage taken and the zone: head hits kick hard (6° to 10°), thorax medium (2° to 4°), limbs light (1° to 2°). Armor absorbs half the aim punch when it stops a round. Aim punch recovers over 0.3 s. This is essential: it means the player who hits first gets an advantage, which rewards good positioning.

### 5.4.7 Procedural weapon motion

The weapon in the character's hands is animated by a procedural layer on top of the base animation: weapon sway follows the sway noise, recoil kick is a spring-damper on location and rotation, movement bob is driven by footstep phase, inertia lags the weapon slightly behind fast camera turns (more lag for heavier weapons), and "breathing" is a slow up-down motion when idle. Use the UE animation features: an AnimNode or a Control Rig for the procedural offsets applied to the weapon's IK target (the hand IK bones), so the arms follow the weapon. Values come from the weapon's data asset. This layer is what makes guns feel "heavy" vs "snappy" and should be tuned per weapon (part 29).

## 5.5 FIRE MODES AND WEAPON OPERATION

### 5.5.1 Fire modes

Semi: one shot per trigger pull. Fire rate cap from the weapon's RPM. Burst: N shots (2 or 3) per pull at the burst RPM, then a short delay. Auto: continuous at RPM while held. Bolt: one shot, then a bolt cycle animation (0.7 to 1.2 s) before the next, which can be interrupted to keep aiming and cycled later ("hold fire to cycle immediately" or "release to cycle", setting). Pump: one shot, then pump (0.5 to 0.7 s). Lever: like bolt, faster (0.45 s). Double action revolver: one shot per pull, with a long trigger pull delay (0.12 s). Single-shot (breech-loading): reload after every shot.

Players switch fire modes with B (cycles through the modes the weapon supports). The fire selector state is visible on the weapon model (the selector lever moves; animate it) and on the HUD.

### 5.5.2 Ammunition, magazines and chambers

Ammunition is physical. Magazines are items with their own inventory cells and capacity, which hold specific rounds in a specific order (a stack, last in first out). You can load mixed ammo: three tracers at the bottom of a mag, AP rounds on top, and that's exactly the order they fire in. That's a deep Tarkov-style feature, and it's worth building because the gunsmith crowd loves it. For casual players: an "auto-fill" button loads the best available ammo of the right caliber into all magazines when building a loadout.

Each weapon has a chamber that holds one round (closed-bolt weapons), and a magazine. Total capacity is mag + 1 for closed-bolt weapons. Open-bolt weapons (some SMGs and LMGs) have no chamber round.

Loading magazines takes time: 0.4 s per round in the inventory (outside the raid it's instant in the stash, inside the raid it takes time and can be interrupted). Speed loaders for revolvers and stripper clips for some rifles speed this up.

### 5.5.3 Reloads

Three reload types:

Tactical reload (R tap with rounds left): swap the magazine, keep the round in the chamber, and the old magazine goes back into your rig with its remaining rounds. Speed: the weapon's base reload time.

Empty reload (R with chamber empty): swap the magazine and chamber a round (charging handle or bolt release). Speed: base reload time + 0.4 to 0.8 s.

Fast reload (double-tap R): swap the magazine and drop the old one on the ground (it's lost unless you pick it up). 30% faster than a tactical reload. Used in emergencies.

Where the new magazine comes from: the rig's magazine slots first, then pockets, then the backpack (from the backpack takes +1.5 s, because you're digging). Reload always takes the fullest magazine of the matching type.

Single-round reloads (shotguns, bolt actions without detachable mags, revolvers without speed loaders, lever actions): per-round insertion animation, can be interrupted by firing (fires what's loaded), and the reload continues automatically until full or interrupted.

Check magazine (hold R): shows the approximate rounds remaining (exact count only if the weapon has a mag with a window or you have the "Count Rounds" skill from the Armorer's gunsmith upgrade; otherwise it shows "Full", "About half", "Nearly empty"). Check chamber (hold R and B): confirms there's a round chambered.

### 5.5.4 Malfunctions

Weapons have a durability value (0 to 100). Durability drops 0.02 to 0.08 per shot (by weapon class and ammo), more with heavy loads, waterlogging and salt exposure. Malfunction chance per shot is near zero above 80 durability and rises to 4% at 30 durability and 12% at 10. Malfunction types: failure to feed (clear with R: 0.8 s), stovepipe (clear with R: 1.2 s), double feed (clear with R twice: 2.5 s total), and a misfire (dud round; rack the charging handle). Malfunctions have their own animations and sounds. They create clutch moments and they're why maintaining your gun matters. Repair kits fix durability between raids (at the Armorer, for Scrip) and field repair kits fix part of it in raid (Tier 2). Durability caps drop with repeated repair (like Tarkov), so old guns eventually wear out.

## 5.6 PENETRATION AND RICOCHET

### 5.6.1 Material penetration

Every surface has a physical material with a `PenetrationResistance` (mm RHA equivalent per cm of material) and an impact effect set. When a projectile hits a surface, the server computes the material thickness along the projectile's path (a back-trace from beyond the hit point, up to 100 cm), multiplies by resistance, and compares to the projectile's remaining penetration power.

| Material | Resistance per cm | Typical thickness | Notes |
|---|---|---|---|
| Glass (window) | 0.5 | 0.5 cm | Shatters on first hit (replicated) |
| Drywall / plaster | 0.3 | 2 to 3 cm | |
| Wood (planks, doors) | 0.6 | 3 to 5 cm | Doors penetrable by rifles |
| Wood (thick, beams) | 0.9 | 15 to 25 cm | |
| Sheet metal (car body, corrugated) | 6.0 | 0.1 to 0.2 cm | |
| Steel plate | 10.0 | 0.5 to 2 cm | Rarely penetrable |
| Brick | 3.0 | 10 to 20 cm | Only AP rifle rounds |
| Concrete | 4.0 | 15 to 30 cm | Effectively impenetrable |
| Rock | 6.0 | any | Impenetrable |
| Water | 0.4 per cm (special) | n/a | See 5.6.3 |
| Flesh | 1.0 | body | Overpenetration of bodies with rifle AP |
| Foliage | 0.02 | n/a | Stops nothing, deflects slightly |
| Sandbags | 3.5 | 30 cm | |
| Car engine block | 12.0 | 40 cm | Hide behind the engine, not the door |

If the projectile has enough power, it passes through, losing the absorbed amount of penetration power and a proportional amount of velocity (and so damage), with a random deflection of up to 3° (more for thin metal). Penetration creates exit-side impact VFX and decals. If it doesn't have enough power, it stops (or ricochets, 5.6.2).

### 5.6.2 Ricochet

If the angle between the projectile direction and the surface is shallow (under 15° from the surface plane) and the material is hard (metal, concrete, rock, water), the projectile ricochets instead of penetrating: reflected direction with a random 5° perturbation, velocity reduced by 40 to 60%, damage reduced the same. Ricochets have their own sound (part 28, the classic whine). Rounds can ricochet once; the second hit always stops or penetrates.

### 5.6.3 Water

Water is special and important here. A projectile entering water at an angle steeper than 10° from the surface penetrates the water, slowing dramatically (velocity drops by 70% in the first 30 cm and the projectile is destroyed after 1.5 m). So a player diving under 1.5 m of water is safe from gunfire. A projectile hitting water at a shallower angle skips (a ricochet with a splash). Impacts on water make splash VFX and sound visible across the map, which is a great tell for long-range shooters missing.

### 5.6.4 Destructibles

Small destructible elements break from gunfire: windows (shatter), light bulbs and lamps (go out, which matters at night), bottles and jars, wooden crates (small ones break after enough damage and drop their contents), padlocks (a shotgun blast or 3 rifle hits open a padlock on a locked container, noisily), and the tops of fuel drums (leak, then can ignite from incendiary rounds or fire). Don't use Chaos destruction for gunfire-driven breaking of large structures in v1; it's expensive to replicate and unpredictable. Use pre-fractured swaps (intact mesh replaced with broken mesh and a few physics debris pieces that are cosmetic only and not replicated).

## 5.7 HEALTH AND HIT ZONES

Health is split into seven zones, Tarkov-style but simplified to be readable. Each zone has its own HP. Total HP is the sum.

| Zone | HP | Destroyed effect | Damage to total |
|---|---|---|---|
| Head | 35 | Death | n/a |
| Thorax | 85 | Death | n/a |
| Stomach | 70 | Heavy bleeding starts, hydration drains 3x, can't sprint | spill 1.0 |
| Left arm | 60 | Fracture: 2.5x sway, slower reloads, weapon drop chance | spill 0.7 |
| Right arm | 60 | Same as left | spill 0.7 |
| Left leg | 65 | Fracture: limp, no sprint, see 4.2.3 | spill 0.7 |
| Right leg | 65 | Same as left | spill 0.7 |
| Total | 440 | | |

"Spill": when a non-vital zone (stomach, arms, legs) is at 0 HP (destroyed) and takes more damage, that damage spills over to the other zones, distributed evenly among those still above 0, multiplied by the spill factor. This is how you can die from leg hits if you keep taking them, but it's slower than headshots and thorax shots.

Death happens when the head or thorax reaches 0 HP, or when total HP reaches 0.

Destroyed zones (0 HP) can be restored with a surgery kit (part 12), which brings the zone back to 1 HP and lowers its max HP by 25% for the rest of the raid. Healing items can't heal a destroyed zone otherwise.

### 5.7.1 Zone multipliers

The "base damage" in 5.3.3 is calibrated for thorax hits. Other zones get a multiplier applied to the projectile's damage before armor:

Head: 1.0 (head has low HP instead of a big multiplier; a 7.62x39 round at 60 damage kills an unhelmeted head at 35 HP in one shot, which is the intended result: unhelmeted headshots kill in one hit with anything above a pistol, and most pistol rounds too).
Neck: counts as head, 0.8 multiplier.
Thorax: 1.0.
Stomach: 1.0.
Arms: 0.7 (they're small and often in front of the thorax, so many arm hits are partial thorax blocks).
Hands: 0.5, counts as arm.
Legs: 0.8.
Feet: 0.5, counts as leg.

### 5.7.2 TTK check

Verify the numbers produce the target TTK from part 01 (0.25 to 0.45 s for an unarmored target, mid-tier rifle, body shots under 50 m). The Mako with M855 does 50 per thorax hit, so two thorax hits kill (85 HP), and at 750 RPM the shots are 0.08 s apart. Recoil means a player typically fires 3 to 5 rounds to land those 2 hits, which puts the kill at 0.16 to 0.32 s. Kills without a head or thorax hit take much longer (they need spill damage across 440 total HP), and most real fights end on 2 to 4 thorax hits, which lands in the target band. Part 43.3 has the simulation setup and the target table; unit test it there.

## 5.8 ARMOR

Armor is the main progression in survivability, and the counter to it is ammunition. The armor model follows the "penetration vs armor class" approach.

### 5.8.1 Armor items

Body armor covers the thorax (all body armor) and optionally the stomach (most armor) and arms (rare, heavy armor). Helmets cover the head, with coverage areas (top, back of head, ears, face for helmets with visors). Each armor item has:

Armor Class (1 to 6), Durability (current / max, in points, e.g. 40/40 for a light vest, 85/85 for heavy plates), Material (Aramid, UHMWPE, Ceramic, Steel, Titanium, Composite) which sets how fast it loses durability and how cheaply it can be repaired, Coverage (zones and sub-zones), Weight, Movement penalty (speed and turn penalties on heavy armor), Ergonomics penalty (affects weapon sway), Sound penalty (helmets with ear coverage reduce hearing; part 28), and Blunt Throughput (the fraction of damage that comes through as blunt trauma even when the armor stops the round).

### 5.8.2 The penetration roll

When a projectile hits an armored zone:

1. Effective armor class = Armor Class × (current durability / max durability)^0.5. Damaged armor is weaker, not linearly.
2. Penetration value = the projectile's remaining penetration (mm RHA equivalent from 5.3.3, scaled by velocity).
3. Armor threshold for each class (mm RHA equivalent): Class 1: 5, Class 2: 9, Class 3: 14, Class 4: 19, Class 5: 25, Class 6: 31. Effective threshold = class threshold interpolated by effective class.
4. Penetration chance = a logistic function of (Penetration - Threshold): `P = 1 / (1 + exp(-(Pen - Threshold) / 2.0))`. So equal values give a 50% chance, 6 mm over gives about 95%, 6 mm under gives about 5%.
5. Roll (server-side, seeded). If it penetrates: damage passes through, reduced by 10% to 25% depending on how close the roll was, and the projectile's penetration is reduced by the threshold. If it doesn't: the armor stops the round, the player takes Blunt Throughput × damage as blunt damage to the zone, and the projectile is destroyed.
6. Either way, armor durability drops by projectile damage × (ammo armor damage % / 100) × material factor (Ceramic 1.2, UHMWPE 0.9, Steel 0.6, Aramid 1.0, Titanium 0.7, Composite 0.85).

This gives the result we want: a Class 4 vest stops 9mm and most 5.56 FMJ but loses durability fast to them, and AP rounds go straight through. Ammo choice becomes the most important loadout decision after the weapon itself.

### 5.8.3 Helmets

Helmets work the same way, with additional rules: ricochet chance on helmets (round helmets have a ricochet chance of 20% to 45% on angled hits, which stops the round entirely even if it would have penetrated, and plays a loud "ping"), and a face shield attachment on some helmets that covers the face at a lower class.

Coverage gaps: helmets cover the top and back of the head (and ears with certain models). Face and jaw hits bypass a helmet without a face shield. Hit location on the head mesh (the physics body plus a check against the helmet's coverage mask using the hit's local position on the head sphere) decides which.

## 5.9 STATUS EFFECTS

Status effects are GAS Gameplay Effects with tags (part 31). They're the soul of the healing system and the reason the inventory has twelve kinds of medicine.

| Effect | Cause | Effect | Treatment |
|---|---|---|---|
| Light bleed | Any penetrating hit, 30% chance (higher for HP ammo) | -0.8 HP/s on the zone, blood drips | Bandage, any medkit |
| Heavy bleed | Penetrating hit, 10% chance (higher with HP and high damage); destroyed stomach | -3.0 HP/s, blood trail on ground | Tourniquet, hemostatic, surgical kit, advanced medkit |
| Fracture | Limb at low HP taking a hit (chance scales), falls | See 4.2.3 and 5.7 | Splint, surgical kit |
| Pain | Any damage over 30 in a zone | Slight vignette, sway 1.5x when severe | Painkillers (suppress for 180 s) |
| Concussion | Head hit absorbed by helmet, explosion within 6 m | Blurred vision, tinnitus, sway 1.8x for 6 to 15 s | Time |
| Stun | Flashbang, very close explosion | White screen, deaf, for up to 4 s | Time |
| Burning | Fire, incendiary rounds, Dragon's Breath | -6 HP/s on hit zones for 4 s, screaming | Roll (go prone), water |
| Contusion (blunt trauma) | Armor stops a round | Short flinch, aim punch | Time |
| Cold | Soaked + Surge outside, water | Builds 0 to 100; at 50: shivering (tremor sway), at 80: stamina regen halved, at 100: -1 HP/s | Dry building, fire barrel, warm drink item |
| Dehydration | Hydration under 20 | Stamina regen -50% | Water, drinks |
| Salt Sickness | Hit by a Bloat's burst, eating raw Marrow Salt, long time in Surge water | Green-tinged vision, slow drain, Hollows detect you from further | Mother Agnes's antidote (rare), time |
| Adrenaline | Taking damage, being near-missed | +10% speed, -20% sway, 8 s, then fatigue | Natural |
| Shaken | After revive | 1.4x sway, slower stamina regen, 60 s | Time |

Hydration is the only "need" meter. It starts at 100 and drains slowly (100 to 0 over 45 minutes of raid at normal activity, faster when sprinting and when stomach is destroyed). It barely matters in a normal raid and matters a lot if you're injured, which is the point.

## 5.10 HEALING ITEMS

Healing items are used from quick slots or the inventory. Each has a use time (during which you move at walk speed and can't fire), uses (multiple uses per item for kits), and effects. Part 12 has the full item list with names, sizes, values and rarity. The mechanical categories:

Bandages: stop light bleeding, 3 s.
Tourniquets and hemostatics: stop heavy bleeding, 4 to 6 s.
Splints: fix a fracture, 6 s.
Medkits (small, IFAK-style, large): heal HP over time across all zones (prioritizing the most damaged non-destroyed zone, or player-chosen zone in the health screen), and some also stop bleeds. Pools of 100 to 400 HP, at 40 to 80 HP/s, with use times from 2 to 5 s per activation.
Surgical kits: restore a destroyed zone, 12 to 18 s. Huge commitment in a fight.
Painkillers: suppress pain and fracture penalties for 180 s, 2 s.
Stimulants (injectors, rare): various buffs (stamina, regen, speed, steady aim) with drawbacks after (fatigue, dehydration, sway). Mother Agnes's salt stimulants are the high-tier ones.
Food and drink: hydration and minor HP regen.

The health screen (part 24) shows each zone with its HP and status icons, and lets you apply items to specific zones by drag and drop or by selecting the item and clicking a zone.

## 5.11 LAG COMPENSATION

To make hits fair for clients with ping, the server rewinds player hitboxes to where they were when the shooter fired.

Implementation: each player character keeps a ring buffer of hitbox snapshots (the world transforms of each physics body, or just the root transform plus the animation pose time if you're short on memory) at every server tick for the last 400 ms. When a projectile's trace on the server would test against player hitboxes, the server rewinds every candidate player's hitboxes (only those near the projectile's path, using a broad-phase bounding check) to the shooter's fire time plus the projectile's flight time so far, minus the shooter's ping. This is the standard "rewind" approach. Cap the rewind at 250 ms: players with ping over 250 ms get no further compensation (they have to lead their shots), which protects everyone else from being shot around corners by extreme ping.

For the rewound hit check, use a separate set of simplified collision shapes (the physics asset bodies) that are cheap to transform. Don't rewind the whole skeletal mesh.

Projectiles that fly for a long time (a sniper shot at 400 m takes about 0.5 s) are simulated on the server in real time from the moment of firing, and only the initial ping offset is compensated. That's correct: the target had 0.5 s to move, and leading the shot is the shooter's job.

## 5.12 SHOT NETWORKING DETAILS

For bandwidth, auto-fire shots are batched: the client sends a `ServerFireBatch` RPC every 50 ms with all the shots fired in that window (each shot as origin (quantized to 1 cm), direction (quantized to 0.01°), timestamp delta (8 bits), and spread seed (16 bits)). The server processes them in order. Semi-auto, bolt, pump and first shots of bursts send immediately as reliable RPCs because a lost single shot is a terrible feeling.

Other clients receive weapon fire as a replicated struct on the weapon actor (`FSMFireEvent`: counter, origin, direction, fire mode, muzzle device type), batched with net priority. They spawn cosmetic tracers (one in N shots for non-tracer ammo, every shot for tracer ammo) and sounds locally. They don't simulate the projectiles for hits.

Impacts are replicated as a batched multicast (`FSMImpactBatch`: up to 32 impacts per send, each with location, normal, physical material ID and impact type), sent only to clients within 150 m of the impact, unreliable. Blood impacts on players are separated and sent to everyone with the player relevant.

## 5.13 EXPLOSIVES

Grenades, launcher rounds, fuel drums and Bloats explode. Explosions apply damage from a center point with a falloff radius and fragment simulation:

Blast damage: full within inner radius, linear falloff to 0 at outer radius, with line-of-sight checks to each hit zone of each character in range (a trace from the explosion center to each zone's body; blocked zones take no blast damage). Blast damage ignores armor class but armor reduces it by 30% for the covered zones.

Fragments: frag grenades also spawn 30 to 60 fragment projectiles in random directions (simulated as projectiles with low penetration and high drag, ~0.5 s lifetime), which are stopped by armor and cover. This makes grenade damage feel physical and lets cover work.

| Explosive | Inner radius | Outer radius | Blast damage | Fragments | Fuse |
|---|---|---|---|---|---|
| Frag grenade (the Gull) | 2 m | 8 m | 180 | 45 | 4.5 s |
| Impact grenade (the Rook) | 1.5 m | 6 m | 140 | 25 | impact |
| Flashbang (the Lark) | n/a | 12 m stun | 0 | 0 | 1.5 s |
| Smoke (the Fogbank) | n/a | 8 m cloud | 0 | 0 | 1.5 s, 40 s duration |
| Incendiary (the Firebrand) | 3 m fire | 3 m | 6/s burn | 0 | 2.0 s, 12 s fire |
| 40mm HE | 2 m | 7 m | 160 | 30 | impact, arms at 15 m |
| Fuel drum | 3 m | 9 m | 200 | 10 debris | when ignited |
| Bloat (Hollow) | 2.5 m | 6 m | 90 + salt sickness | 0 | on death |

Explosions push physics objects, shatter windows within the outer radius, flash the area (a light pulse), make a huge sound (audible across the whole map, with distance processing), and kick dust and water (VFX by surface).

## 5.14 THE COMBAT TEST MAP

Build a combat test map (`L_Test_Combat`) before anything else in the combat system. It has:

A 1 km long shooting range with distance markers every 50 m and steel targets that ring and swing on hit (the targets show the impact point as a decal for 10 s).

A penetration wall: a row of panels, one per material, each in three thicknesses, with a target dummy behind each.

An armor lane: dummies wearing each armor class, with a panel showing the penetration result, damage dealt, and remaining durability after each hit.

A recoil wall: a big grid at 25 m where each shot leaves a mark, with a "clear" button, so you can visualize spray patterns.

A sway test: a scoped target at 300 m with a stance selector.

A drop chart: at 100 m, 200 m, 300 m, 400 m, 500 m and 600 m, large boards where the impact height vs aim point is measured and logged to a table on screen.

A water pool with a dummy at different depths to test water penetration.

A console command `sm.combat.stats <weapon>` that prints the weapon's computed stats with current attachments.

Every weapon goes through this map. Part 37 automates the drop chart and TTK simulations as unit tests.

---

End of part 05. Next: `06_WEAPONS_CATALOG_PART1.md`.
