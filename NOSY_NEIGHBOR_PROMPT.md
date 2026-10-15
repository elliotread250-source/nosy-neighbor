# NOSY NEIGHBOR: MASTER BUILD PROMPT FOR CLAUDE CODE

Copy everything in this document into Claude Code as a single message. It is long on purpose. Every section matters. Read the whole thing before you write a single file, then build in the milestone order given near the end.

---

## 0. WHO YOU ARE AND WHAT YOU'RE BUILDING

You are a senior game developer, technical artist, and level designer rolled into one. You're building a complete, playable, browser-based 3D first-person stealth-horror-comedy game called **Nosy Neighbor**.

The game is a love letter to the 2017 stealth-horror game Hello Neighbor (made by Dynamic Pixels, published by tinyBuild). That game had a very specific look and feel: a bright, saturated, cartoon suburbia where everything is slightly wrong. Houses lean. Doors are too tall. Furniture is chunky and toy-like and warped. The colors are sunny and candy-bright, yet the whole thing feels deeply unsettling because a sweaty, mustached man in a sweater vest lives across the street, and he's hiding something in his basement, and he will sprint at you with his arms out if he sees you.

Your job is to recreate that feeling as closely as you possibly can. The visuals, the proportions, the character, the AI that learns from you, the tension, the slapstick, the dread under the sunshine.

One hard rule on intellectual property: this is an original homage. Do not use the name "Hello Neighbor," "Mr. Peterson," "Theodore Peterson," "tinyBuild," "Dynamic Pixels," their logos, or any ripped assets, textures, sounds, or music from their games. Everything you make is generated from scratch in code. The neighbor in this game is an original character named **Mr. Grimsby** (first name Harold). He shares the archetype and the visual language of the cartoon suburban villain, and he's built from your own geometry with your own design decisions as described below. The title screen says "Nosy Neighbor." That's it.

What "done" looks like, in one paragraph: the player opens a URL, sees a title screen with a crooked house at dusk and a creepy-cute logo, clicks Play, and is standing on the sidewalk outside their own small house on a sunny suburban street. Across the road is a tall, impossible, bright-yellow-and-teal house that leans like it's been drinking. A man in a blue diamond-pattern sweater vest is pacing inside. The player can sneak in through windows, stack boxes, throw objects, collect colored keys, solve physical puzzles, hide in wardrobes, and try to get into the locked basement. The neighbor patrols, hears noises, sees the player, chases them with a lumbering-but-fast run, and catches them with a grab that fades to black and resets them to their own yard. Over time, the neighbor learns: he puts bear traps where you keep entering, puts cameras on the windows you like, boards up the doors you abuse. Reaching the basement ends Act 1 with a surreal twist.

Everything below tells you exactly how it should look, sound, and behave.

---

## 1. TECH STACK AND ARCHITECTURE

Build for the browser. No downloads, no installs for the player.

Use this stack exactly unless something is genuinely impossible:

- **Three.js** (pin a recent stable release, r160 or newer) for rendering.
- **Vite** as the dev server and bundler. Plain JavaScript with ES modules, or TypeScript if you prefer. Pick one and stay consistent.
- **cannon-es** or **Rapier (via @dimforge/rapier3d-compat)** for physics. Rapier is preferred: it's faster and its character controller is better. Every throwable object, every crate, every chair needs real rigid-body physics.
- **Three.js postprocessing** via `three/examples/jsm/postprocessing` (EffectComposer, RenderPass, UnrealBloomPass, a custom outline pass, a custom color-grade pass, OutputPass).
- **Web Audio API** for all sound, generated procedurally. No audio files required. If you choose to add files later, they must be original.
- **No external 3D model files at all.** Every mesh is built procedurally in code from primitives (BoxGeometry, CylinderGeometry, SphereGeometry, CapsuleGeometry, LatheGeometry, ExtrudeGeometry, TubeGeometry) and then deformed with vertex-level math to get the warped, exaggerated look. This is a feature, not a limitation: the Hello Neighbor style is chunky, simple, beveled geometry with bold color, so procedural primitives fit it perfectly.
- **No image textures downloaded from anywhere.** Any texture (wood grain, wallpaper pattern, brick, grass noise, sweater-vest diamonds) is painted at runtime on an offscreen `<canvas>` and turned into a `CanvasTexture`.

Folder structure:

```
nosy-neighbor/
  index.html
  package.json
  vite.config.js
  Dockerfile
  railway.json
  server.js                (tiny static server for production, or use `serve`)
  src/
    main.js                (boot, loop, state machine for screens)
    config.js              (every tunable number in one place)
    core/
      Engine.js            (renderer, composer, resize, clock)
      Input.js             (pointer lock, keyboard, mouse, gamepad)
      Physics.js           (Rapier world wrapper, helpers)
      Audio.js             (Web Audio graph, procedural synth sounds, music)
      Events.js            (tiny pub/sub)
      SaveSystem.js        (localStorage, wrapped in try/catch)
    art/
      Palette.js           (every color as a named constant)
      Materials.js         (toon material factory, gradient maps, outline material)
      CanvasTextures.js    (procedural wood, wallpaper, brick, shingles, grass, argyle)
      Warp.js              (vertex deformation helpers: lean, taper, bulge, twist, wobble)
      Geo.js               (beveled box, rounded box, chamfered cylinder helpers)
      PostFX.js            (outline, color grade, vignette, bloom, film grain)
      Sky.js               (gradient sky dome, sun, clouds)
    world/
      Neighborhood.js      (street, sidewalks, lawns, fences, other houses, trees)
      PlayerHouse.js
      NeighborHouse.js     (the main level, built room by room)
      rooms/               (one file per room)
      props/               (one file per prop family: furniture, kitchen, toys, tools)
      Doors.js             (hinged doors, locks, colored keys)
      Windows.js           (breakable glass, boardable)
      Puzzles.js
    actors/
      Player.js            (first-person controller, hands, inventory, throw)
      Neighbor.js          (model build, rig, animation)
      NeighborAI.js        (state machine, senses, navigation)
      NeighborBrain.js     (learning/adaptation memory)
      Traps.js             (bear trap, camera, glue, boards)
    nav/
      NavGraph.js          (hand-authored waypoint graph + A*)
    ui/
      HUD.js
      Menus.js
      Cutscenes.js
  public/
    favicon.svg
```

Put every magic number in `config.js`: walk speeds, FOV, hearing radius, sight cone angle, chase speed, catch distance, trap cooldowns, warp intensities, bloom strength, and so on. I want to tune the game by editing one file.

Target 60 fps on a mid-range laptop with integrated graphics at 1080p. If you need to choose between a visual effect and frame rate, keep the frame rate and simplify the effect. Provide a Graphics setting (Low / Medium / High) that scales shadows, bloom, outline thickness, and render scale.

---

## 2. THE ART DIRECTION DOCTRINE

Read this section three times. This is the soul of the game. If the art is wrong, nothing else matters.

### 2.1 The one-sentence version

A children's picture book of a sunny American suburb, built out of chunky toy blocks, then warped by a fever dream so that nothing is quite straight, nothing is quite the right size, and the one house that matters is a towering, leaning, patched-together monument to one man's paranoia.

### 2.2 The five pillars

**Pillar one: everything is chunky.** No thin geometry anywhere. Walls are thick. Table legs are thick. Door frames are thick and stand proud of the wall by several centimeters. Window frames are fat. Picture frames are fat. Even a fork would be fat. Think of how a Fisher-Price toy kitchen looks next to a real kitchen: same objects, but every dimension that could be thin has been doubled or tripled so a toddler can't snap it. Apply that logic to every single mesh. Minimum visible thickness of any object in the world is 4 cm in world units, and most "thin" things (shelves, frames, railings) should be 6 to 12 cm.

**Pillar two: everything is beveled and soft-edged, then subtly wrong.** Sharp 90-degree box corners are banned. Every box gets a chamfer or rounded bevel (use a rounded-box helper with 2 to 4 segments of rounding, radius around 3 to 8 percent of the smallest dimension). The result is a soft, plasticky, clay-like silhouette. Then, on top of that softness, you add wrongness: a slight taper so a cabinet is wider at the top than the bottom, a slight lean so a bookshelf tilts 3 degrees forward, a slight bulge so a fridge looks bloated. Soft plus wrong equals the Hello Neighbor feeling.

**Pillar three: proportions are exaggerated, and exaggerated inconsistently.** Doors are tall and narrow, around 2.6 to 3.0 m tall and only 0.85 to 0.95 m wide, so they feel like they loom over you. Ceilings in the neighbor's house are high, 3.2 to 4.0 m, which makes the player feel small. Windows are often stretched vertically. Staircases are steep. Chairs have long legs. Lamps are gigantic. Meanwhile some objects are too small: a tiny side table, a toy-sized TV, a little framed photo on a huge expanse of wall. The inconsistency is the point. The player's brain keeps getting small "that's not right" signals.

**Pillar four: colors are saturated, warm, and candy-like, with a sickly edge.** Sunshine yellow, sky blue, mint teal, tomato red, lime green, bubblegum pink, tangerine orange, grape purple. Nothing is grey unless it's metal, and even the metal leans blue or warm. Shadows are not black. Shadows are tinted, usually toward blue-purple outdoors and toward warm brown-orange indoors. The overall image should look like it was color-graded by someone who loves Pixar's suburbs but also loves a slightly over-saturated 1990s VHS tape. Where it gets sickly: the wallpaper in the neighbor's house is a little too green. The light through his windows is a little too orange. The basement is a cold, sour cyan-green.

**Pillar five: the architecture defies physics and doesn't apologize.** The neighbor's house is too tall for its foundation. Upper floors overhang lower floors. Rooms are added on with planks and scaffolding. There's a car parked on a fence. There's a ladder going to a door in the middle of a wall that leads nowhere. There are stairs that go up and stop. Rooftops have multiple pitches stacked like a wedding cake. Some additions are clearly bolted on later in different colors and materials. This is a house that grew like a tumor of secrets, and it should look like one man kept adding to it, alone, at night.

### 2.3 What the style is NOT

It is not realistic. No PBR photorealism, no 4K wood textures, no realistic light falloff that makes things murky.

It is not flat-shaded low-poly in the "faceted triangles" sense. Surfaces are smooth-shaded with soft bevels. Think "clay model with a gloss of paint," not "Minecraft" and not "Superhot."

It is not cel-shaded with hard black anime outlines everywhere. Outlines exist but they're thin, dark-tinted (not pure black), and they fade with distance. The shading has soft banding (3 to 4 tones via a gradient map), not 2-tone hard cel.

It is not gloomy. Act 1 happens in daylight. The horror comes from contrast with the sunshine.

It is not gory. Nothing is bloody. The scariest things are implied: locked doors, a padlocked basement, a child-sized mannequin, muffled noises, the neighbor's face.

### 2.4 Reference mood, described in words

Picture a lazy summer afternoon around 4 p.m. The sky is a clean gradient from deep cornflower blue overhead to a pale, slightly hazy peach at the horizon. Fat, rounded, cartoon cumulus clouds float slowly by, each one a cluster of 5 to 9 overlapping squashed spheres, bright white on top and lavender-grey on the underside. The sun is a big warm disc low in the west, throwing long shadows across bright green lawns.

The street is a two-lane suburban road in warm mid-grey asphalt with a bright yellow dashed center line and slightly-too-wide concrete sidewalks in pale cream. Every lawn is a saturated grass green with a slight yellow tint, mowed perfectly flat, with a few chunky round bushes like green gumdrops. White picket fences run between yards, each picket a fat rounded plank with a pointed top, and each fence section leaning a degree or two in a different direction. Mailboxes on fat posts sit at the end of each driveway. A couple of street lamps stand too tall, their heads curving over like question marks.

Then you look at the neighbor's house and the mood drops a few degrees.

---

## 3. GEOMETRY RULES (THE TECHNICAL ART OF WRONGNESS)

### 3.1 The rounded-box helper

Write a `roundedBox(w, h, d, radius, segments)` function that builds a box with rounded edges and corners. Three.js ships `RoundedBoxGeometry` in examples; you can use that. Default radius: `min(w,h,d) * 0.08`. Default segments: 2 on Low graphics, 3 on Medium/High. Use this for 90 percent of everything.

Write a `chamferCylinder(rTop, rBottom, h, radialSegs, bevel)` helper that rounds the top and bottom edges of a cylinder using a LatheGeometry profile. Use it for table legs, lamp posts, chair legs, the neighbor's limbs, cans, buckets, pipes.

### 3.2 The warp toolkit (Warp.js)

All warps operate on a geometry's position attribute in local space, then recompute normals. Every warp takes an intensity that defaults to a value in `config.js` so you can turn the whole world's wrongness up or down.

- `lean(geo, angleDeg, axis)`: shear vertices along X or Z proportional to their Y height. A bookshelf leaning 4 degrees forward. A house wall leaning 2 degrees outward. Do not rotate the object; shear it, so the base stays planted on the floor and the top drifts.
- `taper(geo, topScale, bottomScale)`: scale X and Z by a lerp from bottom to top. Positive taper (top wider) on cabinets, wardrobes, and the neighbor's torso. Negative taper (top narrower) on lamps and chimneys.
- `bulge(geo, amount)`: push vertices outward from the vertical axis by `amount * sin(pi * normalizedY)`. Makes fridges, washing machines, barrels, and the neighbor's belly look swollen.
- `twist(geo, degreesOverHeight)`: rotate vertices around Y proportional to height. Use sparingly: chimneys, a crooked stair rail, a lamp post.
- `wobble(geo, amplitude, frequency, seed)`: add low-frequency 3D noise displacement so straight edges look hand-sculpted. Amplitude around 1 to 2 percent of object size. Apply to almost everything at a very low level so nothing is mathematically perfect.
- `sag(geo, amount)`: pull the middle of a horizontal span downward. Shelves, roof ridges, fence rails, power lines.
- `skewTop(geo, dx, dz)`: shift only the top vertices sideways. Good for doorframes that are slightly parallelogram-shaped.

Use a seeded random generator (mulberry32 or similar) so the world is warped identically every time the game loads. Seed per object from its name so you can tweak one object without reshuffling everything.

### 3.3 Warp budgets by category

These are starting values. Put them in config.

- Neighbor's house exterior walls: lean 1.5 to 4 degrees, each wall section different. Upper stories lean more than lower ones. Wobble 1 percent.
- Neighbor's house interior walls: lean 0.5 to 2 degrees. Door frames skewTop 2 to 5 cm.
- Player's house: almost straight. Lean 0 to 0.5 degrees. This contrast is important. Your house is safe and nearly normal. His house is wrong.
- Other neighborhood houses: lean 0.5 to 1.5 degrees, cute and harmless.
- Furniture: lean 1 to 5 degrees, taper 0.9 to 1.15, bulge 0 to 0.08.
- Fences: each section rotated randomly plus or minus 2 degrees around its base, each picket individually plus or minus 3 degrees.
- Trees: trunks twist 10 to 25 degrees, lean 3 to 8 degrees.
- Lamp posts: curve the top over like a hook using a TubeGeometry along a bent curve.

### 3.4 Scale conventions

1 world unit equals 1 meter. Player eye height is 1.6 m. Player capsule radius 0.3 m, height 1.75 m. Crouched eye height 0.95 m. The neighbor stands about 2.05 m to the top of his hair, so he's noticeably taller than the player, with a big head that makes him look even bigger. When he's close and leaning toward the player, his face should fill a lot of the screen.

Standard door: 0.95 m wide by 2.75 m tall in the neighbor's house, 0.9 by 2.2 in the player's house. Standard ceiling in his house: 3.4 m. Standard window: 0.9 m wide by 1.6 m tall, sill at 0.9 m. Stair step rise 0.22 m, run 0.26 m (steep).

---

## 4. COLOR PALETTE (Palette.js)

Every color in the game comes from this file. No inline hex codes elsewhere. These are tuned for sRGB output with Three.js color management turned on (`renderer.outputColorSpace = SRGBColorSpace`). Define each with `new Color(hex)`.

### 4.1 Sky and atmosphere

- `SKY_ZENITH` #3E7BEA (deep cornflower)
- `SKY_MID` #7FB2F5
- `SKY_HORIZON` #F8D9B8 (warm peach haze)
- `SUN_DISC` #FFF3C4
- `SUN_LIGHT` #FFE7B0 (directional light color)
- `CLOUD_TOP` #FFFFFF
- `CLOUD_BOTTOM` #BDB5D8 (lavender underside)
- `FOG_DAY` #E9D8C6
- `FOG_DUSK` #E8A27C
- `FOG_NIGHT` #1F2747

### 4.2 Ground and street

- `GRASS` #6CC24A
- `GRASS_DARK` #4FA236
- `GRASS_LIGHT` #9BDB5E
- `ASPHALT` #5F6268
- `ASPHALT_WARM` #6E6A6A
- `ROAD_LINE` #FFD23F
- `SIDEWALK` #E8DFC9
- `CURB` #CFC6AF
- `DIRT` #A8743F
- `GRAVEL` #B9A88E

### 4.3 The neighbor's house exterior

- `NH_SIDING_MAIN` #F2C94C (warm mustard-sunshine yellow, the dominant color)
- `NH_SIDING_ALT` #7CC6B6 (mint teal, for an added wing)
- `NH_SIDING_ADDON` #E07A5F (dusty tomato, for a bolted-on upper room)
- `NH_TRIM` #FFFFFF slightly warm, use #FFF8EC
- `NH_ROOF` #B33A3A (brick red shingles)
- `NH_ROOF_ALT` #3F5E8C (slate blue shingles on a later addition)
- `NH_DOOR_FRONT` #C0392B (bold red front door)
- `NH_SHUTTERS` #2E86AB (bright blue shutters)
- `NH_PLANKS` #B5835A (raw wood boards)
- `NH_PLANKS_OLD` #8C6A4F
- `NH_METAL_SHEET` #9AA7B0
- `NH_SCAFFOLD` #C9A227
- `NH_FOUNDATION` #A79A8A

### 4.4 The player's house

- `PH_SIDING` #9FD3F0 (soft baby blue)
- `PH_TRIM` #FFFFFF
- `PH_ROOF` #4D5D7A
- `PH_DOOR` #F4D35E

### 4.5 Neighbor's interior

- `WALLPAPER_GREEN` #A8C686 with stripes #8FB370 (slightly sickly)
- `WALLPAPER_PINK` #F2B5B5 with polka dots #E89393
- `WALLPAPER_BLUE` #9EC5E8 with a diamond pattern #7FAFD9
- `WALLPAPER_YELLOW` #F6E3A1 with vertical pinstripes #E3C873
- `WALL_PAINT_PURPLE` #9B7BC8 (the purple room)
- `WAINSCOT` #D9C3A0
- `FLOOR_WOOD` #B9773E
- `FLOOR_WOOD_DARK` #8A5328
- `FLOOR_TILE_A` #F3F0E6 and `FLOOR_TILE_B` #2E2E36 (kitchen checkerboard)
- `CARPET_RED` #B23A48
- `CARPET_GREEN` #4E8C5A
- `CEILING` #FBF4E6
- `BASEMENT_WALL` #6F8F86
- `BASEMENT_FLOOR` #4C5A57
- `BASEMENT_LIGHT` #A6F0D0 (sour cyan-green)

### 4.6 Furniture and props

- `WOOD_LIGHT` #D9A066
- `WOOD_MID` #A86B3C
- `WOOD_DARK` #6B3F22
- `FRIDGE` #F7F3E3 with handle #C8CCD0
- `RETRO_MINT` #A8E6CF (appliances)
- `RETRO_ORANGE` #F39C4A (sofa)
- `SOFA_GREEN` #6B8E4E
- `LAMPSHADE` #F5DCA0 (emissive when on)
- `TV_BODY` #5B3A29
- `TV_SCREEN_OFF` #2C3E50
- `TV_SCREEN_ON` #9FE2FF
- `RED_TOY` #E63946
- `BLUE_TOY` #457B9D
- `YELLOW_TOY` #FFD166
- `CARDBOARD` #C9965B
- `CARDBOARD_TAPE` #E8D3A7
- `METAL` #A7B1BA
- `METAL_DARK` #5C6770
- `BRASS` #D4A93C

### 4.7 Keys (each must be instantly readable from 10 meters away)

- `KEY_RED` #FF3B3B
- `KEY_BLUE` #2F80ED
- `KEY_GREEN` #27AE60
- `KEY_YELLOW` #F2C94C
- `KEY_PURPLE` #9B51E0
- `KEY_BASEMENT` #FF7A00 (bright orange, special glow)

### 4.8 The neighbor

- `NB_SKIN` #F2C6A0 (warm peach)
- `NB_SKIN_SHADOW` #D9A27E
- `NB_NOSE` #E89A84 (ruddy, always slightly flushed)
- `NB_CHEEKS` #EBA897
- `NB_HAIR` #5A3A22 (dark chestnut brown)
- `NB_MUSTACHE` #4A2F1B (slightly darker than hair)
- `NB_EYEBROWS` #3E2716
- `NB_EYE_WHITE` #F7F4EC
- `NB_IRIS` #3E8E5A (green)
- `NB_PUPIL` #111111
- `NB_SHIRT` #F4D35E (mustard yellow dress shirt)
- `NB_VEST_DARK` #2C4A7A (navy)
- `NB_VEST_LIGHT` #6FA3D8 (light blue)
- `NB_VEST_LINE` #E9EEF5 (thin argyle cross-lines)
- `NB_PANTS` #6B4E3D (brown trousers). Mr. Grimsby's own twist: warm brown trousers with a faint darker plaid.
- `NB_BELT` #3A2A1E
- `NB_BUCKLE` #D4A93C
- `NB_GLOVES` #1E1E22 (black rubber, slight sheen)
- `NB_SHOES` #3B2416 (dark brown leather)

### 4.9 Night and dream palette (Act transitions)

- `DREAM_SKY_TOP` #2A1B4D
- `DREAM_SKY_BOTTOM` #C0397B
- `DREAM_FOG` #5B2A6E
- `DREAM_ACCENT` #FF5E5B
- `DREAM_GROUND` #3A2E5C

---

## 5. MATERIALS AND SHADING

### 5.1 The toon material

Use `MeshToonMaterial` as the base for nearly everything, with a custom gradient map. Build the gradient map as a 4-pixel or 5-pixel `DataTexture` with `NearestFilter` for min and mag filtering. Values: roughly 0.35, 0.6, 0.85, 1.0. This creates soft-banded shading: three or four clear tone steps per object, which reads as "painted cartoon" while still showing form.

Then improve on stock MeshToonMaterial with `onBeforeCompile`:

1. **Tinted shadows.** Instead of darkening toward black, mix the shadowed tones toward a shadow-tint color. Outdoors the tint is `#5B5FA8` (blue-violet) at around 35 percent. Indoors it's `#8A5A44` (warm brown) at around 30 percent. Pass the tint as a uniform so you can change it per zone.
2. **Rim light.** Add a soft Fresnel rim: `pow(1.0 - dot(normal, viewDir), 3.0) * rimStrength`, colored warm white `#FFF1D6`. Strength around 0.25 on props, 0.4 on the neighbor so he pops against backgrounds.
3. **Subtle specular blob.** For glossy materials (fridge, rubber gloves, car paint, the neighbor's nose and forehead), add a single stepped specular highlight: compute Blinn-Phong, then `step(0.92, spec)` and add a small, soft white highlight. This is the "plastic toy" shine.
4. **Ambient lift.** Never let any surface go below about 25 percent brightness. Clamp the darkest toon band. The game is bright.

Create a `makeMat(colorName, options)` factory in Materials.js that returns a cached material per color plus options combination so you're not creating hundreds of duplicate materials.

### 5.2 Outlines

Outlines are part of the look. Use the inverted-hull method for characters and important props (keys, interactable items, the neighbor): clone the mesh, scale it out along normals in the vertex shader by about 1.5 to 2.5 cm (scaled by distance so it's roughly constant in screen space, then clamped), render back faces only with a flat dark color. The outline color is not black: it's the object's own color multiplied by 0.25 and shifted toward `#2A1E3A` (deep purple-brown). That keeps it warm and illustrated.

For the environment, use a screen-space edge-detect post pass on depth and normals instead of inverted hulls (cheaper, catches all the architecture edges). Line thickness 1 px at 1080p, color `#3A2C44` at 55 percent opacity, fading to 0 opacity beyond 40 meters so the distant world gets soft and painterly.

### 5.3 Procedural canvas textures (CanvasTextures.js)

Every texture is drawn on an offscreen canvas at 256 or 512 px and wrapped in a `CanvasTexture` with `SRGBColorSpace`, `RepeatWrapping`, and mipmaps. Keep them simple and graphic. They should look painted, not photographed.

- **Wood planks:** fill base color, draw 4 to 6 horizontal plank bands with 2 px darker gaps, and inside each plank draw 3 to 6 long, wavy, low-contrast grain lines (stroke with 10 percent darker color, 1.5 px, using sine-wobbled paths). Add 1 or 2 darker oval knots per plank at random. Tile across floors at about 1 repeat per 2 m.
- **Siding:** horizontal clapboard. Each board 18 cm tall in world terms. Draw a lighter top band and a darker 3 px shadow line at the bottom of each board. Tile so boards look chunky and wide.
- **Shingles:** rows of rounded-bottom rectangles (fish-scale-ish), each row offset by half a shingle, each shingle with a slight random brightness shift of plus or minus 6 percent. Big shingles: roughly 35 cm wide in world space.
- **Brick (chimney, foundation):** chunky bricks, 30 by 12 cm, with thick 3 px cream mortar lines and random per-brick hue jitter.
- **Wallpaper:** stripes, polka dots, diamonds, and a repeating small flower pattern. Bold, simple, two colors each. They should look slightly too loud for the room.
- **Checkerboard tile:** crisp black-and-cream squares, 30 cm each, with a faint 1 px grout line.
- **Grass:** base green with hundreds of tiny, short, slightly darker and lighter strokes, plus a large-scale low-frequency noise for patchiness. Tile big. On top of this, scatter instanced grass-tuft meshes (see section 7) near paths and fences.
- **Argyle for the vest:** diamonds alternating navy and light blue, with thin cream diagonal lines crossing through the diamond centers. Diamond size on the canvas should map to about 9 cm wide on the neighbor's torso.
- **Carpet:** base color plus a slightly darker border band and a faint woven noise.

### 5.4 Glass

Windows use a material that's mostly transparent with a pale blue tint `#CDE8F5` at 30 percent opacity, plus a big fake diagonal glare stripe drawn on a canvas texture (two parallel white diagonal bars at 40 percent and 20 percent opacity). This is the classic cartoon window shine, and it's important: it makes windows instantly readable as glass and it's very Hello Neighbor.

Broken windows swap to a jagged-hole version: the glass mesh is replaced by 4 to 7 triangular shards stuck in the frame, and 8 to 15 small shard rigid bodies fall to the ground and fade out after 10 seconds.

### 5.5 Emissives

Lamps, TV screens, the basement light, the neighbor's security camera red LED, and keys all use emissive color so they catch the bloom pass. Lampshades glow `#FFD98A`. The basement light is `BASEMENT_LIGHT`. Keys have a faint pulsing emissive at 15 to 30 percent so they read as collectible.

---

## 6. LIGHTING, SKY, ATMOSPHERE, POST-PROCESSING

### 6.1 Lighting setup (outdoors, Act 1 daytime)

- One `DirectionalLight` as the sun, color `SUN_LIGHT`, intensity around 2.2 (with physically correct lighting off, tune by eye), positioned low in the west-southwest at about 35 degrees elevation so shadows are long and dramatic.
- Shadows: use a single shadow map focused around the player and the neighbor's house. Shadow map 2048 on High, 1024 on Medium, off or 512 on Low. Use `PCFSoftShadowMap`. Shadow bias tuned so there's no acne on the beveled surfaces. The shadow camera follows the player so detail stays near them.
- `HemisphereLight`: sky color `#BFD9FF`, ground color `#9C7A52`, intensity around 0.9. This fills the shadows with the warm-blue cartoon tint.
- A very low `AmbientLight` (0.15) as a floor.

### 6.2 Indoors

Interior rooms are lit by baked-feeling fill: when the player is inside the neighbor's house, crossfade the hemisphere light toward a warmer, dimmer setting (sky `#FFE2B8`, ground `#7A4E33`, intensity 0.7) and switch the shadow tint uniform to the warm indoor tint. Each lamp prop owns a `PointLight` with limited distance (4 to 6 m) and no shadows, color `#FFC97A`. Cap active point lights at 8, prioritized by distance to the camera.

Sunlight shafts through windows: fake them with a few additive, soft-edged, slightly dusty quads (god-ray cards) angled from each sunlit window onto the floor, color `#FFE6A8` at 12 to 18 percent opacity, with tiny floating dust motes (instanced points drifting slowly). This sells the "warm afternoon in a creepy house" vibe hugely.

### 6.3 Sky

A large inverted sphere with a vertical gradient shader using `SKY_ZENITH`, `SKY_MID`, `SKY_HORIZON`. A big sun disc sprite with a soft glow halo. Clouds are clusters of squashed spheres with the toon material (white top, `CLOUD_BOTTOM` under-shade), drifting slowly on the wind (0.5 m/s), 10 to 15 clusters at 120 to 300 m distance. They should look like cotton balls glued to a blue card.

### 6.4 Fog

Use `scene.fog = new Fog(FOG_DAY, 60, 220)`. Fog keeps the world feeling like a closed little diorama and hides the edge of the map. The fog color should match the horizon so the ground melts into sky.

### 6.5 Time-of-day shifts

Act 1 starts at late afternoon. Each time the player is caught, advance a "story clock" a little toward dusk (not real time, just mood): sun lowers, the sky warms toward orange, the fog shifts toward `FOG_DUSK`. After five catches it's clearly golden hour. This gives the sense of a long, frustrating day of failed break-ins. It never fully reaches night in Act 1 unless the player triggers the Act 1 ending.

### 6.6 Post-processing stack (in this order)

1. `RenderPass`
2. Screen-space edge outline pass (depth + normal Sobel), described in 5.2
3. `UnrealBloomPass`: strength 0.35, radius 0.6, threshold 0.85. Subtle. Lamps, keys, the sun, and window glare should glow softly. Nothing should look like a JJ Abrams film.
4. Custom color-grade pass:
   - Saturation boost 1.18
   - Contrast 1.06
   - Lift shadows toward `#3A2E5C` slightly, push highlights toward `#FFF2D6`
   - A gentle warm overall temperature shift
   - When the neighbor is chasing the player, push saturation up to 1.35, add a faint red tint to the edges, and add a mild chromatic aberration (1 to 2 px at screen edges). Return smoothly after the chase ends.
5. Vignette: soft, darkness 0.35 normally, 0.6 during chase, pulsing slightly with a heartbeat rhythm during chase.
6. Very faint film grain (2 to 3 percent) for that slightly-off VHS warmth.
7. `OutputPass`

Expose each stage on/off in config and in the Graphics menu.

---

## 7. THE NEIGHBORHOOD

The playable outdoor area is a single short suburban street, roughly 120 m long and 70 m wide, bounded by fences, hedges, and fog. It is a diorama, not an open world. Invisible collision walls at the edges, disguised by tall hedges and a "ROAD CLOSED" sawhorse barrier at each end of the street.

### 7.1 Layout

The street runs east to west. The player's house sits on the south side, center. Directly across on the north side is the neighbor's house. The player's front door faces the neighbor's front door across about 28 m of lawn, sidewalk, road, sidewalk, lawn. This direct sightline is important. From the player's porch you should see the neighbor's front windows clearly, and from his windows he can see your yard.

Flanking houses: two on each side of the street, smaller, cute, slightly leaning, colored pastel pink `#F7C6D0`, pastel green `#C5E8B7`, pastel lavender `#D6C8F0`, and peach `#FFD3B0`. They are not enterable. Their doors are locked and they have curtains drawn. One has a kid's bike lying on the lawn. One has a sprinkler going (animated water arc of little blue particles). One has a "FOR SALE" sign leaning badly.

### 7.2 Street dressing

- A bright red fire hydrant, chunky and over-sized (70 cm tall), with big round bolts.
- Two curving lamp posts, 5.5 m tall, dark green `#2F4F3E`, heads hooked over like a candy cane. They are off during the day.
- A yellow school-bus-style mailbox on a post at each house, the flag on the neighbor's box raised.
- Power poles with sagging wires (use `sag` on tube geometry) strung between them across the street.
- Round gumdrop bushes along each house's front.
- Two trees in the player's yard and one huge tree beside the neighbor's house. Trees: twisted chunky brown trunk, crown made of 4 to 7 overlapping spheres in two greens, slightly squashed. The neighbor's tree is bigger, its trunk more twisted, and one fat branch reaches almost to an upper window of his house. That branch is climbable as an alternate route in Act 1.
- Instanced grass tufts (crossed quads or low cone clusters) scattered at fence bases and along the sidewalk edges, 2,000 to 6,000 instances depending on quality. They sway gently with a vertex shader wind.
- A few instanced dandelion and daisy flowers in the lawns.
- Small details: a garden hose coiled on the neighbor's lawn, a garden gnome by his porch (the gnome is slightly too tall, 70 cm, and slowly turns to face the player when they aren't looking; an easter egg), a welcome mat on his porch that says "GO AWAY" in fat letters if you look closely, painted via canvas texture.

### 7.3 The player's house

Small, single story plus attic, baby blue siding, white trim, slate roof, yellow door. It's nearly straight: barely any warp. It feels safe. Inside: a cozy living room with a couch, a TV, a little kitchen corner, and the player's bedroom with a window facing the neighbor's house. This window is where Act 1 starts: the player wakes up, looks out the window, and sees the neighbor dragging something toward his basement.

The player's house is the respawn point. When caught, the player wakes up on their bed with a gasp, a short white flash, and a muffled heartbeat that fades.

The player's house also has a few useful items that persist: a cardboard box, a flashlight (later in Act 1), a radio that plays soft music.

---
## 8. THE NEIGHBOR'S HOUSE: EXTERIOR

This is the hero asset of the entire game. Spend time here. It should be the thing people screenshot.

### 8.1 Silhouette

From the street, the house reads as a tall, narrow, stacked, slightly drunk tower of rooms on top of a respectable suburban two-story base. Total height to the top of the highest chimney: about 17 m. Footprint: about 16 m wide by 13 m deep. It is visibly too tall and too top-heavy for that footprint.

Build it in layered "chunks," each one a separately warped volume, so the silhouette is jagged and each chunk leans its own way:

1. **Base (ground floor):** 16 by 12 m, 3.6 m tall, mustard yellow siding, white trim, a deep covered front porch running the full width with fat white columns (each column tapered, top wider than bottom, and each one leaning a different direction by 1 to 3 degrees). Porch roof is a shallow shed roof in brick red. Three broad steps up to the porch. The bold red front door is dead center, tall and narrow, with a small half-moon window at the top and a brass knob and knocker. Two big front windows on each side with blue shutters that hang slightly crooked (one shutter missing a hinge and dangling at 20 degrees).
2. **Second floor:** sits on the base but is 1 m narrower on the left and overhangs 0.8 m forward on the right, supported by two diagonal wooden braces that look like an afterthought. Mustard siding continued, but a slightly different shade (#EBC14A) as if repainted from a different paint can. Three windows across, the middle one larger. A small balcony on the right with a chunky white railing that sags in the middle.
3. **Third floor addition (the mint wing):** a narrower box, 9 by 8 m, set back and off-center to the left, mint teal siding, clearly a later addition, with a slate-blue gabled roof. One round porthole window and one tall narrow window. It leans 3 degrees left.
4. **The tomato-red bolted-on room:** a small boxy room, 4 by 4 m, cantilevered off the right side of the third floor on visible scaffolding and diagonal planks. It's sided in dusty tomato red, partly covered with raw wooden planks and a patch of corrugated metal sheet. It leans 5 degrees out over the yard. A small window with a curtain that is always closed. This room is locked for most of Act 1 and contains an important item.
5. **Attic tower:** a skinny tower on top of the mint wing, 3 by 3 m, very tall pointed roof (a near-witch-hat pitch, 60 degrees), brick red shingles, a tiny attic window with a single bare bulb glowing behind it. A crooked weathervane at the tip shaped like a rooster, rotating slowly and occasionally snapping around.
6. **Chimneys:** two of them. One fat brick chimney on the left side of the base rising all the way up past the second floor, twisted 12 degrees and tapering. One skinny metal stovepipe chimney on the mint wing roof, crooked, with a little conical hat, puffing a tiny cartoon smoke (soft white spheres that rise, grow, and fade).

Each chunk's roof should have a different pitch and a slightly different shingle color shift. Eaves are thick (25 to 35 cm fascia boards) and overhang a lot. Roof ridges sag.

### 8.2 Exterior oddities and routes in

The exterior must offer multiple ways in, because that's the core of the stealth puzzle:

- **Front door:** locked at the start. It has a padlock hasp plus a regular lock. The key for it is hidden later in the act; front door is the "you've earned it" route.
- **Ground-floor front windows:** breakable by throwing an object. Each one leads into the living room or the dining room.
- **Side kitchen door:** on the east side, behind a gate in a tall wooden fence. Unlocked at first. The neighbor will lock it or trap it once he learns you use it.
- **Back yard:** a fenced back yard with a green-painted shed, a chunky red sedan parked on top of a crushed section of fence (yes, really: front wheels on the fence, back wheels on the grass, angled 12 degrees, a ridiculous detail that sells the style), a kiddie pool with scummy green water, a pile of crates, a clothesline with a sweater vest and a pair of brown trousers hanging on it, and a barbecue grill.
- **Back porch:** a screen door into a mudroom. The screen door slaps shut with a satisfying spring sound.
- **Roof route:** the player can stack the crates by the porch, climb onto the porch roof, walk along to the second-floor balcony, and enter through its door. There's also a ladder lying in the back yard that can be carried and leaned against walls (physics item, 3.5 m long, snaps to a "leaned" state when placed against a wall at the right angle).
- **The big tree branch:** from the top of the neighbor's tree trunk (climb by jumping on a series of fat knots and a nailed-on plank step), the player can walk along a thick branch to a second-floor side window.
- **Basement hatch:** a pair of slanted cellar doors on the west side, sealed with a heavy chain and a big orange padlock. This is the end goal. It cannot be opened from outside in Act 1. The actual basement entry is inside.
- **Mail slot:** you can peek through the front door mail slot. Looking through it gives a narrow letterbox view of the hallway. Sometimes the neighbor's eye appears on the other side. Jump scare, small and funny, used at most once per session.

### 8.3 Exterior details that make it feel lived-in and wrong

- Every first-floor window has a little window box with chunky red and yellow flowers. Two of the window boxes have dead brown flowers.
- A "No Trespassing" sign nailed crookedly to the fence, and below it a second, smaller, handwritten sign that just says "I MEAN IT."
- A security floodlight above the back door, which turns on (bright, bloom-heavy) when the player walks into the back yard after the neighbor has learned the back route.
- A satellite dish on the second-floor roof aimed at the player's house.
- A pair of binoculars on the second-floor balcony railing, pointed at the player's bedroom window.
- Muffled noises from the house: occasional banging from below ground level, a TV playing in the living room (mumbled cartoon gibberish), the neighbor humming.
- At night (Act transitions), every window glows a different color: one warm orange, one sickly green, one flickering TV blue, and the attic tower's single bulb.

---

## 9. THE NEIGHBOR'S HOUSE: INTERIOR, ROOM BY ROOM

The interior must be larger than it looks from outside. Don't hide that. It's part of the dream logic. Hallways go a bit further than they should. A staircase has one more landing than makes sense. The player should feel like the house is a maze built by a paranoid man.

Use a 1 m grid for blocking out rooms, then warp. Every room has at least two exits, so the player can escape a chase. Every room has at least one hiding spot (wardrobe, under-bed, cabinet, behind a door). Doors are physics-hinged and can be held shut against nothing (doors don't block the neighbor once he gets there; he shoves them open with a bang).

### 9.1 Ground floor

**Front hallway (entry):** long and tall, 3 m wide by 8 m deep, 3.8 m ceiling. Green-striped wallpaper above a wooden wainscot. Dark wood floor with a long red runner carpet. A coat stand (tilted 6 degrees) with a brown jacket and an old hat. A small table with a ceramic bowl of keys that are all useless decoys (they jingle when touched, which makes noise). A grandfather clock with a pendulum, ticking loudly; it's a little too tall, 2.9 m, and its face is a cartoon face (simple dots for eyes) that seems slightly sad. Three framed photographs on the wall: one of a smiling family of four (the faces are scratched out with a marker on two of them; keep it subtle and non-gory), one of a house that looks like a normal version of this house, one of a carnival or amusement park. The stairs to the second floor rise from the back of the hallway on the left side, steep, with a fat banister that twists slightly.

**Living room (west of the hall):** big, sunny, 7 by 6 m. Orange retro sofa (bulged, overstuffed cushions like marshmallows), a green armchair with a doily on the head rest, a boxy wooden TV on short legs playing static and cartoon shapes on its glowing screen, a coffee table with a mug, a newspaper, and a remote. A rug with a big concentric-circle pattern. A fireplace with a brick surround connected to the fat chimney, a chunky mantelpiece holding a toy train, a candle, and a snow globe. A bookshelf leaning heavily forward (5 degrees), stuffed with fat, oversized books in bright colors. A floor lamp taller than it should be (2.4 m) with a drum shade. This room has the two big front windows that can be smashed. Hiding spot: behind the sofa (crouch), or inside a tall wardrobe in the corner.

**Dining room (east of the hall):** a long table with six chairs, one chair pushed back as if someone just stood up. The table is set for three people. Plates have cartoon food: a roast chicken like a toy, green peas as spheres, a jello mold that wobbles when touched. A china cabinet with plates on display, its glass doors fogged. A chandelier with five glowing candle bulbs hangs too low. Yellow pinstripe wallpaper. The dining room connects to the kitchen through a swinging saloon-style door.

**Kitchen:** black-and-cream checkerboard floor, mint-green appliances, warm wood cabinets that are wider at the top than the bottom. A big bulging retro fridge (its door opens; inside are fat cartoon milk bottles, a cake, an apple, a jug of something green, and in Act 1 a key hidden behind the milk). A gas stove with a kettle that starts whistling at a random interval and draws the neighbor to the kitchen. A sink full of dishes. A toaster that pops toast with a cartoon "ping." Counter clutter: a cutting board, a bread loaf, jars with colored candies, a bowl of fruit. A cork board with notes, one of which has a crude drawing of the player's house with a big question mark. The side kitchen door leads outside to the east yard. A trapdoor in the kitchen pantry floor is a false lead (opens to a crawlspace with a toy box).

**Mudroom / back porch entry:** coats, boots, an umbrella stand, a washing machine and dryer. The washing machine is important in Act 1 because it's the hidden passage to the basement stairs (it opens to reveal a sliding panel behind it once the player solves the basement puzzle; see section 13).

**Downstairs bathroom:** small, pink tile, a tub with a shower curtain featuring rubber duck prints. A medicine cabinet with a mirror. Hiding spot: in the tub behind the curtain (the neighbor checks it sometimes).

**Basement door:** at the back of the hallway, under the stairs, a heavy, reinforced door painted dark green with three locks, a chain, and a big orange padlock. Wooden planks are nailed across it. Light leaks under it in that sour cyan-green. Sometimes muffled thumps come from beyond it. This door is the obsession of Act 1.

### 9.2 Second floor

**Upstairs hallway:** narrower, longer, and it slopes slightly (the floor is warped, the player feels it). Pink polka-dot wallpaper. A row of doors on each side, one of which is fake (opens onto a brick wall). A small window at the end looking out over the back yard.

**Neighbor's bedroom:** a big bed with a patchwork quilt, too-high headboard. A nightstand with an alarm clock (if the player rings it, it lures the neighbor upstairs). A dresser with a mirror. A wardrobe the player can hide in. Clothes on a chair: a spare sweater vest. Under the bed: a shoebox full of photos and the yellow key in Act 1. A framed picture above the bed of the neighbor with a woman and two kids, all smiling, in bright cartoon style.

**Kid's room (locked with the blue key):** frozen in time. A small bed with a race-car frame, toys scattered on a rug shaped like a road map, a toy chest, shelves of stuffed animals that are slightly too big, a mobile of planets spinning slowly over the bed, wallpaper with clouds. A child-sized mannequin sits on the bed facing the wall. This is the creepiest room in the game and nothing jumps out. It's just quiet. The music drops out here and only the mobile's soft tinkling plays. This room holds the crowbar on a high shelf (reachable by stacking toys and the toy chest).

**Bathroom upstairs:** bright yellow tile, a huge clawfoot tub, an overflowing medicine cabinet, a laundry hamper.

**Study / workshop:** desk with a typewriter and stacks of paper, blueprints of the house pinned to the wall (and they show more rooms than the player has found). A drafting lamp. Shelves of tools: hammer, wrench, saw (decorative), a big jar of nails. A model of the neighborhood on a table, with a tiny version of the player's house that has a red X on it. The red key lives here at the start of Act 1, on a green table by the window.

**Balcony door:** leads out to the second-floor balcony (the roof-route entry).

### 9.3 Third floor and above

**Mint wing landing:** reached by a steep, narrow staircase that turns twice. A wobbly, dusty space with boxes stacked to the ceiling, a dressmaker's dummy, a rocking horse that rocks on its own sometimes, old suitcases. One wall has a door with a purple lock (purple key) into the purple room.

**The purple room:** purple painted walls, empty except for a single chair in the middle facing a television on the floor that plays a looping clip of a carnival, and a radio on a stool. The gold-colored "workshop key" hangs on a hook by the door. The floor here has a trapdoor down into a narrow vertical shaft with a ladder that drops into the mudroom ceiling. This is the shortcut route.

**Tomato-red bolted-on room:** reached only by crossing a narrow plank bridge from the mint wing's window (outside! high up! exciting!) or through a locked door from the purple room (green key). Inside: a workbench, a collection of security monitors (static), a box of bear traps, a camera tripod, and a magnet tool (the magnet gun that lets the player pull metal objects toward them from a distance).

**Attic tower:** a tiny triangular room at the top with a single bulb, a trunk, and a telescope pointed at the player's house. The trunk contains the clue to the basement puzzle.

### 9.4 Room dressing density

Hello Neighbor's rooms are cluttered but readable. Aim for 25 to 60 props per room. Mix big anchor pieces (bed, sofa, wardrobe) with mid-sized props (lamps, chairs, boxes) and small clutter (cans, cups, books, toys). At least 40 percent of the small and mid-sized props should be physics objects the player can pick up and throw. Clutter makes noise when knocked over, which matters for stealth.

Use instancing (InstancedMesh) for repeated small items: books, cans, plates, nails, toys.

---

## 10. PROP BIBLE

Every prop follows the doctrine: chunky, beveled, saturated, warped. Here are specific builds for the most important and most numerous props. Build each as a function in `world/props/` that returns a `Group` and optionally registers a physics body and interaction metadata.

### 10.1 Furniture

- **Wardrobe (hideable):** 1.2 w by 2.4 h by 0.7 d. Rounded box body, tapered 1.12 at top. Two doors with big round knobs. A decorative crown molding on top that overhangs. Lean 2 degrees forward. Wood mid color with darker panel insets. Doors open with a creak. When the player is inside, a slatted "view through the door crack" overlay appears (horizontal dark bars with light between them), and the camera is locked to slight head movement.
- **Bed:** frame of thick rounded planks, headboard 1.6 m tall with a scalloped top edge made with ExtrudeGeometry from a curved shape. Mattress is a bulged rounded box. Quilt is a slightly smaller rounded box draped over (sag the edges downward). Pillows are bulged, flattened spheres. Under-bed space hideable.
- **Sofa:** base rounded box, seat cushions as three separate bulged boxes, back cushions as three more, arms as fat rounded cylinders on their side. Orange. Legs are short tapered wooden stubs.
- **Armchair:** same language, one seat.
- **Dining table:** thick top (8 cm), rounded corners, four fat turned legs built with LatheGeometry using a bulbous profile (thick, thin, thick bulb, thin, foot).
- **Chairs:** tall backs (1.2 m), spindle backs with 4 fat rounded spindles, seat cushions. Throwable.
- **Bookshelf:** 2.4 m tall, leaned forward, books as instanced rounded boxes in random bright colors and slightly random heights and tilt (some books lean on others).
- **Tables, nightstands, desks:** thick tops, tapered legs, drawer fronts with round knobs.
- **Lamps:** floor lamp with a curved stem, drum shade glowing; desk lamp with a bendy arm; table lamp with a bulbous ceramic base in bright colors.
- **Grandfather clock:** see hallway. Animated pendulum.
- **TV:** boxy wooden cabinet, curved glass screen (a slightly bulged plane), two rabbit-ear antennae on top (long thin tubes, but chunky: 2 cm thick). Screen material is an animated canvas texture showing either static, a test pattern, or crude moving cartoon shapes.
- **Fridge:** bulged, mint, rounded, huge chrome handle. Openable door with shelves inside.
- **Stove:** four burners, an oven door that opens, a chunky kettle that whistles.
- **Washing machine:** bulged cube, round porthole door that opens, a dial on top. Act 1 secret passage.

### 10.2 Throwables and clutter (all physics)

Each has a mass, a "noise" value (how loud it is when it hits something), and a "throw" value (how far it flies). These matter for gameplay.

- Cardboard box (small, medium, large). Medium and large are stackable and climbable. Cardboard with tape stripe. Mass 2 to 6 kg, soft thud noise.
- Wooden crate. Heavy, 10 kg, loud clunk, climbable.
- Paint can. Colored lid, wire handle. Clank noise.
- Soda can. Bright red or green. Tink noise, rolls.
- Apple, banana, cartoon chicken leg. Squishy thud.
- Glass bottle. Breaks on hard impact with a crash (loud, draws the neighbor), splitting into shards.
- Mug, plate, vase. Ceramic. Break with a shatter sound.
- Toy car, toy block, rubber duck (squeaks when thrown), toy ball (bounces a lot).
- Books. Thwap noise, open mid-air with the pages flapping (just rotate the two halves a little).
- Alarm clock. Can be set to ring as a lure.
- Radio. Can be turned on as a lure.
- Traffic cone (from the street).
- Brick (from the chimney rubble pile in the back yard). Breaks windows reliably.

### 10.3 Tools and key items

- **Keys:** large, cartoonishly big (25 cm long), with a round bow, a long shaft, and a chunky bit. Each one is a solid bright color with a white-ish rim light and a slow 1 Hz emissive pulse. When on the floor they bob very slightly. When picked up, a satisfying jingle and a little pop of sparkles.
- **Crowbar:** red, chunky, 70 cm. Used to pry boards off doors and windows.
- **Wrench:** blue, chunky. Used to turn valves and unbolt things.
- **Magnet gun:** a red horseshoe magnet mounted on a handle with a battery pack. Pulls metal items toward the player from up to 12 m away with a "whirr-clunk."
- **Flashlight:** a yellow chunky torch. Toggles a spotlight with soft edges.
- **Lock pick:** a little set. Opens a specific small lock.
- **Glue gun / bucket of glue (the neighbor's tool):** not for the player in Act 1.
- **Ladder:** see 8.2.
- **Plank:** wooden board, can be used as a bridge between two points by placing it.

---
## 11. MR. GRIMSBY: THE NEIGHBOR (CHARACTER BIBLE)

He's the reason people play. If he's not right, the game is dead. He needs to be funny, unsettling, sad, and threatening, sometimes all in the same second.

### 11.1 Character concept

Harold Grimsby is a middle-aged suburban dad who lost something terrible years ago and turned his grief into secrecy, carpentry, and paranoia. He's not a monster. He's a man who has built an entire house around a locked door. On the surface he's a cartoon: a round-bellied, mustached, sweater-vested, sunburned-nosed caricature of a 1960s American suburban father. Underneath, his eyes are always a little too wide and his smile never quite reaches them.

He should feel like a children's TV character who's been awake for three days.

### 11.2 Silhouette (the most important thing)

Read from 30 meters away, in pure black silhouette, he must be instantly identifiable. The silhouette is:

- A very big, slightly egg-shaped head (wider at the cheeks and jaw than at the top), about 1.35 times what a realistic head would be for his height.
- Big ears that stick out slightly.
- A broad, curling mustache that extends past the sides of his face.
- A thick neck that goes almost straight into sloped shoulders.
- A pear-shaped torso: narrowish chest, wide round belly, wide hips. The sweater vest stretches over the belly.
- Long arms that hang lower than normal, ending in big black-gloved hands, the gloves reaching nearly to the elbow, so the forearms look heavy and dark.
- Fairly short, sturdy legs with big rounded shoes.
- A slight forward stoop.

Overall height 2.05 m including hair. Head is about 0.42 m tall (from chin to top of hair) and 0.36 m wide at the cheeks. Shoulder width 0.58 m. Belly depth 0.42 m. Arm length shoulder to fingertip 0.95 m. Legs from hip to sole 0.85 m.

### 11.3 Building him from primitives

Build the neighbor as a hierarchy of `Object3D` "bones" with meshes parented to them. No skinning needed. Rigid parts with joints work fine for this style and are far easier to animate procedurally. To hide the seams between parts, overlap them generously and put fat rounded caps at joints (sleeves cover elbows, gloves cover wrists, vest hem covers the belt line, trouser cuffs cover the ankles).

Hierarchy:

```
root (at feet, between them)
  hips
    torso (spine)
      chest
        neck
          head
            jaw (subtle)
            nose
            mustacheL, mustacheR
            eyeL (white, iris, pupil, upper lid, lower lid)
            eyeR
            browL, browR
            earL, earR
            hair
        shoulderL
          upperArmL
            forearmL
              handL (glove) with fingers group
        shoulderR (mirror)
    thighL
      shinL
        footL
    thighR (mirror)
```

Part-by-part build:

**Head:** a sphere, scaled (1.0, 1.15, 1.0), then deformed so the lower half is wider (a taper in reverse: bottom scale 1.12, top 0.94). Flatten the back slightly. Skin color with toon material, rim light strength 0.4. Add a very faint subsurface feel by mixing the shadow tint toward warm pink `#C97A6A` instead of the usual brown on skin only.

**Face layout (proportions on the front of the head):** The face is low on the head. The eyes sit at about 52 percent of head height from the chin, which is lower than you'd expect, leaving a big, high forehead. The nose sits between 30 and 50 percent. The mustache sits at about 28 percent. The mouth is mostly hidden by the mustache. The chin is wide and soft.

**Eyes:** This is where most of the personality is. The eyes are large, round, slightly bulging spheres (each about 7 cm diameter) set into the face, with the white `NB_EYE_WHITE`, a large green iris disc `NB_IRIS` (about 55 percent of the visible eye), and a black pupil. Pupils can dilate (scale 0.6 to 1.4). Each eye has an upper and lower eyelid: half-sphere shells in skin color that rotate to cover the eye. Default lid position: upper lid covers the top 20 percent of the eye (gives a heavy, tired, suspicious look). When surprised, lids snap wide open, showing white all around the iris. When angry, upper lids drop and tilt inward. Blink every 3 to 6 seconds randomly (120 ms). Add dark, slightly purple-tinted bags under the eyes: a subtle crescent decal (canvas texture or small flattened torus) in `#C49A8C`. Eyes always track the player when the player is in view: rotate each eye's iris/pupil group toward the player's head position, clamped to 35 degrees. This eye tracking is enormously creepy and very important. Even in idle or patrol, if the player is visible, the eyes follow before the head does.

**Eyebrows:** big, thick, dark brown, made of a bent, tapered tube (or a flattened, rounded box curved with a bend warp). Each is about 9 cm long and 2.5 cm thick. Default angle: slanting down toward the nose (inner ends lower), which gives him a permanently grumpy, suspicious expression. Brows animate: raised and arched for surprised, sharply angled down for angry, inner ends raised for sad (used in the Act transition dream).

**Nose:** a big, bulbous, round nose, almost a ball (8 cm diameter, scaled 1.0, 0.9, 1.1), slightly upturned, colored `NB_NOSE`, ruddier than the rest of the face. It gets the plastic specular blob so it looks slightly shiny and sweaty. When he runs, it gets a little redder (lerp toward `#E07A6A`).

**Cheeks:** subtle blush circles under the eyes (decals or a vertex-color gradient), `NB_CHEEKS`.

**Mustache:** his signature. A thick, wide, bushy mustache that sweeps out to both sides and curls upward at the tips. Build each half from a TubeGeometry along a curve: start under the nose, sweep outward and slightly down, then curl up into a little loop at the end. Tube radius tapers from 2.2 cm near the center to 0.8 cm at the curled tip. Total mustache span about 26 cm, wider than the face at that height. Color `NB_MUSTACHE`. Add a little wobble to the tube. The mustache bounces slightly when he talks, runs, or lands (spring physics on each half: a simple damped spring rotation).

**Mouth:** mostly hidden. Under the mustache, a dark mouth shape that opens for "talking" grunts, gasps, and the catch-scream. When open, you see a dark red interior and a hint of a white upper tooth row. For the catch moment, the mouth opens wide (jaw drops) under the mustache.

**Ears:** large flattened half-ellipsoids, skin color, slightly pinker inside, angled outward 20 degrees.

**Hair:** dark chestnut brown. Short and neat on the sides, swept back on top with a bit of volume, and a single unruly curl springing up at the crown that bobs when he moves. Build the hair as a slightly larger, squashed hemisphere over the top and back of the head, with the bottom edge cut in a wavy line, plus a few clumps (deformed spheres) at the temples. Sideburns connect down to just above the ears. Thinning slightly at the temples, so a little more forehead shows on the sides. The curl is a small TubeGeometry spiral on a spring.

**Neck:** thick, short, cylinder, mostly hidden by the shirt collar.

**Shirt:** mustard yellow dress shirt, visible at the collar (a pointed-collar shape, two flattened triangles that fold out over the vest neckline) and at the sleeves. Sleeves are rolled up to just below the elbow: model the roll as a fat torus around the forearm. Below the roll, the forearm is covered by the long black rubber glove.

**Sweater vest:** the most iconic piece of clothing. A sleeveless, V-neck knit vest over the shirt. Navy-and-light-blue argyle diamonds with thin cream cross-lines (the canvas texture from 5.3). The vest has ribbed bands at the V-neck, the armholes, and the hem: model these as slightly raised, slightly darker navy bands with tiny vertical stripe texture. The vest stretches over the belly: apply `bulge` to the torso. The hem sits just below the belly and the belt shows below it slightly. The vest is a bit too tight; you see a small gap where the shirt pokes out at the bottom.

**Trousers:** warm brown with a faint darker plaid (canvas texture), high-waisted, held by a dark brown belt with a brass buckle. Legs are slightly flared and a little short, showing a sliver of dark sock above the shoes. Trouser legs are tapered cylinders, chunky.

**Gloves:** long black rubber gardening gloves, almost to the elbow. Glossy (specular blob plus higher rim). Hands are big: palm 12 cm wide. Fingers: four fat sausage fingers plus a thumb, each a capsule with two segments so they can curl. Default pose: slightly curled. When he reaches for the player, fingers splay wide. When holding items, fingers wrap. A ribbed cuff at the top of each glove (a slightly flared ring).

**Shoes:** big, round-toed, dark brown leather shoes, almost clown-like in their roundness but not comically huge: about 32 cm long. Rounded box body, sole as a slightly wider, darker slab. Laces as a few little tubes on top.

**Belly:** gives him his pear shape. When he runs, the belly has a slight jiggle (spring on the torso scale.y and scale.z, small amplitude).

### 11.4 Material and rendering for the neighbor

- Toon material with the same gradient map as the world, but with stronger rim light (0.4) so he separates from busy backgrounds.
- Inverted-hull outline on every part of him, 2 cm, color derived from each part's base color multiplied by 0.25 and pushed toward `#2A1E3A`.
- He casts shadows. He receives shadows.
- A subtle "presence" effect: when the player is within 6 m of him and looking at him, very slightly increase his rim strength and outline thickness. He should feel more vivid, more there, than anything else in the scene.
- When he is out of sight but close, the player hears him before they see him (see audio).

### 11.5 Personality through motion

He moves like a big man who is surprisingly fast and slightly unhinged.

- **Idle:** weight shifts from foot to foot every few seconds. He breathes visibly (chest and belly scale 1.0 to 1.02 on a 3.5 s cycle). Occasionally he checks his wristwatch (lifts left arm, glances down, under the glove? No: he wears a watch over the glove, a chunky gold watch). He scratches his mustache. He looks around slowly, eyes leading the head. Sometimes he hums a tune (procedural).
- **Walk (patrol):** a heavy, slightly waddling walk. Hips sway side to side 4 degrees. Torso counter-rotates. Arms swing low and wide, gloves hanging heavy. Head bobs slightly. Stride 0.75 m, cadence 1.7 steps per second. Speed about 1.4 m/s.
- **Suspicious walk:** slower, hunched lower, head forward, eyes darting. Arms slightly out. He leans around corners before committing: stops at doorways, leans the torso 20 degrees to peek, then continues. Speed about 1.0 m/s.
- **Run (chase):** this must look ridiculous and terrifying at once. Big lunging strides, arms pumping wildly with gloved hands open and fingers splayed, torso pitched forward 25 degrees, head forward with the face fixed on the player, eyes wide, brows down, mouth slightly open, mustache flapping, belly bouncing. Speed about 5.6 m/s, slightly faster than the player's sprint (5.2 m/s) so the player has to use doors, obstacles, and hiding to escape. Accelerates over 0.6 s from walk. He cuts corners hard, slightly overshooting turns (a little skid) which gives the player a chance.
- **Search:** opens wardrobes, crouches to look under beds, pulls the shower curtain, pokes his head into cabinets. Each search action is a short, readable animation (about 1.5 s) with anticipation: he pauses, reaches, yanks open, peers in, exhales. If the player is in that spot, it's a catch.
- **Catch:** when he reaches within 1.1 m of the player during a chase and has line of sight, trigger the catch sequence (see 13.6). His arms reach forward, fingers spread, his body lunges, his face fills the screen.
- **Place trap:** kneels down (one knee), sets a bear trap on the floor, pries the jaws open with both hands, steps back with a satisfied little nod. Sets a camera: stands on tiptoes, screws it into the wall mount above a window, adjusts the angle, taps it twice.
- **Board up:** holds a plank against the window, hammers three nails with exaggerated hammer arcs, each with a loud bonk.
- **Throw:** in Act 2 and beyond (or Hard mode), he throws glue jars or objects at the player: big wind-up, spins slightly, throws overhand.
- **Drink:** at the kitchen, he pours a glass of milk and drinks it, head tilted back, mustache getting a white line. It's a funny, human idle beat that gives the player a window to sneak past.
- **Watch TV:** sits in the green armchair and watches TV; if the player is quiet, he can doze off (head slumps, a cartoon snore).
- **Hear noise:** freezes mid-step, head snaps toward the sound, eyes wide, one hand lifts slightly. Holds 0.5 s. Then commits to investigate.
- **Spot player:** the "spotted" reaction is a sharp head snap toward the player, a full-body startle (small hop), and a short shout. Then the chase music hits.
- **Lost player:** stops, turns 360 slowly, mutters, kicks something nearby in frustration, then walks back to patrol.

Implement animations procedurally in code using pose keyframes on the bone hierarchy with smooth blending (slerp rotations, lerp positions). Write a tiny pose system: `poses = { idle, walkA, walkB, runA, runB, reach, crouch, kneel, peek, ... }` as plain objects of bone rotations, then a blender that crossfades between them over time, plus a layered system so the head and eyes can track the player independently of the body. Add secondary motion with damped springs: the mustache halves, the hair curl, the belly, and the arms trailing slightly behind fast torso turns. That secondary motion is the difference between "puppet" and "alive."

### 11.6 Facial expression presets

Drive expressions by setting targets for brows, lids, pupils, mouth, and nose color, blending over 0.15 to 0.3 s:

- **Neutral-suspicious** (default): brows angled down inward, upper lids at 20 percent, pupils 1.0, mouth closed.
- **Curious:** one brow raised, head tilted 10 degrees, pupils 1.1.
- **Alarmed:** both brows high, lids wide open, pupils 0.7 (pinprick), mouth slightly open.
- **Angry / chasing:** brows sharply down, lids at 35 percent, pupils 1.2, mouth open, nose redder.
- **Satisfied:** brows relaxed, eyes half-closed, a tiny lift of the mustache corners (implying a smirk).
- **Sad:** inner brow ends raised, eyes glistening (add a small, bright specular highlight), head down. Used rarely, in the Act 1 ending and in dream sequences. This is what makes the character memorable: once, briefly, you see that he's sad.
- **Sleepy:** lids at 80 percent, head drooping.

### 11.7 His voice

He doesn't speak words. Generate his vocalizations procedurally in Web Audio with formant-ish synthesis (a sawtooth or pulse oscillator through two or three band-pass filters, with a pitch envelope):

- "Hm?" when hearing a noise: short rising pitch.
- "Hey!" when spotting the player: sharp, loud, two-syllable bark.
- Grunts during the chase, synced to footsteps.
- Heavy breathing when near the player and chasing: filtered noise in rhythm.
- A low muttering (randomized babble) when searching or giving up.
- Humming while idle: a slightly off-key simple melody using a sine with vibrato.
- A loud, distorted, startled "AAH!" at the moment of the catch, layered with a bass hit.
- A little satisfied "hmph" after setting a trap.

Footsteps: heavy, loud, with a wooden thump on floors and a softer thud on grass and carpet. Players should be able to track him through walls by sound alone. Footstep volume is spatialized with a PannerNode (HRTF if available).

---
## 12. THE NEIGHBOR'S AI

The selling point of the original game was an AI that "learns." In practice that meant a set of simple, readable adaptations. Do the same: simple systems, combined, that feel smart. Never make him omniscient. The player must always be able to understand, after the fact, why they got caught.

### 12.1 Navigation

Use a hand-authored waypoint graph (NavGraph.js). Place nodes at every doorway, stair top and bottom, room center, hiding spot, window, and points of interest. Connect them with edges that store cost and type (walk, stairs, door, ladder). Use A* to path between nodes. For the last stretch to the player, steer directly toward the player's position with simple obstacle avoidance (raycasts forward and at 30 degrees left and right).

He opens doors by walking through them: the door swings open with a bang (apply an impulse to the hinged door body). He can climb stairs and ladders. He cannot climb crate stacks; the player can use that to escape onto roofs and high places, but he'll wait below, then go get the ladder.

The neighbor also goes outside: he patrols the front yard and back yard on some routes and will chase the player across the street, right up to the player's own front door (he stops at the property line and stares, breathing heavily, for an unsettling 5 seconds before walking back).

### 12.2 Senses

**Sight:** a vision cone from his head: 110 degrees wide, range 22 m in daylight, 14 m indoors in dim rooms, 8 m in dark rooms. Visibility is checked with raycasts from his eyes to five points on the player (head, chest, hips, left, right). If the player is crouched, behind cover, or in shadow, reduce the effective range. Use a detection meter rather than instant spotting: it fills at a rate based on distance, how many points are visible, whether the player is moving, and whether they're crouched. At 100 percent he spots them. A peripheral zone (the outer 25 degrees of the cone) fills the meter at 35 percent speed.

**Hearing:** every sound event in the game has a loudness and a position. Footsteps (running is loud, walking is medium, crouch-walking is nearly silent), objects hitting the floor, glass breaking (very loud), doors slamming, the kettle, the alarm clock, the radio, the TV. If a sound's loudness, attenuated by distance and by walls (each wall between him and the sound halves it), exceeds his hearing threshold, he investigates. Very loud sounds (glass breaking) are heard anywhere in the house and the yard.

**Memory:** he remembers the last place he saw or heard the player for 20 seconds and searches there.

### 12.3 State machine

States, with clear transitions:

- **Patrol:** follows one of several routes between rooms and outdoor points, stopping to do idle activities (drink milk, watch TV, check the window, tinker in the workshop, water the plants in the yard). Routes have randomized timing so he isn't a clock.
- **Investigate:** walks briskly to a heard sound or a suspicious change (an open door that should be closed, a moved object, a broken window). Looks around at the spot, 4 to 8 seconds.
- **Suspicious:** the detection meter is partly full. He slows, turns toward the player's location, leans, eyes narrow. If the meter drops, he returns to patrol after a mutter.
- **Chase:** he's spotted the player. Runs directly at them via pathfinding. Chase music plays. If he loses sight for 4 seconds, he goes to the last known position.
- **Search:** at the last known position, he checks nearby hiding spots in order of proximity, randomly skipping some (so hiding is a gamble, not a guarantee). Checks 2 to 4 spots, then gives up.
- **Catch:** triggered by reaching the player.
- **Set Trap / Adapt:** when the learning system decides to place a counter-measure, he walks to the location and installs it (only when the player isn't in the house or isn't nearby, so the player often discovers new traps on their next attempt).
- **Stunned:** if the player hits him in the head with a thrown object while he's not chasing, he flinches, grabs his head for 1 second, and then immediately goes into Chase with extra fury. Hitting him with something is a laugh, not a solution.

### 12.4 The learning system (NeighborBrain.js)

Track player behavior with simple counters, persistent across catches within a run:

- `entryCounts[entryPointId]`: how many times the player has entered the house through each window, door, balcony, tree branch, or roof route.
- `roomVisits[roomId]`: how long and how often the player spends time in each room.
- `hideSpotUses[hideSpotId]`: how many times the player has hidden in each spot.
- `throwCount`, `windowBreaks`, `lureUses[type]`.

Adaptations triggered by thresholds:

- Entry point used 2 times: next time the neighbor is idle, he places a **bear trap** just inside that entry point. Bear traps are big, bright, chunky metal jaws on a round plate, obvious if you're looking but easy to miss if you're rushing. Stepping in one snaps it shut with a loud clang, holds the player for 3 seconds (they must mash a key to escape), and makes a huge noise that summons the neighbor.
- Entry point used 3 times: he installs a **security camera** pointed at it. The camera is a boxy grey camera on a wall mount with a red blinking LED and a visible pale-red cone of light (a translucent cone mesh) showing its field of view. If the player is seen by a camera, an alarm beeps and the neighbor is alerted to that position.
- Entry point used 4 or more times: he **boards it up** with planks (requires the crowbar to remove) or **locks** it (if it's a door).
- Hiding spot used 3 times: he checks it first during every search.
- Room visited a lot: he adds that room to his patrol route with higher priority.
- Lure used 2 times (alarm clock, radio, kettle): he becomes less responsive to that lure type. The third time, he ignores it and looks around suspiciously instead.
- Windows broken 3 or more times: he places **glue traps** (a sticky green puddle that slows the player to 30 percent speed) under windows.

When he adapts, give the player a moment to notice: on their next respawn, play a short establishing shot (2 seconds, skippable) from the player's bedroom window showing the neighbor carrying planks or a camera into his house. This tells the player "he learned something" without words.

The brain should cap the number of active counter-measures (for example 6 traps, 4 cameras, 3 boarded entries) so the house never becomes impossible. Show the player a subtle hint that a route is closed (planks are bright and visible from outside).

### 12.5 Difficulty

Easy, Normal, Hard. They scale the neighbor's run speed (5.0, 5.6, 6.0), sight range, detection meter fill rate, hearing threshold, adaptation thresholds, and on Hard he also throws glue jars at the player during chases.

---

## 13. THE PLAYER AND GAMEPLAY

### 13.1 Controls

- Mouse look with pointer lock. Sensitivity setting. Invert Y option.
- WASD move. Shift sprint (with a stamina bar that drains in about 6 seconds and recovers in about 4). Ctrl or C crouch (toggle or hold, configurable). Space jump.
- Left click: interact / pick up / use held item. Holding left click with a throwable charges a throw (a little arc indicator appears; charge 0 to 1 over 0.8 s).
- Right click: drop the held item / cancel.
- 1 to 4 or mouse wheel: switch inventory slot.
- E as an alternate interact key.
- Esc pauses.
- Gamepad support with sensible defaults.

### 13.2 First-person feel

- FOV 85 by default (configurable 70 to 100). During sprint, ease FOV up by 6. During chase, add 4 more and a subtle camera shake.
- Head bob: gentle vertical sine (2 cm amplitude walking, 4 cm sprinting), slight horizontal sway, synced to footsteps. Disable option for motion sensitivity.
- Landing from a jump: small camera dip and a thud.
- Leaning around corners: Q leans left, Z leans right (E stays interact). Lean the camera 0.35 m sideways and roll 8 degrees.
- Player hands are visible: two chunky, cartoon hands (rounded, peach skin, slightly oversized, with a blue sleeve cuff) at the bottom of the screen. The held item appears in the right hand. Hands animate: reach out when interacting, pull back when charging a throw, snap forward when throwing, wave a little when sprinting. This adds a lot of charm.

### 13.3 Inventory

Four slots, shown at the bottom center as rounded square slots with a cartoon icon of each item (render a mini 3D preview into a small render target, or draw simple 2D canvas icons). Selected slot is bigger with a bright yellow border. Keys don't take up slots: they go on a separate keyring shown in the top-left as colored key icons.

### 13.4 Physics interaction

- Picking up: raycast 2.2 m from the camera center. Highlight interactables under the crosshair with a soft white outline pulse and a small floating prompt ("Pick up," "Open," "Hide," "Use crowbar").
- Carrying large items (crates, ladders, planks) is done physically in front of the player and slows them to 70 percent speed.
- Throwing applies an impulse along the camera direction plus a small upward bias. Throws are fun and loud.
- Stacking: crates and boxes stack with real physics and the player can jump onto them. Make the player controller handle stepping onto boxes (Rapier character controller with autostep and snap to ground).

### 13.5 Hiding

Wardrobes, under beds, behind the shower curtain, inside the big laundry hamper, inside a large cardboard box (the box can be picked up, put on the floor, and climbed into). While hidden: the view becomes constrained, the heartbeat audio increases if the neighbor is near, and the player can peek through slats. Hiding is safe unless the neighbor saw the player enter the spot or decides to check it (see search logic).

### 13.6 The catch sequence

This must be iconic. It's the game's signature moment, and players will see it a lot, so make it scary the first time and still fun the fiftieth.

1. Time slows to 30 percent over 0.15 s.
2. The camera is wrenched to face the neighbor (fast slerp over 0.2 s).
3. His face lunges toward the camera, filling the screen: eyes wide, pupils pinpoint, brows down, mouth open under the mustache, arms coming up from below the frame with splayed black-gloved fingers.
4. A loud stinger: a sharp orchestral-style hit (synthesized), his "AAH!", a bass drop.
5. Hard cut to black with a ringing tone.
6. Fade in at the player's bed with a gasp sound, slightly desaturated, then color returns over 1.5 s.

The whole thing takes about 1.8 seconds. Add a setting to tone it down (no lunge, gentler sound) for younger or jump-scare-sensitive players.

After a catch: the neighbor goes back into his house. Items the player was carrying drop where they were caught. Keys already collected stay collected. Doors the player opened stay open (he may close some). Broken windows stay broken until he boards them.

### 13.7 Act 1 progression and puzzles

Make this a real, solvable chain. Here's the intended path, with alternatives where noted:

1. **Intro:** the player is a kid who just moved in (never seen, it's first person). Short cutscene from the bedroom window: the neighbor, at dusk, drags a big lumpy sack across his yard to the cellar doors, looks around, sees the player in the window, and stares. Cut to bright afternoon, the next day. Objective text: "Find out what's in the basement."
2. **Get inside:** front door locked. Side kitchen door unlocked at first. Windows breakable. Roof route available via crates. Tree branch route available.
3. **Red key:** on the green table in the study (second floor). It opens the red-locked door at the end of the second-floor hallway, leading to a utility closet containing the crowbar's location hint and a toolbox with the **wrench**.
4. **Wrench:** used on the valve in the back yard to drain the scummy kiddie pool, revealing the **blue key** at the bottom.
5. **Blue key:** opens the kid's room. Inside, stack toys and the toy chest to reach the high shelf and get the **crowbar**.
6. **Crowbar:** pry the boards off the purple-room stair door on the third floor (or off the boarded tree-branch window if he boarded it). In the purple room, grab the **green key** from the hook (alternate: pull it with the magnet gun later).
7. **Green key:** opens the tomato-red bolted-on room. Get the **magnet gun**. Optional: watch the security monitors, which show the basement door, the kitchen, and the yard, giving the player intel on where the neighbor is.
8. **Magnet gun:** pull the **attic key** off a hook visible through a gap high in the stairwell. Go up to the attic tower. In the trunk, find a note with a drawing of the washing machine and three numbers.
9. **Basement puzzle:** in the mudroom, set the washing machine dial to the three-number sequence. It shudders, slides aside, and reveals a narrow staircase going down to a short tunnel ending at the back of the basement door from the hallway side, where the final **orange basement key** hangs on a nail behind a cage. Use the magnet gun or the wrench to open the cage.
10. **Final run:** with the orange key in hand, the neighbor is on high alert (the game deliberately puts him in the hallway). The player must lure him away (the kettle, the alarm clock, the radio, the TV, smashing something on the far side of the house) and then unlock the basement door: three locks, a chain, and the padlock, with a short "unlock" animation of 3 seconds during which the player is vulnerable.
11. **Act 1 ending:** the basement door swings open. The cyan-green light floods out. The player walks down a long, too-long staircase that keeps going, while the music thins out to a single held tone. At the bottom is a small, ordinary-looking room with a child's drawing taped to a wall, a teddy bear on a chair, and a door at the far end. The player approaches the door; the neighbor's silhouette appears in the stairwell behind them; the screen cuts to black with the sound of a door slamming and a lock turning. Text: "ACT 1 COMPLETE." Then a teaser: "Act 2 coming soon." Show stats: catches, time, routes discovered, traps triggered.

Every step must be achievable by a first-time player with no outside help. Use environmental hints: drawings on the cork board, notes on the fridge, the blueprints in the study, the security monitors.

### 13.8 Dream sequences

Hello Neighbor's surreal dream bits are a big part of its style. Add one optional, short dream (60 to 90 seconds) that triggers the first time the player is caught three times in under five minutes. The player wakes "into" a dream version of the street at night using the dream palette: purple-to-magenta sky, the houses stretched twice as tall and leaning wildly, giant floating furniture, the road curling up into the sky like a ribbon, and the neighbor house as a giant silhouette on the horizon with a single glowing window. A giant version of the neighbor (5x scale) walks slowly across the background. The player must run toward the glowing window; reaching it wakes them in their bed. This sequence is all about the visual style turned up to 11: every warp parameter multiplied by four.

---

## 14. AUDIO

All procedural, Web Audio, with a master compressor and separate buses for music, SFX, ambience, and voice, each with a volume slider in Options.

### 14.1 Ambience

- Outdoors: gentle wind (filtered noise with slow LFO), birds chirping (short, randomized sine chirps with pitch sweeps), a distant lawnmower (a buzzy oscillator that fades in and out every couple of minutes), a dog barking once in a while far away, a sprinkler hiss near that house.
- Indoors: the grandfather clock ticking (spatialized), fridge hum in the kitchen, the TV babble in the living room, creaks in the walls, occasional muffled thump from the basement.
- Basement door area: a low drone with a sour, slightly detuned interval.

### 14.2 Music

Compose procedurally with a tiny sequencer:

- **Sneak theme:** a quiet, playful, slightly off-key music-box or plucked-string melody in a minor key, with pizzicato-like bass notes, at about 90 BPM. It sounds like a children's lullaby that's gone slightly wrong. Instruments: a triangle-wave pluck with fast decay, a soft sine bass, a light shaker (filtered noise ticks).
- **Suspicion layer:** when the detection meter fills or the neighbor investigates, add a low, pulsing string pad (detuned sawtooth through a lowpass) and a ticking hi-hat. Crossfade in over 1 second.
- **Chase theme:** sudden, frantic, comic-horror: fast 160 BPM, staccato low strings (sawtooth with short envelope), a driving kick, a two-note "dun-dun" bass motif, a screeching high violin-like line with heavy vibrato. Hard cut into it with a stinger when he spots you. Slowly fade back to sneak theme 4 seconds after he loses you.
- **Title theme:** the sneak melody played slower on a music box, with a soft wind bed.
- **Kid's room:** music drops out; only the mobile's tinkle and room tone.

### 14.3 SFX list

Footsteps per surface (wood, carpet, tile, grass, concrete, metal) for both player and neighbor, door creaks and slams, glass break, object impacts by material, key pickup jingle, item pickup pop, inventory switch click, bear trap snap, camera beep and alarm, hammering, crowbar pry (squeal and crack), magnet whirr, washing machine shudder, kettle whistle, alarm clock ring, radio static and music, toaster ping, rubber duck squeak, heartbeat, breath, the catch stinger, the gasp on waking, UI hover and click sounds.

---

## 15. UI AND MENUS

Visual language for UI: chunky, rounded, hand-made, a little wonky. Use a bold rounded display font (load a Google Font like "Luckiest Guy" or "Bangers" for headings and "Nunito" for body). Buttons are rounded rectangles with a thick darker border, a drop shadow offset down-right, and a slight random rotation (plus or minus 1.5 degrees) so they look cut out and glued on. On hover they wobble and scale up 6 percent.

**Title screen:** a slow camera drift across the neighbor's house at golden hour, with the attic window glowing. The logo "NOSY NEIGHBOR" in big fat letters, the two words slightly misaligned, the "O" in NOSY replaced by a cartoon eye whose pupil follows the mouse cursor. Buttons: Play, Continue (if a save exists), Options, Credits. Tiny version number in the corner.

**HUD:** minimal. A small crosshair dot in the center that turns into a hand icon over interactables. The inventory bar at bottom center. The keyring top-left. An objective line top-center that fades in when it changes, then fades out. A stamina bar that only appears when stamina isn't full. No minimap, no neighbor marker. A detection indicator: a small eye icon at the top of the screen that opens as the detection meter fills, and turns red at full. Optionally, a directional "noise" indicator showing where the neighbor's footsteps are coming from (Easy mode only).

**Pause menu:** Resume, Options, Restart Act, Quit to Title. The background blurs and desaturates.

**Options:** Graphics (preset, render scale, shadows, outlines, bloom, film grain), Audio (master, music, SFX, ambience, voice), Controls (sensitivity, invert Y, crouch toggle, head bob, key rebinding), Gameplay (difficulty, reduced jump scare, subtitles for sounds), Accessibility (colorblind-friendly key shapes: each key also gets a unique shape on its bow: circle, triangle, square, star, heart, so color isn't the only cue).

**Subtitles for sounds:** optional captions like "[Footsteps above]", "[Glass breaking]", "[Neighbor: Hey!]".

**Save system:** autosave on key pickups and act milestones. Store in localStorage wrapped in try/catch. If storage is unavailable, the game still plays; it just won't continue later.

---

## 16. PERFORMANCE RULES

- Merge static geometry per room where possible (BufferGeometryUtils.mergeGeometries) grouped by material.
- InstancedMesh for books, cans, grass tufts, flowers, fence pickets, shingles (if modeled), nails, and other repeats.
- Cull rooms: divide the house into zones and toggle visibility of zones not visible from the player's current zone (simple portal-ish lookup table). Outdoors, distant small props are hidden beyond 50 m.
- Physics: put sleeping enabled on all dynamic bodies. Use simple colliders (boxes, capsules, convex hulls) not trimeshes for dynamic objects. Static architecture can use trimesh or merged box colliders.
- Cap shadow-casting objects: small clutter does not cast shadows.
- Cap active point lights at 8.
- Use a fixed physics timestep (1/60) with interpolation for rendering.
- Pool audio nodes for frequent sounds.
- Show an FPS counter in debug mode (toggle with F3).

---

## 17. DEBUG TOOLS

Bake these in from day one; they'll save you hours:

- F3: FPS, draw calls, triangle count, physics body count.
- F4: show the nav graph and the neighbor's current path.
- F5: show the neighbor's vision cone and detection meter value.
- F6: toggle neighbor AI on/off (freeze him).
- F7: noclip fly camera.
- F8: give all keys and items.
- F9: dump the NeighborBrain counters to the console.
- A `?debug=1` URL flag that enables these. Off in normal play.

---

## 18. BUILD ORDER (MILESTONES)

Build in this order. After each milestone, run the dev server, actually play it, take screenshots with Playwright (Chromium is available) from several fixed camera positions, look at them critically against this document, and fix what's off before moving on. Commit after every milestone with a clear message.

**Milestone 1: Foundations.** Vite project, Three.js renderer, Rapier physics, the game loop, input with pointer lock, config.js, Palette.js, the toon material factory with gradient map and tinted shadows, the rounded-box and warp helpers. A test scene: a grass plane, a few warped colored boxes, sky gradient, sun, fog, and a first-person controller that can walk, sprint, crouch, and jump. Screenshot it. Does it already look like a cartoon? If not, fix the materials before going further.

**Milestone 2: Post-processing and style lock.** Edge outline pass, bloom, color grade, vignette, grain. Inverted-hull outlines on a test character-sized capsule. Tune until a single warped box on grass looks like it belongs in the game. This is the style lock milestone. Do not skip it.

**Milestone 3: The neighborhood.** Street, sidewalks, lawns, fences, trees, bushes, lamp posts, power lines, the four flanking houses, the player's house (with interior), instanced grass. Clouds. Make the street feel like a diorama.

**Milestone 4: The neighbor's house exterior.** All chunks, roofs, chimneys, porch, windows with glare, shutters, the car on the fence, the back yard dressing. Screenshot from the player's porch, from the street corner, and from the back yard. It should look impossible and wonderful.

**Milestone 5: The neighbor's house interior.** All rooms, doors with physics hinges, locks, windows (breakable), stairs, ladders, props, hiding spots. Indoor lighting and god-ray cards. Zone culling.

**Milestone 6: Mr. Grimsby, the model.** Build him from primitives exactly per section 11. Expressions, eye tracking, secondary motion. Make a debug "character viewer" mode where he stands on a turntable and you can cycle expressions and poses. Screenshot him from the front, three-quarter, side, and in close-up. Compare against the character bible line by line.

**Milestone 7: Animation.** Pose system, blending, walk, run, idle, search, catch, trap-setting, board-up, drink, TV, hear-noise, spot-player, lost-player.

**Milestone 8: AI.** Nav graph, A*, senses, the state machine, the catch sequence, respawn.

**Milestone 9: Gameplay systems.** Inventory, pickup, throw, stacking, hiding, keys, locks, tools (wrench, crowbar, magnet gun, flashlight), lures (kettle, alarm clock, radio, TV).

**Milestone 10: The learning brain.** Counters, adaptations (bear traps, cameras, boards, locks, glue), the "he's learned something" establishing shot.

**Milestone 11: Act 1 puzzle chain.** Implement and test the full progression from intro cutscene to the Act 1 ending. Play it through start to finish at least once with debug tools off.

**Milestone 12: Audio.** All ambience, music themes with transitions, SFX, voice.

**Milestone 13: UI and menus.** Title, HUD, pause, options, subtitles, saving.

**Milestone 14: Dream sequence and polish.** The dream, the gnome easter egg, the mail slot scare, the "GO AWAY" mat, balancing, performance pass on Low settings.

**Milestone 15: Deployment.** See section 19.

---

## 19. DEPLOYMENT: GITHUB TO RAILWAY

Ship this with my standard pipeline: GitHub repo connected to Railway, auto-deploying on push.

- Create a new GitHub repository named `nosy-neighbor` (or use the repo/branch I'm working in if I've specified one), push the project there.
- Add a production build: `npm run build` outputs to `dist/`.
- Add a minimal static server for production. Either a tiny Node `server.js` using Express or `sirv` that serves `dist/` on `process.env.PORT`, with gzip/brotli and long cache headers for hashed assets, or a Dockerfile that builds with Node and serves with a small static server.
- Add `railway.json` with the build and start commands (or rely on the Dockerfile) and a health check on `/`.
- Create the Railway project, connect it to the GitHub repo, set it to auto-deploy from the main branch, generate a public domain, and confirm the deployed URL loads the title screen and that Play works.
- Make sure Rapier's WASM file is served with the correct `application/wasm` content type.
- Report the live URL when done.

---

## 20. FINAL ACCEPTANCE CHECKLIST

Before you call this done, verify every line, and screenshot evidence where it's visual:

- [ ] Every mesh is procedural; no downloaded models, textures, or sounds.
- [ ] No trademarked names, logos, or assets from the original game appear anywhere.
- [ ] Every box-like object has beveled edges. No razor-sharp 90-degree corners visible.
- [ ] The neighbor's house visibly leans, is top-heavy, has at least five distinct stacked chunks in different colors, two chimneys, a car on a fence, and an attic tower.
- [ ] The player's house is noticeably straighter and calmer than the neighbor's.
- [ ] Doors in the neighbor's house are tall and narrow; ceilings are high; the player feels small.
- [ ] Colors are saturated and warm; shadows are tinted (blue-violet outdoors, warm indoors), never pure black.
- [ ] Windows show the diagonal cartoon glare stripes.
- [ ] Outline pass is visible but subtle and fades with distance.
- [ ] Mr. Grimsby is instantly recognizable in silhouette: big egg head, curly wide mustache, pear body, long arms, black gloves to the elbow.
- [ ] His eyes track the player. His brows default to suspicious. His mustache and hair curl have spring motion.
- [ ] He wears a mustard shirt with rolled sleeves, a navy/light-blue argyle V-neck sweater vest with ribbed bands, brown plaid high-waisted trousers with a brass-buckle belt, black rubber gloves, round brown shoes.
- [ ] His run is fast, lunging, arms-flailing, and both funny and scary.
- [ ] The catch sequence fills the screen with his face and lands hard.
- [ ] The AI uses sight with a detection meter, hearing with wall attenuation, and searches hiding spots.
- [ ] The learning system places bear traps, cameras, boards, and glue in response to repeated player behavior, and caps the total.
- [ ] Every room has two exits and at least one hiding spot.
- [ ] The full Act 1 puzzle chain is completable from intro to ending with debug off.
- [ ] Music shifts between sneak, suspicion, and chase themes cleanly.
- [ ] The game holds 60 fps on Medium on a typical laptop; Low is playable on weak hardware.
- [ ] All settings work, saving works, and the game still runs if localStorage is blocked.
- [ ] It is live on Railway via GitHub auto-deploy, and you've given me the URL.

---

## 21. FINAL NOTE ON TASTE

When this document doesn't cover a decision, ask yourself one question: "Would this look at home in a slightly broken children's picture book about a man who's hiding something?" If yes, do it. If it looks realistic, sleek, gritty, sterile, or generic-indie-low-poly, it's wrong. Make it chunkier, brighter, softer, and a little more crooked.

And give Mr. Grimsby one moment in the game where the player feels sorry for him. That moment is what people remember.

Now build it. Start with Milestone 1.
