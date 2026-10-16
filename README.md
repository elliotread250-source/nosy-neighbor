# Act 3 House Study

A scale-accurate, data-driven study of a fan-remembered three-story house, walked at child height in the browser. The house is generated from a tagged spec, so correcting one measurement moves everything attached to it. Every mesh, texture and sound is generated in code. The site root serves the original Nosy Neighbor game; the study is at `/act3/`.

Right now no reference screenshots have been ingested, so the house is 0 percent measured: a plausible stand-in built from proportion rules, not a reconstruction. The audit says so in red until real measurements arrive.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (the game), /act3/ (the study)
npm test           # Vitest: tag checks, geometry, headroom, jump route, track, audit, property and round-trip tests
npm run audit      # print the audit, write reports/audit-YYYYMMDD.json
npm run ingest     # hash new images in reference/, apply data/act3/measurements.json, print the diff (--write to apply)
npm run golden     # golden screenshots (1 percent tolerance) and the draw-call / triangle budget
npm run route      # drive the player through the whole route with simulated keys
npm run puzzle     # the puzzle chain end to end: bolts, keycard, train, mannequins, save
npm run build && npm start   # production build served on $PORT
```

URL flags: `?house=test` the one-room test house, `?reset=1` clear the saved puzzle state, `?golden=1` frozen deterministic render.

## Controls

WASD move, Shift sprint, Space jump, C crouch, E use (hold E for bolts and the keycard), G drop (or the grid when your hands are empty), left click throws a held object, Esc pause menu.

Scale tools: R ruler (click two points), H height gauge (the exact player height, with 10 cm ticks and the eye line), G grid (1 m with 10 cm minor lines), F7 freecam ([ and ] change its speed), V survey or style mode, F10 audit, K compare mode, N the navigation graph, F3 performance panel.

## Phones and tablets

Open the site, turn the phone sideways and tap to start (it goes fullscreen where the browser allows and turns the sound on). Left thumb: a joystick appears wherever you touch, push it all the way forward to sprint. Right thumb: drag to look. Buttons: Use (hold it for bolts and the keycard, a ring shows progress), Jump, Crouch (tap to toggle), Throw (hold to charge, release), Drop, and pause at the top. The pause menu has the tools (ruler, height gauge, grid, audit), touch options (look sensitivity, button size, left-handed layout, gyro aiming, vibration) and performance options (quality, render scale, auto quality, a 30 fps cap). Phones start on Low; the auto-quality governor steps down under 45 fps and back up when there is headroom. Add `?debug=1` for the freecam, stats, compare and nav graph buttons. Keyboard, mouse and gamepad still work the moment you use them. Tests: `scripts/with-server.sh node scripts/act3mobile.mjs` (emulated phones and tablets) and `scripts/with-server.sh node scripts/act3desktop.mjs`.

## The tag system

Every number in `data/act3/*.json` is an object with a value and a tag: measured, measured-rough, documented, documented-weak, fan-plan, standard, design, assumed, assumed-from-standard or conflict. The builder refuses a plain number and names its exact JSON path. Assumed values record the rule in `src/act3/assumptions.js` that produced them, documented ones point at an entry in `data/act3/sources.json`. Measurements come from `tools/measure.html` and upgrade tags automatically, but a value already measured is never replaced by one that disagrees: that becomes a conflict for you to decide.

## The audit screen

Press F10. It lists, per floor and per room, wall length and floor area by measured, documented and assumed, the conflicts, a bar for the overall measured share, and the 20 assumed dimensions whose replacement would help most, each with the screenshot that would replace it. Click a room to fly there with its assumed walls outlined in red. The same report prints with `npm run audit`. Floor plans with dimension lines, colored by tag: `/tools/floorplan.html`.

## Feeding it real measurements

Drop screenshots into `reference/` (git-ignored, so nothing copyrighted is ever committed), measure them in `/tools/measure.html` (straight-on with a ruler, or four corners of a known rectangle), merge the export into `data/act3/measurements.json`, then `npm run ingest -- --write`. `PROGRESS.md` and `data/act3/CHANGELOG.md` keep the history.

## Legal note

This is a fan reconstruction of another studio's level layout. Everything here is generated from scratch in code, with no ripped models, textures, sounds or music, and the original game's name and characters are not used; the neighbor is Mr. Grimsby from the main project. A faithful copy of a commercial game's level layout is still a derivative work even when every asset is original: a private study is low risk, a public release is higher risk.

## The classic game (site root)

A browser-based, first-person stealth-horror-comedy about the man across the street and his locked basement. Every mesh, texture, sound and note of music is generated in code at load time: no downloaded assets. The full design spec lives in `NOSY_NEIGHBOR_PROMPT.md`.

### Run it

```bash
npm install
npm run dev        # http://localhost:5173/
npm run build      # production build into dist/
npm start          # serve dist/ on $PORT (default 3000)
```

URL flags: `?debug=1` debug tools, `?gfx=low|medium|high` graphics preset, `?difficulty=easy|normal|hard`, `?notitle` skip the title screen, `?nointro` skip the intro cutscene.

Debug keys (with `?debug=1`): F3 stats, F4 nav graph and path, F5 vision cone and meter, F6 freeze the neighbor, F7 noclip, F8 every key and tool, F9 dump the learning brain. `window.nn` is the live game.

### Controls

WASD move, Shift sprint, C or Ctrl crouch, Space jump, Q and Z lean, E or left click interact, hold left click to charge a throw, F use the held item (alarm clock, TV remote, flashlight), right click or G drop, 1 to 4 or the wheel to switch slots, Esc pause. Keys can be rebound in Options. Gamepad works.

### What's in it

The street and both houses, Mr. Harold Grimsby built from primitives with expressions, eye tracking and spring motion, a procedural animation system, and an AI with sight (detection meter), hearing (wall attenuation), patrol activities, chase, property-line stare, hide-spot search and the catch. A learning brain that answers repeated behavior with bear traps, security cameras, boarded entries and glue, capped so the house stays beatable, and shows you a short "he learned something" shot after a catch. Inventory, throwing, carrying and stacking, hiding, keys, tools (crowbar, wrench, magnet gun, flashlight) and lures (TV, radio, kettle, toaster, alarm clock).

Act 1 is complete from the dusk intro to the ending, with the washing machine puzzle, the caged key and the final unlock. There is a dream sequence (caught three times in five minutes), a gnome with ideas, and a mail slot you shouldn't look through. Audio is all Web Audio synthesis: spatial SFX with occlusion, formant-synth voice, a sequenced score with sneak, suspicion and chase layers, and ambience. Title screen, pause, options (graphics, audio, controls with rebinding, gameplay, accessibility), subtitles for sounds, colorblind key shapes, and autosave with Continue.

### Tests and visual checks

Headless Chromium scripts, run with a dev server up (`scripts/with-server.sh` starts one for the duration of a command):

```bash
scripts/with-server.sh node scripts/act1test.mjs      # the whole Act 1 chain, intro to ending
scripts/with-server.sh node scripts/gameplaytest.mjs  # pickups, throwing, glass, hiding, lures, tools
scripts/with-server.sh node scripts/braintest.mjs     # traps, cameras, boards, glue, lure fatigue
scripts/with-server.sh node scripts/aitest.mjs        # patrol, stairs, chase, stare, catch
scripts/with-server.sh node scripts/menutest.mjs      # title, options, pause, save and continue
scripts/with-server.sh node scripts/audiotest.mjs     # every sound produces signal
scripts/with-server.sh node scripts/hudshot.mjs       # in-play screenshots into screenshots/
scripts/with-server.sh node scripts/perf.mjs          # draw calls and triangles per preset
```

### Deploy

GitHub to Railway: `railway.json` builds the `Dockerfile` (Node build, then `server.js`, a dependency-free static server with brotli/gzip, immutable caching for hashed assets, `application/wasm`, and `/healthz`).
