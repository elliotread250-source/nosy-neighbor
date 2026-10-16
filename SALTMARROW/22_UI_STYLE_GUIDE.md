# SALTMARROW: PART 22, UI STYLE GUIDE

The UI is the part of the game players touch the most, and it's where most indie extraction games look cheap. Ours should look like it belongs to the world: practical, weathered, maritime, a little analog, with modern clarity underneath. This part is the design system: colors, type, spacing, components, motion, sound and the technical rules for building it with UMG and Common UI. Parts 23 and 24 use it to specify every screen.

---

## 22.1 THE DESIGN LANGUAGE

Three influences, blended:

The Halcyon's salvaged ship equipment: brass and enamel instrument faces, stenciled labels, painted steel, rivets, gauge needles, chart paper. That's for frames, headers and accents.

Field notebooks and paperwork: off-white paper, typewritten labels, rubber stamps, handwritten pencil notes in margins. That's for item descriptions, notes, contracts and the Journal.

Modern tactical clarity: clean sans-serif type for numbers and stats, flat panels with subtle translucency, sharp iconography. That's for the inventory, the gunsmith stats, the HUD and anything you need to read in 200 ms.

The rule: decoration lives at the edges (frames, headers, backgrounds), clarity lives in the middle (data, items, numbers). Never put a texture behind a number.

## 22.2 COLOR

All colors are defined once in a `USMUIStyle` Data Asset (and a matching Material Parameter Collection for UI materials) with semantic names. Widgets reference semantic names, never raw hex.

### 22.2.1 Core palette

| Token | Hex | Use |
|---|---|---|
| `Ink` | `#0E1214` | Deepest background, HUD text shadows |
| `Hull` | `#1A2024` | Primary panel background (at 88% opacity over the 3D scene) |
| `Deck` | `#242C31` | Secondary panels, list rows |
| `Bulkhead` | `#333E44` | Borders, dividers, inactive controls |
| `Fog` | `#8C9AA1` | Secondary text, disabled text |
| `Spray` | `#D7DEE0` | Primary text on dark |
| `Paper` | `#E9E3D3` | Paper surfaces (notes, contracts, item description cards) |
| `PaperInk` | `#2A2622` | Text on paper |
| `Brass` | `#C29A4B` | Primary accent: selected state, headers, the Halcyon's identity |
| `BrassDim` | `#7D6633` | Brass at rest, frames |
| `Signal` | `#E8742A` | Call to action (PLAY, START, BUY), life-ring orange |
| `SignalHover` | `#FF8A3D` | |
| `Sea` | `#3C7C86` | Information, friendly, squad (default squad color) |
| `Kelp` | `#6E8B4A` | Positive deltas, success, "Found in Raid" |
| `Flare` | `#D2443A` | Danger, negative deltas, damage, errors |
| `Salt` | `#9EE7E0` | Marrow Salt and anything uncanny (glow color) |
| `Storm` | `#4F6B3A` | Surge indicators (sickly green) |

### 22.2.2 Rarity colors

| Rarity | Hex | Notes |
|---|---|---|
| Junk | `#6B7173` | |
| Common | `#C9CCC6` | |
| Uncommon | `#5FA58E` | teal-green |
| Rare | `#4C86C6` | |
| Epic | `#9A6CC8` | |
| Legendary | `#E0A43A` | amber, with a slow shimmer on the item's cell border |

Rarity shows as a thin top border on item cells (3 px at 1080p) and a subtle tint to the cell background (8% opacity). Never fill the whole cell with rarity color; it makes the stash look like a candy shop and hides item icons.

### 22.2.3 Colorblind support

Settings > Accessibility > Colorblind mode: Off, Protanopia, Deuteranopia, Tritanopia, High Contrast. Each mode swaps the semantic tokens for alternates (the style asset has a palette per mode). Deltas use symbols as well as color everywhere (▲ better, ▼ worse), so color is never the only signal. Squad outlines and enemy markers have shape differences too (part 24).

## 22.3 TYPOGRAPHY

Use open-licensed fonts (SIL Open Font License) and ship the font files in the project. Record the licenses in `CREDITS.md`.

| Role | Font | Weights | Use |
|---|---|---|---|
| Display | Barlow Condensed | SemiBold, Bold | Screen titles, big numbers (raid timer), the PLAY button, section headers. Uppercase with 4% letter spacing. |
| UI | IBM Plex Sans | Regular, Medium, SemiBold | Body text, labels, buttons, tooltips. |
| Numeric | IBM Plex Mono | Regular, Medium | Stats, prices, counts, coordinates, timers (tabular figures so numbers don't jitter). |
| Typewriter | Special Elite | Regular | Notes, LANTERN documents, contract headers, item "tags". Use sparingly. |
| Handwritten | Caveat | Regular | Trader margin notes, the Captain's welcome note, map annotations. Rare. |

Logotype: the SALTMARROW wordmark is custom: build it from Barlow Condensed Bold with manual kerning, a weathered texture (salt crust eating into the bottom edges of the letters), and a subtle emboss. Render it to a texture at 4K for the title screen and to a smaller version for the menu header. Provide a flat version for the web page and the app icon.

### 22.3.1 Type scale (at 1080p; scale with DPI)

| Token | Size | Line height | Font |
|---|---|---|---|
| `Title.XL` | 72 | 1.0 | Display Bold |
| `Title.L` | 44 | 1.05 | Display Bold |
| `Title.M` | 30 | 1.1 | Display SemiBold |
| `Title.S` | 22 | 1.15 | Display SemiBold |
| `Body.L` | 18 | 1.4 | UI Regular |
| `Body.M` | 15 | 1.4 | UI Regular |
| `Body.S` | 13 | 1.35 | UI Regular |
| `Label` | 12 | 1.2 | UI SemiBold uppercase, 6% spacing |
| `Num.L` | 28 | 1.0 | Mono Medium |
| `Num.M` | 16 | 1.0 | Mono Medium |
| `Num.S` | 12 | 1.0 | Mono Regular |
| `Note` | 17 | 1.5 | Typewriter |

Minimum text size anywhere: 12 px at 1080p, scaled up by the UI scale setting (Settings > Accessibility > UI Scale 80% to 150%, and Text Size Small/Default/Large/Extra Large which adds +0/+2/+4/+6 px to body text).

## 22.4 LAYOUT AND SPACING

Base unit: 4 px at 1080p. Spacing tokens: `S1` 4, `S2` 8, `S3` 12, `S4` 16, `S5` 24, `S6` 32, `S7` 48, `S8` 64.

Safe zone: all UI respects the platform safe zone (and a user-adjustable safe zone in Settings > Display for TVs: 90% to 100%).

Resolution and aspect: design at 1920×1080. Support 16:9, 16:10, 21:9 and 32:9 (ultrawide: HUD elements anchor to a 16:9 central region by default, with an option to stretch to full width), and 4:3 is not supported. Test at 1280×720 (Steam Deck at 1280×800), 1920×1080, 2560×1440, 3440×1440 and 3840×2160.

DPI scaling: UMG's DPI curve set so UI scales by the shortest screen side, with the user UI scale multiplier on top.

Menu screens use a three-zone layout: a left navigation rail (the Halcyon menu, 280 px wide), a central content area, and a right context panel (details, tooltips, the stat sheet; 380 px). The 3D Halcyon scene is visible through the panels' translucency and in gaps.

## 22.5 SURFACES AND MATERIALS

Panels: `Hull` color at 88% opacity with a background blur (UMG's Background Blur widget, strength 8, at Medium settings and above; on Low, no blur and 96% opacity). A 1 px border in `Bulkhead`. Corners: 2 px radius (almost square: this is a ship, not a phone). A very subtle noise texture overlay at 3% (painted steel), applied in a UI material, never over text areas.

Header bars: a brass-colored rule line (2 px `BrassDim`) under screen titles, with small rivet dots at each end (4 px circles). Titles in `Title.L`, uppercase.

Paper cards: for notes, contracts and item descriptions: `Paper` background with a paper fiber texture, slightly uneven edges (a mask texture), a soft drop shadow, and typewriter text. Stamps (rubber-stamp graphics: "COMPLETED", "FOUND IN RAID", "COUNCIL ISSUE", "CLASSIFIED") as decals in `Flare` red at 70% opacity with an ink texture.

Glass and instruments: for the HUD compass, the stamina ring, the timer: thin lines and gauges, no heavy frames. Instruments use `Spray` lines at 80% opacity with a soft glow (an outer glow in the UI material, 2 px, 30% opacity) for readability against any background.

## 22.6 ICONOGRAPHY

Item icons: rendered automatically from the item's mesh in a lightbox scene (part 09's icon generator) at 256 px per cell, with consistent lighting (a key light from top-left, soft fill, rim light), a transparent background, and a 3/4 view angle per category (weapons: side view, left side facing right; optics: 3/4 front; boxes and kits: 3/4 top). Weapon icons are re-rendered with their current attachments (cached per config hash) so a customized rifle in the stash looks customized. That's an important detail for Pillar 2: render the weapon icon from its actual configuration, asynchronously, with a fallback to the base icon until ready.

UI icons: a single icon set in a consistent style: 2 px stroke line icons on a 24 px grid, square caps, slightly rounded joins. Categories, actions, status effects (bleeding, fracture, pain, cold, etc.), stats (ergonomics, recoil, accuracy), map markers. Draw them as SVGs and import as textures (or use UMG's vector support if available in the installed version). About 180 icons. Source from an open-licensed icon set as a starting point (e.g. Tabler Icons or Lucide, both permissive) and draw the game-specific ones (salt crystal, Hollow, Warden chevron, the Surge, the Halcyon, boats) in the same style.

Status effect icons have a colored background shape by type: negative effects in a `Flare` red rounded square, positive in `Kelp` green, neutral in `Bulkhead`.

## 22.7 COMPONENTS

Build these as Common UI-based reusable widgets in `UI/Components/`, each with states, before building any screen. Each has a style entry in the style asset.

Buttons: Primary (filled `Signal`, `Title.S` uppercase text, 48 px tall, used for PLAY, START, CONFIRM), Secondary (outline `BrassDim`, fills `Brass` at 15% on hover), Tertiary (text only, `Fog`, underline on hover), Icon button (36 px square), Danger (outline `Flare`). States: normal, hover, pressed, focused (gamepad: a 2 px `Brass` focus ring with a slow pulse), disabled (40% opacity), and loading (a spinner replaces the label). Every button has a hover and click sound (22.10).

Tabs: Common UI tab list, underlined tabs with the active tab in `Brass` and a 3 px underline. Gamepad: LB/RB switch tabs. Keyboard: Q/E or Ctrl+Tab.

Lists and grids: Common UI list views with virtualization (stash grids can have 1,200 cells; virtualize). Row hover: `Deck` lightens to `Bulkhead`.

Item cell: the inventory cell widget: icon, stack count (bottom right, `Num.S`), durability bar (bottom, 2 px, colored by condition), rarity top border, status badges (FiR check, Shakedown, Hot, examined-or-not "?"), a weapon's magazine fill (a tiny vertical bar), and a key's remaining uses. Drag visuals: the item follows the cursor at 90% opacity, target cells light green or red.

Tooltip: the item tooltip is a rich panel: name (rarity color), category, a paper card with the description, stats (part 23), value (if known), weight, size, FiR, and the input hints (right-click: context menu; Ctrl+click: quick move). Appears after 250 ms hover, follows the cursor offset, never covers the hovered item.

Stat bar: label, value (`Num.M`), a bar showing the value on the stat's scale, and a delta segment (green or red) when previewing a change, with ▲▼ symbols.

Modal dialog: a centered paper-or-hull panel with a title, body, and up to 3 buttons. Blocks input behind. Esc/B cancels.

Toast notifications: slide in from the top right, auto-dismiss after 4 s, stack up to 3 ("Contract updated", "Station upgrade complete", "Kitt#1203 invited you to a squad" with Accept/Decline).

Context menu: right-click menus with actions (Inspect, Use, Equip, Unload, Split, Discard, Sell, Modify, Add to Build...), keyboard and gamepad navigable.

Sliders, toggles, dropdowns, key-binding fields: settings components (part 34).

Currency display: Scrip amount with a gull-stamped Scrip icon, `Num.M`, animated count up/down on change (300 ms).

Timer: `Num.L` digits in a brass-ringed instrument for raid countdowns.

Progress ring: for holds (revive, extraction, search), a circular ring that fills, centered on screen or on the target.

## 22.8 MOTION

Motion explains and confirms. It never delays. Durations:

Hover feedback: 80 ms.
Button press: 60 ms down, 120 ms up.
Panel open: 180 ms (fade from 0 and slide 12 px), easing out cubic.
Screen transitions in the Halcyon: 450 ms (the camera moves between spots on the ship while the old panel fades out over 150 ms and the new one fades in over 200 ms starting at 250 ms). The camera move is skippable: input during the move snaps to the end.
Item move in the grid: 90 ms snap.
Number changes: 300 ms count.
Toast: 220 ms in, 180 ms out.
HUD hit marker: 40 ms in, 200 ms hold, 160 ms out.

Respect Settings > Accessibility > Reduce Motion: halves durations, removes slides and camera moves between Halcyon spots (cuts instead), disables shimmer and pulse effects.

Frame rate: UI animations run at the game's frame rate; never author UI animations that rely on high frame rates to look smooth.

## 22.9 COPY AND VOICE IN THE UI

Labels are short and literal ("Sell", "Equip", "Extract"). Descriptions are in-world (part 02). Errors are human and specific ("You need 12,400 more Scrip" not "Insufficient funds"). Numbers have units (kg, m, s, MOA, RPM). Times use m:ss. Large numbers use thousands separators by locale. Never use exclamation marks in system UI.

Localization: every user-facing string is an `FText` in a string table (no hard-coded strings in widgets), from day one, even though v1 ships in English only. Gather text with the Localization Dashboard. Plan for longer languages (German is about 30% longer): buttons and labels have room to grow, or truncate with a tooltip.

## 22.10 UI SOUND

Every interactive element has sound, quiet and tactile, from a UI sound set (part 28 lists them): hover (a soft tick), click (a mechanical switch), back (a lower switch), tab change (a page turn or a dial click), item pick up (a cloth rustle, varied by item category: metal clink for weapons, crinkle for medical packs, glassy tink for salt), item drop into grid (a soft thud), invalid drop (a dull buzz), purchase (a brass coin-stamp "ka-chunk"), sell (a till drawer), contract accepted (a rubber stamp), level up (a ship's bell, two rings), station upgrade complete (a horn). UI sounds have their own volume slider.

## 22.11 COMMON UI AND INPUT

Use the Common UI plugin (Lyra uses it): `UCommonActivatableWidget` for every screen and modal, layered in a root layout with layers (Game HUD, Game Menu, Menu, Modal; Lyra's `UPrimaryGameLayout` pattern). Common UI handles input routing between layers, focus, the back action, gamepad navigation and platform-specific input glyphs (keyboard/mouse vs Xbox vs PlayStation glyphs, switching automatically when the last input device changes).

Input actions in UI use Common UI's input action data tables (or Enhanced Input integration if the installed Common UI version supports it well): Confirm, Back, Tab Left/Right, Context (right-click / gamepad X), Quick Move (Ctrl+click / gamepad Y), Rotate Item (R / gamepad RB while dragging), Split (Shift+drag / hold A), Inspect (I / gamepad LS click).

Gamepad support in menus is required: every screen must be fully usable with a controller (the Steam Deck case). Inventory dragging with a gamepad: select an item (A), it lifts and follows the focused cell; move with the D-pad or stick; place with A; rotate with RB; cancel with B. Quick move with Y.

Mouse: right-click context menus, drag and drop, wheel scroll on lists, Ctrl+click quick move, Shift+click split, Alt+click "move to stash" from inventory (out of raid), double-click equip/use.

## 22.12 PERFORMANCE RULES FOR UI

Use invalidation boxes and retainer boxes for complex static panels (Common UI and UMG support global invalidation; enable Slate global invalidation in project settings and design widgets to be invalidation-friendly: avoid binding functions that tick; use events and explicit updates). No property bindings (the UMG "Bind" functions that run every frame) in shipping widgets, except a handful in the HUD where the value genuinely changes every frame (stamina ring, compass), and those are implemented in C++ native widgets.

Virtualize long lists and big grids. Load item icons asynchronously with placeholders. The stash screen with 1,200 cells and 600 items must open in under 150 ms and scroll at the display frame rate.

HUD cost budget: under 0.6 ms of game thread and 0.4 ms of GPU at 1080p.

## 22.13 UI ACCEPTANCE TESTS

Every screen renders without clipping or overlap at 1280×720, 1920×1080, 3440×1440 and 3840×2160, and at UI scale 80% and 150% (automated screenshot tests, part 37, with a reviewer pass by me).

Every screen is navigable with a gamepad only, reaching every interactive control.

No widget uses a hard-coded string (a lint check over widget blueprints and C++ for literal user-facing text).

The stash opens in under 150 ms with a full stash.

Colorblind modes change every semantic color and nothing uses raw hex in widgets (lint check).

---

End of part 22. Next: `23_UI_HALCYON_SCREENS.md`.
