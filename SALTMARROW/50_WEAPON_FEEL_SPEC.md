# SALTMARROW: PART 50, THE WEAPON FEEL SPEC

Parts 05 to 09 define what weapons do. This part defines how they feel: the timing of feedback, the recoil patterns shot by shot, the procedural motion values, the camera shake, and the specific character of each weapon in the hand. Feel is the difference between a gun that works and a gun people love. Tune every weapon against this spec in the range, with me, before calling it done (Milestone 1's gate).

---

## 50.1 THE FEEDBACK TIMELINE OF A SHOT

Everything the player perceives from one trigger pull, in order, with target timings from the frame the input arrives (frame 0 at 60 fps = 16.7 ms per frame):

| Time | Event | Notes |
|---|---|---|
| 0 ms | Input registered | Fire on press, never on release (except bolt cycle on release, a setting) |
| 0 ms | Muzzle flash appears (frame 0 or 1) | Never delay the flash: it's the strongest "it fired" signal |
| 0 ms | Gunshot audio starts (transient layer) | Audio latency from input to speaker must be under 30 ms; test with a loopback measurement |
| 0 to 16 ms | Camera kick begins (view recoil) | The camera's upward rotation starts on the same frame |
| 0 to 30 ms | Weapon model kicks back and up | Visual recoil peaks at 30 to 50 ms |
| 16 ms | Shell ejects | Ejection on frame 1 looks right for most actions |
| 30 to 60 ms | Camera kick peaks | Then the recovery spring takes over |
| 50 ms | Gas puff and smoke from the muzzle | |
| Projectile time | Local impact VFX (predicted) | At 30 m with a rifle, about 35 ms |
| RTT + projectile time | Hit marker (server confirmed) | At 60 ms ping and 30 m: about 100 ms. Players accept up to about 150 ms; beyond that, hits feel laggy. Never fake it. |
| 80 to 250 ms | Weapon model returns to rest (spring) | Per weapon class |
| 150 to 600 ms | Echo tail | Per environment class |

The one non-negotiable: frame 0 has flash, sound and camera motion. If anything in the pipeline delays them (waiting for an ability to activate, an RPC to return, an animation to blend in), it's a bug.

## 50.2 RECOIL PATTERN DESIGN

### 50.2.1 The principles

The pattern is learnable: for a given weapon and configuration, the first 10 shots follow roughly the same path, with a small random component. Learning it is the skill, and attachments shrink it.

The first shot is the cleanest (low random component), with a stronger kick (the FirstShotMultiplier, part 05.4.4): tapping is rewarded.

Vertical climb dominates the first third of a spray; horizontal wander grows with shot count; and each weapon family has a signature "pull" direction after a certain shot (the AK pulls right after shot 8, the AR stays straighter but climbs further, the HK roller drifts left lightly).

The pattern is in the data (`RecoilPattern` curve: shot index to a 2D bias vector), not in the code. The random component is a Gaussian on each axis, scaled by `HorizontalRecoil` and by 25% of `VerticalRecoil`.

### 50.2.2 Patterns by family (bias per shot, degrees, vertical then horizontal; positive horizontal is right)

AR family (Mako, Skerry, Corsair, Gannet, Frigate): shots 1 to 5: (1.00, 0.00), (0.95, +0.05), (0.90, +0.08), (0.85, +0.05), (0.80, 0.00). Shots 6 to 12: vertical 0.75 decaying to 0.6, horizontal wanders between -0.15 and +0.15 with a slow sine (period 6 shots). Shots 13 to 30: vertical 0.55, horizontal sine amplitude 0.25. Character: a tall, mostly straight climb with a gentle left-right weave. Easy to learn, hard to perfect.

AK family (Bora, Bora-S, Bora-L, Squall): shots 1 to 4: (1.10, 0.00), (1.05, +0.10), (1.00, +0.15), (0.95, +0.10). Shots 5 to 8: (0.90, -0.05) climbing straight. Shots 9 to 16: (0.70, +0.35): the strong right pull. Shots 17 to 30: (0.55, alternating ±0.30 with a period of 4). Character: a hard initial climb, then the famous pull right, then a chaotic shake. Muscle-memory weapon.

HK roller family (Fulmar, Albatross): shots 1 to 6: (0.90, -0.03) each, very straight. Shots 7 to 20: (0.75, -0.10): a slow drift left. Shots 21 to 30: (0.65, ±0.12). Character: precise and gentle, with a predictable left drift.

Bullpup (Petrel): (0.85 decaying to 0.60, a tight ±0.08 wander). Character: flat and controlled, the easiest rifle to spray, which balances its awkward reload.

PDW (Shearwater): (0.70 decaying to 0.50, ±0.12 random, no pattern bias). Character: a buzzy, low, random vibration.

SMG open bolt (Bilge Pump): (0.90 constant, ±0.40 random). Character: crude, all over the place.

Machine pistol (Hornet): (1.30 per shot at 1,100 RPM, with a strong upward-right drift +0.2 per shot after shot 3). Character: a hose that climbs off target in half a second. Burst it.

LMGs (Grom, Bulwark): shots 1 to 5: (1.0, 0) like a rifle, shots 6 to 100: (0.40, ±0.15) with heat increasing the random component (×1 at 0% heat to ×2 at 70%). Bipod deployed: all values ×0.4. Character: a heavy initial bump, then a long controllable stream when braced, a mess when hip-fired.

Semi-auto and single-shot weapons (pistols, DMRs, shotguns, bolts, levers): no pattern (each shot is a first shot), but rapid follow-up shots inside the recovery time stack residual recoil: the camera won't have returned when you fire again, so spamming a DMR climbs.

### 50.2.3 Recovery

The camera returns toward the original aim point after `RecoilRecoveryDelay` (0.08 to 0.15 s) at `RecoilRecoveryRate` (6 to 14 degrees per second, per class), recovering up to 70% of the accumulated vertical recoil (part 05). Pistols and DMRs recover fast (players reacquire between shots), LMGs slowly.

## 50.3 PROCEDURAL MOTION VALUES

The procedural layer (part 05.4.7) per weapon class, as starting values. All springs are critically damped or slightly underdamped (damping ratio 0.6 to 0.9) so the gun settles with a hint of overshoot.

| Class | Visual kick back (cm) | Visual kick pitch (deg) | Visual roll (deg, random ±) | Spring stiffness | Damping ratio | Sway amplitude (deg, ADS) | Sway frequency (Hz) | Inertia lag (scale) | Move bob (cm) |
|---|---|---|---|---|---|---|---|---|---|
| Pistol | 2.5 | 4.0 | 1.5 | 180 | 0.65 | 0.35 | 0.45 | 0.6 | 0.8 |
| Revolver | 3.5 | 7.0 | 2.0 | 140 | 0.60 | 0.40 | 0.40 | 0.7 | 0.8 |
| SMG | 1.6 | 1.8 | 0.8 | 220 | 0.75 | 0.45 | 0.40 | 0.8 | 1.0 |
| AR / carbine | 2.0 | 2.2 | 0.9 | 200 | 0.75 | 0.55 | 0.35 | 1.0 | 1.2 |
| AK | 2.4 | 2.8 | 1.3 | 180 | 0.70 | 0.60 | 0.35 | 1.1 | 1.3 |
| Bullpup | 1.8 | 1.8 | 0.6 | 210 | 0.80 | 0.50 | 0.35 | 0.85 | 1.1 |
| Battle rifle | 3.0 | 3.2 | 1.2 | 160 | 0.70 | 0.70 | 0.30 | 1.3 | 1.4 |
| DMR | 3.2 | 3.6 | 1.0 | 150 | 0.70 | 0.60 | 0.28 | 1.3 | 1.3 |
| Bolt action | 4.0 | 4.5 | 1.0 | 130 | 0.65 | 0.55 | 0.25 | 1.3 | 1.3 |
| Shotgun pump | 4.5 | 6.0 | 1.8 | 130 | 0.60 | 0.60 | 0.32 | 1.2 | 1.4 |
| Shotgun break | 4.0 | 5.5 | 1.5 | 140 | 0.60 | 0.55 | 0.32 | 1.1 | 1.3 |
| LMG | 2.2 | 1.6 | 1.0 | 170 | 0.80 | 0.95 | 0.25 | 2.0 | 1.8 |
| Launcher | 5.0 | 8.0 | 1.0 | 120 | 0.60 | 0.60 | 0.30 | 1.2 | 1.4 |
| Harpoon | 3.0 | 3.0 | 0.5 | 140 | 0.65 | 0.65 | 0.30 | 1.2 | 1.4 |

These values scale with the weapon configuration: visual kick by the recoil stats' ratio to the stock config, sway by the computed sway amplitude, inertia by the computed turn inertia (part 08.5.4). So a heavy, front-loaded Mako with a long suppressor visibly lags behind fast turns and wanders more in ADS, and a stripped one snaps around. That visible difference is the gunsmith's payoff in the hands.

Breathing in ADS: a slow vertical sine (0.2 Hz, 0.08° amplitude), 2× when exhausted. Holding breath freezes it (part 05).

Idle motion (third person, not aiming): a subtle shift every 6 to 10 s (the character adjusts their grip), 2 to 3 idle variants per weapon class.

Sprint pose: weapon swung low and across the body (rifles), or pistol at the hip, with a sprint-specific bob (heavier, 2.5 cm).

Landing: a downward dip of the weapon (scaled with fall speed) with a spring return.

Collision push (part 04.11.3): when near a wall, the weapon pulls in and tilts up over 0.15 s.

## 50.4 CAMERA SHAKE

Camera shakes (`UCameraShakePattern`, using the Perlin noise pattern and the wave oscillator) are small. They complement view recoil, they don't replace it.

| Event | Rotational amplitude (deg) | Frequency (Hz) | Duration (s) | Notes |
|---|---|---|---|---|
| Fire, pistol | 0.35 | 20 | 0.10 | |
| Fire, SMG | 0.25 | 25 | 0.08 | Per shot, blended in auto |
| Fire, rifle (intermediate) | 0.40 | 22 | 0.10 | |
| Fire, rifle (full power) | 0.70 | 18 | 0.14 | |
| Fire, .338 | 1.40 | 14 | 0.22 | |
| Fire, shotgun | 1.00 | 16 | 0.18 | |
| Fire, LMG | 0.30 | 25 | 0.08 per shot, cumulative to 0.6 | |
| Taking a hit (thorax) | 1.2 | 12 | 0.25 | Plus aim punch |
| Taking a hit (head, helmet stop) | 2.5 | 10 | 0.35 | Plus concussion |
| Explosion near (under 8 m) | 3.0 | 8 | 0.6 | Scales down with distance to 40 m |
| Landing (hard) | 1.5 | 10 | 0.25 | |
| Surge peak (continuous) | 0.15 | 1.5 | continuous | Wind buffeting, outdoors only |
| Wave knockdown | 4.0 | 6 | 0.8 | |
| Lightning strike near | 0.8 | 12 | 0.2 | |

Everything is multiplied by the camera shake setting (part 34). In ADS, firing shakes are halved (the view recoil does the work).

## 50.5 PER-WEAPON CHARACTER NOTES

The one-paragraph "feel brief" for each weapon. When tuning, play it and ask: does it feel like this?

Kestrel 9: the reliable plastic pistol. Snappy, light, a crisp short kick that returns fast. Fast to draw, fast to aim, slightly toy-like next to the Sever. The sound is a sharp, small crack.

Sever: heavy, harsh, old. The kick is bigger and slower to settle; the double-action first shot has a perceptible pause. It feels like iron in the hand.

Harbormaster: the connoisseur's pistol. A satisfying deep push with very little muzzle flip for the power, a great trigger (low first-shot dispersion), slow to reload with 8 rounds. It feels expensive.

Rook: a hand cannon. Huge flip, a long recovery, a deafening boom, and accurate if you take your time. Each shot is an event. The cylinder click on the double-action pull should be audible in first person.

Hornet: a bee in a jar. It climbs off target in half a second on full auto; in bursts, it's lethal. The ripping sound is the identity.

Signal Pistol: a toy that ruins someone's day. A soft pop, a slow glowing projectile you watch fly.

Gannet: the friendly SMG. Light kick, quick ADS, easy to control, slightly springy (the buffer). A great first weapon.

Fulmar: precise, smooth, expensive. Low recoil, tight groups, a tight mechanical sound. The HK slap reload is a joy.

Shearwater: buzzy, futuristic, flat. Low recoil, high speed, through soft armor. The translucent mag lets you watch the rounds go.

Grackle: the slow thumper. Each shot is a deep thud you can count. Very controllable.

Bilge Pump: a lovable disaster. Clattery, inaccurate, sometimes it keeps going. Laugh when it runs away.

Mako: the all-rounder. Moderately snappy, a tall straight climb. Its feel changes the most with attachments (stripped, it's twitchy; built heavy, it's a laser).

Skerry: short, punchy, with a deep report unsuppressed and a soft mechanical clack suppressed with subsonics. The quiet professional's gun.

Bora: brutal and honest. A strong kick, the right pull, a harsh mechanical clatter, and the satisfying rock-in reload. You fight it, and you win.

Bora-S: the Bora's snappier cousin. Less climb, a nasty brake blast you feel in your teeth.

Petrel: flat, accurate, heavy, awkward to reload. The integrated optic makes it a mid-range scalpel.

Corsair: the premium rifle. Smooth piston recoil, tight groups, a deep clean report. It feels like the Mako after a year in the gym.

Albatross: a mule. A huge, punishing kick with a slow return, a violent report, heavy in the hand. Every hit lands like a hammer.

Frigate: the modern battle rifle. Strong but controllable recoil, crisp, clean. The heavy gun that dances when built right.

Skua: the hunter's precision. A firm push straight back, quick to settle, beautiful sound across water.

Drakon: long and whippy. A sharp crack, a noticeable muzzle rise, slow to swing. Reaches far.

Tern: the old farmer's gun. A big push, a deep boom, then the lever clack: deliberate, rhythmic, satisfying.

Fathom: the sniper's friend. A heavy kick that stays straight, a long echo, the smoothest bolt in the game. Calm and deadly.

Old Mariner: a century of attitude. Massive blast, a stiff bolt you can feel through the controller, a long barrel that swings slowly.

Jury: junk with teeth. Crude, loud, squeaky bolt, hits hard. You feel clever using it.

Leviathan: the apex. A crushing, slow kick, a monstrous sound, a scope that shows the other side of the island. Heavy enough to change how you move.

Breaker: the door solver. A big boom, a strong push, and the pump: a two-beat "chk-chk" that must feel heavy and quick.

Selkie: elegant violence. Two big booms, then the break, the ejector pop, the reload. Beautiful in the hands, deadly at a door.

Squall: an AK that shoots buckets. Rapid heavy booms with AK clank. Overwhelming close up.

The Pipe: a terrible idea that works once. A delayed slam, a huge kick, and the possibility of regret.

Coach Gun: working-class double. Rough, loud, honest. The double-trigger "both barrels" shove should knock the camera back hard.

Grom: thunder. A deep rhythmic hammering, controllable on the bipod, terrifying to be in front of.

Bulwark: a fire hose of 5.56. Less punch, more volume, the heat shield glowing.

Bora-L: the cheap machine gun. Feels like a Bora that's had a big lunch.

Thumper: a hollow thoonk and a long wait. The arc of the grenade is the feel.

Whaler: a pneumatic thump, a zipping line, a reel ratchet. Underwater, it's the only friend you have.

## 50.6 THE FEEL REVIEW PROTOCOL

For each weapon, in the range (part 39.5), I'll do this with you watching telemetry: draw and fire 5 shots at the 25 m paper, a full mag spray at the recoil wall, a mag at the 100 m and 300 m steel, a reload of each type, a malfunction clear, a swap to the pistol and back, and two minutes against moving targets. Then in a Practice raid: fight 10 Hollows and 3 Wardens. Questions: does it sound right at every distance? Does the recoil feel like its brief? Is the reload satisfying and the right length? Does it feel different from its neighbors? Would you choose it? Write the answers and the tuning changes in `design/FEEL_LOG.md`. A weapon passes when I say yes to all.

## 50.7 COMMON FEEL BUGS TO WATCH FOR

Input latency: measure from the mouse click to the flash on screen (a high-speed camera or the in-engine latency markers with Reflex). Target under 50 ms at 60 fps with Reflex.

Recoil fighting the player: the recovery spring pulling the view back while the player is also pulling down causes overcompensation. Cap recovery at 70% and make it ease out.

Floaty weapons: too much damping makes guns feel like they're on a spring. Underdamp slightly.

Sound and flash mismatch for remote players: their sound arrives later by distance (part 28.3.1), but their flash appears immediately. That's correct, and it's how players judge distance.

Hit marker lag: if pings are high, hit markers come late. Show the predicted impact VFX immediately (cosmetic) so the shot feels connected even before the marker.

ADS snap: the transition into ADS must be smooth and fast; a jerky camera blend kills the feel. Use an ease-in-out curve over the ADS time, with the first-person transition masked by the weapon coming up into view.

---

End of part 50. Next: `51_THE_HALCYON_SHIP.md`.
