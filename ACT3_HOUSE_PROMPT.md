# ACT 3 HOUSE: SCALE-ACCURATE RECONSTRUCTION PROMPT FOR CLAUDE CODE

Paste this whole document into Claude Code as one message (it has two parts: the build plan, then a detailed engineering spec), in a session on the `nosy-neighbor` repo. Read all of it before you write any code. Then do Milestone 0 first. Do not skip it.

---

## 0. THE JOB, AND THE HONESTY RULE THAT COMES FIRST

You are going to rebuild the neighbor's house as it appears in Act 3 of the 2017 game Hello Neighbor, as a walkable 3D space in the browser, built to real-world scale, and you are going to be able to prove how close to scale it is.

Here is the problem you need to understand before anything else. There are no public blueprints for this house. The developers never published dimensions. Fan wikis list rooms and puzzles, not centimeters. Walkthroughs describe routes, not floor plans. So nobody, including me and including you, can honestly say "exact to scale" from memory or from text alone. If you build the house from imagination and tell me it's exact, you have lied to me, and I'd rather you didn't.

So this project runs on a different rule, and it overrides everything else in this document:

**Every single dimension in the house must carry a source tag, and the build must report how much of the house is measured versus guessed.**

The three tags:

- `measured`: derived from reference material I supplied in this session (screenshots, video frames, a floor plan, a model dump). You show your working: which image, which known object you used as the ruler, the pixel math.
- `documented`: stated in a text source I can point to (a wiki line, a walkthrough, a developer post). You quote the source in the data file.
- `assumed`: you picked it. It's a placeholder that follows the proportion rules in section 4. It is allowed to exist. It is not allowed to be hidden.

The finished project ships with an audit screen that prints the percentage of wall length, floor area, and openings in each tag category. When I upload more screenshots later, assumed numbers get replaced by measured ones and the percentage moves. That's what "getting closer to exact" looks like in practice, and it's the only honest version of it.

---

## 1. WHAT IS ACTUALLY KNOWN ABOUT THE ACT 3 HOUSE

This is everything I could confirm from public walkthroughs and wiki snippets. Treat it as `documented` at best, and as unverified where I say so. Do not add to this list from your own memory without tagging the addition `assumed` and flagging it in the audit.

**Setting.** Act 3 takes place at the neighbor's house again, after the events of the earlier acts. The house has changed. Reports describe rooms that are boarded up, new security cameras, and laser grids guarding some areas. The house has multiple floors, hidden areas, and secret passages.

**Getting in.** A walkthrough describes entering through a broken window, then climbing stairs near a cluttered hallway.

**Second floor.** A walkthrough describes a gated or blocked section on the second floor that you get past by jumping onto a railing and then onto a lamp.

**The basement.** The basement entrance is blocked by boards held on with bolts. A crowbar removes the bolts. There is also an electronic lock that needs a keycard.

**Upper floors.** A walkthrough describes climbing a ladder to the second-highest floor, then finding a train track and a hole that leads to another room. A button and a lever start a train, and the train runs around the roof of the house.

**The roof and the windmill.** A windmill sits on the roof. The player climbs it to retrieve one of the mannequins used in the birthday room puzzle. (Source quality for this one is weaker. Mark it `documented-weak` in the data.)

**The birthday room.** A room that needs several mannequins placed to complete a puzzle.

**What is NOT known.** Floor count (exact), room count, room dimensions, ceiling heights, door sizes, window sizes, stair counts and steepness, wall thickness, exterior colors, the footprint, the roof pitch, where the train track runs in plan view, the real height of the windmill. All of these start as `assumed` and must be replaced by `measured` wherever I give you material.

Sources used for the list above, so you can cite them in the data file:
- GameSkinny, "Hello Neighbor Act 3 Complete Walkthrough"
- GamePressure, "Hello Neighbor: Act 3"
- Hello Neighbor fan wiki pages on Mr. Peterson's House and on rooms (earlier builds, so use only for style hints)

---

## 2. MILESTONE 0: ASK ME FOR REFERENCE MATERIAL (DO THIS BEFORE WRITING GEOMETRY)

Your first message back to me must not be code. It must be a short request for reference material, in this priority order:

1. Screenshots or video frames from the real Act 3 house, as many as I can give, ideally including: each exterior wall straight on, each floor's main hallway, every staircase from the bottom and from the side, the windmill, the train track, the basement door, the birthday room, and any shot where the player character is standing next to a door or a stair (these give you a ruler).
2. Any floor plan, level map, or top-down image I can find. Fan-made ones count. Tag them `fan-plan` in the audit, since fan plans are themselves approximate.
3. Any dump of the actual level geometry (model files, level exports). If I have one, tell me what to do with it and how to read it. Be honest that I should check the license and that using ripped game files in a published project is a legal risk.
4. Any measurements anyone has written down.

Tell me how to attach images in this session. If I say I have nothing right now, continue with an all-`assumed` build, but make the audit screen say loudly, in red, "0 percent measured." Do not pretend.

---

## 3. THE SCALE SYSTEM

### 3.1 Units

1 world unit is 1 meter. Every dimension in the data files is written in meters with up to three decimal places. Never mix units. The renderer, the physics engine, and the data files all agree on meters.

### 3.2 The ruler problem and how to solve it

A screenshot has no scale. You get scale from an object whose real size you already know. For this game the best rulers are, in order:

1. **The player character.** It's a child. The game's player height is not published as far as I can find, so the first step in calibration is for me to confirm or you to pick a working height (default assumption: 1.20 m eye height 1.10 m) and tag every measurement derived from it as dependent on that assumption. If I later learn the true height, one number in `config` changes and every derived dimension rescales automatically. Build it so that works.
2. **Standard fixtures.** A real interior door is roughly 2.03 m tall and 0.81 to 0.91 m wide in most of the US. A light switch sits about 1.2 m from the floor. A stair riser is about 0.18 m. Use these as sanity checks, tagged `assumed-from-standard`. Remember that this game warps and exaggerates proportions on purpose, so standard fixtures are weaker rulers here than they would be in a realistic game. Say so in the audit.
3. **Two known objects in one frame.** If a frame shows the player and a door, you get two independent estimates and can report the disagreement.

### 3.3 Measuring from an image

Write a small in-browser tool, `tools/measure.html`, that lets me load a screenshot, click two points on a known-size object to set the ruler, then click any two other points to read off a distance in meters. It must:

- handle perspective honestly: it only gives correct distances for points lying in roughly the same plane as the ruler, and it says so on screen. It should let me place a second ruler in a different plane.
- display an uncertainty range, not a single number. Estimate it from click error (assume plus or minus 3 pixels) and from how far off-axis the camera is.
- export each measurement to `data/act3/measurements.json` with the image name, the ruler used, the pixel coordinates, the result, and the uncertainty.

The house builder then reads `measurements.json` and upgrades the matching dimension from `assumed` to `measured`.

### 3.4 Tolerance

Target tolerance for `measured` dimensions: within 5 percent of the true value when the ruler and the target share a plane and the camera is within 30 degrees of perpendicular. Report the achieved tolerance per dimension. Anything worse gets the tag `measured-rough`.

---

## 4. PROPORTION RULES FOR ASSUMED DIMENSIONS

When a dimension is `assumed`, follow these rules so the guesses are consistent with each other and with the look of the game. Keep every rule as a named constant in `act3/assumptions.js` so I can edit one file.

- The house is built for scale-exaggeration: this game's architecture is oversized relative to the child player. Default assumed ceiling height 3.4 m, door height 2.6 m, door width 0.95 m, window sill 0.9 m, window height 1.5 m.
- Wall thickness: exterior 0.30 m, interior 0.18 m.
- Stairs: riser 0.20 m, tread 0.26 m, width 1.1 m, headroom at least 2.2 m.
- Floor-to-floor: ceiling height plus 0.30 m slab.
- Hallways: 1.4 to 1.8 m wide.
- Rooms: assumed footprints between 12 and 40 square meters, except the birthday room and any room documented as large.
- Upper floors may overhang lower floors by up to 1 m, matching the leaning, stacked look described in `NOSY_NEIGHBOR_PROMPT.md`.

Every assumed number gets the tag `assumed` and the rule that produced it, for example `assumed: rule ceiling_default`.

---

## 5. DATA-DRIVEN HOUSE (THE ARCHITECTURE THAT MAKES SCALE FIXABLE)

Do not hand-place meshes. The house is generated from a spec, so that correcting a measurement moves everything attached to it.

### 5.1 Folder layout, inside the existing repo

```
src/act3/
  HouseBuilder.js        (spec to geometry)
  assumptions.js         (named proportion constants)
  Audit.js               (computes the measured/assumed report)
  Walls.js               (wall segments with openings cut in)
  Stairs.js              (parametric stairs)
  Roof.js                (roof volumes, windmill, train track)
  Props.js               (mannequins, lamps, railings, boards)
  Scene.js               (lights, sky, entry from the street)
data/act3/
  house.json             (the spec)
  measurements.json      (output of the measure tool)
  sources.json           (citations, one entry per documented fact)
tools/
  measure.html           (image ruler tool)
  floorplan.html         (generated top-down view)
```

### 5.2 Schema for house.json

```json
{
  "units": "m",
  "playerHeight": { "value": 1.20, "tag": "assumed", "note": "child, unconfirmed" },
  "floors": [
    {
      "id": "F0",
      "elevation": { "value": 0.0, "tag": "assumed" },
      "ceiling": { "value": 3.4, "tag": "assumed", "rule": "ceiling_default" },
      "rooms": [
        {
          "id": "hall_ground",
          "label": "Cluttered hallway",
          "polygon": [[0,0],[6,0],[6,3],[0,3]],
          "polygonTag": "assumed",
          "walls": [
            { "from": 0, "to": 1, "thickness": 0.18, "tag": "assumed",
              "openings": [
                { "type": "door", "offset": 2.0, "width": 0.95, "height": 2.6, "tag": "assumed" }
              ] }
          ],
          "documented": ["stairs near a cluttered hallway (GameSkinny)"]
        }
      ]
    }
  ],
  "stairs": [],
  "roof": {},
  "features": []
}
```

Every number that can be measured is an object with `value` and `tag`. Plain numbers are a build error. The builder refuses to run on an untagged dimension, with a message that names the exact path in the JSON.

### 5.3 Builder behavior

- Walls are generated as extruded segments with openings cut as real holes (not painted-on doors), so collision and sightlines are correct.
- Corners join cleanly; no gaps or overlaps at any wall junction (the audit checks this).
- Floors and ceilings are slabs with real thickness.
- Stairs are parametric from rise, run, width, and total height, and the builder verifies headroom.
- Changing a value in `house.json` or `measurements.json` and refreshing rebuilds everything. No other edits.

---

## 6. THE DOCUMENTED FEATURES, BUILT ONE BY ONE

For each item, build it to the documented behavior, give every dimension a tag, and add a `sources.json` entry.

**Broken entry window.** A ground-floor window with a smashed pane and glass fragments on the sill. It is the intended way in. Opening height off the ground is `assumed` until measured.

**Cluttered hallway and stairs.** A hallway with boxes, crates, and loose objects (physics props), leading to a staircase to the second floor.

**The gated second-floor section.** A section of the second floor blocked by a barrier. The route past it is: jump onto a railing, then onto a lamp, then over. Build the railing and lamp as real, climbable, physics-correct objects at heights that make that sequence possible for the player's jump height. Provide a test (section 9) that proves the jump sequence is achievable with the configured player jump, and fails loudly if a measurement change breaks it.

**The basement entrance.** A door sealed with boards held by visible bolts, removable with a crowbar item, plus an electronic lock panel that needs a keycard. Build the crowbar, the keycard, the boards, the bolts, and the lock panel. Prying a bolt takes about 1.5 seconds with a visible animation.

**Security measures.** Wall-mounted cameras with a visible field-of-view cone, and laser grids in at least one corridor (thin emissive beams that trigger an alarm event on contact). Keep the alarm event system generic so the neighbor AI from the main game can subscribe to it later.

**The ladder, the upper floor, and the train.** A ladder up to the second-highest floor. A train track runs through a hole between two rooms and out onto the roof, circling the house. A button and a lever start a small train that follows the track. The track is a closed spline. Its plan-view path is `assumed` until I supply a photo or map.

**The windmill.** A windmill on the roof with climbable blades or a climbable ladder, a mannequin on it, and rotating blades. Height and blade length `assumed`.

**The birthday room and the mannequins.** A room that holds the final puzzle. Several mannequins are scattered around the house and roof. Placing them correctly in the birthday room (positions and order `assumed`, flagged in the audit as design placeholders) completes the puzzle. Do not claim the real solution; make the placement configurable in the data file.

**Exterior shell.** Build the outer volume from the floor polygons so it is consistent with the interior. Windows on the outside line up with windows on the inside. Exterior colors are `assumed` and styled per the art rules below.

---

## 7. VISUAL STYLE

Reuse the art doctrine from this repo's `NOSY_NEIGHBOR_PROMPT.md`: sections 2 through 6 (the five pillars, the geometry warp toolkit, the palette, toon materials with tinted shadows and outlines, lighting, and post-processing). Do not re-invent a style.

One important interaction between style and scale: the warp toolkit leans, tapers, and bulges geometry. That is the opposite of scale accuracy. So the project has two render modes, switchable with a key:

- **Survey mode** (default for this project): no warping at all. Walls are exact, corners are 90 degrees where the spec says so, and what you see is the spec. This is the mode the audit and the measure tools use.
- **Style mode:** applies the warp toolkit on top of the survey geometry for the cartoon look, with warp strength capped so no dimension changes by more than 4 percent. Report this cap in the audit, because it is the honest cost of making the house look like the game.

---

## 8. SCALE AND DEBUG TOOLS INSIDE THE GAME

Build these. They are how I will judge whether this is working.

- **Ruler tool:** press R, click two points in the 3D world, read the distance in meters on screen.
- **Height gauge:** a toggleable figure the exact height of the configured player, standing next to anything I look at.
- **Grid overlay:** a 1 m floor grid and a vertical grid on walls, toggleable.
- **Floor plan export:** `tools/floorplan.html` renders each floor top-down to an SVG with dimension lines in meters, color-coded by tag (green measured, amber documented, red assumed).
- **Audit screen:** press F10. It lists, per floor and per room, the percent measured, documented, and assumed by wall length and floor area, plus the overall totals and the list of the 20 largest assumed dimensions (so I know which screenshots would help most).
- **Compare mode:** overlay a reference screenshot, with adjustable opacity, on the 3D view from a camera pose I save, so I can visually check the match. Save camera poses to `data/act3/poses.json` with the name of the matching screenshot.
- **Freecam:** noclip camera with adjustable speed.

---

## 9. AUTOMATED CHECKS

Write tests (Vitest) that run in the terminal and in CI. A change that breaks any of them is a failed build.

1. Every dimension in `house.json` carries a valid tag. No untagged numbers.
2. Walls meet cleanly: no gaps larger than 1 mm and no overlaps larger than 1 mm at any junction.
3. Every opening sits fully inside its wall segment.
4. Every room polygon is closed and non-self-intersecting.
5. Every staircase has at least 2.0 m of headroom along its whole length.
6. Every floor can be reached from the entry window by a walkable path for the player's configured size and jump height. The path-finding test must also confirm the railing-then-lamp jump on the second floor is achievable and not trivially easy.
7. The train track is a closed loop and clears the roof geometry by at least 0.3 m.
8. The audit totals add up to 100 percent per floor.
9. Rescaling `playerHeight` changes every derived dimension proportionally and does not change any dimension tagged `measured` that was not derived from the player.

Print a one-screen summary at the end of every test run, including the overall measured percentage.

---

## 10. BUILD ORDER

After each milestone: run it, take Playwright screenshots from fixed poses, check them against this document, run the tests, commit, and push. Stop and report at the end of each one with the current measured percentage.

**Milestone 0.** Ask me for reference material (section 2). Wait for my reply.

**Milestone 1. Scale foundation.** Project module, `assumptions.js`, the tagged data schema, the builder that refuses untagged numbers, and a one-room test house. Ruler tool, height gauge, grid overlay. Tests 1 through 4.

**Milestone 2. Measure tool.** `tools/measure.html`, `measurements.json`, and the pipeline that upgrades tags. Use any screenshots I gave you to take your first real measurements and show your working for each.

**Milestone 3. Ground floor.** All ground-floor rooms, the cluttered hallway, the broken window, the staircase, the basement door with boards, bolts, and lock panel.

**Milestone 4. Second floor and the gated section.** Rooms, the railing and lamp sequence, test 6.

**Milestone 5. Upper floors, ladder, train, and roof.** The ladder, the hole, the track, the train, the button and lever, the windmill.

**Milestone 6. Security and puzzle items.** Cameras, laser grids, crowbar, keycard, mannequins, birthday room.

**Milestone 7. Exterior shell and style mode.** Outer volume, the warp toolkit with the 4 percent cap, lighting and post-processing from the main art doctrine.

**Milestone 8. Audit, compare mode, floor plans, and the full test suite.** Everything in sections 8 and 9.

**Milestone 9. Deployment.** Push to GitHub and deploy on Railway through my existing pipeline (the repo is connected, auto-deploy on push). Confirm the live URL loads, the audit screen opens with F10, and survey mode and style mode both work.

---

## 11. INTELLECTUAL PROPERTY, AND WHAT TO TELL ME ABOUT IT

This is a fan reconstruction of another studio's level layout. Be straight with me about the risk instead of burying it:

- Everything you build must be generated from scratch in code. No ripped models, textures, sounds, or music. If I give you ripped files, tell me that using them in a public project risks a takedown.
- Do not use the original game's name, logos, or character names in anything that is deployed publicly. Call the project "Act 3 House Study" or similar. The neighbor, if present, is Mr. Grimsby from the main project.
- A faithful copy of a commercial game's level layout is a derivative work even when every asset is original. A private study or learning project is low risk. A public release is higher risk. Mention this once, plainly, in the README, and then get on with the work.

---

## 12. HOW TO REPORT PROGRESS

At the end of every milestone, give me four things and nothing else: what you built, the current audit percentages (measured, documented, assumed), the three assumed dimensions that matter most for me to replace with real measurements, and the exact screenshots that would let you replace them. That list is how this project gets more exact over time.

---

# PART II: THE DETAILED ENGINEERING SPEC

Part I told you what to build and why it's honest. Part II tells you how, in enough detail that you should rarely have to guess. Where a number here is a default, it's tagged as one. Where something is a fact about the real world (lumber sizes, card sizes, physics), it's a fact, and you can lean on it.

---

## 13. CAMERA MATH: HOW TO GET METERS OUT OF A SCREENSHOT

The measure tool in section 3.3 is only as good as its math. Build it on the following, and put the formulas in code comments so I can audit them.

### 13.1 The pinhole model

A screenshot is a perspective projection. A point at camera-space position (X, Y, Z), with Z the distance along the view axis, lands at pixel (u, v) where:

```
u = cx + f * (X / Z)
v = cy - f * (Y / Z)
```

Here (cx, cy) is the image center and f is the focal length in pixels. If you know the horizontal field of view `hfov` and the image width `W`:

```
f = (W / 2) / tan(hfov / 2)
```

If you only know the vertical field of view `vfov` and the height `H`:

```
f = (H / 2) / tan(vfov / 2)
```

The conversion between them depends on aspect ratio:

```
tan(hfov / 2) = tan(vfov / 2) * (W / H)
```

Many games, and Unreal Engine games in particular, define the field of view as horizontal at a fixed reference aspect, then widen or narrow it for other aspect ratios. So the FOV in the screenshot may not match the number in the options menu. Treat FOV as an unknown to be estimated, with a default guess of 90 degrees horizontal tagged `assumed`, and let the tool refine it from the image itself (13.3).

### 13.2 Measuring a length that is parallel to the image plane

If the object you want to measure sits at roughly the same depth as the ruler and faces the camera, then the scale is simple:

```
meters_per_pixel = ruler_meters / ruler_pixels
distance_meters = pixel_distance * meters_per_pixel
```

This works well for a door seen straight on, a wall face seen straight on, a window seen straight on. It's the easy case, and it's the one to prefer. Ask me for straight-on shots.

### 13.3 Measuring when the camera is not square to the wall: vanishing points

Most game screenshots are at an angle. For those, use single-view metrology:

1. Find two or more pairs of image lines that are parallel in the real world and horizontal (for example, the top and bottom edges of a wall, a floor-wall seam and a ceiling-wall seam). Each pair intersects at a vanishing point in the image.
2. Two such points, from two different horizontal directions at right angles (the two wall directions of a room corner), define the horizon line (the vanishing line of the floor plane).
3. Vertical lines meet at a third vanishing point far below or above the image, or at infinity if the camera has no pitch.
4. With three orthogonal vanishing points you can recover the focal length and the principal point from the fact that the directions are at right angles. Use that to estimate the real FOV and report it. This removes the biggest unknown.
5. To measure a height, use the cross-ratio method: given a reference height (the ruler) standing on the ground plane, and a target object standing on the same ground plane, project both onto the vertical line through the vanishing line. The ratio of the target height to the reference height follows from the cross-ratio of four collinear points: the base, the top, the reference top, and the vertical vanishing point.

The tool should walk me through this with on-screen guidance: "draw two lines along the floor edges that should be parallel", "draw two lines along the ceiling edges", and so on, and draw the resulting vanishing points and horizon on top of the image so I can see when I've clicked badly.

If this is too much to build fully, build the straight-on mode (13.2) first and the single-plane perspective mode second (a homography from four clicked corners of a known-size rectangle, such as a door, which maps the whole wall plane to true meters). The four-corner homography is simple, accurate for anything lying in that plane, and covers the majority of wall measurements. Only add the full vanishing-point mode if I ask for it.

### 13.4 Lens distortion and weapon-style FOV tricks

Games often use wide FOV with noticeable stretching at the screen edges. Do not measure anything within the outer 15 percent of the frame width without flagging it `measured-rough`. If a screenshot has visible barrel distortion (straight wall edges bow outward), say so and discount the result.

### 13.5 Two independent rulers, one answer

When two rulers give different results for the same dimension, do not average them blindly. Combine with inverse-variance weighting:

```
w_i = 1 / sigma_i^2
value = sum(w_i * x_i) / sum(w_i)
sigma = sqrt(1 / sum(w_i))
```

Here `x_i` is each estimate and `sigma_i` its uncertainty. Store every individual estimate in `measurements.json`, and store the combined value as the one the builder reads. If two estimates disagree by more than twice their combined uncertainty, flag the dimension `conflict` and show it at the top of the audit screen, because one of the rulers is probably wrong.

---

## 14. A WORKED EXAMPLE (ILLUSTRATIVE NUMBERS ONLY)

This example uses made-up numbers to show the procedure end to end. None of these values describe the real house. Do not copy them into the data.

Suppose I upload `hallway_01.png`, 1920 by 1080, taken straight down a hallway at the end wall. A door in the end wall is fully visible, and I tell you the player character is standing next to it.

1. You open the measure tool and load the image.
2. You mark the door's top-left and bottom-left corners. They are 412 pixels apart vertically.
3. You mark the player's feet and the top of the player's head, beside the door. They are 190 pixels apart.
4. The configured player height is 1.20 m (`assumed`). So the door is 412 / 190 times the player's height: 2.60 m. Uncertainty: each click is plus or minus 3 pixels, so the player measurement is plus or minus 1.6 percent and the door measurement plus or minus 0.7 percent. Combined uncertainty is about 1.8 percent, or plus or minus 0.05 m. Both are in the same plane. Result: door height 2.60 m, plus or minus 0.05 m.
5. The tool writes to `measurements.json`:

```json
{
  "id": "m_0001",
  "target": "F0.hall_ground.wall0.opening0.height",
  "image": "hallway_01.png",
  "ruler": "player_height",
  "rulerValue": 1.20,
  "rulerTag": "assumed",
  "pixelsRuler": 190,
  "pixelsTarget": 412,
  "value": 2.60,
  "sigma": 0.05,
  "plane": "wall_end",
  "offAxisDeg": 4,
  "tag": "measured"
}
```

6. Because the ruler itself (player height) is `assumed`, the result is tagged `measured` but marked `dependsOn: ["playerHeight"]`. If I later confirm the true player height is 1.10 m, every dimension that depends on it rescales by 1.10 / 1.20 automatically, and the audit shows how many measured numbers moved.

The key habit this example teaches: a measurement is only as solid as its ruler. Always record the ruler, and always propagate its tag.

---

## 15. COORDINATES, NAMING, AND VERSIONING

Get this right on day one. It prevents a class of bugs that waste hours.

### 15.1 Coordinate system

Right-handed, Y up, matching Three.js. X runs along the front of the house from left to right as seen from the street. Z runs from the street toward the back of the house (positive Z goes deeper into the house). The origin is the floor level of the ground floor, at the front-left outer corner of the footprint. State this in the README and print the axes in the floor plan export.

### 15.2 Floor and room IDs

Floors: `B1` (basement, if modeled), `F0` (ground), `F1`, `F2`, and so on, then `R` for the roof and `W` for the windmill. Rooms: a stable lowercase snake_case slug, assigned once and never reused, for example `hall_ground`, `bedroom_f1_a`. A label is a separate, human-readable field and may change. Walls are indexed by their position in the room polygon: wall 0 runs from vertex 0 to vertex 1. If a polygon gains a vertex, the builder renumbers walls and must also migrate `measurements.json` targets that reference them. Write a migration helper for this, with a test.

### 15.3 Versioning and change history

`house.json` has a top-level `schemaVersion` and `revision` integer. Every time the data changes (by hand or by the measure pipeline), append an entry to `data/act3/CHANGELOG.md` with the date, what changed, and why. Keep the changelog short and factual. The audit screen shows the current revision and the date of the last measurement import.

### 15.4 Determinism

The same data must produce the same house, byte for byte. No random numbers in the builder. Where clutter placement needs randomness (loose objects in the hallway), use a seeded generator with the seed stored in the data and tagged `design`.

---

## 16. GEOMETRY GENERATION, IN DETAIL

### 16.1 From room polygons to walls with thickness

A room is a closed polygon of centerline or inner-face vertices (state which in the schema; use inner-face by default, since measuring from screenshots naturally gives inner faces). Walls have thickness. For each wall segment:

1. Offset the segment outward by the wall thickness to get the outer face, using a mitered join at each corner. Cap the miter at a limit (for example, 3 times the thickness) and bevel beyond it, so very sharp corners don't spike.
2. Where two rooms share a wall, build it once, using the thicker of the two declared thicknesses, and warn if the two declared values differ by more than 2 cm.
3. Extrude from floor top to ceiling underside.

### 16.2 Cutting openings

Do not use heavy CSG for doors and windows. Instead, split each wall into pieces:

- A full-height segment on each side of the opening.
- A lintel piece above the opening (from the opening's top to the ceiling).
- A sill piece below a window (from the floor to the sill height).

Build each piece as a box with proper UVs. This is cheap, exact, and gives you clean collision shapes. A door opening has no sill piece. A window has both.

Add door and window frames as separate trim geometry that sits slightly proud of the wall, so the opening doesn't look raw.

### 16.3 Floors, ceilings, and slabs

Triangulate room polygons with an ear-clipping triangulator that handles concave shapes and holes (stairwells are holes in the floor above). Floors and ceilings have real thickness: default slab 0.30 m, tagged `assumed`. A stairwell hole in an upper slab must line up exactly with the stair run below, with the top landing flush with the upper floor. Test it.

### 16.4 UVs and texel density

Use world-space UVs scaled so that one texture repeat equals a fixed real-world length (for example, 1 m for siding and floors). This keeps texture scale constant when a measured dimension changes, and it avoids stretching. Keep texture size at 512 pixels per repeat, drawn on canvas as in the main art doctrine.

### 16.5 Normals, smoothing, and bevels

In survey mode, use flat normals on all architecture and no bevels, so edges are crisp and measurable. In style mode, add the 3 to 8 percent bevel from the art doctrine and smooth the normals. The bevel must not move the position of the wall face by more than 1 cm. Chamfer inward on the edges only.

### 16.6 Colliders

Static architecture uses box colliders, one per wall piece, generated alongside the visuals from the same numbers. Never trimesh the whole house. Keep the collider count under 600 for the entire house. Stairs get a ramp collider plus step colliders (see section 17), so the player can walk up smoothly and also step onto an individual stair if they approach from the side.

---

## 17. STAIRS

### 17.1 The rule that makes stairs feel right

Use Blondel's formula as the comfort check: two risers plus one tread should be between 0.60 and 0.65 m. The default (riser 0.20 m, tread 0.26 m) gives 0.66, slightly steep, which matches the "steep stairs" look of the main art doctrine. Flag any stair whose value is outside 0.55 to 0.70 m in the audit as unusual. Do not "fix" it; if it's measured, it's the truth.

### 17.2 Parametric stair types

Implement these, driven by data:

- **Straight:** total rise, run, width.
- **L-shaped:** two flights and a landing, with the turn direction.
- **U-shaped (switchback):** two flights and a landing, 180-degree turn.
- **Winder:** treads that fan around a corner, optional.

Given total rise `H` and a target riser `r`, the stair has `n = round(H / r)` risers and `n - 1` treads, and the true riser is `H / n`. Always recompute, so the stair meets the upper floor exactly, even when `H` changes with a measurement.

### 17.3 Headroom

For every point along the stair, the clear height from the nosing line up to the first obstruction above must be at least 2.0 m (test 5). Compute it from the line through the nosings, not from the tread center. If a stair fails headroom, report which obstruction and by how many centimeters, and do not silently move anything.

### 17.4 Handrails and balusters

Handrail height 0.90 m above the nosing line. Balusters spaced so the gap is no more than 0.10 m. In survey mode, handrails are simple rounded rails. The second-floor railing that the player jumps onto in section 6 is a distinct object, a `climbable_rail`, with its own height and top width (default 0.90 m high, top 0.08 m wide, tagged `assumed`), because the jump puzzle depends on it.

### 17.5 Player collision on stairs

Use the character controller's auto-step with a maximum step height of 0.30 m and ground snapping, so the player glides up stairs without bouncing. Do not rely on the ramp collider alone, because it makes the player slide when standing still.

---

## 18. THE PLAYER, AND THE JUMP MATH THAT TESTS RELY ON

The railing-then-lamp puzzle is only valid if the player's jump can do it. So the player's physics numbers are data, not code, and the tests read them.

### 18.1 Defaults

All tagged `assumed` until I confirm real values.

```
playerHeight        1.20 m   (child; eye height 1.10 m)
capsuleRadius       0.22 m
walkSpeed           2.2 m/s
sprintSpeed         4.2 m/s
gravity             9.81 m/s^2 (game feel may use a higher value; keep it a named constant)
jumpVelocity        3.6 m/s
maxStepHeight       0.30 m
```

### 18.2 Jump height and reach

Maximum rise of a jump from standing: `h = v^2 / (2 * g)`. With v = 3.6 and g = 9.81, that is about 0.66 m. Time to the apex: `t = v / g`, about 0.37 s, so the full jump lasts about 0.73 s. Horizontal travel during a sprinting jump: `speed * 0.73`, about 3.1 m at sprint speed.

Add a short coyote time (0.1 s) and a jump buffer (0.1 s). They make jumps forgiving and do not change the reach numbers, but the test must include them.

### 18.3 Proving the railing-then-lamp route is possible

The test (section 9, test 6) must do this as a computation, not as a hand-wave:

1. Start the player on the floor. Compute whether a single jump from the floor can reach the top of the railing: railing top height must be at most `h` plus the height the player can lift their feet onto a surface. Use a conservative "foot-clear" height of `jumpRise - 0.1 m` as the highest surface you can land on.
2. If yes, place the player on the railing top (standing area at least the player's capsule diameter wide, or the test fails, because you cannot balance on a surface narrower than the capsule).
3. From the railing top, compute whether a second jump reaches the lamp (a horizontal gap and a height difference).
4. From the lamp, compute whether a third jump clears the barrier onto the far side.
5. For each hop, report the margin: how many centimeters of slack (jump rise minus required rise, and jump distance minus required gap). Fail if any margin is negative. Warn if any margin is under 5 cm, because that makes the puzzle frustrating, and over 40 cm, because that makes it trivial.

If measured numbers make the route impossible, that means a measurement or the player's jump is wrong, and the test must say which one is the likely culprit.

### 18.4 Collision shape for tiny ledges

The railing top and lamp top are small. Give them accurate box colliders matching the visible geometry within 1 cm, with no invisible padding. If the real game was forgiving through generous collision, add a named `ledgeForgiveness` constant (default 0, tagged `design`) and report it in the audit if non-zero.

---

## 19. THE ROOF, THE TRAIN, AND THE WINDMILL

### 19.1 Roof volumes

Model the roof as a union of simple volumes (gable, hip, shed, flat) on top of the floor polygons. Roof pitch default is 35 degrees for gable roofs, tagged `assumed`. Eaves overhang 0.45 m by default. The roof needs a walkable surface in the places the player is meant to reach (around the train track, around the windmill base), with a low parapet or ridge so the player cannot fall off by accident, unless I say falling is intended.

### 19.2 The train track

The track is a closed curve. Build it as a Catmull-Rom spline through control points stored in data (`train.controlPoints`, each with an `x, y, z` and a tag). Requirements:

- Closed loop. Test 7 checks this.
- Smooth: maximum curvature limited so the train can turn (minimum turn radius default 1.2 m).
- Clears the roof by at least 0.3 m (section 9, test 7), unless it is meant to run along the roof surface, in which case it follows the roof with a 0.05 m offset.
- Banking: none by default.

The rails are two thin box strips with a gauge of 0.45 m (default, tagged `assumed`) and sleepers every 0.30 m. Use instancing for the sleepers.

### 19.3 The train

A small train: an engine and one or two carriages, each about 0.9 m long and 0.5 m wide (defaults, `assumed`). It follows the spline at a constant speed of 1.0 m/s (default, `assumed`). It starts when the button and lever sequence is completed, runs one full loop or runs continuously, as I configure in the data. Each carriage orients to the spline tangent and sits at its own distance behind the engine. Give the engine a procedural chuff sound that speeds up with the train, and a little steam puff made of rising soft spheres.

If the player is standing on a carriage, they ride it: apply the carriage's velocity to the player (platform-carry logic). Test that the player does not slide off at 1.0 m/s.

### 19.4 The button and the lever

Two interactables in sequence: a button (press, 0.3 s animation, a click sound) and a lever (pull through 60 degrees over 0.5 s, a clunk). The order matters and is stored in data as a list. A wrong order resets the sequence with a short buzz.

### 19.5 The windmill

A windmill on the roof: a tower (default height 3.0 m above its base, `assumed`), four blades (each 1.8 m long and 0.35 m wide, `assumed`) on a hub, rotating at 0.3 revolutions per second. The mannequin is attached high on it. The player climbs a fixed ladder or climbable rungs on the tower, so give the tower a ladder with rungs every 0.28 m. Blades are visual only unless I say otherwise; if they collide with the player, they push gently and never kill. Slow the blades when the player is on the ladder, so it's not a frustrating timing game.

---

## 20. PROPS WITH REAL-WORLD SIZES

Where a prop is a standard object, use the real standard size (marked `standard`, a fourth tag meaning "known from the real world, not from the game"). Where the game's version is probably oversized or exaggerated, the audit flags that the standard size may not match.

```
keycard               85.6 x 53.98 x 0.76 mm (ISO ID-1), scaled up by a "cartoon scale" constant (default 2.0, tagged design)
lumber 2x4            38 x 89 mm actual (real nominal 2x4)
board over basement   19 x 140 mm (a 1x6) or 38 x 140 mm (a 2x6), length as the opening requires
bolt (hex head)       head width 24 mm, length 80 mm, with a washer 40 mm across
crowbar               0.60 m long, 0.02 m round or hex steel, curved claw at one end
lamp (table)          0.45 to 0.70 m tall
lamp (floor)          1.50 to 1.80 m tall
crate                 0.60 x 0.40 x 0.40 m (default), stackable
cardboard box         0.50 x 0.40 x 0.35 m (default)
ladder rung spacing   0.28 to 0.30 m (real standard)
mannequin             defaults 1.75 m for an adult form, 1.0 m for a child form (both assumed)
birthday cake         0.25 m diameter, 0.15 m tall
security camera       0.20 x 0.10 x 0.10 m body on a bracket
laser emitter         0.06 m cube, beam 0.01 m thick
```

Each prop is built from rounded primitives per the main art doctrine, as a function returning a group with a physics body, a mass, and a noise value. The cartoon scale constant lets me enlarge props chunkily without touching the standard sizes; it applies to props only, never to architecture, and the audit reports it.

---

## 21. MATERIALS, COLOR, AND TEXTURES

Reuse the toon material factory, canvas textures, and outline pass from the main project. Specific to this house:

- Colors are `assumed` and chosen from the main palette. Keep a `data/act3/palette.json` mapping surface IDs to palette names, so when I send a color reference, you change one line.
- In survey mode, use a flat, neutral, evenly lit look with a subtle checker on floors, so scale is easy to judge by eye. Walls are light grey, floors mid grey with 1 m checks, openings tinted blue-grey.
- In style mode, apply the full painted look.
- Never put text or numbers into wall textures that could be mistaken for real signage.

---

## 22. LIGHTING INSIDE THE HOUSE

Daylight enters through windows. Compute window light by placing a soft rectangular light (RectAreaLight, or a cheap fake using a spotlight and an additive god-ray card) at each window opening, sized to the opening, and facing inward, with intensity scaled by the opening's area. Interior ambient is warm and low. Lamps are point lights with limited range and no shadows; cap active point lights at 8 by distance, as in the main project. Rooms with boarded windows get a small fraction of the light, and the light that does come through gaps in the boards appears as thin bright bars on the floor. That detail sells the boarded-up look without extra geometry.

The security camera cone is an additive translucent cone, red, 25 percent opacity, with its far end fading to zero. Laser beams are thin emissive cylinders with bloom, a faint shimmer, and a hum that rises as the player gets near.

---

## 23. AUDIO

Procedural Web Audio, same buses as the main project. For this house specifically: floorboard creaks that vary with floor material, a ticking pipe somewhere, wind through the broken window, a distant windmill creak, the train's chuff, the camera servo whir as a camera sweeps, a rising alarm tone when a laser is tripped, a heavy clank when a bolt gives, a squealing crowbar pry, a soft electronic chirp when the keycard is accepted and a harsh buzz when it is refused. Provide a subtitle line for each.

---

## 24. HOOKING UP THE NEIGHBOR (OPTIONAL BUT DESIGNED FOR)

Do not build the full AI again. Expose the hooks it needs:

- **Auto-generated navigation graph.** From the room polygons, the openings, and the stairs, generate waypoints: one at each room center, one in each doorway, and one at the top and bottom of each stair run. Edges connect waypoints that share an opening. Edge cost is the Euclidean distance, doubled for stairs and tripled for ladders. Expose the graph in the debug view. When the data changes, the graph rebuilds.
- **Event bus.** Cameras, lasers, bolts breaking, glass breaking, and doors slamming emit sound and alarm events with a position and a loudness, matching the main project's hearing system.
- **Zones.** Every room is a zone, with a visibility list derived from the openings (a simple portal graph), used both for culling and for the AI's line-of-sight shortcuts.

If the main project's Neighbor module is present in the repo, wire it in behind a flag, off by default, because a freely roaming neighbor makes it harder to take measurements.

---

## 25. THE INTERACTION SYSTEM

Everything the player can touch goes through one system, so that puzzle state is consistent and saveable.

### 25.1 Interactables

Each interactable has an ID, a position, a prompt string, a set of preconditions, and a handler. Preconditions are plain data: `{ "requiresItem": "crowbar" }`, `{ "requiresFlag": "lever_pulled" }`. The handler emits events and changes flags; it never reaches into other objects directly. Examples:

- `basement_bolt_1` through `basement_bolt_N`: requires the crowbar, takes 1.5 s held, emits `bolt_removed`, plays the clank, drops the bolt as a physics prop.
- `basement_boards`: becomes passable only when every bolt flag is set. The boards swing away on their remaining hinge.
- `basement_keycard_lock`: requires the keycard, takes 0.4 s, sets `basement_unlocked`, and emits `door_unlocked`.
- `train_button`, `train_lever`: see section 19.4.
- `mannequin_*`: pick up, carry (two-handed, slows the player to 60 percent), and place on a labeled spot in the birthday room.

### 25.2 State and saving

All puzzle state is a flat object of named flags and item locations, serialized to JSON. Save to `localStorage` inside try/catch, because storage can be blocked. The game must still run if saving fails. Provide a "reset house" button in the pause menu and a URL flag `?reset=1`.

### 25.3 Carrying and dropping

One carried object at a time, held in front of the player with a spring constraint so it swings and bumps walls naturally. Dropping on a ledge too narrow for the object's footprint should not leave it balanced; add a tiny settle nudge. Throwing is allowed for light objects and not for mannequins.

### 25.4 Highlighting

The object under the crosshair within 2.2 m gets a soft outline pulse and a one-line prompt. Do not highlight things that cannot currently be used, other than a greyed-out prompt that states the missing requirement ("Needs a crowbar"). That hint matters more than it looks: it tells a stuck player what to go find.

---

## 26. PERFORMANCE BUDGET

Target 60 frames per second at 1080p on a mid-range laptop with integrated graphics, and 30 on a low-end machine at reduced settings.

- Draw calls: under 350 on Medium. Merge static wall pieces per room by material.
- Triangles: under 1.2 million visible at once.
- Physics bodies awake at once: under 120. Sleep everything not touched for 2 seconds.
- Point lights: 8 maximum, 0 shadow-casting. One directional light for the exterior, with a single shadow map of 2048 on High, 1024 on Medium, off on Low.
- Portal culling: from the zone graph in section 24, render only the rooms visible through open doorways from the current room, plus the rooms the camera frustum can see through windows. Closed doors hide the next room entirely.
- Instancing: sleepers on the train track, balusters, books, crates, bolts.
- Memory: keep canvas textures at 512 pixels, generate each once, share across materials.

Add an in-game performance panel (F3) showing frame time, draw calls, triangles, physics bodies, active lights, and the number of rooms currently rendered. Add a Graphics menu with Low, Medium, High that changes shadows, outline thickness, bloom, render scale, and portal culling aggressiveness.

---

## 27. USER INTERFACE

### 27.1 The measuring-and-audit interface

This project's UI exists mostly for me to check your work, so make it good.

- **Audit panel (F10):** a table with one row per floor and rows beneath for each room. Columns: wall length measured, documented, assumed (in meters and percent), floor area measured, documented, assumed, and the count of conflicts. Totals at the bottom. A bar for the overall measured percentage. Click a room to fly the freecam there and highlight its assumed walls in red.
- **Top 20 assumed:** a ranked list of the assumed dimensions with the biggest effect on the house (largest walls, the ceiling height, the floor-to-floor height, the stair rise). Next to each, the suggested reference shot ("a straight-on photo of the east wall of the hallway").
- **Compare mode:** side panel with a list of saved poses, a slider for overlay opacity, and a button to flip between the real screenshot and the render at the same camera pose.
- **Measure overlay:** crosshair in the center, ruler endpoints drawn as small circles, a line between them with the distance and uncertainty written beside it.

### 27.2 The game UI

Minimal. A center dot that changes to a hand over interactables. A small item bar. An objective line that fades in and out. Pause menu with Resume, Options, Reset House, Quit. Options: graphics preset, volume sliders, mouse sensitivity, invert Y, head bob on or off, subtitles on or off, and a toggle for survey or style mode.

### 27.3 Look and accessibility

Use the main project's chunky rounded UI style for the game menus, and a plain, dense, monospace style for the audit and measure panels, since those are working tools. All colors that carry meaning (green, amber, red for the tags) must also be shown as a text label or a shape, so color is never the only signal. Respect the browser's reduced-motion setting by turning off head bob and camera shake.

---

## 28. DATA GOVERNANCE: KEEPING THE NUMBERS TRUSTWORTHY

### 28.1 sources.json

One entry per documented fact or reference image:

```json
{
  "id": "src_0003",
  "kind": "walkthrough",
  "title": "Hello Neighbor Act 3 Complete Walkthrough",
  "publisher": "GameSkinny",
  "url": "https://www.gameskinny.com/tips/hello-neighbor-act-3-complete-walkthrough/",
  "accessed": "YYYY-MM-DD",
  "claim": "Second-floor gated section is passed by jumping onto a railing, then a lamp.",
  "reliability": "medium",
  "quote": "short exact quote if the source text is available"
}
```

`reliability` is `high` (developer statement or direct measurement), `medium` (a careful walkthrough or wiki), or `low` (a content farm, a forum post, or anything that contradicts another source). Documented dimensions point at a source ID. A claim with only `low` sources is demoted to `assumed`.

### 28.2 Image provenance

For every reference image I give you, store its filename, a SHA-256 hash, the date I gave it to you, and what I said about it (which build, which act, any mods). Do not store or redistribute the images in a public repo. Add `reference/` to `.gitignore` and tell me why: it avoids copyright problems and keeps the repo small. The measurements derived from the images are fine to commit.

### 28.3 Never overwrite silently

When a new measurement changes an existing `measured` value by more than its combined uncertainty, show me the old value, the new value, both images, and ask whether to accept. Never replace a measured value without my say-so. Replacing an `assumed` value with a `measured` one is automatic.

### 28.4 Reproducibility

`npm run audit` prints the full audit as plain text and writes it to `reports/audit-YYYYMMDD.json`, so I can compare reports over time and see the measured percentage rise.

---

## 29. TESTING, EXPANDED

Section 9 lists the required checks. Here's how to make them solid.

- **Property tests.** Generate random valid house specs (random rectangles, random openings that fit) and assert that the builder never crashes, never produces gaps, and always produces the number of wall pieces the spec implies. Use a seeded generator.
- **Golden screenshots.** Take Playwright screenshots of fixed camera poses in survey mode, compare to stored baselines with a pixel tolerance of 1 percent, and fail on larger drift. Survey mode is flat and deterministic, so these tests are stable. Do not golden-test style mode (post-processing makes it noisy); instead assert that it stays within the 4 percent dimension cap by comparing bounding boxes against survey geometry.
- **Round-trip test.** Load the spec, build, export the floor plan to SVG, parse the SVG, and assert that the dimension lines match the spec within 1 mm.
- **Migration test.** Insert a vertex into a room polygon, run the migration helper, and assert every measurement still points at the same physical wall.
- **Conflict test.** Feed two deliberately inconsistent measurements and assert the system flags `conflict` and does not silently pick one.
- **Rescale test.** Change `playerHeight` by 10 percent and assert that every dimension tagged as derived from it changed by 10 percent and nothing else did.
- **Performance test.** Load the full house headless and assert draw calls and triangle counts are under the budget in section 26.

Run all tests on every commit, locally and in CI. Print the summary line at the end: tests passed, tests failed, overall measured percentage.

---

## 30. RISKS, FAILURE MODES, AND WHAT TO DO ABOUT THEM

Handle each of these the way described. Do not improvise.

1. **I give you no reference material.** Build the all-`assumed` house, make the audit say "0 percent measured" in red, and say in every progress report that the house is a plausible stand-in, not a reconstruction.
2. **My screenshots come from a modded build or a different act.** Ask me which build each image is from, record it in the provenance, and exclude anything I say is not the final game's Act 3.
3. **Measurements contradict each other.** Flag `conflict`, show both, and wait for me.
4. **A measurement makes a puzzle impossible.** The jump test fails. Say which measurement is the likely culprit, suggest the most plausible correction, and do not apply it without my say-so.
5. **You can't view an image.** Tell me. Do not describe what you think is in it.
6. **A required fact is unknown and no reference is available.** Tag it `assumed`, record the rule that produced it, and move on. Do not stop the whole project for one number.
7. **The session runs long and loses context.** Keep a file `PROGRESS.md` at the repo root with the current milestone, what's done, what's next, the measured percentage, and any decisions I made. Update it at the end of every milestone. If a new session starts, read `PROGRESS.md`, `data/act3/CHANGELOG.md`, and this prompt before doing anything.
8. **Performance falls under budget.** Reduce, in order: shadow resolution, outline thickness, bloom, render scale, culling distance. Never remove architecture to hit a frame rate, because that corrupts the scale study.
9. **Legal concern.** See section 11. Say it once, then continue.

---

## 31. GLOSSARY

- **Tag:** the provenance label on a dimension: `measured`, `documented`, `assumed`, `standard`, or `design`.
- **Ruler:** a known-size object in an image used to set scale.
- **Plane:** the flat surface (a wall, a floor) that a measurement lies in. Distances are only correct within the ruler's plane.
- **Sigma:** the uncertainty of a measurement, in meters.
- **Survey mode:** the unwarped, exact render.
- **Style mode:** the warped, cartoon render, capped at 4 percent dimension change.
- **Audit:** the report of how much of the house is measured, documented, and assumed.
- **Portal:** an opening (door, window) that connects two zones, used for culling and navigation.
- **Blondel:** the stair comfort rule, 2 risers plus 1 tread, about 0.63 m.
- **Coyote time:** a short grace period after leaving a ledge during which a jump still works.

---

## 32. HOW I WILL FEED YOU MORE MATERIAL LATER

Make this workflow easy, because it's how the house improves:

1. I drop new screenshots into `reference/` (or attach them in chat) and type `ingest`.
2. You list the new images, ask me one question per image if you need a build, act, or room, then run the measure pipeline on any dimension an image can inform.
3. You show me a short diff: which dimensions moved from `assumed` to `measured`, the old and new values, any conflicts, and the new overall percentage.
4. You rebuild, run the tests, update `PROGRESS.md` and the changelog, commit, and push.

Make `npm run ingest` a real command that does steps 2 and 3 as far as it can without me, and prints the diff.

---

## 33. REPOSITORY HYGIENE AND DEPLOYMENT DETAILS

- Branches: work on the branch the session gives you. Merge to `main` only when a milestone passes its tests and I've seen the report. Railway deploys from `main`, so a bad merge breaks the live site; do not merge a failing build.
- Commits: one per milestone at minimum, plus one per ingest. Clear messages.
- `.gitignore`: `node_modules`, `dist`, `reference/`, `reports/` (keep a sample), and any local environment files.
- README: how to run it, the controls, the tag system in four sentences, the legal note from section 11, and a link to the audit screen instructions.
- Railway: the repo is connected and auto-deploys on push to `main`. Ensure the production build serves the WASM physics file with the right content type, serves `data/act3/*.json` as static files, and answers on the port Railway provides. After deploy, load the live URL, press F10, and confirm the audit opens, then report the URL and the live measured percentage.

---

## 34. DEFINITION OF DONE

The project is done for this round when all of these are true, and you've shown evidence for each:

- [ ] Every dimension in `house.json` is tagged, and the build refuses untagged numbers.
- [ ] The audit screen works, and its totals match `npm run audit`.
- [ ] The measure tool works in at least the straight-on and four-corner modes, and I've used it on at least one real screenshot (if I gave you any).
- [ ] The ground floor, second floor, upper floors, roof, train, windmill, basement door, cameras, lasers, and birthday room all exist and can be reached.
- [ ] The railing, lamp, and barrier jump sequence passes the jump test with margins between 5 and 40 cm, or the report says exactly why it can't and what to change.
- [ ] Survey mode and style mode both work, and style mode stays within the 4 percent cap.
- [ ] All automated tests pass, and the summary line is printed.
- [ ] The performance budget is met on Medium.
- [ ] `PROGRESS.md`, the changelog, and the README are current.
- [ ] It's deployed on Railway through GitHub, and I have the live URL.
- [ ] The final report lists the three assumed dimensions that matter most and the exact screenshots that would replace them.

Now start with Milestone 0.
