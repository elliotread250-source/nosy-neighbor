# SALTMARROW: PART 19, THE BACKEND ON RAILWAY

The backend is the memory of the game. It owns profiles, stashes, the economy, contracts, the Halcyon stations, raids and their ledgers, friends, presence and telemetry. It's a small, boring, reliable TypeScript service on Railway, deployed through my GitHub to Railway pipeline. Boring is the goal. The game is the exciting part; the backend should never be the reason a raid result is lost.

---

## 19.1 THE STACK

Runtime: Node.js 22 LTS (or the current LTS at the time you read this; pin the exact version in `.nvmrc` and `package.json` engines).
Language: TypeScript, strict mode.
HTTP framework: Fastify (fast, schema-first with JSON Schema validation and TypeBox types, good logging with pino).
Database: PostgreSQL (Railway's managed Postgres service).
ORM/query builder: Drizzle ORM (typed, SQL-shaped, migrations as SQL files) or Kysely. Pick Drizzle and stick to it.
Cache and ephemeral state: Redis (Railway's Redis service) for rate limits, presence, trader restock timers, idempotency keys and short-lived raid state.
Background jobs: a separate worker service using BullMQ on Redis (raid report processing retries, station build completions, daily contract refresh, cleanup of stale raids, telemetry rollups).
Validation: TypeBox schemas for every request and response (shared types with the client tooling: export JSON Schemas so the Unreal side can generate C++ structs or at least validate against them in tests).
Testing: Vitest, with a real Postgres in tests (Railway gives us one; for local and CI, use a Docker Postgres via `docker compose` or `testcontainers`).
Lint and format: ESLint (typescript-eslint) and Prettier.

## 19.2 THE REPOSITORY LAYOUT

The game and the backend live in one monorepo (part 36 explains the full repo), with the backend under `backend/`:

```
backend/
  package.json
  tsconfig.json
  drizzle.config.ts
  railway.json                 # per-service config lives in services/*/railway.json
  src/
    app.ts                     # Fastify app factory
    server.ts                  # entry for the api service
    worker.ts                  # entry for the worker service
    config.ts                  # env var parsing with defaults and validation
    db/
      schema.ts                # Drizzle schema (19.4)
      migrations/              # SQL migrations
      index.ts
    auth/
      eos.ts                   # EOS ID token verification (JWKS)
      jwt.ts                   # our session tokens
      middleware.ts
    catalog/
      catalog.ts               # loads the exported game catalog JSON (items, weapons, attachments, loot tables, contracts, stations)
      gunsmith.ts              # TS port of the gunsmith validator and stat calculator (part 08)
      loot.ts                  # loot table expected-value math for raid plausibility checks
    routes/
      status.ts auth.ts profile.ts stash.ts loadout.ts traders.ts contracts.ts stations.ts
      raids.ts friends.ts presence.ts cosmetics.ts telemetry.ts admin.ts
    services/
      stash-service.ts         # the stash operation engine (19.6)
      raid-service.ts          # raid lifecycle, manifests, reports, ledger (19.7)
      economy-service.ts       # prices, restocks, sells, buys
      contract-service.ts
      station-service.ts
      progression-service.ts
    jobs/
      process-raid-report.ts refresh-dailies.ts complete-stations.ts expire-raids.ts rollup-telemetry.ts
    lib/
      ids.ts errors.ts rate-limit.ts idempotency.ts logger.ts
  test/
  catalog/                     # the exported game catalog, committed by the game build (versioned)
    catalog-<build>.json
    economy.json               # live-tunable economy config
```

## 19.3 RAILWAY PROJECT LAYOUT

Create a new Railway project named `saltmarrow` (don't reuse the nosy-neighbor projects). Services:

| Service | Source | Start command | Notes |
|---|---|---|---|
| `api` | GitHub repo, root `backend/`, branch `main` (prod) and `develop` (staging environment) | `node dist/server.js` | Public domain: `api.<generated>.up.railway.app` (custom domain later). Health check `/healthz`. |
| `worker` | Same repo and root | `node dist/worker.js` | No public networking. |
| `web` | GitHub repo, root `web/` | static site (part 36) | Download page, patch notes, server status. Public domain. |
| `postgres` | Railway Postgres | | Private networking only. Daily backups enabled (verify the Railway backup feature for the plan; if backups aren't included, the worker runs a nightly `pg_dump` to a Railway bucket). |
| `redis` | Railway Redis | | Private networking only. |
| `bucket` | Railway Bucket (object storage), if available | | Stores database backups and raid replay files (Tier 3). Game builds are hosted on GitHub Releases, not here. |

Environments: `production` and `staging`. Staging deploys from `develop`, production from `main`. The game client's build config chooses the backend URL (dev builds default to staging; shipping builds to production; overridable with a command line flag `-backend=https://...` for testing).

Deploy pipeline: GitHub → Railway auto-deploys on push to the tracked branch, with Railway's build using Nixpacks or Railpack (Railway's builders) or a Dockerfile. Use a Dockerfile for the api and worker (deterministic, multi-stage: build with `npm ci && npm run build`, run on a slim Node image with only production deps). Migrations run as a pre-deploy command (`npm run db:migrate`) configured in the service's `railway.json` (`deploy.preDeployCommand`), so a deploy never starts with an unmigrated schema.

Use the Railway MCP tools to create the project, services, variables and domains (`create-project`, `create-service`, `connect-service-source`, `set-variables`, `generate-domain`), and to check deploy status and logs (`list-deployments`, `get-logs`, `get-deployment-diagnosis`). Confirm with me before anything destructive (deleting services, volumes or the database).

### 19.3.1 Environment variables

| Variable | Service | Value |
|---|---|---|
| `DATABASE_URL` | api, worker | Railway reference variable `${{postgres.DATABASE_URL}}` (private URL) |
| `REDIS_URL` | api, worker | `${{redis.REDIS_URL}}` |
| `JWT_SIGNING_KEY` | api | A random 64-byte secret (generate it, set it with the MCP, never commit it) |
| `JWT_ISSUER` | api | `saltmarrow-api` |
| `EOS_CLIENT_ID` | api | From the EOS dev portal (for token audience checks) |
| `EOS_DEPLOYMENT_ID` | api | From the EOS dev portal |
| `RAID_TICKET_KEY` | api | A random secret used to HMAC-sign raid tickets and raid reports (19.7.4) |
| `ADMIN_TOKEN` | api | A random secret for admin endpoints (only I use these, through a small admin CLI) |
| `CATALOG_VERSION` | api, worker | The catalog build number currently accepted (supports a list for rolling upgrades) |
| `MIN_CLIENT_BUILD` | api | The oldest game build allowed to connect |
| `GEOIP_DB_PATH` | api | Path to the GeoLite2 database file baked into the image (if used, with license) |
| `LOG_LEVEL` | all | `info` in prod, `debug` in staging |
| `NODE_ENV` | all | `production` |

## 19.4 THE DATABASE SCHEMA

All IDs are UUIDs (v7 for time-ordered inserts) unless noted. All timestamps are `timestamptz`. Every table has `created_at` and `updated_at`.

```sql
-- Players
create table players (
  id uuid primary key,
  eos_puid text not null unique,
  epic_account_id text unique,          -- if linked
  callsign text not null,
  discriminator smallint not null,      -- 0001..9999
  friend_code char(6) not null unique,
  account_level smallint not null default 1,
  xp bigint not null default 0,
  scrip bigint not null default 25000 check (scrip >= 0),
  appearance jsonb not null default '{}',
  settings_cloud jsonb not null default '{}', -- optional synced settings (keybinds etc.)
  scav_cooldown_until timestamptz,
  banned_until timestamptz,
  ban_reason text,
  last_seen_at timestamptz,
  build_seen text,
  unique (callsign, discriminator)
);

-- Item instances: every item that exists in any stash or is in transit in a raid
create table items (
  id uuid primary key,                  -- the item instance id (also used in game)
  player_id uuid references players(id),-- current owner (null when in a raid ledger only)
  def_id text not null,                 -- catalog item definition id
  stack_count integer not null default 1 check (stack_count > 0),
  durability real,                      -- null if n/a
  max_durability real,
  flags integer not null default 0,     -- bitfield: FIR, SHAKEDOWN, HOT, LOCKED_IN_TRANSIT
  custom jsonb not null default '{}',   -- weapon config, magazine contents, uses, note id, key uses
  parent_item_id uuid references items(id), -- container this item is inside (backpack, case, weapon for parts, magazine for nothing: rounds are stacks inside custom)
  location text not null,               -- 'stash' | 'loadout' | 'raid' | 'trader_buyback' | 'destroyed'
  grid_index smallint,                  -- which grid in the container (or stash)
  x smallint, y smallint, rotated boolean,
  slot text,                            -- equipment slot name when equipped in a loadout, or weapon part slot
  raid_id uuid,                         -- set while location = 'raid'
  lineage_parent uuid,                  -- for split stacks
  version integer not null default 0
);
create index on items (player_id, location);
create index on items (parent_item_id);
create index on items (raid_id);

create table item_history (
  id bigserial primary key,
  item_id uuid not null references items(id),
  event text not null,                  -- 'bought' 'found' 'looted' 'extracted' 'killed_with' 'repaired' etc.
  detail jsonb not null default '{}',
  at timestamptz not null default now()
);
create index on item_history (item_id, at desc);

-- Stash version for optimistic concurrency
create table stashes (
  player_id uuid primary key references players(id),
  rows smallint not null default 40,
  version bigint not null default 0
);

-- Gunsmith builds (templates)
create table builds (
  id uuid primary key,
  player_id uuid not null references players(id),
  weapon_def_id text not null,
  name text not null,
  template jsonb not null
);

-- Traders and loyalty
create table trader_standing (
  player_id uuid references players(id),
  trader_id text,                       -- 'captain' 'tomasz' 'agnes' 'nils'
  reputation real not null default 0,
  spent bigint not null default 0,
  loyalty smallint not null default 1,
  primary key (player_id, trader_id)
);

create table trader_stock (
  player_id uuid references players(id),
  trader_id text,
  entry_id text,                        -- catalog stock entry id
  remaining integer not null,
  restock_at timestamptz not null,
  primary key (player_id, trader_id, entry_id)
);

-- Contracts
create table contracts (
  player_id uuid references players(id),
  contract_id text,
  state text not null,                  -- 'available' 'active' 'completed' 'failed'
  progress jsonb not null default '{}', -- objective id -> count
  accepted_at timestamptz, completed_at timestamptz,
  pinned boolean not null default false,
  primary key (player_id, contract_id)
);

create table daily_contracts (
  player_id uuid references players(id),
  slot smallint, contract_id text, expires_at timestamptz,
  primary key (player_id, slot)
);

-- Halcyon stations
create table stations (
  player_id uuid references players(id),
  station_id text,
  level smallint not null default 0,
  building_to smallint,                 -- level under construction
  build_complete_at timestamptz,
  primary key (player_id, station_id)
);

create table crafts (
  id uuid primary key,
  player_id uuid not null references players(id),
  station_id text not null, recipe_id text not null,
  complete_at timestamptz not null,
  collected boolean not null default false
);

-- Cosmetics
create table cosmetic_unlocks (
  player_id uuid references players(id),
  cosmetic_id text,
  source text not null,
  primary key (player_id, cosmetic_id)
);

-- Weapon mastery and lifetime stats
create table player_stats (
  player_id uuid references players(id),
  stat text,                            -- 'raids' 'extracts' 'kills_player' 'kills_hollow_shambler' 'weapon_kills:WPN_Mako' ...
  value bigint not null default 0,
  primary key (player_id, stat)
);

-- Raids
create table raids (
  id uuid primary key,
  host_player_id uuid not null references players(id),
  raid_type text not null,
  seed integer not null,
  surge_direction smallint,
  build text not null,
  catalog_version text not null,
  state text not null,                  -- 'created' 'in_progress' 'ended' 'host_lost' 'abandoned'
  started_at timestamptz, ended_at timestamptz,
  loot_manifest_value bigint,           -- total base value of spawned loot
  flags integer not null default 0      -- FLAGGED_FOR_REVIEW etc.
);

create table raid_players (
  raid_id uuid references raids(id),
  player_id uuid references players(id),
  squad_id text,
  entry_manifest jsonb not null,        -- item ids and snapshot
  result text,                          -- 'extracted' 'killed' 'mia' 'disconnected' 'host_ended'
  report jsonb,                         -- the host's signed report for this player
  committed_at timestamptz,
  primary key (raid_id, player_id)
);

create table raid_loot (
  raid_id uuid references raids(id),
  item_id uuid,                         -- spawned instance id (not yet in items table)
  def_id text not null,
  stack_count integer not null,
  spawned_at_s real,                    -- raid time
  claimed_by uuid references players(id),
  primary key (raid_id, item_id)
);

create table raid_checkpoints (
  raid_id uuid references raids(id),
  seq integer,
  at timestamptz not null default now(),
  snapshot bytea not null,              -- compressed
  primary key (raid_id, seq)
);

-- Social
create table friendships (
  player_id uuid references players(id),
  friend_id uuid references players(id),
  state text not null,                  -- 'pending_out' 'pending_in' 'accepted' 'blocked'
  primary key (player_id, friend_id)
);

create table recent_players (
  player_id uuid references players(id),
  other_id uuid references players(id),
  last_raid_id uuid, at timestamptz,
  primary key (player_id, other_id)
);

create table reports (
  id uuid primary key,
  reporter_id uuid references players(id),
  reported_id uuid references players(id),
  raid_id uuid, reason text, note text
);

-- Telemetry (raw events land here, rolled up by the worker; part 38)
create table telemetry_events (
  id bigserial primary key,
  player_id uuid, raid_id uuid,
  event text not null,
  props jsonb not null default '{}',
  at timestamptz not null default now()
);

-- Idempotency
create table idempotency_keys (
  key text primary key,
  player_id uuid,
  response jsonb,
  at timestamptz not null default now()
);

-- Reserved for Tier 4 dedicated servers
create table server_allocations (
  id uuid primary key, raid_id uuid, provider text, address text, state text
);
```

Partition `telemetry_events` by month if it grows (or ship telemetry to a separate store later). Index sensibly. Write the schema in Drizzle and generate migrations; the SQL above is the shape.

## 19.5 AUTH

### 19.5.1 EOS token verification

The client sends its EOS Connect ID token (a JWT). The backend verifies: signature against Epic's JWKS for EOS Connect ID tokens (fetch the JWKS from Epic's documented endpoint and cache it with rotation; look up the current URL in the EOS documentation and put it in config, don't hard-code from memory), `iss`, `aud` matching our client ID, `exp`, and extracts the PUID (`sub`). If valid, find or create the player.

New player creation: callsign from the request (validated: 3 to 16 characters, allowed charset, profanity filter with a small word list), random discriminator not taken for that callsign, a unique friend code, starting Scrip 25,000, the starter stash (19.9), the default stations (Gunsmith's Bench L1, Stores L1), trader standings at loyalty 1, the first contracts available.

### 19.5.2 Session tokens

Our session JWT (HS256 with `JWT_SIGNING_KEY`): `sub` = player ID, `puid`, `exp` = 1 hour, plus a refresh token (opaque, random, stored hashed in Redis with a 30 day TTL, rotated on use). The client refreshes in the background.

Single session: a new login for the same player invalidates older refresh tokens and marks older sessions as superseded; the old client gets a 401 with `SESSION_SUPERSEDED` on its next call and shows "Signed in elsewhere".

## 19.6 THE STASH OPERATION ENGINE

The stash is the most frequently modified state. Every change goes through one function, `applyStashOps(playerId, expectedVersion, ops[])`, in a single database transaction with `SELECT ... FOR UPDATE` on the player's stash row:

1. Check `expectedVersion` equals the current version (else 409 with the current version and a diff hint; the client refetches and replays).
2. For each op, validate and apply in memory against the loaded stash tree: `move`, `rotate`, `split`, `merge`, `equip`, `unequip`, `discard`, `load_ammo`, `unload_ammo`, `gunsmith_install`, `gunsmith_remove`, `examine` (marks the def as examined in the player's known-items set).
3. Validate the final state (no overlaps in any grid, all container rules respected, gunsmith configs valid via the TS validator).
4. Write changes (only changed items), bump the version, commit.
5. Return the new version and the changed items.

Purchases and sales are separate endpoints (economy service) that call the same engine with generated ops plus Scrip changes, all in one transaction. Never let Scrip and items change in separate transactions.

## 19.7 THE RAID LIFECYCLE

### 19.7.1 Create

`POST /v1/raids` (host only): body has raid type, build, catalog version, squad member PUIDs. The backend creates the raid row with a fresh seed (crypto random) and returns `{ raidId, seed, raidTicket }`. The raid ticket is an HMAC-signed token (`RAID_TICKET_KEY`) binding the raid ID, the host player ID and an expiry (2 hours). The host uses it to call raid endpoints for other players (fetching manifests, posting the loot manifest, checkpoints and reports).

### 19.7.2 Join (lock the loadout)

`POST /v1/raids/{raidId}/join` (each player, with their session JWT): body has the loadout (equipment slots with item IDs) and the Scrip to bring. The backend, in one transaction: verifies every item is in the player's stash and not locked, moves them to `location = 'raid'` with `raid_id` set and the `LOCKED_IN_TRANSIT` flag, deducts the brought Scrip and creates a Scrip stack item, writes the `raid_players` row with the entry manifest (a snapshot of the items and their custom data), and returns the manifest. Riskless raids (Shakedown) set a flag so the items are restored on any outcome.

Scavenger loadouts: `POST /v1/raids/{raidId}/join` with `scav: true` checks the cooldown, generates a random Scav kit from the catalog's scav tables, creates the items directly in `raid` location, and sets the cooldown.

### 19.7.3 Loot manifest and checkpoints

`POST /v1/raids/{raidId}/loot-manifest` (host, raid ticket): the spawned loot list. Stored in `raid_loot`. The backend computes the total base value and compares it to the expected range for the raid type and map (from the loot tables, precomputed by the catalog loader: mean and standard deviation of total raid loot value by Monte Carlo on catalog load). Out-of-range manifests flag the raid.

`POST /v1/raids/{raidId}/checkpoint` (host, raid ticket, every 10 s): a compressed snapshot (MessagePack + zstd) of every player's state: status, inventory item IDs (with custom data for changed items), raid time. Plus loot manifest additions (dynamic loot). Keep only the latest 3 checkpoints per raid.

### 19.7.4 Reports

`POST /v1/raids/{raidId}/report` (host, raid ticket): one report per player, sent when that player's raid ends (extract, death, MIA, disconnect timeout). Body: player ID, result, final inventory (item IDs and custom data for every item on their character if extracted; for deaths, the list is empty and the body's contents are in the world), stats (kills, damage, XP sources), contract objective events, item history events (looted from whom), and an HMAC over the body using a per-raid key derived from `RAID_TICKET_KEY` and the raid ID (the host gets this per-raid key in the create response; it's a speed bump against casual tampering, not real security, since the host has the key).

The api enqueues the report for the worker (BullMQ job keyed by raid ID + player ID for idempotency) and returns 202. The worker processes it:

1. Load the raid, the player's entry manifest, the raid loot ledger and all other committed reports for the raid.
2. Validate every extracted item: its ID is in the player's entry manifest, or in the raid loot ledger and not claimed by another player, or in another player's entry manifest from this raid (looted from a body) and not claimed elsewhere. Split stacks are checked by lineage totals.
3. Validate the plausibility of the report: XP within bounds, kills ≤ players + AI spawned, weapons' kill counts, contract events correspond to valid objectives.
4. Apply: extracted items move to the player's stash (placed into the first free stash space with auto-placement; if the stash is full, they go to an overflow "Unsorted" container that the UI asks the player to clear before the next raid), with FiR flags set on found items, ownership changed for looted items (and skins reset per part 10), history events appended. Items the player brought and lost are marked `destroyed` unless the raid is riskless. XP, stats, contract progress, reputation and cosmetic unlocks are applied.
5. Mark the report committed. Notify the client (the client polls `GET /v1/raids/{raidId}/result` or receives it via a long-poll; keep it simple: poll every 1 s for up to 30 s after extraction, which is when the summary screen appears).

### 19.7.5 Host lost and expiry

`POST /v1/raids/{raidId}/host-lost` (any player in the raid): after 10 s with at least one report (or 30 s with any), the backend resolves all uncommitted players from the latest checkpoint as "host_ended": they keep everything they had at the checkpoint, with found loot (which is in the ledger) included. A worker job also expires raids with no checkpoint for 120 s the same way. Raids older than 2 hours are force-ended.

## 19.8 RATE LIMITS AND ABUSE CONTROLS

Per player (Redis token buckets): auth 10/min, stash ops 120/min, buys/sells 60/min, raid joins 6/min, telemetry 600/min, everything else 300/min. Per IP for auth: 30/min. Responses include `Retry-After`.

Idempotency: every mutating request carries an `Idempotency-Key` header (a UUID from the client). The backend stores the response for 24 h and returns it again on repeats. This protects against double purchases on flaky networks.

## 19.9 THE STARTER STASH

Every new player gets: a Kestrel 9 with 3 magazines and 90 rounds of 9x19 FMJ, a Bora (stock) with 4 magazines and 180 rounds of 7.62x39 PS-type, a Fathom with 3 magazines and 40 rounds of 7.62x51 M80, a Gannet (stock) with 3 magazines, 2 Field Dressings, 1 Tourniquet, 1 Splint, 2 IFAKs, 2 Painkillers, a Police Stab Vest, a Cannery Hard Hat, a Salvager's Belt, a Tidewater Daypack, 2 Water Bottles, a Thermos of Tea, a Signal Pistol with 2 red flares, and a note from the Captain ("Welcome aboard. Don't die. R.K."). That's enough for 3 or 4 decent raids and a Scav fallback.

## 19.10 OBSERVABILITY

Structured logs (pino) with request IDs, player IDs and raid IDs on every line. Railway collects logs; use the MCP's `get-logs` for debugging. Metrics: Railway's service metrics for CPU, memory and request rates; add a `/metrics` endpoint (Prometheus format, protected by the admin token) for app metrics (raid reports processed, validation failures, stash op latency, active raids). Error tracking: log errors with stack traces; consider Sentry's free tier later (ask me first).

Health checks: `/healthz` (process alive), `/readyz` (database and Redis reachable). Railway's health check uses `/readyz` with a timeout.

## 19.11 BACKUPS AND DISASTER RECOVERY

Daily Postgres backups (Railway's backup feature if available on my plan; otherwise the worker's nightly `pg_dump` to the bucket with 14 days retention). Test a restore into staging once in Tier 1 and write the steps in `design/RUNBOOK.md`.

If the database is lost, the game can't recover stashes without backups. That's the scariest failure in the whole project. Backups are not optional.

## 19.12 COSTS

Expected Railway costs at our scale (a few dozen players): api + worker + web + Postgres + Redis on the Hobby or Pro plan should run in the range of a few dollars to a few tens of dollars a month. Watch usage in the Railway dashboard. EOS is free. GitHub is free for private repos at this size (GitHub Releases and Actions minutes have limits; part 36 covers that). Don't add paid services without asking me.

## 19.13 BACKEND ACCEPTANCE TESTS

The full flow in part 03.2 runs as an integration test against a real Postgres: create player, buy items, build a loadout, create raid, join, post loot manifest, checkpoints, report extraction with found loot and looted items, verify stash, verify ledger rejects duplicates, verify host-lost restoration.

Stash op fuzzing: 10,000 random op batches against a test stash never produce an invalid stash state, and concurrent batches with stale versions get 409s and never corrupt anything.

The TS gunsmith validator agrees with the C++ one on the shared fuzz corpus (part 08).

Idempotent purchase: the same purchase with the same key twice charges once.

Deploy: pushing to `develop` deploys staging with migrations; `/readyz` goes green within 2 minutes.

---

End of part 19. Next: `20_BACKEND_API_REFERENCE.md`.
