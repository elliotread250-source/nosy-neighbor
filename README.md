# Nosy Neighbor

A browser-based, first-person stealth-horror-comedy about the man across the street and his locked basement. Everything (meshes, textures, sound) is generated in code. The full design spec lives in `NOSY_NEIGHBOR_PROMPT.md`.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
```

Add `?debug=1` for debug tools (F3 stats, F7 noclip). `?gfx=low|medium|high` picks a graphics preset.

## Visual checks

With the dev server running:

```bash
npm run shots                    # fixed-camera screenshots into screenshots/
node scripts/playtest.mjs        # headless controller smoke test
```

## Status

Milestone 1 (foundations) is done: Vite + Three.js r184 + Rapier, fixed-step physics with interpolation, pointer-lock input with gamepad, `src/config.js` for every tunable, `src/art/Palette.js` for every color, the toon material (soft-banded gradient map, tinted shadows, rim light, specular blob, ambient floor), rounded-box and chamfered-cylinder geometry, the warp toolkit, procedural canvas textures, gradient sky with sun and clouds, and a first-person controller with walk, sprint and stamina, crouch, jump, lean, head bob and cartoon hands. The current scene is a style-test yard.
