# SALTMARROW: PART 52, SKIRMISH MODE (TIER 3)

Skirmish is the "send it to anyone" mode: quick, round-based PvP with no persistence and no risk, for friends who want to shoot each other for twenty minutes without learning the extraction loop. It reuses everything (weapons, the gunsmith, movement, the map's districts, the Surge as a closing zone) and adds a small round framework. Part 03.3.4 introduced it. This part specifies it.

Build it only after Release 0.2. It's Tier 3 because it must not distract from the core loop, but it's cheap once the core exists, and it's the mode most likely to bring in friends who'd never try Standard raids.

---

## 52.1 THE FORMAT

Teams: 2 to 4 teams of 1 to 3 (squads), so 1v1 up to 3v3v3v3. Default: two teams of up to 3.

Rounds: first to 5 round wins (configurable: 3, 5, 7). A round ends when one team remains alive, or at the round timer (3:00), at which point the team with the most surviving players wins, with total remaining HP as the tiebreak.

No respawn within a round. Downed state is on (revives allowed), so squad play matters.

Arenas: compact sections of the island, each a bounded play space with a team spawn on each side and a center: Harbourside Quay (the quay, the Drowned Man, the net lofts and Fish Lane: 160 × 90 m), The Cannery (the cannery interior and yard: 80 × 60 m, vertical), The Terminal (the yard, cars, the coach and the building: 120 × 80 m), High Street Square (the square, the bank, the police station and the wynds' tops: 140 × 70 m), St. Brendan's (the church, graveyard and manse: 120 × 100 m, the tower is open), The Power Station (the compound: 150 × 100 m, long sightlines), Kirk Holm (the ruined hospital and graveyard: 100 × 80 m), The Orla Brae (the wreck: both halves and the mast bridge, 90 × 30 m, ultra close quarters). Invisible walls at arena bounds are replaced by the in-fiction boundary: water (the Surge) and fences, with a "Leaving the area" warning and 5 s to return before taking 20 HP/s.

## 52.2 THE SURGE AS A CLOSING ZONE

Each round, after 1:30, the water rises from the arena's edges toward the center over 1:00 (a flood front, using the same flood volumes and rendering: the arena's zones flood in an order designed per arena so the last dry ground is a contested center: the bank's steps, the church tower base, the cannery mezzanine). Players in water deeper than 0.6 m take 8 HP/s cold damage (Skirmish-only rule). It's a shrinking zone that looks and sounds like the real Surge, short and sharp.

## 52.3 LOADOUTS AND ECONOMY

Two loadout rules, set in the lobby:

Presets: everyone picks from 8 preset kits per round (Rifleman: Mako "Harbor Patrol" + Kestrel + Class 3; Marksman: Fathom "Scout" + Kestrel + Class 2; CQB: Breaker "Door Knocker" + Kestrel + Class 4; SMG: Fulmar "SD" + Class 3; Heavy: Bora-L + Class 4; Old School: Bora "Bog Standard" + Sever + Class 3; Lever: Tern + Rook + Class 2; Wild Card: a random kit, including the Bilge Pump, the Jury and the Pipe), plus 2 bandages, 1 IFAK, 1 splint, 1 frag or 1 smoke.

Builds: players can bring copies of their own gunsmith Builds (part 08.7), using every part in the catalog they have unlocked (owned at least once), with a points budget per round to keep it fair: each part has a Skirmish point cost (rarity-based: Common 1, Uncommon 2, Rare 4, Epic 7, Legendary 12; weapons cost 5 to 20), and the budget is 40 points for primary + armor + secondary + throwables. Nothing is consumed: these are copies.

Between rounds (15 s buy phase in the spawn area), players can switch kits.

## 52.4 WIN CONDITIONS AND SCORING

Round win: last team standing, or the timer rule. Match win: first to N rounds. Scoring per player (for the summary only): kills, assists (damage contributed within 10 s of a kill), revives, damage dealt, rounds survived.

XP: Skirmish gives a small amount of account XP (300 per match win, 150 per loss, capped at 1,500 per day) and weapon mastery progress at 25% of Standard rates. No Scrip, no items, no contract progress (except a few Skirmish-specific dailies). It's for fun, not for farming.

## 52.5 LOBBY AND MATCHMAKING

Private matches (default): the squad leader creates a Skirmish lobby (an EOS lobby with the skirmish bucket), shares a 6-character lobby code (or invites friends directly), players join, pick teams (or auto-balance by account level), the host picks the arena, the rounds, the loadout rule and the team count, and starts.

Public matches (Tier 4, if there are enough players): quick-join into open Skirmish lobbies by region.

Hosting: listen server, same as raids, with the same host selection logic (part 18.6.3).

## 52.6 THE SKIRMISH HUD

The raid HUD (part 24) plus: a top-center round score (team colors and round wins), the round timer, team alive counts, and a kill feed (Skirmish only: short, top right, "Gull [Mako] Kitt"). Enemies never get outlines; the kill feed and the alive counts are the only extra information.

Team colors: Team 1 cyan (`Sea`), Team 2 orange (`Signal`), Team 3 purple, Team 4 yellow, each with a distinct icon shape for colorblind players.

Friendly fire: on (as in raids), at 50% damage in Skirmish to reduce frustration.

## 52.7 THE SKIRMISH SUMMARY

After the match: the winner banner, each player's stats, the MVP (most damage plus revives weighting), a "Play again" button (same lobby, same settings), and "Back to the Halcyon".

## 52.8 BALANCE NOTES FOR SKIRMISH

The arena sizes and preset kits should produce round lengths of 60 to 150 s. Telemetry: round duration distribution, kit pick rates and win rates per arena. If one kit wins more than 60% of rounds on an arena with a fair sample, adjust that kit or that arena's sightlines.

## 52.9 SKIRMISH ACCEPTANCE TESTS

A 3v3 match of 5 rounds on each arena runs start to finish with bots and with humans.

The flood front closes each arena so that the last dry area is the designed center, every time, for every arena.

Build budget enforcement rejects over-budget builds in the lobby (client) and on the host (server).

No Skirmish outcome writes to the stash.

---

End of part 52. Next: `53_DECISIONS_FAQ.md`.
