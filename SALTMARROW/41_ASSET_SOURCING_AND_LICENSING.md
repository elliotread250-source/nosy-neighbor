# SALTMARROW: PART 41, ASSET SOURCING AND LICENSING

A game this size needs thousands of assets: meshes, textures, animations, sounds, music, fonts, icons. You can't make all of them from scratch, and you can't take them from just anywhere. This part sets the sourcing strategy, the license rules, the tracking, and the fallbacks when nothing suitable exists.

The absolute rule: every third-party asset in the project has a recorded source and license in `design/CREDITS.md`, and its license allows use in a commercially distributable game (even though v1 is free, I might sell it later; pick licenses that won't block that). If you can't verify a license, don't use the asset.

---

## 41.1 THE SOURCES, IN ORDER OF PREFERENCE

1. Epic's own free content for Unreal projects: Lyra Starter Game, the Game Animation Sample, Epic's sample projects (City Sample for ideas, Stack O Bot, Cropout, Electric Dreams' PCG examples), the UE5 mannequins, the engine's starter content, and Epic's "free for the month" Fab content that I claim to my library. All usable in Unreal Engine projects under the Unreal Engine EULA / Fab Standard License; record each.

2. Fab content that's free or that I've acquired, under the Fab Standard License (usable in Unreal projects, including commercial ones; check each listing's specific terms, and note that some Fab content is "Personal" licensed only, which isn't enough for distribution; use only "Professional" or standard commercial licenses). Quixel Megascans: their availability and licensing changed when Quixel moved to Fab (in 2024 Megascans were made free through the end of that year, and the licensing for Megascans content claimed in that window allowed continued use). Check what's in my Fab library and what the current terms say for each asset. Don't assume.

3. CC0 and permissive sources: Poly Haven (CC0 HDRIs, textures and models: excellent for the North Atlantic look: rocks, stone walls, wood, metal, ground textures), ambientCG (CC0 PBR materials), Kenney (CC0, mostly stylized; useful for UI and prototyping), OpenGameArt items with CC0 or CC-BY (with attribution), Freesound (only CC0 and CC-BY sounds; avoid CC-BY-NC, which forbids commercial use), the Sonniss GDC bundles (royalty-free for commercial use, with their own license terms: read them; they're generous), Google Fonts (OFL fonts, part 22), Tabler or Lucide icons (MIT/ISC, part 22).

4. MetaHuman (for faces, part 10) under the MetaHuman license (usable in Unreal Engine projects; check the current terms for in-engine MetaHuman Creator).

5. Mixamo (Adobe's free animations and characters): the license allows use in games, including commercial ones, without attribution, but you can't redistribute the raw files standalone. Mixamo animations need retargeting from the Mixamo skeleton to the UE5 mannequin (IK Retargeter). Useful for gestures, emotes, idles and some interactions; their quality is mixed, so pick carefully.

6. Paid assets: never without asking me. Keep `design/ASSET_OPTIONS.md` updated with recommended paid packs (name, link, price, what gap it fills, license) so I can decide when we hit a gap. Likely candidates to list: a modular military weapon pack with separate parts, a weapon animation pack for the UE5 mannequin, a North Atlantic fishing village kit, a ship/ferry interior kit, a weapon sound library.

7. Make it ourselves: in-engine modeling (Modeling Mode), procedural generation (PCG, Geometry Script), Blender (if installed: you can script Blender in headless mode with Python to generate or process meshes, which is a strong option for parametric assets like rails, rings, magazines, crates and buildings), Substance-like texturing via material functions and procedural masks in-engine, procedural audio in MetaSounds (wind, rain, hum, drones, UI clicks), and generated textures (noise, tiling patterns, decals) through code.

## 41.2 WHAT TO SOURCE FROM WHERE (THE PLAN)

| Need | Primary source | Fallback |
|---|---|---|
| Character bodies and skeleton | UE5 mannequin (Manny, Quinn) | none needed |
| Faces | MetaHuman presets | Modular heads from Fab |
| Clothing | Fab free/standard clothing packs fitted to the mannequin; MetaHuman clothing options | Kitbash from simple meshes with good cloth materials; Blender scripted garments (simple jackets, trousers) |
| Hollows | Our own: mannequin body + drowned skin material + salt crystal meshes (procedural) + clothing | Fab zombie packs (if license and style fit) |
| Locomotion animation | Game Animation Sample | Lyra animations |
| Weapon animations | Lyra (pistol, rifle, shotgun basics), Fab free packs | Hand-authored with Control Rig |
| Gestures and emotes | Mixamo, Fab | Hand-authored |
| Weapons | Fab modular weapon packs (free or acquired); kitbash | In-engine modeling and Blender scripting (part 07.8) |
| Attachments | As weapons; many are simple shapes (rails, rings, tubes, grips) that are fast to model or generate | Blender scripts for parametric parts |
| Environment: rocks, cliffs, ground | Poly Haven, Megascans (if licensed), ambientCG | Procedural rock generation (Geometry Script) |
| Environment: buildings | Our modular kit (part 14.13.3), modeled in-engine or in Blender, textured with CC0 materials | Fab village kits (if acquired) |
| Props | Fab, Poly Haven models, Megascans 3D assets | In-engine modeling for simple props (crates, pallets, barrels, boxes, signs) |
| Vehicles (cars, boats) | Fab (free car packs), Poly Haven | Simple in-engine models; cars can be low-detail because they're often wrecked and rusty |
| Foliage | Megascans plants (if licensed), Fab free foliage, PCG with simple cards | Procedural grass cards |
| Textures and materials | Poly Haven, ambientCG, Megascans | Procedural material functions |
| HDRIs and skies | Poly Haven (for the menu and reflections) | UE sky atmosphere |
| VFX textures | Epic's free VFX content, CC0 flipbooks | Generated in Niagara (procedural sprites, SDF shapes) |
| Weapon sounds | Sonniss GDC bundles, other royalty-free libraries | Layered synthesis + processed recordings |
| Foley, ambience, footsteps | Sonniss, Freesound CC0 | Field recordings I might provide |
| Voice (grunts, breathing) | Sonniss, CC0 libraries | Skip spoken voice; use effort sounds only |
| Music | Original (ask me if I want to commission), CC-BY music with clear licenses, royalty-free libraries with game licenses | Fewer, better tracks; procedural drones in MetaSounds for the Surge |
| Fonts | Google Fonts (OFL) | none needed |
| UI icons | Tabler/Lucide (MIT) plus our own | Our own SVGs |

## 41.3 LICENSE TRACKING

`design/CREDITS.md` format, one entry per source pack (not per file):

```
## Poly Haven: rock and ground textures
- Source: https://polyhaven.com/ (asset pages listed below)
- License: CC0 1.0
- Assets: rock_face_03, coast_sand_rocks_02, ... (list)
- Used in: Content/Saltmarrow/Environment/Nature/...
- Attribution: not required (credited anyway in the game credits)
```

Add a `LICENSES/` folder with the full license texts for every license type used (CC0, CC-BY 4.0, OFL, MIT, the Sonniss license, the Fab Standard License reference, the MetaHuman license reference).

In-game credits screen (Settings > Credits, or from the main menu): lists every source with attribution, the fonts with their licenses, the engine and plugins (Unreal Engine, EOS SDK, Oodle where required), and the people (me, friends who playtest, and "built with Claude Code").

Engine and SDK notices: include the notices required by Unreal Engine's EULA (the "Unreal Engine" logo/attribution requirements for distribution, if any apply: check the current EULA), the EOS SDK terms, the upscaler SDKs (DLSS, FSR, XeSS) with their required attributions, and the third-party software notices that UE ships with.

Asset metadata: tag imported third-party assets with metadata (the asset's `AssetUserData` or a naming folder convention: put third-party content under `Content/ThirdParty/<Source>/` until it's adapted, then move adapted copies into our tree with a metadata tag `Source=<id>`). A validator checks that every asset under `ThirdParty` has a CREDITS entry.

## 41.4 STYLE CONSISTENCY

Mixed sources look mixed. Rules for making them consistent:

Re-material everything through our master materials (part 26). Third-party meshes keep their meshes and textures, but the materials are replaced by instances of our masters with their textures plugged in. That gives every asset the wetness, flood line, salt and weathering layers, and a consistent response to light.

Texel density normalization (part 25.6): rescale UVs or texture tiling to match our densities.

Color grading at the asset level: when a texture's palette is off (too saturated, wrong hue), adjust it in the material instance (hue/saturation/value controls in the master) rather than editing the source texture.

Scale: check every imported mesh against the reference mannequin. Many packs are scaled wrong or have the wrong pivot. Fix on import.

Weathering: our decals and material layers add salt, rust and grime to everything, so even a clean asset fits the world after the material swap.

## 41.5 WHAT NOT TO DO

Don't rip assets from other games. Don't use assets from "free model" sites without a clear license. Don't use AI-generated images or music from services whose terms don't grant commercial rights, and be careful with AI-generated content in general: I want to know about any AI-generated asset (record it in CREDITS with the tool and its terms). Don't use real weapon manufacturer logos or trademarks (part 02's fictional brands exist for this). Don't use real copyrighted music, even as a placeholder (placeholders end up shipping). Don't use real people's likenesses.

## 41.6 ASSET SOURCING ACCEPTANCE CRITERIA

Every asset under `Content/ThirdParty/` and every adapted asset with a `Source` tag has a CREDITS entry (validator).

The in-game credits screen lists every CREDITS entry.

No asset in the project uses a non-commercial license (a check over CREDITS for "NC", "Personal", "Non-Commercial").

---

End of part 41. Next: `42_APPENDIX_TAGS_AND_CONFIG.md`.
