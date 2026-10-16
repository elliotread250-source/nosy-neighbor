# SALTMARROW: PART 23, THE HALCYON SCREENS (OUT-OF-RAID UI)

Every out-of-raid screen, laid out region by region, with its data sources, interactions and states. The Halcyon is a 3D scene behind every screen: each screen has a camera spot on the ship, and moving between screens moves the camera. The menus feel like walking around your home, not clicking through a spreadsheet.

---

## 23.1 THE HALCYON MENU SCENE

Level `L_Halcyon_Menu`: the ferry at anchor at dusk (or the current real-world time of day mapped to a few lighting presets, a nice touch: morning, afternoon, dusk, night by the player's local clock), with the islands on the horizon, the lighthouse sweeping, gulls, rain on some days, and the ship's lights on. It's a contained scene, small and cheap to render (target 120 fps on the reference GPU on Medium), built from the same kit as the island plus the ship's own meshes.

Camera spots (each a `ASMMenuCameraSpot` with a transform, FOV, depth of field focus distance and a post-process tweak):

| Screen | Spot | What's in frame |
|---|---|---|
| Title | Bow observation deck | The islands across the water, the lighthouse, the player's character silhouette at the rail on the right (only after first login) |
| Main (Halcyon home) | Car deck, wide | The player's character standing in the middle of the market, traders' stalls in the background |
| Play / Raid setup | Stern boat ramp | A boat waiting, the squad's characters on the ramp (squadmates appear as their own characters when they join) |
| Loadout | Cabin, deck 5 | The character standing in front of a locker with gear on hooks |
| Stash | Cabin, deck 5, looking down at the open footlocker | The footlocker's contents are not literally modeled; the stash UI overlays the scene |
| Gunsmith | Workbench on the car deck | The weapon on the bench under a lamp (the 3D gunsmith view, part 08) |
| Traders | Each trader's station | The trader NPC at their counter, animated idle, looking at the player |
| Halcyon (stations) | The ship's bridge, looking at a big hand-drawn schematic of the ship on the chart table | Station icons on the schematic |
| Salvager (appearance) | Cabin mirror | The character's reflection |
| Journal | The player's cabin desk | The Journal as a notebook open on the desk |
| Settings | Bridge, close on the wheel and instruments | |

Squadmates in the menu scene: when friends are in your squad, their characters appear next to yours on the car deck and on the boat ramp, in their own outfits, idling (and emoting when they use emotes in the menu, which is a fun little social layer). That's done locally from the squad lobby's member attributes (each member publishes their appearance hash; the client loads their appearance from the backend `GET /v1/players/{id}/appearance` once).

## 23.2 TITLE SCREEN

Layout: the logotype top-left at 10% from the edges. "Press any key" centered at 75% height, `Title.S`, pulsing gently (opacity 60% to 100%, 1.6 s period). Bottom-left: build number and region in `Num.S` `Fog`. Bottom-right: status (a small dot: green "Online", amber "Connecting", red "Offline: playing offline" with a reason). If there's news from `/status`, a small paper card bottom-right above the status with the latest headline.

Behavior: auth starts immediately on load (part 03). On key press, if auth succeeded, go to Main (or the first-time callsign and character flow). If auth failed: a modal with the reason and "Retry" and "Play Offline (Practice only)". If the client is too old: a modal "A new version is available" with "Download" (opens the release URL in the browser) and "Quit".

First-time flow: callsign modal (part 01), then the character creator (part 10's SALVAGER screen with a "Continue" button and a big "Randomize"), then Main with the Shakedown prompt.

## 23.3 MAIN (HALCYON HOME)

Left rail (the main navigation): the logotype small at the top, then large buttons in `Title.M`: PLAY, LOADOUT, STASH, GUNSMITH, TRADERS, HALCYON, SALVAGER, JOURNAL, then smaller: SETTINGS, QUIT. Each button has an icon. The selected one has a brass marker. Badges: a small orange dot on TRADERS when a contract can be handed in, on HALCYON when a station upgrade or craft is complete, on JOURNAL when there's an unread entry.

Top bar (spans the screen): Scrip balance, account level with an XP bar (thin, brass), the squad panel trigger (shows 1/3 to 3/3 with squadmate avatars), friends icon with an online count, notifications bell.

Right panel (context): "Today on the Halcyon": the 3 daily contracts with progress, the next station completion time, a news card, and Sparks's "forecast" line (flavor: "Fog this morning. Expect visitors." changes per day).

Center: the 3D scene. The character is clickable (opens SALVAGER). Traders in the background are clickable (open their trader page).

### 23.3.1 The squad panel

A slide-out from the top bar (or always visible in the PLAY screen): three slots. Slot 1 is you (or the leader). Each slot shows the member's banner, callsign, level, status (In menus, Ready, In loadout, Not ready), and a crown on the leader. Empty slots show "+ Invite" which opens the invite panel: your friend code (big, `Num.L`, with a Copy button), a field to enter a friend's code, a list of online friends with Invite buttons, and recent players. Leader actions on members: Promote, Kick. Member actions: Leave Squad.

Incoming invites appear as toasts with Accept/Decline, and in the notifications bell for 2 minutes.

## 23.4 PLAY / RAID SETUP

Layout: left: raid types as large cards (Standard, Shakedown, Night (locked until level 10, showing the lock reason), Skirmish (Tier 3), Practice). Each card has an illustration, a one-line description, the duration, the player count, and risk ("Your gear is at risk" in `Flare` for Standard and Night; "Nothing is at risk" in `Kelp` for Shakedown and Practice). Center: the boat ramp scene with your squad. Right panel: settings for the selected raid type.

Standard raid settings (leader only, members see them read-only): Matchmaking (Join or Host / Host only / Private with password), Region (Auto, with the detected region shown), Max players when hosting (2 to 12, default 12), Insertion preference (Any / West / East: a soft preference, level 8 unlock). With the Radio Room station at L1, the forecast ("Surge expected from the SW") appears in the lobby gathering screen. The direction comes from the raid seed, which only exists once the raid is created, so it can't be shown before matchmaking.

Loadout check strip: across the bottom, each squad member's loadout summary (primary weapon icon, armor class, backpack size, total value), with a warning icon if someone has no weapon or no medical items ("Kitt has no medical supplies"). A "Scav run" toggle per player (if the cooldown is ready: "Go in as a Scavenger: free random kit, nothing to lose").

Ready flow: each member presses READY (after checking their loadout). The leader's button becomes START when all are ready (or the leader can force start after 30 s with a confirm). START begins matchmaking (part 18): the center shows a status ("Searching for a raid...", then "Joining Gull#4471's raid (2 of 4 squads)", or "Hosting: waiting for squads 0:47", with a "Start Now" button for the host), and the right panel shows the raid lobby: the squads that have joined (as anonymous "Squad 2: 3 salvagers", never names: you don't know who's on the island), the region and the host's ping.

Deploy: when the raid starts, the screen fades into the boat ride (part 03).

## 23.5 LOADOUT

The screen where you choose what to risk. Left: the equipment doll (the character's silhouette with slots around it: Primary, Secondary, Holster, Melee (fixed), Helmet, Face, Ears, Armor, Rig, Backpack, Secure Pouch, Radio (fixed), Compass (fixed), plus Pockets ×4 and Quick Slots 1-6). Center: the containers: the rig's pouch layout, the backpack's grid, the pockets, the secure pouch. Right: the stash, filtered and searchable, to drag from.

Top: loadout value (total Scrip value at risk), weight (with thresholds), and a Build selector (save and load whole loadout presets, Tier 2: "Loadout Kits", up to 10, using the same assemble-from-stash logic as gunsmith builds, with a "buy missing" option).

Ammo check: each weapon slot shows a magazine summary (mags in rig and their fill) and a warning if no spare magazines are packed. "Auto-fill magazines" button (loads matching ammo from the stash into all empty or partial mags in the loadout, preferring the ammo type you choose from a dropdown per caliber).

Medical check: a summary of healing items with icons for which status effects you can treat (bleed, heavy bleed, fracture, pain), greyed if missing.

Insurance: not in v1 (part 03).

## 23.6 STASH

Full-screen grid with the category tabs on top (All, Weapons, Attachments, Ammo, Armor, Gear, Medical, Food, Valuables, Salt, Keys, Notes, Barter) and a search field. Tabs filter by highlighting and dimming, never by hiding (positions matter; hiding would make the grid jump). Right panel: selected item details (the full tooltip content, permanently, plus actions: Inspect, Sell (opens a quick-sell to the best-paying trader with the price shown), Modify (weapons: opens the gunsmith), Use (consumables: some can't be used out of raid), Discard, History).

Bottom bar: stash capacity (cells used / total), total stash value (estimated), "Auto-sort", "Unsorted" (if overflow items exist: a badge and a panel listing them).

Inspect view: opens a 3D viewer of the item (rotatable, zoomable) with its description on a paper card and its stats. For weapons, the inspect view is a light version of the gunsmith (rotate, zoom, field strip toggle, "Open in Gunsmith" button). For notes: the note's full text rendered on paper (typewriter or handwriting style per note).

Containers in the stash (cases) open in a floating window over the grid (draggable, closable, multiple can be open).

## 23.7 GUNSMITH

Part 08 specifies the interactions. Layout: center: the 3D bench view with slot markers. Left panel: the weapon selector (weapons in your stash as a vertical list with icons and names; the selected weapon on the bench), plus Builds and Presets (tabs). Right panel: top: the stat sheet (stat bars with deltas, part 22); bottom: the part list for the selected slot (In stash / From traders / Locked). Bottom bar: Undo, Redo, Field Strip, Test Fire, Save as Build, Reset (back to the state when you opened it), Done.

Top bar inside the screen: the weapon's name (editable nickname: players can name their guns, up to 20 characters, filtered: "Margaret"), its total value, weight, and a durability readout per major part (receiver, barrel).

Cosmetics tab (a toggle at the top: FUNCTION / FINISH): switches the right panel to finishes, wear override, charm and engraving (part 10), with the 3D view updating live.

The part list item row: icon, name, manufacturer, the key stat deltas (2 or 3 most relevant for its category: a muzzle device shows recoil and sound; an optic shows ADS and zoom), price or "In stash ×2", and the source trader icon.

## 23.8 TRADERS

Top: four trader portraits as tabs (with their name, title and loyalty level in brass pips). Selecting one moves the camera to their station, where the NPC greets the player (a voice line or a text bubble: part 44 has the lines).

Each trader page has sub-tabs: BUY, SELL, BARTER, CONTRACTS, SERVICES (repairs for Tomasz, healing nothing in v1, fuel for Nils, salt appraisal for Agnes).

BUY: a grid of the trader's stock (item cells with price tags, remaining stock, loyalty locks), filters by category, and a basket. Clicking an item adds it to the basket (or buys instantly with Shift-click). The basket panel on the right lists items, total, and "Buy all" (one transaction). Items go to the stash (auto-placement; if there's no room, the purchase fails before charging with "Not enough stash space for 3 items").

SELL: the player's stash on the left, the sell basket on the right. Drag items to the basket (or Ctrl-click). The basket shows each item's price from this trader and the total, and notes items this trader won't buy (greyed, with "Nils would buy this for 6,200" hints: show the best trader's price). "Sell all" confirms. A filter "Show only items this trader buys".

BARTER: offers of item-for-items trades, each showing what you give (with checkmarks for what you have) and what you get.

CONTRACTS: three columns: Available (cards on paper: title, trader's description, objectives, rewards, an "Accept" stamp button), Active (with progress bars per objective, Pin toggle, Abandon), Completed (collapsed by default). Hand-over objectives have a "Hand over" button that opens a picker of matching items.

Trader dialogue: a speech line appears in a paper speech card under the trader's portrait when you open their page, when you buy something big, when you complete their contract, and when you level loyalty. In v1 these lines aren't voiced (no voice actors); they're text with a typewriter reveal and a small sound per line.

## 23.9 HALCYON (STATIONS)

The ship schematic on the chart table: a hand-drawn side elevation of the Halcyon (an illustrated texture) with station markers at their locations on the ship. Each marker shows the station icon, level pips, and a state (Available to upgrade, Building with a countdown, Max level). Clicking a marker opens its panel on the right: the station's description, current level effects, next level effects, requirements (Scrip, items with have/need counts, account level, other stations), build time, and an "Upgrade" button. Crafting stations have a CRAFT tab with recipes (inputs, output, time, "Craft" button, the queue).

A "Go to station" button moves the camera to the station's actual location on the ship (a small reward for upgrading: the station visibly changes as it levels up; the Stores locker gets bigger, the Gunsmith Bench gets more tools on its pegboard, the Boathouse gets the boat).

## 23.10 SALVAGER (APPEARANCE)

Part 10.11.

## 23.11 JOURNAL

The notebook on the cabin desk, opening to tabs: NOTES (every note read, grouped by location, with the note's text on paper), CONTRACTS (completed contract stories), BESTIARY (each enemy type with an illustration, description, known weaknesses unlocked by killing them: after 10 kills the weak point is noted, after 50 the behaviors, after 100 a lore entry), CODEX (weapons and attachments you've used, with stats and kill counts), MAP (the island map with POIs you've visited, annotated in pencil), LORE (entries unlocked by contract chains and notes), RECORDS (your lifetime stats: raids, extracts, kills, longest kill distance, most valuable extraction, favorite weapon, survival rate).

## 23.12 THE POST-RAID SUMMARY

Shown after extraction, death or MIA (in sequence; each page has Continue):

Page 1, Outcome: big status word (EXTRACTED in `Kelp`, KILLED in `Flare`, MISSING IN ACTION in `Fog`), raid time, extraction point or place of death, and (if killed by a player) the killer's banner, callsign, weapon (with its icon rendered from its actual config: you get to see the gun that killed you), distance, and the body part hit. If killed by AI, the AI type and an illustration. A small "kill feed" timeline of the raid's key moments for you (spawned, first kill, Surge 1, downed, revived, killed).

Page 2, Haul: items gained (cells in a grid with values), items lost, the net value change, and Scrip found.

Page 3, Progress: XP breakdown (sources with values, counting up), level up animation if applicable, reputation changes, contract progress (with completions stamped), mastery progress, unlocks.

Page 4, Squad (if in a squad): each squadmate's outcome and key stats, and "commend" buttons (Tier 3: a light social reward).

Then back to Main. The summary data comes from `GET /v1/raids/{id}/result`; while it's pending, show page 1 (which the client knows) and a "Tallying your haul..." spinner for pages 2 and 3.

## 23.13 LOADING AND DEPLOYMENT

The boat ride (part 03): a 20 s in-engine sequence on the boat crossing toward the island, with the squad's characters on board, rain or calm per the raid's weather (seeded, so this matches the raid), the island growing on the horizon, and a lower-third overlay: raid type, insertion point name, "Surge forecast: SW" (if Radio Room), and Sparks's opening line. If loading takes longer than the ride, the boat circles in fog (a loop) with a "Waiting for the island..." indicator. Loading the raid map is done during this sequence (async level streaming of the start zone first, then the rest).

Between raids, the return trip is a short cut: the Halcyon at dusk, the boat pulling up the ramp (5 s), skippable.

## 23.14 SCREEN ACCEPTANCE TESTS

Every screen has: a gamepad path to every control, an empty state (empty stash, no contracts, no friends), a loading state, an error state (backend unreachable: the screen shows cached data read-only with a banner "Offline: changes disabled"), and behaves correctly at the target resolutions.

The full flow (title → login → main → loadout → play → raid → summary → main) has no dead ends: from any screen, Back reaches Main, and Main reaches every screen.

---

End of part 23. Next: `24_UI_IN_RAID_HUD.md`.
