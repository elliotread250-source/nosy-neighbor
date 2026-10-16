# Act 3 House Study: progress

Spec: `ACT3_HOUSE_PROMPT.md`. Read this file, `data/act3/CHANGELOG.md` and the spec before doing anything in a new session.

## Current state

- Current milestone: see the table below.
- Overall measured: **0 percent**. No reference material has been supplied yet, so the whole house is a plausible stand-in built from the Part III house bible, not a reconstruction.

## Decisions made by the owner

- 2026-10-16: "Keep going through all the milestones without stopping to ask me." Milestone 0's reference request is recorded below and in the milestone report; the build continues all-assumed (spec section 30.1) until material arrives.
- 2026-10-16: "Replace the nosy neighbour on the website with this one." The site root now serves the Act 3 House Study. The original game stays in the repo and is reachable at `/classic.html`.

## Milestone 0: reference material request

Send any of these, most useful first. Drop images into `reference/` (git-ignored, never published) or attach them in chat, then type `ingest`. For each image, tell me the build and act it comes from, and whether it's modded.

1. Screenshots or video frames from the real Act 3 house: each exterior wall straight on, each floor's main hallway, every staircase from the bottom and from the side, the windmill, the train track, the basement door, the birthday room, and any shot with the player standing next to a door or a stair (those give a ruler).
2. Any floor plan, level map or top-down image, fan-made included (tagged `fan-plan`).
3. Any dump of the level geometry. Check its license first: using ripped game files in a published project risks a takedown. I would only read dimensions from it, never ship it.
4. Any measurements anyone has written down.

How to attach: paste or drag images into this chat, or commit them to `reference/` on your machine and push nothing (that folder is ignored). The measure tool (`/tools/measure.html`) also loads images locally in your browser without uploading them.

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 0 | Reference request | Done (no material yet; continuing all-assumed) |
| 1 | Scale foundation | Done: tagged spec, walls, slabs, stairs, audit, ruler, gauge, grid, freecam, F10, F3, test room. Shots in screenshots/act3/m1-*.png |
| 2 | Measure tool | Done: tools/measure.html (straight-on, four-corner homography, loupe, SHA-256 provenance, export), src/act3/Measure.js, measurements.json, npm run ingest / audit, conflict, rescale and migration tests. Tool check on our own render: test door 2.575 ± 0.060 m (true 2.6). No game screenshots yet, so nothing measured. |
| 3 | Ground floor | pending |
| 4 | Second floor and gated section | pending |
| 5 | Upper floors, ladder, train, roof | pending |
| 6 | Security and puzzle items | pending |
| 7 | Exterior shell and style mode | pending |
| 8 | Audit, compare, floor plans, full tests | pending |
| 9 | Deployment | pending |
- 2026-10-16: "Add it to open arcade": Act 3 House Study gets its own card on the Open Arcade hub, linking to nosy-neighbor-production.up.railway.app.
