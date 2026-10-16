# SALTMARROW: PART 18, MULTIPLAYER ARCHITECTURE

This part is the networking contract. It covers identity, parties, matchmaking, hosting, transport, replication, prediction, bandwidth, and the path to dedicated servers. Read it alongside part 19 (backend) and part 21 (security). The rule above all others: every gameplay system is built for networked play from its first line. Nothing is "single player first, add multiplayer later". If you build a feature and haven't tested it with two clients at 150 ms latency, it isn't built.

---

## 18.1 THE TOPOLOGY

```
                         ┌──────────────────────────────────────────┐
                         │     Epic Online Services (free tier)     │
                         │  Connect (identity: Device ID, Epic acct) │
                         │  Lobbies (squads, raid lobbies)          │
                         │  P2P (NAT traversal + relay)             │
                         │  RTC voice (squad + proximity)           │
                         └───────▲───────────────▲──────────────────┘
                                 │               │
          ┌──────────────────────┴───┐     ┌─────┴─────────────────────┐
          │  HOST (player's PC)      │◄───►│  CLIENT (player's PC) ×11 │
          │  UE listen server + game │ P2P │  UE game client           │
          │  authoritative raid sim  │ UDP │  predicted movement, GAS  │
          └──────────────▲───────────┘     └─────────────▲─────────────┘
                         │ HTTPS (JWT)                   │ HTTPS (JWT)
                         ▼                               ▼
          ┌──────────────────────────────────────────────────────────┐
          │                 SALTMARROW BACKEND (Railway)             │
          │  api service (Node/TS, Fastify) · worker service          │
          │  Postgres (profiles, stash, raids, ledger)  · Redis       │
          │  web service (download page, patch notes, status)        │
          └──────────────────────────────────────────────────────────┘
```

Three layers, each with one job. EOS handles finding and connecting players. The host's game runs the raid. Our backend owns persistence and economy, and it's the referee for anything that outlives a raid.

## 18.2 WHY LISTEN SERVERS, AND THE HONEST TRADEOFFS

Dedicated servers would be better for fairness, host performance and cheating. They cost money per hour per raid, need a fleet manager, and need UDP hosting. Railway is excellent for our backend but, as far as I know, its public networking is HTTP and TCP (via TCP proxy), not UDP, which Unreal's netcode uses. Verify the current state with the Railway MCP's `search-docs` tool before deciding anything; if Railway has added UDP support by the time you read this, note it in `DECISIONS.md` and keep it in mind for Tier 4.

For a game shared among friends, listen servers through EOS P2P are the right call: zero hosting cost, no port forwarding, works behind most home routers thanks to EOS's NAT traversal and relay fallback, and a player can host from any decent PC. The tradeoffs we accept: the host has zero ping (a small advantage), host performance limits raid size, a cheating host can cheat, and host loss ends the raid (part 03 makes that painless).

Mitigations: the host's game runs the server at a fixed tick and caps its own client frame rate when needed to keep the server tick stable; the backend validates raid results (parts 12 and 21); host selection prefers the best machine (18.6.3); and the dedicated server path stays open (18.12).

## 18.3 THE ENGINE NETWORKING STACK

### 18.3.1 Plugins and modules

Enable: OnlineSubsystem, OnlineSubsystemUtils, OnlineSubsystemEOS, SocketSubsystemEOS, EOSShared, EOSVoiceChat (for RTC voice), and Lyra's CommonUser plugin (it wraps login, sessions and online state in a game-friendly API, and supports both the old Online Subsystem and the newer Online Services; use the Online Subsystem path because it's the most documented with EOS). If you didn't start from Lyra, add CommonUser from Lyra's plugins folder anyway; it saves days.

Note on Online Services (the newer "OSSv2" plugins, OnlineServicesEOS/OnlineServicesEOSGS): Epic is moving toward them. If the installed engine and CommonUser support them cleanly with EOS lobbies and P2P, you may use them, but don't mix the two. Pick one, record it in `DECISIONS.md`, and stick to it.

### 18.3.2 Config

`DefaultEngine.ini` (adjust class paths to the installed version; verify each one against the engine source in the installed version before committing):

```ini
[OnlineSubsystem]
DefaultPlatformService=EOS

[OnlineSubsystemEOS]
bEnabled=true

[/Script/OnlineSubsystemEOS.EOSSettings]
CacheDir=CacheDir
DefaultArtifactName=Saltmarrow
TickBudgetInMilliseconds=1
bEnableOverlay=false
bEnableSocialOverlay=false
bShouldEnforceBeingLaunchedByEGS=false
bUseEAS=false
bUseEOSConnect=true
bMirrorStatsToEOS=false
bMirrorAchievementsToEOS=false
bUseEOSSessions=true
+Artifacts=(ArtifactName="Saltmarrow",ClientId="<from dev portal>",ClientSecret="<from dev portal>",ProductId="<id>",SandboxId="<id>",DeploymentId="<id>",EncryptionKey="<64 hex chars>")

[/Script/Engine.GameEngine]
!NetDriverDefinitions=ClearArray
+NetDriverDefinitions=(DefName="GameNetDriver",DriverClassName="/Script/SocketSubsystemEOS.NetDriverEOS",DriverClassNameFallback="/Script/OnlineSubsystemUtils.IpNetDriver")
+NetDriverDefinitions=(DefName="BeaconNetDriver",DriverClassName="/Script/SocketSubsystemEOS.NetDriverEOS",DriverClassNameFallback="/Script/OnlineSubsystemUtils.IpNetDriver")

[/Script/SocketSubsystemEOS.NetDriverEOS]
bIsUsingP2PSockets=true
NetServerMaxTickRate=60
MaxClientRate=100000
MaxInternetClientRate=100000

[/Script/OnlineSubsystemUtils.IpNetDriver]
NetServerMaxTickRate=60
MaxClientRate=100000
MaxInternetClientRate=100000

[/Script/Engine.Player]
ConfiguredInternetSpeed=100000
ConfiguredLanSpeed=100000
```

Secrets: the EOS ClientSecret and EncryptionKey go in the config file because the shipped client needs them (that's how EOS works for client apps; the client policy in the dev portal restricts what a client with those credentials can do). The backend's secrets (part 19) never go in the client.

Don't put real EOS credentials in a public repo. The game repo is private. If it ever becomes public, move the artifact settings to an untracked `Config/Custom/EOSCredentials.ini` loaded at runtime, and rotate the keys.

### 18.3.3 EOS Developer Portal setup (you'll need me for this)

I have to create the EOS product in the Epic Developer Portal myself (it needs my Epic account). Give me a checklist in `design/EOS_SETUP.md` when you get to it, covering: create an organization and product named SALTMARROW, create a sandbox and deployment (Dev and Live), create a client with a client policy of type "Peer2Peer" with permissions for Connect, Lobbies, P2P, RTC, and Sanctions (read), enable the Device ID login in Connect, set the product's name and icon in the brand settings, and copy the IDs into the config. Pause and ask me for those IDs; don't invent placeholders that look real.

### 18.3.4 Identity: Device ID login

The friction-free login (Pillar 5): on first launch, the client creates an EOS Device ID (`EOS_Connect_CreateDeviceId`, stored by EOS on the machine) and logs in with it (`EOS_Connect_Login` with credentials type `EOS_ECT_DEVICEID_ACCESS_TOKEN` and a display name), creating an EOS Product User ID (PUID) automatically. The OnlineSubsystemEOS login path for Device ID differs between engine versions; check the installed version's `UserManagerEOS.cpp` for a Device ID path. If it's missing or awkward, write a small C++ class (`USMEOSIdentity`) that uses the EOS SDK directly through the EOSShared plugin's platform handle to do the Device ID login, then hands the PUID to the OSS (or bypasses OSS for identity entirely and uses the PUID with P2P sockets and lobbies via the SDK). Keep that class small and well-commented.

Account linking (Tier 2): players can link an Epic account later ("Link Epic Account" in Settings > Account) through `EOS_Connect_LinkAccount`, so they can move to another PC and keep their profile. Without linking, the profile is tied to the device (warn players: "Your progress is saved to this PC. Link an Epic account to play on other PCs."). Steam linking is Tier 4 (if the game ever goes on Steam).

Backend auth: after EOS Connect login, the client gets an ID token (`EOS_Connect_CopyIdToken`), a JWT signed by Epic. It sends it to our backend (`POST /v1/auth/eos`), and the backend verifies it with Epic's public JWKS (part 19), finds or creates the player profile keyed by the PUID, and returns our own session JWT. Every backend request carries our JWT.

## 18.4 SQUADS (PARTIES)

A squad is an EOS Lobby with `BucketId = "squad:<version>"`, max members 3, permission level "join via presence" or "invite only", and attributes: `leader_puid`, `state` (`idle`, `in_raid_setup`, `searching`, `in_raid`), `raid_lobby_id` (when in a raid), `version` (the game build number: players on different builds can't squad).

Invites: three ways. Friend code: every profile has a short friend code (6 characters, uppercase letters and digits without confusing characters: no 0/O, 1/I), shown in the squad panel. Entering a friend's code asks the backend to resolve it to a PUID (`GET /v1/friends/resolve/{code}`), then the client sends an EOS lobby invite to that PUID (`EOS_Lobby_SendInvite`), which arrives as a notification on the friend's client (we poll invites through the EOS lobby interface's invite received notification). Recent players: a list of players you've been in a raid or squad with recently (from the backend), with an invite button. Join link (Tier 2): a `saltmarrow://join/<lobby id>` URL that launches the game and joins the squad, registered as a protocol handler by the installer.

Friends list: the backend keeps a simple friends list (mutual friend requests by friend code), because EOS's friends require Epic accounts. Presence for friends (online, in Halcyon, in raid) comes from the backend (clients heartbeat `POST /v1/presence` every 60 s).

## 18.5 RAID LOBBIES AND MATCHMAKING

### 18.5.1 Raid lobbies

A raid lobby is an EOS Lobby with `BucketId = "raid:<version>:<raidType>"`, max members 12 (or the host's chosen max), and attributes: `host_puid`, `raid_type`, `region` (a coarse region code: `eu`, `na`, `as`, `oc`, `sa`, from the host's ping estimate, 18.5.3), `slots_open`, `squads` (count), `state` (`gathering`, `starting`, `in_progress`), `raid_id` (from our backend), `start_time` (raid start, server time), `new_player_bucket` (true if the host's squad average level is under 8), `password_protected` (private raids for friends only).

### 18.5.2 Matchmaking flow

When a squad leader presses START for a Standard raid:

1. The client searches EOS lobbies with the raid bucket, matching `raid_type`, `region`, `state = gathering`, `slots_open >= squad size`, `new_player_bucket` matching the squad's (soft: relaxed after 20 s), and the version. Sort by `squads` (prefer fuller lobbies so raids start faster).
2. If found, the squad joins it (all members, coordinated by the squad leader through the squad lobby's `raid_lobby_id` attribute; each member's client sees the change and joins the raid lobby).
3. If not found within 20 s (or immediately if the leader picked "Host"), the leader's client creates a raid lobby and becomes the host.
4. The raid lobby gathers for up to 90 s (or until full, or until the host presses "Start Now" if at least 1 squad; the host can always start with just their own squad). A countdown in the UI.
5. At start, the host: calls the backend `POST /v1/raids` (gets `raidId`, `raidSeed`, `raidTicket`), sets the lobby's `raid_id` and state `starting`, loads the raid map as a listen server (`ServerTravel` or `OpenLevel` with `?listen`), and when ready, sets the lobby state to `in_progress` with a connect string attribute (`EOS:<host_puid>:GameNetDriver:<socket name>`, the P2P address format the EOS net driver uses; verify the exact format in the installed SocketSubsystemEOS).
6. Clients see `in_progress`, each calls `POST /v1/raids/{raidId}/join` with their validated loadout (getting their entry manifest), then connects to the host with `ClientTravel` to the connect string. The host's GameMode checks every joining player in `PreLogin` (18.7.1).

Private raids: the leader can set "Private" and a password; the lobby is created with `password_protected = true`, and joining players enter the password (it's checked by the host in PreLogin against a hash in the lobby attributes).

Shakedown and Practice: Shakedown is always a private listen server for the squad (no matchmaking). Practice is offline (standalone, no network).

### 18.5.3 Region estimation

EOS lobbies are global. To avoid matching someone in Sydney with a host in London, estimate region: on startup, the client pings a set of lightweight HTTPS endpoints (our Railway backend in its region gives one point; plus a few public CDN edge test URLs, or better, EOS's own relay latency if exposed) and picks the region with the lowest latency. The simplest approach that holds up: let the backend tell the client its region from the request's IP geolocation (`GET /v1/status` returns `region`), using a free GeoIP database (MaxMind GeoLite2, with its license terms respected) on the backend. Use that as the `region` attribute. It's coarse, and coarse is fine.

Ping check before joining: after finding candidate lobbies, the client can't ping the host directly before connecting (P2P). Accept that, and rely on the region match. After joining, if the measured ping to the host exceeds 200 ms in the first 10 s of the pre-raid connection, show a warning to the player ("High ping to host: 230 ms"), and let them leave.

### 18.5.4 Join in progress

Not allowed after raid time 0:00 for matchmade raids (everyone deploys together). Reconnection after disconnect (part 03) is allowed for 180 s, by the same PUID, using the lobby's connect string.

## 18.6 THE HOST

### 18.6.1 Host responsibilities

The host's game process runs the server: GameMode, all AI, all physics, the Surge simulation, loot generation, projectile simulation, hit validation, inventory authority. It also runs the host player's client. That's a heavy load, so:

The server tick is fixed at 60 Hz (`NetServerMaxTickRate=60` is for networking; also fix the game tick by capping the host's frame rate to a multiple: 60, 120 or 144, with physics substepping fixed). If the host's machine can't hold 60 Hz, the server degrades gracefully: AI LOD gets more aggressive (part 13), projectile substeps reduce from 120 Hz to 60 Hz, and non-essential replication frequency drops.

The host's client rendering is the main competitor for CPU and GPU. In the host's graphics settings, show a "Hosting" note recommending a frame rate cap, and apply a soft cap automatically while hosting (default 120 fps) to leave CPU headroom.

### 18.6.2 Host requirements

Minimum to host a full 12-player raid: 6-core CPU (Ryzen 5 3600 / Intel i5-10400 class), 16 GB RAM, 20 Mbps upload. For a squad-only Shakedown: any machine that runs the game.

Bandwidth estimate: each connected client needs about 40 to 60 KB/s downstream from the host at peak combat (12 players, 60 AI). For 11 clients, about 0.5 to 0.7 MB/s upstream from the host, which is 4 to 6 Mbps. Most home connections handle that. EOS relays add a little overhead when used.

### 18.6.3 Host selection

When a squad starts a raid that creates a new lobby, the host is the squad leader by default. Better: before creating the lobby, the squad's clients each report a "host score" to the squad lobby as a member attribute: a number from 0 to 100 from CPU cores, RAM, measured frame time in the last menu minute and the upload bandwidth estimate (measured with a quick upload test to our backend: `POST /v1/speedtest` with a 2 MB payload, timed). The squad member with the best score becomes the host (with a minimum: if nobody scores above 40, warn that the raid may perform poorly). Players can opt out of hosting in Settings ("Never host").

## 18.7 THE RAID SESSION

### 18.7.1 PreLogin and Login

The host's GameMode (`ASMRaidGameMode`) in `PreLogin` checks: the joining player's PUID is in the raid lobby's member list (from EOS), the game version matches, the raid isn't full, the password hash matches for private raids, and the player isn't banned (the backend's ban list for this raid, fetched at raid creation). In `PostLogin`, the host asks the backend for that player's entry manifest (`GET /v1/raids/{raidId}/manifest/{puid}`, using the raid ticket), builds the player's inventory from it (every item instance from the manifest), spawns them at their squad's insertion point (assigned on first squad member join), and starts their boat-in sequence.

The host never trusts the client to say what it's carrying. The manifest comes from the backend. That's the core of the economy's integrity.

### 18.7.2 PlayerState and team info

`ASMPlayerState` holds: PUID, callsign, squad ID, appearance (part 10), account level (shown to squadmates), status (alive, downed, dead, extracted, disconnected), and raid stats (kills, damage). Replicated to all clients, except raid stats, which only replicate to the owner and squadmates (enemies shouldn't know how many kills you have).

### 18.7.3 GameState

`ASMRaidGameState` holds: raid ID, raid type, seed, Surge schedule seed and direction, raid start server time, extraction states (open/closed/arriving times), and the boss state (spawned or not; only replicated as a hint to clients that are near). Small and replicated to all.

## 18.8 REPLICATION STRATEGY

### 18.8.1 General rules

Use the push model for replicated properties (`bWithPushModel` in `DOREPLIFETIME_WITH_PARAMS_FAST` with `MARK_PROPERTY_DIRTY_FROM_NAME`), so properties are only compared when marked dirty. It's a big CPU win on the server with many actors.

Set sensible `NetUpdateFrequency` and `MinNetUpdateFrequency` per actor class (players 60/30, AI 20/2 with adaptive, weapons 30 owner / 10 others, doors 10 with dormancy, containers dormant until interacted, pickups dormant, boats 30).

Use dormancy (`DORM_DormantAll` or `DORM_Initial` for placed actors) for everything that rarely changes: doors, containers, pickups, bodies after they settle, destructible states. Wake on change (`FlushNetDormancy`).

Net cull distance: default 150 m for small interactive actors (pickups, containers), 400 m for AI, 1,200 m for players (with the LOS relevancy filter from part 04 doing the real work), always relevant for the GameState and extraction boats.

Fast arrays: inventories, magazine contents, and the impact batch use `FFastArraySerializer` for efficient delta replication.

Replication Graph: use it if the default net driver's relevancy cost becomes measurable (it will with 12 players, 60 AI and thousands of dormant actors). The Replication Graph lets us bucket actors spatially (a grid spatialization node) and handle always-relevant and per-connection-relevant actors efficiently. Lyra doesn't ship one by default for its shooter mode, but ShooterGame/older samples have examples. Build it in Tier 1 if profiling shows `ServerReplicateActors` over 2 ms; it probably will.

Iris: Epic's newer replication system is promising and was experimental in early UE5 versions. Don't use it for v1 unless it's marked production-ready in the installed engine and both GAS and our custom relevancy work with it. Record the decision.

### 18.8.2 The LOS relevancy filter for players

Part 04 describes the design. Implementation: in a Replication Graph, a custom node (`USMReplicationGraphNode_PlayerVisibility`) that, per connection, decides which enemy player characters are relevant: always if within 20 m; otherwise if a visibility check passes. Visibility checks run on a budget: each frame, process N (connection, target) pairs from a round-robin queue, doing up to 6 line traces per pair from the viewer's character head (eye socket, not camera) to the target's head, chest, pelvis, hands and feet, against a "visibility" trace channel that ignores foliage and small props (foliage doesn't block replication; you can't hide in a bush from the server). Cache results for 0.2 s. A target that was visible stays relevant for 1.0 s after it stops being visible (to avoid popping), and a target that made a sound audible to the viewer stays relevant for 3 s (so the sound has a source).

Also, project the viewer's position forward by their velocity × 0.15 s for the check (so sprinting around a corner doesn't show an empty street for a few frames: the "peeker's advantage" fix).

Budget: 12 players means 132 directed pairs; at 6 traces per pair every 0.2 s, that's about 4,000 traces per second, which is affordable with async traces.

### 18.8.3 Movement replication

Player movement: CMC, with all custom state in the saved moves (part 04). Use network smoothing for simulated proxies. Ensure `bNetLoadOnClient`, `bReplicateMovement` and so on are standard.

AI movement: CMC with lower frequency, simulated proxy smoothing; for far AI, consider replicating only position and yaw at 2 Hz and interpolating.

### 18.8.4 GAS replication

Use GAS's Mixed replication mode for players (the owner gets full effect replication, others get minimal) and Minimal for AI. Attribute sets: health zones, stamina, hydration, cold, armor states (part 31). Gameplay cues for cosmetic effects (hit reactions, healing VFX, status effect VFX) as unreliable multicast cues with batching.

### 18.8.5 Weapons and shots

Part 05 has the shot networking (RPCs, batching, impact batches). Weapon configs use the compact NetSerialize from part 08.

## 18.9 PREDICTION SUMMARY

What the client predicts (and how it reconciles):

Movement: CMC prediction and correction.
Stamina: GAS attribute prediction.
Firing: cosmetic (muzzle flash, recoil, sound, tracer, ammo count). Ammo count reconciles from the server's weapon state.
Hits: cosmetic impact VFX at the predicted hit point (the client runs the same ballistic sim locally for its own shots, purely visually). Damage and hit markers only from the server.
Reloads, weapon swaps, ADS: predicted with GAS abilities (prediction keys).
Inventory moves: predicted in the UI, reconciled by the fast array.
Interactions (doors, containers): the door's visual opening is predicted on the interacting client; the server confirms.
Healing items: predicted start, server-applied effect.

What the client never predicts: damage to others, deaths, loot contents of unrevealed items, extraction, anything economic.

## 18.10 VOICE CHAT

EOS RTC (the EOSVoiceChat plugin). Two rooms per raid: a squad room per squad (non-positional, radio-filtered on the receiving side in our audio mix, part 28) and a raid-wide proximity room (positional). For proximity, EOS RTC delivers audio streams per participant; we need positional audio, so route each participant's incoming voice through Unreal's audio engine as a positioned sound source at their character's head location (if the EOS voice plugin exposes per-participant audio buffers; if it doesn't, use Unreal's own VOIP (`UVOIPTalker` with the online subsystem's voice interface and a `USoundAttenuation` settings) for proximity, which is designed for this, and EOS RTC only for the squad channel).

Check what the installed engine version supports and pick the simplest path that gives positional proximity voice with occlusion. Record the choice.

Voice settings: input device, output device, push-to-talk keys (squad, proximity), voice activation threshold, volume per channel, per-player mute (from the squad panel and the scoreboard-like "players nearby" list; there's no scoreboard in raid, so muting uses the post-raid summary and the squad list, plus a "Mute all non-squad" toggle).

Moderation: there's no automated voice moderation. Players can mute and report (report sends the PUID and raid ID to the backend; part 21).

## 18.11 NETWORK TESTING

Use Unreal's network emulation (`Net PktLag`, `Net PktLoss`, `Net PktJitter`, or the editor's Network Emulation settings in Play-In-Editor with profiles: Average 60 ms / 1% loss, Bad 150 ms / 3% loss / 30 ms jitter, Terrible 250 ms / 5% loss).

Multiplayer test plan, every time a networked feature lands:

1. PIE with 3 clients (listen server + 2 clients), Average profile.
2. PIE with 3 clients, Bad profile.
3. A packaged build test on two machines through EOS P2P (I'll provide a second machine or a friend; plan for it by producing a packaged build and instructions in `design/PLAYTEST.md`).
4. Automated bot tests (part 37): headless clients that join a listen server, run scripted inputs (move, shoot, loot, extract), and report desyncs.

Network profiling: use the Networking Insights (Unreal Insights' network trace) to profile bandwidth per actor class and per property. Targets: under 60 KB/s per client at peak combat in a 12-player raid, and under 25 KB/s average.

## 18.12 THE DEDICATED SERVER PATH (TIER 4)

Keep the code ready for dedicated servers even though v1 uses listen servers:

Never assume the server has a local player (`IsLocallyControlled` checks, no `GetFirstPlayerController` on the server for gameplay logic).
Keep server-only code out of client-only modules (and use `#if WITH_SERVER_CODE` or `UE_SERVER` where useful).
Make the raid game mode work identically as a listen server or a dedicated server.
Build a Linux dedicated server target (`SaltmarrowServer.Target.cs`) in CI from Tier 2 (it needs a source build of the engine, which is a big install; part 36 covers it), even if you don't deploy it.

Where to host dedicated servers later: Railway only if UDP is supported (verify). Otherwise, a game server host with UDP: Edgegap, Hathora, AWS GameLift, or a cheap VPS (Hetzner, OVH) running the Linux server in Docker with a tiny orchestrator that our backend calls to allocate a server per raid. Part 19 leaves a `server_allocations` table and a `ServerAllocator` interface in the backend for this, unimplemented in v1.

## 18.13 MULTIPLAYER ACCEPTANCE TESTS

Two players on different networks (one behind a typical home NAT, one on a mobile hotspot) can squad, start a raid and play for 28 minutes with no disconnects, through EOS P2P.

Twelve clients (automated bots plus two humans) in a full raid: host server tick holds 60 Hz on the reference host CPU for 90% of the raid, and never drops under 45 Hz.

A client disconnecting and reconnecting within 180 s resumes control of their character with their inventory intact.

The host crashing mid-raid results in every player's gear being restored from the last checkpoint (verified by comparing backend stashes before and after).

An enemy player around a corner, not visible from the viewer's character head, is not replicated to the viewer (verified by a test that checks the client's actor list).

Bandwidth per client stays under target in the 12-player soak test.

Voice: squad voice works anywhere on the map; proximity voice is audible within 40 m and inaudible beyond, and occluded through walls.

---

End of part 18. Next: `19_BACKEND_ON_RAILWAY.md`.
