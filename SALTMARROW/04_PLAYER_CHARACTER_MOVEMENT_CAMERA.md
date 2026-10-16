# SALTMARROW: PART 04, PLAYER CHARACTER, MOVEMENT AND CAMERA

Movement is the first thing a player feels and the last thing they forgive. This part specifies every movement state, every number, the camera rig, and how all of it replicates. Build it in C++ on top of Unreal's Character Movement Component (CMC) with a custom subclass, using the saved-move system for client prediction of every custom state. Do not build movement in Blueprints.

If you started from Lyra (part 30 explains why I want you to), Lyra's `ULyraCharacterMovementComponent` is the base. Subclass it as `USMCharacterMovementComponent`. If you didn't, subclass `UCharacterMovementComponent` directly. Either way, everything below lives in that class and its saved move.

Note on Mover 2.0: Unreal's newer Mover plugin is tempting, and by the time you read this it may be production ready. Check its status in the engine version installed. If it's still marked experimental or beta, stay on CMC. CMC is battle-tested for networked shooters, and we can't afford to debug an experimental movement plugin's prediction while also building a game. Record the decision in `DECISIONS.md`.

---

## 4.1 THE CHARACTER BODY

The salvager is a human of average build, 1.78 m tall standing, with proportions taken from the UE5 Manny/Quinn skeletons (both male and female body types are supported, see part 10 for character customization). Use the standard UE5 mannequin skeleton (`SK_Mannequin`) as the base skeleton so that the Game Animation Sample's motion matching data and the Lyra animation sets retarget cleanly.

### 4.1.1 Capsule

| Stance | Half height | Radius | Eye height (from capsule bottom) |
|---|---|---|---|
| Standing | 88 cm | 34 cm | 165 cm |
| Crouching | 60 cm | 34 cm | 112 cm |
| Prone | 34 cm (special, see 4.6) | 34 cm | 38 cm |
| Swimming | 60 cm | 34 cm | 100 cm (surface), varies underwater |
| Downed | 34 cm | 34 cm | 38 cm |

Prone uses a capsule plus an extra trace-based body check, because a capsule can't represent a lying body. Details in 4.6.

### 4.1.2 Physics asset and hitboxes

The character has a physics asset with bodies for each hit zone (part 05 defines the zones): head (sphere), neck (capsule, counts as head for damage, lower multiplier), upper chest and lower chest (boxes, both count as thorax), stomach and pelvis (boxes, stomach zone), and upper arm, lower arm, hand, thigh, calf, foot for each side (capsules, mapped to the limb zones). Hitboxes are sized to the mesh, not inflated. Hit detection traces against these bodies on the server using lag compensation (part 05).

## 4.2 THE MOVEMENT STATES

The movement state machine has a primary mode (from CMC: Walking, Falling, Swimming, Custom) and a set of custom sub-states. Custom movement mode values go in an enum `ESMCustomMovementMode`: `Mantling`, `Vaulting`, `LadderClimbing`, `Wading` (we treat deep wading as a custom mode, not as Walking with a speed penalty, because it has unique physics), `Prone`, `Downed`, `BoatSeated`, `Ragdoll` (for knockdowns, Tier 2).

Gait and stance are separate flags, replicated through the saved move compressed flags and an extended flags byte (CMC gives you four custom flags; we need more, so use the newer `FCharacterNetworkMoveData` extension path to add a custom byte, as shown in Epic's networked movement docs).

Gait: `Walk`, `Jog`, `Sprint`.
Stance: `Stand`, `Crouch`, `Prone`.
Aim: `None`, `Hip`, `ADS`.
Lean: `-1, 0, +1` (left, none, right), with an analog value for smooth lean on gamepad.

### 4.2.1 Speed table

All speeds in meters per second (multiply by 100 for Unreal units). These are base values, before gear weight and injuries.

| State | Forward | Strafe | Backward | Accel | Decel |
|---|---|---|---|---|---|
| Walk, stand | 1.80 | 1.70 | 1.50 | 9.0 | 12.0 |
| Jog, stand (default) | 3.60 | 3.30 | 2.60 | 10.0 | 14.0 |
| Sprint | 5.60 | n/a (forward only, ±35° cone) | n/a | 7.0 | 10.0 |
| Walk, crouch | 1.10 | 1.00 | 0.90 | 8.0 | 12.0 |
| Jog, crouch | 2.10 | 1.90 | 1.60 | 8.0 | 12.0 |
| Prone crawl | 0.65 | 0.45 | 0.40 | 4.0 | 8.0 |
| ADS, stand | 1.90 | 1.80 | 1.60 | 8.0 | 12.0 |
| ADS, crouch | 1.00 | 0.95 | 0.85 | 8.0 | 12.0 |
| Wading, knee (0.3 to 0.6 m) | 2.80 | 2.50 | 2.00 | 6.0 | 9.0 |
| Wading, waist (0.6 to 1.1 m) | 1.40 | 1.20 | 1.00 | 3.0 | 6.0 |
| Wading, chest (1.1 to 1.45 m) | 0.80 | 0.70 | 0.60 | 2.0 | 4.0 |
| Swimming, surface | 1.40 | 1.20 | 1.00 | 2.0 | 3.0 |
| Swimming, sprint | 2.10 | n/a | n/a | 2.5 | 3.0 |
| Swimming, underwater | 1.20 | 1.10 | 0.90 | 2.0 | 3.0 |
| Ladder up/down | 1.30 / 1.80 | n/a | n/a | n/a | n/a |
| Downed crawl | 0.60 | 0.40 | 0.30 | 3.0 | 6.0 |

Turning: max yaw rate for the character body follows the camera with no limit in Jog and Walk (the character turns to face aim direction when aiming or shooting, see 4.10), and is limited to 220°/s in Sprint (you can't snap 180° mid-sprint without slowing).

### 4.2.2 Weight and encumbrance

Every item has a weight in kilograms. The character's total carried weight affects movement. Base thresholds:

0 to 22 kg: no penalty.
22 to 40 kg: "Burdened": jog and sprint speed reduced linearly from 100% to 85%, stamina drain +30%, jump height -15%.
40 to 60 kg: "Overloaded": speed reduced linearly from 85% to 60%, can't sprint above 50 kg, stamina drain +80%, no jumping above 55 kg, mantle speed halved.
60 kg and above: "Immobile": walk only at 1.0 m/s, no sprint, no jump, no mantle. A red HUD weight icon pulses.

Skills or hideout upgrades don't change this in v1. Strength isn't a stat. The only way to carry more is to carry less.

Weapon weight affects ADS speed and sway separately (part 05 and part 08). Armor weight counts toward carried weight like everything else.

### 4.2.3 Injury effects on movement

From part 05's injury system: a fractured leg (one) gives -25% max speed, no sprint, limp animation, louder footsteps. Both legs fractured: -50%, no sprint, no jump, no mantle. Heavy bleed: no penalty to speed, but leaves blood decals on the ground every 1.5 m (which other players can track). Painkillers suppress limb penalties temporarily but don't heal them.

## 4.3 STAMINA

Stamina is 100 points. It's the shared resource for sprinting, jumping, mantling, holding breath (scoped aim and underwater), melee and swimming fast.

| Action | Cost |
|---|---|
| Sprint | 9.0 per second |
| Jump | 12 flat |
| Mantle low (under 1.1 m) | 6 flat |
| Mantle high (1.1 to 2.1 m) | 15 flat |
| Vault | 8 flat |
| Hold breath while scoped | 18 per second (max 4 seconds at full stamina; can't start under 20) |
| Melee swing | 14 flat |
| Fast swim | 11 per second |
| Underwater (breath) | 3.3 per second (30 seconds from full), see 4.7 |

Regeneration: 14 per second after a 1.2 second delay since the last stamina use. Delay is 2.5 seconds if stamina hit 0 (exhausted). While exhausted (from hitting 0 until stamina regenerates to 30), the character breathes heavily (audible to others within 12 m), weapon sway is doubled, and sprint is disabled. Regen is halved while Burdened, quartered while Overloaded, and zero while swimming at the surface (you regen breath, not stamina, when your head is above water; see 4.7).

Stamina and breath are replicated attributes in GAS (part 31), predicted on the owning client.

## 4.4 JUMPING, FALLING AND LANDING

Jump height: 0.55 m (jump Z velocity tuned to hit that apex with gravity at 980 cm/s² and gravity scale 1.35, which gives a snappy, grounded jump without moon physics). Jump is mostly for small obstacles and dodging; mantling covers real climbing.

Air control: 0.18. Low enough that jumping is committal.

Fall damage: none under 3.5 m. From 3.5 m to 9 m, damage scales from 0 to 300 HP split across both legs (and a 60% chance per leg of a fracture above 6 m). Above 9 m: death unless landing in water. Landing in water deeper than 1.5 m negates all fall damage up to 25 m (the cliffs on the north coast are 18 to 22 m high, and jumping off them into the sea at high tide is a deliberate escape route).

Landing: a soft landing (fall under 1.5 m) has no animation or slowdown; medium landing (1.5 to 3.5 m) plays a short land animation with a 0.25 s movement slowdown to 50%; hard landing (over 3.5 m) plays a roll if sprinting forward on landing (no slowdown, but costs 15 stamina) or a heavy land with 0.6 s at 30% speed.

## 4.5 MANTLING AND VAULTING

This is the movement feature that makes the town feel climbable. Players hold Jump (or press it, configurable: "Mantle on jump press" or "Mantle on jump hold") near an obstacle, and the character climbs it if it's mantle-able.

### 4.5.1 Detection

On jump input, run the mantle check before jumping. The check:

1. Forward capsule trace from the character at knee height, 60 cm forward, to find a wall. If none, normal jump.
2. Downward traces from above the wall's top edge at 3 points (left, center, right of the character's width) to find the ledge height and surface normal. The ledge must be within 0.5 m to 2.1 m above the character's feet, and the surface must be walkable (normal Z > 0.7).
3. A capsule clearance check at the ledge top for the target stance: standing clearance first, then crouch clearance. If neither fits, no mantle.
4. A check that there's no ceiling blocking the climb path (a trace along the arc).
5. Classify: Step (0.3 to 0.5 m, handled by CMC step-up, no animation), Low Mantle (0.5 to 1.1 m), High Mantle (1.1 to 2.1 m), Vault (0.5 to 1.2 m and the obstacle is less than 0.6 m thick with a walkable surface on the far side within 1 m below the top). Vault takes priority over Low Mantle when moving forward at jog or sprint speed.

### 4.5.2 Execution

Mantle and vault are root-motion-free, procedurally positioned movements driven by the movement component, not by animation root motion (root motion and network prediction get ugly fast). The movement component moves the capsule along a precomputed curve over a fixed duration, and the animation system plays a matching montage synced to the curve with motion warping (UE's Motion Warping plugin, warping to the ledge target transform).

| Type | Duration | Stamina | Weapon state |
|---|---|---|---|
| Low Mantle | 0.45 s | 6 | lowered, can't fire |
| High Mantle | 0.95 s | 15 | holstered to back, can't fire |
| Vault | 0.55 s | 8 | lowered, can't fire, momentum kept |

The movement is replicated as a custom movement mode with a start time and the target transform included in the saved move, so the server can reproduce it exactly and correct only if the server's own check fails.

### 4.5.3 Mantle restrictions

No mantle while Overloaded over 55 kg, while both legs are fractured, while ADS (pressing jump in ADS exits ADS first), or while carrying a heavy item in hands (Tier 2: carriable objects like fuel cans and salt cores).

## 4.6 PRONE

Prone is important for a game with long sightlines across water and lots of low cover (sea walls, upturned boats, hedges on the moor).

Going prone takes 0.7 s (from standing) or 0.45 s (from crouch). Getting up takes 0.8 s to standing, 0.5 s to crouch. You can't fire during the transitions.

The prone body problem: a lying character is 1.8 m long, but the capsule is a vertical pill. We handle prone with a smaller capsule (half height 34 cm) and an extra body check: before allowing a prone transition and on every prone movement step, do a box trace oriented along the character's facing, 1.8 m long, 0.6 m wide, 0.3 m high, centered so the head is at the capsule. If the box collides with world geometry, the movement is blocked (for transitions, the "can't go prone here" sound plays). Rotation while prone is limited to 90°/s and also checked against the box. This stops players clipping their legs through walls to hide.

Prone aiming: weapon sway is reduced 60% when prone with a bipod deployed, 35% without. Yaw is limited to ±50° from the body's facing without rotating the body (rotating the body is slow).

Prone in water: you can't go prone in water deeper than 0.2 m. If the water rises while you're prone, you're forced to crouch at 0.2 m and to stand at 0.5 m.

## 4.7 WATER: WADING, SWIMMING AND DIVING

Water is the setting's main mechanic, so this has to be spot on.

### 4.7.1 Water detection

The Surge raises and lowers water levels per zone (part 15). The water surface is a set of water bodies (UE's Water plugin, part 26) plus the global ocean, each with a height that can change at runtime. The movement component queries the water height at the character's location each tick through a `USMWaterQuerySubsystem`, which returns the surface height, current flow vector and depth (surface minus ground). Do this with a fast lookup, not by tracing against the water mesh: the water subsystem keeps a coarse 2D grid of zone water heights (2 m cells) updated whenever the Surge changes levels, and the ocean surface uses the Gerstner wave function evaluated on CPU for the exact location (the Water plugin exposes `GetWaveHeightAtLocation`-style queries; use those).

The query is deterministic on server and client given the same raid clock and seed, so prediction stays in sync.

### 4.7.2 Depth bands

| Water depth at character | Mode | Notes |
|---|---|---|
| 0 to 0.3 m | Walking | Splash footsteps, wet decals on legs |
| 0.3 to 0.6 m | Walking, knee wade | Speed per 4.2.1, louder splashes |
| 0.6 to 1.1 m | Wading | Can fire, can ADS, no prone, no sprint |
| 1.1 to 1.45 m | Wading, chest | Can fire pistols and one-handed only, rifles held high and can't ADS |
| over 1.45 m | Swimming | No weapons. Weapon goes on back. |

The transitions use hysteresis (0.05 m) to stop flickering between modes at the boundary.

### 4.7.3 Swimming

Swimming uses CMC's built-in Swimming mode, tuned. Buoyancy 1.02 (the character floats with head above water when idle), surface swimming keeps the head at the surface, and diving (crouch key while swimming) goes underwater. Swim speeds per 4.2.1.

Weight in water: carrying over 30 kg makes you sink slowly (buoyancy drops to 0.95), and you have to actively swim upward. Over 45 kg, you sink fast and can't stay at the surface without dropping gear. That's a deliberate, nasty, memorable rule: a greedy player with a full backpack who falls into deep water has to choose between their loot and their life. Show a HUD hint the first time: "Too heavy to swim. Drop your backpack [hold G]."

### 4.7.4 Breath

When the character's head goes underwater, breath starts draining from stamina (3.3 per second, 30 seconds from full). At 0, drowning damage (20 HP per second to the thorax) starts. Surfacing restores breath at 25 per second. The HUD shows a breath ring around the stamina bar while underwater (part 24). The Rebreather item (Tier 2) gives 120 seconds of extra breath.

### 4.7.5 Currents

Some water bodies have currents, mostly in the harbor mouth, the channel between the main island and Kirk Holm, and the flooded streets during the Surge (water pouring through). Currents apply a force to swimming and wading characters proportional to the flow vector from the water query. Strong currents (over 1.5 m/s) can pull a swimming player out to sea, where the "Open Water" rule applies: beyond the map boundary buoys, the player has 20 seconds to swim back before drowning instantly (with clear warnings). That's how we stop people swimming off the map.

### 4.7.6 Wet state

Characters who go into water above the waist get the "Soaked" status for 120 seconds (or until they're in a dry building for 30 seconds). Soaked increases cold buildup (part 05's Cold system) and makes footsteps squelch (audible). Weapons that went fully underwater get "Waterlogged" for 60 seconds: +15% malfunction chance until dry. Optics fog for 3 seconds after leaving water.

## 4.8 LADDERS

Ladders are actors (`ASMLadder`) with a defined bottom, top and a climb spline (always vertical in v1). Entering a ladder is automatic when walking into its bottom interaction volume while facing it, or by pressing Interact. Climbing speed per 4.2.1. Players can slide down fast (sprint key while descending, 4.0 m/s, makes a lot of noise). At the top, the character steps off automatically. Weapons are holstered on ladders. A player on a ladder can be shot and is vulnerable, which is the point.

Ladders are a custom movement mode with the ladder's ID replicated in the saved move.

## 4.9 LEANING AND PEEKING

Q and E lean left and right (toggle or hold, configurable). Lean rotates the upper body and shifts the camera and the weapon's aim point by 30 cm sideways and 8 cm down at full lean, over 0.18 seconds. Leaning is available while standing and crouching, not prone or sprinting. You can lean while ADS, and this is the main use: peeking corners in first-person ADS.

Lean has collision: a sphere trace from the head to the lean target, and if it hits a wall, the lean stops at the wall (so you can't lean your head through a wall).

The lean value replicates (as a quantized byte) so other players see your character's upper body lean, which matters for fairness.

## 4.10 BODY ORIENTATION

In third person, the character's body orientation rules:

When not aiming, the body faces the direction of movement (orient rotation to movement), with a smooth turn rate of 540°/s. The camera can orbit freely.

When aiming (hip-aim via a "ready" state the moment you hold right-click or fire), or when firing, the body turns to face the camera's aim direction (use controller desired rotation), at 900°/s. Firing from the hip turns the body first; the weapon won't fire until the character is within 10° of the aim direction (this prevents shooting out of your back and stops the classic third-person cheese of firing at something behind you).

After firing from the hip, the character stays in "combat ready" (facing the aim direction) for 1.5 seconds, then relaxes back to movement-oriented.

When ADS, the camera switches to first person (see 4.11), and the body is locked to aim yaw.

## 4.11 THE CAMERA RIG

### 4.11.1 Third-person camera

A spring arm on the character, with the camera at the end. Not attached to the head bone (that would be nauseating) but to a pivot point that follows the character's spine height with smoothing.

| Parameter | Value |
|---|---|
| Pivot | Character root + 155 cm up (standing), 105 cm (crouching), 45 cm (prone) |
| Arm length | 160 cm (standing), 140 cm (crouch), 120 cm (prone) |
| Shoulder offset (socket offset) | Y +55 cm (right shoulder), Z +15 cm |
| FOV | 80° horizontal at 16:9 by default, user range 70° to 100° |
| Pivot lag | 12 (location), rotation lag off |
| Collision | Probe sphere 12 cm, "Camera" trace channel, ignores characters, foliage, and small physics props |
| Collision recovery | Arm extends back over 0.25 s after the obstruction clears |
| Shoulder swap | Key (default V), animates the Y offset to the opposite sign over 0.2 s |
| Auto shoulder swap | Optional setting: when the right shoulder offset hits a wall within 40 cm but the left doesn't, swap automatically |

Pivot height interpolates between stances over the stance transition duration. Arm length changes the same way.

When sprinting, FOV widens by 4° and the arm pulls 15 cm closer, with a subtle camera bob. When in water at chest height or swimming, the pivot lowers to just above the waterline and the arm lengthens to 200 cm so you can see the surface.

Camera shake: a set of `UCameraShakePattern` assets for firing (per weapon class, scaled by recoil stats), taking damage (per hit zone), explosions (distance-based), landing, and the Surge (continuous low-frequency shake during storm peaks). All camera shakes have a global multiplier in Settings > Accessibility.

### 4.11.2 ADS camera and first-person transition

On ADS, the camera transitions from third person to first person over the weapon's ADS time (part 05 and part 08; typically 0.2 to 0.45 s). The transition is:

1. The camera blends from the third-person transform to the first-person ADS transform, which is aligned to the weapon's sight line (the optic's aim point socket, see part 08).
2. The character mesh is hidden from the owning player's camera from the neck up (to avoid seeing the inside of the head) and the arms and weapon remain visible.
3. The FOV blends to the ADS FOV: base first-person FOV (user setting, default 72°) times the optic's zoom factor for non-magnified optics (1.0x to 1.1x), and the scope rendering takes over for magnified optics (part 26, picture-in-picture scope rendering).

The first-person view uses the same character mesh as third person (true first person, like the Game Animation Sample's first-person setup and like Hunt), not a separate arms-only mesh. That way what you see is what other players see, which keeps peeking honest and saves us building two animation sets. The head bone is scaled to zero for the owning player only, through a `SetBoneScale` on a "first person visibility" layer or the UE5.5+ first-person rendering features if available. Check what the installed engine version offers for "First Person Rendering" (Epic added first-person-specific rendering features in 5.5/5.6, including a separate FOV for the first-person primitives and an anti-clipping depth scale). Use them if present: render the arms and weapon with their own FOV (default 70°) so they don't distort with the world FOV, and stop the weapon clipping into walls.

### 4.11.3 Weapon wall collision

When the weapon's muzzle would clip into a wall in front of the character (a trace from the weapon's grip to its muzzle tip plus 10 cm), the weapon is pulled back and lowered ("high ready" or "low ready" pose), and you can't fire until it clears. This is standard in serious shooters and stops players shooting through thin walls with their muzzle inside them.

### 4.11.4 Line of sight fairness

Third-person peeking, where the camera sees around a corner the character can't, is the classic problem. The mitigation set:

1. Short shoulder offset (55 cm) and a short arm (160 cm), so the camera can't see far past the character's own sightline.
2. Server-side net relevancy filtering for enemy players: a player's character is only replicated to an enemy client if there's a plausible line of sight from the enemy's character head (not camera) to any of six points on the player's body, or they're within 20 m, or they've made a sound audible to that client in the last 3 seconds. This is a custom relevancy check (`IsNetRelevantFor` override, with traces throttled to every 0.2 s per pair and cached). It means a third-person camera peeking around a corner sees an empty street, because the server never sent the enemy's position. This is the most important anti-cheese system in the game and also doubles as anti-wallhack. Part 18 has the network implementation.
3. Footsteps and sounds still replicate independently (through a sound event system with its own range rules), so players can hear what they can't see.
4. When a player's character is relevant again, it fades in over 0.1 s rather than popping.

Rules: relevancy distance hard cap 1,200 m for players. Hollows use standard distance-based relevancy (they're numerous, and we can't afford LOS checks for every Hollow-player pair).

### 4.11.5 First-person mode option

In Settings > Gameplay > Camera Mode: Third Person (default) or First Person. In First Person mode, the camera is the first-person camera at all times, hip-fire happens in first person, and the third-person camera is used only for emotes and death cams. Everything else works the same.

## 4.12 INTERACTION

Interaction is a single system, used for doors, containers, items, ladders, boats, revives, extraction triggers, switches and NPCs.

Detection: every 0.05 s, the client does a sphere trace (radius 8 cm) from the camera along the view direction, clamped to 2.4 m from the character's head (not the camera), plus an overlap check for interactables within 1.5 m of the character. The best candidate (closest to screen center within a 15° cone, weighted by distance) becomes the focused interactable. The focused interactable shows a prompt on the HUD (part 24).

Interactions are actor components (`USMInteractableComponent`) with a definition: label, icon, hold duration (0 for tap), required tags (e.g. "has key X"), and whether it requires the character to stop moving. The server validates every interaction (distance from the character's head to the interactable under 2.6 m, line of sight, not dead, not downed unless allowed).

Doors: hinged doors open away from the player at 1.4 s full swing, can be opened slowly (hold Interact for a slow, quiet open at 0.25 the speed, which is quiet), kicked open (melee key while facing a closed door: loud, fast, can stagger someone on the other side), and locked (key or lockpick required). Doors are physics-free kinematic actors with a replicated angle. They block projectiles (wood doors are penetrable by rifle rounds, part 05's penetration table).

## 4.13 MELEE

Every character has a salvager's knife in a fixed slot. Melee key: quick stab (0.4 s, 60 damage to the zone hit, 1.2 m range, cone trace). Hold melee: heavy swing (0.9 s, 120 damage, 1.4 m, stagger). Knife does 3x damage to downed players and is the only silent kill (no gunshot sound). Melee against Hollows staggers small ones. Melee costs stamina (4.3).

Weapon bash (melee while holding a long gun): 50 damage, 1.3 m, staggers.

## 4.14 THROWABLES

Grenades and other throwables (part 12) are held in quick slots (4 and 5 by default). Pressing the key equips; holding fire cooks (for frag grenades, 4.5 second fuse; cooking shows a subtle timer on the HUD); releasing throws. Right-click toggles overhand (long, 28 m) or underhand (short, 10 m, rolling). A predicted arc is shown while holding (thin dotted line with a landing marker), toggleable in settings. Throws inherit 50% of character velocity. Throwable projectiles are server-authoritative with client-predicted visuals.

## 4.15 NETWORKING THE MOVEMENT

Everything in this part replicates through CMC's prediction model. The rules for implementation:

Every custom state that changes movement must be in the saved move: gait, stance, aim state, lean value, mantle target and start time, ladder ID, wading flag, weight bracket (as a quantized byte, so the server can verify speed limits), and injury-speed flags.

Stamina is a GAS attribute with prediction keys, so sprinting on the client predicts stamina drain, and the server reconciles. When the server says you're out of stamina and the client thought otherwise, the client corrects within one round trip.

Speed limits are enforced on the server. If a client sends moves exceeding its permitted speed (based on the server's own state for gait, weight and injuries) by more than 3%, the server corrects. Repeated large corrections are logged to telemetry as possible speed hacking (part 21).

Network smoothing for simulated proxies: use CMC's exponential smoothing with a smoothing time of 0.1 s for location and 0.05 s for rotation. For mantles and vaults, simulated proxies play the same curve from the replicated start time and target, rather than smoothing between replicated positions, so they look correct even at 120 ms ping.

Movement network frequency: 60 Hz client move sends (CMC's default with combined moves), server net update for player characters 60 Hz, with priority boosts for nearby players.

Test it with Unreal's network emulation (part 37): every movement state must look correct for the simulated proxy at 150 ms latency with 2% packet loss, and must cause no more than one visible correction per minute for the autonomous proxy at 100 ms latency.

## 4.16 FOOTSTEPS AND MOVEMENT SOUND

Footsteps are the most important audio cue in the genre. Each foot plant (driven by animation notifies, and for simulated proxies, also from movement distance as a fallback) triggers a footstep event with:

Surface type (from the physical material of the ground: Concrete, Asphalt, Wood, Metal Grate, Metal Sheet, Gravel, Grass, Mud, Sand, Rock, Carpet, Tile, Glass shards, Shallow Water, Deep Water), gait, stance, weight bracket and injury state.

Loudness rules (radius at which the footstep is audible to other players, before occlusion):

| Gait | Radius |
|---|---|
| Walk, crouch | 6 m |
| Walk | 12 m |
| Jog, crouch | 15 m |
| Jog | 28 m |
| Sprint | 45 m |
| Any, Overloaded | +25% |
| Wading | +40% |
| Metal surface | +30% |
| Glass shards | +50% |
| Carpet or grass | -25% |
| During Surge rain | -40% (rain masks footsteps) |

Footsteps are sent as unreliable multicast sound events only to clients within the audible radius (from the server), so players outside the radius don't get the information at all. Part 28 has the sound design.

Gear rattle: running with a heavy backpack or full rig adds a gear rattle layer. Armor adds a plate-carrier creak. These are small, layered, and important for "I can hear someone with heavy gear upstairs".

## 4.17 ACCEPTANCE TESTS FOR MOVEMENT

Movement is done when all of these pass in automated functional tests (part 37) and in a manual playtest with two players at 120 ms simulated latency:

The player can jog the full length of the Harbourside high street (about 280 m) in 78 ± 2 seconds.

Mantle succeeds on every test ledge in the movement test map (heights 0.5, 0.8, 1.1, 1.4, 1.7, 2.0, 2.1 m), and fails on 2.2 m.

Vault succeeds on every test fence (0.6 to 1.2 m tall, 0.1 to 0.6 m thick).

Prone is blocked when the body box would intersect a wall, in every orientation tested at 15° steps.

Wading speeds match the table within 3% at each depth band.

A character carrying 50 kg sinks in deep water; dropping the backpack (20 kg) lets them float.

Lean stops at walls and never puts the head through geometry.

Simulated proxies at 150 ms latency show no visible teleports during sprint, mantle, vault, ladder or prone.

No movement state allows the camera or the head to see through a wall at any point.

---

End of part 04. Next: `05_COMBAT_BALLISTICS_DAMAGE.md`.
