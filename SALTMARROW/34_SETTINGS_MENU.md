# SALTMARROW: PART 34, THE SETTINGS MENU

Every setting, its range, its default and where it's stored. Build the settings screen on Lyra's settings framework (`ULyraSettingsLocal` for machine-local settings like graphics, `ULyraSettingsShared` for player settings like sensitivity and keybinds, the Game Settings plugin's registry and screen), restyled to part 22. Local settings live in `GameUserSettings.ini`; shared settings live in the save game and sync to the backend's `settingsCloud` (part 20) so a player's controls follow their account.

Every setting applies immediately with a live preview where it makes sense (graphics changes apply with a short "Applying..." spinner; resolution changes show a 15 s "Keep these settings?" countdown that reverts if not confirmed). Every tab has "Reset to defaults" with confirmation. Every option has a one-line description shown in the right panel when focused, plus a preview image or animation for the visual ones (a small render showing low vs high).

---

## 34.1 GAMEPLAY

| Setting | Options / range | Default | Stored |
|---|---|---|---|
| Camera mode | Third person / First person | Third person | Shared |
| Third-person FOV | 70° to 100° | 80° | Shared |
| First-person (ADS) FOV | 60° to 100° | 72° | Shared |
| Weapon (viewmodel) FOV | 55° to 90° | 70° | Shared |
| Default shoulder | Right / Left | Right | Shared |
| Auto shoulder swap | On / Off | Off | Shared |
| Sprint | Hold / Toggle | Hold (KBM), Toggle (gamepad) | Shared |
| ADS | Hold / Toggle | Hold | Shared |
| Crouch | Hold / Toggle | Toggle | Shared |
| Lean | Hold / Toggle | Hold | Shared |
| Mantle on | Jump press / Jump hold | Jump press | Shared |
| Stay in scope while cycling bolt | On / Off | On | Shared |
| Bolt cycle | Release trigger / Press again | Release trigger | Shared |
| Auto-reload when empty | On / Off | Off | Shared |
| Auto-fill magazines from the stash on deploy | On / Off | Off | Shared |
| Show grenade arc | On / Off | On | Shared |
| Friendly fire guard (block fire on squadmates under 5 m) | On / Off | On | Shared |
| Pickup behavior | Quick-move to best slot / Open inventory | Quick-move | Shared |
| Examine unknown items | On / Off (first 10 raids only) | On | Shared |
| Character callouts | On / Off | On | Shared |
| Never host raids | On / Off | Off | Local |
| Show bullet trail for my shots | On / Off | On | Shared |
| Damage numbers (Practice only) | On / Off | Off | Shared |
| Control hints | Always / First 10 raids / Never | First 10 raids | Shared |
| Language | English (v1) | English | Local |

## 34.2 CONTROLS (KEYBOARD AND MOUSE)

| Setting | Range | Default |
|---|---|---|
| Mouse sensitivity (hip) | 0.05 to 10.0 (with cm/360 helper at the current DPI, entered by the player) | 1.0 |
| ADS sensitivity multiplier | 0.1 to 3.0 | 1.0 |
| ADS scaling method | Focal length (coefficient) / Per-optic manual | Focal length |
| Focal length coefficient | 0.0 to 2.0 | 1.33 |
| Per-optic sensitivity (if manual) | 1x, 2x, 3x, 4x, 6x, 8x, 12x+ | 1.0 each |
| Vehicle sensitivity | 0.1 to 5.0 | 1.0 |
| Invert Y | On / Off | Off |
| Raw input | On / Off | On |
| Magnification on mouse wheel | Ctrl + wheel / Wheel | Ctrl + wheel |
| Key bindings | Every action, primary and secondary | Part 33 |
| Presets | Default / Left-hand only / Mouse-heavy | Default |

## 34.3 CONTROLS (GAMEPAD)

| Setting | Range | Default |
|---|---|---|
| Horizontal sensitivity | 1 to 20 | 7 |
| Vertical sensitivity | 1 to 20 | 6 |
| ADS sensitivity multiplier | 0.1 to 2.0 | 0.8 |
| Response curve | Linear / Default / Dynamic | Default |
| Left stick deadzone inner / outer | 0 to 0.4 / 0.6 to 1.0 | 0.12 / 0.95 |
| Right stick deadzone inner / outer | 0 to 0.4 / 0.6 to 1.0 | 0.10 / 0.96 |
| Look acceleration | Off / Low / Default / High | Default |
| Aim assist | Off / Low / Default | Default |
| Vibration | Off / Low / Full | Full |
| Trigger effects (DualSense, if supported) | On / Off | On |
| Invert Y | On / Off | Off |
| Button layout | Default / Tactical (swap crouch and melee) / Custom | Default |
| Glyphs | Auto / Xbox / PlayStation | Auto |

## 34.4 GRAPHICS: DISPLAY

| Setting | Options | Default |
|---|---|---|
| Display mode | Fullscreen / Windowed fullscreen / Windowed | Windowed fullscreen |
| Monitor | List | Primary |
| Resolution | List of supported | Native |
| Frame rate limit | 30 / 60 / 90 / 120 / 144 / 165 / 240 / Unlimited | Display refresh (capped at 144 while hosting) |
| Frame rate limit in menus | 30 / 60 / 120 | 60 |
| V-Sync | On / Off | Off |
| NVIDIA Reflex (if supported) | Off / On / On + Boost | On |
| Brightness (calibration screen) | Slider with a calibration image ("adjust until the left symbol is barely visible") | Middle |
| HDR (if supported) | On / Off, with paper white and peak brightness sliders | Off |
| UI safe zone | 90% to 100% | 100% |

## 34.5 GRAPHICS: QUALITY

Preset (Low / Medium / High / Epic / Custom) plus the individual options. An "Auto-detect" button runs a 15 s benchmark (the flythrough from part 35) and picks a preset that hits 60 fps at the current resolution (or 30 on Steam Deck).

| Setting | Options | Notes |
|---|---|---|
| Upscaler | TSR / DLSS / FSR / XeSS / Off (native TAA) | Availability by GPU |
| Upscaler quality | Native AA / Quality / Balanced / Performance / Ultra Performance | |
| Frame generation (if available) | Off / On | Warning about latency |
| Sharpening | 0 to 1 | 0.3 |
| View distance | Low / Medium / High / Epic | |
| Shadows | Low / Medium / High / Epic | |
| Global illumination | Low (no Lumen) / Medium / High / Epic | Low = Steam Deck mode |
| Hardware ray tracing (if supported) | Off / On | Epic only |
| Reflections | Low / Medium / High / Epic | |
| Textures | Low / Medium / High / Epic | VRAM indicator |
| Effects | Low / Medium / High / Epic | Never affects smoke opacity (fairness) |
| Foliage | Low / Medium / High / Epic | Never affects gameplay-relevant cover (tall grass is cover on all settings; Low thins only decorative grass far away) |
| Post-processing | Low / Medium / High / Epic | |
| Shading | Low / Medium / High / Epic | |
| Water quality | Low / Medium / High / Epic | |
| Volumetric fog | Off / On (Low disables) | Fog density is the same on all settings: only the volumetric look changes |
| Volumetric clouds | Low / Medium / High / Epic | |
| Rain density | Low / Medium / High | Visual only |
| Scope rendering | Performance / Picture-in-picture | PiP on High+ |
| Motion blur | Off / Low / High | Off |
| Film grain | 0 to 1 | 0.2 |
| Chromatic aberration | On / Off | Off |
| Lens flares | On / Off | On |
| Depth of field (menus and cinematics) | On / Off | On |
| Screen rain droplets | On / Off | On |
| Character detail distance | Low / Medium / High | |

Fairness rule for graphics settings (enforce it in the scalability configs and test it): no setting may reduce fog density, smoke opacity, foliage that provides cover, rain visibility of characters, or darkness in a way that gives an information advantage. Low settings may look worse; they may not see more.

## 34.6 AUDIO

| Setting | Range | Default |
|---|---|---|
| Master | 0 to 100 | 80 |
| Effects | 0 to 100 | 100 |
| Weapons | 0 to 100 | 100 |
| Footsteps and foley | 0 to 100 | 100 |
| Ambience | 0 to 100 | 80 |
| Radio (Sparks) | 0 to 100 | 90 |
| Music (raid stingers) | 0 to 100 | 60 |
| Music (Halcyon) | 0 to 100 | 70 |
| UI | 0 to 100 | 70 |
| Squad voice | 0 to 100 | 100 |
| Proximity voice | 0 to 100 | 100 |
| Output device | List | System default |
| Spatial audio | Stereo speakers / Headphones (HRTF) | Asked at first launch |
| Dynamic range | Wide / Medium / Narrow (night mode) | Medium |
| Mono audio | On / Off | Off |
| Hit marker sound | On / Off | On |
| Squad voice radio effect | On / Off | On |
| Mute when game is in background | On / Off | Off |

## 34.7 VOICE CHAT

| Setting | Options | Default |
|---|---|---|
| Voice chat | On / Squad only / Off | On |
| Input device | List | System default |
| Input volume | 0 to 200% | 100% |
| Transmit mode (squad) | Push to talk / Voice activation | Push to talk (KBM), Voice activation (gamepad) |
| Transmit mode (proximity) | Push to talk / Voice activation / Off | Push to talk |
| Voice activation threshold | Slider with a live mic meter | Middle |
| Mic test | Button: hear yourself with the radio effect | |
| Mute all non-squad | On / Off | Off |
| Noise suppression | On / Off | On |

## 34.8 ACCESSIBILITY

Part 33.5 lists them all: colorblind mode and intensity, UI scale, text size, subtitles (on/off, size, background, speaker colors), sound captions (on/off, size, which categories), night readability boost, camera shake, head bob, weapon visual sway, screen effects intensity, flash intensity, reduce motion, exact ammo count, loot glints, crosshair style, always-show dot, auto-complete holds, mash-to-hold, control hints, photosensitivity mode (a single toggle that sets flash intensity 50%, disables lightning screen flashes and strobing lights, and reduces film grain).

## 34.9 HUD

| Setting | Options | Default |
|---|---|---|
| HUD preset | Default / Minimal / Competitive / Custom | Default |
| Per element visibility (compass, squad, contracts, health, stamina, weapon, quick slots, weather, pickup feed, interaction prompt) | Always / Contextual / Never | Contextual for most |
| HUD opacity | 30% to 100% | 90% |
| HUD scale | 70% to 130% | 100% |
| Ultrawide HUD | 16:9 center / Full width | 16:9 center |
| Hit markers | On / Off, with style | On |
| Headshot marker | On / Off | On |
| Damage direction indicator | On / Off | On |
| Squadmate outline color | 6 options | Cyan |
| Squadmate outline through walls | On / Off | On |
| Ping color | 6 options | Amber |

## 34.10 ACCOUNT

Callsign (with the 30-day rule), friend code (copy), linked accounts (Link Epic Account, Tier 2), privacy notice (link), "Download my data" (Tier 3: a JSON export of profile, stash and stats via the backend), "Delete my account" (with typed confirmation), and the backend region display.

## 34.11 NETWORK AND DIAGNOSTICS

Show network stats overlay (off / simple: ping, packet loss / full: ping, loss, bandwidth in/out, server tick on the host), show FPS (off / FPS / FPS + frame time graph), report a bug (opens a form: description, attaches the last 2 minutes of logs, a screenshot, the build number and the raid ID if any, and sends it to the backend `POST /v1/bugreports`; Tier 2), and "Clear shader cache" (forces a PSO recompile on next launch).

## 34.12 SETTINGS ACCEPTANCE TESTS

Every setting changes what it says it changes, persists across restarts, and resets to its default.

Shared settings sync: change sensitivity on one machine, log in on another (with a linked account), and the value is there.

No graphics setting breaks the fairness rule (the smoke fairness test, a fog visibility test at Low vs Epic, and a foliage cover test: a crouched player in tall grass at 40 m must be equally hidden on all presets).

---

End of part 34. Next: `35_PERFORMANCE_BUDGETS.md`.
