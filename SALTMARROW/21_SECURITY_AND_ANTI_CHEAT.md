# SALTMARROW: PART 21, SECURITY, FAIRNESS AND ANTI-CHEAT

A game shared among friends doesn't need a kernel anti-cheat. It does need to stop the casual stuff: memory editors giving someone infinite Scrip, a modified client claiming hits it never made, a duplicated Leviathan. And it needs to protect the backend from the internet, because the API is on the internet whether we like it or not. This part says what we protect, how, and what we accept.

---

## 21.1 THE THREAT MODEL

Ranked from most to least likely, with our stance:

1. A curious player edits local files or memory to change what they see (e.g. brighter nights, removed fog). Stance: partially mitigated (no client-side gameplay authority, settings clamps, server-side fog of war via relevancy). We accept that someone can make their own screen brighter.
2. A player uses a memory editor to change their ammo count or health locally. Stance: fully mitigated. The server owns all gameplay state; local changes do nothing but desync their own display.
3. A player uses a modified client to send fake shots (aimbot or "silent aim"). Stance: partially mitigated by server validation of shot origin and direction (plausible, not perfect). An aimbot that sends plausible shots can't be detected by validation alone. Later: statistical detection (21.5) and EOS Anti-Cheat (Tier 4).
4. A player sees enemies through walls (wallhack). Stance: mostly mitigated by the server-side LOS relevancy filter (part 18), which means the client simply doesn't have positions of enemies it can't see. Sounds still reveal positions (by design).
5. A hosting player cheats as the host (god mode, spawning loot). Stance: partially mitigated by backend validation of the loot manifest, reports and the ledger. A host can still, for example, make themselves invulnerable in a raid. We accept that risk for a friends game and flag implausible raids.
6. Someone attacks the backend API (credential stuffing, injection, abuse of endpoints, DoS). Stance: mitigated by standard API security (21.3).
7. Someone duplicates items through race conditions. Stance: fully mitigated by transactions, versions, idempotency and the ledger.
8. Someone impersonates another player or steals a session. Stance: mitigated by EOS identity verification, short-lived JWTs and refresh token rotation.

## 21.2 CLIENT AND SERVER INTEGRITY RULES

These are coding rules. Violating one is a bug, even if it "works".

The server is the authority for: health, damage, death, ammo, inventory contents, item creation and destruction, loot contents, extraction, AI, the Surge, contract progress, XP. The client is the authority for nothing except its own inputs and its own cosmetic presentation.

Every Server RPC validates its inputs. Every `Server*` function has a `_Validate` (or the equivalent checks at the top of the implementation; use `WithValidation` where the check is cheap and a failure means the client is lying, which disconnects the client). Validate parameters for range (no NaN, no huge values), ownership (the actor belongs to the caller), state (the action is possible now), rate (actions per second within limits) and distance (interactions within reach).

No gameplay values from the client: never accept damage amounts, item IDs that the server didn't create, positions for anything but the client's own movement (and those go through CMC's validation), or timestamps the server can't sanity-check (shot timestamps must be within the last 400 ms of server time).

Shot validation (from part 05): origin within 0.5 m of the server-side muzzle position at the claimed time (computed from the server's rewound character pose), direction within the weapon's max spread plus recoil plus a tolerance (4°) of the server's view rotation for that character at that time, fire rate within the weapon's RPM plus 10%, ammo available. Shots failing validation are dropped and counted. Ten dropped shots in a minute flag the player (telemetry, part 38). Fifty disconnect them with a "Network validation failed" message.

Movement validation: CMC's server checks. Additionally, track "correction rate" per player; persistent large corrections flag possible speed hacks.

## 21.3 BACKEND SECURITY

Transport: HTTPS only (Railway provides TLS on its domains). HSTS header.

Auth: every endpoint except `/status`, `/auth/eos` and `/auth/refresh` requires a valid session JWT. Raid host endpoints additionally require the raid ticket and check that the caller is the raid's host.

Authorization: every query is scoped by the authenticated player ID. A player can never read or modify another player's stash, contracts or stations. Write a test for every endpoint that tries it with another player's IDs and expects 403/404.

Input validation: every request body and query is validated by its JSON Schema (TypeBox). Unknown fields are rejected (`additionalProperties: false`). String lengths are capped. Array sizes are capped (e.g. 200 stash ops per batch).

SQL: Drizzle's parameterized queries only. No string-built SQL. Raw SQL (migrations, rare queries) uses parameters.

Rate limits and idempotency: part 19.

Secrets: environment variables in Railway only, never in the repo. Rotate `JWT_SIGNING_KEY` with overlap support (accept the old key for 1 hour after rotation). Log redaction: never log tokens, the admin token, or full request bodies for auth endpoints.

Dependencies: `npm audit` in CI, Dependabot or Renovate for updates (on GitHub, free), lockfile committed.

CORS: the API doesn't need browser access except from the web service (for the status page). Allow only the web service's origin.

DoS: Railway's edge provides basic protection. The api enforces body size limits (1 MB default, 8 MB for checkpoints, 3 MB for the speedtest), request timeouts (10 s), and rate limits. If the game ever gets popular enough to attract real attacks, put Cloudflare in front (ask me first).

Admin: admin endpoints require the admin token and are only reachable with it; log every admin action.

## 21.4 ECONOMY INTEGRITY

Covered across parts 12, 19 and 20. The summary of guarantees:

Items can only be created by the backend (purchases, crafting, contract rewards, admin grants) or by a raid's loot manifest (validated for plausibility).

Items can only move between players through a raid where both were present (looted from a body or dropped and picked up), validated by the ledger.

Every item instance exists in at most one place. The database's primary keys and the ledger's claims enforce it.

Scrip can only change through backend operations, each in a transaction with its cause logged.

No client-side operation can create, duplicate or teleport items.

## 21.5 STATISTICAL CHEAT DETECTION (TIER 3)

Telemetry (part 38) records per player per raid: shots fired, hits, headshots, hit rate by distance, reaction times (time from an enemy becoming relevant to the first shot at them), kills through smoke, kills of non-visible targets (the server knows whether the target was relevant to the shooter's client at the time), damage dealt vs taken, extraction value.

A worker job computes per-player rolling statistics and flags outliers: headshot ratio over 60% with more than 30 kills, average reaction time under 150 ms, hits on non-relevant targets (should be zero; any is suspicious, because the client shouldn't know where they are), loot value extracted over 5x the median repeatedly. Flags go to an admin review list. No automated bans. I review flags.

## 21.6 EOS ANTI-CHEAT (TIER 4)

EOS provides a free anti-cheat service (Easy Anti-Cheat via EOS) for games using EOS, with a client-server mode that works with listen servers through peer-to-peer protection mode. If cheating becomes a real problem, integrate it: it needs the game's build to be processed with the EAC tooling, a bootstrapper launcher, and some configuration in the dev portal. It also affects Steam Deck/Proton compatibility (EAC supports Proton if enabled in the dev portal). Not in v1.

## 21.7 PLAYER SAFETY

Text input: callsigns, engraving text, tattoo text and contract notes (none) are filtered against a profanity and slur list (a curated list in the backend, applied server-side; the client also filters for instant feedback). There is no text chat in v1 (voice only), which removes a whole category of moderation.

Voice: mute per player, mute all non-squad, and report. No recording of voice.

Reports: stored for my review with raid context (who was in the raid, the reporter's and reported's results).

Blocking: blocking a player prevents them from inviting you, joining your squad, and matchmaking into your hosted raid (the host's PreLogin rejects blocked PUIDs; the backend gives the host its squad's block list at raid creation).

Privacy: the backend stores the PUID, the callsign, gameplay data and telemetry. No email, no real name, no IP address stored beyond request logs (Railway's logs; set a retention you're comfortable with). Write a short privacy notice for the download page (part 36) describing exactly that, and a "Delete my account" option in Settings > Account that calls `DELETE /v1/profile` (soft-deletes the player and anonymizes their data after 14 days).

## 21.8 SECURITY ACCEPTANCE TESTS

Every authenticated endpoint rejects requests without a JWT, with an expired JWT, and with another player's resources.

Every Server RPC rejects out-of-range inputs (a fuzz test sending random values to every RPC from a test client must never crash the server or change state incorrectly).

A client that sends shots with origins 2 m from its muzzle gets them dropped and gets flagged.

A modified client that claims to pick up an item 10 m away gets rejected.

A raid report claiming an item not in the ledger is rejected and the raid flagged.

A raid report replayed twice commits once.

The LOS relevancy test (part 18) passes: no enemy player positions reach a client that can't see them.

---

End of part 21. Next: `22_UI_STYLE_GUIDE.md`.
