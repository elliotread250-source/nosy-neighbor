# SALTMARROW: PART 30, CODE ARCHITECTURE AND PROJECT STRUCTURE

This part is the engineering skeleton: which template to start from, how the project is divided into modules and plugins, what the core classes are, coding standards, how assets are organized, how version control works with a multi-gigabyte Unreal project, and how you (Claude Code) drive the editor through the unreal-mcp connection and your own toolsets.

---

## 30.1 START FROM LYRA

Start the project from Epic's Lyra Starter Game (free on Fab, for the installed engine version). Rename it to Saltmarrow. Here's why, plainly: Lyra gives us, already working and networked, the Gameplay Ability System integration (ability sets, attribute sets, tag relationships), Enhanced Input with input configs and mapping contexts, Common UI with the layered UI framework and platform input glyphs, the settings system (a full settings screen with graphics, audio, controls and keybinding, which saves us weeks), the Experience system (game modes as data, loaded via Game Feature plugins), the CommonUser plugin for online login and sessions, modular gameplay (pawn extension components, hero components), a weapon and equipment framework (which we'll replace for weapons but learn from), team and damage plumbing, the audio settings and the loading screen system, and a codebase written by Epic for exactly this kind of multiplayer shooter.

What we replace or strip: Lyra's weapon system (ours is projectile ballistics with a gunsmith; Lyra's is hitscan-oriented and simpler), Lyra's inventory (ours is grid-based and server-authoritative with the backend), Lyra's game modes (Elimination, Control: delete them), Lyra's maps and art (delete), Lyra's bots (replace with our AI), Lyra's frontend (rebuild in our style, keeping the framework).

The renaming: Lyra's module and class names (`LyraGame`, `ALyraCharacter`) can either be renamed wholesale (painful but clean) or kept as the framework layer with our game layer on top (`SaltmarrowGame` module, `ASMCharacter` deriving from `ALyraCharacter`). Keep the Lyra layer and build on top. It keeps upstream comparisons possible and saves a week of renaming. Our classes use the `SM` prefix.

If the installed engine version has no matching Lyra release, or Lyra fails to build, start from a blank C++ project, add GAS, Enhanced Input, Common UI and CommonUser manually, and write `DECISIONS.md` notes. Don't fight a broken template for more than a day.

## 30.2 ENGINE VERSION

Use the newest Unreal Engine 5.x version installed on my machine that has a matching Lyra and Game Animation Sample release. Check what's installed through the Epic launcher's install location (and ask me if there are several). Minimum 5.5. Lock it: record the exact version in `README.md` and the `.uproject`'s `EngineAssociation`. Don't upgrade mid-project without asking.

A source build of the engine (from Epic's GitHub, which needs my Epic account linked to GitHub) is only required for building a Linux dedicated server (Tier 4). Don't start with one.

## 30.3 REPOSITORY LAYOUT

One GitHub repository, `saltmarrow` (private), under my account. Create it with the GitHub tools when we start (ask me to confirm the name).

```
saltmarrow/
  Saltmarrow.uproject
  Config/                       # ini files (DefaultEngine, DefaultGame, DefaultInput, DefaultScalability, ...)
  Source/
    Saltmarrow/                 # the primary game module (Lyra's, renamed or kept as LyraGame)
    SaltmarrowGame/             # our game layer: characters, components, game modes
    SaltmarrowCombat/           # ballistics, damage, armor, projectiles (pure C++, unit-tested)
    SaltmarrowWeapons/          # weapons, gunsmith, attachments, stat calculator
    SaltmarrowInventory/        # grid inventory, items, containers, loot
    SaltmarrowAI/               # AI characters, StateTree tasks, perception, director
    SaltmarrowWorld/            # Surge, water, weather, flood volumes, extraction, boats
    SaltmarrowOnline/           # backend API client, EOS identity, matchmaking, raid service
    SaltmarrowUI/               # widgets, view models, HUD
    SaltmarrowEditor/           # editor-only: commandlets (catalog export, cover generation), toolsets, validators
    Saltmarrow.Target.cs SaltmarrowEditor.Target.cs SaltmarrowServer.Target.cs (Tier 4)
  Plugins/
    GameFeatures/
      SMRaid/                   # the raid experience: map, game mode, raid rules
      SMHalcyon/                # the Halcyon menu experience
      SMRange/                  # the firing range experience
      SMSkirmish/               # (Tier 3)
    CommonUser/ ... (from Lyra)
    SaltmarrowTools/            # our MCP toolsets (part 30.9)
  Content/
    Saltmarrow/                 # all our content (30.6)
  backend/                      # part 19
  web/                          # part 36
  tools/                        # scripts: api struct generation, build scripts, catalog checks
  design/                       # this design bible, BUILD_LOG.md, DECISIONS.md, CREDITS.md, RUNBOOK.md, EOS_SETUP.md, PLAYTEST.md
  .github/workflows/            # CI (part 36)
  .gitattributes .gitignore .editorconfig
```

## 30.4 VERSION CONTROL AND GIT LFS

Unreal binary assets (`.uasset`, `.umap`) are big and can't be merged. Use Git LFS for all of them and for textures, audio, fonts, and source art (`.fbx`, `.png`, `.wav`, `.psd`, `.blend`, `.ttf`, `.otf`, `.exr`). Commit a `.gitattributes`:

```
*.uasset filter=lfs diff=lfs merge=lfs -text lockable
*.umap   filter=lfs diff=lfs merge=lfs -text lockable
*.fbx    filter=lfs diff=lfs merge=lfs -text
*.png    filter=lfs diff=lfs merge=lfs -text
*.tga    filter=lfs diff=lfs merge=lfs -text
*.exr    filter=lfs diff=lfs merge=lfs -text
*.wav    filter=lfs diff=lfs merge=lfs -text
*.ogg    filter=lfs diff=lfs merge=lfs -text
*.ttf    filter=lfs diff=lfs merge=lfs -text
*.otf    filter=lfs diff=lfs merge=lfs -text
*.psd    filter=lfs diff=lfs merge=lfs -text
*.blend  filter=lfs diff=lfs merge=lfs -text
*.zip    filter=lfs diff=lfs merge=lfs -text
```

And a `.gitignore` for Unreal (Binaries, Intermediate, Saved, DerivedDataCache, `.vs`, `*.sln`, build outputs, `backend/node_modules`, `backend/dist`).

Warning about cost: GitHub's free LFS quota is small (around 1 GB of storage and 1 GB of bandwidth per month at the time of writing; check current numbers). Lyra plus GASP plus our content will be several GB quickly. Options, which I need to choose (ask me when we start): pay for GitHub LFS data packs (a few dollars a month per 50 GB), or keep large third-party content (Lyra's original content, GASP's animations, Megascans) out of the repo and document how to re-download it (fragile), or use a separate storage for big binaries. My default: pay for LFS data packs. Don't start pushing gigabytes before I confirm.

Branching: `main` (stable, playable), `develop` (integration), feature branches (`feat/gunsmith-rails`). Merge to `develop` with a PR when a feature's tests pass; merge `develop` to `main` at each milestone. Since you're the only one committing to binary assets, locking isn't critical, but enable `lockable` on `.uasset` and `.umap` so it's ready for collaborators.

One File Per Actor (World Partition) keeps level changes small and diffable at the file level.

## 30.5 MODULE RESPONSIBILITIES AND KEY CLASSES

### SaltmarrowGame

`ASMCharacterBase` (shared by players and AI: health zones via GAS, hit zones, movement component, inventory component reference, appearance), `ASMPlayerCharacter`, `USMCharacterMovementComponent` (part 04), `USMInteractionComponent` (the player's interaction scanner) and `USMInteractableComponent` (on interactables), `USMStanceComponent`, `USMLeanComponent`, `USMInjuryComponent` (applies injury effects to movement and animation), `ASMPlayerController`, `ASMPlayerState`, `ASMRaidGameMode`, `ASMRaidGameState`, `ASMHalcyonGameMode` (menu), `USMGameInstance`, `USMNoiseSubsystem` (part 28), `USMPingComponent`, `USMDownedComponent`, `USMVoiceComponent`.

### SaltmarrowCombat

Pure C++ where possible, minimal UObject dependency for the math: `FSMBallistics` (integration, drag, falloff), `FSMPenetration`, `FSMArmorResolver`, `FSMDamageCalculator`, plus the runtime `USMProjectileSubsystem` (part 05), `USMLagCompensationComponent` (the hitbox history ring buffer), `USMHitZoneComponent`, `USMDamageExecution` (a GAS execution calculation that applies damage and status effects), explosion handling (`ASMExplosion`).

### SaltmarrowWeapons

`USMWeaponDefinition`, `USMAttachmentDefinition`, `USMAmmoDefinition`, `FSMWeaponConfig`, `USMGunsmithLibrary` (validation, stat calculation, assembly helpers), `ASMWeapon` (the runtime actor, assembly from config), `USMWeaponStateComponent` (ammo, chamber, heat, malfunctions), `USMRecoilComponent`, `USMSwayComponent`, `USMOpticComponent` (zoom, zero, reticle, scope rendering), GAS abilities for weapon actions (part 31), `USMGunsmithPreviewActor` (the bench), `USMWeaponIconRenderer`.

### SaltmarrowInventory

`USMItemDefinition` (base for all items), item fragments (Lyra-style fragments: `FSMItemFragment_Medical`, `_Food`, `_Container`, `_Magazine`, `_Key`, `_Note`, `_Salt`, `_Armor`, `_Equipment`, `_Throwable`, `_Tool`), `FSMItemInstance`, `USMInventoryComponent` (with fast array replication), `USMGridContainer`, `USMLootContainerComponent`, `ASMPickupActor`, `USMLootTable`, `USMLootSubsystem` (raid loot generation, manifest building, dynamic loot spawns), `USMEquipmentVisualsComponent` (gear meshes on the character).

### SaltmarrowAI

Part 13's classes, plus StateTree tasks, evaluators and conditions (`FSMStateTreeTask_Chase`, `_Grab`, `_TakeCover`, `_Flank`, `_ThrowGrenade`, `_Investigate`, `_Retreat`, `_Heal`, `_RiseFromWater`), EQS generators and tests (cover points, flanking routes, water-depth test), `USMAIDirector`, `USMWardenSquad`, `USMCoverData`, navigation query filter for water (part 13.6).

### SaltmarrowWorld

`USMSurgeSubsystem` (schedule, weather state, events), `ASMFloodVolume`, `USMWaterQuerySubsystem`, `ASMExtractionPoint` and conditions, `ASMExtractionBoat`, `ASMPlayerBoat` and its movement component, `ASMLadder`, `ASMDoor`, `ASMDestructible` (windows, padlocks), `ASMSaltDeposit`, `ASMFireArea`, `ASMSmokeCloud`, `USMWorldEventsSubsystem` (Salt Bloom, Blackout, Distress Call, Lighthouse Wakes, Gull Storm), ambient life (`ASMGullFlock`, `ASMSheep`).

### SaltmarrowOnline

`USMApiClient`, generated API types, `USMStashService`, `USMTraderService`, `USMContractService`, `USMStationService`, `USMRaidService` (host-side: raid creation, manifests, checkpoints, reports, with the pending reports persistence), `USMEOSIdentity`, `USMSquadSubsystem` (EOS lobby wrapper for squads), `USMMatchmakingSubsystem`, `USMPresenceService`, `USMTelemetryService`.

### SaltmarrowUI

Common UI screens and components (parts 22 to 24), view models (use UE's Model-View-ViewModel plugin, MVVM, if it's stable in the installed version: it suits data-heavy screens like the stash and the gunsmith; otherwise, a simple C++ presenter pattern), the HUD (native C++ widgets for per-frame elements), the item cell widget, the drag and drop operations, the tooltip system, the map renderer.

### SaltmarrowEditor

Commandlets: `ExportCatalog` (writes `backend/catalog/catalog-<build>.json`: items, weapons, attachments, ammo, loot tables, contracts, stations, recipes, cosmetics, traders' stock and economy references), `GenerateCoverPoints`, `ValidateContent` (runs data validation on all assets: every weapon has icons, every attachment fits something, every loot table entry exists, every contract objective references valid things, every interactable has a prompt, and so on), `GenerateMapTexture`, `RenderItemIcons`. Data validators (`UEditorValidatorBase` subclasses) for each asset type, so content errors show up in the editor and fail CI.

## 30.6 CONTENT FOLDER STRUCTURE

```
Content/Saltmarrow/
  Core/            # game data assets, experiences, input configs, ability sets
  Characters/
    Salvager/      # player meshes, clothing, anim BPs
    Hollows/ Wardens/ Bosses/ NPCs/
  Weapons/
    _Shared/       # master materials, shared parts, muzzle flashes
    Kestrel9/ Mako/ ... one folder per weapon: mesh, anims, data asset, sounds
  Attachments/
    Optics/ Muzzles/ Suppressors/ Barrels/ Handguards/ Rails/ Stocks/ Grips/ Tactical/ Magazines/ ...
  Items/           # non-weapon item definitions and meshes, by category
  Environment/
    Kit/           # the modular building kit
    Props/ Nature/ Vehicles/ Boats/ Decals/ Water/ Sky/
  Maps/
    L_Saltmarrow/  L_Halcyon_Menu/  L_Range/  Test/ (L_Test_Combat, L_Test_Movement, L_Test_Lighting, L_Test_AI_Soak, L_Test_Gunsmith)
  UI/
    Components/ Screens/ HUD/ Icons/ Fonts/ Styles/
  Audio/
    Weapons/ Foley/ Footsteps/ Ambience/ Music/ UI/ Voice/ MetaSounds/
  VFX/
    Weapons/ Impacts/ Explosions/ Weather/ Water/ Character/ World/
  Materials/       # masters, functions, MPCs, post-process
  Data/            # data tables, curves, loot tables, contracts, stations
  Dev/             # temporary work, never referenced by shipping content (a validator enforces it)
```

Asset naming (Epic's conventions plus ours): `BP_` blueprints, `WBP_` widgets, `ABP_` anim BPs, `AM_` montages, `AS_` anim sequences, `BS_` blend spaces, `SK_`/`SKM_` skeletal meshes, `SM_` static meshes, `M_` materials, `MI_` instances, `MF_` functions, `MPC_` parameter collections, `T_` textures (with suffixes `_D` base color, `_N` normal, `_ORM`, `_M` masks, `_E` emissive), `NS_` Niagara systems, `NE_` emitters, `MS_` MetaSounds, `SC_` sound cues, `DA_` data assets (with type: `DA_Weapon_Mako`, `DA_Att_OPT_LumenR2`), `DT_` data tables, `ST_` StateTrees, `EQS_` queries, `L_` levels, `LI_` level instances, `PCG_` graphs, `IA_` input actions, `IMC_` mapping contexts, `GE_` gameplay effects, `GA_` gameplay abilities, `GC_` gameplay cues.

## 30.7 CODING STANDARDS

Follow Epic's C++ coding standard (naming, `UPROPERTY` usage, `TObjectPtr`, `const` correctness). Our additions:

Every networked function documents its authority (`// Server only`, `// Client predicted`, `// Owner only`).

No raw `new` for UObjects; `NewObject`, `CreateDefaultSubobject`, spawning through the world.

No `Tick` unless needed; prefer timers and events. When a component ticks, set its tick interval to the slowest acceptable rate.

All tunables are `UPROPERTY(EditDefaultsOnly)` on data assets or `UDeveloperSettings` (project settings), never magic numbers in code. Console variables (`TAutoConsoleVariable` with the `sm.` prefix) for debug toggles.

Logging: one log category per module (`LogSMCombat`, `LogSMWeapons`...). No log spam in shipping (use `UE_LOG` verbosity correctly and `UE_CLOG`).

Asserts: `check` for programmer errors that should crash in development, `ensure` for recoverable unexpected states, never asserts on data that comes from the network or files (validate instead).

Unit tests: the Automation framework (`IMPLEMENT_SIMPLE_AUTOMATION_TEST` or the newer `UE` test framework if available) for pure logic: ballistics, armor, damage, stat calculation, gunsmith validation, loot generation, the Surge schedule, inventory grid operations, XP curves. Functional tests for gameplay (part 37).

Blueprints: allowed for presentation, cosmetic sequencing, simple level scripting, and widget layout. Not allowed for core rules, networking or anything that runs per frame on many actors. Blueprint logic over 30 nodes in a single graph gets moved to C++.

## 30.8 HOW TO DRIVE THE EDITOR (UNREAL MCP)

You have the `unreal-engine-skills-for-claude-code:unreal-mcp` skill, which connects to the running Unreal Editor through the unreal-mcp server, and the `create-toolset` skill for adding AI-callable toolsets, and the `unreal-skill` skill for authoring in-editor Agent Skills. Use them like this:

Invoke the `unreal-mcp` skill at the start of any session where you'll touch the editor. It tells you which toolsets are available (Blueprint, Static Mesh, Object, Level, Material tools and others) and how to call them. Learn what's there before writing code that duplicates it.

Use the editor connection for: creating and editing assets (data assets, material instances, Blueprints, widgets, Niagara, levels), placing actors, setting properties, running validators and commandlets, triggering Live Coding after C++ edits, taking screenshots for review, and running PIE sessions for tests.

Write C++ in the source files directly (with your normal file tools), then compile: Live Coding for iteration (through the MCP), and a full build with UnrealBuildTool from the command line when headers change or Live Coding can't handle it (`Engine/Build/BatchFiles/Build.bat SaltmarrowEditor Win64 Development -Project="<path>/Saltmarrow.uproject" -WaitMutex`). Close the editor for full builds when needed, and reopen it.

When you do something repetitive through the MCP more than three times (creating 60 attachment assets, stamping 40 houses, placing 300 loot spawn points), stop and write a toolset for it with the `create-toolset` skill (part 30.9). Toolsets turn hours of MCP calls into one call per item.

Record every editor session's key actions in `BUILD_LOG.md`. Assets created through the MCP are real assets; commit them.

Screenshots: after building or changing anything visual, take a screenshot through the editor (high resolution screenshot of the viewport or a PIE frame) and look at it. Don't claim something looks right without looking at it. Save review screenshots to `design/review/<date>/`.

## 30.9 OUR TOOLSETS

Build these toolsets in `Plugins/SaltmarrowTools/` with the `create-toolset` skill, as you need them (not all up front):

`GunsmithAuthoringTools` (part 09): create attachment assets from a template and a stat dictionary, create weapon assets, validate presets, render icons, export the catalog, find orphan parts, run the gunsmith fuzz corpus.

`ItemAuthoringTools`: create item definitions from a table (CSV in `design/data/items.csv` → data assets), generate loot tables from a spec, validate loot tables, compute expected raid loot values.

`MapAuthoringTools` (part 14): stamp house archetypes, fill rooms from prop sets, place loot spawn points by room type, generate cover points, validate loot reachability, find floating props, run sightline checks, generate the map texture, assign flood zone indices to meshes (custom primitive data).

`AIAuthoringTools`: create AI archetypes, place patrol splines from a list of points, place memory points, test spawn the director's waves in the editor.

`AudioAuthoringTools`: create MetaSound variants from a folder of samples, wire weapon sound sets to weapon definitions, assign surfaces to physical materials.

`UIAuthoringTools`: generate icon textures from SVGs, apply style tokens, run the layout screenshot tests at all resolutions.

`QATools`: run functional test suites, run the benchmark flythrough and report frame times, run the PSO gathering playthrough, capture review screenshots of a list of camera bookmarks.

Each toolset function is a static, well-documented function with typed parameters and a structured return value (success, messages, created asset paths). Follow the skill's conventions exactly.

## 30.10 THE GAME FEATURE AND EXPERIENCE SETUP

Use Lyra's Experience system: each mode (Raid, Halcyon menu, Range, Skirmish, Practice) is a `ULyraExperienceDefinition` (renamed or subclassed `USMExperienceDefinition`) that lists the pawn data, ability sets, input configs, HUD layout and game feature plugins to load. The raid map's World Settings reference the Raid experience. The Halcyon map references the Halcyon experience. That keeps mode-specific code and content in their Game Feature plugins and out of the core.

## 30.11 ARCHITECTURE ACCEPTANCE CRITERIA

The project builds from a clean clone (after LFS pull and any documented content downloads) with one command, documented in `README.md`.

`ValidateContent` passes with zero errors.

All unit tests pass.

No module depends on a module above it in this order: Combat → Weapons → Inventory → World → AI → Online → Game → UI (lower modules never include higher ones; the Game module wires gameplay to the Online services, and UI sits on top of everything). A small script checks the `Build.cs` dependencies.

---

End of part 30. Next: `31_GAMEPLAY_ABILITY_SYSTEM.md`.
