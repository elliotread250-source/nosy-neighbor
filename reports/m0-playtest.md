# Milestone 0 playtest: the first minutes of Act 1

Build: `v2` branch, production build (`npm run build`, served by `server.js`), `?debug=1&gfx=low`, headless Chromium on SwiftShader at 640x360. Played on 2026-10-16.

Two scripts drive the game with real key presses (W, Space, C, E) and step game time with `nn.simulate()`, so results don't depend on the software renderer's frame rate:

- `node scripts/firstminutes.mjs` walks from the bedroom, out the front door, across the street, through the gate and up to the neighbor's front window, then into the hall. Shots `00` to `24`, log in `reports/firstminutes.log`.
- `node scripts/m0checks.mjs` answers the two open questions: which props vanish on their own, and whether crouching gets the player through the front window. Shots `25` to `33`, log in `reports/m0checks.log`.

Screenshots live in [`reports/shots/m0/`](shots/m0/). The F3 panel in the top-left corner of every shot is stale (bug 9), so trust the coordinates in this log, not the panel.

## The two open checks

### Which props vanish on their own

Only one: the snow globe on the neighbor's living-room mantel. It shatters while the world loads, before the player has even clicked Play. At the title screen there are already 7 shards at about (-7.9, 2.2, -17.7) and no snow globe in the physics list. The shards expire about 10 s later. Nothing else vanishes: after the intro, 30 s of game time with the player standing in their own bedroom ends with all 78 dynamic bodies still there and none below the floor.

Two props do creep on their own in that idle window, though. See bug 6.

### Does crouching get through the broken window

It depends on the glass, and the glass is the real bug. The window at x -3.5 is meant to start broken (V2 prompt, neighbor's house front wall: "the broken window, the intended way in"). In the build it starts intact, and the prompt on it reads "Shut tight (break it?)". With the glass intact, nothing gets through: walking, jumping, crouching on the flower box, crouch-jumping, and crouching first all end back on the porch.

With the glass broken by script (`breakGlass('w-living2')`), crouching works:

| Attempt | Glass intact | Glass broken |
|---|---|---|
| Walk in standing | stopped at the wall | stopped at the wall |
| Walk and jump | lands on the flower box (feet y 1.37), stuck | lands on the flower box (feet y 1.40), stuck |
| Jump onto the box, hold C, keep walking | slides back to the porch | gets inside, ends at (-3.5, 0.62, -17.14) |
| Jump, press C in the air, keep walking | back on the porch | gets inside (reached z -16.77), then the neighbor caught the player |
| Hold C, then try to jump | can't jump while crouched | not tried |

Standing can't fit by design: the opening is 1.6 m tall (sill y 1.5, top y 3.1) and the player is 1.75 m. So once bug 1 is fixed, the player needs to know to crouch on the flower box. Nothing in the game tells them that.

## Bugs

### 1. The front window that's meant to be broken starts intact

Severity: high. It's the intended easy way into the neighbor's house.

Repro: start a new game, cross the street, go through the picket gate, and walk up the porch to the window left of the front door (x -3.5). The pane is whole and the prompt says "Shut tight (break it?)". `nn.world.windows.get('w-living2').broken` is `false` after the intro.

Expected: smashed glass with jagged triangles in the corners, one shutter hanging, shards on the porch and inside sill, per the V2 prompt.

Screenshots: `14-porch-in-front-of-the-broken-window.png`, `15-at-the-broken-window-sill.png`, `26-window-stuck-on-flower-box-after-jump.png`.

### 2. Getting through the window needs a crouch the game never hints at

Severity: medium. Only matters once bug 1 is fixed.

Repro: break the glass (`nn.world.windows.breakGlass('w-living2')` in the console, or throw something heavy at it). Walk into the window and jump. You land on the flower box at feet y 1.37 to 1.40 and stop, because the 1.6 m opening is shorter than the 1.75 m player. Hold C while standing on the box and keep walking: you drop through into the living room.

Expected: either a prompt ("Crouch to climb through") or a short climb-through when the player pushes into the opening.

Screenshots: `30-broken-window-jump-stops-on-flower-box.png`, `31-broken-window-crouched-on-flower-box.png`, `32-broken-window-after-crouch-attempt.png` (inside, crouched, by the sofa).

### 3. The snow globe on the mantel shatters on load

Severity: medium. The shatter also emits a noise event the neighbor can hear, on every load, and the item is gone before the player can use it.

Repro: load the game with `?debug=1`. At the title screen run `nn.physics.dynamics.filter(e => e.data?.item === 'snowGlobe').length`. It returns 0, and there are 7 bodies with `item: 'shard'` around (-7.9, 2.2, -17.7).

Cause (from reading the code, not yet tested): `GroundFloor.js` puts the snow globe at (-7.6, -17.65) on the mantel. The fireplace sits at (-7.55, -17.0) rotated 90 degrees, and its chimney (`Decor.js`, 1.3 by 2.2 by 0.45 m, centered just behind the mantel) covers x -7.83 to -7.38 and z -17.65 to -16.35. The globe spawns half inside the chimney, the solver shoves it out hard enough to cross the 260 shatter threshold, and `Impacts.shatter()` breaks it. The toy train at (-7.6, -16.6) spawns inside the chimney too, but it doesn't break. Moving both to x of about -7.28 (the clear strip at the front of the mantel) should fix it.

Screenshot: `25-mantel-snow-globe-already-gone-toy-train-still-there.png`.

### 4. Can't step onto the neighbor's porch away from the steps, and a jump perches you too high

Severity: medium.

Repro: from the front lawn, walk straight north at x -3.5 toward the porch (the porch edge is at z -11.2, deck at y 0.6). You stop at z -10.88. Jump and you land with your feet at y 1.5, about 0.9 m above the deck, on the porch's front edge.

Expected: either the edge is a step you can walk up, or a jump lands you on the deck at y 0.6.

Screenshot: `14-porch-in-front-of-the-broken-window.png` (taken right after the jump).

### 5. The newel post blocks the walk from the living room into the hall

Severity: medium.

Repro: inside the neighbor's house, go from the living-room door at (-1.4, -16.3) toward the front hall at (0.0, -17.5). You stop at (-0.26, -16.89), caught on the stair's newel post. Pressing E does nothing; you have to jump past it (feet reach y 1.79, a normal jump from the 0.62 floor) or walk around. The earlier session saw this jump launch the player about 1.2 m up; in this run it looked like an ordinary jump, so that part isn't confirmed.

Screenshot: `19-front-hallway.png` (mid-jump next to the stair).

### 6. Loose props creep across the floor with nobody touching them

Severity: low.

Repro: start a new game, finish the intro, stand still in your own bedroom for 30 s of game time, then compare positions across the street. In two runs: a can in the kitchen rolled from z -24.85 to -23.62 (1.2 m), a mug in the dining room slid from x 7.27 to 5.37 (1.9 m), and a dining chair moved 0.77 m.

Screenshot: none. These are under 2 m and indoors, out of frame for every shot. The numbers are in `reports/m0checks.log`.

### 7. The house interior looks washed out to white through the front window

Severity: low.

Repro: stand on the porch in front of the x -3.5 window and look in. The living room renders almost white with faint outlines. From inside, the same room has normal colors.

Screenshots: `15-at-the-broken-window-sill.png` (from outside), `32-broken-window-after-crouch-attempt.png` (same room from inside).

### 8. Power lines render as dashes

Severity: low.

Repro: stand in the middle of the road and look east along the street. The overhead wires break into dashed segments instead of continuous lines.

Screenshot: `10-middle-of-the-road.png`.

### 9. The F3 debug panel shows stale position and state

Severity: low (debug only), but it makes every screenshot misleading.

Repro: with `?debug=1`, teleport or move the player and take a screenshot. The panel lags behind: shot 14 shows `pos 1.4 1.8 -9.8` while the player is at (-3.5, 1.5, -11.25), and shot 25 shows `NOCLIP air` at `pos 2.4 3.1 3.5` while the camera is at (-5.6, 2.2, -17.2) in the neighbor's living room.

Screenshots: `14-porch-in-front-of-the-broken-window.png`, `25-mantel-snow-globe-already-gone-toy-train-still-there.png`.

### 10. Low preset is far over its draw-call and triangle budget

Severity: medium for phones.

Repro: load with `?gfx=low&debug=1` and walk up to the neighbor's front window. The panel reads about 930 draw calls and 1.78M triangles. The Low budget is 200 calls and 350k triangles. Even the hall, the cheapest view here, sits around 300 calls and 1M triangles.

Screenshots: `15-at-the-broken-window-sill.png`, `21-hall-look-0.png`.

## Not reproduced in this pass

The earlier session also reported a blocked path in the player's own living room near (-1.2, 18.9) and an empty white label pill by the stair. Neither showed up in this run: the walk from the bedroom to the front door went through cleanly (shots `03` to `07`), and no label pill appears in the hall shots. Worth rechecking on a GPU, since both could depend on timing.

The bare walls and missing basement-door planks from the earlier notes aren't bugs as far as the shots go: the hall has striped wallpaper (`23-hall-look-2.png`), and the basement door shows its locks, chain and padlock (`21-hall-look-0.png`).
