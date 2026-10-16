# SALTMARROW: PART 24, THE IN-RAID HUD AND RAID SCREENS

The HUD's job is to give the player exactly what their character would know, and nothing else. It's minimal by default because the world carries most of the information: the sky tells you about the Surge, sound tells you about enemies, the weapon tells you about ammo. What the HUD does show must be readable in a quarter of a second against rain, darkness and a green-black storm sky.

---

## 24.1 HUD PRINCIPLES

Diegetic first: if the character can see it on their gear (the Shearwater's translucent mag, a watch on the wrist for the time in first person ADS, the compass when held), show it there.

Minimal by default, configurable: every HUD element has a visibility setting: Always, Contextual (shows when relevant and fades after), or Never. Defaults are mostly Contextual.

No enemy information without a source: no red dots on a minimap, no enemy markers except your squad's pings (which expire), no damage direction from unseen sources except a vague directional indicator for hits you take.

Readability: every element has a subtle dark backing or a text shadow and glow so it reads on any background. Test every element against the brightest (sun on water) and darkest (night Surge) scenes.

## 24.2 THE LAYOUT (DEFAULT, 1080P)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Squad 1] [Squad 2]                 N  ·  NE  ·  E           [SURGE 2 ▼ 1:12]│
│  status bars                     compass strip (heading 064°)   weather ind.   │
│                                                                                │
│ [Pinned contracts]                                                              │
│  ▢ Cold Storage 0/1                                                             │
│                                                                                │
│                                     ·  (dot / reticle)                          │
│                                                                                │
│                              [Interact prompt]                                  │
│                              "Search  [F]"                                      │
│                                                                                │
│ [Status effects] ▣▣▣                                       [Weapon]             │
│ [Health doll]  [Stamina ring]                               Mako AR  ⟪AUTO⟫     │
│                                                             ▮▮▮▮▮▮▯  "Full"     │
│ [Quick slots 1-6]                                           ▸ 5.56 M855        │
└──────────────────────────────────────────────────────────────────────────┘
```

All positions are anchored to safe-zone corners and configurable in Settings > HUD with a layout editor (Tier 3: drag elements; v1: preset layouts Default, Minimal, Competitive).

## 24.3 ELEMENTS

### 24.3.1 Center: reticle and hit markers

Hip-fire reticle: a small dot (2 px, `Spray` at 70%, with a 1 px dark outline) by default. Options: None, Dot, Small cross, Dynamic cross (shows spread, Practice only by default; can be enabled in Standard, because some players need it for accessibility, but it shows the real spread so it's no advantage beyond honesty). In third person, the reticle is placed where the weapon's aim ray hits the world (trace from the muzzle along the aim direction), not at screen center, so the player sees where the shot will actually go. When the muzzle is obstructed by cover but the camera isn't, the reticle shows a small "blocked" variant (a dot with a slash) at the obstruction point. That's an important third-person fairness feature: you never shoot into a wall in front of your muzzle without knowing it.

ADS: no HUD reticle (the optic or iron sight is the reticle).

Hit markers: a brief X around the reticle (or at the aim point in ADS), confirmed by the server (part 05). Variants: white thin for body hits, white thick for heavy hits (over 50 damage), red for kills (with a short sound), a broken-shield variant (a small gap in the X) for armor-stopped hits, and a distinct diamond for headshots (configurable off). Hit markers have a sound (part 28), which can be turned off. No damage numbers (except Practice, optional).

Damage direction indicator: when hit, a red arc segment around the screen center pointing toward the source direction (horizontal only), fading over 1.2 s. The arc's thickness scales with damage. For hits from outside the player's field of view, the arc is softer and wider (a "vague" direction). Explosions show a ring.

### 24.3.2 Top center: compass

A horizontal strip compass showing 180° of heading with cardinal letters, 15° ticks and the numeric heading (`Num.S`). Contextual by default: shows when the player is moving, when a ping is placed, when ADS with a magnified optic (to call directions), and when the Compass item is held (press the compass key: the character raises the compass in their hand, and the HUD strip becomes always-on while held). Squad pings appear on the strip as colored markers with distance ("Loot 42 m"). The Surge direction shows as a small storm icon on the strip during warnings and storms.

### 24.3.3 Top right: weather and Surge indicator

A small instrument: an icon for the current phase (calm sun-cloud, warning, storm, lull), and during warnings and storms a countdown ("SURGE 2: 1:12" counting to arrival, then "PEAK" during the peak, then "LULL" with the time until the next warning if the Barometer is carried). The arrow shows where the storm is coming from. With the Lookout station L1, the map shows the front's position (24.5).

### 24.3.4 Top left: squad

Each squadmate: callsign, a small status bar (health as one segmented bar summarizing all zones; it's a summary, not the full doll), an icon for their state (alive, downed with a bleed-out ring, dead, extracted, disconnected), the distance and direction arrow when they're not visible, and a voice indicator when they're talking. Their color (default cyan, `Sea`) matches their outline.

### 24.3.5 Left: pinned contracts

Up to 3 pinned contracts with the current objective and progress ("Kill Shamblers in the Cannery 4/10"). Contextual: shows for 6 s when progress changes, when entering a relevant zone, and when the map is opened; otherwise hidden. A small toast when an objective completes ("Objective complete: Cold Storage" with a stamp sound).

### 24.3.6 Bottom left: health and status

The health doll: a small silhouette (front view) with the 7 zones, each filled by its HP fraction and colored (healthy: `Spray`, damaged: amber, critical: `Flare`, destroyed: black with a red outline), with icons on zones for bleed (a drop), heavy bleed (two drops, pulsing), fracture (a cracked bone). Contextual: shows when damaged or when any status effect is active, or when the health key (H) is held (which also shows the full health screen overlay, 24.4).

Status effects row: icons for active effects above the doll (bleeding, fracture, pain, concussion, cold with a level bar, dehydrated, burning, salt sickness, buffs from stimulants with timers, wet, overloaded), each with a tooltip in the inventory.

Stamina: a thin ring or arc around the doll (or a bar, a setting), showing stamina, with breath drawn as a blue inner arc when underwater. Contextual: shows when below 100% or underwater.

Weight indicator: an icon that appears when Burdened (yellow), Overloaded (orange), Immobile (red, pulsing).

### 24.3.7 Bottom right: weapon

Weapon name (or nickname), fire mode (SEMI/BURST/AUTO/BOLT/PUMP as text in a small pill), ammo: no exact count by default (Pillar 1 and the genre: you check your mag). Instead, a magazine silhouette that fills approximately, updated only when the player checks the magazine (hold R) or reloads; between checks, it shows the last-known estimate. The loaded ammo type name below. If the weapon is a Shearwater (translucent mag) or the player has the "Count Rounds" upgrade, an exact count. Setting "Show exact ammo count": Off by default in Standard, available as an accessibility option (it's a small advantage, and it's okay for players who need it).

Below the weapon: the zeroing distance (when ADS with an adjustable sight) and the magnification (variable optics), and for LMGs and suppressed weapons, a heat bar.

Grenade/throwable when equipped: name and count.

### 24.3.8 Bottom left: quick slots

Six slots showing the item bound to each (icons from the rig/pockets), with the key number. Greyed if the item is gone. Contextual: shows when a quick slot key is pressed or when the inventory is open.

### 24.3.9 Center bottom: interaction prompt

When an interactable is focused: the action label ("Open", "Search", "Pick up Field Dressing", "Revive Kitt", "Board", "Insert Fuse"), the key glyph (F by default; gamepad X), and a hold ring for hold interactions. Items show name and rarity color. If an interaction is blocked: the reason in `Fog` ("Locked: needs NFB Vault Anteroom Key").

### 24.3.10 Notifications and banners

Center top banners (big, rare): "SURGE INCOMING" (with the wave number and direction), "EXTRACTION AVAILABLE: CANNERY JETTY", "EXTRACTING 0:08", "YOU ARE DOWNED", "BLEEDING OUT 0:42". `Title.M`, with a dark band behind, 2 s hold.

Radio subtitles: Sparks's broadcasts as subtitles at the bottom center with her name tag ("SPARKS:"), in a radio-style font treatment (typewriter in a dark band). Subtitles setting: On (default), Off, and size options. Squad voice and proximity voice have no subtitles (it's live voice).

Pickup feed: small lines at the right edge when you pick up items ("+ Field Dressing", "+ 30 × 5.56 M855"), fading after 3 s.

Kill feed: none. There's no global kill feed. You only know about your own kills (hit marker) and your squad's (a small "Kitt: killed a salvager" line in the squad area, contextual).

## 24.4 THE IN-RAID INVENTORY

Part 11 defines the mechanics. Layout (Tab): full-screen, translucent over a blurred live game view.

Left third: the equipment doll (character render in a small 3D viewport, front view, live-updating as gear changes) with slots around it. Below: health summary (the doll with zones and status effects; clicking a zone with a medical item selected applies it).

Middle third: the rig's pouches (laid out as their real arrangement), pockets, secure pouch, and the backpack grid. Weight bar at the top with thresholds.

Right third: the loot panel, when looting (container grid with search progress, or a body's doll and containers). When not looting: the "nearby" panel lists loose items on the ground within 2 m (so you can pick up from the inventory screen) and a "Drop" target area.

Threat ring: at the screen edges, a thin ring that flashes red in the direction of gunshots within 80 m and of damage taken while the inventory is open.

Context menu actions in raid: Use, Equip, Unload, Load, Split, Drop, Inspect, Examine, Modify (Tier 2), Read (notes).

## 24.5 THE MAP

The map key (M) opens a full-screen paper map: the island drawn as a hand-annotated nautical-style chart (an illustrated texture, part 25), with POI names, contour lines, depth soundings in the water, roads, paths and buildings as footprints. It is the island as the Halcyon's salvagers have charted it, with pencil notes on it ("Wardens here", "Don't", "Good roof").

What's on the map: the player's position and facing (an arrow), squadmates' positions (icons with names), squad pings (expiring), extraction points (icons with their status: open, closed, arriving at time, condition), insertion point (yours only), pinned contract objective areas (circles), and the Surge (with the Lookout station: the front's current line and direction; without it: just the direction arrow from the compass). Player-placed markers: the player can place up to 8 personal markers by clicking (visible to the squad as well, with a different icon from pings). There's no map drawing in v1.

There's no live enemy information on the map, ever.

Map interactions: zoom (wheel, 3 levels), pan (drag), toggle layers (extractions, contracts, squad, markers, flood zones: with the Radio Room L2, flood zones are shaded by their expected flood order for this Surge direction, which is a strong planning tool), and a legend.

The map can be opened while moving (walk speed, can't sprint), like the inventory.

## 24.6 THE HEALTH SCREEN

Holding H shows a larger health overlay (non-blocking, the game continues): the full doll with each zone's HP numbers ("Thorax 61/85"), status effects with descriptions, and the medical items in your rig and pockets as a row. Click or press a number to use an item on the most injured relevant zone, or drag an item onto a zone. Gamepad: select the zone with the stick, the item with the D-pad, apply with A.

## 24.7 DOWNED, DEATH AND SPECTATING

Downed: the screen desaturates at the edges, a heartbeat sound, the bleed-out ring timer in the center ("BLEEDING OUT 0:42"), and a prompt "Hold [F] to give up" (bleed out immediately, if you know nobody's coming). Squadmates' HUD shows the downed player's icon pulsing and their direction and distance.

Death: the camera pulls up and out from the body in third person, with 1 s of slow motion. Then, in v1, a 3 s freeze-frame looking from your body toward the killer's position at the moment of death, with their callsign, weapon and distance. The camera never tracks the killer afterward, so a dead player can't feed their squad the killer's live position over voice. (Tier 3 adds a proper kill-cam: a replay of the 2 s before death from the killer's position.) After that, spectate a squadmate if one is alive, with a "Leave to summary" button, or go straight to the summary.

Spectating squadmates: third-person over their shoulder, switchable between alive squadmates. You hear what they hear. You can talk on squad voice.

## 24.8 EXTRACTION AND BOAT UI

Covered in part 16. HUD additions: the extraction marker in the world (a diegetic beacon or boat lights, plus an optional HUD marker with distance when within 150 m, contextual), and the extraction timer ring.

## 24.9 THE PAUSE MENU IN RAID

Esc opens a small panel (the game doesn't pause): Resume, Settings (the full settings, with the game running behind), Squad (mute and volume per squadmate), Controls reference, Leave Raid (with the warning: "Leaving now counts as MIA. You'll lose everything you're carrying." and for the host the part 03 warning). Gamepad: Start.

## 24.10 HUD ACCEPTANCE TESTS

Every HUD element is readable (contrast ratio above 4.5:1 against its local background) in the 6 reference scenes: bright day, overcast day, sun on water, night clear, night Surge, underwater (automated luminance sampling around each element's bounds in screenshot tests).

The third-person reticle matches the projectile's actual impact point within 5 cm at 10 m, 20 m and 50 m when unobstructed, and shows the blocked variant when the muzzle is obstructed.

Hit markers only appear for server-confirmed hits (test with a client at 250 ms latency firing at a target that moves out of the way: no hit marker for misses).

No HUD element reveals enemy positions (code review rule plus a test that runs a raid with bots and checks no HUD widget ever references a non-squad player's location).

---

End of part 24. Next: `25_ART_DIRECTION_AND_RENDERING.md`.
