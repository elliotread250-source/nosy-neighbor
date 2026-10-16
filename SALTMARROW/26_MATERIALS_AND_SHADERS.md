# SALTMARROW: PART 26, MATERIALS AND SHADERS

Every surface in the game comes from a small family of master materials, controlled by material instances and a few global Material Parameter Collections. This part specifies each master material, its layers and parameters, the special shaders (water, scopes, salt, storm, rain), and the rules that keep shader compile times and performance under control.

Engine note on Substrate: UE5's Substrate material framework is where Epic is taking UE materials. Use it only if it's marked production-ready in the installed engine and every target preset (including Low on the Steam Deck) runs it at our budgets. Otherwise use the legacy shading models. Record the decision. Everything below is written to work in either.

---

## 26.1 GLOBAL PARAMETERS

`MPC_World` (Material Parameter Collection, updated by the Surge subsystem each frame):

| Parameter | Range | Meaning |
|---|---|---|
| `RainAmount` | 0 to 1 | Current rain at the camera |
| `GlobalWetness` | 0 to 1 | Accumulated wetness of exposed surfaces |
| `PuddleAmount` | 0 to 1 | Puddle fill, lags wetness |
| `WindDirection` | vector | Normalized XY |
| `WindStrength` | 0 to 1 | 0 = 0 m/s, 1 = 30 m/s |
| `StormIntensity` | 0 to 1 | Global storm |
| `GreenTint` | 0 to 1 | Surge color shift for emissive and some materials |
| `LanternPulse` | 0 to 1 | The final Surge pulse |
| `TimeOfDay` | 0 to 24 | For window lights and emissives |
| `RainOcclusionTex` | texture | Top-down depth around the camera (part 15) |
| `RainOcclusionOrigin` | vector | World position of the occlusion capture |
| `RainOcclusionExtent` | float | Size in meters |
| `NightFactor` | 0 to 1 | For readability boosts |
| `CosmeticEmissiveCap` | 0 to 1 | Readability cap for cosmetic emissives (part 10.9) |

`MPC_Flood` (per frame, for the near flood zones): up to 16 zone entries packed into vector parameters (zone ID, current water height, peak height reached this raid, flow direction). Materials look up the nearest zone's values through a per-actor custom primitive data index (each mesh in a flood zone gets its zone index written into Custom Primitive Data slot 0 by the map authoring tool), so a wall knows which water plane it's next to without per-pixel searching.

## 26.2 M_MASTER_SURFACE (ENVIRONMENT)

The workhorse for buildings, props, rocks and ground meshes. A layered material with static switches (to avoid paying for unused layers) and parameters.

Base layer: BaseColor, Normal, ORM (occlusion, roughness, metallic packed), with tiling, a detail normal (a second, high-frequency normal at a different tiling, faded with distance), and optional macro variation (a world-space low-frequency noise multiplying base color by 0.9 to 1.1 to break tiling).

Layer stack, each behind a static switch:

1. Dirt and grime: a world-aligned or vertex-color-driven grime mask (vertex color R painted in the editor, or a curvature/AO-based procedural mask), blending to a grime texture (darker, rougher).

2. Moss and algae: grows on upward-facing and north-facing surfaces (world normal dot product with up and with the north vector, with a noise breakup), and near the ground (height above the landscape, via world position Z and a falloff). Green-brown on stone, black-green algae on sea walls below the high tide line.

3. Wetness (always on for exterior materials): darkens base color (multiply by 0.65 to 0.8, more for porous materials, controlled by a `Porosity` parameter), lowers roughness (lerp toward 0.1 for non-porous, 0.3 for porous), and adds a slight normal flattening. The wetness amount = `GlobalWetness` × exposure, where exposure comes from: the rain occlusion texture (sampled by world position: is this pixel under cover?), the surface's world normal (upward faces get wet first and most; vertical faces get wet with rain streaks from a scrolling streak texture), and a per-material `WetnessResponse` multiplier. Interiors (an `IsInterior` static switch) skip rain wetness but still get flood wetness.

4. Puddles (ground-facing surfaces only): puddle mask from the material's height map (low areas fill first) combined with a world-space noise, scaled by `PuddleAmount`. Puddle areas get roughness 0.02, a flattened normal, darkened color, and rain ripples (a flipbook normal texture of ripple rings, animated, scaled by `RainAmount`).

5. Flood line and salt crust: from `MPC_Flood`, per-pixel height relative to the zone's current water height and the raid's peak height. Below the current water: fully wet (the underwater portion). Between the current height and the peak height reached this raid: wet, with a gradient drying slowly over time since the water receded (driven by a "time since recede" value per zone). At the peak height: a crisp salt line (a band of white crystalline texture 3 to 8 cm high with noise breakup, slightly emissive in `Salt` color at night at very low intensity), and a few centimeters of drip streaks below it. Plus the static historic flood lines (decals from part 25). This layer is what makes the flooding feel like it actually happened to the town. It's a must-have.

6. Damage: bullet holes and impacts are decals, not material layers. Burnt surfaces (after fires) use a burn layer driven by a mask painted at runtime into a small render target per affected actor (Tier 3; v1 uses scorch decals).

There's no snow layer in v1; the Tier 3 winter event adds a frost switch to this master.

Parameters exposed in instances: base textures, tiling, `Porosity`, `WetnessResponse`, moss amount and color, grime amount, `IsInterior`, puddles enabled, flood layer enabled, salt line color/width.

Performance: the full stack is expensive. Instances for distant or small props disable layers (moss, puddles) through static switches; use a "Lite" master (`M_Master_Surface_Lite`: base + wetness + flood only) for small props. Keep instruction counts under 250 for the full master and under 120 for Lite on Medium. Use material quality levels (`Quality Switch` nodes) to drop detail normals, puddle ripples and moss on Low.

## 26.3 M_MASTER_LANDSCAPE

Landscape layers: Grass, Heather, Peat, Rock, Shingle, Sand, WetSand (the intertidal kelp line), Mud, Tarmac, Cobble, Gravel. Each layer: base color, normal, ORM, with height-based blending between layers (height lerp, so rocks poke through grass naturally). Distance blending: tiling changes with distance to hide repetition (two tiling scales blended by camera distance). Runtime Virtual Texture output for blending meshes into the ground (rocks, walls, roads), and RVT-based landscape rendering for performance.

Wetness, puddles (on Tarmac, Cobble, Mud, Sand) and the flood/salt layers work as in 26.2 (the landscape uses the flood zone of the nearest zone via a world-space lookup into a coarse flood zone ID texture baked from the flood volumes: a 1024×1024 texture covering the map, each texel holding a zone index).

Grass and heather foliage: PCG-placed meshes (part 14) with `M_Master_Foliage`.

## 26.4 M_MASTER_FOLIAGE

Two-sided foliage shading model (or subsurface for grass), masked, with wind via world position offset: a global wind from `MPC_World` (direction, strength) with per-instance phase variation (from the instance's position hash), plus gusts (a low-frequency noise scrolled along the wind direction). Heather and grass bend; gorse shakes; trees (few on the island: wind-bent sycamores in gardens, a few conifers in the manse grounds) sway on a trunk-and-branch hierarchy (pivot painter or simple vertex color masks). Wetness darkens and adds specular. WPO disable distance: 60 m (beyond, foliage doesn't animate, which saves VSM invalidation).

## 26.5 M_MASTER_WEAPON

Weapons and attachments are the most looked-at assets in the game (first-person ADS, the gunsmith bench, the inspect view). This master material is where Pillar 2 lives visually.

Base material types (a static switch per instance): Anodized Aluminum, Steel (blued, parkerized, stainless, case-hardened), Polymer (matte, textured), Wood (walnut, birch laminate, fence post), Rubber, Glass (separate: 26.8), Brass, Fabric (slings), Carbon fiber.

Inputs from the mesh's baked textures: BaseColor (the base material color), Normal, ORM, plus a baked mask texture with: R = curvature (convex edges), G = cavity (concave crevices), B = AO, A = a "wear zone" mask painted by hand for handling wear (grip areas, magazine well, charging handle, safety selector, muzzle).

The layers:

1. Finish (the cosmetic skin, part 10): applied over skinnable parts. Finish color or pattern, sampled triplanar in object space (so a pattern flows continuously across all the parts of one weapon: use the weapon root's local space, passed in as a per-component parameter set by the weapon actor), with pattern scale, rotation and offset. Finish roughness and metallic. The finish is masked out where wear reveals the base material (layer 2).

2. Wear: edge wear from curvature (convex edges lose finish first), handling wear from the wear zone mask, scaled by a `Wear` parameter (0 to 1) which comes from the item's durability (or the cosmetic override, part 10.4.3). Worn areas show the base material (bare aluminum under anodizing, bright steel under bluing, lighter wood under the finish). Plus scratches (a tiling scratch normal and roughness texture masked by wear), and grime in cavities (cavity mask darkens and roughens, more with lower durability).

3. Rust (steel parts only): appears at low durability and after salt exposure, in cavities and edges, orange-brown, rough, with a slight height (normal) change.

4. Salt crust: after the weapon has been submerged in Surge water (a per-weapon runtime value from gameplay: `SaltExposure`, 0 to 1, decaying over 10 minutes), white crystalline deposits in cavities and on lower surfaces. Gameplay-relevant: it accompanies the Waterlogged state.

5. Wetness: from rain and water (a per-weapon `Wetness` runtime value: dripping when just out of water), darker and glossier, with droplets (a droplet normal texture) on upward surfaces.

6. Heat: barrels and suppressors glow with heat (part 07 and 08): an emissive black-body color ramp (dull red at 60%, orange at 85%, bright orange-yellow at 100%) masked to the barrel/suppressor area by a vertex color or a part-level parameter, plus a heat-tint on the metal (blue-gold heat discoloration that builds over a weapon's lifetime: a permanent "HeatHistory" per barrel item, cosmetic and lovely).

7. Blood: a decal-like mask that applies blood spatter to the weapon when the player or a nearby target takes damage (rare, subtle, wiped off over time).

Emissive elements (tritium sights, illuminated reticles are separate, fiber optic sights): a small emissive mask with a color parameter. Cosmetic emissives (special finishes) are capped by `CosmeticEmissiveCap`.

Performance: weapons are few on screen, so this master can be rich (up to 350 instructions). LODs for other players' weapons use a simpler variant (`M_Master_Weapon_LOD`: finish + wear only).

## 26.6 CHARACTER MATERIALS

`M_Skin` (MetaHuman skin material or our own subsurface profile skin): wetness (glossier, with droplets on the face in rain), cold (a slight redness on nose, ears, cheeks when Cold is above 50, and blue lips above 80; driven by a per-character parameter from gameplay), dirt and blood (masks, driven by gameplay events), salt (a dusting on the face after Surge water immersion).

`M_Cloth`: fabric with a sheen (for wool and fleece), wetness that darkens and stiffens the look (lower sheen, darker, slight normal flattening) with a "wet line" that climbs from the bottom up when wading (driven by the per-character `WadeHeight` value: the highest point the water reached on the character's body in the last 10 minutes, so trouser legs are soaked to the knee after wading knee-deep), salt crust on the lower legs after Surge water, mud splashes on boots and trousers (mask, driven by surfaces walked on), and blood.

`M_HollowSkin`: the drowned skin. Subsurface with a waxy grey-blue base, mottling (a noise-driven variation between grey, blue, green-grey and bruise purple), wrinkling (a detail normal for waterlogged skin), wet always (high gloss, droplets), and the salt growths: white crystalline crust in cracks around the eyes, mouth and wounds (painted masks per head/body plus procedural spread), with a faint `Salt`-colored emissive glow in the deepest crystal areas (subtle by day, visible at night: this is a readability feature, so at night Hollows' eyes and wounds glow faintly cyan). The glow brightens slightly when the Hollow is alerted (a per-instance parameter from AI state), which is a great subtle tell.

`M_SaltCrystal` (for the Hollows' crystal growth meshes and for salt deposits and salt items): a translucent or refractive crystal material (choose between a cheap opaque "faceted" look with a fake inner glow, used on Low/Medium, and a refractive translucent version on High/Epic), with internal glow (`Salt` color, emissive, with a slow pulse: period 4 to 7 s, varied per instance), Fresnel rim, sparkle (glints from a world-space noise thresholded at grazing angles), and `LanternPulse` sync during the final Surge (all salt in the world pulses together, which is eerie and wonderful).

## 26.7 WATER

### 26.7.1 The ocean

Use the Water plugin's ocean water body with Gerstner waves (a wave asset with 4 to 8 wave components, amplitude driven by the weather: calm 0.4 m significant height, storm 2.5 m on the open sea, with the harbor and lee sides damped by a water body exclusion or a wave attenuation area). Customize the water material (`M_Water_Ocean`, an instance or copy of the plugin's material): North Atlantic colors (deep teal-grey absorption, green-grey scattering, murky), foam on wave crests (driven by wave height and the storm intensity), shoreline foam (from the water's distance field to the shore), rain ripples on the surface, salt foam streaks in the Surge (white-green foam lines along the wind direction), and the green underglow during the final Surge (a subsurface-like emissive from below, pulsing with `LanternPulse`).

Underwater: the Water plugin's underwater post process, customized: murky green-brown (`LUT_Underwater`), visibility 6 m in calm, 3 m in the Surge (thick with silt and salt particles), caustics on surfaces near the surface (calm only), suspended particles (Niagara), a slight blur and distortion, and god rays from the surface in calm weather.

### 26.7.2 Flood water (`M_Water_Flood`)

The flood zones' surfaces. Different from the ocean: brown-green, murky, opaque beyond 0.5 m depth (players can't see what's under it, which hides Crawlers and Drowners, and that's intentional), with flow (a flow map or just the zone's flow vector scrolling normal maps and foam), debris (floating litter texture layer + Niagara floating objects: planks, bottles, leaves, papers, fish), foam lines along obstacles (from depth: where the flood surface meets walls, using depth fade), rain ripples, and oil sheen patches (rainbow iridescence near the harbor and the power station).

Edge blending: where the flood surface meets walls and the ground, a depth-fade transition and a wet foam line. Use single-layer water shading if flood surfaces can be water bodies; otherwise a translucent material with depth fade and a fake refraction.

Splashes and wakes: characters and AI moving through water spawn wake decals (ripple rings) and splash particles (Niagara, part 27). A simple interactive water ripple simulation (a render target ripple sim around the camera, 256×256 over 20 m, with characters as inputs) on High and Epic, so wading leaves real ripples on the surface.

## 26.8 GLASS, LENSES AND SCOPES

### 26.8.1 Window glass (`M_Glass_Window`)

Thin translucent glass with reflections (screen space and Lumen on High), dirt and salt spotting (masks), rain streaks running down outside surfaces during rain (a scrolling droplet and streak normal), condensation on inside surfaces of cold buildings, and breakage: windows have three states (intact, cracked from a hit: a crack decal at the hit point with a radial normal, shattered: swapped to an empty frame with glass shards on the ground and a few jagged edge pieces left in the frame). Broken state replicates (part 05).

### 26.8.2 Optic lenses (`M_Lens`)

Every optic's front and rear lens has a lens material: a coated glass look (tinted reflections: green-purple coating, amber coating on hunting scopes), dirt, rain droplets when wet (driven by the weapon's wetness and rain while the player is outdoors), fogging after water immersion (3 s, part 04), and glare flashes: magnified optics' front lenses reflect a bright glint toward other players when the scope faces a strong light source (the sun, the lighthouse beam) and is aimed roughly toward the viewer (within 15°). The glint is a gameplay tell visible from far away (rendered as a small, bright, view-facing sprite at the front lens, scaled with distance so it stays visible at range, only for magnified optics of 4x and above). Anti-glare covers (a Tier 2 attachment, the "Honeycomb Killflash": removes the glint, -2 ergonomics) make glints a choice.

### 26.8.3 Scope rendering

Two modes, in Settings > Graphics > Scope Rendering:

Performance mode (default on Low and Medium): when ADS through a magnified optic, the main camera's FOV narrows to match the optic's magnification (true zoom of the main view, rendered at full quality, no second scene render). The weapon and scope body render in the first-person layer with their own FOV, so they don't distort. Everything outside the scope's eyepiece circle is blurred heavily and darkened (a post-process mask centered on the eyepiece's screen position and radius), simulating the unmagnified view around the scope. The reticle is drawn in the eyepiece as a lens material overlay (26.8.4). Parallax and scope shadow are simulated in the overlay (26.8.5).

Picture-in-picture mode (option on High and Epic): the main view keeps the hip FOV (slightly zoomed for the "eye focus"), and the scope's lens shows a render target from a scene capture component mounted at the optic's front, with the optic's FOV, at a resolution relative to the eyepiece's screen size (50% on High, 75% on Epic), and with reduced show flags (no volumetric fog, lower Lumen quality via a capture-specific post process) to keep the cost down. That's the most realistic (you see the world around the scope at normal scale) and the most expensive (a second scene render). Its cost must stay under 3 ms on the reference GPU on High; if it can't, cap PiP to optics up to 6x and use Performance mode beyond.

Pillar 2 in part 01 mentions picture-in-picture scopes with real parallax. This part supersedes it: PiP is the option on High and Epic, Performance mode is the default elsewhere, and both modes have parallax and scope shadow.

Variable zoom: in both modes, the FOV changes smoothly over 0.15 s when cycling magnification.

### 26.8.4 Reticles (`M_Reticle`)

Reticles are drawn procedurally in a material with signed distance fields (SDF) for crispness at any resolution: dots, circles, chevrons, crosshairs, hash marks, BDC holdover marks, mil-dot trees and numbers (from a small SDF font atlas). Each reticle is a data asset describing its primitives (type, position in milliradians or MOA, size, thickness), which the material renders through a small set of parameters (up to 64 primitives per reticle, packed into a texture: a 64×2 RGBA float texture generated from the data asset). That lets designers make any reticle without a texture artist, and lets BDC reticles be generated from real ballistics (part 08: the BDC marks for a 7.62x51 scope are placed at the actual drop at 300, 400, 500 and 600 m for M80 ammo at that zero).

First focal plane reticles scale with magnification; second focal plane reticles don't (a parameter). Illumination: the reticle's emissive brightness levels (cycle with a key), with color options (part 10).

Red dots and holographic sights: the dot is drawn on the sight's lens plane in the material, with the dot appearing at optical infinity (the dot's position in the material is computed from the view direction, not the lens UV: project the weapon's aim direction into the lens plane, so the dot stays on target even if the eye isn't perfectly centered, which is how real red dots behave and it looks great when the weapon sways). Holographic reticles add a slight "floating" depth look (no parallax).

### 26.8.5 Parallax and scope shadow

For magnified optics, the eye's position relative to the optic's axis matters. The eye offset (the camera's position relative to the optic axis, from sway and movement in ADS, part 05) shifts the visible image inside the eyepiece: a dark "scope shadow" ring forms on the side away from the offset, growing with offset and with eye relief error (part 08). The reticle stays centered on the optical axis, so sway shows as the image and reticle drifting relative to the eyepiece circle. That's a subtle, beautiful and authentic effect, and it costs nearly nothing in the lens material.

## 26.9 SKY, STORM AND WEATHER SHADERS

`M_StormCurtain`: the storm wall layers (part 15): translucent, unlit or lit-translucent, with a scrolling 3D noise (a volume texture or two 2D noises panned in different directions), vertical gradient (dense and dark at the base, wispy at the top), depth fade against geometry and the sea, distance fade, a green-emissive base band that pulses with lightning and `LanternPulse`, and rain streak texture overlays. Rendered with the separate translucency pass at half resolution.

Volumetric clouds: the UE volumetric cloud material, customized with a weather map render target (part 15) driving coverage and type, darker cloud bases in storms, a green tint in the Surge's ambient scattering, and lightning illumination (a point of emissive light inside the cloud volume at strike locations: approximate with a temporary boost in the cloud's ambient term near the strike position).

`M_Lightning`: an unlit emissive ribbon material for bolts (Niagara ribbons along a branching path generated per strike), with a bright core and soft glow, flickering over 0.2 s.

`M_RainStreak`: Niagara sprite material for rain: a thin stretched streak with motion blur look, lit by the scene (so rain is visible in flashlight beams and near lights: use a lit translucent material with a cheap lighting approximation, or unlit with a light-dependent brightness from a per-particle light sample in Niagara on High), occluded by the rain occlusion texture.

`M_RainSplash`: splash flipbooks on surfaces.

`M_ScreenRain`: the post-process raindrops-on-camera effect (optional setting).

## 26.10 POST-PROCESS MATERIALS

`PP_Outline`: squadmate outlines (part 03) using the custom stencil buffer: squadmates' meshes write a stencil value; the post-process draws an outline in the squad color around stencil edges (a Sobel on the stencil, 2 px), only where the outline would be visible (respecting depth: through walls, the outline is drawn dimmer and dashed, so you can see squadmates behind cover but it's clearly an "x-ray" for allies only). Never applied to enemies.

`PP_Underwater`: distortion, color, and particulate (beyond the Water plugin's default).

`PP_Damage`: the health-low vignette (red edges pulsing at low thorax/head HP), bleed (a drip of desaturation), pain (subtle blur edges), concussion (blur and double vision, chromatic offset), stun (white-out), cold (frost creeping in at the screen edges above Cold 70), salt sickness (green-tinged, a slow color breathing).

`PP_ScopeMask`: the Performance-mode scope mask (26.8.3).

`PP_Lightning`: a brief flash bloom and exposure kick on strikes.

`PP_Night`: optional "night readability" (a setting: a gentle boost to low luminance, off by default: it's an accessibility option that makes nights easier, available to all players, so it's fair).

`PP_HeatShimmer`: refraction distortion above hot barrels and suppressors (a translucent distortion mesh above the barrel, not a full-screen pass), and above fires.

## 26.11 VFX MATERIALS

Muzzle flash materials (part 27), smoke (lit translucent with soft particles), fire (emissive flipbooks with heat distortion), sparks, blood (translucent with a dark core; not cartoonish), water splashes (lit translucent with refraction on High), salt dust (sparkling particles in `Salt` color), dust and debris.

## 26.12 SHADER COMPILATION AND PERMUTATIONS

Shader compile times and permutation counts are a real cost with layered masters. Rules:

Use static switches only for features that genuinely vary per material instance and are many-to-few (a handful of combinations). Keep the number of static switch combinations actually used under 30 per master. Audit with the "Material Analyzer" tool.

Prefer dynamic parameters (cheap branches or lerps) for things that vary at runtime.

Use material quality switches for scalability instead of separate materials.

Set up a shader cache for the packaged build: generate a PSO cache (Pipeline State Object cache) by running the game through a "PSO gathering" playthrough (the benchmark flythrough plus a scripted raid with every weapon fired, every VFX triggered and every UI screen opened) and bundle it, so players don't get hitches the first time they see something. DX12 PSO hitching is the number-one complaint about UE5 games on PC. UE 5.5+ has improved PSO precaching; enable it and also bundle a recorded cache. A first-launch "Preparing shaders" step with a progress bar is acceptable (30 to 90 s); hitches in the first raid are not.

## 26.13 MATERIAL ACCEPTANCE TESTS

Every master material compiles on all quality levels without errors and within its instruction budget.

A wet/dry/flood/salt test row in `L_Test_Lighting` shows every master's layers correctly.

The weapon material shows: a factory new and a 20% durability version of every weapon side by side (screenshot review), finishes flowing across parts, heat glow on the LMGs and suppressors.

Reticles: every reticle's BDC marks match the ballistic table within 0.1 mil at their marked distances (automated test).

Scope rendering in both modes runs within budget.

No PSO hitches over 50 ms in the scripted raid after the bundled cache is used (measured with the PSO hitch counter in the stat output).

---

End of part 26. Next: `27_VFX_NIAGARA.md`.
