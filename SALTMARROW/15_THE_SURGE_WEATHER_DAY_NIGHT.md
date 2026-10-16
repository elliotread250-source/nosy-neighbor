# SALTMARROW: PART 15, THE SURGE, WATER, WEATHER AND DAY/NIGHT

Pillar 3 says the tide decides. This part is the simulation and presentation of the Surge: the storm front, the rising water, the weather, the lighting change, and the time of day. It's one coordinated system owned by a single world subsystem (`USMSurgeSubsystem`), driven by the raid clock and the raid seed, so every client computes the same weather from the same inputs and only a handful of values ever need replicating.

---

## 15.1 THE DESIGN GOAL

Players should experience the Surge as a slow-building dread followed by an overwhelming natural event. Each wave is a beat in the raid's story: warning, arrival, peak, lull, aftermath. It must look and sound spectacular, because it's our signature, and it must be readable, because players make life-or-death decisions about it. And it must be cheap enough to run on a host machine alongside 12 players and 60 Hollows.

## 15.2 THE RAID CLOCK AND THE SURGE SCHEDULE

The raid clock (`RaidTime`, seconds since raid start) is authoritative on the server and replicated once at join, then kept in sync on clients using the server world time (Unreal's `GetServerWorldTimeSeconds` on the GameState). Everything in the Surge is a function of `RaidTime` and the seed.

At raid start, the server generates the `FSMSurgeSchedule` from the seed:

```cpp
USTRUCT() struct FSMSurgeWave
{
    float WarningTime;      // when the sky starts to change
    float ArrivalTime;      // when the front reaches the map edge on the storm side
    float PeakTime;         // when water reaches max for this wave at the most exposed zone
    float LullTime;         // when the storm eases
    float PeakWaterLevel;   // meters above datum at the most exposed point (1.2, 2.4, 3.8 for waves 1-3)
    float RecedeLevel;      // level the water drops back to in the lull
    float FrontSpeed;       // m/s the front crosses the map
    float Intensity;        // 0..1 drives rain, wind, lightning, darkness
};

USTRUCT() struct FSMSurgeSchedule
{
    int32 Seed;
    uint8 Direction;        // 0..7 (N, NE, E, SE, S, SW, W, NW): where the storm comes FROM
    TArray<FSMSurgeWave> Waves; // 3 waves in Standard, 3 faster in Night, 1 in Skirmish (as a closing zone)
    float BaseWindSpeed;
};
```

The schedule timings follow part 03's table, jittered ±60 s per phase by the seed, constrained so phases never overlap and wave 3's peak is always before 25:00.

Only `Seed` and `Direction` replicate (and the schedule's version). Clients regenerate the identical schedule locally with the same deterministic generator. Write a unit test that the generator produces identical schedules on different platforms and builds (no floating point drift from platform math: use integer-based random with `FRandomStream` and avoid transcendental functions in the generation).

Admin override (for testing and for Practice mode): a console command `sm.surge.set <direction> <timescale>` and `sm.surge.skipto <phase>`.

## 15.3 THE STORM FRONT

The storm front is a line (perpendicular to the storm's travel direction) that sweeps across the map from the storm side at `FrontSpeed` (about 7 m/s, so it crosses the 1.4 km map in about 3 minutes). Its position at any time is a simple function: `FrontDistance(t) = (t - ArrivalTime) × FrontSpeed`, measured from the map edge on the storm side.

For any world location, "how far behind the front" it is gives the local storm intensity: ahead of the front (not yet reached): calm-ish, with darkening sky; within 150 m behind the front: the wall (maximum intensity: torrential rain, gale, lightning); beyond 150 m behind: the main storm (high intensity); after the lull time: easing.

The local intensity drives everything: rain amount, wind speed, fog density, lightning frequency, darkness, the sound mix, Hollow spawn rates and the flood timing per zone.

### 15.3.1 The storm wall visual

From outside the storm (ahead of the front), players see the storm wall: a towering, curved curtain of dark cloud and rain from the sea surface to the cloud base and above, about 600 m tall, slightly curved, with lightning flickering inside it and a sickly green glow at its base where it meets the sea. It's visible from 2 km away. This is the hero visual of the game.

How to build it: a set of large curved translucent meshes (a "curtain" mesh, several layers at different distances behind the front line) with a volumetric-looking material (scrolling noise, depth fade, distance fade, vertical gradient from dense dark at the base to a lighter, wispier top, and an emissive green tint near the water that pulses subtly). Combined with the Volumetric Clouds component (UE's sky atmosphere and volumetric cloud system) whose cloud coverage map is shifted toward the storm side over time (a custom weather map texture rendered from the storm front position each frame, into a render target that drives the cloud material's coverage). Plus Niagara rain curtains: GPU sprite rain streaks in a band along the front, and a heavy local rain system around each player (15.5). Plus lightning (15.6).

Don't use full volumetric fog for the wall (too expensive across 2 km). The curtain meshes plus volumetric clouds plus height fog give the look for a fraction of the cost. Test it at Low settings: the wall must still read as a wall on Low (the curtain meshes are the core and they're cheap).

### 15.3.2 The sky color change

Calm sky: overcast North Atlantic. Cool grey-blue, soft light, a bright patch where the sun is behind clouds, occasional breaks with sunbeams.

Warning (from `WarningTime` to `ArrivalTime`): the sky on the storm side darkens and takes on a bruised green-yellow tint. The sun (or moon) dims. Wind picks up. Gulls fly away from the storm side.

In the storm: the sky goes near-black with a green cast. Ambient light drops to about 15% of calm (enough to see, not enough to see far). The world is lit by lightning flashes, artificial lights and the faint glow of salt crystals.

Final Surge (wave 3): darker still, with a deep teal-green underglow to the clouds, and the "Lantern effect": a faint, slow pulse of light that seems to come from the sea itself (lore: the Marrow's pulse), synced to the deep drone in the music (part 28). Pulse period 6 s.

Implementation: a Post Process Volume (unbound) with blendable settings, plus Sky Atmosphere and Directional Light parameters, all driven by a single `WeatherState` curve set (15.7). Color grading LUTs for each state: Calm, Warning, Storm, Final, Lull, and Night variants. Blend between LUTs by weight. Exposure: lock auto-exposure range so the storm actually gets dark (players should feel it), with a minimum EV that keeps gameplay readable (part 25).

## 15.4 THE WATER: RISING AND FALLING

### 15.4.1 The water model

The sea is the UE Water plugin's ocean body (Gerstner waves, part 26). The harbor basin, the flooded streets and the flooded interiors are "zone water": flat water planes per flood zone (part 14), each with a height that changes over time.

Zone water height for zone Z at time t:

```
H_Z(t) = Datum + Tide(t) + Σ_waves SurgeContribution(Z, wave, t)
SurgeContribution = PeakWaterLevel_wave × Exposure_Z[Direction] × Envelope(t - (ArrivalTime_wave + Delay_Z[Direction]))
Envelope(τ): 0 for τ<0; smoothstep rise to 1 over RiseDuration (90 s, 120 s for wave 3); hold until LullTime;
             then ease down to (RecedeLevel/PeakWaterLevel) over 120 s; hold until next wave.
Tide(t): a slow rise of +0.3 m over the whole raid (the natural tide coming in under the storm).
```

`Exposure_Z` and `Delay_Z` come from the zone's flood profile (part 14.10). Waves stack: wave 2 starts from wave 1's recede level.

Clamp: zone water can never exceed the zone's `MaxFloodHeight` (a per-zone cap set so the design intent holds: Kirkhill zones have 0, the High Street's east end caps at 7.2 m).

The ocean body's base height also rises: ocean sea level = Datum + Tide(t) + the average of the coastal zones' surge contributions. That keeps the sea and the flooded harbor at consistent levels.

### 15.4.2 Representing zone water in the world

Each flood zone has a `ASMFloodVolume` actor: a box (or convex shape, for irregular zones) defining the zone's extent, with a water surface mesh at its top that moves up and down with `H_Z(t)`. The surface mesh is a flat grid (or a custom shape matching the zone's footprint, generated in the editor by the map authoring toolset from the nav mesh outline at that elevation range) with the "flood water" material (part 26: murky, foamy, carrying debris, with flow direction and ripples). Inside buildings, the same flood volume extends through the interior, so interior water rises at the same rate (interiors are part of their zone).

Underwater rendering: when the camera is below a flood surface or the ocean surface, apply the underwater post process (part 26: murky green-brown, short visibility, caustics, particles, muffled audio).

Physics: the flood volumes are also physics volumes (or water bodies, if we use the Water plugin's custom water body type for flood zones: evaluate whether a "Water Body Custom" with a dynamic height works in the installed version; if yes, use it, because then buoyancy, swimming and splashes come for free; if not, use our own volume with a `UPhysicsVolume` subclass marked as water volume, which CMC understands for swimming). Floating physics objects (crates, bodies, flotsam, boats) use the Water plugin's buoyancy component against both the ocean and the flood volumes.

### 15.4.3 Flooding interiors convincingly

When water rises into a building, it should feel like it's coming in: water should appear to pour under doors and through windows before the interior level catches up. Cheap trick: interior flood surfaces lag the exterior by 10 to 30 s (per building, a `FloodLag` value), and while the exterior is higher, spawn "water ingress" VFX at the building's door and window openings (Niagara water sheets spilling inward, foam, a rushing sound). When the exterior level drops below the interior, the interior drains through the same openings with outflow VFX. Basements flood faster (they have no lag and gain +1 m relative to ground floor).

### 15.4.4 Currents

During the rise and the recede, flooded streets have currents (part 04): a flow vector per zone that points inland during the rise and seaward during the recede, with a magnitude proportional to the rate of level change (up to 2 m/s at the peak of a wave 3 rise in narrow wynds). Narrow channels (wynds, gaps between buildings) multiply flow ×1.5. The flood water material scrolls in the flow direction, and floating debris drifts with it. Currents push swimming and wading players and AI.

### 15.4.5 Waves and surf

On the open coast and the breakwaters, during a Surge, big waves break: a wave event every 8 to 20 s at "surf points" (the breakwater, the sea wall on Shore Street, the caravan park beach, the Teeth). Each wave is a Niagara system (a towering spray burst and a sheet of white water) plus a gameplay effect: a box volume that sweeps over the surf point, knocking players over (a stagger and a push) and dealing no damage, but pushing them toward the water. Warnings: a deep rumble and a visible rising swell 2 s before.

## 15.5 RAIN, WIND AND FOG

### 15.5.1 Rain

Rain amount: 0 (dry) to 1 (torrential), from the weather state and local storm intensity.

Visuals: a Niagara GPU particle system attached to the camera (not the character), spawning rain streaks in a box around the camera (30 m × 30 m × 20 m), with depth-buffer collision so rain doesn't fall indoors (use a top-down "rain occlusion" depth capture: a scene capture from above the camera that renders scene depth into a small render target, 256×256 over 60 m, updated every few frames, which the rain particles and the wet surface material sample to know if a location is sheltered). Splashes: a second system spawning splash sprites on surfaces (sampled from the occlusion depth to only splash on exposed surfaces) and ripples on water surfaces (a decal-like ripple texture in the water material, driven by the rain amount).

Wet surfaces: a global material parameter `RainWetness` (0 to 1) that all surface materials read (part 26), modulated by the rain occlusion map so interiors and sheltered areas stay dry. Wetness builds up over 30 s of rain and dries over 180 s. Puddles form in surface depressions (a puddle mask per material, using height maps and a world-space noise).

Rain on the camera lens: when the camera is in rain and facing up into it, raindrop sprites on the screen (a screen-space post process overlay, subtle, togglable in settings). Rain on optics: rain drops on the scope's lens material during rain (part 26).

Rain on players: characters exposed to rain become wet (part 10's appearance wetness).

Rain and sound: rain masks sound (part 28): footstep and quiet sound radii are reduced by up to 40% at full rain, as part 04 says.

### 15.5.2 Wind

A global wind vector (direction from the Surge direction during storms, from a seeded prevailing direction otherwise; speed 4 to 8 m/s calm, 15 to 25 m/s in the storm, gusting). Use the `WindDirectionalSource` actor to drive foliage and cloth, plus a material parameter collection for foliage wind in materials (grass, heather, trees, washing lines, flags, tarps, nets). Wind affects bullets (part 05), rain angle, smoke and fire VFX direction, flares (drifting), and sound (the wind's howl, part 28).

### 15.5.3 Fog and visibility

Exponential Height Fog: always on, with density driven by the weather state. Calm: light sea haze (visibility several km). Storm: heavy (visibility 150 to 300 m). Fog Bank events (15.8): thick, low fog (visibility 40 m). Volumetric fog: on Medium and above, for light shafts from flashlights, lighthouse beams, lightning and windows.

Visibility caps: at high fog, the "fog visibility" also feeds AI perception (part 13) so AI can't see through fog either.

## 15.6 LIGHTNING AND THUNDER

Lightning strikes during storms, more often near the front. Each strike: a bolt mesh (a branching emissive ribbon generated procedurally by Niagara or a set of pre-made bolt meshes), a flash (a directional light intensity spike, a sky light boost, and a brief exposure change), and thunder delayed by distance (343 m/s: a strike 1 km away is heard 3 s later; part 28 has the thunder sound design).

Gameplay: lightning flashes briefly light the world, which reveals players in the dark (a real tactic: wait for the flash). Lightning can strike tall objects (the wind turbines, the church tower, the cannery chimney, the radome on LISTENER, the lighthouse) at a higher rate: anyone standing on the very top of these (a volume at the top) during a Surge has a 2% chance per strike near them of being struck (200 damage spread, a burn, a stun, and an achievement "Conductor"). Warn players with a crackling static sound and hair-raising (a subtle VFX on the character) before a strike there.

Lightning frequency: wave 1: one strike per 12 s on average, wave 2: per 7 s, wave 3: per 3 s. The strike locations are deterministic (seeded) so all clients see the same strikes (replicate nothing; compute from the seed and time).

## 15.7 THE WEATHER STATE

All of the above is driven by one struct, computed per frame from the schedule, time and location:

```cpp
USTRUCT() struct FSMWeatherState
{
    float StormIntensity;   // 0..1 global, from the schedule phase
    float LocalIntensity;   // 0..1 at the camera/character location, from front distance
    float Rain;             // 0..1
    float WindSpeed;        // m/s
    FVector WindDirection;
    float FogDensity;
    float CloudCoverage;
    float Darkness;         // 0..1 how much to darken ambient
    float GreenTint;        // 0..1 storm color
    float LanternPulse;     // 0..1, final Surge only
    float LightningRate;    // strikes per second
    float Wetness;          // accumulated
};
```

Each value comes from a curve asset keyed by phase progress, so you can tune the whole Surge look in curve editors without touching code. Clients compute it locally. The server computes it too (for gameplay: AI perception, sound masking, bullets).

## 15.8 WEATHER VARIANTS AND EVENTS

Besides the Surge, each raid has a base weather from the seed:

Overcast (50%): the default look.
Bright Spells (15%): sun breaking through, long shadows, sparkles on the water; visibility excellent (sniper day).
Drizzle (20%): constant light rain, low clouds.
Fog Bank (15%): thick sea fog rolling in from the sea at a random time in the Calm phase, lasting 4 minutes, visibility 40 m, eerie. The foghorn on Gannet Rock sounds every 30 s during it.

Events (seeded, at most 2 per raid):

Salt Bloom: after a wave recedes, one zone has an unusually large salt deposit (Sparks announces it on the radio: part 02). Draws players together.
Blackout: the power station's generators fail (or the Wardens shut them down) and all the town's flickering lights go out. Night raids only.
Distress Call: a flare goes up from a random location (a pre-placed event spot with a body and a supply drop), visible across the map. It's bait and reward at once.
The Lighthouse Wakes: during a Surge, the Gannet Rock lighthouse lamp turns on by itself and sweeps (lore: Old Cormac's solar rig), lighting the harbor in long arcs. Players caught in the beam are visible.
Gull Storm: a huge flock of gulls takes off from one location (where a player fired), circling and screaming. It's a free tell for everyone.

## 15.9 DAY AND NIGHT

Standard raids happen at a time of day picked by the seed from the afternoon and early evening: start times between 13:00 and 17:30 in-fiction, and the 28 minutes of raid time compress 1.5 hours of in-fiction time (the sun visibly moves; a raid starting at 17:00 ends at dusk). Night raids start at 22:00 and run to 23:30.

Time of day drives the directional light angle and color (sun or moon), the sky atmosphere, the skylight (with real-time capture on High+, a cubemap blend on Low/Medium), streetlights and windows (a few lights still work in the town: powered by the power station intermittently; lights flicker in a slow pattern and go out in the Blackout event), and the stars (a star field on clear patches at night).

The latitude: high north (about 60° N), so in the afternoon the sun is low (15° to 25° elevation), giving long shadows and a warm, low light that contrasts with the cold overcast. At night, the moon (seeded phase) provides most of the light on clear nights; on overcast nights, it's dark, and flashlights matter.

Night readability rules: the night must be dark enough that flashlights, the lighthouse and fires feel essential, and bright enough that players without night vision can still navigate by silhouette and moonlight. Target: average scene luminance at night 0.03 to 0.06 cd/m² before exposure, with an exposure clamp so the final image has silhouettes readable against the sky. Part 25 has the exposure settings. Test with the "silhouette test": a player standing 30 m away at night on a street must be visible against the background on a calibrated display at default brightness.

## 15.10 THE SURGE AND THE AI

The Surge subsystem broadcasts events: `OnWarning(wave)`, `OnArrival(wave)`, `OnFrontPassed(location, wave)` (per zone, when the front crosses it), `OnZoneFlooded(zone, level)`, `OnPeak(wave)`, `OnLull(wave)`, `OnRecede(zone)`. The AI director (part 13) uses them to spawn waves at tide spawn points along the front, the loot system (part 12) uses `OnRecede` to spawn salt deposits and flotsam, the extraction system (part 16) uses them to open and close extractions, and the radio (Sparks) uses them to trigger broadcasts.

## 15.11 THE SURGE AND THE PLAYER

What the player feels in the body: wind pushes the character slightly (a very small lateral force in exposed areas during storms: 0.2 m/s² at 25 m/s wind, only noticeable when standing still on the breakwater; don't make movement frustrating), rain and darkness reduce visibility, sounds change (part 28), cold builds when wet outside in the storm (part 05), and the camera shakes gently during peaks (configurable).

What the HUD shows: a small weather indicator near the compass (part 24) with the current phase and an arrow showing the storm's direction, plus a countdown to the next wave once the warning starts ("SURGE 2: 1:12"). Players with a Barometer item get the countdown from the start of the raid (and the pressure graph). Players with nothing see the countdown only after the warning. Sparks's broadcasts add context.

## 15.12 PERFORMANCE

The Surge must cost under 1.5 ms of GPU at peak on Medium on the reference GPU (RTX 3060 Laptop), over the calm baseline. Budget: rain particles (camera-attached, 8,000 particles on Medium, 4,000 on Low, 16,000 on Epic), the storm wall (4 to 6 translucent layers, depth-sorted, at low resolution with the translucency separate pass at half resolution), volumetric clouds (Medium preset), lightning (one light spike at a time, no shadows from lightning on Low/Medium).

On the CPU, the Surge's weather state computation is trivial. The zone water heights update every frame for the near zones and every 0.5 s for distant zones. Flood volume surface mesh movement is a transform change (cheap).

## 15.13 SURGE ACCEPTANCE TESTS

The same seed and direction produce the same schedule, water levels and lightning strikes on two clients (determinism test, compare at 20 sample times).

Every zone reaches its designed peak level per wave within 0.05 m.

Interiors flood after the exterior with the configured lag, and ingress VFX play.

Players and AI in a flooded zone get the correct movement mode for the depth (wading, swimming).

The storm wall is visible from the church at all 8 directions and reads as a wall at Low settings.

Night silhouette test passes.

GPU cost at peak Surge on Medium stays within budget on the reference machine.

---

End of part 15. Next: `16_BOATS_AND_EXTRACTION.md`.
