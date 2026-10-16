# SALTMARROW: PART 33, INPUT, CONTROLS AND ACCESSIBILITY

Every action, its default binding on keyboard and mouse and on gamepad, the input system setup with Enhanced Input, and the accessibility features. A friend who's never played an extraction shooter should be able to pick up a controller or sit at a keyboard and find the controls where their hands expect them.

---

## 33.1 ENHANCED INPUT SETUP

Input Actions (`IA_`) for every action, grouped in Input Mapping Contexts (`IMC_`) that are added and removed by state, with priorities:

| Context | Priority | Active when |
|---|---|---|
| `IMC_Default_KBM` / `IMC_Default_Gamepad` | 0 | On foot in raid |
| `IMC_ADS` | 1 | While ADS (adds zero, magnification, hold breath, optic toggle) |
| `IMC_Swimming` | 1 | Swimming (dive, surface) |
| `IMC_Ladder` | 1 | On a ladder |
| `IMC_Boat_Driver` | 2 | Driving a boat |
| `IMC_Boat_Passenger` | 2 | Passenger |
| `IMC_Downed` | 3 | Downed |
| `IMC_Grabbed` | 3 | Grabbed by a Hollow |
| `IMC_Inventory` | 4 | Inventory or map open (UI handles most input via Common UI; this context keeps walking and closing) |
| `IMC_Spectate` | 5 | Dead and spectating |
| `IMC_Menu` | n/a | Out of raid (Common UI) |

Lyra's input config system (`ULyraInputConfig`, native and ability input actions mapped to gameplay tags) handles binding actions to abilities by tag. Use it.

Player Mappable Key settings: every action's key is rebindable through Lyra's settings screen (`UEnhancedInputUserSettings` and player mappable key profiles). Two bindings per action on KBM (primary and secondary), one on gamepad. Conflicts are flagged in the UI but allowed in different contexts.

## 33.2 DEFAULT BINDINGS

| Action | Keyboard and mouse | Gamepad (Xbox layout) |
|---|---|---|
| Move | WASD | Left stick |
| Look | Mouse | Right stick |
| Sprint | Left Shift (hold, or toggle setting) | Left stick click (toggle) |
| Walk (slow) | Left Alt (hold) | Light stick deflection (below 50% walks) |
| Jump / Mantle / Vault | Space | A |
| Crouch | C (toggle) / Left Ctrl (hold) | B (tap) |
| Prone | Z (toggle) | B (hold) |
| Lean left / right | Q / E (hold; toggle setting) | In ADS: right stick click toggles lean toward the right stick's horizontal direction |
| Shoulder swap | V | Left bumper + right stick click |
| Fire | Left mouse | Right trigger |
| Aim (ADS) | Right mouse (hold; toggle setting) | Left trigger |
| Reload | R | X (when nothing is focused); double-tap X always reloads |
| Check magazine | R (hold) | X (hold) |
| Check chamber | R + B (hold) | X (hold) + D-pad down |
| Fire mode | B | D-pad down (tap) |
| Primary / secondary / holster | 1 / 2 / 3 | Y (tap cycles, hold opens the weapon radial) |
| Knife (equip as held weapon) | 4 | Weapon radial |
| Melee (quick, hold for heavy) | Mouse 4 (thumb button) | Right stick click (outside ADS) |
| Throwables | G (primary throwable), 5 (secondary) | Right bumper (tap throws, hold opens the throwable radial) |
| Interact | F | X (when an interactable is focused) |
| Inventory | Tab | View (tap) |
| Map | M | View (hold) |
| Health screen | H (hold) | D-pad up (hold) |
| Quick slots 1-6 | 5, 6, 7, 8, 9, 0 (5 doubles as the secondary throwable when one is bound there) | D-pad up (tap: quick slot radial) |
| Ping / ping wheel | Middle mouse (tap / hold) | Left bumper (tap / hold) |
| Compass | K (hold) | Quick slot radial |
| Flashlight / laser | T (tap: light, hold: mode menu) | D-pad right (tap: light, hold: mode radial) |
| Optic toggle (canted / magnifier) | Left Alt in ADS | D-pad left in ADS |
| Zero up / down | Page Up / Page Down (or Shift + wheel in ADS) | Left bumper + D-pad up/down in ADS |
| Magnification | Ctrl + mouse wheel in ADS (plain wheel is a setting) | D-pad up/down in ADS |
| Hold breath | Left Shift in ADS | Left stick click in ADS |
| Deploy bipod | X | D-pad down in ADS (hold) |
| Squad voice (push to talk) | Caps Lock (hold) | Unbound by default (voice activation recommended on gamepad) |
| Proximity voice | Y (hold) | Unbound by default |
| Emote wheel | J (hold) | D-pad left (hold, outside ADS) |
| Pause / menu | Esc | Menu |
| Break grab | F (mash, or hold if the accessibility option is on) | X (mash or hold) |
| Give up (downed) | F (hold) | X (hold) |
| Boat throttle / steer | W/S, A/D | Right trigger / left trigger, left stick |
| Boat horn | Space | A |
| Exit boat | F | X (hold) |

Why the gamepad layout looks the way it does: a controller is short on buttons, so conflicts are resolved with context (X interacts when something is focused, otherwise it reloads, and the prompt shows both glyphs: "X: Search · X X: Reload") and with the left bumper as a modifier for rare actions (shoulder swap, zeroing). Ambiguous multi-hold schemes are avoided. Everything is remappable.

The gamepad layout at a glance:

| Button | Action |
|---|---|
| Left stick | Move; click: sprint toggle; click in ADS: hold breath |
| Right stick | Look; click: melee (outside ADS) / lean toggle (in ADS) |
| A | Jump / mantle / vault |
| B | Crouch (tap), prone (hold) |
| X | Interact (when focused) / reload; hold: check mag; double-tap: always reload |
| Y | Cycle weapons (tap), weapon radial (hold) |
| Left trigger | ADS |
| Right trigger | Fire |
| Left bumper | Ping (tap), ping wheel (hold); modifier for zeroing and shoulder swap |
| Right bumper | Throwable (tap), throwable radial (hold) |
| D-pad up | Quick slot radial (tap), health screen (hold); in ADS: magnification up |
| D-pad down | Fire mode (tap), bipod (hold in ADS); in ADS: magnification down |
| D-pad left | Emote wheel (hold); in ADS: optic toggle |
| D-pad right | Flashlight (tap), device modes (hold) |
| View | Inventory (tap), map (hold) |
| Menu | Pause |

## 33.3 MOUSE AND STICK FEEL

Mouse: raw input, no acceleration, sensitivity as a multiplier with separate values for hip, ADS (scaled per magnification by FOV, so muscle memory carries across optics: "focal length scaling" with a coefficient setting, default 1.33, the common competitive standard), and vehicle. Invert Y option. DPI-independent display of sensitivity (cm/360 shown as a helper in settings).

Gamepad: response curves (Linear, Default (exponential), Dynamic), deadzones (inner and outer, per stick, with a live visualizer in settings), separate horizontal and vertical sensitivity, ADS sensitivity multiplier, look acceleration (a ramp after holding the stick at max: delay 0.15 s, ramp 0.3 s, extra 60%), and aim assist (part 33.4).

## 33.4 AIM ASSIST (GAMEPAD ONLY)

Aim assist exists so controller players can play with mouse players. It's subtle, and it's on by default for gamepad input only (detected per frame by the last input device). Never on mouse.

Components: slowdown (look sensitivity reduced by up to 35% when the reticle is over or near a valid target's hitbox), magnetism (a small rotational pull toward the target only while the player is actively moving the stick and the target is moving, up to 15% of the player's input), and no snap-to-target on ADS (no "ADS snap": it's too strong for a game where hip-fire ranges are short and ambushes matter).

Valid targets: enemy players, Wardens and Hollows within 80 m and in line of sight from the camera and the character's head (no assist through smoke, foliage or walls, and none toward targets the client doesn't have replicated). Strength fades with distance. Settings: Off, Low, Default.

In PvP fairness terms: telemetry tracks hit rates by input device; if gamepad players outperform mouse players in comparable situations, reduce the strength.

## 33.5 ACCESSIBILITY

Listed by category. Most are in Settings > Accessibility; some are elsewhere and cross-referenced.

### 33.5.1 Visual

Colorblind modes (Protanopia, Deuteranopia, Tritanopia, High Contrast) for UI and in-world indicators (squad outlines, ping colors, hit markers, rarity colors, status effect icons, the HUD threat ring). Part 22.

UI scale (80% to 150%) and text size (4 steps). Part 22.

Subtitles for Sparks's broadcasts, trader lines and Warden voice lines (Wardens' callouts as directional subtitles: "[Warden, left] Contact!"), with size, background opacity and speaker name color options. Sound captions (optional): visual captions for important non-speech sounds ("[Gunfire, distant, north]", "[Footsteps, close, behind]", "[Hollow scream]"), as a directional caption system: captions appear near the screen edge in the direction of the sound. This one is a big accessibility win for deaf and hard-of-hearing players, and it gives information equivalent to what hearing players get: the same gameplay noise events drive it, so it never reveals more than sound would.

Night readability boost (a post-process option, part 26).

Camera shake intensity (0% to 100%), head bob (0% to 100%), weapon sway visual (reduces the visual motion of the weapon model, not the actual aim sway), motion blur (off by default), depth of field in menus (toggle), screen effects intensity (damage vignette, concussion blur, salt sickness tint: 0% to 100%, with a minimum that keeps a clear indication of the state through icons), flash intensity (lightning, flashbangs and muzzle flash brightness: reduce to 50% for photosensitivity), and a photosensitivity warning at first launch.

Field of view (70° to 100° third person, 60° to 100° first person) and first-person mode (part 04).

Crosshair options (part 24), always-visible dot option.

Exact ammo count option (part 24).

Loot glints option (part 27).

### 33.5.2 Audio

Volume per category, mono audio, dynamic range (Narrow helps with hearing quiet sounds), HRTF, and the visual sound captions above.

### 33.5.3 Motor

Full rebinding on KBM and gamepad. Toggle vs hold for every hold action (sprint, ADS, crouch, lean, hold breath, voice). Mash alternatives: "Break grab" and similar mash actions can be set to "Hold" instead (a hold of 1.5 s replaces 8 presses). Hold durations are gameplay and don't change, but "Auto-complete holds" lets a single press start a hold interaction that completes without holding (cancel by pressing again or moving). Aim assist strength. Stick deadzones and curves. One-handed presets (a "left-hand only" KBM layout preset that moves essential actions within reach of the left hand, and a "mouse-heavy" preset for players with limited left-hand use). Inventory: double-click and Ctrl-click alternatives to dragging, plus gamepad-style focus navigation with the keyboard (arrow keys and Enter).

### 33.5.4 Cognitive

The Shakedown and tutorial (part 39), a control hints overlay (show input hints for contextual actions: on by default for the first 10 raids, then off), the Journal as a reference, clear objective tracking, a "simplified HUD" preset, and no time pressure in menus (nothing in the Halcyon is timed except station builds, which run whether you're watching or not).

## 33.6 INPUT ACCEPTANCE TESTS

Every action is reachable on both KBM and gamepad with the default bindings (a test enumerates input actions and checks each has a binding per device type).

Rebinding persists across restarts and syncs to the cloud settings (`settingsCloud`).

Toggle and hold variants work for every action that has them.

Aim assist is inactive for mouse input on the same frame the mouse moves, and never assists toward non-relevant targets.

Sound captions appear for every gameplay noise event above a loudness threshold, with the correct direction.

---

End of part 33. Next: `34_SETTINGS_MENU.md`.
