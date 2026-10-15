# ACT 3 HOUSE: SCALE-ACCURATE RECONSTRUCTION PROMPT FOR CLAUDE CODE

Paste this whole document into Claude Code as one message, in a session on the `nosy-neighbor` repo. Read all of it before you write any code. Then do Milestone 0 first. Do not skip it.

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

Now start with Milestone 0.
