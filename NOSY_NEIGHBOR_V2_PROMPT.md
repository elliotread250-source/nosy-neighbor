# NOSY NEIGHBOR V2: THE FULL MAP, THREE ACTS, ZERO GLITCHES

Paste this whole document into Claude Code as one message, in a session on the `nosy-neighbor` repo, with the permission mode set to Auto. Read every section before you write any code, including Appendices A, B and C at the end, which list every wall of every room in the three acts. Then follow the order in section 14.

This prompt is long on purpose. Most of it is description: what every place in the game looks like, down to where the furniture stands and what is wrong with it. The rest is the engineering contract that stops the map from glitching. Do both. A beautiful room that the player can fall through is a broken room, and a solid room with nothing in it is an empty one.

---

## 0. THE MISSION IN ONE PARAGRAPH

The first version of Nosy Neighbor is live and has problems. The street and the neighbor's house work in a technical sense, but the house is built from thin boxes with sparse furniture, some surfaces and props look wrong, the scene is heavy for ordinary laptops and phones, and only Act 1 exists as a real act. I want you to rebuild the map properly, so that it is complete, solid, dense, and glitch-free, and to build three full acts: Act 1 (the house in daylight), Act 2 (the underground), and Act 3 (the tower house, dusk into night, with the roof, the train, the windmill, and the birthday room). Everything has to be playable from the title screen to the final scene on an ordinary laptop in a browser, and on a recent phone on the Low setting. Then deploy it to a brand new Railway project, through my GitHub to Railway pipeline, and leave the old Railway project untouched.

The textures and the overall painted look are already good. Keep them. Do not redesign the palette, the toon shading, the outlines, or the character art. This job is about the map: its shape, its solidity, its density, and its three acts.

---

## 1. WHAT IS ALREADY THERE, AND WHAT I FOUND

You are not starting from nothing, so read this carefully before deciding what to keep.

### 1.1 Where the code lives

The finished first game is on the branch `claude/awesome-heisenberg-qcknm3` of the repo `elliotread250-source/nosy-neighbor`. The `main` branch only holds prompt documents and a README. The first thing you do is create a working branch called `v2` from the game branch:

```
git fetch origin claude/awesome-heisenberg-qcknm3
git checkout -b v2 FETCH_HEAD
```

Work and push on `v2`. Never push to `main` and never push to the old game branch. The old Railway project named `nosy-neighbor` deploys from the old game branch, and it must keep working exactly as it does now until I say otherwise.

### 1.2 The stack and the folders

Vite, Three.js 0.184, Rapier physics (WASM), Vitest for tests, Playwright for browser checks, a small dependency-free Node static server (`server.js`) and a Dockerfile, plus `railway.json`. The folders you care about:

```
src/game/      Game, Story, Devices, Interaction, Hiding, NeighborBrain, CatchSequence, Dream, Extras, SaveGame
src/world/     Neighborhood, PlayerHouse, Houses, NeighborHouse, NeighborPlan, NeighborInterior, NeighborYard,
               Architecture, Doors, Windows, Lighting, Lights, Zones, EndingSet, StoryClock, props/*, rooms/*
src/actors/    Player, Neighbor, NeighborAI, NeighborAnimator
src/art/       Palette, Materials, CanvasTextures, Geo, Warp, Outline, PostFX, Sky, GodRays, Bake
src/audio/     AudioEngine, Music, Sfx, Voice, Ambience, Synth
src/core/      Engine, Input, Physics, Events, SaveSystem
src/act3/      the separate Act 3 scale study (greybox, tagged dimensions, audit tools)
scripts/       playtest, walktest, smoke, screenshots and other Playwright checks
```

The debug flags that already exist: `?debug=1` exposes `window.nn` (the game object), `&gfx=low` picks the Low preset, `&notitle` skips the title screen, `&nointro` skips the intro cutscene, `&nopost` turns off post-processing.

### 1.3 The house plan that exists

The neighbor's house in Act 1 is defined in `src/world/NeighborPlan.js` as data: walls, openings, rooms, floor holes, and floor heights. The numbers in that file are the coordinates used everywhere else (stairs, doors, hatches, the story code). Keep them. They are repeated in section 8 of this document, room by room, so you can see what each room is supposed to contain.

```
house footprint     x[-8,8] z[-26,-14]   (front faces +z, toward the street)
F0 floor top        y 0.60   height 3.6
F1 floor top        y 4.50   height 3.4
F2 floor top        y 8.20   height 3.6   (mint wing, x[-7,2] z[-26,-18])
Tomato room         y 8.60   height 2.8   x[5,9] z[-23,-19]
Attic tower         y 12.0   height 4.4   x[-5,-2] z[-23,-20]
porch               z[-14,-11.2]
player house        x[-5,5] z[14,22]   floor y 0.30, walls 2.7 high
road                z[-3.5,3.5], sidewalks to |z| 5.7
neighbor lot        x[-17,17] z[-34,-5.7]
```

### 1.4 What I found when I looked at it

I ran the existing game locally in a headless browser, spawned the player in the middle of every major room, and took pictures from four directions. This is what I saw, and each item is work for you.

1. **The game starts and runs.** The title screen, the intro, the bedroom and the street all load without script errors. The floors held under the player in every room I tested. So the problems are not a simple crash, and you must hunt them properly (section 3).
2. **The rooms are sparse.** The living room I tested held one wardrobe, a door and a small toy. The dining room held two chairs and a cabinet. The design brief asked for 25 to 60 props per room. The rooms feel empty and boxy, and an empty room reads as a glitch even when nothing is technically wrong.
3. **Some surfaces are flat and unfinished.** A dining cabinet front is a single beige rectangle. Part of a kitchen cabinet shows dark brown patches that look like holes. Interior doors are a flat orange-brown with no panel depth in several places. The underside of the main stair is rough and shows stacked slabs. Some large walls in the upstairs hallway are bare.
4. **Rooms are small and low for what the story needs.** The game says the house is tall and impossible. From the inside, it feels like an ordinary house with slightly warped walls. The ceilings, door heights and room volumes need to carry the exaggerated scale from the style brief (tall doors, high ceilings, long hallways).
5. **The scene is heavy.** In a single view inside the upper rooms the renderer reported about 680 draw calls and 1.5 million triangles, and about 750 physics bodies. Even the Low preset showed 175 to 350 draw calls and over 800,000 triangles in some views. That is too much for integrated graphics and phones. A glitchy or slow page can look like a broken game.
6. **Only Act 1 exists in the real game.** The title screen says Act 1. There is no Act 2. Act 3 exists only as a separate grey-box study at `/act3/` that was built to measure scale, not to be played as part of the story.
7. **There is no systematic guard against glitches.** Nothing proves that every wall meets its neighbors, that every doorway is wide enough to walk through, that every prop sits on a surface and not inside a wall, or that every route in the story can actually be walked. Fixing visible glitches one at a time will not work. You need validators that find them all.
8. **I could not open the live link from where I work.** The network proxy blocks the Railway domain, so everything above comes from running the same code locally. You will have a different network setup and must open the live page yourself to compare (section 14, Milestone 0).

### 1.5 What I could not confirm

I can't tell you which exact glitches you will see on the live page. Maybe the title never gets to Play on some GPUs, maybe the pointer lock fails, maybe the load takes too long, maybe a door will not open. Your first job is to find them with evidence. Do not assume the list in 1.4 is complete.

---

## 2. THE RULES THAT OVERRIDE EVERYTHING ELSE

1. **Playable beats pretty.** If a detail threatens frame rate or solidity, simplify the detail and keep the room. Never remove a room, a door, or a story step to make something run faster.
2. **Evidence or it did not happen.** Every fix needs a before and an after: a failing test that now passes, or a screenshot pair. Do not tell me a bug is fixed because the code looks right.
3. **Data first.** Every wall, opening, floor hole, stair, door, window, prop anchor, spawn point and route is declared in data files (section 3.1). The builder generates geometry and colliders from that data, so the visuals and the collisions come from one source and cannot disagree.
4. **One source of truth per number.** A door height, a floor height, a ceiling height exists in one place. Everything else reads it.
5. **No fall-through, no stuck, no soft-lock.** Section 3.5 describes the guards. Every story item can always be reached, and every door the player needs can always be opened, even if the neighbor has locked or boarded everything he is allowed to.
6. **Keep the look.** Same palette, same toon material factory, same canvas textures, same outline pass, same character. Add textures and surface variants where a surface is flat, but build them with the existing helpers.
7. **Do not rewrite what works.** The AI, the learning brain, the audio, the input, the UI, the save system and the mobile touch layer work. Keep them, wire them to the new maps, and fix only what is broken.
8. **Original work only.** Everything is generated in code. The game is an original homage. Do not use the name "Hello Neighbor," its character names, its logos, or any ripped assets anywhere in the shipped game. The neighbor is Mr. Grimsby.
9. **Honest reporting.** At the end of each milestone, tell me what is done, what is not, the numbers (draw calls, triangles, frame time, test counts), and anything you could not verify. Never describe a thing you have not seen.

---

## 3. THE ENGINEERING CONTRACT: HOW THE MAP STAYS SOLID

This section is how you make the glitches go away for good. Build it before you build new rooms.

### 3.1 The map as data

Create `src/maps/` with one folder per act: `act1/`, `act2/`, `act3/`, plus `shared/`. Each act folder holds plain data modules (or JSON) with these tables. A single schema file `src/maps/schema.js` describes and validates them, and the build fails loudly when a table breaks the schema.

```
levels         each floor or area: id, floorY, ceilingH, slabT, footprint polygon(s)
rooms          id, name, level, polygon (inner faces), ceilingH override, zone id, finish ids
walls          id, level, from/to points, thickness, kind (ext/int/retaining), lean, finish ids
openings       id, wall id, offset, width, bottom, top, kind (door, window, arch, hatch, vent, hole), swing, lock, frame style
holes          id, level, rectangle or polygon cut through a floor slab, edge guards
stairs         id, type, from level/point, to level/point, width, riser target, rail sides, headroom rule
ladders        id, base, top, width, rung spacing, cage
props          id, kind, anchor (room id + wall id + offset, or free point), rotation, size override, tags
hiding spots   id, kind, room, entry point, view slits, capacity
spawns         id, point, yaw, safe radius
routes         ordered steps of the story with the items, doors and switches that each step touches
lights         id, kind, position, color, intensity, range, zone id, flicker pattern
zones          id, rooms, portal openings, ambience, music tag, tint
```

Every table row has a stable `id`. Rows never get deleted, only marked `retired`, so saves and tests stay valid.

### 3.2 The builder

`src/maps/Builder.js` turns the tables into geometry and colliders:

- **Walls with real thickness** and mitered joins at corners. Where two rooms share a wall, build it once.
- **Openings cut by splitting** the wall into pieces: full-height side pieces, a lintel piece above, a sill piece below for windows. No boolean subtraction, so no slivers.
- **Frames and trim** built as separate chunky pieces that stand 4 to 8 cm proud of the wall, so no opening looks raw.
- **Floors and ceilings as slabs** with thickness and triangulated polygons, with holes where `holes` says so. A stair hole always matches its stair exactly, plus a headroom margin.
- **Colliders generated from the same numbers** as the visuals, one box per wall piece, one box per slab piece, ramps plus steps for stairs, simple shapes for props. Never use triangle-mesh colliders for the house shell.
- **World-space UVs** so a texture repeats at a fixed real length regardless of the size of the surface.
- **Deterministic output.** No unseeded randomness. The same data always gives the same map.

### 3.3 The validators (the heart of "no glitches")

Write `src/maps/validate/` with the checks below. They run in Vitest on every commit, and a `npm run validate` command prints a human-readable report and exits with an error if anything fails. A map that fails validation cannot be built or deployed.

1. **Schema check.** Every row has the fields it needs, every reference points at a row that exists, no two rows share an id.
2. **Closed rooms.** Every room polygon is closed, has no self-intersection, and has area greater than 1.5 m squared. The union of rooms on a level plus its walls has no holes bigger than the wall thickness.
3. **Wall joins.** At every corner and T-junction the walls meet with a gap under 1 mm and no overlap deeper than the thickness.
4. **Opening fit.** Every opening lies inside its wall piece with at least 0.15 m of wall on each side, and is at least 0.85 m wide and 2.0 m tall if it is a door (the style brief wants taller doors, so most are 2.6 to 2.75 m).
5. **Door swing clearance.** The arc of every door swing is free of walls and large props, or the door is marked sliding or double-acting.
6. **No coplanar surfaces.** No two visible faces occupy the same plane with different materials within 1 mm (this is what causes z-fighting flicker). The validator reports the pair so you can offset one of them by 2 mm.
7. **Prop placement.** Every prop's bounding box lies fully inside its room, does not intersect a wall piece by more than 2 cm, does not intersect another static prop by more than 2 cm, and rests on a surface (floor, shelf top, table top) within 1 cm. Props that float are errors.
8. **Prop reach.** Every pickup lies where the player can reach it by walking or by the story-approved trick (stacking, magnet, ladder).
9. **Stair rules.** Every stair has a riser between 0.15 and 0.22 m, a tread of at least 0.24 m, 2.0 m or more of headroom along the whole flight, and its top lands flush with the upper floor within 5 mm.
10. **Walkability.** A navigation graph built from the data connects every room that the story needs, for a player capsule of radius 0.3 m and height 1.75 m, and separately for a crouched capsule of height 1.0 m. The test walks every story route as a path and reports the first step that fails.
11. **Story reachability.** For each route step, the item exists, is reachable with the tools the player has at that point, and the door or switch it opens exists and responds. The test simulates the whole story with scripted inputs, headless, and expects the ending event.
12. **No soft-locks.** At every step, the player can still reach every item they need even if the neighbor has used all of his adaptations (traps, cameras, boards, locks). Any adaptation that would make a needed route impossible is capped or skipped.
13. **Spawn safety.** Every spawn point stands on solid ground with a free capsule of radius 0.4 m and height 1.9 m above it.
14. **Lights and zones.** Every room belongs to a zone, every zone has at least one light, and no more than 8 shadowless point lights are active in a single view.
15. **Budget check.** The map builder reports, per room and per zone, the draw calls, triangles and physics bodies it adds. A zone that blows its budget (section 3.6) fails.

Each validator prints the exact ids involved ("room `kitchen` prop `fridge` intersects wall `f0-kitchen-east` by 7 cm"). No vague messages.

### 3.4 The visual check

A Playwright script, `scripts/mapshots.mjs`, loads each act with `?debug=1&gfx=low&notitle&nointro`, teleports to a list of named camera poses stored in `src/maps/<act>/poses.json` (at least 6 per room: four wall views, one corner view, one doorway view), takes screenshots, and writes them to `reports/shots/<act>/`. A second script compares each screenshot to a stored baseline with a 1.5 percent pixel tolerance and fails on larger drift, so visual regressions show up as test failures. Review the pictures yourself, critically, against the descriptions in this document. Software rendering in a headless browser is slow, so wait for frames to settle and use small viewports.

### 3.5 Runtime guards

Even with perfect data, a physics game can glitch. Add these safety nets:

- **Out-of-world rescue.** If the player's feet go below the lowest valid floor of the current level minus 2 m, or outside the level bounds, teleport them to the last safe point (updated every second while grounded in a validated walkable cell) and play a soft whoosh. Log it so you can find the cause.
- **Stuck rescue.** If the player is holding a move input for 4 seconds with less than 0.3 m of movement and is not on a ladder or in a hide spot, nudge them up 0.1 m and out along the nearest free direction, and log it. After 8 seconds, teleport to the last safe point.
- **Ceiling clamp.** The player cannot be pushed through a ceiling by a moving platform or door.
- **Door safety.** A door that would close on the player or the neighbor stops and reopens. Doors never trap anyone inside the frame.
- **Prop sanity.** Any physics prop that falls below -5 m, exceeds a speed of 40 m/s, or leaves the level bounds returns to its spawn point.
- **Neighbor rescue.** If the neighbor is stuck for 5 seconds (position unchanged while a path exists), repath. After 10 seconds, teleport him to the nearest waypoint out of the player's sight.
- **Physics step guard.** Clamp the frame delta to 1/20 s, use a fixed 1/60 s physics step with at most 4 substeps per frame, and skip the step if the tab was hidden for more than a second.
- **Boot guard.** If the WASM physics fails to load, the shader fails to compile, or WebGL is unavailable, show a clear message on the page with a retry button and a plain-language reason. Never leave a blank or frozen page.

### 3.6 Performance budgets

These apply per view, measured with the in-game F3 panel and by the automated perf script on the Medium preset. The Low preset must come in at about 60 percent of these numbers.

```
draw calls                 under 350 (Medium), under 200 (Low)
visible triangles          under 700,000 (Medium), under 350,000 (Low)
awake physics bodies       under 150
shadow-casting lights      1 directional (Medium and High), none on Low
active point lights        8 maximum, none cast shadows
texture memory             under 96 MB (Medium), under 48 MB (Low)
total page weight          under 12 MB compressed, excluding the WASM
time to the title screen   under 8 s on a mid-range laptop, over broadband
frame rate                 60 on a mid-range laptop at 1080p (Medium), 30 on a recent phone (Low)
```

How you get there:

- **Merge static geometry** per room per material with `mergeGeometries`, so a furnished room is a handful of draw calls instead of hundreds.
- **Instance repeats**: books, plates, nails, balusters, pickets, fence boards, shingles, grass, balloons, jars, tiles.
- **Zone culling** from the portal graph. Only render the room the player is in, the rooms visible through open doors and windows, and the exterior if a window shows it. Closed doors hide the next room.
- **Sleep physics bodies.** Every loose prop sleeps until touched. Only props inside the player's zone and its neighbors are awake.
- **Level of detail** for exterior props: simple boxes beyond 40 m.
- **Lazy loading by act.** Act 1 loads first. Act 2 and Act 3 build in the background after the player passes the first minutes of Act 1, or on the transition screen, and free the previous act's meshes, textures and bodies when the new act starts.
- **Dispose properly.** When an act unloads, dispose geometries, materials, textures, render targets and bodies.

### 3.7 The bug log

Keep `BUGS.md` at the repo root. Every glitch you find gets a row: id, where (act, room, coordinates), how to see it (a camera pose or a script), what was wrong, which commit fixed it, which test now guards it. At the end, the log must show every bug closed or explained. I want to read it.

---


## 4. THE STORY AND THE THREE ACTS

The player is a kid who has just moved into the small blue house across the street from Mr. Harold Grimsby. They never speak and are never seen in first person except for their chunky cartoon hands and blue sleeves. Mr. Grimsby is a large, mustached man in a navy and light-blue diamond-pattern sweater vest, black rubber gloves to the elbow, and a permanent suspicious squint. He never talks in words. He grunts, hums, gasps and shouts.

His house hides something, and the whole game is the player trying to find out what. The story is told with places, not dialogue: a locked basement, a frozen kid's room, a party that never finished, a workshop full of blueprints, a line of mannequins. Never explain it out loud. Let the player work it out, and give them one moment where they feel sorry for him.

The three acts:

**Act 1: The House.** Late afternoon, sunny, bright and friendly. The player breaks into the neighbor's mustard, mint and tomato-red house to reach the basement. The house is warm, cluttered, tall and slightly crooked. The tension comes from contrast: a cheerful place with a man who wants you out. The act is a chain of keys and tools, ends with the long walk down the basement stairs and a door slamming shut.

**Act 2: The Underneath.** No sky. A huge hand-dug basement complex under the whole lot, lit by tube lights, bare bulbs and red emergency lamps. It is cold, wet, teal and green, with pipes, steam, water and old carnival things stored in the dark. The neighbor hunts with a headlamp and a lantern. The act ends with the player climbing a long ladder shaft out into the back yard.

**Act 3: The Tower.** Dusk turning into night, with dream-colored sky. The old house is gone. In its place stands a much taller house with a roof terrace, a train that circles it, a windmill, cameras, lasers, and a birthday room set for a party. Surreal, sadder, brighter in color and darker in mood. The act ends with the birthday scene, the neighbor's one quiet moment, and a sunrise over the street.

Transitions between acts are short, silent title cards on a painted background, 4 seconds each, skippable. They also act as the loading screen for the next act.

Between acts, keep: collected items that are not act-specific (the flashlight, the keyring), the catch count, the playtime, and the save. Reset: the neighbor's learned traps (he starts every act fresh, but remembers the player's habits in a lighter form: his first adaptation threshold is one lower in the next act).

---

## 5. THE LOOK OF EACH ACT: GLOBAL RULES

The shared style is already built: chunky, beveled, saturated, warped, painted, outlined. These rules say how the look shifts from act to act. Use the existing named colors from `Palette.js` and the existing texture helpers from `CanvasTextures.js`. Add a new named color only when a surface truly needs one, and put it in `Palette.js`.

### 5.1 Act 1 look

Time: late afternoon, sun low in the west-southwest, long warm shadows. The story clock moves the sun a little lower with each catch, up to golden hour.

Sky: deep cornflower at the zenith to pale peach at the horizon, fat cartoon clouds with lavender undersides. Fog `FOG_DAY` fading to `FOG_DUSK` as the clock advances.

Colors: sunshine yellow (`NH_SIDING_MAIN`), mint (`NH_SIDING_ALT`), tomato red (`NH_SIDING_ADDON`), brick red roofs, bold red front door, blue shutters, white trim. Interiors are warm: green stripes, blue diamonds, pink dots, yellow pinstripes, dark wood floors, red and green runners. Shadows tinted blue-violet outside, warm brown inside.

Mood: friendly on the surface, wrong in the details.

### 5.2 Act 2 look

Time: none. Everything is artificially lit.

Colors: the basement palette becomes the whole world. `BASEMENT_WALL` (grey-green), `BASEMENT_FLOOR`, `METAL_DARK` and `METAL` for pipes and doors, rust orange (add `RUST` `#B5532A` if it is missing), tube-light cyan `BASEMENT_LIGHT`, emergency red `#E23B3B` for the red lamps, and the toy colors (`RED_TOY`, `YELLOW_TOY`, `BLUE_TOY`) for the carnival stock, which must pop hard against the gloom. Water is a murky teal `#2F7F73` at 70 percent opacity with a pale foam edge and a soft surface wobble.

Lighting: no sun. A very low hemisphere fill in cold teal, plus many small local lights. Cyan tube lights with a slow electrical flicker, bare bulbs on cords in warm yellow, red emergency lamps that pulse at 0.5 Hz. Steam is soft white card sprites that drift upward and fade.

Shadows: tinted deep blue-green, never black. Fog is close and teal (`#1F3A38`, start 8 m, end 60 m) so each space feels like its own little pocket.

Mood: cold and damp, with warm pockets of color where the carnival things are.

### 5.3 Act 3 look

Time: dusk at the start, full night by the middle, sunrise in the last scene.

Sky: the dream palette. `DREAM_SKY_TOP` `#2A1B4D` to `DREAM_SKY_BOTTOM` `#C0397B`, with a huge low moon (pale cream disc, 3 times the size of a real one), stretched smeary clouds that glow pink at the edges, and a few slow shooting stars. Fog `DREAM_FOG` `#5B2A6E`.

Colors: the house colors from Act 1, pushed a little more saturated, and lit mostly by warm window light and colored string lights. Windows glow in different colors: orange, sickly green, TV blue, pink. The roof terrace is dark felt with bright primary-colored train and railings. The birthday room is the brightest place in the game.

Lighting: moonlight from above (cool blue directional, low intensity, soft shadows), warm interior lamps, fairy lights, red camera LEDs, laser beams that bloom, and the windmill hub lamp.

Mood: sad, sweet, uncanny. Brighter in color than Act 2 and darker in feeling.

### 5.4 Scale and proportion rules (all acts)

```
unit                      1 world unit is 1 meter
player eye height         1.60 m standing, 0.95 m crouched, capsule radius 0.30 m, height 1.75 m
neighbor height           2.05 m including hair, big head, long arms
standard door             0.95 m wide, 2.60 to 2.75 m tall (tall and narrow on purpose)
player-house door         0.95 m wide, 2.20 m tall
ceilings                  3.2 to 3.6 m in the neighbor's house, 2.7 m in the player's house
windows                   0.9 m wide, 1.6 m tall, sill at 0.9 m (some tall and narrow, 0.55 by 2.2 m)
stairs                    riser 0.19 to 0.20 m, tread 0.26 m, width 1.1 m, headroom 2.2 m
hallways                  2.5 to 3.0 m wide in the neighbor's house, long and tall
furniture                 chunky, 6 to 12 cm minimum thickness on anything that would be thin
```

Every prop in every act follows the five pillars of the art doctrine: chunky, beveled and soft, wrongly proportioned, saturated, and architecturally impossible.

### 5.5 Surface variety rules (this is how you fix the flat surfaces)

Every large surface must show more than a flat color from a normal viewing distance. For each wall, floor and ceiling, add at least three of these layered details, using the existing texture helpers and the world-space UV rule:

- a base pattern (stripes, dots, diamonds, planks, checks, brick, shingles)
- a second layer at a different scale (large soft stains, faded patches, a darker border band)
- trim that stands proud (skirting boards 12 cm tall, picture rails, crown moulding, door and window casings 10 to 14 cm wide)
- panel depth on doors (two to six recessed panels made as real geometry, 1.5 cm deep)
- a wear decal at points of use (scuffed floor in front of doors, a dark smudge around door handles and light switches, chipped paint at corners, a water stain below a window, peeled wallpaper at a seam)
- a small prop or fixture at every 2 m of wall (a switch plate, a socket, a picture frame, a hook, a vent grille, a clock, a calendar, a bracket)

A wall without any of these reads as a glitch. A door with no panel depth reads as a glitch. A cabinet front with no handles and no panel reads as a glitch.

---

## 6. THE STREET (SHARED BY ACT 1 AND ACT 3)

The street is a diorama of about 120 by 70 meters, boxed in by tall hedges, fences, a "ROAD CLOSED" barrier at each end, and fog. Nothing beyond it is reachable, and nothing beyond it should ever be visible as an edge.

### 6.1 Layout

```
road                    runs east to west along z 0, half width 3.5 m (7 m wide), x from -60 to +60
center line             bright yellow dashes 2.2 m long, 0.16 m wide, every 4.5 m, each rotated up to 0.6 degrees
sidewalks               cream concrete, from |z| 3.5 to 5.7, top at y 0.15, with expansion joints every 1.5 m
curbs                   cream-grey, 0.15 m tall, 0.2 m wide, slightly rounded
south lots (z > 5.7)    player lot x[-17,17] (player house x[-5,5] z[14,22]); flanking lots x[-40,-17] and x[17,40]
north lots (z < -5.7)   neighbor lot x[-17,17] (house x[-8,8] z[-26,-14]); flanking lots x[-40,-17] and x[17,40]
street ends             a sawhorse barrier with orange and white stripes and two blinking amber lamps at x = -57 and x = +57
boundary                hedges 2.5 m tall around the whole street, a plank fence behind them, and fog beyond
```

### 6.2 Ground

The ground is a big plane with the painted grass texture, tiled at 420 repeats, with a slight patchy light and dark variation on a second large-scale layer. Lawns are mowed flat. Next to fences, house bases and path edges, instanced grass tufts (crossed quads, three heights, sway in a soft vertex wind) fill in, 2,000 to 6,000 depending on the quality preset. Dandelions and daisies appear in the player's lawn and in the flanking lawns, instanced, up to 400.

The ground collider has an opening under the neighbor's house footprint, `x[-8.2,8.2] z[-26.2,-13.8]`, in Act 1 so the basement and its stairs can exist below. In Act 3 the same opening exists under the new house. Everywhere else the ground is solid.

### 6.2 (continued) Street surfaces

Asphalt is warm mid-grey with subtle darker tire tracks along each lane, a few hairline cracks, two patched rectangles (slightly different grey), and a faded white crosswalk in front of the player's house, five bars wide.

Sidewalks: pale cream, with a darker joint every 1.5 m, a couple of chipped corners, and a few chewing-gum dark dots.

### 6.3 Street furniture, with positions

- **Fire hydrant:** a bright red hydrant, 0.7 m tall, chunky, with two round caps and a top bolt. At x = 20, z = 4.4.
- **Lamp posts:** four on each side, dark green `#2F4F3E`, 5.5 m tall, the head hooked over like a candy cane. At x = -30, -10, 10, 30, on the sidewalk edge at z = ±5.2. Off in Act 1. In Act 3 they glow warm yellow and cast soft pools of light on the sidewalk, each with a small bloom halo.
- **Mailboxes:** a fat post and a rounded mail box in front of each house. The neighbor's is at x = 9, z = -6.2, red, with the flag up. The player's is at x = 6, z = 6.2, yellow, flag down.
- **Power poles:** wooden, 8 m tall, with a crossbar and three ceramic insulators, at x = -45, 0, 45 on the north sidewalk edge, with wires sagging 0.5 m between poles and one set crossing the street at an angle.
- **Trees:** two in the player's yard, three in the flanking yards, and the giant tree beside the neighbor's house on the east side (section 8.3.2). Trunks are twisted, chunky, dark brown, with crowns of 4 to 7 overlapping squashed spheres in two greens.
- **Bushes:** round green gumdrop bushes along every front wall, each a squashed sphere 0.7 to 1.1 m across, three greens.
- **Parked car:** a chunky blue hatchback in the flanking south-west driveway (x = -26, z = 8), 4.0 m long, with a flat tire on the front left.
- **Bike and trash cans:** a kid's red bike lying in the north-east flanking lawn, two grey trash cans at the curb in front of the north-west flanking house, one tipped over with a banana peel beside it.
- **Sprinkler:** a lawn sprinkler in the south-east flanking lawn, shooting a lazy arc of small blue droplet particles (about 40 at a time) that sparkle in the sun.
- **For-sale sign:** a "FOR SALE" sign leaning 25 degrees in the north-east flanking lawn, the lettering drawn as fat canvas text.
- **Sky props:** a few fat clouds (10 to 15 clusters at 120 to 300 m), a big low sun disc in Act 1, the moon in Act 3.

### 6.4 The four flanking houses

They are not enterable. Each is a solid volume with a gable roof, windows with drawn curtains, a locked front door and porch steps, leaning 0.5 to 1.5 degrees in its own direction.

```
north-west   x -28.5   pastel pink   #F7C6D0   2 stories   a flowerbed of red tulips, a doormat that says HI
north-east   x  28.5   pastel green  #C5E8B7   2 stories   the kid's bike on the lawn, the for-sale sign
south-west   x -28.5   pastel lavender #D6C8F0  1 story    the blue hatchback in the driveway, a wind chime on the porch
south-east   x  28.5   peach         #FFD3B0   2 stories   the sprinkler going, a wooden swing on the big tree
```

Window curtains are canvas-painted and glow faintly in Act 3. One curtain in the pink house twitches open a hand's width when the player runs past at night (an easter egg, once).

### 6.5 The neighbor's front lot (the part you look at most)

The lot is `x[-17,17] z[-34,-5.7]`. From the street it reads like this, from the sidewalk toward the house:

1. A white picket fence along z = -6.4 from x = -17 to 17, each picket a fat rounded plank with a pointed top, 0.14 m wide, 1.1 m tall, every 0.22 m, each tilted up to 3 degrees, each fence section tilted up to 2 degrees. A gate at x = 8, 1.3 m wide, hanging from one hinge.
2. A lawn strip with a cracked concrete path from the gate to the porch steps, 1.4 m wide, lined with 11 chunky round stepping slabs, one missing.
3. A garden gnome, 0.7 m tall (too tall), standing by the left porch column. It slowly turns to face the player when they are not looking (once per minute at most).
4. A coiled green garden hose by the right porch column, 12 loops, with a brass nozzle.
5. A "NO TRESPASSING" sign nailed crookedly to the fence at x = -6, and below it a smaller handwritten sign that says "I MEAN IT."
6. A welcome mat on the porch in front of the red door that says GO AWAY in fat canvas letters.
7. Window boxes under every ground-floor window, with chunky red and yellow flowers, two of them dead and brown.
8. The porch (section 8.2), and above it the front of the house.

### 6.6 Act 3 changes to the street

Same layout, different mood. Lamps on. Windows glowing. The old house is gone and the new one stands in the same spot, taller and brighter (section 10). The gnome is gone (a small empty dirt circle remains). The "I MEAN IT" sign is now face down on the grass. The neighbor's fence is intact. The flag on his mailbox is down.

---

## 7. THE PLAYER'S HOUSE (SHARED BY ACT 1 AND ACT 3)

A small, nearly straight, baby-blue house: the only safe place in the game. It stands at `x[-5,5] z[14,22]`, floor top y 0.30, walls 2.7 m high, walls 0.22 m thick. It leans at most 0.3 degrees. Its front faces north, toward the neighbor across the street.

### 7.1 Exterior

Siding `PH_SIDING` baby blue, clapboard 0.18 m, trim white. Slate-grey gable roof (`PH_ROOF`) with a ridge running east to west, 0.45 m eaves, and a short chunky chimney at the east end. A yellow front door (`PH_DOOR`) at x = -1.2, with a brass knob, a round peephole, and a doormat that says WELCOME. A small porch of two steps, 2.4 m wide. Two front windows: the living room window at x = -3.5 and the bedroom window at x = 2.8, 1.0 m wide, 1.3 m tall, sill at 0.9 m, with white shutters and flower boxes of yellow flowers. A yard with two small trees, a mailbox, a bird bath, and a lawn chair. Behind the house, a small back yard with a clothesline and a wheelbarrow.

### 7.2 Interior plan

```
living room     x[-5,0.6]  z[14,22]    5.6 by 8.0 m
bedroom         x[0.6,5]   z[14,22]    4.4 by 8.0 m
partition       x = 0.6, 0.14 m thick, a doorway at z 19.5 to 20.5
kitchen corner  x[-5,-2]   z[19.5,22]  in the back-left of the living room, open
```

### 7.3 Living room

Walls in warm yellow flower wallpaper (`flowers`, `WALLPAPER_YELLOW` with pink dots) above a white wainscot, floor of wide warm wood planks with a big round rug (`CARPET_RED` with a cream ring) in the middle. A green sofa (2.0 by 0.9 by 0.85 m) against the west wall with two throw cushions, one orange, one blue. A wooden coffee table with a bowl of fruit and a comic book. A boxy television on a low stand (0.65 by 0.5 by 0.5 m) on the east partition, showing cartoon shapes, with rabbit-ear antennae. A bookshelf (1.0 by 0.3 by 1.8 m) with fat books and a small plant. A floor lamp with a drum shade. A framed family photo on the wall, drawn as a simple smiling family of three. A coat hook by the front door with a small blue raincoat. A radio on a side table that plays soft music (the safe-place theme) when the player stands near it.

The kitchen corner: a small counter 2.0 m long with a sink, a kettle and a toaster, a round table with two chairs, a fridge (0.7 by 0.7 by 1.7 m, cream, with magnets), a window over the sink looking at the back yard.

### 7.4 Bedroom

Wallpaper: blue with white fluffy clouds (`clouds`, `WALLPAPER_BLUE`). Floor: the same wood. A bed against the east wall with a patchwork quilt, two bulged pillows, a wooden headboard with a scalloped top. A nightstand with a lamp and an alarm clock. A desk under the window (1.2 by 0.6 by 0.75 m) with a lamp, a notebook, pencils in a mug, and a pair of toy binoculars (a prop only). A dresser (1.2 by 0.5 by 1.0 m) at the back, with the flashlight on it at (1.95, 1.5, 21.45). A toy box, a toy rocket on a shelf, glow-in-the-dark stars on the ceiling. The window faces the neighbor's house, and its curtains hang half open with a view of the neighbor's front.

The wake-up spawn is beside the bed at (2.4, 0.3, 17.6), facing the window (yaw 0.35 radians). When the player is caught, they wake up here: a white flash, a muffled heartbeat fading out, a gasp, and the desaturated image blooming back to full color over 1.5 seconds.

### 7.5 Safety

The player's house is the only place the neighbor never enters. He stops at the property line (z = 6) and stares for five unsettling seconds, breathing hard, then walks back. Nothing in the house can be used to trap the player. Every interior door can be opened, and the spawn never moves.

### 7.6 Act 3 differences

The same house, the same layout, moonlit and warmly lit from inside. The bedroom window is the first thing seen in Act 3: the new tower across the street, lit in several colors.

---


## 8. ACT 1: THE HOUSE

This is the neighbor's house in late-afternoon sun, as the player first sees it. It is a tall, narrow, stacked, slightly drunk tower of rooms on a respectable two-story base. The coordinates here are the ones the existing code uses (`NeighborPlan.js`). Keep them. Where a room is described, build it to the size given, and furnish it to the density asked for in section 5.5 and 8.0.

### 8.0 Density, direction and how to read the room entries

Directions: **south** is the front of the house (toward the street, +z). **North** is the back (-z). **West** is -x (the player's left when they face the house from the street), **east** is +x.

Every room needs between 25 and 60 props, as a mix of large anchors, mid-sized pieces, and small clutter, and at least 40 percent of the small and mid-sized props are physics objects the player can knock over or pick up. Instance repeated small props. The numbers in each room entry below name the important and distinctive props. Fill the rest of the density target with believable clutter that fits that room (cups, books, shoes, papers, toys, tools, laundry, plants, candles, jars, boxes, bottles, newspapers).

Every room has at least two exits, at least one hiding spot, one light source, and one thing that makes it memorable at a glance.

Props never block a doorway, a stair top, a ladder, a story item, or the neighbor's path. The validator in section 3.3 will check this.

### 8.1 The house at a glance

Seen from the street the house is five stacked chunks, each leaning its own way:

1. **The base:** two stories, 16 by 12 m, mustard-yellow siding, white trim, a deep covered porch across the front, a brick red roof line, tall narrow windows with blue shutters.
2. **The second story overhang:** the upper story is a slightly different mustard (`NH_SIDING_MAIN_2`), leans 2 to 3 degrees, and juts forward on the right side over the porch, held up by two diagonal wooden braces that look like an afterthought.
3. **The mint wing:** a narrower third story set back and off to the left (x[-7,2] z[-26,-18]), mint teal siding, slate-blue roof, leaning 3 degrees west, with a round porthole window.
4. **The tomato room:** a small bolted-on box (x[5,9] z[-23,-19]) hanging off the right side of the third story on diagonal planks and scaffolding, in dusty tomato red, patched with raw boards and a sheet of corrugated metal, leaning 5 degrees out over the yard.
5. **The attic tower:** a skinny tower (x[-5,-2] z[-23,-20]) on top of the mint wing, 4.4 m tall, with a near-witch-hat roof (60 degrees), a single bare bulb glowing in its tiny window, and a crooked rooster weathervane that rotates slowly and sometimes snaps around.

Total height to the top of the highest chimney: about 17 m. Seen from the player's bedroom window, it is the tallest thing on the street by a long way.

### 8.2 The exterior, face by face

All colors and textures come from the existing palette and helpers. This section says what is on each face and where.

#### 8.2.1 The front (south, z = -14)

Ground floor, left to right across x from -8 to 8:

- **x = -6:** a window 0.9 by 1.6 m (sill 0.9) with blue shutters and a window box of red and yellow flowers. Intact, with the diagonal glare stripes.
- **x = -3.5:** the **broken window**, the intended way in. The glass is smashed to jagged triangles stuck in the corners of the frame, one shutter hanging from a single hinge at 25 degrees, the window box dead and brown, and glass chunks on the porch boards and on the inside sill. Sill 0.9 m. A stack of boxes inside reaches 0.35 m high (section 8.5.2).
- **x = 0:** the **front door**, 1.05 m wide, 2.75 m tall, bold red (`NH_DOOR_FRONT`), with a half-moon window at the top, a brass knob, a brass knocker shaped like a mustache, a mail slot at 1.1 m height, and a yellow lock (needs the yellow key). A brass house number plate that says 910 in fat letters, one digit slightly crooked. The mail slot opens to a narrow peek at the hallway (section 8.5.1).
- **x = 3.5:** a dead-flower window with shutters.
- **x = 6:** a window with shutters, intact.

Porch: spans the front from x = -6.5 to 6.5, depth z from -14 to -11.2, deck at y 0.6. Three broad steps (rise 0.18 m, tread 0.30 m, width 3.0 m) at x = 0. Two fat white columns, 0.28 m across, tapered, top wider than bottom, leaning in different directions by 1 to 3 degrees, at x = -5 and x = 5. A shallow shed roof (brick red) over the porch, high edge at y 4.3 and low edge at y 3.85, with a sagging rain gutter. A porch swing hangs from the roof on two chains at x = -3, with a faded cushion. The welcome mat says GO AWAY. A potted dead fern by the right column. Under the porch floor, lattice (visible) with a cat-sized gap.

First floor front, left part (z = -14, x from -7 to 2): three windows. x = -5.5 and x = -3.5, 0.9 by 1.6, tilting. x = -1: a taller window 1.4 by 2.1 m (sill 0.7), looking into the upstairs hall.

First floor front, right part (z = -13.2, x from 2 to 8.6): this section juts 0.8 m forward over the porch. Window at x = 3.3. The **balcony door** at x = 5.5: a door with glass panels onto a small balcony (1.8 m deep, 2.4 m wide) with a chunky white railing that sags in the middle (the railing is 0.9 m high and its top is 0.12 m wide, no standing on it). Window at x = 7.6, narrow (0.6 m wide, sill 1.0). Two diagonal wooden braces under the overhang, from the porch columns to the underside of the jut, 0.18 m square, painted in `NH_PLANKS`.

A pair of **binoculars** on the balcony railing, pointed at the player's bedroom window. A satellite dish on the jut roof aimed the same way.

Third story (mint wing), front face at z = -18: set back 4 m from the main front. A round porthole window at x = -4 (1.2 m across, with a white ring frame, an old brass cross-hatch). A tall narrow window at x = 0.5 (0.55 m wide, sill 0.6, top 2.8).

#### 8.2.2 The east side (x = 8 on the ground floor, x = 8.6 above)

Ground floor: a window at z = -17 (0.9 m wide), and the **kitchen side door** at z = -23.5 (0.95 m wide, 2.6 m tall, locked). A camera bracket above it (empty in Act 1 until the neighbor learns). A wooden gate in the tall plank fence leads into the side yard. Three barred cellar vents along the plinth at z = -16, -19, -22 (0.3 m wide, bars of 2 cm).

First floor: a window at z = -16 (0.95 wide, sill 0.7): this is the **tree window**, reached from the big tree's branch. A window at z = -21.7 (the kid's room window).

Tomato room: its east wall x = 9 is sealed siding. Its leaning mass hangs 0.4 m past the first floor face.

#### 8.2.3 The west side (x = -8 on the ground floor, x = -7 above)

Ground floor: a window at z = -20 (the living room's, boarded from outside with three planks in Act 1 after the first adaptation), a small high window at z = -24 (the downstairs bathroom, 0.7 wide, sill 1.4). A downspout in dull metal. A pile of rolled carpet.

First floor: windows at z = -17 (bedroom), z = -22 (bathroom, small, high), z = -24.8 (the stairwell, 0.6 wide, sill 1.6).

Third story: a window at z = -21 (the landing).

**The cellar hatch:** two slanted cellar doors on the west side of the house near the back corner, at x = -9.2, z = -24, each 0.9 by 1.4 m, with a heavy chain and a big orange padlock. They cannot be opened from outside in any act (the basement entrance is inside).

#### 8.2.4 The back (north, z = -26)

Ground floor: a window at x = -3.8 (mudroom, 0.8 wide, sill 1.2), the **back door** at x = -2 with a springy screen door in front of it (slaps shut with a satisfying sound), and a wide kitchen window at x = 5 (1.2 wide, sill 1.2).

First floor: a window at x = -1 (the end of the upstairs hall) and a small one at x = 4 (the closet).

Third story: a window at x = -4 (the landing).

Mint wing east face at x = 2: the **green-locked door** at z = -20, opening onto a narrow plank bridge (0.7 m wide) that crosses 2.2 m to the tomato room door. The bridge has no rail on one side and a single rope on the other. A 6 m drop to the roof of the first floor jut and the yard below. A window with raw planks across it at z = -23.5.

#### 8.2.5 The roofs

- **Base roof:** a hip roof at 25 degrees over the first floor jut and the porch, brick red shingles, 0.45 m eaves, a fat brick chimney at the east end rising to y 16. The chimney twists 12 degrees and tapers. It puffs a little cartoon smoke (soft white spheres that rise, grow and fade).
- **Mint wing roof:** a gable at 35 degrees, slate-blue shingles (`NH_ROOF_ALT`), a skinny metal stovepipe chimney with a conical hat.
- **Tomato room roof:** a flat roof of corrugated metal, with a bucket on it.
- **Attic tower roof:** pointed, 60 degrees, brick red.
- The shingles are chunky (35 cm wide), with a different small hue shift per roof.

#### 8.2.6 Exterior details that sell it

A security floodlight above the back door (off in Act 1). A hose reel by the side door. Rain gutters with a hanging leaf. A satellite dish. A bird house on the porch post with a real bird that flits out when the player is close. A weathervane rooster. Window boxes. A tiny American-style flag on a pole by the porch, faded. A doorbell button that rings a deep two-note chime when pressed (the neighbor comes to the door after a few seconds, a safe lure). An old tricycle on its side by the steps.

### 8.3 The yard

The lot is x[-17,17] z[-34,-5.7]. The house sits in the middle at z[-26,-14]. The rest is the front lawn (z from -14 to -5.7), the side yards (x from -17 to -8 and 8 to 17), and the back yard (z from -34 to -26).

#### 8.3.1 Fences

A tall plank fence, 2.2 m high, planks 0.22 m wide in two alternating browns (`NH_PLANKS`, `NH_PLANKS_OLD`), runs around the side and back yards, each board slightly tilted, with a gap at the gates. Gates at x = -12, z = -16 (west side) and x = 12, z = -17 (east side, locked after the first adaptation), 1.3 m wide, on iron hinges. The picket fence along the front is separate (section 6.5). The fence tops are cut in different shapes.

#### 8.3.2 The big tree

A huge, twisted tree stands at x = 12, z = -17, east of the house. The trunk is 1.3 m across at the base, twisting 20 degrees over its height, dark brown, with knots and chunky root flares. It is climbable: the player jumps from a stack of cinder blocks onto a nailed-on plank step at 1.6 m, then onto a series of fat knots (each a rounded stub 0.3 m wide) spiraling up the trunk to a thick branch at y 5.2. The branch, 0.55 m across, reaches west toward the first-floor tree window (x = 8.6, z = -16, sill y 5.2). Another branch holds a rope swing with a wooden seat. The crown is 5 to 7 overlapping spheres, 5 m across, in two greens.

#### 8.3.3 The back yard (z from -34 to -26, x from -17 to 17)

- **The shed:** a green-painted shed (`#6BA368`, 2.4 by 3.0 by 2.4 m) with a slightly leaning roof, at x = -11, z = -30. Locked with a padlock; its key is behind the kiddie pool. Inside: a lawnmower, a ladder (3.5 m, physics), a bucket of paint, shelves of jars, a workbench.
- **The red sedan on the fence:** a chunky red car, 4.2 m long, parked with its front wheels on a crushed section of the back fence and its rear wheels on the grass, angled 12 degrees, at x = 2, z = -31. The windows are fogged. The trunk (with a red key tag) opens with a lever and holds a toolbox.
- **The kiddie pool:** a round pool, 2.4 m across, 0.4 m deep, at x = -4, z = -30, full of scummy green water with a floating rubber duck and a pool noodle. A rusty valve at its edge needs the wrench to turn. When drained (water level falls over 8 seconds with a gurgling sound), the blue key lies on the bottom.
- **The clothesline:** two poles at x = 5 and x = 12, z = -30, with a line sagging 0.3 m, holding a navy and light-blue sweater vest, a pair of brown plaid trousers, three mustard shirts and a pair of black gloves, all swaying in the wind.
- **The barbecue grill:** a round black grill on three legs at x = 9, z = -28, with a hamburger-shaped prop.
- **A crate pile and a spare ladder:** a stack of wooden crates (6, each 0.6 by 0.4 by 0.4) by the back porch, a ladder lying along the fence (physics, 3.5 m).
- **The back steps:** three steps to the screen door.
- **A compost heap, a wheelbarrow, a stack of firewood, a rake, a garden gnome (the second one, tiny), a rain barrel, a birdbath.**

The yard is the player's first sneaking space, so give it cover: hedges, the shed, the car, the tree, laundry hanging down to the ground.

### 8.4 The route options for getting in

The house must offer at least these routes, each checked by the validator in 3.3:

1. **The broken window** at the front (easy, always available).
2. **The kitchen side door** (open at the start, locked after the first adaptation).
3. **The back door's screen door and mudroom door** (open at the start).
4. **The boxes and the porch roof:** stack the boxes by the porch, climb to the porch roof, walk to the balcony and enter through its glass door (never locked).
5. **The tree branch** to the first-floor tree window.
6. **The ladder** from the shed or the yard, leaned against the wall under any first-floor window.
7. **The front door** (needs the yellow key, the earned route).

### 8.5 Ground floor (F0), room by room

F0 floor top y 0.60, height 3.6. Floors are wood unless noted.

#### 8.5.1 The front hallway (`hall`)

x[-1.5,1.5] z[-22,-14]: 3.0 by 8.0 m, ceiling 3.8 m (it is the tall one). The first thing you see through the front door, and the main artery of the house.

Walls: green stripes (`WALLPAPER_GREEN` with `WALLPAPER_GREEN_STRIPE`) above a wooden wainscot (`WAINSCOT`) 1.0 m tall, a picture rail at 2.4 m, crown moulding at the ceiling. Floor: dark wood (`FLOOR_WOOD_DARK`) with a long red runner (`CARPET_RED`, 1.1 m wide) from the door to the back, a little kicked up and dusty at the middle.

Doors: front door at x = 0, z = -14. West door to the living room at z = -16.5. East door to the dining room at z = -16.5. A door at the back, z = -22, x = 0.7, the **basement door** (section 8.5.7), and an open passage to the mudroom via the living room only.

The main stairs: a straight flight, 1.1 m wide, along the west wall (x from -1.4 to -0.3), ascending north from about z = -16.7 to z = -22, 19 risers of 0.205 m (to y 4.5), 18 treads of 0.26 m. A fat wooden banister on the open (east) side with a twisting newel post at the bottom and balusters every 0.12 m. The underside of the stair is closed in with painted panels (not bare slabs), with a little cupboard door at the bottom. A coat stand and a small table fill the space on the east side of the hall.

Props (about 36): a tilted 1.9 m coat stand holding a brown jacket and an old hat; a console table (1.1 by 0.4 by 0.8 m) with a ceramic bowl of keys that jingle (decoys, loud); a grandfather clock 2.9 m tall at the north end of the east wall with a sad cartoon face painted on its dial (two dots and a downturned mouth) and a swinging pendulum (the yellow key hides in the base, opened by a small door that pops when the player interacts with the pendulum); three framed photos (a smiling family of four with two faces scribbled over in marker, a normal version of this house, a carnival); an umbrella stand; a pair of muddy boots; a stack of newspapers; a wall telephone with a curly cord; a barometer; three coat hooks; a mirror at 1.5 m with a crack in one corner; a floor mat; dust bunnies; a hanging brass lamp; a small stool; a key rack with five empty hooks.

Hiding spot: the cupboard under the stairs (1.0 by 0.8 by 1.2 m inside, a door with a view slit).

Lighting: a hanging brass lamp (warm), a wall sconce near the stairs, and sunlight bars through the half-moon window above the front door that cast a golden shaft down the runner with drifting dust.

Mail-slot peek: looking through the mail slot from the porch gives a narrow letterbox view of this hall. Sometimes an eye appears on the other side (once per session).

#### 8.5.2 The living room (`living`)

x[-8,-1.5] z[-22,-14]: 6.5 by 8.0 m, ceiling 3.6 m. The big sunny room, and the most visible from outside.

Walls: blue diamond wallpaper (`WALLPAPER_BLUE`), one corner peeling, white wainscot, a picture rail. Floor: light wood with a big concentric-circle rug (`CARPET_RED` and cream) in the middle. A stone-look brick fireplace on the north wall (x = -5, z = -22) with a chunky mantel.

Windows: two on the south wall (x = -6 intact, x = -3.5 **broken**), one on the west wall at z = -20 (boarded after the first adaptation). Doors: east door to the hallway at z = -16.5, a door in the north wall at x = -3 to the mudroom.

Props (about 48): an orange sofa (`RETRO_ORANGE`, 2.0 by 0.9 by 0.85 m) against the west wall, bulged and overstuffed, with one cushion on the floor; a green armchair (`SOFA_GREEN`) with a doily on the headrest, angled toward the window; a coffee table (1.1 by 0.6 by 0.42 m) with an overturned mug, a newspaper, a remote and a broken record sleeve; a boxy wooden television on short legs at the east wall, glowing with static; a tall bookcase (1.0 by 0.3 by 2.3 m) leaning 4 degrees forward by the north wall, books spilled in front (25 physics books); a mantel with a toy train, a candle, and a snow globe; a floor lamp 2.4 m tall; a sideboard under the west window with a lamp and a bowl of wax fruit; a toy box; framed pictures; a record player; a stack of four cardboard boxes (0.5 by 0.4 by 0.35 each) by the broken window, two high, as the step to the sill (the top box at 0.35 m); a cat-scratch post; a houseplant; a bust on a pedestal wearing a hat; a stuffed deer head on the west wall; a plate rack.

Hiding spots: behind the sofa (crouch), inside the wardrobe-sized cabinet at the north wall (1.1 by 0.7 by 2.2 m).

Lighting: sunlight shafts from the front windows, a lamp, and warm firelight flicker from the fireplace (a few red-orange flame cards, no shadows). The broken window lets in a bright patch and bars of thin light through the boards on the west window.

Details: glass shards on the floor and sill (14 small shards as decals, 6 physics shards). Dust motes in the sun.

#### 8.5.3 The dining room (`dining`)

x[1.5,8] z[-20,-14]: 6.5 by 6.0 m, ceiling 3.5 m.

Walls: yellow pinstripe (`WALLPAPER_YELLOW`), wainscot, a plate rail at 2.0 m with decorative plates. Floor: wood with a dark border.

Doors: west door to the hallway (z = -16.5), a saloon-style swinging door (1.15 m wide, both halves swing) in the north wall at x = 4 to the kitchen. Windows: one on the south wall at x = 3.5 (dead flowers) and x = 6 (intact), one on the east wall at z = -17.

Props (about 44): a long table (2.2 by 1.0 by 0.78 m) set for three, with a cartoon roast chicken, green pea spheres, a wobbling jello mold, plates, glasses and napkins; six chairs, one pushed back, one tipped over; a china cabinet (1.2 by 0.45 by 1.9 m) with fogged glass doors and plates, a drawer with a pull; a sideboard with a lamp and decanters; a chandelier with five candle bulbs hanging at 2.3 m, slightly tilted by a snapped chain; a tall clock; a rug; a high-backed host chair at the head; a hutch; a vase of fake flowers; candlesticks; a bell.

Hiding spots: under the table (the cloth hangs to the floor, you can crouch), inside the china cabinet (the lower doors).

Lighting: a chandelier (warm bulbs), window light with a dusty shaft, a candelabra glow.

A security camera in the north-east ceiling corner appears here after the third use of the dining window as an entry.

#### 8.5.4 The kitchen (`kitchen`)

x[1.5,8] z[-26,-20]: 6.5 by 6.0 m, ceiling 3.4 m.

Floor: black and cream checkerboard (`FLOOR_TILE_A`, `FLOOR_TILE_B`, 0.3 m tiles). Walls: green flowers wallpaper above a mint half-height tile wainscot at 1.2 m (`RETRO_MINT`). Ceiling: cream, with a water stain.

Doors: the saloon door from the dining room at x = 4, z = -20; the side door at x = 8, z = -23.5 (locked or open per the neighbor's adaptation); a door to the basement stair is not from here (see 8.5.7). Windows: a wide window at x = 5 on the back wall.

Props (about 52): a bulged mint fridge (0.8 by 0.75 by 1.8 m) with a chrome handle that opens to a cartoon milk bottle set, a cake, an apple, a jug of green liquid, a wedge of cheese; a gas stove (0.75 by 0.65 by 0.9 m) with four burners and a red kettle that whistles at random intervals and lures the neighbor; a sink full of dishes under the window with a dripping tap; warm wood cabinets running along the north and east walls, wider at the top than the bottom, with door panels, chunky knobs and handles, one door hanging by a hinge; an island table (1.6 by 0.8 by 0.9 m) with a cutting board, a bread loaf, a fruit bowl and a stack of folded laundry; four stools; a toaster that pings; jars of candy; a cork board with notes, one of which has a crude drawing of the player's house and a question mark; a calendar with days crossed off; a wall clock; a spice rack; a knife block (rounded, harmless); a pantry cupboard (1.0 by 0.5 by 2.2 m) that can be entered; a trash can; a stack of pizza boxes; a mouse hole.

Hiding spots: inside the pantry; behind the island (crouch).

Lighting: sunlight through the back window, a pendant bulb over the island, the fridge's inner light.

#### 8.5.5 The mudroom (`mudroom`)

x[-4.5,0] z[-26,-22]: 4.5 by 4.0 m, ceiling 3.2 m.

Walls: painted `WAINSCOT` cream with wooden pegs at 1.6 m. Floor: dark wood with a muddy mat.

Doors: the back door at x = -2 (with the screen door) on the north wall; a door to the living room at x = -3 on the south wall. A ladder shaft in the corner at x[-0.8,-0.1], z[-23.4,-22.7] with a fixed steel ladder rising through the ceiling to the second floor and up to the purple room. The hatch above is closed until the crowbar frees it (section 8.7).

Props (about 40): the **washing machine**, a bulged cube (0.7 by 0.7 by 0.9 m) with a round porthole door, three dials on top that the player sets with the code, standing against the north wall at x = -3.8; a dryer beside it; hooks with coats, hats, a rain slicker; an umbrella stand; boots in a row; a bucket and mop; a laundry basket; shelves of detergent bottles; a dog bed (empty); a broom; a pile of rags; a spare light bulb box; a corkboard.

Secret: when the dial code is right, the washing machine shudders and slides aside to reveal a staircase down (hole x[-4.4,-3.2] z[-25.9,-24.7]) into a tunnel (section 8.9).

Hiding spot: inside the big laundry basket (the lid is down).

#### 8.5.6 The downstairs bathroom (`bath0`)

x[-8,-4.5] z[-26,-22]: 3.5 by 4.0 m, ceiling 3.2 m.

Pink tile floor, pink polka-dot wallpaper above pink tile wainscot, a clawfoot tub with a rubber-duck shower curtain, a pedestal sink with a mirror cabinet, a toilet with a fuzzy lid cover, a towel rail, a rug shaped like a frog, a scale, a bath mat, a high window at z = -24 (0.7 wide, sill 1.4). Door at x = -4.5, z = -24 on the east wall.

Props (about 30): soap, a toothbrush mug, a shaving brush and a razor (rounded), a rubber duck, bubble bath, a plunger, a stack of towels, a magazine rack, a night light, a loofah.

Hiding spot: in the tub behind the curtain (the neighbor sometimes checks it).

#### 8.5.7 The basement door and stair room (`basementStair`)

x[0,1.5] z[-26,-22]: 1.5 by 4.0 m. A narrow service passage reached from the hallway's north door at z = -22, x = 0.7.

The **basement door** is a heavy reinforced door painted dark green, 0.95 by 2.6 m, with three locks, a chain, planks nailed across it, and a big orange padlock. Light in sour cyan-green (`BASEMENT_LIGHT`) leaks around its edges. Muffled thumps come from beyond it. It cannot be opened until the final run (section 8.10).

Inside, the stair room is bare concrete with a bare bulb, painted `BASEMENT_WALL`, and the top of a long stair going down (hole x[0.1,1.4] z[-25.8,-22.2]), 22 steps of 0.2 m rise, ending in the basement proper (section 8.10).

#### 8.5.8 The basement proper

The real basement under the house is not part of Act 1. In Act 1 the player only sees its stair and the sealed door, then the long way down (section 8.10). The basement itself is part of Act 2 (section 9). Do not build or load a separate basement room in Act 1.
---


### 8.6 First floor (F1), room by room

F1 floor top y 4.50, height 3.4. The floors up here lean and creak. The whole upper block leans 2 to 3 degrees, so doors are slightly parallelogram-shaped (their tops shifted 2 to 5 cm) and the floors in a couple of rooms tilt by a visible half degree. Keep every tilt small enough that the player's capsule never slides and every door still closes.

#### 8.6.1 The upstairs hallway (`hall1`)

x[-2.4,0.4] z[-26,-14]: 2.8 by 12.0 m, ceiling 3.4 m. A long, narrow, slightly sloping hall (the floor falls 0.06 m toward the front).

Walls: pink polka dots (`WALLPAPER_PINK` with `WALLPAPER_PINK_DOT`) above a wainscot, a picture rail. Floor: wood with a green runner (`CARPET_GREEN`, 0.9 m wide). Ceiling: cream with a long crack.

The main stair comes up through the floor at x[-1.42,-0.28], z[-22,-17.15], where the floor has a rectangular opening guarded by a chunky railing on both long sides (0.9 m tall, balusters every 0.12 m). The player arrives at the north end (z about -22) and turns around south or continues north. The strips beside the opening are 0.98 m (west) and 0.68 m (east) wide, which is tight on purpose and still walkable by the capsule.

Doors on the west wall (x = -2.4): at z = -15.2 a **fake door** (opens onto a solid brick wall, a joke), at z = -18.5 the bedroom, at z = -22 the bathroom, at z = -24.3 the back stairwell. On the east wall (x = 0.4): at z = -16.8 the study, at z = -21.6 the **kid's room** (blue lock), at z = -24.9 the **utility closet** (red lock). A window at the south end (x = -1, z = -14, 1.4 by 2.1 m, sill 0.7) and a small window at the north end (x = -1, z = -26).

The **attic key** hangs on a nail on the west wall of the stairwell opening at (x = -2.33, y 7.05, z = -18.2), 2.55 m above the floor, in plain sight and out of reach (only the magnet gun pulls it down). A small brass plaque beneath it says nothing.

Props (about 34): a runner, a wall sconce every 3 m, a row of framed cartoon landscapes (some crooked), a side table with a vase, a coat rack, a ladder-back chair, a barometer, a small bookcase, an old radiator, a fire extinguisher in a red box (it is a throwable, loud), a plant, a basket of slippers, a floor-length mirror, a tall clock stopped at 4:17, a window seat at the south end with a cushion.

Hiding spot: the tall cabinet at the north end (0.9 by 0.5 by 2.1 m).

Lighting: one bulb at each end, sconces, window light from the ends. It is dim in the middle, which makes the doors feel far apart.

#### 8.6.2 Grimsby's bedroom (`bedroom`)

x[-7,-2.4] z[-20.5,-14]: 4.6 by 6.5 m, ceiling 3.4 m.

Walls: blue diamonds. Floor: a green carpet (`CARPET_GREEN`) with a darker border. Windows: x = -5.5 and x = -3.5 on the south wall, z = -17 on the west wall. Door on the east wall at z = -18.5.

Props (about 46): a big bed (2.0 by 1.6 by 0.55 m) with a patchwork quilt, a scalloped headboard 1.6 m tall, two bulged pillows, and a shoebox under it (a decoy: photos and a pressed flower); a nightstand with an alarm clock (a lure: it rings when interacted with and draws the neighbor upstairs) and a lamp; a dresser with a mirror; a wardrobe (1.2 by 0.6 by 2.4 m, tapered, hideable); a chair with a spare sweater vest folded over it; a framed picture above the bed of the neighbor with a woman and two kids, all smiling, in the same bright cartoon style; slippers; a rug; a clothes hamper; a telescope on a tripod pointed at the player's house; a bookcase with fat books; a hat stand; a stack of letters; a wind-up toy; a coat hanger on the door.

Hiding spots: the wardrobe, under the bed.

#### 8.6.3 The upstairs bathroom (`bath1`)

x[-7,-2.4] z[-23.5,-20.5]: 4.6 by 3.0 m, ceiling 3.2 m. Bright yellow tile floor and wall tile, a huge clawfoot tub, an overflowing medicine cabinet, a laundry hamper, a small window at z = -22 (0.7 wide, sill 1.3). A drip from the tap that the player can hear from the hall. Props (about 28): towels, a bath brush, a toy boat, soap bars shaped like animals, hair brushes, a scale, a basket of magazines. Hiding spot: the hamper (large).

#### 8.6.4 The back stairwell (`stair2`)

x[-7,-2.4] z[-26,-23.5]: 4.6 by 2.5 m, ceiling 3.4 m, plain painted `WAINSCOT` cream. A U-turn stair goes up to the mint wing: a first flight west, a landing at x about -6.4, a second flight back east, through slab holes x[-6.95,-2.7] z[-25.95,-23.55] on F1 and F2. Risers 0.2 m, treads 0.26 m, width 1.0 m, rails on both sides, a small window at z = -24.8 (0.6 wide, sill 1.6). Props: a ladder-back chair on the landing, a pile of old coats, a framed photo of an unsmiling man in a mustache, a bucket catching a drip.

#### 8.6.5 The study (`study`)

x[0.4,8.6] z[-19.5,-14]: 8.2 by 5.5 m, plus the front jut x[2,8.6] z[-14,-13.2] (the part that overhangs the porch). Ceiling 3.4 m.

Walls: green stripes. Floor: wood. Windows: x = 3.3 and x = 7.6 on the jut, the balcony door at x = 5.5. The door to the hall at z = -16.8 on the west wall.

Props (about 48): the **green table** (0.8 by 0.6 by 0.74 m, painted green) by the window, where the **red key** lies on a doily; a big desk (1.6 by 0.8 by 0.75 m) with a typewriter, a lamp, blueprints, a stack of papers, a pencil jar, a calculator; blueprints pinned to the wall that show more rooms than the player has found; a drafting lamp; shelves with tools, jars of nails, a model of the street on a table with a tiny version of the player's house marked with a red X; a filing cabinet; a globe; a swivel chair; a rug; binoculars on a stand; a safe (decoy); a cork board; a coat; a rolled map.

Hiding spots: under the desk (the front panel hides you), the tall cabinet.

Lighting: sunlight from the balcony door in a warm shaft, a drafting lamp.

#### 8.6.6 The kid's room (`kid`)

x[0.4,8.6] z[-23.8,-19.5]: 8.2 by 4.3 m, ceiling 3.2 m. Door at z = -21.6, locked with the blue key.

The quietest room in the game. It is frozen in time. Wallpaper: clouds (`clouds`, `WALLPAPER_BLUE` with white), with a high border of painted stars. Floor: a red carpet (`CARPET_RED`) with a pale rug shaped like a road map on it. Window at z = -21.7 on the east wall.

Props (about 50): a small bed with a race-car frame and a faded blanket, made; toys scattered on the road-map rug (a wooden train, a car transporter with six little cars, blocks, a spinning top, a stuffed rabbit); a toy chest (0.9 by 0.5 by 0.5 m) that the player can drag; shelves of stuffed animals (slightly oversized), a doll house, a rocking horse; a mobile of planets that spins slowly over the bed with a soft tinkle; a child-sized mannequin sitting on the bed facing the wall; a small desk with crayons and a drawing of a house with a happy sun; a growth chart on the door frame with pencil lines to age 7; a night light shaped like a moon; a bedside lamp; a toy xylophone; a pile of picture books.

The **crowbar** rests on a high shelf (x = 1.6, y 7.3, z = -19.72), 2.8 m above the floor, out of reach unless the player stacks the toy chest, a box and a chair (the chest at 0.5 m, a box on it at 0.9, and a jump) or uses the magnet gun once they have it.

Hiding spots: inside the toy chest (big enough to crouch), behind the door.

Sound design note (for the lighting and mood): when the player is in this room, the music drops out and only the mobile's tinkle and a faint music box play.

#### 8.6.7 The utility closet (`closet`)

x[0.4,8.6] z[-26,-23.8]: 8.2 by 2.2 m, ceiling 3.2 m. Door at z = -24.9, locked with the red key. Painted metal-grey, a concrete floor, a long workbench along the north wall.

Props (about 40): a big red **toolbox** (0.8 by 0.35 by 0.35 m, latches and handle) holding the **wrench**; shelves of paint cans, nails, screws, rope, chain; a pegboard with outlines of tools (some missing); a vice; a hanging coil of cable; a fuse box on the wall; a mop bucket; spare bulbs; a stack of boards; a box of bolts; a coffee can of washers; a calendar from 1987 with a month circled; a small radio; a broken window pane leaning against the wall. A small window at x = 4 on the back wall.

### 8.7 Second level (F2): the mint wing

F2 floor top y 8.20, height 3.6. The whole chunk leans 3 degrees west (shear about its pivot), and the floors are lived-in and dusty.

#### 8.7.1 The landing (`landing`)

x[-7,-1] z[-26,-18]: 6.0 by 8.0 m, ceiling 3.6 m. Mint walls (`RETRO_MINT`), old wood floor, a gabled ceiling, exposed beams. The back stair arrives at its north-west corner. Windows: the round porthole at x = -4 on the south wall, a tall narrow window at x = 0.5 is in the purple room's wall, a window at z = -21 on the west wall, a window at x = -4 on the north wall.

Props (about 55): stacked boxes to the ceiling (a labyrinth of cardboard 1.5 to 2.5 m high), a dressmaker's dummy, a rocking horse that rocks on its own sometimes, old suitcases, a chest of drawers, a rolled rug, a birdcage, a spinning wheel, a tall mirror covered with a sheet, hat boxes, an old pram, lampshades, a ghostly white sheet over a chair, rope, Christmas lights, a mound of old toys.

Doors: the stair opening, a door on the east wall (x = 2 mint wing east face) at z = -20 with the **green lock** that opens onto the plank bridge, and the door to the purple room at z = -22 in the partition x = -1.

Hiding spots: behind the box stacks (there are four deliberately, forming a small maze), inside a big trunk.

#### 8.7.2 The purple room (`purple`)

x[-1,2] z[-26,-18]: 3.0 by 8.0 m, ceiling 3.6 m. The door (x = -1, z = -22) is boarded with three nailed planks (`NH_PLANKS`) that need the crowbar (each board takes 1.2 seconds to pry with a squealing crack and a splinter burst).

Walls: deep purple paint (`WALL_PAINT_PURPLE`) with a darker skirting. Floor: old wood. A single bare bulb. A single chair in the middle facing a television on the floor that plays a looping clip of a carnival (a canvas animation of a spinning carousel), a radio on a stool playing a faint music-box waltz, and on the west wall a hook with the **green key** on it at (x about -0.8, y 9.6, z = -21.2).

The ladder shaft: a hatch in the floor at x[-0.8,-0.1] z[-23.4,-22.7] (the top of the mudroom ladder). It is closed and latched from above. Once the player opens it from this side, the shaft becomes a shortcut down to the mudroom.

Hiding spot: none (this room is a dead end by design, so it is tense).

### 8.8 The tomato room and the attic tower

#### 8.8.1 The tomato room (`tomato`)

x[5,9] z[-23,-19], floor y 8.60, height 2.8. A bolted-on box leaning 5 degrees east. Reached over the plank bridge from the mint wing's green door. Dusty tomato-red siding outside, raw planks and corrugated metal patches inside and out. The floor is old planks with gaps showing the yard 9 m below (the gaps are 3 cm wide and decorative, the collider is solid).

Props (about 38): a workbench along the east wall with a vice, the **magnet gun** (a red horseshoe magnet on a handle with a battery pack, at x about 6.3, y 9.65, z = -21), a bank of security monitors (four boxy screens, grey static, showing flickering views of the hall, the kitchen, the yard and the basement door, which the player can watch to see where the neighbor is), a box of **bear traps** (six, the ones he places), a tripod with a camera, a coil of power cable, a camera on a bracket, a shelf of spare lenses, a blueprint of the house with notes, a cot, a thermos, an ashtray, a toolbox, a ladder.

Windows: a small window on the south wall at x = 7 with a closed curtain, a gap on the west wall at z = -22.5 (open, no glass) onto the bridge.

#### 8.8.2 The attic tower (`attic`)

x[-5,-2] z[-23,-20], floor y 12.0, height 4.4. Reached by a steel ladder through a hatch at x[-4,-3.2] z[-22,-21.2] from the landing, locked with the **attic key** (a padlock hanging on the hatch).

A tiny triangular-feeling room under a steep roof. Planks (`NH_PLANKS_OLD`), a single bare bulb on a cord in the center, a tiny window on the south face at x = -3.5 (0.5 wide, sill 1.4) where the bulb glows when seen from the street.

Props (about 20): a trunk containing the **note** (a drawing of the washing machine with three numbers, which are the random combination), a telescope on a tripod pointed at the player's bedroom window, a stack of postcards, a pigeon cage, a stuffed owl, a candle stub, a rope, a hat box, a crate of old coins.

### 8.9 The tunnel under the washing machine

When the player sets the washer's three dials to the code from the attic note, the washing machine shudders, slides 0.9 m to the side on hidden rails, and reveals a hatch in the floor and a narrow stair going down through the opening x[-4.4,-3.2] z[-25.9,-24.7].

The tunnel is a hand-dug brick passage, 1.6 m wide, 2.2 m high, 14 m long, running east under the mudroom and kitchen, to the cage. Brick walls (`NH_FOUNDATION` and old red brick), a dirt floor with planks laid in a path, an arched ceiling, pipes along one wall, three bare bulbs on cords every 4 m, a puddle with a drip from the leak, cobwebs, a toy train track along the floor (decoration), small shelves cut into the wall with jars.

At the east end (about x = -0.5, z = -25.3) a steel **cage** (1.2 by 1.2 by 2.0 m, bolted with four big bolts) holds the **basement key** (orange, `KEY_BASEMENT`, glowing). The wrench turns the four bolts (1.0 seconds each, loud clunks), and the cage door swings open. The key hangs on a hook high in the cage, so the player needs to jump or use the magnet.

A crawlspace at the tunnel's end leads back up to the basement stair room (a one-way shortcut, with a grate that falls away when the player pushes it from below).

### 8.10 The final run, the opening, and the long way down

When the player takes the basement key, the neighbor becomes alert. He goes to the hallway and stands guard in front of the basement door, facing the player's approach, and slowly patrols a short loop. The music drops to a held note.

The player must lure him away. The levers are the kettle, the alarm clock, the radio and the TV (each can be used a limited number of times before he ignores it), a thrown object smashing a far window, the doorbell, or the porch swing. Once he leaves the hall, the player runs to the basement door.

**The opening:** three locks, a chain and the padlock come off one after another in a short animation (3 seconds total) during which the player is vulnerable. The planks are already gone. Light floods out: that sour cyan-green, a sudden wash across the hallway.

**The long way down:** the basement door opens onto a stair that goes down for a very long time (about 60 steps, with a landing every 15 steps, each landing under one bare bulb, the walls getting greener and the stair slightly too wide as it goes). The ceiling lowers and the lights hum. The music thins to a single held tone.

**The room at the bottom:** a small, ordinary-looking room (4 by 4 by 2.4 m) with plain walls, a worn wooden chair holding a teddy bear, a child's drawing taped to the wall (a happy house with a mustached man and a tiny person), a rug, a nightlight, and a door at the far end. The player walks toward the door. The neighbor's silhouette appears at the top of the stairs behind them. A big heavy door slams, a lock turns. Cut to black. Card: "ACT 1 COMPLETE." Stats: catches, time, routes discovered, traps triggered.

The door at the far end opens, after the card, into the Act 2 start (section 9.2).

### 8.11 Items, routes and the chain (the whole of Act 1)

```
start                the player wakes in the bedroom, looks out the window, sees the neighbor drag a sack to the cellar doors
1  get inside        broken window / side door / back door / porch roof / tree / ladder / yellow key
2  red key           on the green table in the study (F1), opens the utility closet's red door at the end of the upstairs hall
3  wrench            in the red toolbox in the closet, turns the pool valve and the cage bolts
4  pool valve        in the back yard, needs the wrench, drains the pool in 8 s
5  blue key          on the pool floor, opens the kid's room (blue lock)
6  crowbar           high shelf in the kid's room (toy chest + box + jump), pries boards
7  purple door       3 boards, crowbar, opens the purple room
8  green key         on the hook in the purple room, opens the green door on the mint wing's east face
9  plank bridge      to the tomato room
10 magnet gun        on the workbench in the tomato room
11 attic key         on the nail in the main stairwell (magnet)
12 attic note        in the trunk, three numbers
13 washer            set the dials, reveals the tunnel
14 tunnel and cage   wrench the bolts, take the basement key
15 final run         lure him, open the door, walk down, the door slams
```

Alternatives and shortcuts the validator must confirm exist: the green key can be pulled by the magnet from the landing through the purple-room gap if the boards are loose. The crowbar can be pulled by the magnet when held. The yellow key (in the grandfather clock) opens the front door as a shortcut back out. Every step has a visible hint (a drawing on the cork board, a note on the fridge, the blueprints in the study, the monitors in the tomato room).

### 8.12 Hiding spots, in one table

```
hall            cupboard under the stairs
living room     behind the sofa, the north cabinet
dining room     under the table, the china cabinet
kitchen         the pantry, behind the island
mudroom         the laundry basket
bath0           the tub behind the curtain
hall1           the tall cabinet at the north end
bedroom         the wardrobe, under the bed
bath1           the hamper
study           under the desk, the cabinet
kid's room      the toy chest, behind the door
landing         the box maze, a trunk
yard            under the porch, behind the shed, among the hanging laundry
```

Each has a view through slats (horizontal dark bars with light between them) while hidden, a heartbeat that rises when the neighbor is near, and a short enter and exit animation. The neighbor checks some spots when searching but not all, and the learning brain makes him check the most used ones first.

### 8.13 What the neighbor changes (so the player can see it)

His adaptations must be clearly visible objects, so the player understands without text.

- **Bear trap:** a round steel plate 0.45 m across with two spring-loaded jaws with teeth, in dull dark grey with a red release pad. Open and half hidden near an entry. Snaps with a clang, holds the player for 3 seconds.
- **Security camera:** a boxy grey body 0.2 by 0.1 by 0.1 m on a bracket with a blinking red LED and a faint pale-red cone of light showing its view, sweeping 90 degrees over 8 seconds.
- **Boards:** three raw planks across a window or door, held by visible bolts.
- **Lock:** a bright padlock on a door he used to leave open.
- **Glue puddle:** a shiny green puddle under windows, slowing the player to 30 percent.
- **Establishing shot:** after a catch, the wake-up scene shows a 2 second view from the bedroom window of the neighbor carrying planks or a camera. Skippable.

The brain caps its work at six traps, four cameras, and three boarded entries at once, and never boards or locks the last two routes the player has not used.

### 8.14 Act 1 lighting through the day

The story clock starts at late afternoon (sun 35 degrees up, low in the west-southwest) and moves toward golden hour with each catch. After five catches the sky is orange and the long shadows run across the whole street. In the house, windows throw sun bars, and the rooms get warmer. Never night in Act 1.

---


## 9. ACT 2: THE UNDERNEATH

A hand-dug, patched-together basement complex that runs under the whole lot and further. Nothing here has a sky. Everything is lit by tube lights, bare bulbs, red emergency lamps, and the headlamp of a man who knows the place by heart. It is cold, wet, teal and green, and full of things that belong above ground: carnival horses, a ticket booth, a stage, mannequins, a train cart. The player's job is to get out.

### 9.0 Rules for Act 2

Act 2 is its own scene. It loads on the Act 1 ending card and unloads Act 1. It has its own local coordinates: **origin at the center of the arrival room's floor, +x east, +z south, y up, floor level y = 0** unless a room says otherwise. All measurements below are in meters in that frame. Where a room has a wall with a thickness, it is 0.3 m for the big structural walls and 0.18 m for partitions.

Density rules from section 8.0 apply, with these differences: rooms here are bigger and emptier in the middle on purpose, and the clutter hugs the walls and fills the dead ends. Every area still has at least two exits (vents and crawl spaces count if they are 0.9 m or higher), at least one hiding spot, and a clear sneaking lane.

Ceilings are 3.4 m in corridors, 4.5 to 8 m in the big halls. Walls are chunky: concrete, brick and patched sheet metal, never thin.

Water: ankle-deep (0.15 m) slows the player to 85 percent, knee-deep (0.5 m) to 70 percent, waist-deep (0.9 m) to 55 percent, with splashing sounds and ripples. The neighbor is slowed by 60 percent in waist-deep water and visibly wades. Deeper than 1.1 m is not allowed anywhere (no swimming, no drowning).

### 9.1 The map at a glance

```
y = 0 is the main floor. +z is south. Walls are drawn as lines. Not to scale.

              [Flooded Passage]
                     |
     [Mannequin Hall]--[Pump Cavern]
            |              |
[Landing]--[Boiler Gallery]-----------[Boiler Room]--[Carnival Hall]
                 |                                        |
              [The Stacks]------(mine cart track)-----[Workshop]
                                                          
                         [Exit Shaft] is north-east of the Carnival Hall
```

In coordinates:

```
Landing (arrival room)      x[-2,2]    z[-2,2]
Boiler Gallery              x[2,34]    z[-1.5,1.5]
Boiler Room                 x[28,36]   z[-5,5]       (the east end of the gallery widens)
Pump Cavern                 center (18,-14) radius 9   (circular, north of the gallery)
The Stacks                  x[4,36]    z[2.0,24.0]    (south of the gallery)
Carnival Hall               x[38,64]   z[-14,14]
Workshop                    x[38,54]   z[16,28]
Mannequin Hall              x[-20,-4]  z[-14,-8]      (north-west, reached from the Pump Cavern ring)
Flooded Passage             x[18,40]   z[-32,-24]     (north of the cavern)
Exit Shaft                  center (50,-26) radius 3.5, height 16
Vent network                0.9 m high crawlways linking the Stacks, the Workshop, the Gallery and the Cavern ring
Mine cart track             from the Stacks east door (x = 36, z = 21) to the Workshop (x = 38, z = 21), 0.9 m gauge
```

### 9.2 The Landing (arrival room)

x[-2,2] z[-2,2], 4 by 4 m, ceiling 2.4 m. This is the plain room at the bottom of Act 1's long stair, and it must look exactly like the final room of Act 1: the same plain walls (flat pale green `#A9C3A0`), the same worn wooden chair holding the same teddy bear, the same child's drawing taped to the wall, the same rug and nightlight. When Act 2 begins, the door that slammed is still shut behind the player (the stair door is on the west wall at x = -2, locked, with a small round window that shows the stair in darkness).

The room has changed in one way: the far east door (x = 2, z = 0) is slightly ajar, and a draft of cold air carries steam through the crack. After the Act 2 title card (4 seconds), the lights flicker, the nightlight dims, and the door swings open with a metal clunk. A cyan-green light spills in.

Props: the chair and bear, the drawing, a rug, a nightlight on a socket, a small shelf with three picture books, a toy telephone, a tiny table with a cup and two plates.

The drawing: a crayon house with a yellow sun, a tall mustached man holding hands with a small person in a blue coat, and a woman with a long dress. The drawing is on a sheet of paper whose bottom corner is curled, and when the player looks at it for 3 seconds, the lights in the room dim by 10 percent (a tiny creepy beat).

### 9.3 The Boiler Gallery

x[2,34] z[-1.5,1.5], 32 by 3 m, ceiling 3.4 m. The spine of the complex.

**Walls:** grey-green painted concrete (`BASEMENT_WALL`) up to 1.4 m, bare grey concrete above, vertical pipe brackets every 2 m. **Floor:** dark concrete (`BASEMENT_FLOOR`) with a central drain channel (0.2 m wide) and a crust of dried water marks. **Ceiling:** a dense run of pipes in six colors (rust, copper, dull green, grey, blue, one bright red), with valve wheels, gauges and cobwebs. Tube lights every 6 m in cyan with a flicker that is not synced between lights, each in a cage. Steam leaks from two joints (at x = 10 and x = 22), white card sprites rising and fading, with a hiss.

**Openings:**
- West end: the Landing door (x = 2, z = 0), 1.0 by 2.6 m.
- North wall, x = 18: a wide archway (2.4 m wide, 2.8 m tall) with a rusted iron gate hanging open, into the Pump Cavern.
- South wall, x = 9: a heavy door (1.0 by 2.4 m) with a small window, into the Stacks.
- East end: the gallery widens to the Boiler Room.

**Props (about 60):** a long row of wall lockers (6 dented steel lockers, 0.5 by 0.5 by 1.8 m, two open, one with a raincoat and a hard hat), a bench, a rack of lanterns (the player takes one: a hand lantern with a warm flame-colored light, in addition to the flashlight, 6 m range, shadowless), a bucket under a dripping pipe, a mop, a hose coiled on a reel, rolls of tape, a fuse panel (empty, with spaces for three fuses), a first aid box, a rusted toolbox, a heap of sandbags, a wheelbarrow, a fire axe in a glass case (decor, fixed), a wall map of the complex that is torn and shows only half the plan, a stack of crates with stenciled letters, a sign that says WATCH YOUR HEAD, a pair of rubber boots, a wall calendar from a year with a coffee ring, a toy train car on the floor.

**Hiding spots:** inside the open lockers (two), behind the sandbags (crouch).

**What makes it memorable:** the long, flickering perspective: at the far end you can see the red glow of the Boiler Room, and every pipe runs toward it.

### 9.4 The Boiler Room

x[28,36] z[-5,5], 8 by 10 m, ceiling 5.5 m. The east end of the gallery opens into a big round-cornered room dominated by a huge boiler.

The **boiler** is a bulged, riveted, dark green cylinder 2.6 m across and 3.8 m tall, standing on a brick plinth at x = 32, z = 0, with a round iron door (0.8 m), a glowing red slit window, a ring of gauges (nine of them, needles twitching), a chimney pipe going up through the ceiling, and a pressure valve that hisses every 20 seconds. Heat shimmers above it (a faint distortion card). A **fuse box** on the north wall holds three fuse slots, all empty until the player finds the fuses (section 9.12). The boiler's door can be opened and the player can hide in the cold ash pit beside it (a crouch hiding spot).

**Props (about 45):** coal heaps (instanced chunky coal), a shovel, a pile of firewood, a coal barrow, a bank of pressure gauges on the wall, a spare pipe rack, a barrel of oil, a long workbench with a vice, a ladder, a stack of tires, oily rags, a steel stair to a mezzanine (y = 2.5) running along the north wall, with a handrail and two cabinets, a chair and a table with a thermos and a sandwich in wax paper (as if someone just left).

**Exits:** the gallery (west), a steel door in the east wall at x = 36, z = 0 (heavy, locked until the player drains the cistern in step 7 of section 9.12), a hatch in the mezzanine floor into the vent network.

### 9.5 The Pump Cavern

A big circular cistern, centered at (18, -14), radius 9 m, 8 m tall under a shallow dome, entered through the archway in the gallery's north wall at (18, -1.5). The **most impressive room in Act 2**.

**Structure.** A ring catwalk at y = 0, 1.6 m wide, runs around the inside of the wall (from radius 7.4 to 9.0). Four spoke bridges (1.2 m wide, with handrails, iron grating floors) cross from the ring to a central island at y = 0 (radius 2.6). Beneath, the floor of the cistern is at y = -3.4. The water surface is at y = -2.0 (1.4 m deep when full, which is deeper than the allowed walking depth, so the player never enters the water here: the catwalks are the only walkable route, and the water is a hazard to look at, not to swim in). A ladder at the south spoke goes down to a flooded-floor ledge at y = -1.6, 0.4 m above the water, for access to the hatch once the cistern drains.

**Walls and dome.** Curved concrete walls in damp grey-green with long vertical streaks of white and rust, ribbed with iron bands every 1.5 m. The dome is brick, in a herringbone pattern, with a round skylight that is sealed and painted black. Water drips from the dome in slow beats, each making a ring on the water and an echo.

**The central island.** A wide round platform with three tall iron valve stems (1.2 m high) arranged in a triangle, each missing its handwheel. A fat colored ring painted around the base of each stem: red, yellow, blue. A rusted control podium with a big lever (pulled once the three wheels are on) and a pressure gauge. A single tall pipe goes up through the dome. On the floor, a faded painted circle with arrows.

**Lighting.** Four hanging cages of cyan tube lights (one working, one flickering, two dead), a ring of small red emergency lamps pulsing around the catwalk, and green light reflected off the water that dances on the dome. The water glows faintly from below in a teal tone (a fake light card).

**Props (about 40):** stacks of sandbags, a rowboat tied to the ring catwalk with a rope (decor, not usable), a life ring, a coil of rope, a pair of waders hanging, a mooring cleat, lanterns, a pump housing with a flywheel, a few floating crates and barrels bobbing in the water (instanced, with a gentle bob), a drowned toy train, a rubber duck, a long metal ladder lashed to the dome wall.

**Hiding spots:** behind a pump housing on the ring catwalk, inside an open barrel (large, crouch).

**When drained** (after step 7 of section 9.12): the water level falls over 20 seconds to y = -3.3, the draining gurgle echoes, the cistern floor is visible: slick concrete, a heap of old toys, and a round iron hatch (1.1 m across) at the center of the floor with a bolted wheel. The player descends the south ladder and opens the hatch to reach a pipe that leads to the Flooded Passage's drain end.

**Openings:** the gallery archway (south), a doorway on the ring to the Mannequin Hall (west, at about (9.0, -14), a door 1.0 by 2.4 m), a door on the north to the Flooded Passage (at about (18, -23), a tall iron door, 1.0 by 2.4 m), and a vent grille low on the east side (0.9 by 0.9 m).

### 9.6 The Stacks

A storage maze south of the gallery: x[4,36] z[2.0,24.0], ceiling 4.0 m. A warehouse of steel shelving racks, each rack a chunky block 2 by 2 m in plan and 3.2 m tall, packed with boxes, jars, tools, and toys, with 2 m aisles between. The neighbor patrols here, and the player must sneak.

**Layout.** 16 columns by 11 rows of 2 m cells, each cell at x = 4 + 2c + 1 (center), z = 2.0 + 2r + 1. `#` is a rack block, `.` is open aisle, `D` is the door from the gallery (at column 3, row 0), `E` is the east door to the Carnival Hall (at column 15, row 5), `R` marks the bay holding the **red valve wheel** (column 3, row 3), `T` marks the east door of the mine cart track (column 15, row 9). `X` marks the dead-end bays that hold optional goodies.

```
col  0 1 2 3 4 5 6 7 8 9 A B C D E F
r0   # # # D # # # # # # # # # # # #
r1   # . . . . . . . . . . . . . . #
r2   # . # # # . # # # # . # # # . #
r3   # . # R # . # X . # . # X # . #
r4   # . # . # . # . # # . # . # . #
r5   # . . . . . . . . . . . . . . E
r6   # . # # # . # # # . # # # # . #
r7   # . # X . . . . # . # . . # . #
r8   # . # . # # # . # . # . # # . #
r9   # . . . . . . . . . . . . . . T
r10  # # # # # # # # # # # # # # # #
```

The racks have different heights (2.4 to 3.2 m) and different fill, so the maze reads as a place and not a grid. The central cross-aisles (row 1, row 5, row 9 and columns 1, 5, 14) are 2 m wide. The pockets (`X`) are dead ends with items.

**Floor:** dark concrete with yellow painted lane lines and arrows, a few oil stains, a chalked hopscotch grid in one aisle. **Walls and ceiling:** bare concrete, a lattice of steel beams at 3.6 m, hanging tube lights above every second aisle (some dead). A gantry crane track runs along the ceiling over row 5 (decor, not usable). **Racks:** each has four shelves with stenciled labels (A1, B7, TOYS, JARS, XMAS, NAILS, SPARE), filled with cardboard boxes (instanced), jars of glowing green liquid, rolled carpets, paint cans, stacked picture frames, tool crates, stuffed animals in clear bags, and lampshades. Every rack bay has a number painted at the end.

**Key props.**
- The **red valve wheel** in the bay at column 3, row 3: a big red iron handwheel hung on a hook at the back of a dead-end bay, reached from the aisle below through column 3, row 4.
- A **forklift** (red, chunky, 2.6 m long) parked at column 9 row 5, a hand pallet jack, a stack of pallets forming stairs up to a mezzanine at x = 20, z = 14 (y = 2.4) with a cage hiding a **crowbar** (used on stuck crates and one door).
- A **mine cart** (0.9 m gauge track) enters at the east door (column 15, row 9, `T`) and leads out of the room to the Workshop. A small iron cart (1.0 by 0.7 by 0.6 m) rests on the rails.
- Inside the `X` pocket at column 12, row 3: a stack of 12 identical boxes labeled FRAGILE, all of which are empty except one holding the **ticket booth key** (a small brass key on a ribbon).
- Inside the `X` at column 3, row 7: an old child's tricycle and a wind-up bear that starts walking when the player passes (a gentle jump scare, once).
- Inside the `X` at column 7, row 3: a stack of birthday party props (paper plates, streamers, a banner folded up, a box of candles, balloons) that foreshadow Act 3.

**Hiding spots:** inside open boxes (large ones, five of them), behind rolled carpets, under the pallet stack, in a gap between racks marked with a faded fox-hole sign.

**What makes it memorable:** the claustrophobia of walking in 2 m aisles between 3 m walls of cardboard in cyan light, hearing the neighbor's slow footsteps and the creak of his lantern, not knowing which aisle he is in.

### 9.7 The Carnival Hall

x[38,64] z[-14,14], 26 by 28 m, ceiling 8 m. A huge, forgotten, brightly painted hall: the only part of Act 2 where color blooms, and the reason the place feels uncanny. It is entered from the Boiler Room's east door (x = 36, z = 0) and from the Stacks' east door (x = 36, z = 13).

**Floor:** wide painted planks laid in a big sunburst, red, yellow and blue wedges, scuffed. **Walls:** a repeating mural of stripes and bunting in faded red, white and blue, with a wooden wainscot. **Ceiling:** a lofted canvas tent ceiling (a huge striped red and cream sweep of fabric dropping to the walls) with a ring of old bulbs strung in loops, half working in warm yellow and pink. The rest of the hall is dim; the lit pockets are the carousel, the stage and the ticket booth.

**The carousel.** At the center, (51, 0). A round wooden platform 8 m across, 0.4 m high, with a candy-striped canopy (red and white wedges) on a central pole, and a scalloped cornice with a ring of bulbs. Twelve horses (each 1.6 m long, painted in white, red, yellow, blue and green with gilded manes), in three rings, on brass poles. Two benches. It turns slowly on its own, one revolution per 40 seconds, with a lopsided wheeze and a tinkling calliope melody that plays only when it is on. A brass control lever sits at its base (the player can stop it). On the **yellow horse** at the outer ring (the only yellow one, with a missing ear) hangs the **yellow valve wheel** from its saddle horn. The player must jump onto the moving platform and take it.

**The ticket booth.** A narrow red booth (1.6 by 1.6 by 2.8 m) at (42, 8), with a glass window, a brass coin slot, a stool, a cash drawer (locked, opened with the ticket booth key from the Stacks), a roll of tickets, and a hand-painted sign with the three-digit code printed as a lucky number. The code is random per run (three digits from 1 to 9, chosen when the act starts and stored in the save). Print it three times around the hall: on the booth sign, as numbers on three prize ribbons on the wall, and chalked on the stage floor. The drawer holds the **workshop padlock key** (a chunky padlock key tagged WORKSHOP).

**The stage.** A raised stage at the north wall (x[48,60] z[-14,-10], 1.2 m high), a red velvet curtain half drawn, a spotlight cone (a soft yellow cone of light, shadowless), two wooden steps. On it a row of eleven **mannequins** in party hats seated in folding chairs, facing the empty carousel, as if watching a show. Some wear bright children's clothes. All of them face the same direction. A tin drum, a trumpet and a banjo on stands. When the player first enters, one of the mannequins has turned its head a few degrees (once).

**The mirror maze.** A small mirror maze (x[40,48] z[-12,-4], 8 by 8 m) with warped mirrors (the mirrors are painted panels with a bulge, not real reflections), a few doors that open onto nothing, and a hidden sliding panel to a vent (the vent leads to the Pump Cavern's east grille).

**Stalls and props (about 80):** a popcorn cart, a cotton candy machine with fluffy pink floss, a ring-toss booth with bottles, a coconut shy, a high striker (a tall tower with a bell that rings when hit with a mallet), a crooked fortune-teller booth with a crystal ball, a row of rubber ducks in a trough, strings of bunting, a stack of folded chairs, balloons floating at the ceiling (instanced, 40), a giant plush bear, a wheel of fortune, a pile of prize teddy bears, a broken clown figure, scattered tickets, a snow cone cart, a pony ride with three wooden ponies.

**Hiding spots:** inside the fortune-teller booth, behind the curtain on the stage, in the popcorn cart, between the pony ride's ponies.

**Lighting:** the carousel bulbs (warm yellow and pink), the stage spot, a purple tinted work light, candy-colored stall lights, and the red glow from the Boiler Room door.

### 9.8 The Workshop

x[38,54] z[16,28], 16 by 12 m, ceiling 4.0 m. The neighbor's real workshop, and the heart of the story. It is entered from the Carnival Hall by a door at (46, 14) that is locked with a padlock (the workshop padlock key from the ticket booth) and from the Stacks by the mine cart track (a low archway, 1.4 m high, that the cart passes through; the player can crouch under or ride the cart).

**Floor:** plain concrete with sawdust drifts and chalk marks. **Walls:** pegboard and shelves along three sides, painted a dull olive. **Ceiling:** exposed beams hung with tools, lamps and a long cable run, and a skylight-shaped panel with a painted blue sky (the painting is old and cracked, and the neighbor has hung a lamp behind it to fake sunlight).

**Central table:** a long, huge bench (4.0 by 1.4 by 0.9 m) with a **scale model** of a tall, multi-colored house: a base in mustard, a mint box on top, a slate roof, a windmill on the roof, and a little train circling the roof on a tiny track that actually runs (the toy train circles with a faint clicking). This is the model of the Act 3 house. Around the table, a street laid out on a larger board with the player's tiny blue house marked with a red X, and tiny figures of the neighbor and a small person. The model is the biggest clue in the game.

**Walls and pegboards:** blueprints pinned in layers (the Act 3 house), photos of a family at a birthday party, newspaper clippings with the headlines cut out, a calendar with one day circled in red, the same pencil height chart as in the kid's room, a child's drawing of a windmill.

**The fuse locker:** a steel locker (0.8 by 0.5 by 2.0 m) on the east wall with a three-digit combination dial (the code from the Carnival Hall). Inside: three **fuses** (cylindrical, glass, with copper ends, chunky, 0.3 m long) and a note: "WITHOUT POWER THE LIFT WON'T RUN."

**The blue valve wheel** hangs on a pegboard hook above the workbench, next to a handwritten label: "SPARE (BLUE)."

**Other props (about 70):** saws (rounded, decor), hammers, a bandsaw, a lathe, vices, clamps, glue pots (green glue, the same as the neighbor's traps), cans of paint, jars of screws, an easel with a half-finished painting of a house, a big book of blueprints, a typewriter, mannequin parts (arms, legs, heads), a sewing machine, a cot with a blanket and a lantern, a record player, a kettle on a camp stove, a rocking chair with a baby blanket, a half-built tiny windmill, a train set in pieces, a vending machine of nails, a stack of timber, shelves of toys in various states of repair.

**Hiding spots:** under the model table (a hanging cloth), inside the big blueprint cabinet, behind a hanging tarp.

**What makes it memorable:** the model. The player sees the next act before they get to it.

### 9.9 The Mannequin Hall

x[-20,-4] z[-14,-8], 16 by 6 m, ceiling 3.4 m. A long corridor-like gallery at the west end of the complex, reached from the Pump Cavern ring's west door at (9, -14).

**Walls:** pale cream wallpaper with small pink rosebuds, wainscot of dark wood, a picture rail with 30 empty gilded frames. **Floor:** worn red carpet runner on wood. **Ceiling:** plaster with a row of dim wall sconces. It looks like a house's upstairs hallway that has been moved underground.

**The mannequins:** thirty mannequins in two rows along the walls, each 1.0 to 1.8 m tall (adult and child sizes), in a mix of party clothes (hats, dresses, little suits), all facing inward, all with blank oval faces painted with two dots and a curve. Some are missing an arm. They do not move. One (the third on the left) is holding a **brass crank handle** (a lift crank, 0.5 m long) in its hand. When the player takes it, nothing happens, and the lights dim by 15 percent for two seconds, and a single music-box note plays.

**Other props (about 40):** a rocking chair facing the wall, a tea set on a tiny table, a rope of dried flowers, a gramophone that plays a slow waltz when the player stands near it, a stack of party hats, a velvet bench, framed wedding photos with faces rubbed out, a pram, a spinning mobile of paper birds, a candle on every windowsill-shaped alcove (there are no windows), a grandfather clock that has stopped at 4:17, an hourglass.

**Hiding spots:** behind the mannequin rows (a player standing among them is partly hidden if crouched), inside a wardrobe at the end.

**What makes it memorable:** stillness. The only moving thing is the player. The neighbor never enters this hall, and the music is the calmest in the act.

### 9.10 The Flooded Passage

x[18,40] z[-32,-24], a long, narrow, curved corridor 2.0 m wide and 3.0 m high, wandering 22 m east. Entered from the Pump Cavern's north door. Leads to the Exit Shaft's chamber.

**Floor:** a channel of murky teal water (waist-deep, 0.9 m, until the cistern is drained, then ankle-deep, 0.15 m) over a slimy brick floor. **Walls:** old wet brick with white salt streaks and green moss, arches every 2 m, iron brackets, pipes along one side. **Ceiling:** a barrel vault with dripping stalactite-like mineral drips. Lighting is sparse: a bare bulb every 6 m on a cord, mist floating above the water, and the dark glint of the surface.

**Props (about 30):** floating crates and barrels (the player can climb them as platforms when the water is high), a small wooden dinghy, a floating rubber duck, a drowned doll, a ladder to a ledge, planks across the deepest part, a rusted gate that swings, a half-sunk mannequin leg, a lantern on a hook that sways, a coil of chain, a loose grate in the wall (a vent shortcut to the Cavern's east grille).

**Hiding spots:** behind the dinghy, in the vent.

**The scare:** halfway along, a mannequin stands in the water facing away (one of the mannequins from the Hall), and a pipe bangs behind it. (Once.)

### 9.11 The Exit Shaft chamber

x[44,56] z[-32,-20], a round chamber centered at (50, -26) with radius 5, ceiling 3.4 m, and a circular shaft in the center of its floor going UP: a vertical tube of radius 3.5 and height 16 m. Entered from the Flooded Passage's east end, also from a vent from the Carnival Hall's north wall.

**The chamber:** brick walls, a concrete floor, a ring of four bulbs, a pile of timber, a pump housing, a lift cage at the shaft's base (a steel cage lift 2.4 m across, with a sliding gate, a control panel with a crank socket and a fuse slot, a brass nameplate, and a rope-and-pulley counterweight). **The shaft:** concrete rings every 2 m, with a ladder rising on the north side to a small iron hatch at the top (y = 16), crowned by a faint square of pale sky light in Act 3's dusk color leaking around the hatch.

**The lift:** needs three fuses in the panel and the crank. Once powered, it rises slowly (1.5 m per second, 11 seconds), with the neighbor hunting the player below: the lift ride is a scripted tension beat. If the player prefers, they can climb the ladder instead (16 m, 53 rungs at 0.3 m; the ladder is fully climbable but slow at 1.3 m/s, and the neighbor chases up it in the final scene, with the player pulling the hatch shut on him at the top for the cutscene).

### 9.12 The Act 2 chain

The chain (every gate is validated by the soft-lock test in section 3.3):

```
1  Landing: the door opens. Take the lantern from the rack in the gallery (the flashlight still works).
2  Gallery: the south door to the Stacks is open. The north archway to the Pump Cavern is open. The Boiler Room is open. 
3  Pump Cavern: look at the central island, see the three empty valve stems (red, yellow, blue). A note on the podium: "WHEELS ARE IN THE STORES."
4  Stacks: take the red valve wheel (bay at column 3 row 3), the ticket booth key (pocket at column 12 row 3), and the crowbar (mezzanine cage, needs the pallet stairs).
5  Carnival Hall (through the east door of the Stacks, with the crowbar prying a stuck door): ride the carousel, take the yellow valve wheel; open the ticket booth with the key, take the workshop padlock key; note the three-digit code (printed three times in the hall).
6  Workshop (the padlock key): take the blue valve wheel from the pegboard, open the fuse locker with the code, take the three fuses. Study the model and the blueprints.
7  Pump Cavern: place the three wheels on the stems (any order), pull the lever. The cistern drains in 20 seconds. The east Boiler Room door opens. The hatch in the cistern floor opens, and the Flooded Passage drains to ankle depth.
8  Mannequin Hall: take the crank from the third mannequin on the left.
9  Boiler Room: put the fuses in the fuse box (three slots). The lift lights go on.
10 Flooded Passage to the Exit Shaft chamber: put the crank in the lift, turn it.
11 The ascent: the neighbor arrives. Ride the lift or climb the ladder. At the top, push the hatch open.
12 Act 2 ends: sky, the back yard, "ACT 2 COMPLETE."
```

The validator checks that every step is possible with the tools the player has by then, and that the neighbor's blockages (locking, flooding, boarding) can never remove all routes.

### 9.13 The neighbor in Act 2

Same character, same movement, but with a **headlamp** (a bright cone of pale yellow light, 20 m range, 40 degrees wide, that sweeps as he turns his head) and a **lantern** swung from his left glove (a warm flickering spot light, 8 m range). He wears the same vest, trousers and gloves, plus a yellow rubber raincoat hung open over his shoulders and tall black rubber boots. The headlamp and lantern make him visible from far away in the dark and make his position an obvious tension source.

His behaviors in Act 2: patrols the Stacks aisles in a loop, checks the Pump Cavern ring every few minutes, sits at the Workshop table and hums (a window of safety for the player in other rooms), wades slowly through water, climbs ladders, opens mannequins' hands (no), and stands still at the Landing when the player is caught, then drags them (the camera) to the Landing for a respawn (the catch sequence is the same, the respawn point is the Landing).

He learns, too. Beyond the traps (bear traps in aisles, cameras on the gallery ceiling, locks on vents), he does these Act 2 specific things: tips over shelving units to block an aisle after the player uses it twice (a visible slow animation with a crash), switches off a bank of lights to darken a corridor (and the player's flashlight and lantern must do the work), and chains a vent grille shut.

### 9.14 Act 2 lighting and look summary

Teal fog at 8 to 60 m. Cyan tube lights, warm bulbs, red emergency pulses. Water reflecting. Steam. Dust. Dripping. Everything is damp, shiny and a little too green except the carnival, which glows with candy color against the gloom. Shadows are deep blue-green. The most saturated place is the Carnival Hall, the darkest is the Flooded Passage, the calmest is the Mannequin Hall.

---


## 10. ACT 3: THE TOWER

Act 2 ends with the player climbing out of a cellar hatch into the back yard, at dusk. The old house is gone. Where it stood there is a different house: taller, brighter, more colorful and more wrong. There is no explanation. The street looks the same. The player's blue house is across the road with its lights on. The sky is the dream sky.

The Tower is a two-story block topped by a terrace, a control box, a windmill, and a train that circles the roof. It is reached through a broken front window, and it holds a long chain of puzzles that ends at a birthday party that has been waiting for years.

### 10.0 Rules for Act 3

**Coordinates.** Act 3 uses house-local meters: **x runs east from the front-left outer corner, z runs deeper into the house (from the street toward the back), y is height above the ground floor's top.** To convert to world coordinates (the street frame from section 6): `world.x = -7 + x`, `world.z = -14 - z`, `world.y = 0.6 + y`. So the footprint is world x[-7,7] z[-25,-14]. The front faces the street (south, world +z).

```
footprint            x[0,14] z[0,11]
exterior wall        0.30 m, interior wall 0.18 m, slab 0.30 m
B1 basement          y -3.50, ceiling 3.2
F0 ground floor      y 0.00, ceiling 3.4
F1 first floor       y 3.70, ceiling 3.4
F2 box               y 7.40, ceiling 3.0, footprint x[3.5,10.5] z[3.0,8.0]
terrace deck         y 7.40 (the F1 roof), around the F2 box
R roof deck          y 10.70 (the F2 roof)
windmill hub         y 13.4
```

The ground collider opening under the house is the one from section 6.2.

**Time.** Dusk to night. The sky and lighting are described in 5.3. Every window of the house glows a different color.

**Density.** The density rules from 8.0 apply. Every room has 25 to 60 props, one hiding spot, two exits.

**The neighbor.** In Act 3 he wears the same clothes plus nothing extra, moves the same, and is a touch faster (5.8 m/s on Normal). He is sadder: his default brow is raised at the inner ends when he is idle, and he hums more slowly. In the final scene, he takes off his gloves.

**The honesty rule from the Act 3 study still holds in spirit:** every dimension that matters (the jump route, stair rises, ladder lengths, headroom) has to be valid, which the validator checks. But this is no longer a scale study. Beauty and playability come first.

### 10.1 The exterior, face by face

All colors from the palette: mustard `NH_SIDING_MAIN` on the ground floor, `NH_SIDING_MAIN_2` on the first floor, mint `NH_SIDING_ALT` on the F2 box, white trim, red shingles `NH_ROOF`, slate-blue `NH_ROOF_ALT`, a red door `NH_DOOR_FRONT`, blue shutters `NH_SHUTTERS`. Everything is a little more saturated than in Act 1 and lit from within by colored windows.

**Silhouette.** A tall, narrow block, 14 m wide and 11 m deep, two stories of mustard siding to a flat terrace roof at 7.4 m, with a mint box in the middle (7.0 by 5.0 by 3.0 m), and above it a gable roof and a windmill. Every wall leans 1.5 to 3 degrees in its own direction. The upper floor overhangs the ground floor by 0.5 m on the front and east. The silhouette against the dream sky is the thing to get right: the windmill blades turning, the weathervane rooster, the chimney's smoke.

**The plinth.** A concrete plinth 0.45 m tall runs around the base with three barred cellar vents on the east side.

#### 10.1.1 The front (z = 0, facing the street)

Ground floor, left to right across x from 0 to 14:

- x[1.6,2.5]: the **broken window** (living room), sill 0.9 m, smashed to jagged triangles, a shutter dangling at 25 degrees, a dead window box, shards on the sill and the porch. The intended way in. A stack of boxes inside, 0.35 m high (section 10.3.2).
- x[3.4,4.3]: an intact window with shutters and a window box of red flowers.
- x[6.5,7.45]: the **front door**, 0.95 by 2.6 m, red, with a half-moon window, a brass knob, a brass knocker, a mail slot, the number 910. Bolted shut from the inside. It cannot be opened in Act 3.
- x[9.6,10.5]: a window (dining room).
- x[11.6,12.5]: a window (dining room), boarded from the inside with a crooked plank.

Porch: x[4.5,9.5] (5.0 m), z from 0 to -1.6 (it sticks out toward the street), deck at y 0.0. Three steps (rise 0.18, tread 0.30). Two fat columns at x = 4.7 and 9.3. A shallow shed roof. A porch swing. The mat says GO AWAY. A potted dead fern. A faded flag. A security camera bracket in the porch roof corner (a camera appears in Act 3 from the start, pointing at the steps).

First floor front (y 3.7 to 7.1): tall windows at x = 1.5, 3.5, 9.0 and 12.0, all glowing (orange, green, pink, blue), and a **balcony** door at x = 5.75 with a small balcony 2.4 by 1.6 m with a chunky white railing, a pair of binoculars on the rail, a satellite dish.

Parapet: 0.55 m tall, 0.25 m thick, around the whole terrace edge, with a red brick coping.

#### 10.1.2 The east side (x = 14)

A locked kitchen side door (0.95 by 2.6 m) at z = 7.0 with a camera above it. A window at z = 2.0 (dining). Three cellar vents. On the first floor, three tall gallery windows at z = 1.0, 3.0 and 5.0, a birthday room window at z = 7.2, and the fire-escape door at z = 9.5. A hose reel. A gate in a tall plank fence. A fire escape (steel, with a landing at the birthday room's east door) bolted to the wall from the terrace edge down to a drop at 1.2 m above the ground: the player can jump to it from a crate stack and climb to the terrace, **bypassing** the interior as an alternative route to the roof. (It does not bypass the puzzle items the player needs, only the movement. The terrace route still requires the train and windmill steps.)

#### 10.1.3 The west side (x = 0)

A window on the ground floor at z = 4.0 (boarded from the outside with three planks), a high bathroom window. On the first floor, windows at z = 3 and z = 8. A downspout. A rolled carpet leaning on the wall. The cellar hatch is not here in Act 3; the Act 2 shaft opens in the back yard (below).

#### 10.1.4 The back (z = 11)

A mudroom door with a screen door in front of it at x = 3.0 (locked), a kitchen window at x = 11.0. On the first floor, two windows. The back of the F2 box is visible above the terrace parapet, with a mint window.

**The back yard** (z from 11 to 19, x from -3 to 17): a fenced rectangle 20 by 8 m. A shed at x = 1, z = 15. A red sedan parked with its front wheels on a crushed section of the fence at x = 9, z = 16, angled 12 degrees. A kiddie pool of scummy green water at x = 4, z = 14 (decor in Act 3). A clothesline with the vest and trousers, a barbecue, a pile of crates (the stack that reaches the fire escape), a ladder lying along the fence. **The Act 2 hatch**: a round iron hatch (1.0 m across) in the ground at x = 6, z = 15, where the player emerges, lit by a faint glow from below. The player's start position in Act 3 is on the grass beside the open hatch, facing the house.

#### 10.1.5 The roof

The terrace roof (the F1 roof deck at 7.4 m) is dark roofing felt (`#3B3B44`) with seams every 1.0 m, a parapet all around, a bucket catching water, a clothes pole, a satellite dish, a chimney (brick, 0.9 by 0.9 m, at x = 12.8, z = 9.0, rising 1.5 m above the deck), a TV antenna, and the train track loop (section 10.5).

The F2 box in the middle has a 12-degree gable roof in slate blue, a tall brick chimney, and on its ridge the **windmill** (section 10.6).

### 10.2 The overall layout

```
F0 (ground floor, y 0)
  foyer_f0        x[4.5,9.5]   z[0,3.0]       5.0 x 3.0
  living_f0       x[0,4.5]     z[0,6.5]       4.5 x 6.5    (the broken window)
  dining_f0       x[9.5,14]    z[0,5.5]       4.5 x 5.5
  hall_ground     x[4.5,7.0]   z[3.0,6.0]     2.5 x 3.0    (the cluttered hallway)
  stair_hall_f0   x[4.5,7.0]   z[6.0,11.0]    2.5 x 5.0    (the stair up)
  kitchen_f0      x[7.0,14]    z[5.5,11.0]    7.0 x 5.5
  back_hall_f0    x[2.0,4.5]   z[6.5,11.0]    2.5 x 4.5    (the sealed basement door)
  basement_landing x[0,2.0]    z[6.5,11.0]    2.0 x 4.5    (stair down to the basement)
  basement_b1     x[0,9]       z[3,11]  at y -3.5    (the cold room)

F1 (first floor, y 3.7)
  hall_f1         x[4.5,7.0]   z[0,6.2]
  stairwell_f1    x[4.5,7.0]   z[6.2,11.0]    (stair opening x[5.9,7.0] z[6.2,10.9])
  bedroom_a       x[0,4.5]     z[0,4.0]
  study_f1        x[0,4.5]     z[4.0,6.2]
  bath_f1         x[0,4.5]     z[6.2,11.0]
  gallery_f1      x[7.0,14]    z[0,6.0]       (the gated section, with the ladder)
  birthday_room   x[7.0,14]    z[6.0,11.0]

F2 box (y 7.4)
  ladder_room_f2  x[3.5,10.5]  z[3.0,5.5]
  control_room_f2 x[3.5,10.5]  z[5.5,8.0]
```

The stair, doors and openings are given room by room below.

### 10.3 Ground floor (F0)

Floors are wide wood (`FLOOR_WOOD`) unless noted. Ceilings 3.4 m.

#### 10.3.1 foyer_f0

x[4.5,9.5] z[0,3.0]. Walls: green stripes (`WALLPAPER_GREEN`) above a wainscot (`WAINSCOT`, 1.0 m), picture rail, crown moulding. Floor with a red runner (`CARPET_RED`, 1.1 m wide) from the front door to the hall door. Doors: front door (z = 0, x = 7.0, bolted), west door to the living room (x = 4.5, z = 1.0 to 1.95), east door to the dining room (x = 9.5, z = 1.0 to 1.95), north door to the cluttered hall (z = 3.0, x = 5.2 to 6.15).

Props (about 30): a 1.9 m coat stand with a brown jacket and a hat, tilted 5 degrees; a console table (1.1 by 0.4 by 0.8 m) with a bowl of decoy keys that jingle; a framed picture 0.5 by 0.4 m; a cardboard moving box taped shut by the door; a pair of boots; an umbrella stand; a coat rack of hooks; a mirror with a cracked corner; a floor mat; a wall telephone; a wall calendar; a pendant lamp with a flickering bulb; a pile of unopened letters under the mail slot; a vase of dead flowers.

Lighting: a single dim bulb, a bright bar of dusk light under the front door.

#### 10.3.2 living_f0

x[0,4.5] z[0,6.5]. The **entry room**. Walls: blue diamond wallpaper (`WALLPAPER_BLUE`), one corner peeling, white wainscot. Floor: light wood, a round rug.

The broken window is on the south wall at x[1.6,2.5]. A second window on the west wall at z = 3.0 is boarded from outside, letting bars of light in. Doors: east door to the foyer (x = 4.5, z = 1.0 to 1.95), north door to the back hall (z = 6.5, x = 3.2 to 4.15).

Props (about 48): an orange sofa (`RETRO_ORANGE`, 2.0 by 0.9 by 0.85 m) against the west wall; a green armchair (`SOFA_GREEN`) angled toward the window; a coffee table with an overturned mug and a newspaper; a boxy television showing static; a tall bookcase (1.0 by 0.3 by 2.3 m) leaning 4 degrees with 25 physics books spilled in front; a fireplace on the north wall with a toy train and a snow globe on the mantel; a floor lamp; a sideboard; four cardboard boxes stacked by the broken window so the top box is at 0.35 m (the step to the sill, intended entry); a houseplant; a record player; framed pictures; a bust in a hat; glass shards under the window (14 decals, 6 physics).

Hiding spots: behind the sofa, the corner cabinet.

#### 10.3.3 dining_f0

x[9.5,14] z[0,5.5]. Yellow pinstripe walls, wainscot. A long table (2.2 by 1.0 by 0.78 m) set for three, six chairs, a china cabinet (1.2 by 0.45 by 1.9 m), a sideboard, a chandelier at 2.3 m tilted by a snapped chain, a tall clock, plate rail decor. Windows on the south and east walls. A double swing door (1.4 m wide) in the north wall at z = 5.5 to the kitchen. A security camera in the north-east ceiling corner. Props (about 44): cartoon roast chicken, peas, jello that wobbles, plates, glasses, napkins, candlesticks, vases, a bell, a hutch. Hiding spots: under the tablecloth, in the cabinet.

#### 10.3.4 hall_ground (the cluttered hallway)

x[4.5,7.0] z[3.0,6.0]. 2.5 by 3.0 m, with 36 clutter props (all physics, seeded): three cardboard boxes against the east wall, a rolled carpet leaning on the west wall, a bicycle frame with no wheels, a wooden crate, a bucket, newspapers, picture frames face to the wall, a folded stepladder (1.2 m), a pile of coats. Walls: pink polka dots. Floor: dark wood. A closet door in the east wall at z = 4.0 to 4.95 (an electrical closet with a laser tripwire across it at 0.3 m). The only way through is to weave and crouch. Light: one bulb at the north end. Hiding spot: the closet (past the laser).

#### 10.3.5 stair_hall_f0

x[4.5,7.0] z[6.0,11.0]. A straight flight on the east side (x[5.9,7.0], 1.1 m wide), rising toward the front (toward the street) from the back of the room: bottom step at z = 10.9, top at z = 6.22, 19 risers (true riser 0.195 m), 18 treads of 0.26 m, 4.68 m run. Headroom at least 2.2 m. The F1 slab opening above is x[5.9,7.0] z[6.2,10.9]. Handrail on the open west side at 0.9 m with balusters every 0.12 m, a twisting newel post at the bottom. The underside of the flight is closed in with panels and holds a small cupboard (a hiding spot). The east wall of the room (x = 7.0) is solid.

West of the flight, x[4.5,5.8], a 1.3 m floor strip (the way to the back hall door) with an umbrella stand and a side table with a lamp.

#### 10.3.5b The doors of the center column

Doors: hall_ground north to stair_hall (an open arch 2.0 m wide at z = 6.0), and the stair_hall west door to the back hall (x = 4.5, z = 8.0 to 8.95), which opens onto the west floor strip. The kitchen is reached from the dining room and the side door, not from the stair hall.

#### 10.3.6 kitchen_f0

x[7.0,14] z[5.5,11.0]. 7.0 by 5.5 m. Black and cream checkerboard floor, mint half-height tile with green flowers above. A bulged mint fridge (door ajar with a faint light), a stove with a whistling kettle, a sink, wood cabinets wider at the top, an island (1.6 by 0.8 by 0.9 m), four stools, a pantry (enterable), a cork board with a drawing of the player's house, a calendar, a toaster that pings. A wide window at x = 11 on the back wall, the locked side door on the east wall (z = 7.0) with a camera above it. Props (about 52). Hiding spots: the pantry, behind the island.

Story item: the **crowbar** is wedged behind the stove (x about 12.5, z = 10.7), visible as a red end sticking out, pulled free by interacting.

#### 10.3.7 back_hall_f0

x[2.0,4.5] z[6.5,11.0]. 2.5 by 4.5 m. Grey-green painted walls, concrete tile floor with a drain. Doors: east to the stair hall (z 8.0 to 8.95), north-south to the living room (z = 6.5, x 3.2 to 4.15), and the **sealed basement door** on the west wall at x = 2.0, z 8.5 to 9.45.

The sealed door: a heavy steel door (0.95 by 2.6 m), dark green, flush in a steel frame, a keycard panel on the north jamb at 1.25 m (0.12 by 0.18 m with a red LED that turns green). Three horizontal boards (140 by 38 mm) at heights 0.55, 1.30, 2.05, each held by two bolts (head 24 mm, washer 40 mm) into the frame (six bolts), 1.15 m long. The crowbar removes each bolt (hold 1.5 seconds each, a clank, the bolt dropping as a prop). A camera over the door covers the bolts. Props (about 30): a bench, a coat rack, a washer and dryer, a mop bucket, shelves of paint, a stack of tires, a fire extinguisher.

#### 10.3.8 basement_landing_f0 and the basement

basement_landing_f0 x[0,2.0] z[6.5,11.0], 2.0 by 4.5 m: a plain concrete landing with a bare bulb and the top of the basement stair, descending toward positive z. 18 risers of 0.194 m, 17 treads of 0.26 m, 4.42 m run. A thin line of cold blue light comes up from the bottom.

basement_b1 x[0,9] z[3,11] at y -3.5, ceiling 3.2 m. A cold, clean, lit room, much smaller and tidier than Act 2: pale tile floor, white-green walls, a row of three tube lights, a steel fridge (the cake is inside, a pink and white cake on a plate with an unlit candle, 0.25 m across, 0.15 m tall), a steel table, a shelf of party supplies (plates, hats, streamers), a child's height chart, a teddy bear on a chair, and the fifth mannequin standing against the east wall wearing a party hat. A door at the far end that leads nowhere (opens on a brick wall). The basement is quiet and sad, not scary.

---


### 10.4 First floor (F1)

F1 floor top y 3.70. Ceiling 3.4 m. The floors lean a visible half degree in a couple of rooms. Stay within walkable tilt (under 3 degrees on any surface the player stands on, with no sliding while standing still).

#### 10.4.1 hall_f1

x[4.5,7.0] z[0,6.2]. 2.5 by 6.2 m. The top of the stair arrives at its back end (z about 6.2) on the east edge, so the player steps out of the stairwell and walks toward the front. Pink polka-dot wallpaper, a green runner (`CARPET_GREEN`, 0.9 m wide). The floor falls 0.06 m toward the front.

Doors: west to bedroom_a (x = 4.5, z 1.0 to 1.95); west to the study (x = 4.5, z 4.4 to 5.35); east to the gated gallery through the **Dutch gate** (x = 7.0, z 1.5 to 3.5). The bath is reached through the study (10.4.4). No window. A wall sconce and one ceiling bulb. A security camera above the gate on the hall side, pointing at the gate. A **laser grid** across the hall at z = 5.0, three beams at heights 0.2, 0.6 and 1.0 m, emitting a thin red hum that rises near the player; tripping it fires an alarm.

Props (about 34): a runner, framed cartoon landscapes (crooked), a side table with a vase, a coat rack, a barometer, a small bookcase, a radiator, a fire extinguisher, plants, slippers, a floor mirror, a stopped clock (4:17), and the **gate route furniture** described next.

#### 10.4.2 The gated section: the gate, the rail, the lamp

All heights measured from the F1 floor (y 3.7). Build these exactly, because the validator runs the jump math.

- **The gate:** a Dutch-style gate in the wall at x = 7.0 between hall_f1 and gallery_f1: opening 2.0 m wide (z 1.5 to 3.5), 2.6 m tall. The lower 1.6 m is closed with steel pickets (4 cm rails, 10 cm spacing). The upper 1.0 m is open. A latch on the gallery side can be lifted by anyone standing inside, so the gate can be opened for good from within; from the hall side it is out of reach.
- **The rail:** a broad capped half-wall, 2.0 m long, 0.55 m high, 0.5 m wide on top (the player can stand on it), against the east wall of the hall at x[6.5,7.0] z[3.6,5.6]. Textured like a banister, a thick wooden cap, a painted panel below.
- **The lamp:** a heavy floor lamp anchored to the floor (it cannot be moved) at x[6.0,6.5] z[2.4,2.9], with a stout stem, a broad flat shade cap 0.52 m across at 1.20 m height, strong enough to stand on. It glows warm.

The hops: floor to rail top (rise 0.55 m), rail to lamp (rise 0.65 m, a gap of about 0.75 m), lamp over the gate (the gate top is at 1.6 m, so the player must clear 1.7 m, a rise of 0.5 m from the lamp top). With a player jump of 4.0 m/s and gravity 9.81, the jump rise is 0.82 m, and the validator confirms each hop has at least 5 cm of slack and none exceeds 40 cm. If the player falls off the lamp, the lamp does not move. Standing on the rail is visible to the ceiling camera, so the route has a stealth cost.

#### 10.4.3 bedroom_a

x[0,4.5] z[0,4.0]. 4.5 by 4.0 m. Blue diamond wallpaper, a green carpet with a dark border. A big bed (2.0 by 1.6 by 0.55 m) with a patchwork quilt and a scalloped headboard, a nightstand with an alarm clock (a lure) and a lamp, a dresser with a mirror, a wardrobe (hideable), a telescope on a tripod at the window, a chair with a spare sweater vest, a bookcase, a hat stand, a rug, slippers. A window on the west wall boarded from outside, thin bars of light. Windows on the south wall at x = 1.5 and 3.5. Props (about 46).

#### 10.4.4 bath_f1

x[0,4.5] z[6.2,11.0]. 4.5 by 4.8 m, yellow tile floor and walls, a clawfoot tub, a toilet, a sink, a medicine cabinet, a leaking pipe that drips audibly. Its only door is in its south wall at z = 6.2, x 1.0 to 1.95, into the study (a running joke: you walk through the study to wash). A small window on the west wall. Props (about 28). Hiding spot: the hamper.

#### 10.4.5 stairwell_f1

x[4.5,7.0] z[6.2,11.0]. The stair opening at x[5.9,7.0] z[6.2,10.9] with an open balustrade (0.9 m, balusters every 0.12 m) on its west edge at x = 5.85. West of the opening a 1.3 m floor strip (x[4.5,5.8]) with a tall plant. The east wall (x = 7.0) and the west wall are solid here. The F0 stair rises beneath the opening.

#### 10.4.6 study_f1

x[0,4.5] z[4.0,6.2]. 4.5 by 2.2 m. Door to the hall at x = 4.5, z 4.4 to 5.35, and a door in its north wall to the bathroom (z = 6.2, x 1.0 to 1.95). A desk (1.4 by 0.7 by 0.75 m) with a typewriter and a lamp, a pinned map of the street (no readable text), a filing cabinet, binders, a small monitor with a red LED showing static (the camera feeds). A window on the west wall, intact, daylight (dusk) angled across the desk. Props (about 36): a globe, a swivel chair, a cork board, a coat, a rolled map, stacks of paper. **Mannequin #4** stands in the closet in the back-west corner (a 1.2 by 0.8 m closet at x[0,1.2] z[5.4,6.2]), wrapped in a clear plastic bag, with a party hat. Hiding spot: the closet.

#### 10.4.7 gallery_f1 (the gated section)

x[7.0,14] z[0,6.0]. 7.0 by 6.0 m, a long bright room. Three tall windows on the east wall (each 0.9 by 1.5 m, sill 0.9) and two on the front wall, all intact, glowing with dusk light. Floor: wood with a long rug. Walls: pale cream with a tall painted wainscot. Contents: a long table with a sheet over it, a sofa under a window, shelves of old toys, a rocking horse, dust sheets over furniture, and in the south-east corner three covered mannequin-shaped shapes under sheets, of which one is **Mannequin #1** (adult, 1.75 m, party hat under its sheet).

The **ladder**: a free-standing steel ladder on a frame 0.9 by 0.9 m at x[8.0,8.8] z[4.6,5.4], rising from the floor to a ceiling hatch directly under the F2 box floor. Rung spacing 0.28 m, rails 0.45 m apart, rung diameter 0.025 m, 13 rungs over 3.7 m (true spacing 0.285 m). A guard rail around the hatch at the top. The player climbs at 1.4 m/s.

#### 10.4.8 birthday_room

x[7.0,14] z[6.0,11.0]. 7.0 by 5.0 m. Reached through a door in the gallery's back wall (z = 6.0, x 11.0 to 11.95), and from the outside by a door in the east wall (x = 14, z 9.0 to 9.95) onto a small iron fire-escape landing (1.0 by 1.5 m) that joins the fire escape ladder down the east side. The brightest room in the game. Walls: cream with a ring of colorful painted balloons at head height. Ceiling: streamers in red (`RED_TOY`), yellow (`YELLOW_TOY`) and blue (`BLUE_TOY`) in loops, strings of warm bulbs, and a disco ball (unlit until the puzzle completes).

A **party table** (3.0 by 1.0 by 0.78 m) with a paper tablecloth, plates, paper hats, party horns, and in the middle a cake plate with nothing on it. Around it a ring of six small chairs (0.30 by 0.30 by 0.55 m), five empty and one tipped over. A faded banner of fat canvas letters that say nothing legible. Balloons (instanced spheres, 0.25 m, bobbing at the ceiling, 30 of them). Along the east wall, **five round floor pads** (0.6 m across, in a warm wood tone) in a line spaced 1.2 m, where the mannequins stand. A pile of presents (six wrapped boxes in bright paper with ribbons). A music box on a side table. A rocking chair. A grandfather clock stopped at 4:17. A gramophone. A high chair.

Lighting: warm string lights, a dim chandelier, a little low light from the window. Sound: a music box tune plays slowly while the room is empty and speeds up with each mannequin placed.

### 10.5 The control box (F2), the terrace, and the train

#### 10.5.1 ladder_room_f2

x[3.5,10.5] z[3.0,5.5], 7.0 by 2.5 m, ceiling 3.0 m. A bare utility room in mint paint with a concrete floor, a bulb on a cord, a guard rail around the hatch (x[8.0,8.8] z[4.6,5.4]), a stack of boxes, a work lamp, a tool rack. The train track crosses the room east to west as an indoor segment: it enters through a hole in the west wall at x = 3.5, z[3.8,5.0] (1.2 m wide, 1.0 m tall, sill 0.30), crosses at z = 4.2, and exits through the matching hole in the east wall at x = 10.5. A second hole in the partition wall at z = 5.5, x[5.0,6.2] (1.2 m wide, 1.0 m tall, sill 0.30 m) leads into the control room: the player crawls through. A camera in the north-west corner.

#### 10.5.2 control_room_f2

x[3.5,10.5] z[5.5,8.0], 7.0 by 2.5 m, ceiling 3.0 m. The machinery room. Pale mint walls, steel grating floor patches over a concrete floor, a long console along the north wall (z = 8.0) with a row of switches and dials, a cracked window (0.9 by 1.5 m) on the north wall looking out over the back terrace, a desk with a drawer holding the **keycard** (a teal card with a white stripe and a red LED glyph), a calendar, a kettle, a rolled blanket, a cot. The two controls: a big red **button** on a post (1.0 m tall) at x = 6.0, z = 7.4, and a **lever** in a slot box (0.3 by 0.3 by 0.9 m) at x = 8.5, z = 7.4, which pulls through 60 degrees. A fault light above the lever blinks until the sequence is right (button first, then lever). A wrong order resets with a buzz. A door in the north wall at x[6.5,7.45] leads out to the back terrace. A camera in the north-east ceiling corner.

#### 10.5.3 The terrace

The F1 roof deck at y 7.4, around the F2 box. Strips: front z[0,3.0], back z[8.0,11.0], west x[0,3.5], east x[10.5,14]. The parapet is 0.55 m tall, 0.25 m thick, brick-coped. The deck is dark felt with seams. Props: a bucket, a pole of drying clothes, a rain barrel, a stack of terracotta pots, a lawn chair, a TV antenna, a coiled hose, the chimney (0.9 by 0.9 m at x = 12.8, z = 9.0, 1.5 m high), a skylight (opaque), and four exterior cameras at the parapet corners (90 degree sweeps).

**The F2 box exterior ladder:** a steel ladder with a safety cage on the east wall of the box at x = 10.55, z[5.0,5.8], rising 3.0 m from the terrace to the box roof deck, landing on a flat 1.0 m perch at the eave.

#### 10.5.4 The train loop

A closed Catmull-Rom spline, 0.05 m above the deck, with control points (house-local x, y, z):

```
P0  ( 1.5, 7.45,  1.5)   front-left corner
P1  ( 7.0, 7.45,  1.5)   front center (the station)
P2  (12.5, 7.45,  1.5)   front-right corner
P3  (12.5, 7.45,  5.5)   east center
P4  (12.5, 7.45,  9.5)   back-right corner
P5  ( 7.0, 7.45,  9.5)   back center
P6  ( 1.5, 7.45,  9.5)   back-left corner
P7  ( 1.5, 7.45,  5.5)   west center
```

The chord through the box: from P7, the track leaves the ring at (1.5, 7.45, 4.2), runs east to the west hole (3.5, 7.70, 4.2), crosses the ladder room, exits the east hole (10.5, 7.70, 4.2), and rejoins at the east side of the ring at (12.5, 7.45, 4.2). The minimum turn radius is 1.2 m. The closed loop is 38 m for the ring plus the 11 m chord.

The rails: two thin strips, gauge 0.45 m, with sleepers every 0.30 m (instanced). The **train**: an engine 0.9 m long, 0.5 m wide, 0.6 m tall, red body (`RED_TOY`) with a yellow chimney and a yellow stripe, and two carriages 0.9 m long each (blue `BLUE_TOY` and yellow `YELLOW_TOY`), with 0.1 m gaps. Speed 1.0 m/s. It chuffs with little white steam puffs. After the button and lever, it runs three laps and stops at the station (P1). **Mannequin #2** rides in the last carriage, strapped in with a seat belt and a party hat. The player can stand on a carriage roof (the player is carried by the platform) and ride.

### 10.6 The windmill

On the F2 box roof deck (y 10.7) at (7.0, 5.5). A tapered octagonal tower, 3.0 m tall, 1.2 m across at the base and 0.8 m at the top, painted cream with a mint band. A fixed ladder on its east face with 11 rungs (true spacing 0.273 m). Four blades, each 1.8 m long and 0.35 m wide with 8 degrees of twist, in mustard and white, on a hub 0.30 m across, turning at 0.3 revolutions per second, slowing to 0.1 when the player is on the ladder. The hub carries a glowing yellow lamp. **Mannequin #3** hangs from the hub 0.2 m below its center, reachable from a small platform (0.8 m wide) at the top of the tower. The roof of the box is a 12-degree gable in slate blue, with a 1.0 m flat perch at the eave by the ladder.

From the windmill, the whole street is visible: the player's blue house, the lamps, the long road, the dream sky.

### 10.7 Security layout

All positions are house-local. Cameras are boxy grey bodies (0.2 by 0.1 by 0.1 m) on an arm bracket, with a red LED and a translucent red cone showing the field of view (70 degrees, range 10 m, sweeping 90 degrees over 8 seconds). Lasers are thin emissive red beams that shimmer and hum.

```
porch roof corner           camera pointing at the steps
dining_f0 NE ceiling        camera over the kitchen door
hall_ground closet          laser across the closet at 0.3 m
kitchen east door           camera
back_hall basement door     camera over the bolts (3 second blind window on the left)
hall_f1 above the gate      camera
hall_f1 z = 5.0             laser grid, three beams at 0.2, 0.6, 1.0 m
gallery_f1                  two ceiling cameras with a 1.5 m blind strip along the south wall
ladder_room_f2 NW corner    camera
control_room_f2 NE corner   camera
terrace corners (4)         exterior cameras, 90 degree sweeps
```

A camera that sees the player beeps for 2 seconds and then fires an alarm event with the player's position and a loudness of 90 (0 to 100). A laser trip fires the same with loudness 100. Cameras can be disabled by hitting their red power box (on the wall nearby) with a thrown object.

### 10.8 The Act 3 chain

```
1  Start in the back yard at the open hatch. Walk around the house, past the car, the pool, the clothesline, to the front.
2  Enter through the broken window (box step) in the living room.
3  Kitchen: take the crowbar from behind the stove. (The dining room and kitchen are reachable from the foyer.)
4  Back hall: pry the six bolts off the basement door (crowbar). Do not open it yet: it needs a keycard.
5  Main stair to F1. Gate route: rail, lamp, over the gate into the gallery, then lift the latch from the inside so the gate stays open. Take Mannequin #1 (under the sheet, carry it, slows the player).
6  Ladder to the F2 box. Crawl through the hole to the control room. Take the keycard from the desk. Press the button, then pull the lever: the train starts.
7  Terrace: stop the train at the station (or ride it) and take Mannequin #2 from the last carriage.
8  Windmill: climb the box ladder and the tower, take Mannequin #3.
9  Study (F1): take Mannequin #4 from the closet.
10 Back hall: use the keycard on the basement panel. The door opens. Stair down. Take Mannequin #5 and the cake from the fridge.
11 Birthday room: stand the five mannequins on the five pads, place the cake on the table.
12 The finale.
```

Mannequins are carried two-handed (60 percent speed, no sprint, no throwing, no ladders). From the F2 box, a mannequin can be dropped down the ladder hatch: it lands on the gallery floor with a loud clatter and no damage. The birthday room is reached from the gallery through its back door. The neighbor patrols throughout and learns as in Act 1. The brain never boards or locks the last two routes the player has not used, and never places traps on the gate route, the ladder or the stairs.

### 10.9 The finale

When the fifth mannequin stands on the last pad and the cake is placed on the table: all lights flicker, the disco ball lights up and throws colored spots across the walls, the music box plays "Happy Birthday" in a slow minor key, and the balloons drift down. The mannequins' blank faces do not change.

The neighbor enters at the door. He does not chase. He stops, his shoulders drop, his brows tilt at the inner ends, and his eyes glisten (a bright specular highlight). He walks slowly to the head of the table, pulls out the high-backed chair, and sits. He pulls off his black rubber gloves one at a time, finger by finger, and sets them on the table (the first time his hands are bare: soft, pale, with a thin wedding band). He lights the candle on the cake with a match. He hums. A child's laughter, very faint, comes from somewhere.

He blows out the candle. The lights go out. The room fills with the pale pink light of dawn through the window. Cut to the street at sunrise: the long shadows, the mailboxes, the blue house, the tall house with every window dark, the windmill still. The sky is a clear cornflower and peach, the same as Act 1's opening. A card: "THE END." Then credits, and stats (catches, time, routes discovered, traps triggered, secrets found). Keep it quiet. Let it land.

The player may skip the finale by pressing Esc and holding for 2 seconds.

### 10.10 Act 3 lighting summary

Dusk at the start, with a low orange band near the horizon fading into the dream sky. By the time the player is inside it is night. Inside, warm lamp light, colored string lights, and the cool blue of moonlight in the windows. The terrace is lit by moon, the windmill lamp, and the train's headlamp (a warm yellow cone). The birthday room is warm gold and pink and the brightest in the game. The basement is cool and clean.

---


## 11. THINGS THAT SPAN ALL THREE ACTS

### 11.1 Mr. Grimsby: what he looks like (do not change him, only keep him consistent)

He is the same character in every act. The model already exists in `src/actors/Neighbor.js`. This is what the player must see, so check every act against it.

**Silhouette.** A large, egg-shaped head, wider at the cheeks and jaw than at the crown, set on a thick short neck and sloped shoulders. A pear-shaped body: a narrow chest, a wide round belly, wide hips. Long arms that hang low, ending in big black rubber gloves that reach nearly to the elbow, so the forearms look heavy and dark. Short sturdy legs ending in big round shoes. A slight forward stoop. He stands 2.05 m tall, so he is always taller than anything the player can reach.

**Face.** Large round slightly bulging eyes with white, a big green iris and a small black pupil, heavy upper lids that sit at 20 percent closed (tired and suspicious), dark bags under them. Thick dark eyebrows that slant down toward a big, round, ruddy, shiny nose. A wide, thick, curled, waxed mustache sweeping out past the sides of the face and curling up at the tips, which bounces when he moves. A mostly hidden mouth that opens wide under the mustache when he shouts. Flushed cheeks, big pink ears, short dark chestnut hair swept back with one unruly curl at the crown that bobs.

**Clothes.** A mustard-yellow dress shirt with the sleeves rolled to just under the elbow. A navy and light-blue argyle sweater vest with a V-neck, ribbed bands at the neck, armholes and hem, cream cross-lines, stretched tight over the belly. Brown plaid high-waisted trousers with a dark belt and a brass buckle, slightly short, showing a sliver of dark sock. Long black rubber gardening gloves, glossy. A chunky gold watch over the left glove. Round dark brown shoes.

**Per-act additions.** Act 2: a yellow rubber raincoat hung open over his shoulders, tall black boots, a headlamp (a bright pale cone, 20 m) and a swung lantern (warm flicker, 8 m). Act 3: no additions, a touch sadder (inner brow ends lifted when idle), and in the finale he takes the gloves off.

**Motion.** A heavy waddling walk with the hips swaying and the arms swinging low, a hunched suspicious walk when he is alert, a ridiculous lunging run with arms pumping and fingers splayed, the torso pitched forward, the face fixed on the player, the mustache flapping, the belly bouncing. His eyes track the player whenever the player is in view, before his head turns. He freezes mid-step when he hears a noise. He checks wardrobes, beds, curtains and cabinets with a short, readable reach, peer and exhale.

### 11.2 The player's view

First-person camera at 1.6 m, 85 degree field of view. Two chunky cartoon hands, rounded, peach, slightly oversized, with blue sleeve cuffs, at the bottom of the screen. The held item is in the right hand. The hands reach out when interacting, pull back when charging a throw, snap forward on release, and bob when sprinting.

HUD, all in the chunky rounded style already built: a small center dot that becomes a hand icon over something usable, with a one-line label below it that names what will happen or what is missing ("Needs a crowbar"); four inventory slots at the bottom center, the selected one larger with a yellow border; a keyring in the top left showing key icons with unique shapes (circle, triangle, square, star, heart, diamond, hexagon) as well as colors; an objective line at the top center that fades in and out; a stamina bar that appears only when not full; a small eye icon at the top that opens as the detection meter fills and turns red at full. No minimap, no neighbor marker (an optional footstep-direction indicator on Easy only).

### 11.3 Title, menus, transitions

The title screen shows the slow golden-hour drift past the neighbor's house with the NOSY NEIGHBOR logo (the "O" in NOSY is an eye that follows the cursor), and buttons Play, Continue, Act Select (once an act is finished), Options, Credits. Menus are chunky cut-out rounded rectangles with a thick border and a drop shadow, slightly rotated, that wobble on hover.

Act transitions are 4-second cards on a painted background (Act 1: the sunny street; Act 2: a cellar door in blue-green light; Act 3: the dream sky with the moon), with the act name in the fat logo letters, a short subtitle ("The House," "The Underneath," "The Tower"), and a small loading bar that fills while the next act builds. The card ends when the act is ready, never earlier. A skip button appears after 2 seconds if the act is ready.

### 11.4 Respawn and the catch

The catch sequence is the same in every act: time slows to 30 percent over 0.15 seconds, the camera is wrenched to face him, his face lunges to fill the screen (eyes wide, pupils pinpoint, brows down, mouth open, gloved hands splayed from below the frame), a stinger plays, hard cut to black with a ringing tone, then a fade in at the respawn point with a gasp.

Respawn points: Act 1 beside the bed in the player's house. Act 2 at the Landing, beside the chair and bear. Act 3 beside the bed in the player's house again. Items already collected stay collected. Doors the player opened stay open (he may close some). Broken windows stay broken until he boards them. Anything the player was carrying drops where they were caught, except mannequins, which return to their last safe spot.

A setting reduces the catch to a fade (no lunge, gentler sound).

### 11.5 Saving

Autosave on every key pickup, tool pickup, act change and after each puzzle step, and when the tab is hidden or the page is about to close, in `localStorage` inside try/catch. The save holds the act, the route step, the inventory, the neighbor brain counters, the catch count and playtime, the settings and the random code (so a reload does not change it). If storage is unavailable the game still plays. A Reset button and a `?reset=1` flag clear everything. A finished act adds itself to Act Select.

### 11.6 Difficulty

Easy, Normal, Hard. They scale his run speed (5.0, 5.6, 6.0 m/s; Act 3 adds 0.2), his sight range, the detection meter fill rate, his hearing threshold, and the learning thresholds. On Hard he throws glue jars during chases. Never make him omniscient, and never let a difficulty setting remove a validated route.

### 11.7 Mobile

The touch layer already exists (floating joystick, drag to look, a thumb arc of buttons, left-handed mode, button size, haptics, gyro option, rotate overlay, safe-area insets, quality governor, 30 fps cap). Keep it, and make sure every new act and every new interaction works with it: hold-to-interact actions (prying, unscrewing, turning valves, cranking) use the held Use button and the progress ring, the lift crank uses a hold, the carousel jump uses the Jump button, ladders use the joystick forward and back. Test all three acts under mobile emulation.

### 11.8 Sound and music, one line per area

Acts keep their procedural audio. Act 1 sneak music is a playful off-key music box with plucked bass at 90 BPM. Act 2 swaps to a low pad, dripping and pipe knocks, a heartbeat low drone near the neighbor, and a faint calliope from the carnival hall. Act 3 swaps to a slower minor-key music box with a soft string pad, adding a distant windmill creak, train chuff, wind, and the finale's slow "Happy Birthday". The chase theme (160 BPM, staccato strings, kick, "dun-dun" motif) stays the same everywhere. Footsteps change by surface (wood, tile, concrete, grating, water, grass, felt).

---

## 12. TESTS AND ACCEPTANCE

Nothing ships until every line here is true and you have shown me the evidence.

### 12.1 The commands

```
npm run validate        the map validators from 3.3, a readable report, exits non-zero on any failure
npm test                Vitest: unit tests, validators, route simulations, property tests
npm run mapshots        Playwright screenshots of every pose in every act, plus the baseline comparison
npm run playthrough     scripted headless runs of Act 1, Act 2 and Act 3 from the title to the ending
npm run soak            ten minutes of random inputs in each act, no errors, no stuck states
npm run perf            draw calls, triangles, bodies, frame time per zone and per act, on Medium and Low
npm run mobile          iPhone, Pixel and iPad emulation: layout, controls, no scroll, no overflow
npm run build           production build, size report, and the budget check
```

All of them run in CI (a GitHub Actions workflow) on every push to `v2`. A red CI blocks deployment.

### 12.2 The checks

1. **No console errors or warnings** that I would not choose to keep, in all three acts, on desktop and mobile emulation. (The deprecation warning about WASM initialization parameters should be fixed by passing a single object.)
2. **The validators pass** (section 3.3), with zero errors on every map.
3. **The full story is completable** in each act by the scripted playthrough, including the alternate routes in Act 1 (window, side door, back door, tree, ladder, porch roof, yellow key), the gate route in Act 3, and the lift and the ladder in Act 2.
4. **No soft-locks**: after any combination of neighbor adaptations, each act is still completable. The test forces the maximum adaptations and replays.
5. **No fall-through or stuck**: the soak test runs for 10 minutes per act with random inputs and mid-game catches, and records zero out-of-world events and zero stuck events (the rescue logic may fire in the soak test, but each firing is logged and must be explained or fixed).
6. **Density**: every room meets 25 to 60 props (counted by the builder), with a report listing each room and its count. Rooms under 25 fail.
7. **Surface variety**: every wall, floor and ceiling has at least three of the details in 5.5. A report lists each surface and its detail layers.
8. **Performance** meets the budgets in 3.6 on Medium and Low, for every zone, measured with the F3 panel in a headless browser (software rendering is slow, so check draw calls and triangles exactly and use a real-GPU estimate for frame time, flagged as an estimate).
9. **Load**: the title screen appears in under 8 seconds on broadband, Act 2 and Act 3 build behind transition cards without a frozen frame longer than 150 ms, and the page never goes blank.
10. **Visual review**: I get to look at the screenshot set. For each room, at least four views, and each view looks like the description in this document. Anything that does not is fixed or explained.
11. **Mobile**: all controls work in all acts in emulation, no layout overflow or scroll, no controls under safe areas.
12. **Desktop controls** unchanged: keyboard, mouse, gamepad.
13. **Bug log** (`BUGS.md`) complete: every bug found, fixed or explained, with a guarding test.
14. **Deployed** to the new Railway project (section 13), auto-deploying from `v2`, with the live URL working, `/healthz` returning 200, and the old project untouched.

### 12.3 The report I want at the end of each milestone

Four short parts: what you built, the numbers (tests passed and failed, draw calls, triangles, frame time, room counts), anything you could not verify, and the three biggest risks left. No marketing language. If a test fails, show the output.

---

## 13. DEPLOYMENT: A NEW RAILWAY PROJECT

The old Railway project named `nosy-neighbor` deploys from the old game branch and serves the first version at `nosy-neighbor-production.up.railway.app`. Do not change it, stop it, delete it, redeploy it, or edit its variables. Leave it exactly as it is.

You will create a new, separate Railway project for V2. Use the Railway tools (the Railway MCP server) when they are available, and the Railway CLI if not.

1. **Create a project** named `nosy-neighbor-v2` in my workspace (`elliotread250-source's Projects`).
2. **Create one service** in it, named `nosy-neighbor-v2`, connected to the GitHub repo `elliotread250-source/nosy-neighbor`, branch `v2`, with auto-deploy on push enabled. If the connect step needs a repository link I have to approve, ask me once and tell me exactly what to click.
3. **Build and start.** The repo already has a Dockerfile and `railway.json` (health check `/healthz`, start command `node server.js`). Keep them. Make sure the build installs dependencies, runs `npm run build`, and serves `dist/` with the correct content types (`application/wasm` for the physics file), brotli or gzip, long cache headers for hashed assets, and a single-page fallback to `index.html`. The server listens on the port Railway gives it.
4. **Domain.** Generate a public domain for the service and tell me the URL.
5. **Confirm the deploy is live.** Read the build logs and the deploy logs. The service must show a successful deployment from the latest `v2` commit. Request `/` and `/healthz`, and confirm the response codes. If you cannot reach the domain from your network (the proxy may block it), say so plainly and verify through Railway's own tools (deployment status, deploy logs, HTTP logs) and give me the URL to check.
6. **Check that pushes trigger deploys.** On the old project, pushes did not always trigger builds, and I had to reconnect the branch to kick one. On the new project, make a harmless commit to `v2` after the first deploy, and confirm that a new deployment starts by itself within two minutes. If it does not, find out why (the GitHub app permissions, the connected branch, the watch paths), fix it with the tools you have, or tell me exactly what to change in the Railway dashboard.
7. **Environment.** No secrets are needed. Do not add any. Set `NODE_ENV=production` if it is not already set.
8. **Do not add the new project to anything else** (no arcade card, no links from other projects) unless I ask.
9. **Report** the project id, the service id, the domain, the deployment id and commit, and the result of every check above.

If a step is blocked by a permission, say which one, do the parts that are not blocked, and stop.

---

## 14. THE BUILD ORDER

After each milestone: run the validators and tests, take the screenshots, look at them critically, fix, commit, and push to `v2`. Stop and give me the milestone report (12.3). Then continue unless I tell you to wait. If I said "keep going without stopping," keep going.

**Milestone 0: Branch and baseline.**
Create the `v2` branch (section 1.1). Install, build, run the existing test suite, and record the baseline numbers (draw calls, triangles, bodies, load time, test counts) in `BUGS.md` under "baseline." Open the live old link yourself if your network allows, and play the first three minutes of Act 1, then write down every glitch you see with an exact location. Add these to `BUGS.md`. Do not fix anything yet.

**Milestone 1: The engineering contract.**
Build `src/maps/` with the schema, the builder skeleton, and the validators (section 3). Port nothing yet: write the validators and run them against the existing Act 1 data (`NeighborPlan.js` as converted into the new tables) so the first report lists everything wrong with the old house. Fix the schema and the report until it is clear and exact. Add the runtime guards (3.5) and the boot guard.

**Milestone 2: The performance base.**
Static geometry merging, instancing, zone culling from the portal graph, body sleeping, lazy act loading, proper disposal (3.6). Get the Act 1 street and house inside the budgets on Medium and Low before adding more rooms. Show the before and after numbers.

**Milestone 3: Surfaces.**
Add the surface variety layer (5.5): trim, panel depth, wear decals, fixtures, using the existing texture helpers. Fix the flat cabinet fronts, flat doors, bare walls and rough stair undersides I listed in 1.4. Screenshot every wall type before and after.

**Milestone 4: The street and the player's house.**
Sections 6 and 7, rebuilt on the new builder, validated, within budget. Act 1 and Act 3 variants (lighting, lamps, gnome, signs).

**Milestone 5: Act 1 house exterior and yard.**
Sections 8.1 to 8.4. Every face, the porch, the tree, the yard, all seven entry routes working and validated.

**Milestone 6: Act 1 interior.**
Sections 8.5 to 8.9. All rooms, at density, validated, with the tilt rules, hiding spots, doors, and lighting.

**Milestone 7: Act 1 story, final run and ending.**
Sections 8.10 to 8.14, hooked to the existing Story, Devices and Brain. The scripted playthrough of Act 1 passes. The ending leads to the Act 2 transition card.

**Milestone 8: Act 2.**
Section 9. The whole complex, the water rules, the carnival hall, the workshop and its model, the mannequin hall, the exit shaft, the chain, the headlamp neighbor, the new learning behaviors. The scripted playthrough of Act 2 passes.

**Milestone 9: Act 3.**
Section 10. The new house, the yard with the hatch, the gate route, the ladder, the train, the windmill, the security, the basement, the birthday room, the finale. The scripted playthrough of Act 3 passes.

**Milestone 10: Transitions, saves, act select, difficulty, mobile.**
Section 11. Everything wired across the three acts, tested on desktop and mobile emulation.

**Milestone 11: Hardening.**
The soak tests, the soft-lock tests under maximum adaptations, the full visual review, the budget check on every zone, and the last pass over `BUGS.md`. Fix everything you find. Do not add features in this milestone.

**Milestone 12: Deployment.**
Section 13. Create the new Railway project, deploy, verify, and report the URL.

---

---

# APPENDIX A: ACT 1, WALL BY WALL

This appendix repeats the Act 1 rooms in a stricter format: every wall, the floor and the ceiling, with the fixtures on each. Use it as a checklist while building. A wall that is not listed here still follows the rules in 5.5. "South" is the front of the house (z = -14 side), "north" is the back.

Heights are measured from the room's floor. "Rail" means picture rail at 2.4 m. "Wainscot" means a 1.0 m panelled lower wall with a 12 cm cap rail. "Skirting" means a 14 cm skirting board standing 2 cm proud.

### A.1 hall (front hallway), 3.0 by 8.0 m

**South wall (front):** the red front door in the middle, flanked by a tall narrow sidelight panel of frosted glass on each side (0.25 m wide, 1.8 m tall) that glows amber from outside. Above the door a half-moon window with a spoked brass fan. On the left of the door a brass coat hook strip at 1.5 m. On the right a wall telephone with a curly cord at 1.4 m and a calendar below it.

**East wall (to the dining room):** green stripes above a wainscot, a door at 2.5 m from the south end, framed with a deep white casing and a small cornice. Between the door and the north end, a tall grandfather clock (2.9 m, with a sad painted face) standing on a plinth. A brass wall sconce at 2.0 m near the south end. Three framed photographs in a stagger, a family of four with two scribbled faces, a normal version of the house, a carnival.

**North wall (back):** the dark green basement door at its east side, with its planks, chain and orange padlock, and a worn rubber mat in front. To its left a narrow console table with a brass bell and a dish of nails. A barometer at 1.6 m.

**West wall (to the living room):** the stair stringer runs along it, a dark wood board 0.3 m tall and 0.08 m thick that follows the rise, with a handrail on the open east side. Under the stair a small paneled cupboard door at the bottom. A door to the living room at 2.5 m from the south end, set into the wall beside the stair's first step (the door sits where the stair starts, so the first step is just inside it, a small joke).

**Floor:** dark wood with a red runner 1.1 m wide down the middle, tassel ends, one corner flipped up, boot prints in dust.

**Ceiling:** cream, 3.8 m up, with a crown moulding, a hanging brass lamp 0.6 m from the south end, a second lamp near the north end, a plaster rosette around each, a long hairline crack.

### A.2 living, 6.5 by 8.0 m

**South wall (front):** blue diamond wallpaper with a white wainscot. Two windows, one at 2.0 m from the west corner (intact) and the broken one 2.5 m further east, each with deep sills (0.18 m), shutter hinges visible inside, and a curtain on a rod (the curtain by the broken window is torn and blowing). Below the broken window the stack of boxes, below the intact one a radiator with a drying sock.

**East wall (to the hall):** the door at 2.5 m from the south end, a coat hook rack, and on its north half a large oval mirror with a gilt frame at 1.5 m reflecting the room (painted, not real). A framed painting of a ship in a storm.

**North wall (back):** a brick fireplace in the center (2.2 m wide, 1.3 m high opening, a mantel 1.2 m up, a chimney breast running to the ceiling) with a basket of logs and a set of iron tools. To its right a door to the mudroom, its frame slightly parallelogram-shaped. To its left the tall bookcase leaning forward with fat colorful books.

**West wall:** a window at 6.0 m from the south end (z = -20), boarded from outside in Act 1 after the first adaptation (raw planks seen through the glass, bars of light across the floor). Below it, a sideboard with a lamp and wax fruit. A deer head mounted at 2.2 m above the sofa, with a hat on one antler.

**Floor:** light wood with a huge concentric-circle rug (red, cream, red, green), a darker border band, a path worn in front of the fireplace.

**Ceiling:** cream with a central plaster rosette and a chandelier-style lamp, a water stain in the north-west corner shaped like a rabbit.

### A.3 dining, 6.5 by 6.0 m

**South wall (front):** yellow pinstripe above a wainscot. Two windows (x = 3.5 with dead flowers, x = 6 intact) with heavy drapes in burgundy tied back with tassels. Between them a small side table with a vase of paper flowers.

**West wall (to the hall):** the door at 2.5 m from the south end, a plate rail at 2.0 m carrying nine decorative plates (a different cartoon animal on each), a cabinet-style barometer.

**North wall (to the kitchen):** the saloon door at 4 m (centered at x = 4), its two halves in white-painted slats, brass hinges. To its right the china cabinet (1.2 m wide) with fogged glass. To its left a sideboard with decanters and a candelabra.

**East wall:** a window at 3 m from the south end (z = -17) with drapes. Below it a long low cabinet. A wall clock with a pendulum at 2.2 m.

**Floor:** wood with a dark border and a large oval rug, burgundy and gold, under the table, a path of wear toward the kitchen door.

**Ceiling:** a heavy plaster medallion with the chandelier (five candle bulbs, tilted), a dark beam across the middle.

### A.4 kitchen, 6.5 by 6.0 m

**South wall (to the dining room):** the saloon door at x = 4 and, on either side, tall cupboards with panelled doors in warm wood. A rail of hanging pans and a rack of mugs.

**East wall:** the side door at 3.5 m from the north end (z = -23.5), with a small window in its upper half, a hose reel hook by it, a row of coat hooks, a doormat. South of it a tall stack of recipe books on a shelf, a clock shaped like a cat with moving eyes and tail.

**North wall (back):** a wide window at x = 5 above a deep double sink full of dishes with a dripping tap. To its west the pantry cupboard (1.0 m wide, a full-height door with a ventilation grille). To its east a run of counters with a toaster, a bread bin, jars of candy, and a cork board with notes and a crude drawing of the player's house.

**West wall:** solid, with the fridge standing against it (bulged, mint, 1.8 m tall), a calendar on the wall beside it with days crossed off, a gas stove below a range hood next to the fridge, the red kettle on a burner, a spice rack, a magnetic knife strip (rounded blades).

**Floor:** black and cream checkerboard (0.3 m tiles), a worn path in front of the sink and stove, a spilled bag of flour.

**Ceiling:** cream, a water stain by the window, a pendant bulb over the island, a pot rack, a fly strip.

### A.5 mudroom, 4.5 by 4.0 m

**South wall (to the living room):** the door at x = -3 (1.5 m from the east end of the living room's north wall), with a row of wooden coat pegs at 1.6 m beside it carrying coats, a rain slicker and a hat. A shelf above with a toolbox and a lantern.

**East wall:** solid, cream paint, a corkboard with an unpaid bill and a to-do list. In the south-east corner, the ladder shaft: a fixed steel ladder (0.5 m wide) rising through a square opening in the ceiling at x[-0.8,-0.1] z[-23.4,-22.7], a hatch above it.

**North wall (back):** the window at x = -3.8 above the washing machine (the window's sill is 1.2 m, the washer is 0.9 m tall, so a stripe of sky shows above it) and the back door at x = -2 with a screen door in front of it (a spring, a wooden frame, a mesh). Next to the door an umbrella stand, boots in a row, a mat.

**West wall:** the door to the bathroom at z = -24 (1.5 m from the north corner), shelves of detergents, bleach and rags beside it, a laundry basket with a lid.

**Floor:** dark wood with a muddy mat and boot prints, and the washer's rails: two shallow slots in the floor under the washing machine that show when it slides.

**Ceiling:** cream, bare bulb on a cord, a drying rack hung on a pulley with socks.

### A.6 bath0, 3.5 by 4.0 m

**East wall:** the door at z = -24, towel hooks, a small cabinet with a mirror.

**North wall:** a pink tiled wall to 1.5 m, a clawfoot tub with a curtain of rubber ducks, a shower head on a swan neck.

**West wall:** a small high window at z = -24 (0.7 m wide, sill 1.4), a towel rail under it with a frog-shaped towel, a toilet with a fuzzy cover next to it.

**South wall:** a pedestal sink under a round mirror, a toothbrush mug, a shaving brush, a wall shelf with a rubber duck, a framed picture of a fish.

**Floor:** pink tile, a frog rug, a bathroom scale. **Ceiling:** pale pink with a round fan grille and a bulb in a glass shade.

### A.7 basementStair, 1.5 by 4.0 m

**South wall:** the entry door at x = 0.7, plain, with a bolt. **East and west walls:** bare concrete painted grey-green, a bare bulb bracket on each, a metal handrail on the east side. **North wall:** a small shelf with a jar, a candle and a box of matches. **Floor:** concrete with a worn central strip, the stair hole x[0.1,1.4] z[-25.8,-22.2] with a guard rail on three sides. **Ceiling:** low, bare, a single bare bulb.

### A.8 hall1 (upstairs hallway), 2.8 by 12.0 m

**West wall (to the bedroom side):** pink polka dots above a wainscot. From the south: the **fake door** at z = -15.2 (opens on brick, with a worn brass knob and a "PRIVATE" plaque), the bedroom door at z = -18.5, the bathroom door at z = -22, the back stairwell door at z = -24.3. Between doors a framed painting, a wall sconce at 2.0 m.

**East wall (to the study side):** the study door at z = -16.8, a long narrow mirror, the kid's door at z = -21.6 with a small hand-painted star, the closet door at z = -24.9 in grey metal with a red lock plate. Between them a barometer and a fire extinguisher in a red box.

**South wall:** a tall window (1.4 by 2.1 m) with a window seat 0.45 m high and a cushion, the front yard visible through it.

**North wall:** a small window (0.7 wide) at x = -1 above a radiator, a framed portrait of an unsmiling man.

**Floor:** wood with a green runner. The stair opening x[-1.42,-0.28] z[-22,-17.15] with a railing on both long sides and a newel post at each end. **Ceiling:** cream with a long crack, two bulbs, a ventilator grille.

### A.9 bedroom, 4.6 by 6.5 m

**South wall:** blue diamond wallpaper, two windows (x = -5.5 and x = -3.5) with floral curtains, a window box visible outside, a telescope on a tripod between them.

**East wall:** the door at z = -18.5, a coat hook, a full-length mirror.

**North wall:** the headboard of the bed against it, a framed family photograph above it (the neighbor, a woman, two kids), a nightstand with a lamp and an alarm clock on each side.

**West wall:** a window at z = -17, a dresser with a mirror under the window, a wardrobe (1.2 m wide) near the north-west corner.

**Floor:** green carpet with a darker border. **Ceiling:** cream with a pendant lamp and a plaster rose.

### A.10 bath1, 4.6 by 3.0 m

**East wall:** the door at z = -22 (in the hall's west wall), towel hooks. **North wall:** the clawfoot tub, tiled in yellow to 1.5 m, a shower rail. **West wall:** a small window at z = -22 (0.7 m wide, sill 1.3), a hamper under it. **South wall:** a pedestal sink and a medicine cabinet with an overflowing shelf, a toilet. **Floor:** yellow tile with a white border. **Ceiling:** cream, a stain, a pull-cord light.

### A.11 stair2 (back stairwell), 4.6 by 2.5 m

**East wall:** the door to the hall at z = -24.3, a coat hook with three old coats. **West wall and landing:** a small window at z = -24.8 (0.6 m wide, sill 1.6) over the half-landing, a framed photo of an unsmiling man in a mustache, a bucket on the floor under a drip. **North wall:** the foot of the first flight, rising west. **South wall:** the head of the second flight, rising east. **Floor:** dark wood, worn at the stair edges. **Ceiling:** a sloped underside where the flight above passes, painted cream with a bulb.

### A.12 study, 8.2 by 5.5 m (plus the jut)

**South wall (front, z = -14, and -13.2 on the jut):** green stripes, two windows (x = 3.3, x = 7.6) and the balcony door at x = 5.5 with glass panes, between them a drafting table by the window carrying the green table with the red key. Binoculars on a stand by the balcony door.

**West wall (to the hall):** the door at z = -16.8, a tall bookcase of binders, a coat.

**North wall (back):** the kid's-room wall: a long pinboard with blueprints (the house with more rooms than the player has found) and a model of the street on a table below it with a red X on the player's house. A shelf of tools and jars.

**East wall:** a big desk (1.6 m wide) under a window at z = -16 (the tree window is on the east face: a window at z = -16, 0.95 m wide, sill 0.7), a typewriter, a lamp, a globe, a filing cabinet.

**Floor:** wood with a worn rectangle under the desk chair and a rug. **Ceiling:** cream, a pendant drafting lamp, a ventilator.

### A.13 kid, 8.2 by 4.3 m

**West wall (to the hall):** the door at z = -21.6 with a blue lock plate, a child-height growth chart pencilled on the frame with initials and ages up to 7, a hand-drawn "Keep Out" sign in crayon.

**North wall:** shelves of stuffed animals (slightly oversized), a doll house, a toy chest under them.

**East wall:** a window at z = -21.7 with curtains patterned with planets, a small desk below with crayons and a drawing of a happy house.

**South wall:** the bed with the race-car frame against it, a moon night-light, a mobile of planets hanging over it, a high shelf at 2.8 m that carries the crowbar among picture books.

**Floor:** red carpet with a pale road-map rug, toys across it. **Ceiling:** painted dark blue with glow-in-the-dark stars (emissive stickers), a paper lantern.

### A.14 closet, 8.2 by 2.2 m

**West wall:** the red-locked grey metal door at z = -24.9. **South and north walls:** pegboards with tool outlines (some tools missing), shelves of paint, nails, screws, rope, chain. **East wall:** a fuse box, a wall clock stopped, a calendar from 1987. **Floor:** concrete, oil stains, the big red toolbox on a rug, a mop bucket. **Ceiling:** bare, a caged bulb, a hanging coil of cable.

### A.15 landing, 6.0 by 8.0 m

**South wall:** the round porthole window at x = -4 with a deep brass ring and a cobweb, an old pram under it. **West wall:** a window at z = -21 with torn curtains, an old chest of drawers, a stack of suitcases. **North wall:** a window at x = -4 above a mound of old toys, the stair arrival in the north-west corner. **East wall:** the partition (x = -1) with the boarded purple door at z = -22 (three planks), a green-locked door in the exterior east face at z = -20 (the plank bridge). **Floor:** old wood with gaps, a rolled rug. **Ceiling:** exposed beams, a gabled slope, a cobweb net, a string of dead Christmas lights.

### A.16 purple, 3.0 by 8.0 m

**All walls:** deep purple paint with a darker skirting and a thin gold line at 1.2 m. **West wall:** the boarded door, a hook at 1.5 m with the green key. **East wall:** a tall narrow window at z = -22 (0.55 wide) with a heavy curtain. **North wall:** the television on the floor playing the carnival loop, the radio on a stool. **Floor:** old wood, a single chair in the middle. The hatch at x[-0.8,-0.1] z[-23.4,-22.7]. **Ceiling:** a single bare bulb on a cord, a dead moth.

### A.17 tomato, 4.0 by 4.0 m

**West wall:** the opening onto the plank bridge, a hook with a coil of rope. **South wall:** the small curtained window at x = 7. **East wall:** the long workbench with a vice and the magnet gun. **North wall:** a bank of four security monitors on a shelf, grey static, a blueprint, a cot. **Floor:** old planks with 3 cm gaps (decorative), a box of bear traps. **Ceiling:** low corrugated metal, a bare bulb, rain stains.

### A.18 attic, 3.0 by 3.0 m, 4.4 m tall

**South wall:** the tiny window at x = -3.5 with the glowing bulb visible from the street. **West and east walls:** raw planks leaning inward under the steep roof, hooks with ropes and a stuffed owl. **North wall:** the trunk with the note. **Floor:** planks, the hatch x[-4,-3.2] z[-22,-21.2], a telescope on a tripod aimed through the window. **Ceiling:** a pointed roof with exposed rafters, a single bare bulb on a cord.

### A.19 Exterior material appendix

**Siding:** horizontal clapboard, 0.18 m boards, a 3 mm shadow groove, boards of slightly different brightness (plus or minus 4 percent), a few warped boards, nail heads every 0.6 m as tiny darker dots. **Trim:** white, 0.14 m wide at corners and windows, a visible drip cap above every window, slightly dirty at the bottom edge. **Shutters:** blue, louvered (real louvers, 3 cm deep), 0.35 m wide each, hinges visible. **Window frames:** a white frame 0.08 m wide with a cross mullion, glass with the diagonal glare stripes. **Doors:** raised panels (four on the front door, two on the side door) 1.5 cm deep. **Porch deck:** wide boards with a painted gray-green finish, worn to bare wood on the path from the steps to the door. **Roof shingles:** chunky, 35 cm wide, two-tone alternating rows, a few missing, moss in the lowest corners. **Gutters:** half-round, dented, a hanging leaf. **Plinth:** concrete with a tide mark of dirt. **Brick chimney:** 30 by 12 cm bricks with thick cream mortar, a darker cap, smoke. **Metal sheet on the tomato room:** corrugated, rust at the seams.

---

# APPENDIX B: ACT 2, SURFACE BY SURFACE

Same idea as Appendix A, for the underground. Here "north" is -z, "south" is +z, "east" is +x, and coordinates are in the Act 2 frame from section 9.0. Walls in Act 2 are concrete, brick and sheet metal, so the variety comes from stains, rust, pipes, stencils, bolts, hatches, patches and wear.

### B.1 Landing, 4 by 4 m

**West wall (x = -2):** the shut stair door (steel, grey, a round window at 1.6 m showing a dark stair, a handle worn bright), a coat hook with a small blue raincoat, a framed child's drawing of a sun. **North wall:** the crayon drawing taped at 1.1 m with curled corners, a growth chart, a small shelf with three picture books. **South wall:** a small table with a cup and two plates, a toy telephone, the wooden chair holding the teddy bear (in the south-east corner). **East wall (x = 2):** the far door, a plain steel door painted pale green, ajar, with a rubber seal. **Floor:** pale boards with a faded rug (cream with a blue ring). **Ceiling:** low (2.4 m), a bulb in a wire cage, a nightlight shaped like a moon on a wall socket.

### B.2 Boiler Gallery, 32 by 3 m

**North wall (z = -1.5):** painted grey-green to 1.4 m, bare concrete above. From the west: a row of six wall lockers (two open) between x = 4 and x = 7.5, a bench, a fire axe in a glass case at x = 9, the archway to the Pump Cavern at x = 18 (2.4 wide, an iron gate hanging open on one hinge), a fuse panel with three empty slots at x = 25, a gauge cluster at x = 28.

**South wall (z = 1.5):** the stuck-looking but unlocked door to the Stacks at x = 9 (steel, a small wire-glass window, a yellow warning stripe), a rack of lanterns beside it, a mop and bucket, a long run of colored pipes with valve wheels, a wall map torn in half at x = 14, stacks of crates at x = 20 to x = 24 with stenciled letters, a coiled hose on a reel at x = 27.

**Floor:** dark concrete with a drain channel down the middle (0.2 m wide), tide marks, chalk arrows, yellow edge lines. **Ceiling:** six pipes in six colors running the full length, with brackets every 2 m, cyan tube lights in cages every 6 m, two leaking joints with steam at x = 10 and x = 22, cobwebs between brackets.

### B.3 Boiler Room, 8 by 10 m

**North wall (z = -5):** the fuse box (grey metal, three slots), a mezzanine stair going up to y = 2.5 with a handrail, two cabinets on the mezzanine, a steel ladder, a shelf of oil cans. **West wall (x = 28):** the gallery opening (the room widens), a gauge board with nine gauges at 1.5 m. **South wall (z = 5):** a long workbench with a vice, a spare pipe rack, a barrel of oil, a stack of tires. **East wall (x = 36):** the heavy east door (iron, riveted, locked until the cistern drains), a ladder, a coal chute hatch in the wall at 2.0 m (decor).

**Floor:** concrete with soot, coal dust, a brick plinth for the boiler at x = 32, z = 0, a rail track for a coal barrow. **Ceiling:** 5.5 m, brick vault with a rusted iron hook, a chimney pipe, a ring of red emergency lamps pulsing.

### B.4 Pump Cavern, radius 9 m

**The wall (a curved band, 8 m tall):** vertical concrete ribs every 1.5 m with iron bands, long white and rust streaks below each drip point, three round porthole windows at 5.5 m (painted black), a door on the west at (9, -14) with a hazard stripe, a tall iron door on the north at (18, -23), a gallery archway on the south at (18, -5) (the entry), a vent grille low on the east (0.9 by 0.9 m). Wall lamps in cages every 4 m, red emergency lamps in between. A thick rusted pipe descends from the dome to the island.

**The dome:** herringbone brick, a sealed black skylight, a ring of iron spokes, a drip stream falling into the water.

**The ring catwalk:** iron grating with a handrail (1.0 m high, 4 posts every 5 m), diamond tread plate at each spoke, a painted ring number. **The spokes:** four bridges, each 1.2 m wide, grating floor, a curved rail, a hazard stripe at each end. **The island:** a round concrete plinth with a brass compass inlaid, three valve stems (colored rings at their bases), a lever podium, a drain grate.

**The water:** murky teal with a pale foam edge, a gentle slow swell, floating crates and barrels, a rubber duck. **The floor under the water (visible when drained):** wet concrete, a heap of old toys, drag marks, a round hatch with a bolted wheel at the center.

### B.5 The Stacks, 32 by 22 m

**The perimeter walls:** concrete to 4.0 m, painted with numbered bay signs every 4 m (A1 to P11), a yellow lane line 0.5 m from the wall, wire cages over the lights, steel columns every 8 m with hazard-striped bases. **North wall (z = 2.0):** the door D at column 3 (from the gallery), a row of lockers. **East wall (x = 36):** the east door E at row 5 (z = 13) and the mine cart door T at row 9 (z = 21), a mine cart track entering at T, hanging chains. **South wall (z = 24):** a long line of shipping crates and a roll-up shutter painted shut. **West wall (x = 4):** a break in the wall at row 5 to a short dead-end service stub with a fire hose.

**The racks:** each rack face is a steel frame with four shelves and stencil labels, loaded with instanced boxes in three tones of cardboard, jars of green liquid (emissive faintly), paint cans, tool crates and toys in clear bags. Every rack has a lamp every two bays. Every third rack carries a hand-painted number and a patch of rust. **The aisles:** yellow painted lines, chalk hopscotch in aisle 1, an oil stain in aisle 5, a scattered spill of nails in aisle 9. **The mezzanine at x = 20, z = 14:** a steel platform at y = 2.4 reached by pallet stairs, a cage holding the crowbar, a clipboard on a nail.

### B.6 Carnival Hall, 26 by 28 m

**North wall (z = -14):** a mural of striped bunting in faded red, white and blue, the stage in front (x[48,60] z[-14,-10]) with a red velvet curtain half drawn and a painted sky backdrop. **East wall (x = 64):** a row of painted circus wagons with scalloped awnings, a long strip of bulbs in two colors, a ticket window. **South wall (z = 14):** the Stacks door E at x = 38 to 40, a mural of a train, a short passage (2 m) to the workshop door at x = 46, a snack counter with stools. **West wall (x = 38):** the Boiler Room door at z = 0 (heavy, riveted), the mirror maze entrance at x = 40 to 48, z = -12 to -4, a row of arcade cabinets (decor) along the wall.

**Floor:** a sunburst of painted boards in red, yellow and blue wedges, scuffed, tickets scattered. **Ceiling:** a vast striped canvas tent swag in red and cream dropping to the walls at 4 m, a ring of bulbs around the carousel, strings of bulbs in pink and yellow in loops, a few hanging paper lanterns. **The carousel:** described in 9.7 (twelve horses in three rings, a striped canopy, a calliope). **Stalls:** the high striker at (56, 8), the ring toss at (58, -2), the cotton candy machine at (42, 10), the fortune-teller booth at (62, 10).

### B.7 Workshop, 16 by 12 m

**North wall (z = 16):** the door from the carnival hall at x = 46 (a heavy plank door with a padlock hasp and a hand-painted sign WORKSHOP), pegboard on either side with outlines of tools. **East wall (x = 54):** the fuse locker (steel, 0.8 m wide, a combination dial) among shelves of paint and jars, a pinned calendar with one day circled. **South wall (z = 28):** a long bench with a vice, a lathe, a bandsaw, a rack of timber, a high window-like panel painted with a blue sky and lit from behind. **West wall (x = 38):** the mine cart archway at z = 21 (1.4 m high), shelves of toys in various states of repair, a cot with a lantern, a record player.

**Floor:** concrete with sawdust drifts, chalk marks, a coil of cable. **Ceiling:** exposed beams hung with tools and lamps, a cable run, the painted sky panel with a lamp behind it.

**The central table (4.0 by 1.4 m):** a scale model of the Act 3 tower house with a living toy train circling its roof, laid on a street board with tiny figures. Around it a ring of stools, a pile of blueprints, a lamp on an arm. The model is the most detailed prop in Act 2: every window glows, the windmill turns, the train clicks.

### B.8 Mannequin Hall, 16 by 6 m

**North and south walls:** pale cream wallpaper with small pink rosebuds above dark wood wainscot, a picture rail with 30 empty gilded frames (15 per wall), a wall sconce between every second frame. **West wall (x = -20):** a closed double door, a wardrobe, a window-shaped alcove with a candle. **East wall (x = -4):** the doorway from the Pump Cavern ring, flanked by two mannequins in wedding clothes.

**Floor:** a worn red runner on wood. **Ceiling:** plaster with a plaster rosette every 3 m and a dim wall-bracket light, a single crack. **Mannequins:** thirty in two rows, adult and child sizes, blank oval faces with two painted dots and a curve, some missing an arm, all facing inward.

### B.9 Flooded Passage, 22 by 2 m

**Walls:** old wet brick with white salt streaks and green moss, arches every 2 m, iron brackets, a long pipe on the north side with a drip every 3 m. **Floor:** a channel of murky teal water (waist-deep until drained), a slimy brick bottom, a plank path in two places. **Ceiling:** a barrel vault dripping mineral deposits, bare bulbs every 6 m on cords with mist above the water, a swaying lantern on a hook.

### B.10 Exit Shaft chamber, radius 5 m

**Walls:** curved brick with iron bands, a pump housing, a timber pile. **Floor:** concrete with a ring of rust around the shaft collar. **The lift:** a steel cage (2.4 m across) with a sliding gate, a control panel (crank socket, three fuse slots), a nameplate in brass, a counterweight on a pulley. **The shaft:** concrete rings every 2 m with a ladder on the north side, 16 m up, with faint dusk light leaking around a square hatch at the top.

---

# APPENDIX C: ACT 3, WALL BY WALL

House-local coordinates (section 10.0). "South" is the street side (z = 0), "north" is the back (z = 11). "East" is +x, "west" is -x.

### C.1 foyer_f0, 5.0 by 3.0 m

**South wall (z = 0):** the front door in the center (x 6.5 to 7.45), bolted, with a frosted sidelight on each side (0.25 wide, 1.8 tall) and a half-moon window above, a mail slot at 1.1 m, a pile of unopened letters under it, a coat hook strip on the left. **East wall (x = 9.5):** the dining room door (z 1.0 to 1.95), the console table with the bowl of keys, a mirror at 1.5 m with a cracked corner. **North wall (z = 3.0):** the doorway to the hall (x 5.2 to 6.15) with a deep casing, a framed picture, a wall calendar. **West wall (x = 4.5):** the living room door (z 1.0 to 1.95), a coat stand, boots, an umbrella stand.

**Floor:** wood with a long red runner. **Ceiling:** cream with a pendant lamp that flickers, a plaster rosette.

### C.2 living_f0, 4.5 by 6.5 m

**South wall:** blue diamonds above a wainscot. The broken window (x 1.6 to 2.5) with a torn curtain and a pile of boxes below it, the intact window at x 3.4 to 4.3 with a radiator below. **East wall:** the foyer door, a mirror, a painting of a ship. **North wall (z = 6.5):** a brick fireplace at x 0.8 to 2.8 with a basket of logs and tools, and the door to the back hall at x 3.2 to 4.15. **West wall:** the boarded window at z = 3.0 (bars of light), a sideboard with a lamp, a deer head with a hat.

**Floor:** light wood, a concentric-circle rug. **Ceiling:** a rosette with a lamp, a rabbit-shaped water stain.

### C.3 dining_f0, 4.5 by 5.5 m

**South wall:** yellow pinstripe, two windows (x 9.6 to 10.5, and x 11.6 to 12.5 boarded from inside with a crooked plank), burgundy drapes. **West wall (x = 9.5):** the foyer door, a plate rail with nine plates. **North wall (z = 5.5):** the double swing door to the kitchen (x 10.8 to 12.2), the china cabinet to its right, a sideboard to its left. **East wall (x = 14):** a window at z 1.55 to 2.45, a long low cabinet, a wall clock.

**Floor:** wood with a dark border, a burgundy oval rug. **Ceiling:** a plaster medallion with the tilted chandelier, a camera in the north-east corner.

### C.4 hall_ground, 2.5 by 3.0 m

**South wall (z = 3.0):** the doorway from the foyer. **West wall (x = 4.5):** solid, pink polka dots, a stack of picture frames face to the wall, a rolled carpet leaning. **East wall (x = 7.0):** the closet door at z 4.0 to 4.95 with a laser tripwire inside, a bicycle frame leaning, three boxes against the wall. **North wall (z = 6.0):** an open arch (2.0 m) into the stair hall.

**Floor:** dark wood, clutter (36 props). **Ceiling:** one bulb at the north end.

### C.5 stair_hall_f0, 2.5 by 5.0 m

**West wall (x = 4.5):** the door to the back hall at z 8.0 to 8.95, an umbrella stand, a coat on a hook, a side table with a lamp. **East wall (x = 7.0):** solid, with the stair flight (x[5.9,7.0]) running along it, a dark stringer, a handrail on the open (west) side, a twisting newel post at the bottom. **South wall (z = 6.0):** the open arch. **North wall (z = 11.0):** a small high window (x 5.2 to 5.8, sill 1.8), a framed photo of a house.

**Floor:** dark wood with a runner. **Ceiling:** cream, the underside of the F1 floor, a bulb.

### C.6 kitchen_f0, 7.0 by 5.5 m

**South wall (z = 5.5):** the double swing door at x 10.8 to 12.2 with tall cupboards either side, a rack of pans. **East wall (x = 14):** the locked side door at z 6.5 to 7.45 with a camera above, a hose reel, a row of coat hooks. **North wall (z = 11):** the wide window at x 10.4 to 11.6 above a double sink, a pantry (1.0 m wide) in the north-west corner, counters with a toaster and candy jars, the cork board. **West wall (x = 7.0):** solid, the fridge against it, a stove next to it with the kettle, the crowbar sticking out behind the stove.

**Floor:** checkerboard (0.3 m tiles), a spilled bag of flour. **Ceiling:** cream, a pendant over the island, a fly strip.

### C.7 back_hall_f0, 2.5 by 4.5 m

**East wall (x = 4.5):** the door to the stair hall at z 8.0 to 8.95. **South wall (z = 6.5):** the door to the living room at x 3.2 to 4.15, a coat rack. **West wall (x = 2.0):** the sealed basement door (z 8.5 to 9.45) with its boards, bolts, the keycard panel, the camera above. **North wall (z = 11):** the back door with a screen door at x 2.5 to 3.45 (locked), a washer and dryer beside it, shelves of paint.

**Floor:** concrete tile with a drain. **Ceiling:** a caged bulb, a pipe.

### C.8 basement_landing_f0 and basement_b1

**Landing (x[0,2] z[6.5,11]):** concrete walls painted grey-green, a bare bulb, a metal handrail, the stair mouth descending south. **Basement:** pale tile floor, white-green walls with a row of three tube lights, a steel fridge with the cake, a steel table, a shelf of party supplies, a height chart, a teddy bear on a chair, the fifth mannequin against the east wall, a door at the far end that opens on brick.

### C.9 hall_f1, 2.5 by 6.2 m

**South wall (z = 0):** the balcony door at x 5.25 to 6.25 (glass panes, a lace curtain), a window seat is not here (the door takes its place), a binocular stand. **West wall (x = 4.5):** the bedroom door (z 1.0 to 1.95), the study door (z 4.4 to 5.35), pink polka dots, a barometer between. **East wall (x = 7.0):** the Dutch gate (z 1.5 to 3.5), the lamp in front of it (x[6.0,6.5] z[2.4,2.9]), the capped rail against the wall (x[6.5,7.0] z[3.6,5.6]), a camera above the gate. **North wall:** open to the stairwell at z = 6.2, a laser grid across the hall at z = 5.0.

**Floor:** wood, a green runner. **Ceiling:** cream, a bulb at each end.

### C.10 bedroom_a, 4.5 by 4.0 m

**South wall:** two windows (x = 1.5 and x = 3.5, each 0.9 m wide) with floral curtains and a telescope between them. **East wall:** the hall door, a full-length mirror. **North wall (z = 4.0):** the wardrobe against it, a hat stand. **West wall (x = 0):** the bed's headboard at the center, a framed family photograph above it, nightstands with lamps and the alarm clock on each side, a boarded window (z 1.5 to 2.4) with bars of light.

**Floor:** green carpet with a dark border. **Ceiling:** a pendant lamp with a plaster rose.

### C.11 study_f1, 4.5 by 2.2 m

**East wall:** the hall door (z 4.4 to 5.35). **North wall (z = 6.2):** the bathroom door (x 1.0 to 1.95), a corkboard, a filing cabinet. **West wall (x = 0):** a window (z 4.7 to 5.6) with the desk below, a typewriter and a lamp, a closet (x[0,1.2] z[5.4,6.2]) holding mannequin #4 in a bag. **South wall (z = 4.0):** shelves of binders, a pinned map, a small monitor with a red LED. **Floor:** wood with a worn spot under the chair. **Ceiling:** a pendant drafting lamp.

### C.12 bath_f1, 4.5 by 4.8 m

**South wall (z = 6.2):** the door to the study (x 1.0 to 1.95). **West wall:** a small window at z 8.3 to 9.1, a hamper. **North wall (z = 11):** the clawfoot tub, tiled in yellow to 1.5 m. **East wall:** a pedestal sink and a medicine cabinet, a toilet. **Floor:** yellow tile. **Ceiling:** cream, a pull-cord light, a drip stain.

### C.13 stairwell_f1, 2.5 by 4.8 m

**West wall (x = 4.5):** solid, a tall plant, a framed photo. **East wall (x = 7.0):** solid, the birthday room's wall, a barometer. **North wall (z = 11):** a small window (x 5.2 to 5.8). **The opening:** x[5.9,7.0] z[6.2,10.9] with a railing on the west edge. **Floor:** wood strip x[4.5,5.8]. **Ceiling:** cream.

### C.14 gallery_f1, 7.0 by 6.0 m

**South wall (z = 0):** windows at x = 9.0 and x = 12.0 (tall, 0.9 by 1.5 m), a sofa under the second, a rocking horse. **East wall (x = 14):** three tall windows at z = 1.0, 3.0, 5.0 with deep sills, a long table with a sheet. **North wall (z = 6.0):** the door to the birthday room (x 11.0 to 11.95), shelves of old toys, three covered shapes in the north-east corner (one is mannequin #1). **West wall (x = 7.0):** the gate (z 1.5 to 3.5) with its latch on the gallery side, the lamp's back, the rail's back. The ladder frame stands at x[8.0,8.8] z[4.6,5.4] with its hatch above.

**Floor:** wood with a long rug. **Ceiling:** cream with two cameras and a pendant lamp.

### C.15 birthday_room, 7.0 by 5.0 m

**South wall (z = 6.0):** the door from the gallery (x 11.0 to 11.95), a banner of fat letters, balloons painted on the wall. **West wall (x = 7.0):** solid, a grandfather clock stopped at 4:17, a rocking chair, a gramophone. **North wall (z = 11):** two windows (x = 9.0 and 12.0) with party streamers, a pile of presents under them. **East wall (x = 14):** the five floor pads along it, a window at z 6.8 to 7.7, the fire escape door at z 9.0 to 9.95 with a small landing, a high chair.

**Floor:** wood with a painted ring of stars around the table. **Ceiling:** streamers in loops, strings of bulbs, a disco ball.

### C.16 ladder_room_f2 and control_room_f2

**ladder_room_f2 (x[3.5,10.5] z[3.0,5.5]):** mint walls, a concrete floor, a hatch with a guard rail at x[8.0,8.8] z[4.6,5.4], the track holes in the west and east walls at z 3.8 to 5.0, the crawl hole in the north partition at x 5.0 to 6.2, a work lamp, a tool rack, a camera in the north-west corner. **control_room_f2 (x[3.5,10.5] z[5.5,8.0]):** a long console along the north wall with switches and dials, a cracked window (0.9 by 1.5 m), the exterior door at x 6.5 to 7.45, a desk with the keycard drawer, a cot, a kettle, the button post at (6.0, 7.4) and the lever box at (8.5, 7.4), a camera in the north-east corner.

### C.17 Exterior material appendix

**Siding:** clapboard as in A.19, in `NH_SIDING_MAIN` (ground), `NH_SIDING_MAIN_2` (first floor), `NH_SIDING_ALT` (box). **Roofing felt:** dark `#3B3B44`, seams every 1.0 m, patches of tar, puddles. **Parapet:** brick coping in red. **Windows:** glowing colored panes at night, each with a curtain silhouette. **Windmill:** cream tower, mustard and white blades, a glowing yellow lamp. **Train:** red engine, blue and yellow carriages, a headlamp cone. **Cameras:** grey boxes with red LEDs. **Lasers:** thin red beams with bloom. **Fire escape:** black iron with a landing at the birthday room door.

---

---

## 15. FINAL NOTES

When a decision is not covered by this document, choose the option that is more solid, more playable and more like a slightly broken children's picture book about a man who is hiding something. If it looks realistic, sleek, gritty or empty, it is wrong. Make it chunkier, brighter, denser, and a little more crooked, and then prove it does not glitch.

Give Mr. Grimsby one moment in the game where the player feels sorry for him. That moment is in the birthday room at the end of Act 3. Make it land.

Now start with Milestone 0.
