# SALTMARROW: PART 20, BACKEND API REFERENCE

Every endpoint the game uses, with its request, response and errors. Base URL: `https://<api domain>/v1`. All requests and responses are JSON (`Content-Type: application/json`), except checkpoint uploads (`application/octet-stream`). All mutating requests carry `Idempotency-Key`. Authenticated requests carry `Authorization: Bearer <session jwt>`. Host-only raid endpoints additionally carry `X-Raid-Ticket: <ticket>`.

Generate an OpenAPI 3.1 document from the Fastify route schemas (`@fastify/swagger`), served at `/v1/openapi.json` in staging only. Generate the Unreal client's request/response structs from it with a small script (`tools/gen-api-structs.ts` that writes `Source/SaltmarrowOnline/Public/Api/SMApiTypes.generated.h` with `USTRUCT`s and `FJsonObjectConverter`-compatible properties). Never hand-write a struct that mirrors an API type.

---

## 20.1 CONVENTIONS

### 20.1.1 Errors

Every error has the shape:

```json
{ "error": { "code": "STASH_VERSION_CONFLICT", "message": "Stash changed on the server.", "details": { "currentVersion": 412 } } }
```

Codes are stable strings; messages are for logs, not for players (the client maps codes to localized text). Common codes: `UNAUTHORIZED`, `SESSION_SUPERSEDED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `CLIENT_TOO_OLD`, `MAINTENANCE`, `INSUFFICIENT_SCRIP`, `ITEM_NOT_OWNED`, `ITEM_LOCKED`, `STASH_VERSION_CONFLICT`, `STASH_NO_SPACE`, `GUNSMITH_INVALID`, `TRADER_LOCKED`, `OUT_OF_STOCK`, `CONTRACT_NOT_AVAILABLE`, `STATION_REQUIREMENTS`, `RAID_NOT_FOUND`, `RAID_STATE`, `RAID_TICKET_INVALID`, `SCAV_COOLDOWN`, `LEDGER_REJECTED`.

### 20.1.2 Versioning and client builds

Every request carries `X-Client-Build: <build number>` and `X-Catalog-Version: <catalog version>`. If the build is below `MIN_CLIENT_BUILD`, the response is 426 with `CLIENT_TOO_OLD` and a `downloadUrl` (the client shows the update prompt, part 36). If the catalog version isn't in the accepted list, 409 `CATALOG_MISMATCH`.

### 20.1.3 Caching

GETs that return large static-ish data (`/traders`, `/catalog/manifest`) return `ETag` headers; the client sends `If-None-Match` and gets 304 when unchanged.

### 20.1.4 IDs

Item IDs are UUIDs. Definition IDs (items, weapons, attachments, contracts, stations, cosmetics) are catalog strings like `WPN_Mako`, `OPT_LumenR2`.

## 20.2 STATUS AND AUTH

### GET /status (no auth)

Response:
```json
{
  "ok": true,
  "maintenance": false,
  "region": "eu",
  "serverTime": "2026-10-16T21:14:03.120Z",
  "minClientBuild": 1042,
  "latestClientBuild": 1057,
  "downloadUrl": "https://github.com/<owner>/<repo>/releases/latest",
  "news": [ { "id": "n12", "title": "Night raids are here", "body": "...", "date": "2026-10-14" } ],
  "acceptedCatalogVersions": ["1057", "1056"]
}
```

### POST /auth/eos (no auth)

Request:
```json
{ "eosIdToken": "<jwt>", "displayName": "Gull", "platform": "win64", "build": 1057 }
```
Response 200:
```json
{
  "jwt": "<session jwt>", "jwtExpiresIn": 3600,
  "refreshToken": "<opaque>",
  "player": { "id": "0192f...", "callsign": "Gull", "discriminator": 4471, "friendCode": "K7Q2MX", "isNew": true, "accountLevel": 1 }
}
```
Errors: `UNAUTHORIZED` (token invalid), `FORBIDDEN` (banned; `details.bannedUntil`).

### POST /auth/refresh (no auth)

Request `{ "refreshToken": "..." }`. Response `{ "jwt": "...", "jwtExpiresIn": 3600, "refreshToken": "<new>" }`.

### POST /auth/logout

Invalidates the refresh token.

## 20.3 PROFILE

### GET /profile

Response:
```json
{
  "id": "0192f...", "callsign": "Gull", "discriminator": 4471, "friendCode": "K7Q2MX",
  "accountLevel": 7, "xp": 9120, "xpToNext": 2350,
  "scrip": 184200,
  "title": "Salvager", "banner": "BNR_Lighthouse", "emblem": "EMB_Gull",
  "appearance": { "body": "A", "head": "HEAD_A_03", "skin": 4, "eyes": 2, "hair": "HAIR_Watchcap", "hairColor": 6, "facialHair": "FH_Stubble", "clothing": { "head": ["CLO_WatchCap", 2], "outer": ["CLO_Oilskin", 0], "lower": ["CLO_BibBrace", 0], "feet": ["CLO_Wellies", 1], "gloves": ["CLO_FingerlessWool", 3], "upper": ["CLO_Gansey", 0] }, "tattoos": [], "voice": "VOX_A_2" },
  "scavCooldownUntil": null,
  "stats": { "raids": 23, "extracts": 12, "killsPlayer": 9, "killsHollow": 211, "deaths": 11 },
  "settingsCloud": { }
}
```

### PATCH /profile

Request (any subset): `{ "callsign": "Gull", "title": "...", "banner": "...", "emblem": "...", "appearance": { ... }, "settingsCloud": { ... } }`. Callsign changes are rate-limited (30 days). Cosmetic fields are validated against unlocks.

## 20.4 STASH

### GET /stash

Response:
```json
{
  "version": 412,
  "rows": 60, "columns": 10,
  "items": [
    {
      "id": "a1...", "def": "WPN_Mako", "stack": 1, "dur": 87.5, "maxDur": 100, "flags": 1,
      "parent": null, "loc": "stash", "grid": 0, "x": 0, "y": 0, "rot": false, "slot": null,
      "custom": { "weapon": { "parts": [ { "id": "b2...", "def": "BRL_AR_145_556", "p": 255, "slot": "Barrel", "dur": 92 }, ... ], "mag": { "id": "c3...", "rounds": [["AMMO_556_M855", 29]] }, "chamber": "AMMO_556_M855", "fireMode": 0, "zero": 100 } }
    }
  ],
  "known": ["WPN_Mako", "OPT_LumenR2", "..."]
}
```

Weapon parts are items too, so they also appear in `items` with `parent` set to the weapon's ID. The `custom.weapon.parts` array is the ordered tree for convenience (parents before children); the client builds the config from it.

### PATCH /stash

Request:
```json
{
  "expectedVersion": 412,
  "ops": [
    { "op": "move", "item": "a1...", "to": { "parent": null, "grid": 0, "x": 4, "y": 2, "rot": false } },
    { "op": "split", "item": "d4...", "count": 30, "newId": "e5...", "to": { "parent": "f6...", "grid": 0, "x": 0, "y": 0, "rot": false } },
    { "op": "gunsmith_install", "weapon": "a1...", "part": "g7...", "parentPart": "b2...", "slot": "Muzzle", "railPos": null },
    { "op": "gunsmith_remove", "weapon": "a1...", "part": "h8...", "to": { "parent": null, "grid": 0, "x": 9, "y": 10, "rot": false } },
    { "op": "load_ammo", "mag": "c3...", "ammo": "i9...", "count": 10 },
    { "op": "discard", "item": "j0..." },
    { "op": "examine", "def": "MED_SaltSalve" }
  ]
}
```
`newId` for splits is generated by the client (UUID v7) so it can reference the new item in later ops in the same batch; the server checks it's unused.

Response 200: `{ "version": 413, "changed": [ <items> ], "removed": ["j0..."] }`.
Errors: `STASH_VERSION_CONFLICT` (409), `VALIDATION_FAILED` (with `details.opIndex` and `details.reason`), `GUNSMITH_INVALID` (with the validator's reasons).

### POST /stash/autosort

Request `{ "expectedVersion": 413, "mode": "category" }`. Response as PATCH.

### GET /stash/item/{id}/history

Response: `{ "events": [ { "event": "looted", "detail": { "from": "Gull#4471", "where": "POI_NFB" }, "at": "..." } ] }`.

## 20.5 BUILDS

### GET /builds
`{ "builds": [ { "id": "...", "weapon": "WPN_Mako", "name": "Quiet Professional", "template": { "parts": [ { "def": "...", "p": 255, "slot": "..." } ] } } ] }`

### POST /builds
Request `{ "weapon": "WPN_Mako", "name": "...", "template": { ... } }` (validated). Response the build.

### DELETE /builds/{id}

### POST /builds/{id}/assemble
Request `{ "expectedVersion": 420, "buyMissing": true, "targetWeapon": null }` (null to assemble a new weapon from a receiver in the stash or a bought one). The backend picks the best parts from the stash (highest durability), buys missing ones from traders if `buyMissing` (respecting stock and loyalty; fails atomically if anything can't be bought), and assembles. Response: `{ "version": 421, "weaponId": "...", "bought": [ { "def": "...", "price": 4200, "trader": "tomasz" } ], "scrip": 179800, "changed": [ ... ] }`.

A dry run: `POST /builds/{id}/assemble?dryRun=true` returns what would be used and bought and the total price, without changing anything (the UI shows this before the player confirms).

## 20.6 TRADERS AND ECONOMY

### GET /traders

Response:
```json
{
  "traders": [
    {
      "id": "tomasz", "loyalty": 2, "reputation": 0.27, "spent": 512000,
      "nextLoyalty": { "level": 3, "needs": { "accountLevel": 20, "reputation": 0.40, "spent": 1200000 } },
      "stock": [ { "entry": "tz_opt_lumen_r2", "def": "OPT_LumenR2", "price": 9800, "remaining": 3, "restockAt": "...", "loyaltyRequired": 1 } ],
      "buys": ["Weapons", "Attachments", "Magazines", "Ammunition", "Barter.Gun"],
      "barters": [ { "entry": "tz_barter_harrow", "gives": "OPT_HarrowA4", "wants": [ ["BAR_CircuitBoard", 2], ["BAR_OpticsGlass", 3] ], "remaining": 1 } ]
    }
  ]
}
```

### POST /traders/{traderId}/buy
Request `{ "expectedVersion": 421, "entry": "tz_opt_lumen_r2", "count": 1, "placement": "auto" }` or with an explicit placement. Response `{ "version": 422, "scrip": 170000, "changed": [ ... ] }`.

### POST /traders/{traderId}/sell
Request `{ "expectedVersion": 422, "items": ["k1...", "l2..."] }`. Response `{ "version": 423, "scrip": 181500, "removed": [...], "prices": { "k1...": 6200, "l2...": 5300 } }`.

### POST /traders/{traderId}/quote
Request `{ "items": ["k1...", "l2..."] }`. Response `{ "prices": { ... }, "total": 11500 }` (for the sell screen's live total, no state change).

### POST /traders/{traderId}/barter
Request `{ "expectedVersion": 423, "entry": "tz_barter_harrow", "pay": ["m3...", "n4...", "o5...", "p6...", "q7..."] }`.

### POST /traders/{traderId}/repair
Request `{ "expectedVersion": 424, "item": "a1...", "target": 100 }`. Response includes the new durability, the new max durability and the price paid.

## 20.7 CONTRACTS

### GET /contracts
Response: `{ "contracts": [ { "id": "CTR_CAP_ColdStorage", "trader": "captain", "state": "active", "progress": { "obj1": 0 }, "pinned": true } ], "dailies": [ ... ], "weeklies": [ ... ] }`. The definitions themselves come from the catalog, which the client has locally.

### POST /contracts/{id}/accept
### POST /contracts/{id}/abandon
### POST /contracts/{id}/handover
Request `{ "expectedVersion": 430, "objective": "obj2", "items": ["r8...", "s9..."] }` for hand-over objectives (items are consumed). Response updated progress, and rewards if the contract completed.
### POST /contracts/{id}/pin `{ "pinned": true }`
### POST /contracts/{id}/claim
For contracts whose rewards are collected manually (most rewards apply automatically; a few, like stash items, need free space).

## 20.8 STATIONS AND CRAFTING

### GET /stations
Response: `{ "stations": [ { "id": "stores", "level": 2, "building": { "to": 3, "completeAt": "..." }, "next": { "level": 3, "requirements": { "scrip": 400000, "items": [["BAR_SteelPlate", 4]], "accountLevel": 15, "stations": [] }, "buildSeconds": 7200 } } ], "crafts": [ ... ] }`

### POST /stations/{id}/upgrade
Request `{ "expectedVersion": 440, "pay": ["t0...", "u1...", ...] }` (the item IDs the player chooses to spend; the backend checks they satisfy the requirement). Response with the new building state.

### POST /stations/{id}/craft
Request `{ "expectedVersion": 441, "recipe": "RCP_SickBay_Bandage", "pay": [...] }`.

### POST /crafts/{id}/collect
Request `{ "expectedVersion": 442, "placement": "auto" }`.

## 20.9 COSMETICS

### GET /cosmetics
`{ "unlocked": ["CLO_Oilskin", "FIN_Kelp", "CHM_GullFeather", ...], "skins": { "<weaponDef>": { "<partSlotPath>": "FIN_Kelp" } }, "charms": { "<weaponItemId>": "CHM_GullFeather" } }`

### PUT /cosmetics/weapon/{weaponItemId}
Request `{ "finish": "FIN_Kelp", "perPart": { "Handguard": "FIN_OD" }, "wearOverride": "Natural", "charm": "CHM_GullFeather", "engraving": { "pattern": "ENG_Scroll", "text": "MARGARET", "inlay": "gold" } }`. Cosmetic application is stored per weapon item.

### POST /cosmetics/buy
From Dora's stall: `{ "cosmetic": "CLO_PeaCoat_Navy" }`.

## 20.10 RAIDS

### POST /raids (host)
Request:
```json
{ "raidType": "standard", "map": "saltmarrow", "build": 1057, "catalogVersion": "1057", "squads": [ ["<puid>", "<puid>"], ["<puid>"] ], "lobbyId": "<eos lobby id>", "private": false }
```
Response:
```json
{ "raidId": "0193a...", "seed": 1938475621, "raidTicket": "<signed>", "reportKey": "<base64 per-raid hmac key>", "bannedPuids": [] }
```

### POST /raids/{raidId}/join (player)
Request:
```json
{
  "loadout": {
    "primary": "a1...", "secondary": null, "holster": "v2...", "helmet": "w3...", "face": null, "ears": null,
    "armor": "x4...", "rig": "y5...", "backpack": "z6...", "securePouch": "aa7...",
    "pocketItems": ["bb8...", "cc9..."]
  },
  "scripToBring": 7500,
  "scav": false
}
```
All items inside containers in the loadout come along automatically (the backpack's contents etc.). Response:
```json
{ "entryManifest": { "items": [ { "id": "...", "def": "...", "stack": 1, "dur": 87.5, "parent": null, "slot": "primary", "custom": { } } ], "scripItemId": "dd0..." }, "insuranceNote": null }
```
Errors: `ITEM_NOT_OWNED`, `ITEM_LOCKED`, `SCAV_COOLDOWN`, `RAID_STATE` (raid already started).

### GET /raids/{raidId}/manifest/{playerId} (host)
Returns the entry manifest for a joining player (the host builds their inventory from it).

### POST /raids/{raidId}/start (host)
`{ "startedAt": "<server time>" }`. Sets the raid in progress. After this, joins are rejected (except reconnects, which don't need the backend).

### POST /raids/{raidId}/loot-manifest (host)
Request (can be sent in chunks): `{ "chunk": 1, "of": 3, "items": [ { "id": "...", "def": "...", "stack": 1, "t": 0.0 } ] }`.

### POST /raids/{raidId}/checkpoint (host)
Body: binary (MessagePack, zstd). Headers: `X-Checkpoint-Seq: 37`. Contents: `{ t: raidTime, players: [ { id, status, pos: [x,y,z], items: [ { id, def, stack, dur, parent, slot, custom? } ] } ], lootAdds: [ ... ], claims: [ { item, player } ] }`.

### POST /raids/{raidId}/report (host)
Request:
```json
{
  "playerId": "...",
  "result": "extracted",
  "extraction": "E2_CanneryJetty",
  "raidTime": 1421.5,
  "items": [ { "id": "...", "def": "...", "stack": 1, "dur": 61.2, "parent": null, "slot": "primary", "custom": { }, "origin": "loot" } ],
  "stats": { "killsPlayer": 2, "killsAI": { "HOL_Shambler": 14, "WAR_Rifleman": 1 }, "damageDealt": 2210, "damageTaken": 980, "healed": 320, "revives": 1, "containersSearched": 31, "distance": 2140 },
  "xp": [ ["extract", 400], ["survive_minutes", 230], ["kill_player", 600], ["kill_ai", 430], ["search", 155], ["new_item", 100] ],
  "contractEvents": [ { "contract": "CTR_CAP_ColdStorage", "objective": "obj1", "delta": 1 } ],
  "history": [ { "item": "...", "event": "looted", "detail": { "fromPlayer": "...", "poi": "POI_Cannery" } } ],
  "killedBy": null,
  "mac": "<hmac>"
}
```
Response 202 `{ "queued": true }`.

### GET /raids/{raidId}/result (player)
Response (when committed):
```json
{
  "status": "committed",
  "result": "extracted",
  "xpGained": 1915, "levelBefore": 7, "levelAfter": 8,
  "scripDelta": 0,
  "itemsGained": [ { "id": "...", "def": "SALT_Cluster", "value": 34000 } ],
  "itemsLost": [ ],
  "reputation": { "captain": 0.02 },
  "contractsCompleted": ["CTR_CAP_ColdStorage"],
  "unlocks": ["CHM_LifeRing"],
  "stashOverflow": false
}
```
`status` is `pending` while the worker processes it.

### POST /raids/{raidId}/host-lost (player)
`{ "lastSeenServerTime": "..." }`. Response `{ "acknowledged": true }`.

### POST /raids/{raidId}/leave-early (player, before start)
Unlocks the loadout if the raid hasn't started.

## 20.11 SOCIAL

### GET /friends
`{ "friends": [ { "id": "...", "callsign": "Kitt", "discriminator": 1203, "presence": "in_raid", "lastSeen": "..." } ], "pendingIn": [...], "pendingOut": [...], "recent": [ { "id": "...", "callsign": "...", "lastRaid": "..." } ] }`

### GET /friends/resolve/{friendCode}
`{ "id": "...", "callsign": "Kitt", "discriminator": 1203, "puid": "<eos puid>" }`

### POST /friends/request `{ "friendCode": "K7Q2MX" }`
### POST /friends/{id}/accept
### DELETE /friends/{id}
### POST /friends/{id}/block

### POST /presence
`{ "state": "halcyon" | "raid_setup" | "in_raid" | "offline", "squadLobbyId": "<eos>", "joinable": true }`. Heartbeat every 60 s.

### POST /reports
`{ "reported": "<player id>", "raid": "<raid id>", "reason": "cheating" | "abuse" | "name" | "other", "note": "..." }`

## 20.12 TELEMETRY

### POST /telemetry
Batched: `{ "events": [ { "e": "raid_extract", "t": "<client time>", "p": { "raidTime": 1421, "extraction": "E2" } } ] }`. Up to 200 events per batch. Part 38 lists the events.

### POST /speedtest
A 2 MB upload, timed by the client to estimate upload bandwidth for host selection (part 18). The server discards the body and returns `{ "bytes": 2097152 }`.

## 20.13 ADMIN (my CLI only)

Authenticated with `X-Admin-Token`. `GET /admin/players?search=`, `GET /admin/players/{id}`, `POST /admin/players/{id}/grant` (items, Scrip, cosmetics: for compensating bugs), `POST /admin/players/{id}/ban`, `GET /admin/raids?flagged=true`, `GET /admin/raids/{id}`, `POST /admin/economy/reload` (reloads `economy.json`), `POST /admin/news`, `POST /admin/maintenance` (on/off with a message). Build a tiny CLI in `backend/tools/admin.ts` that calls these.

## 20.14 THE UNREAL CLIENT SIDE

Module `SaltmarrowOnline` contains: `USMApiClient` (a `UGameInstanceSubsystem` that owns the base URL, the session tokens, refresh logic, the request queue, retries with exponential backoff for idempotent calls, and the `Idempotency-Key` generation), typed request functions for every endpoint (generated where possible), and services on top (`USMStashService` with local state, optimistic ops, debounced PATCH batches and conflict recovery; `USMTraderService`; `USMRaidService` for the host's raid calls including checkpoint and report uploads with retries until acknowledged; `USMSocialService`).

Use the engine's `FHttpModule` for HTTP. Parse JSON with `FJsonObjectConverter` into the generated structs. Run all requests off the game thread's critical path (the HTTP module is async; handle responses on the game thread). Time out at 10 s, retry idempotent requests up to 4 times with backoff (1, 2, 4, 8 s). Raid reports retry indefinitely (with backoff up to 60 s) while the host's game is running, and are persisted to disk (`Saved/PendingReports/`) if the host exits before they're acknowledged, so they're sent on next launch. A raid result must never be lost because of a network blip.

---

End of part 20. Next: `21_SECURITY_AND_ANTI_CHEAT.md`.
