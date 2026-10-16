# Nosy Neighbor

A browser-based, first-person stealth-horror-comedy about the man across the street and his locked basement. Every mesh, texture, sound and note of music is generated in code at load time: no downloaded assets. The full design spec lives in `NOSY_NEIGHBOR_PROMPT.md`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm start          # serve dist/ on $PORT (default 3000)
```

URL flags: `?debug=1` debug tools, `?gfx=low|medium|high` graphics preset, `?difficulty=easy|normal|hard`, `?notitle` skip the title screen, `?nointro` skip the intro cutscene.

Debug keys (with `?debug=1`): F3 stats, F4 nav graph and path, F5 vision cone and meter, F6 freeze the neighbor, F7 noclip, F8 every key and tool, F9 dump the learning brain. `window.nn` is the live game.

## Controls

WASD move, Shift sprint, C or Ctrl crouch, Space jump, Q and Z lean, E or left click interact, hold left click to charge a throw, F use the held item (alarm clock, TV remote, flashlight), right click or G drop, 1 to 4 or the wheel to switch slots, Esc pause. Keys can be rebound in Options. Gamepad works.

## What's in it

The street and both houses, Mr. Harold Grimsby built from primitives with expressions, eye tracking and spring motion, a procedural animation system, and an AI with sight (detection meter), hearing (wall attenuation), patrol activities, chase, property-line stare, hide-spot search and the catch. A learning brain that answers repeated behavior with bear traps, security cameras, boarded entries and glue, capped so the house stays beatable, and shows you a short "he learned something" shot after a catch. Inventory, throwing, carrying and stacking, hiding, keys, tools (crowbar, wrench, magnet gun, flashlight) and lures (TV, radio, kettle, toaster, alarm clock).

Act 1 is complete from the dusk intro to the ending, with the washing machine puzzle, the caged key and the final unlock. There is a dream sequence (caught three times in five minutes), a gnome with ideas, and a mail slot you shouldn't look through. Audio is all Web Audio synthesis: spatial SFX with occlusion, formant-synth voice, a sequenced score with sneak, suspicion and chase layers, and ambience. Title screen, pause, options (graphics, audio, controls with rebinding, gameplay, accessibility), subtitles for sounds, colorblind key shapes, and autosave with Continue.

## Tests and visual checks

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

## Deploy

GitHub to Railway: `railway.json` builds the `Dockerfile` (Node build, then `server.js`, a dependency-free static server with brotli/gzip, immutable caching for hashed assets, `application/wasm`, and `/healthz`).
