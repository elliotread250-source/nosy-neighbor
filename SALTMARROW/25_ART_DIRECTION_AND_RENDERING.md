# SALTMARROW: PART 25, ART DIRECTION AND RENDERING

This part sets the look of the game and the rendering pipeline that delivers it. The look is grounded realism with a painterly restraint: real materials, real light, but composed and graded like a photograph of the North Atlantic in November, never a postcard and never a muddy brown shooter. The pipeline is UE5's modern stack (Lumen, Nanite, Virtual Shadow Maps, TSR), configured with discipline so it runs on the hardware in part 01.

---

## 25.1 THE LOOK IN FIVE RULES

1. Cold base, warm accents. The world is blue-grey, slate, sea green and wet stone. Warmth comes from light sources (windows, lamps, fires, the low afternoon sun) and from a few painted objects (orange buoys, yellow oilskins, red boats, ochre house fronts). Never warm the whole frame.

2. Wet is the default. Surfaces are damp more often than not. Specular is our friend: wet cobbles reflecting a window, a slick sea wall catching the sky. Dry is a special state (bright spells).

3. Atmosphere does the depth. Sea haze and fog separate foreground, middle ground and background. You should always feel the distance across the water.

4. Readability beats realism. Characters, interactables and threats must separate from the background through value contrast, rim light and motion. If a beautiful shot makes a player invisible, the shot is wrong.

5. The Surge breaks the rules on purpose. Calm raids follow rules 1 to 4. The Surge turns the palette sick green-black, flattens the light, and makes the world hostile. The contrast between calm and storm is the game's visual identity.

## 25.2 REFERENCE

Build a reference board in `design/art/reference/` with images you're allowed to keep for internal reference (your own renders, public domain and Creative Commons images with attribution; don't scrape copyrighted photography into the repo; link to them in a text file instead). Topics: Faroe Islands villages in winter (Gjógv, Tórshavn harbor), Shetland and Orkney harbors (Stromness, Lerwick), Newfoundland outports, Norwegian fishing villages (Lofoten: Reine, Henningsvær), Scottish fishing towns (Pittenweem, Crail, Mallaig), North Sea storms and storm walls (shelf clouds), lighthouses in storms, abandoned towns (Pripyat for the "left in a hurry" mood, Kolmanskop for nature reclaiming), fish processing plants, ferry terminals, Cold War listening stations, flooded streets (real storm surge photography), salt crystal formations (salt flats, the Dead Sea's salt pillars, cave crystals).

Mood keywords for every scene: damp, quiet, abandoned in a hurry, lived-in until suddenly not, beautiful and unsafe.

## 25.3 RENDERING PIPELINE

Target engine features (verify availability in the installed version):

Global illumination: Lumen (software ray tracing by default, hardware ray tracing optional on Epic for supported GPUs). Lumen gives us dynamic GI that handles the time of day, the Surge darkening and flashlights indoors, which baked lighting can't (the Surge changes everything dynamically).

Reflections: Lumen reflections on High and Epic, screen-space reflections on Medium, reflection captures plus SSR on Low.

Geometry: Nanite for all static environment meshes (buildings, rocks, props, cliffs), including foliage where Nanite foliage is supported well in the installed version (UE 5.5+ improved Nanite for foliage; check performance on the moor). Characters and weapons are skeletal meshes (non-Nanite, unless Nanite skinned meshes are production-ready in the installed version; check it, don't assume).

Shadows: Virtual Shadow Maps on Medium and above; on Low, use regular cascaded shadow maps with a short distance (the Low preset needs to run on a Steam Deck). Shadow distance for VSM is fine as-is; make sure foliage and Nanite WPO (world position offset: grass waving) shadows don't cost too much (use the "shadow cache invalidation" settings for WPO meshes wisely: distant foliage shouldn't invalidate VSM pages every frame; set WPO disable distance on foliage).

Anti-aliasing and upscaling: TSR (Temporal Super Resolution) by default, with a screen percentage driven by the quality preset. Add DLSS (NVIDIA's UE plugin), FSR (AMD's FSR 3 UE plugin) and XeSS (Intel's plugin) as options if their plugins support the installed engine version and their licenses allow distribution (they do, under their SDK terms; include their required notices). Frame generation (DLSS FG, FSR FG) as optional toggles with a warning about input latency.

Translucency: separate translucency pass at reduced resolution for rain, storm curtains and smoke. Water uses the Water plugin's single-layer water shading.

Volumetrics: Volumetric Clouds (with a reduced quality on Low), Exponential Height Fog with volumetric fog on Medium and above.

Post-processing: bloom (convolution off; standard bloom with low intensity, 0.4), lens flares (subtle, only from very bright sources: the lighthouse, the sun, flares), vignette (0.25), chromatic aberration (off by default, 0.1 option), film grain (subtle, 0.2 intensity with a fine grain; off option), motion blur (off by default for gameplay; on for menus and cinematics), depth of field (off in gameplay except ADS on scopes where the out-of-scope area is blurred; on in menus and cinematics).

## 25.4 EXPOSURE AND COLOR

### 25.4.1 Exposure

Auto exposure (histogram), with bounds that make weather mean something:

Calm day: min EV100 9, max EV100 13.
Overcast: min 8, max 12.
Storm: min 4.5, max 9. (The storm should feel darker; don't let auto exposure undo the drama by brightening it back up.)
Night: min -1.5, max 4. (Dark, but not so dark that the screen is unreadable. Flashlights should bloom slightly.)
Interiors: auto exposure adapts with a speed of 1.5 up and 3.0 down (it takes a moment for eyes to adjust when entering a dark building; that's a real gameplay beat and it's good).

Use "Exposure Compensation Curve" to keep bright scenes from crushing shadows. Lock the "Apply Physical Camera Exposure" off. Test with the calibration scene (25.10).

### 25.4.2 Color grading

Use the UE color grading controls in post-process volumes plus a set of LUTs authored in a color tool (or built from UE's grading parameters and exported as LUTs) for each weather and time state: `LUT_Calm_Day`, `LUT_Calm_Dusk`, `LUT_Overcast`, `LUT_Bright`, `LUT_Fog`, `LUT_Warning`, `LUT_Storm`, `LUT_FinalSurge`, `LUT_Night_Clear`, `LUT_Night_Overcast`, `LUT_Night_Storm`, `LUT_Underwater`, `LUT_Halcyon_Menu`. Blended by the weather state (part 15).

Calm grade: slightly desaturated (saturation 0.85), cool shadows (shadows tinted toward cyan-blue), neutral midtones, warm highlights (slightly toward amber), lifted blacks a touch (a filmic toe that keeps shadow detail), gentle contrast.

Storm grade: saturation 0.6 with a green shift in shadows and midtones, crushed highlights, dark overall, with a selective boost to warm light sources so windows and fires punch through.

Final Surge grade: as Storm with deeper teal-green, and the "Lantern pulse" adding a slow brightness pulse to the green channel in the shadows.

Night grade: blue moonlight, warm artificial lights, saturation 0.7.

Underwater grade: murky green-brown, heavy desaturation, strong distance fog.

Halcyon menu grade: warmer than the raid (it's home), with gentle contrast.

## 25.5 LIGHTING THE WORLD

Sun and moon: one Directional Light (the sun, or the moon at night, swapping intensity and color), with atmosphere-based color from Sky Atmosphere. Sun intensity in lux: bright day 60,000 to 90,000 (with physically based exposure); overcast 8,000 to 15,000 (via cloud occlusion and a lower directional intensity); storm 1,500; night (moon) 0.2 to 0.5.

Sky Light: real-time capture on High and Epic, a blended static capture on Low and Medium (captured at the main weather states and blended).

Artificial lights: streetlights (sodium-orange, a few working and flickering), windows (some houses have lights on, powered intermittently by the power station: an emissive window card plus a point light only for the nearest few), the lighthouse (a rotating spotlight with a volumetric beam and a long-range "flare" card for distant visibility), fires (fire barrels, burning cars: point lights with flicker), boat navigation lights, LISTENER's floodlights, emergency lights in the hospital and the station.

Light budget: dynamic shadow-casting local lights are expensive. Rules: at most 8 shadow-casting local lights visible at once on Medium (the flashlights of nearby players and AI, the lighthouse, fires near the player). All other local lights are non-shadow-casting or use distance-based shadow toggles. Flashlights cast shadows (they're gameplay), but only the 4 nearest flashlights to the camera cast shadows on Medium; the rest light without shadows. Use light functions sparingly.

Interior lighting: Lumen handles indirect light through windows. Interiors without windows (cold store, vault, basements, LISTENER underground) are dark unless lit by flashlights, emergency lights or fires. That's the intent.

Rim and readability: characters (players, AI) get a subtle rim light boost through their material (a Fresnel term scaled by the scene's darkness, from a material parameter collection: at night and in storms, characters' edges catch a little more light), so silhouettes read. Keep it subtle: no "glowing outlines" except squadmates' optional outline (part 03).

## 25.6 ENVIRONMENT ART STANDARDS

Texel density: 512 px per meter for environment surfaces at the base mip (so a 2048 px texture covers 4 m), 1024 px/m for hero props and anything the player sees up close (doors, interactables, containers), 2048 px/m for weapons and character gear (first-person views).

Materials: PBR metal/roughness. Every surface material supports the wetness layer, the salt crust layer and the flood line (part 26). Use material instances of a small set of master materials (part 26), never one-off materials.

Texture compression: BC7 for color and masks where quality matters, BC5 for normals, BC4 for single channels. Virtual Textures (Streaming Virtual Texturing) for the landscape and large surfaces, and Runtime Virtual Texturing for blending the landscape onto meshes (rocks sitting naturally in grass, roads blending into verges).

Decals: lots of them. Dirt, grime, water stains, rust streaks, algae and moss on north faces, salt lines on walls at the flood heights (static decals at the historic flood lines, and dynamic ones at this raid's high water marks after each Surge: spawned as DBuffer decals along the flood volume's wall intersections at the peak height), posters, graffiti (Warden chevrons, salvager markings: "DEAD INSIDE", "SALT HERE", tally marks, crew names, arrows), road markings, blood (sparingly).

Modularity: part 14's kit. Hero assets (unique props and buildings) follow the same standards.

Polycount: with Nanite, polycount for static meshes isn't a big concern, but keep collision simple (boxes and convex hulls; never use complex collision as simple for gameplay traces except for bullet penetration traces against specific materials, which use the complex collision channel).

## 25.7 CHARACTER ART STANDARDS

Players: MetaHuman heads (part 10), modular clothing on the UE5 mannequin skeleton, gear meshes (rigs, armor, backpacks, helmets) as separate skeletal meshes with leader pose. Triangle budget per player at LOD0: 70,000 (body, head, hair cards, clothing, gear, weapon excluded). LODs: LOD1 at 50% (screen size 0.5), LOD2 at 25% (0.25), LOD3 at 10% (0.1), with the head dropping to its lowest LOD beyond 8 m.

Hollows: built from the same body base (so clothing pieces are shared with a "drowned" material variant), with a salt growth set (crystal meshes attached to bones in clusters; vary the clusters per Hollow instance with a seeded selection) and a skin material with the drowned look (part 26). Budget: 35,000 triangles at LOD0, aggressive LODs. Variation: at least 12 visual variants per Hollow type through clothing, salt growth placement, skin variation and scale (0.92 to 1.08).

Wardens: human soldiers built like players (shared clothing and gear meshes) with Warden-specific pieces (white chevron armbands, painted helmets, the welded sallets). Budget as players.

Bosses: unique meshes, budgets up to 150,000 triangles (only one at a time).

## 25.8 THE MAP ILLUSTRATION

The in-raid map (part 24) is an illustrated chart, not a satellite render. Produce it as a large texture (8192 × 8192) composed from: a top-down orthographic render of the island (a scene capture with a special "map" post process that flattens lighting and stylizes colors), traced into a stylized chart: contour lines generated from the landscape heightmap (a material on the capture), water depth tints and soundings, building footprints in a paper color with ink outlines (from the nav or collision footprint), roads and paths, POI labels in the typewriter and handwritten fonts, a compass rose, a scale bar, the title cartouche ("SALTMARROW. Chart of the Islands. Salvage Council Survey, Year 7."), and pencil annotations. Automate the generation (a toolset function `GenerateMapTexture` in `MapAuthoringTools`) so it updates when the map changes; then hand-touch the labels.

## 25.9 SCALABILITY PRESETS

Four presets plus Custom (part 34 has the settings screen). Each preset sets UE's scalability groups plus our own cvars. Targets in part 35.

| Group | Low | Medium | High | Epic |
|---|---|---|---|---|
| Resolution scale (TSR) | 50% to 67% | 67% | 75% | 100% (or native with TSR AA) |
| View distance | Near | Medium | Far | Epic |
| Anti-aliasing | TSR low | TSR medium | TSR high | TSR epic |
| Shadows | CSM, 2 cascades, 60 m | VSM, medium | VSM, high | VSM, epic |
| Global illumination | Lumen off, SSGI + skylight + baked ambient probes | Lumen software, medium | Lumen software, high | Lumen high or hardware RT |
| Reflections | SSR + captures | SSR + Lumen low | Lumen reflections | Lumen reflections, high |
| Post-processing | Low | Medium | High | Epic |
| Textures | Medium pool | High | High | Epic |
| Effects | Low | Medium | High | Epic |
| Foliage | Low density | Medium | High | Epic |
| Shading | Low | Medium | High | Epic |
| Volumetric fog | Off | On, low resolution | On | On, high |
| Volumetric clouds | Low | Medium | High | Epic |
| Rain particles | 4,000 | 8,000 | 12,000 | 16,000 |
| Water | Low (no refraction distortion, simplified waves) | Medium | High | Epic |

The Low preset without Lumen is critical for the Steam Deck and older GPUs: the world still needs ambient light. Provide a fallback: a skylight with a captured cubemap, ambient occlusion, and a few large "ambient fill" lights in interiors that only activate on Low (controlled by a scalability-aware component), so interiors aren't pitch black without Lumen GI. Test the Low preset as carefully as Epic.

## 25.10 CALIBRATION AND REVIEW

Build a calibration level (`L_Test_Lighting`) with: a gray card set (18% gray, black, white), color checker, a row of materials (wet and dry stone, metal, wood, fabric, skin), a player character, a Hollow, a Warden, each lighting state selectable from a UI (Calm Day, Overcast, Dusk, Fog, Warning, Storm, Final Surge, Night Clear, Night Storm, Underwater), and a split-screen comparison of the four presets. Use it to tune exposure, grades and readability. Screenshot each state at each preset for my review (`design/art/review/`).

Readability checks per state: the player character is distinguishable from the background at 10, 30 and 60 m on each of 5 background types (stone wall, grass moor, water, sky, interior dark), measured by the silhouette contrast test from part 10.9.

## 25.11 RENDERING ACCEPTANCE TESTS

Every preset hits its frame time target on its reference hardware in the benchmark flythrough (part 35).

No lighting state makes the HUD or the player character unreadable (the tests in parts 10.9 and 24.10).

The Low preset has no pitch-black interiors (an automated test samples luminance in 20 interior locations on Low at night: average above a floor value).

Switching presets at runtime doesn't crash or leak memory, and takes effect within 1 s.

---

End of part 25. Next: `26_MATERIALS_AND_SHADERS.md`.
