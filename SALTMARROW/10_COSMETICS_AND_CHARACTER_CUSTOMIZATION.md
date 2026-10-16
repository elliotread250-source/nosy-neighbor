# SALTMARROW: PART 10, COSMETICS AND CHARACTER CUSTOMIZATION

Cosmetics do two jobs. They give players something to earn that isn't power, which keeps the meta loop going after the gunsmith is fully explored. And they make your squad look like your squad, which matters when you're sending this to friends who'll screenshot it. Everything here is account-level and never lost on death. Nothing here is sold for real money in v1.

There's one rule above everything else: cosmetics can never compromise readability. A skin that makes a player harder to see than the default kit, a weapon finish that hides the muzzle flash, or a character outfit that changes the hitbox silhouette is a bug. Part 10.9 has the readability rules.

---

## 10.1 WHAT CAN BE CUSTOMIZED

Character: body type, face, skin tone, hair, facial hair, eye color, scars and tattoos, voice. Clothing: headwear (cosmetic, separate from helmets), upper body base layer, outer jacket, gloves, trousers, boots. Each with color variants.

Gear appearance: cosmetic overrides for armor rigs, backpacks and helmets (these are items, so cosmetic overrides are "covers" or "paint" on top of the item's base appearance, not separate items).

Weapons: finish (the skin), wear level override, charm, engraving (on supported weapons), reticle color (for optics that support it), tracer color (only for your own perspective, part 10.9).

Emotes and gestures: a wheel of 8 slots.

Profile: callsign (name), title (earned), banner (a card shown in the squad lobby and on the kill screen), emblem.

Halcyon cabin: the player's cabin on deck 5 can be decorated (posters, a rug, a lamp, trophies from contracts). Tier 3.

## 10.2 THE CHARACTER CREATOR

The character creator appears on first launch after the callsign prompt, with a "Randomize" button and a "Skip" button (skip picks a random preset). It's also reachable from the Halcyon menu under SALVAGER at any time, for free.

### 10.2.1 Base bodies

Two body types, A and B, built on the UE5 Manny and Quinn proportions (so animations retarget cleanly, part 29). Both share the same skeleton and the same hitboxes (body type B's physics asset is identical to A's in hitbox volumes; the mesh is different, the gameplay shape isn't). Pronoun choice doesn't exist in the game because nothing in the game refers to the player with pronouns; Sparks and the traders call the player "salvager", "crew" or their callsign.

### 10.2.2 Faces and heads

Use MetaHuman for faces if the installed engine has MetaHuman Creator available inside Unreal (since UE 5.6, MetaHuman Creator runs in-editor, and MetaHumans can be used in any UE project). Recommendation: author 16 MetaHuman head presets (8 per body type, varied age, ethnicity and features) in the editor, export them at a mid LOD for game use, and use them as the player's face options. Don't use the full MetaHuman real-time grooms for hair; they're too heavy for 12 players plus 60 AI. Use card-based hair LODs (MetaHuman's lower LOD hair cards) or the Groom-to-cards pipeline.

Per head preset, customizable: skin tone (12 swatches, driven by the skin material's melanin/redness parameters), eye color (10 swatches), brow shape (4), and a "weathering" slider (adds sun damage, windburn redness and fine lines, because these are people who live on the North Atlantic).

If MetaHuman isn't usable for any reason (license, performance, engine version), fall back to a modular head kit: a few base heads with morph targets for broad features. Record the decision in `DECISIONS.md`.

Performance note: the player's own face is rarely seen (third person from behind, first person in ADS). Faces matter in the lobby, the gunsmith-adjacent cabin scene, the death cam and the extraction summary. Use aggressive LODs: beyond 8 m, other players' faces drop to the lowest LOD.

### 10.2.3 Hair and facial hair

Hair: 20 styles (shaved, cropped, buzz, side part, long tied back, braids, bun, curly short, curly long, mohawk, undercut, mullet (it's a fishing town), dreadlocks, cornrows, bald, receding, beanie-flattened, wind-blown, wet-slicked, ponytail). Each style works under headwear: every style has a "hat" variant (compressed) automatically used when headwear or a helmet is equipped. 16 hair colors including greys and a few unnatural dye colors (faded blue, faded pink, bleached).

Facial hair: 12 styles (clean, stubble, heavy stubble, full beard, short boxed beard, long beard, goatee, mustache, mutton chops, chin strap, fisherman's beard (neckbeard with clean upper lip, very on-theme), braided beard). Colors match hair or are separate.

### 10.2.4 Scars, tattoos and marks

Scars (8 options, face and neck), tattoos (12 options: anchors, swallows, compass roses, a ship, a gull, knots, a heart with a name banner (the player can type 8 characters), tally marks, text on knuckles (two 4-letter words, typed, filtered for slurs), a sea serpent on the neck, a lighthouse, the Halcyon's council stamp) for arms, hands and neck, with positions. Face paint (6 options, earned: camouflage stripes, salt-white streaks (a "Vigil" contract reward), soot, war paint).

All of these are decals or mask textures on the skin material (a texture array of tattoos with UV positions), not geometry.

### 10.2.5 Voice

4 voice sets per body type (8 total), each with a full set of character vocalizations: pain grunts, exertion (mantle, jump, sprint breathing), healing, reload callouts (optional, setting: "Character callouts" on/off), spotted-enemy callouts when pinging, downed, revived, drowning, coughing in smoke, shivering. Voice sets vary in pitch and accent (island Scots, Irish, Norwegian-English, London, Newfoundland, Polish-English, Faroese-English, generic North American).

Since we don't have voice actors, use a text-to-speech pipeline for placeholders only (and label them WIP), and plan for real recordings later. Grunts and breathing can be sourced from royalty-free libraries (check licenses, record in CREDITS.md). Don't ship robotic TTS for vocalizations; if there's no good source, use breathing and effort sounds only, which are easy to source, and skip spoken callouts.

## 10.3 CLOTHING

### 10.3.1 The slot model

Clothing is modular skeletal meshes on the character, using leader pose (`SetLeaderPoseComponent`) to follow the body. Slots: Head (cosmetic headwear: beanie, flat cap, bucket hat, sou'wester, balaclava, bandana, ear muffs, knit cap with pom, hood up), Upper Base (the shirt/jumper visible at the neck and cuffs), Outer (jacket or coat), Gloves, Lower (trousers), Feet (boots). Each slot has a "body mask" that hides the body mesh sections underneath it to avoid z-fighting and save pixels.

Gameplay gear (armor rig, backpack, helmet) sits on top of clothing and has its own meshes (part 11). Clothing must be authored to sit underneath any rig: rig meshes are the outer layer, and the outer jacket deforms with a slight shrink under the rig area (a morph target "under rig" or a separate mesh variant). Don't skip this; jackets clipping through plate carriers is the most common visual bug in the genre.

When a helmet is equipped, cosmetic headwear is hidden unless it's flagged as "fits under helmet" (balaclavas, bandanas, thin beanies). Hood-up jackets automatically switch to hood-down with a helmet.

### 10.3.2 The clothing catalog (v1)

Every item has 3 to 6 color variants. Items are named in-fiction. The visual design language: North Atlantic workwear, fishing gear, surplus military, 90s outdoor brands, and Halcyon salvager kit (repaired, patched, mismatched).

Headwear (14): Rib-knit Watch Cap, Fisherman's Beanie (rolled), Waxed Flat Cap, Sou'wester (yellow oilskin rain hat), Bucket Hat, Balaclava (wool), Shemagh (wrapped), Bandana, Fleece Ear-Flap Hat, Pom Beanie (striped, very knitted), Ferry Crew Cap (Halcyon issue), Woolly Hat with Lifeboat Badge, Bare Head, Diving Hood (neoprene, Night raid reward).

Upper base (12): Gansey (traditional fisherman's knit jumper, in navy, cream, charcoal, oxblood, moss, and a rare Saltmarrow pattern), Thermal Henley, Flannel Shirt (check patterns), Rollneck, Rugby Shirt (the island's rugby club colors, green and white), Halcyon Crew T-Shirt, Fleece Pullover, Hoodie, Surplus Wool Shirt, Merino Base Layer, Hi-Vis Vest over a shirt, Turtleneck.

Outer (18): Oilskin Coat (long, yellow, the iconic fisherman look), Waxed Jacket (olive, brown), Fisherman's Smock, Peacoat, Surplus Field Jacket (M65-style), Parka (fur-trimmed hood), Lifeboat Crew Jacket (orange and navy with reflective tape; contract reward), Puffer Jacket, Fleece Jacket, Softshell, Wool Overcoat, Cannery Apron over a jumper (rubber, stained), Denim Chore Coat, Leather Flight Jacket (from the airfield; rare), Rain Poncho, Halcyon Salvager Jacket (patched, with council patches; the starter jacket), Warden Smock (looted from Wardens, white chevron; achievement reward), No Jacket.

Gloves (8): Fingerless Wool, Rubber Fishing Gloves (orange), Leather Work Gloves, Tactical Gloves, Neoprene Gloves, Mittens with Flip Tops, Bare Hands, Taped Knuckles.

Lower (12): Bib-and-Brace Waterproofs (yellow, orange, green), Cargo Trousers, Corduroy Trousers, Wool Trousers, Jeans, Combat Trousers (several camo patterns: woodland, a fictional "Saltmarrow" grey-blue coastal camo, and DPM-style), Tracksuit Bottoms, Waders (chest waders; cosmetic, and yes, they look great when wading).

Feet (10): Wellington Boots (green, black, yellow), Steel-Toe Work Boots, Hiking Boots, Combat Boots, Deck Shoes, Trainers, Rigger Boots, Neoprene Dive Boots, Hobnail Boots (old style), Barefoot (unlockable as a joke achievement: "Extract with nothing on your feet").

### 10.3.3 Weathering and dynamic appearance

Clothing materials react to the world (part 26): wetness (darkening and specular increase when soaked, with drips on edges), salt crust (white crystalline buildup on lower legs after wading in Surge water, which fades over 10 minutes), mud (lower legs and knees after crawling or wading in mud), blood (from injuries, on the injured zone's clothing; decal-based). There's no snow in v1; the Tier 3 "Winter" event adds frost on clothing in Night raids.

These are material parameters per clothing piece driven by gameplay state (wetness from water depth history, salt from Surge water exposure, mud from surface type), replicated as a few bytes per character so other players see you soaked and salted. This is the kind of thing that makes a game feel alive. Build it.

## 10.4 WEAPON FINISHES (SKINS)

### 10.4.1 How weapon skins work

A weapon skin is a material layer applied to every part of the weapon that's flagged as "skinnable" (receivers, handguards, stocks, magazines, suppressors and most attachments; not glass, not lasers, not optics' lenses, not bolts). The master weapon material (part 26) has a "finish layer" that takes: a base color or pattern texture (projected triplanar in object space, so it works across parts without UV matching), roughness, metallic, a pattern scale, and a wear mask behavior (how the finish wears off at edges to reveal the base material underneath).

Skins apply per weapon (the whole weapon) or per part (advanced mode: paint the handguard one color and the stock another). Per-part application is stored as the skin index in each part node (part 08's `CosmeticSkinIndex`).

Skins are account unlocks. A looted weapon reverts to default finishes for parts whose skin index refers to the dead player's unlocks (the backend handles this on extraction by resetting skin indices to 0 for items moving between accounts).

### 10.4.2 Finish categories

Solid paints (24 colors): flat dark earth, olive drab, ranger green, wolf grey, black, sniper grey, coyote, desert tan, navy, burnt bronze (cerakote style), white, battleship grey, plum, oxblood, burnt orange, safety orange (it's a joke and it's on-theme: fishing gear), and more. Earned easily (account level rewards).

Two-tone and patterns (16): coastal camo (grey-blue), woodland, tiger stripe, brushstroke, kelp camo (the game's signature, green-brown ribbons), rust-and-salt, tartan (yes, a tartan wrap), net (fishing net pattern over a base color), driftwood (wood grain over everything), shark-skin, digital, chevron, splinter, rope, oilskin yellow with black stripes, flag-free "hazard".

Material finishes (10): blued steel, parkerized, polished nickel, stainless, case-hardened, brass, raw aluminum, carbon fiber wrap, anodized red, anodized blue. These change the metallic and roughness properties, so they look physical.

Special finishes (12, earned from contracts, bosses, achievements and events): Salt-Crusted (crystalline white texture with a faint glow in cracks; from the Vigil contract line), Ferryman (black with rotted rope and verdigris; boss reward), Lantern (deep blue with a subtle emissive "pulse" line pattern; the LANTERN contract finale), Kittiwake (gull-white and grey, feather pattern), Lighthouse (red and white bands), Drowned (barnacles and kelp growing on the gun: a vertex-painted displacement and decal set; very cool, from surviving 50 Surges outdoors), Halcyon Brass (polished brass and green enamel; account level 60), Engraver's Masterwork (silver with scrollwork; Tomasz contract finale), Burnt (fire-scorched; kill 100 enemies with incendiary ammo), Rust Bucket (heavy rust; extract 50 times with a weapon under 30% durability), Whiteout (arctic white; a winter event), Old Mariner's Varnish (aged wood and brass; Old Mariner kills).

Rule: special finishes that have emissive elements keep emissive below a brightness threshold (part 10.9), so they're never a beacon at night.

### 10.4.3 Wear levels

Every weapon has a natural wear look driven by its durability (part 05): high durability is clean, low durability shows edge wear, scratches and rust. Players can override the visual wear with a cosmetic wear slider (Factory New, Field Used, Battle Worn, Salvaged) without changing the durability. The override is cosmetic only and visible to others. The default is "Natural" (follows durability).

### 10.4.4 Engravings

Weapons with an Engraving slot (Selkie, Coach, Tern, Harbormaster, Rook, Fathom bolt, Skua receiver) take an engraving: a pattern (scrollwork, game scene, nautical, Celtic knotwork, rope, anchor, lettering) plus optional custom text (up to 16 characters, filtered) rendered on a banner in the engraving. Engravings are decals with a normal map and a metallic/roughness change (gold or silver inlay options). This is a high-end flex, earned from the Armorer's contract line.

### 10.4.5 Reticle colors

Optics with illuminated reticles allow color choice: red, green, amber, white, cyan, magenta. Unlocked per optic family by using it (100 kills with a Lumen optic unlocks Lumen reticle colors). Holographic sights allow alternative reticle shapes (cosmetic): circle-dot, chevron, triangle, crosshair, an anchor (a Halcyon reward).

## 10.5 CHARMS

Charms hang from the weapon's charm socket. 60 in v1. A sample to set the tone (write the full list in data, in this style):

A Gull Feather, a Brass Fishing Hook, a Cork Float, a Miniature Lighthouse, a Sea Glass Pendant (green, blue, brown variants), a Rusted Key, a Knotted Rope Monkey's Fist, a Little Wooden Puffin, a Haldane's Kipper Tin (tiny), a Saltmarrow Distillery Cork, a Lucky Rabbit's Foot (dyed blue), a Dog Tag (with your callsign), a Halcyon Council Badge, a Bottle Cap (Tide Cola), a Kittiwake Lager Ring Pull, a Photo in a Locket (a random tiny photo from a set of 12), a Mini Life Ring, a Compass, a Bell (makes a tiny jingle when you sprint; client-only sound, not audible to enemies, because that would be a gameplay disadvantage), a Marrow Salt Crystal (glows faintly; Vigil reward), a LANTERN Keycard (LANTERN reward), a Warden Chevron Patch, a Hollow's Tooth (from killing 500 Hollows; slightly gross), a Ferryman's Coin (boss), a Quiz Night Pencil, a Rubber Duck (yellow; the "drowned 10 times" achievement), a Gold Tooth, a Tiny Anchor, a Seal Pup Plush, a Selkie Skin Scrap.

Charm physics: a 2-segment chain with a pendulum, simulated with a simple spring-damper on the client. Not replicated per frame; only the charm ID replicates. Charms must never be large enough to obscure the sight picture in ADS: max charm bounding box 6 cm, and the charm socket is always placed low and rear on the weapon.

## 10.6 EMOTES AND GESTURES

8 emote slots on a wheel (hold the emote key, default Z). Emotes play in third person (the camera pulls out to show your character). They can't be used while ADS, sprinting or in combat (after firing, for 5 seconds).

Gestures (usable any time, short, upper-body only, playable while moving): wave, point, thumbs up, thumbs down, "follow me" arm sweep, "stop" palm, "quiet" finger to lips, "come here" beckon, shrug, salute, a "count" gesture (1 to 3 fingers, for callouts).

Full emotes (stationary): sit on the ground, sit on an edge (auto-detects ledges), lean on a wall, a sea shanty dance (badly), a jig, light a cigarette (with smoke VFX; it's a fishing town), drink from a hip flask, check your watch, stretch, shiver theatrically, a "rest in peace" (hat off, head bow; plays at the Wall of the Lost in the Halcyon bar, and on a dead player's body), sharpen the knife, a "ta-da" for showing off loot (holds the last looted item up), a "fishing" emote (cast an imaginary line).

Emotes earned through levels and contracts. Gestures mostly unlocked from the start (communication is a game feature, not a reward).

## 10.7 PROFILE COSMETICS

Callsign: up to 16 characters, letters, numbers, underscore, hyphen. Unique per account but not globally unique (we append a 4-digit discriminator shown in the friends list: Gull#4471). Changeable once per 30 days, free.

Titles: earned text shown under your callsign: "Fresh Off the Boat" (default), "Salvager", "Tidewalker", "Stormchaser", "Boatman", "Drowned Twice", "Gunsmith", "Hollow Hunter", "Warden Bane", "The Ferryman's Fare", "Lantern Bearer", "Survivor", "Veteran of the Surge", "Captain's Favorite", "Tomasz Approves", "Nils Owes You Money", "Mother's Child". 50 in total, from contracts, achievements and levels.

Banners: a 3:1 card with an illustrated background (40 designs: the lighthouse at night, the Halcyon at dawn, a storm wall, a gun on a bench, a Hollow on the shore, etc.), your emblem, callsign and title. Shown in squad lobbies, on the kill screen when you kill someone ("Killed by"), and on the extraction screen.

Emblems: 60 icon designs in the game's visual language (a gull, an anchor, a knot, a skull with a sou'wester, a fish skeleton, a compass, a lighthouse, crossed oars, a salt crystal, etc.) with a color.

## 10.8 HOW COSMETICS ARE EARNED

| Source | Examples |
|---|---|
| Account level (1 to 60) | Every level gives one cosmetic: paints, clothing variants, emblems, banners, emotes. Levels 10, 20, 30, 40, 50, 60 give a special item. |
| Contracts | Each trader contract line ends with a unique cosmetic (finish, clothing piece, charm, title). Many mid-line contracts give smaller cosmetics. |
| Achievements | 80 achievements (part 38), each with a cosmetic. |
| Weapon mastery | Each weapon has mastery levels from kills with it (25, 100, 250, 500, 1,000): unlocking that weapon's specific charms, reticles, and a mastery finish. |
| Bosses | Each boss has a guaranteed first-kill cosmetic and a rare drop cosmetic. |
| Events | Seasonal events (part 38) with themed cosmetics. |
| Halcyon store | Some cosmetics can be bought with Scrip from a cosmetics vendor on the Halcyon (a tailor stall on the car deck, run by a minor NPC called Dora). Prices: 5,000 to 80,000 Scrip. This gives Scrip a sink beyond gear. |

## 10.9 READABILITY RULES (NON-NEGOTIABLE)

No cosmetic may reduce how visible the player is compared to the default kit beyond a fixed limit. Measure it: render each character outfit combination in a standard grey-green environment (the "camo test scene") under three lighting conditions (day, overcast, night with a flashlight), and compute the average luminance contrast of the character silhouette against the background. No outfit may be more than 15% below the default kit's contrast. Build this as an automated test (part 37) that runs on every outfit item's color variants. Darker camouflage clothing is fine; full-black-everything at night is capped.

No cosmetic may change the silhouette in a way that hides the head or makes it look like it's somewhere else (no hats with tall decoys, no hoods that extend the head shape more than 5 cm).

Weapon finishes never change muzzle flash, tracers, laser or light visibility.

Tracer color is cosmetic only for the shooter's own view. Other players always see the standard tracer color (warm orange-red), so a cosmetic can't make tracers harder to see for the target.

Charms never obscure sights.

Emissive elements on any cosmetic (finishes, charms, clothing trims) have a maximum luminance cap (part 26 gives the material parameter limit), and they turn off entirely in Night raids if the player has their "light discipline" setting on (the default), which turns off all cosmetic emissives at night. Equipment lights and lasers are separate gameplay systems and aren't affected.

## 10.10 COSMETIC DATA AND STORAGE

Cosmetics are definitions in Data Assets (`USMCosmeticDefinition` with a type: Clothing, Finish, Charm, Engraving, Emote, Title, Banner, Emblem, Reticle). The player's unlocks are a set of IDs stored on the backend (`cosmetic_unlocks` table, part 19). The player's current appearance (`FSMCharacterAppearance`: body type, head preset, sliders, colors, hair, clothing slots with color indices, tattoos, voice set) is stored on the backend in the profile and replicated in raid from the PlayerState.

Appearance replication: send the full appearance struct once when the player's character becomes relevant (compressed: about 60 bytes), and then only on change (which never happens in a raid except for gear). Clothing meshes are loaded asynchronously through the asset manager when the appearance arrives; until loaded, show the default salvager outfit (so a slow load never leaves an invisible player).

## 10.11 THE APPEARANCE SCREEN

The SALVAGER screen in the Halcyon menu (part 23): the character stands in the player's cabin on deck 5, in front of a mirror (the camera is the mirror's point of view, which is a nice framing). Tabs on the left: Body, Face, Hair, Marks, Clothing, Voice, Profile. Each tab shows a grid of options with thumbnails (rendered with the same automated icon tool as items), color swatches below, and locked options shown with their unlock requirement. Rotate the character with a drag. A "Preview in Storm" toggle switches the lighting to a Surge setting with rain, so players can see how the outfit looks wet and in bad light. A "Randomize" button with locks (lock the categories you like, randomize the rest). A "Save Outfit" option that stores up to 6 outfit presets.

---

End of part 10. Next: `11_ARMOR_GEAR_INVENTORY.md`.
