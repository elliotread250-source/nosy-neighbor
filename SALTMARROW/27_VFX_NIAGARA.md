# SALTMARROW: PART 27, VISUAL EFFECTS (NIAGARA)

Effects sell impact. A gunshot that doesn't throw a flash, a puff of gas and a spray of stone dust off the wall it hits is a gunshot that doesn't land. This part lists every effect family, its components, its budget and its rules. All effects are Niagara systems. All of them have scalability settings. None of them affects gameplay state except where noted (smoke, which blocks vision and AI sight, is a gameplay effect with its own rules).

---

## 27.1 RULES

Every system has an effect type asset (`UNiagaraEffectType`) with scalability and significance settings: max distance, max instances, cull behavior and budget scaling per quality level. Effects for the local player's weapon always play at full quality; others' effects scale by distance and quality.

Pool everything (Niagara component pooling with `ENCPoolMethod::AutoRelease`) for frequently spawned effects (impacts, muzzle flashes, shell casings, footsteps in water).

GPU simulation for high counts (rain, sparks showers, debris clouds, dust), CPU for small systems that need collision events or exact positions (shell casings, blood droplets that leave decals).

Lighting: effects that emit light (muzzle flashes, explosions, flares, fires, lightning) use Niagara light renderers sparingly: no shadows, short radius, and a cap of 6 effect lights alive at once near the camera on Medium.

Overdraw: translucent effects are the main GPU risk. Keep big smoke and dust effects at reduced resolution (separate translucency), use soft particles, cap particle screen size (sprites larger than 40% of the screen fade out), and test overdraw with the shader complexity view.

Determinism: cosmetic effects don't need to be deterministic across clients. Gameplay-relevant effects (smoke clouds, fire areas) are driven by replicated gameplay actors whose shape is deterministic; the visual is cosmetic.

## 27.2 WEAPON EFFECTS

### 27.2.1 Muzzle flash

Per muzzle device type, not per weapon: Bare muzzle, Birdcage flash hider, Prong flash hider, Muzzle brake (side-venting jets), Compensator (upward jets), Suppressed (a tiny puff and a brief gas glow at night), Shotgun (big round bloom and burning powder particles), Revolver (cylinder gap flash on the sides as well as the muzzle), Sawn-off (a huge fireball), Open-bolt SMG (a little extra ejection port flash), and the Leviathan brake (enormous side jets and a dust kick on the ground below when prone).

Components: a core flash (a few bright sprites with a randomized flipbook, 1 to 2 frames long at 60 fps), petals or jets (shaped by the device: mesh-based cones or stretched sprites), a gas puff (translucent smoke that lingers 0.3 to 1.5 s, more for unsuppressed and more in humid air), sparks (a few for rifles, more for steel-core ammo), a heat shimmer (distortion sprite), and a light flash (a short-lived point light, 0.03 s, only for the local player and the nearest few others).

Day vs night: flashes are much more visible at night (emissive at full) and smaller by day (scale the core emissive with scene exposure so they're not invisible by day nor blinding at night).

First person vs third person: the first-person flash is smaller and placed to avoid blocking the sight picture; the third-person version (seen by others) is full size. The muzzle flash visibility seen by others matters for gameplay (flash hiders reduce it), so the third-person version's size and brightness scale with the weapon config's flash stat (part 08).

Prone and dust: firing while prone on dirt, sand or gravel kicks up a dust cloud in front of the muzzle (more with brakes), visible to enemies. That's a real-world tell, and it's a good reason to use a flash hider prone.

### 27.2.2 Ejection

Shell casings: per caliber (9mm, .45, 5.56, 5.45, 7.62x39, 7.62x51, 7.62x54R, .338, 12 gauge shells in red, green and black, .45-70, .357 stay in the revolver until reloaded), as CPU mesh particles ejected from the ejection port socket with the weapon's ejection direction and velocity (randomized), spinning, bouncing with collision (2 bounces then rest), with a sound on each bounce by surface (part 28). Lifetime 8 s locally, 3 s for others' weapons, capped at 60 casings in the world near the camera. The Albatross's fluted-chamber brass has soot streaks.

Ejection gas: a small puff at the ejection port, more visible on suppressed DI rifles (gas blowback).

Links: belt-fed weapons eject links as well as casings.

Magazines dropped in fast reloads: real physics actors (they're items, picked up later), not effects.

Bolt and lever smoke: after rapid fire, a wisp of smoke from the ejection port and the muzzle for 1 to 3 s.

### 27.2.3 Tracers

Tracer rounds (ammo with the tracer flag) render a bright streak along the projectile's path: a ribbon or a stretched sprite following the cosmetic projectile, with a warm red-orange core (or green for the VMW tracer ammo), visible from far away, burning out after 800 m. Non-tracer rounds show a faint "heat trail" in ADS for the local shooter only (a barely visible streak that helps players read their drop at long range; Practice mode and Settings: "Show bullet trail for my shots": On by default because it teaches drop). Other players never see non-tracer trails.

### 27.2.4 Barrel heat

LMG barrels and suppressors: heat shimmer above (distortion), smoke wisps when hot, steam when rain hits a hot barrel (a lovely detail: small steam puffs where raindrops land on a barrel above 50% heat), and the emissive glow is in the material (part 26).

## 27.3 IMPACT EFFECTS

Per physical material, per impact type (bullet small, bullet large, buckshot, explosion fragment, melee), with variants for entry and exit (penetration):

| Surface | Bullet impact |
|---|---|
| Concrete, stone, brick | Dust puff (grey-beige), stone chips (mesh particles), sparks for steel-core rounds, a bullet hole decal (crater with a dust ring) |
| Plaster, drywall | White dust puff, crumbs, a clean hole decal, a puff of dust on the far side if penetrated |
| Wood | Splinters (mesh particles), sawdust puff, a splintered hole decal |
| Metal (sheet) | Sparks (bright, many), a small smoke puff, a ricochet spark streak if ricocheted, a punched hole decal with bright edges |
| Metal (thick) | Sparks, a lead splash decal (grey smudge), no penetration |
| Glass | Glass shards (mesh particles), a crack decal or a shatter event (part 26) |
| Water | A splash column (taller for bigger rounds), ripple rings, spray; skip splashes for ricochets (part 05) |
| Mud, earth | Dirt clods, a dark splash |
| Sand, shingle | A sand spray, pebbles for shingle |
| Grass, heather | A small dirt puff and grass clippings |
| Flesh (player, Warden) | Blood spray (direction from the hit normal and the projectile direction), droplets that leave small blood decals on nearby surfaces, a blood mist for high damage; exit wounds for penetrations; armor-stopped hits instead show a fabric puff and plate spark (so the shooter can see the armor stopped it) |
| Hollow | Not blood: a burst of salt-white crystalline dust and grey-green fluid, with crystal shards for salt growth hits (weak point hits throw bright salt sparks, a great feedback for hitting weak points) |
| Car | Sheet metal sparks; tires deflate with a hiss and air puff; windows shatter |
| Fabric (sandbags, sofas, mattresses) | Stuffing puff, fabric fibers |
| Paper (books, filing cabinets) | Paper confetti |
| Fuel drum | Sparks, and a leak (a fuel stream particle and a pooling decal) |
| Fish crates, nets | Fish scale glitter and water drops (because why not) |

Decals: bullet hole decals (DBuffer decals) with per-surface materials, pooled with a cap (200 near the camera; older ones fade). Exit holes on the far side of penetrated surfaces.

Impact effects for other players' shots play only for clients within 150 m (part 05's impact batch relevancy).

## 27.4 EXPLOSIONS

Per explosive type: frag grenade (a fast bright flash, a shockwave ring on the ground (a distortion ring sprite), dirt or debris by surface, a dark smoke column that lingers 8 s, sparks, fragments as small fast streaks), impact grenade (similar, smaller), flashbang (an intense white flash with a lens flare, no smoke except a small puff), smoke grenade (27.6), incendiary (a burst of fire that spreads into a burning area, 27.7), 40mm HE (like frag, bigger), fuel drum (a fireball rising with a mushroom of black smoke and burning debris), Bloat burst (a spray of green-grey fluid and salt crystals with a lingering pale mist that applies Salt Sickness: the mist is a gameplay area, a sphere of 3 m lasting 6 s, shown by the effect).

Explosions in water: a water column (a huge splash), a mist cloud, ripple rings, and stunned fish floating up (a dark comedy detail, cheap with a few mesh particles).

Camera effects for nearby explosions: camera shake (part 04), a brief dirt and dust overlay on the screen (optional), a blur, and the tinnitus audio (part 28).

## 27.5 CHARACTER AND MOVEMENT EFFECTS

Footstep effects by surface: dust puffs on dry dirt and gravel, splashes in puddles and shallow water, mud splats, sand kicks, leaf scatter in gardens, glass crunch sparkle on broken glass. Small, cheap, pooled, and only within 30 m.

Water movement: wading wakes (a V-shaped ripple and foam around the legs, scaled with speed and depth), splashing (droplets) when running in shallow water, swimming strokes (splashes on each stroke), entering water (a splash scaled by fall speed: a cannonball for big drops), exiting water (dripping water from the character for 20 s: a drip particle system on the character's lower body and gear, combined with the material wetness).

Breath: visible breath fog in cold weather and at night (a small puff from the mouth on each breath, more when exerted or Cold is high).

Rain on characters: splashes on shoulders, helmets and backpacks when outdoors in heavy rain (a small spawner on upward-facing body parts).

Blood trails: heavily bleeding characters leave blood drip decals every 1.5 m (part 04) and drops on the ground (a gameplay tell, cheap).

Healing: bandage wrapping, injector puffs, pill bottle rattles (sound mostly), a subtle screen effect (part 26) for the user.

Downed: a blood pool decal growing under the character.

Hollow effects: wet dripping constantly (drips from hair, fingers, clothing), salt dust falling off when they move fast, a faint cyan glow particle at the eyes at night (readability), a burst of water when rising from the sea, and the death effect: the salt growths crack and crumble into dust, and the body slumps, with a final exhale of pale mist.

Bosses: the Ferryman's hook chain (a cable with rattling links), the salt armor plates shattering (big crystal debris), the bell ringing (a visible shockwave of sound: a subtle distortion ring); the Lantern Choir's song (a visible sound wave: concentric shimmering rings in the air from their mouths), the pulse (a dark blast wave that extinguishes lights), the rising water.

## 27.6 SMOKE (GAMEPLAY)

Smoke grenades create a smoke cloud that blocks vision for players and AI. It's a gameplay system with a visual, so the cloud's gameplay shape must match what players see.

The gameplay cloud: a set of overlapping spheres (12 to 20) that expand from the grenade's position over 3 s to a total radius of about 8 m, drift with the wind at 20% of wind speed, and dissipate after 40 s (shrinking over the last 10 s). The sphere positions are deterministic from the grenade's position, time and the wind (replicated: the grenade actor's position and detonation time). Line-of-sight checks for AI perception (part 13) and for the player relevancy filter (part 18; smoke counts as blocking for relevancy only if it's dense: the center 70% of each sphere) trace against these spheres.

The visual: a GPU Niagara system rendering dense, lit smoke sprites (lit translucent, with self-shadowing approximations, soft particles, and wind drift) filling the same spheres. On Low, fewer, bigger particles with the same coverage (the visual must block vision as much on Low as on Epic, or Low players would see through smoke: fairness rule. Test it: the "smoke fairness test" renders a smoke cloud on each preset with a target behind it and checks the target's visible pixel count is near zero on all presets).

Thermal optics see through smoke (part 09), which is their main advantage.

Smoke indoors: fills rooms and leaks through doors and windows (the spheres are constrained by world geometry via a few traces when they expand: spheres that would expand into walls stop; spheres near openings push out through them).

## 27.7 FIRE

Fire areas (incendiary grenades, Dragon's Breath, fuel drum explosions, burning cars, flares on the ground, fire barrels, the power station's tank farm): a gameplay volume (damage and Hollow avoidance, part 13) with a visual: flames (flipbook sprites, emissive, with heat distortion), smoke (dark, rising, wind-blown), embers, a flickering light (one per fire area, no shadows except the fire barrels on High), and scorch decals on the ground. Rain reduces fire duration (the fire's lifetime scales down with rain) and adds steam and hissing. Fire can spread to flammable objects (fuel drums, hay bales on crofts, the distillery's spirit stores: a massive fire event when shot).

## 27.8 WORLD AND WEATHER EFFECTS

Rain (part 15): camera rain, splashes, ripples, drips from roof edges and gutters (drip emitters placed along roof edge splines by PCG, active when it's raining: a lovely detail), downpipe outflow, waterfalls where flood water spills between zones.

Wind: blowing litter (paper, leaves, plastic bags) in streets, sea spray off the waves along the coast (more in storms), spindrift off wave crests, flags and tarps (cloth simulation for a few hero flags and tarps; the rest are vertex animated), dust devils on the moor on dry days.

Fog banks: rolling fog (large, slow translucent sprites along the ground and over water, plus the height fog density change).

The Surge: the storm wall (part 15/26), the rain curtains at the front, the green glow at the sea's surface along the front, lightning bolts, debris carried by the wind (leaves, paper, small objects), surf at the coast (wave breaks: big spray bursts at surf points), and the "rising" effect: Hollows emerging from the sea with a burst of water and foam each.

Salt: deposits after the water recedes glitter (sparkle particles), salt harvesting throws crystal dust, Marrow Salt items in the world emit a faint glow mote (rising sparkles), the Heart of the Tide has a stronger aura (a ring of drifting motes and a faint light pulse).

Ambient life: gulls (flocks wheeling over the harbor and the cliffs, landing on roofs and posts, bursting into flight at gunshots: boids-lite in Niagara or a few dozen skeletal mesh birds with a simple flocking component; gulls must react to gunfire as a gameplay tell, part 15), gannets diving into the sea near Gannet Rock, crows on the moor, seals (a few on the Kirk Holm rocks, sliding into the water when disturbed: a tell), fish jumping in the harbor in calm weather, flies near the cannery (gross), sheep on the moor (simple AI wanderers that scatter from gunfire: another tell, and players will shoot them, and that's fine: they're cosmetic and don't drop loot; consider a "Lamb Chop" achievement).

Interiors: dust motes in sunbeams through windows, dripping water from ceilings in flooded buildings, flickering fluorescent tubes (a light function and a buzz), sparks from broken electrical panels.

Light shafts: volumetric light through windows and from the lighthouse beam (volumetric fog on Medium+; on Low, cheap light-shaft cards).

## 27.9 INTERACTION AND UI EFFECTS IN THE WORLD

Loot glints: a very subtle glint on loose items on the ground when within 6 m and in view (optional setting: Off by default in Standard because it reduces the reward of searching, On in Shakedown and for accessibility).

Extraction beacons: the orange strobe and flare at fixed extractions (light and particles), the boat's navigation lights and wake.

Ping markers: a world-space marker (a small diamond with a light column, squad color) where a squadmate pinged.

Downed squadmate: a pulsing marker above them (squad only).

## 27.10 BUDGETS

Per quality level, active particle count caps near the camera (all systems combined): Low 15,000, Medium 40,000, High 80,000, Epic 150,000. GPU time for VFX: Low 0.8 ms, Medium 1.5 ms, High 2.5 ms at peak combat in a Surge (the worst case: rain plus storm plus a firefight with smoke and fire). Measure with Niagara's debugger and the GPU profiler.

## 27.11 VFX ACCEPTANCE TESTS

Every physical material has an impact effect for each impact type (catalog test).

Every muzzle device has a muzzle flash.

The smoke fairness test passes on all presets.

The VFX budget holds in the scripted peak scene (a Surge, 6 players firing, 2 smokes, 1 fire, 20 Hollows rising from the sea).

---

End of part 27. Next: `28_AUDIO.md`.
