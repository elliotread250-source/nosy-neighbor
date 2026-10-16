# SALTMARROW: PART 42, APPENDIX: GAMEPLAY TAGS, CONSOLE VARIABLES AND CONFIG

The complete reference lists. Put the tags in `Config/Tags/SaltmarrowTags.ini` (one file per family is fine) and declare the frequently used ones natively in C++ (`UE_DEFINE_GAMEPLAY_TAG` in a `SMGameplayTags.cpp`), so code references are compile-checked.

---

## 42.1 GAMEPLAY TAGS

### Input

```
Input.Move  Input.Look  Input.Sprint  Input.Walk  Input.Jump  Input.Crouch  Input.Prone
Input.LeanLeft  Input.LeanRight  Input.ShoulderSwap  Input.Fire  Input.ADS  Input.Reload
Input.CheckMag  Input.CheckChamber  Input.FireMode  Input.Weapon.Primary  Input.Weapon.Secondary
Input.Weapon.Holster  Input.Weapon.Knife  Input.Weapon.Cycle  Input.Melee  Input.Throw.Primary
Input.Throw.Secondary  Input.Interact  Input.Inventory  Input.Map  Input.Health  Input.QuickSlot.1 .. Input.QuickSlot.6
Input.Ping  Input.PingWheel  Input.Compass  Input.Device.Toggle  Input.Device.Mode  Input.Optic.Toggle
Input.Zero.Up  Input.Zero.Down  Input.Magnification.Up  Input.Magnification.Down  Input.HoldBreath
Input.Bipod  Input.Voice.Squad  Input.Voice.Proximity  Input.Emote  Input.Pause  Input.BreakGrab
Input.GiveUp  Input.Boat.Throttle  Input.Boat.Steer  Input.Boat.Horn  Input.Boat.Exit
```

### Ability

```
Ability.Movement.Sprint  Ability.Movement.Crouch  Ability.Movement.Prone  Ability.Movement.Jump
Ability.Movement.Mantle  Ability.Movement.Vault  Ability.Movement.Lean
Ability.Weapon.Fire  Ability.Weapon.ADS  Ability.Weapon.Reload.Tactical  Ability.Weapon.Reload.Empty
Ability.Weapon.Reload.Fast  Ability.Weapon.Reload.PerRound  Ability.Weapon.CheckMag  Ability.Weapon.CheckChamber
Ability.Weapon.ClearMalfunction  Ability.Weapon.FireMode  Ability.Weapon.Swap  Ability.Weapon.BoltCycle
Ability.Weapon.Pump  Ability.Weapon.Lever  Ability.Weapon.Zero  Ability.Weapon.OpticToggle
Ability.Weapon.Magnification  Ability.Weapon.HoldBreath  Ability.Weapon.Bipod  Ability.Weapon.BarrelChange
Ability.Weapon.Reel
Ability.Melee.Quick  Ability.Melee.Heavy  Ability.Melee.Bash  Ability.Throw
Ability.Item.Use  Ability.Interact  Ability.Search  Ability.Revive  Ability.Downed  Ability.GiveUp
Ability.Ping  Ability.Emote  Ability.Gesture  Ability.Boat.Board  Ability.Boat.Drive  Ability.HarvestSalt
Ability.FieldModify  Ability.BreakGrab
Ability.AI.Grab  Ability.AI.Bite  Ability.AI.Swipe  Ability.AI.Slam  Ability.AI.Charge  Ability.AI.Scream
Ability.AI.Burst  Ability.AI.Lunge  Ability.AI.DragUnder  Ability.AI.HealAlly  Ability.AI.CallReinforcements
Ability.Boss.Ferryman.HookPull  Ability.Boss.Ferryman.Sweep  Ability.Boss.Ferryman.TollBell
Ability.Boss.Ferryman.Fare  Ability.Boss.Ferryman.LowTide
Ability.Boss.Choir.Song  Ability.Boss.Choir.Harmony  Ability.Boss.Choir.Pulse  Ability.Boss.Choir.Drowned
```

### State

```
State.Alive  State.Dead  State.Downed  State.Extracted  State.Linkdead
State.ADS  State.Sprinting  State.Walking  State.Crouched  State.Prone  State.Leaning
State.Mantling  State.Vaulting  State.OnLadder  State.Swimming  State.Underwater  State.Wading.Knee
State.Wading.Waist  State.Wading.Chest  State.InBoat.Driver  State.InBoat.Passenger
State.Reloading  State.Interacting  State.Searching  State.Healing  State.InInventory  State.InMap
State.Grabbed  State.Grabbing  State.Exhausted  State.Burdened  State.Overloaded  State.Immobile
State.WeaponLowered  State.WeaponBlocked  State.Extracting  State.Spectating  State.Emoting
State.Zone.Destroyed.Head  State.Zone.Destroyed.Thorax  State.Zone.Destroyed.Stomach
State.Zone.Destroyed.LeftArm  State.Zone.Destroyed.RightArm  State.Zone.Destroyed.LeftLeg  State.Zone.Destroyed.RightLeg
```

### Status

```
Status.Bleed.Light  Status.Bleed.Heavy  Status.Fracture.LeftArm  Status.Fracture.RightArm
Status.Fracture.LeftLeg  Status.Fracture.RightLeg  Status.Pain  Status.Painkiller  Status.Concussion
Status.Stun  Status.Burning  Status.Contusion  Status.Cold.Mild  Status.Cold.Severe  Status.Cold.Hypothermic
Status.Dehydrated  Status.SaltSickness  Status.Adrenaline  Status.Shaken  Status.Soaked  Status.Deafened
Status.Stim.Adrenaline  Status.Stim.Focus  Status.Stim.Endurance  Status.Stim.Regen  Status.Stim.SaltTide
Status.Stim.SaltBreath  Status.Stim.SaltClarity  Status.Stim.Combat  Status.Stim.Aftereffect
Status.Familiarity  Status.NewPlayer
```

### Data (set-by-caller)

```
Data.Damage.Base  Data.Damage.Penetration  Data.Damage.ArmorDamage  Data.Damage.Blunt
Data.Heal.Amount  Data.Heal.Rate  Data.Duration  Data.Stamina.Cost  Data.Cold.Delta  Data.Hydration.Delta
```

### Event

```
Event.Damage.Taken  Event.Damage.Dealt  Event.Kill  Event.Death  Event.Downed  Event.Revived
Event.Weapon.Fired  Event.Weapon.Reloaded  Event.Weapon.Malfunction  Event.Weapon.Empty
Event.Item.PickedUp  Event.Item.Used  Event.Item.Dropped  Event.Container.Opened  Event.Container.Searched
Event.Interact.Started  Event.Interact.Completed  Event.Interact.Canceled
Event.Surge.Warning  Event.Surge.Arrival  Event.Surge.Peak  Event.Surge.Lull  Event.Surge.Recede
Event.Extraction.Opened  Event.Extraction.Closed  Event.Extraction.BoatArriving  Event.Extraction.BoatLeft
Event.Extraction.Extracted  Event.Contract.Progress  Event.Contract.Completed
Event.Noise.Footstep  Event.Noise.Gunshot  Event.Noise.Reload  Event.Noise.Loot  Event.Noise.Door
Event.Noise.Glass  Event.Noise.Explosion  Event.Noise.Voice  Event.Noise.Bell  Event.Noise.Engine
Event.Montage.MagDetached  Event.Montage.MagAttached  Event.Montage.Chambered  Event.Montage.Interruptible
Event.Montage.ShellInserted  Event.Montage.HitFrame
```

### Item

```
Item.Category.Weapon  Item.Category.Attachment  Item.Category.Magazine  Item.Category.Ammo
Item.Category.Armor  Item.Category.Helmet  Item.Category.Face  Item.Category.Ears  Item.Category.Rig
Item.Category.Backpack  Item.Category.Case  Item.Category.Medical  Item.Category.Food  Item.Category.Stim
Item.Category.Throwable  Item.Category.Tool  Item.Category.Key  Item.Category.Note  Item.Category.Valuable
Item.Category.Salt  Item.Category.Barter  Item.Category.Contract  Item.Category.Currency
Item.Trait.Hot  Item.Trait.Flammable  Item.Trait.Floats  Item.Trait.Waterproof  Item.Trait.Fragile
Item.Trait.Glows  Item.Trait.Loud  Item.Trait.Large  Item.Trait.NoSecurePouch  Item.Trait.Stackable
Item.Flag.FoundInRaid  Item.Flag.Shakedown  Item.Flag.LockedInTransit
Item.Barter.Electronics  Item.Barter.Hardware  Item.Barter.Fuel  Item.Barter.Fabric  Item.Barter.Chemical
Item.Barter.Gun  Item.Barter.Medical  Item.Barter.Salt
Equip.Primary  Equip.Secondary  Equip.Holster  Equip.Melee  Equip.Helmet  Equip.Face  Equip.Ears
Equip.Armor  Equip.Rig  Equip.Backpack  Equip.SecurePouch  Equip.Radio  Equip.Compass  Equip.Pocket
```

### Weapon, attachment and ammo

```
Weapon.Class.Pistol  Weapon.Class.Revolver  Weapon.Class.MachinePistol  Weapon.Class.SMG  Weapon.Class.PDW
Weapon.Class.Carbine  Weapon.Class.AssaultRifle  Weapon.Class.Bullpup  Weapon.Class.BattleRifle
Weapon.Class.DMR  Weapon.Class.LeverAction  Weapon.Class.BoltAction  Weapon.Class.Shotgun.Pump
Weapon.Class.Shotgun.Break  Weapon.Class.Shotgun.Semi  Weapon.Class.LMG  Weapon.Class.GPMG
Weapon.Class.Launcher  Weapon.Class.Harpoon  Weapon.Class.Utility
Anim.Family.Pistol  Anim.Family.Revolver  Anim.Family.Flare  Anim.Family.AR  Anim.Family.AK  Anim.Family.HK
Anim.Family.PDW  Anim.Family.Bullpup  Anim.Family.Bolt  Anim.Family.Lever  Anim.Family.Pump  Anim.Family.Break
Anim.Family.LMG  Anim.Family.OpenBoltSMG  Anim.Family.Launcher  Anim.Family.Harpoon
Reload.Magazine  Reload.PerRound  Reload.Belt  Reload.Cylinder  Reload.Break  Reload.Stripper  Reload.TopMag
Attachment.Category.Optic  Attachment.Category.Magnifier  Attachment.Category.Sight  Attachment.Category.Mount
Attachment.Category.Muzzle  Attachment.Category.Suppressor  Attachment.Category.Barrel  Attachment.Category.GasBlock
Attachment.Category.GasRegulator  Attachment.Category.Handguard  Attachment.Category.Rail  Attachment.Category.Foregrip
Attachment.Category.Bipod  Attachment.Category.Light  Attachment.Category.Laser  Attachment.Category.Combo
Attachment.Category.Stock  Attachment.Category.BufferTube  Attachment.Category.Buffer  Attachment.Category.CheekRiser
Attachment.Category.ButtPad  Attachment.Category.PistolGrip  Attachment.Category.Trigger  Attachment.Category.TriggerGroup
Attachment.Category.ChargingHandle  Attachment.Category.UpperReceiver  Attachment.Category.LowerReceiver
Attachment.Category.DustCover  Attachment.Category.Slide  Attachment.Category.Frame  Attachment.Category.Hammer
Attachment.Category.MagWell  Attachment.Category.Magazine  Attachment.Category.Choke  Attachment.Category.TubeExtension
Attachment.Category.SideSaddle  Attachment.Category.Lever  Attachment.Category.BoltHandle  Attachment.Category.Reel
Attachment.Category.BeltBox  Attachment.Category.Charm  Attachment.Category.Engraving  Attachment.Category.Killflash
Attachment.Interface.Rail.Picatinny  Attachment.Interface.Rail.MLOK  Attachment.Interface.Rail.Dovetail.AK
Attachment.Interface.Rail.Dovetail.11mm  Attachment.Interface.Rail.ClawHK  Attachment.Interface.Rail.ZipTie
Attachment.Interface.Mount.Rings30  Attachment.Interface.Mount.Rings34  Attachment.Interface.Mount.Scout
Attachment.Interface.Thread.556  Attachment.Interface.Thread.762  Attachment.Interface.Thread.545
Attachment.Interface.Thread.762x39  Attachment.Interface.Thread.9mm  Attachment.Interface.Thread.45
Attachment.Interface.Thread.Pistol  Attachment.Interface.Thread.12ga  Attachment.Interface.Thread.Leviathan
Attachment.Interface.QD.Quietus  Attachment.Interface.QD.Kittredge  Attachment.Interface.QD.HK3Lug
Attachment.Interface.Barrel.AR15  Attachment.Interface.Barrel.AR10  Attachment.Interface.Barrel.AK
Attachment.Interface.Barrel.Fulmar  Attachment.Interface.Barrel.Albatross  Attachment.Interface.Barrel.Frigate
Attachment.Interface.Barrel.Fathom  Attachment.Interface.Barrel.Skua  Attachment.Interface.Barrel.Breaker
Attachment.Interface.Barrel.Break  Attachment.Interface.Barrel.Pistol.Kestrel  Attachment.Interface.Barrel.Rook
Attachment.Interface.Receiver.AR15.Upper  Attachment.Interface.Receiver.AR15.Lower  Attachment.Interface.Receiver.AR10.Upper
Attachment.Interface.Buffer.AR.MilSpec  Attachment.Interface.Buffer.AR.Commercial  Attachment.Interface.Buffer.AR.Fixed
Attachment.Interface.Stock.AK.Fixed  Attachment.Interface.Stock.AK.Folding  Attachment.Interface.Stock.HK.Slot
Attachment.Interface.Stock.Bolt  Attachment.Interface.Stock.Shotgun  Attachment.Interface.Grip.AR  Attachment.Interface.Grip.AK
Attachment.Interface.Grip.HK  Attachment.Interface.Grip.Pistol.Frame  Attachment.Interface.Handguard.AR15
Attachment.Interface.Handguard.AK  Attachment.Interface.Handguard.HK  Attachment.Interface.Handguard.TK
Attachment.Interface.Mag.STANAG  Attachment.Interface.Mag.AK.762  Attachment.Interface.Mag.AK.545
Attachment.Interface.Mag.Kestrel9  Attachment.Interface.Mag.Gannet  Attachment.Interface.Mag.Fulmar
Attachment.Interface.Mag.AR10  Attachment.Interface.Mag.Fathom  Attachment.Interface.Mag.Squall
Attachment.Interface.Mag.Shearwater  Attachment.Interface.Mag.Grackle  Attachment.Interface.Mag.BilgePump
Attachment.Interface.SlingStud  Attachment.Interface.QDSocket
Handguard.FSBCompatible  Gas.Pistol  Gas.Carbine  Gas.Mid  Gas.Rifle
SuppressorRating.Pistol  SuppressorRating.Intermediate  SuppressorRating.FullPower  SuppressorRating.Magnum  SuppressorRating.Shotgun
Caliber.9x19  Caliber.45ACP  Caliber.357  Caliber.57x28  Caliber.556  Caliber.545  Caliber.762x39  Caliber.300BLK
Caliber.762x51  Caliber.762x54R  Caliber.338  Caliber.12ga  Caliber.4570  Caliber.40mm  Caliber.Flare  Caliber.Harpoon
Stat.Weight  Stat.Length  Stat.Ergonomics  Stat.Recoil.Vertical  Stat.Recoil.Horizontal  Stat.Accuracy
Stat.Velocity  Stat.ADSTime  Stat.Sway  Stat.HipSpread  Stat.FireRate  Stat.ReloadSpeed  Stat.Durability.Burn
Stat.Sound  Stat.Flash  Stat.Malfunction  Stat.Heat  Stat.Capacity
```

### Damage, zones, teams, AI, world

```
Damage.Ballistic  Damage.Explosive  Damage.Fragment  Damage.Fire  Damage.Melee  Damage.Drowning
Damage.Fall  Damage.Salt  Damage.Blunt  Damage.Lightning  Damage.Wave
Zone.Head  Zone.Head.Face  Zone.Head.Top  Zone.Head.Back  Zone.Head.Ears  Zone.Neck  Zone.Thorax  Zone.Stomach
Zone.LeftArm  Zone.RightArm  Zone.LeftHand  Zone.RightHand  Zone.LeftLeg  Zone.RightLeg  Zone.LeftFoot  Zone.RightFoot
Zone.SaltGrowth  Zone.BossCore
Team.Player  Team.Hollow  Team.Warden  Team.Neutral
AI.Archetype.Hollow.Shambler  AI.Archetype.Hollow.Crawler  AI.Archetype.Hollow.Wailer  AI.Archetype.Hollow.Bloat
AI.Archetype.Hollow.Brute  AI.Archetype.Hollow.Drowner  AI.Archetype.Warden.Rifleman  AI.Archetype.Warden.Marksman
AI.Archetype.Warden.Gunner  AI.Archetype.Warden.Breacher  AI.Archetype.Warden.Medic  AI.Archetype.Warden.Officer
AI.Archetype.Boss.Ferryman  AI.Archetype.Boss.Choir
AI.State.Unaware  AI.State.Suspicious  AI.State.Alert  AI.State.Engaged  AI.State.Fleeing  AI.State.Retreating
AI.Significance.High  AI.Significance.Medium  AI.Significance.Low
World.Surface.Concrete  World.Surface.Asphalt  World.Surface.Wood  World.Surface.MetalGrate  World.Surface.MetalSheet
World.Surface.MetalThick  World.Surface.Gravel  World.Surface.Grass  World.Surface.Mud  World.Surface.Sand
World.Surface.Shingle  World.Surface.Rock  World.Surface.Carpet  World.Surface.Tile  World.Surface.Glass
World.Surface.WaterShallow  World.Surface.WaterDeep  World.Surface.Flesh  World.Surface.Hollow  World.Surface.Fabric
World.Surface.Paper  World.Surface.Plaster  World.Surface.Brick  World.Surface.Sandbag  World.Surface.Car
World.Env.InteriorSmall  World.Env.InteriorLarge  World.Env.Industrial  World.Env.Town  World.Env.Open
World.Env.Coastal  World.Env.Cliff  World.Env.Water  World.Env.Underground
RaidType.Standard  RaidType.Shakedown  RaidType.Night  RaidType.Skirmish  RaidType.Practice
Surge.Phase.Calm  Surge.Phase.Warning  Surge.Phase.Storm  Surge.Phase.Peak  Surge.Phase.Lull  Surge.Phase.Final
Extraction.Boat  Extraction.Fixed  Extraction.Conditional
Objective.Kill  Objective.HandOver  Objective.FindAndExtract  Objective.Visit  Objective.Place  Objective.Survive
Objective.Use  Objective.Build  Objective.Interact  Objective.Stat
Condition.Headshot  Condition.Night  Condition.DuringSurge  Condition.Suppressed  Condition.Distance.Over50
Condition.Distance.Over100  Condition.Distance.Over300  Condition.Melee  Condition.Unseen  Condition.InWater
Contract.Pool.Main  Contract.Pool.Side  Contract.Pool.Daily  Contract.Pool.Weekly  Contract.Pool.Event
Cosmetic.Clothing.Head  Cosmetic.Clothing.Upper  Cosmetic.Clothing.Outer  Cosmetic.Clothing.Gloves
Cosmetic.Clothing.Lower  Cosmetic.Clothing.Feet  Cosmetic.Finish  Cosmetic.Charm  Cosmetic.Engraving
Cosmetic.Emote  Cosmetic.Gesture  Cosmetic.Title  Cosmetic.Banner  Cosmetic.Emblem  Cosmetic.Reticle
Cosmetic.FacePaint  Cosmetic.Tattoo  Cosmetic.Hair  Cosmetic.FacialHair  Cosmetic.Voice
Note.Style.Typewriter  Note.Style.Handwritten  Note.Style.LANTERN  Note.Style.Child  Note.Style.Printed
Cheat.God  Cheat.InfiniteAmmo  Cheat.NoClip  Cheat.Invisible
```

## 42.2 CONSOLE VARIABLES AND COMMANDS (`sm.` PREFIX)

All cheats are compiled out of Shipping. Commands marked (server) only work on the host or standalone.

| Command | Purpose |
|---|---|
| `sm.combat.stats <weaponId>` | Print computed weapon stats |
| `sm.combat.showtraces 0/1` | Draw projectile paths |
| `sm.combat.showhitboxes 0/1` | Draw hitboxes (and rewound hitboxes on the server) |
| `sm.combat.godmode 0/1` (server) | Invulnerable |
| `sm.combat.infiniteammo 0/1` (server) | |
| `sm.combat.ttksim <weaponId> <ammoId> <distance> <armorClass> <n>` | Run the TTK Monte Carlo and print results |
| `sm.weapon.give <weaponId> [presetId]` (server) | Give a weapon |
| `sm.item.give <itemId> [count]` (server) | Give an item |
| `sm.inv.clear` (server) | |
| `sm.inv.conservation` | Run the conservation check on all inventories |
| `sm.ai.debug 0/1` | AI overlay |
| `sm.ai.spawn <archetype>` (server) | Spawn at the crosshair |
| `sm.ai.freeze 0/1`, `sm.ai.blind 0/1`, `sm.ai.killall` (server) | |
| `sm.ai.wave <n>` (server) | Force a Surge wave spawn |
| `sm.ai.budget` | Print AI cost breakdown |
| `sm.surge.set <dir> <timescale>` (server) | Set the Surge direction and time scale |
| `sm.surge.skipto <phase>` (server) | Jump to a phase |
| `sm.surge.water <zone> <height>` (server) | Override a zone's water height |
| `sm.surge.debug 0/1` | Show zone water levels and the front line |
| `sm.weather.set <preset>` | Force a weather preset (client visual) |
| `sm.time.set <hour>` (server) | Time of day |
| `sm.extract.open <id>`, `sm.extract.callboat <id>` (server) | |
| `sm.raid.end` (server) | End the raid now |
| `sm.raid.checkpoint` (server) | Force a checkpoint upload |
| `sm.net.relevancydebug 0/1` | Show which players are relevant to this client and why |
| `sm.net.stats 0/1/2` | Network overlay |
| `sm.audio.debug 0/1` | Show audio sources, occlusion and layers |
| `sm.audio.noiseevents 0/1` | Show gameplay noise events and radii |
| `sm.ui.screenshots` | Run the UI screenshot suite |
| `sm.test.smoke` | Run the packaged smoke test and exit |
| `sm.perf.benchmark` | Run the benchmark sequence |
| `sm.host.governor 0/1` | Toggle the host performance governor |
| `sm.backend.url <url>` | Override the backend URL (development builds only) |

## 42.3 KEY CONFIG FILES

### 42.3.1 DefaultGame.ini (excerpts)

```ini
[/Script/EngineSettings.GeneralProjectSettings]
ProjectName=SALTMARROW
ProjectVersion=0.1.1001
CompanyName=Elliot Read
Homepage=""
CopyrightNotice=""

[/Script/Engine.AssetManagerSettings]
+PrimaryAssetTypesToScan=(PrimaryAssetType="Weapon",AssetBaseClass=/Script/SaltmarrowWeapons.SMWeaponDefinition,bHasBlueprintClasses=False,Directories=((Path="/Game/Saltmarrow/Weapons")),Rules=(CookRule=AlwaysCook))
+PrimaryAssetTypesToScan=(PrimaryAssetType="Attachment",AssetBaseClass=/Script/SaltmarrowWeapons.SMAttachmentDefinition,bHasBlueprintClasses=False,Directories=((Path="/Game/Saltmarrow/Attachments")),Rules=(CookRule=AlwaysCook))
+PrimaryAssetTypesToScan=(PrimaryAssetType="Item",AssetBaseClass=/Script/SaltmarrowInventory.SMItemDefinition,bHasBlueprintClasses=False,Directories=((Path="/Game/Saltmarrow/Items")),Rules=(CookRule=AlwaysCook))
; ... Ammo, LootTable, Contract, Station, Recipe, TraderStock, Cosmetic, AIArchetype, Reticle, ExtractionDef, ZoneDef, RaidTypeDef, Preset, Achievement, Note

[/Script/SaltmarrowGame.SMGameSettings]
RaidDurationSeconds=1680
MaxPlayersPerRaid=12
ReconnectWindowSeconds=180
CheckpointIntervalSeconds=10
DownedBleedOutSeconds=60
ReviveSeconds=6
MaxDownsPerRaid=2
```

### 42.3.2 DefaultEngine.ini (excerpts beyond part 18)

```ini
[/Script/Engine.RendererSettings]
r.GenerateMeshDistanceFields=True
r.DynamicGlobalIlluminationMethod=1        ; Lumen
r.ReflectionMethod=1                       ; Lumen
r.Shadow.Virtual.Enable=1
r.AntiAliasingMethod=4                     ; TSR
r.Nanite.ProjectEnabled=True
r.CustomDepth=3                            ; enabled with stencil (squad outlines)
r.SkinCache.CompileShaders=True
r.PSOPrecaching=1

[/Script/Engine.PhysicsSettings]
bSubstepping=True
MaxSubstepDeltaTime=0.016667
MaxSubsteps=6

[/Script/Engine.CollisionProfile]
; custom channels
+DefaultChannelResponses=(Channel=ECC_GameTraceChannel1,DefaultResponse=ECR_Block,bTraceType=True,bStaticObject=False,Name="Projectile")
+DefaultChannelResponses=(Channel=ECC_GameTraceChannel2,DefaultResponse=ECR_Ignore,bTraceType=True,bStaticObject=False,Name="Interaction")
+DefaultChannelResponses=(Channel=ECC_GameTraceChannel3,DefaultResponse=ECR_Block,bTraceType=True,bStaticObject=False,Name="Visibility_Relevancy")
+DefaultChannelResponses=(Channel=ECC_GameTraceChannel4,DefaultResponse=ECR_Block,bTraceType=True,bStaticObject=False,Name="Audio")
+DefaultChannelResponses=(Channel=ECC_GameTraceChannel5,DefaultResponse=ECR_Ignore,bTraceType=True,bStaticObject=False,Name="Hitbox")
+DefaultChannelResponses=(Channel=ECC_GameTraceChannel6,DefaultResponse=ECR_Block,bTraceType=True,bStaticObject=False,Name="Mantle")

[/Script/Engine.GarbageCollectionSettings]
gc.CreateGCClusters=True
gc.AllowIncrementalReachability=True

[CrashReportClient]
bAgreeToCrashUpload=true
DataRouterUrl="https://<api domain>/v1/crash"
```

### 42.3.3 Physical materials

One physical material per `World.Surface.*` tag: `PM_Concrete`, `PM_Asphalt`, `PM_Wood`, `PM_MetalGrate`, `PM_MetalSheet`, `PM_MetalThick`, `PM_Gravel`, `PM_Grass`, `PM_Mud`, `PM_Sand`, `PM_Shingle`, `PM_Rock`, `PM_Carpet`, `PM_Tile`, `PM_Glass`, `PM_WaterShallow`, `PM_WaterDeep`, `PM_Flesh`, `PM_Hollow`, `PM_Fabric`, `PM_Paper`, `PM_Plaster`, `PM_Brick`, `PM_Sandbag`, `PM_Car`. Each is a `USMPhysicalMaterial` subclass with: surface tag, penetration resistance per cm (part 05.6.1), ricochet eligibility, impact effect set, footstep sound set, bullet hole decal set, audio occlusion values (part 28.6), and whether it's "hard" for ricochets.

### 42.3.4 Scalability (DefaultScalability.ini overrides)

Map each preset's custom values (part 25.9) into the scalability groups with our additions, e.g.:

```ini
[EffectsQuality@0]
sm.Rain.MaxParticles=4000
fx.Niagara.QualityLevel=0
[EffectsQuality@1]
sm.Rain.MaxParticles=8000
[EffectsQuality@2]
sm.Rain.MaxParticles=12000
[EffectsQuality@3]
sm.Rain.MaxParticles=16000

[GlobalIlluminationQuality@0]
r.DynamicGlobalIlluminationMethod=0
r.Lumen.DiffuseIndirect.Allow=0
sm.LowGIFill.Enable=1
[GlobalIlluminationQuality@1]
r.DynamicGlobalIlluminationMethod=1
r.Lumen.ScreenProbeGather.DownsampleFactor=32
sm.LowGIFill.Enable=0
```

Never put fairness-relevant values (fog density, smoke opacity, cover foliage) in scalability groups. The fairness test (part 34.12) enforces it.

---

End of part 42. Next: `43_APPENDIX_BALANCE.md`.
