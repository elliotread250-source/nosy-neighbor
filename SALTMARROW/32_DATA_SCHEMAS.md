# SALTMARROW: PART 32, DATA SCHEMAS

Every data type in the game, field by field. These are the shapes of the Primary Data Assets (registered with the Asset Manager as primary asset types), the structs inside them, and their JSON forms in the exported catalog. Keep the C++ and the JSON names identical (camelCase in JSON, PascalCase in C++, with a mechanical conversion in the exporter). When a field is added here, add it to the exporter and the backend's TypeBox schema in the same commit.

All definitions derive from `USMPrimaryDataAsset` (which derives from `UPrimaryDataAsset`) with a stable `FName Id` (the catalog ID, e.g. `WPN_Mako`), used everywhere instead of asset paths. The Asset Manager settings register types: `Weapon`, `Attachment`, `Ammo`, `Item`, `LootTable`, `Contract`, `Station`, `Recipe`, `TraderStock`, `Cosmetic`, `AIArchetype`, `Reticle`, `ExtractionDef`, `ZoneDef`, `RaidTypeDef`, `Preset`, `Achievement`, `Note`.

---

## 32.1 COMMON STRUCTS

```cpp
UENUM() enum class ESMRarity : uint8 { Junk, Common, Uncommon, Rare, Epic, Legendary };
UENUM() enum class ESMTier : uint8 { T0, T1, T2, T3, T4 };

USTRUCT() struct FSMItemSize { UPROPERTY() uint8 W = 1; UPROPERTY() uint8 H = 1; };

USTRUCT() struct FSMStatModifier
{
    UPROPERTY() FGameplayTag Stat;              // Stat.Ergonomics, Stat.Recoil.Vertical, ...
    UPROPERTY() ESMModOp Op;                    // AddFlat, AddPercent, Multiply, Override, Min, Max
    UPROPERTY() float Value;
    UPROPERTY() int32 Priority = 0;             // for Override
};

USTRUCT() struct FSMItemCost { UPROPERTY() FName ItemId; UPROPERTY() int32 Count = 1; UPROPERTY() bool bRequireFiR = false; };

USTRUCT() struct FSMRequirementSet
{
    UPROPERTY() int64 Scrip = 0;
    UPROPERTY() TArray<FSMItemCost> Items;
    UPROPERTY() int32 AccountLevel = 0;
    UPROPERTY() TMap<FName, int32> TraderLoyalty;   // trader id -> level
    UPROPERTY() TMap<FName, int32> Stations;        // station id -> level
    UPROPERTY() TArray<FName> ContractsCompleted;
};

USTRUCT() struct FSMReward
{
    UPROPERTY() int32 XP = 0;
    UPROPERTY() int64 Scrip = 0;
    UPROPERTY() TArray<FSMItemCost> Items;          // granted to stash
    UPROPERTY() TMap<FName, float> Reputation;      // trader id -> delta
    UPROPERTY() TArray<FName> CosmeticUnlocks;
    UPROPERTY() TArray<FName> StockUnlocks;         // trader stock entries unlocked
    UPROPERTY() FName Title;
};
```

## 32.2 ITEM DEFINITION (BASE)

```cpp
UCLASS() class USMItemDefinition : public USMPrimaryDataAsset
{
    UPROPERTY(EditDefaultsOnly) FText DisplayName;
    UPROPERTY(EditDefaultsOnly) FText ShortName;           // <= 10 chars for cells
    UPROPERTY(EditDefaultsOnly) FText Description;         // in-world voice
    UPROPERTY(EditDefaultsOnly) FGameplayTag Category;     // Item.Category.Medical ...
    UPROPERTY(EditDefaultsOnly) FGameplayTagContainer Traits; // Item.Trait.Hot, Item.Trait.Flammable, Item.Trait.Floats, Item.Trait.Waterproof ...
    UPROPERTY(EditDefaultsOnly) ESMRarity Rarity;
    UPROPERTY(EditDefaultsOnly) int64 BaseValue;
    UPROPERTY(EditDefaultsOnly) float Weight;              // kg
    UPROPERTY(EditDefaultsOnly) FSMItemSize Size;
    UPROPERTY(EditDefaultsOnly) int32 MaxStack = 1;
    UPROPERTY(EditDefaultsOnly) bool bCanRotate = true;
    UPROPERTY(EditDefaultsOnly) bool bRequiresExamine = true;
    UPROPERTY(EditDefaultsOnly) float ExamineTime = 1.5f;
    UPROPERTY(EditDefaultsOnly) TSoftObjectPtr<UStaticMesh> WorldMesh;   // pickup and inspect
    UPROPERTY(EditDefaultsOnly) TSoftObjectPtr<UTexture2D> Icon;         // generated
    UPROPERTY(EditDefaultsOnly) FTransform IconCameraOverride;
    UPROPERTY(EditDefaultsOnly) TSoftObjectPtr<USoundBase> PickupSound, DropSound, MoveSound;
    UPROPERTY(EditDefaultsOnly) float SearchRevealTime = 0.6f;   // when found in containers
    UPROPERTY(EditDefaultsOnly, Instanced) TArray<TObjectPtr<USMItemFragment>> Fragments;
    UPROPERTY(EditDefaultsOnly) ESMTier Tier;
    UPROPERTY(EditDefaultsOnly) TArray<FName> TradersThatBuy;  // empty = derive from category
};
```

### 32.2.1 Fragments

```cpp
// Medical
UCLASS() class USMItemFragment_Medical : public USMItemFragment {
    float UseTime; int32 Uses; float HPPool; float HealRate;
    bool bStopsLightBleed, bStopsHeavyBleed, bFixesFracture, bRestoresDestroyedZone;
    float DestroyedZoneMaxPenalty = 0.25f; float PainSuppressDuration;
    TArray<TSubclassOf<UGameplayEffect>> AppliedEffects; float LimbOnly = false;
    float StaminaCostPerUse = 0; };

// Food and drink
UCLASS() class USMItemFragment_Consumable : public USMItemFragment {
    float UseTime; int32 Uses; float Hydration; float HPRegenPerSecond; float HPRegenDuration;
    float ColdDelta; TArray<TSubclassOf<UGameplayEffect>> AppliedEffects; };

// Stimulant
UCLASS() class USMItemFragment_Stim : public USMItemFragment {
    TSubclassOf<UGameplayEffect> Effect; TSubclassOf<UGameplayEffect> AfterEffect; float UseTime = 1.0f; };

// Container (backpacks, rigs, cases)
UCLASS() class USMItemFragment_Container : public USMItemFragment {
    TArray<FSMGridDef> Grids;                // each: W, H, layout position in UI, accepted categories query, max item size
    FGameplayTagQuery AcceptQuery;           // what can go in at all
    bool bMustBeEmptyToNest = true;
    bool bWaterproof = false; float SpaceFactorForSalt = 1.0f; // salt hauler: 0.5
    FGameplayTag EquipSlot;                  // Equip.Backpack, Equip.Rig, or none for cases
    bool bLarge = false; bool bLoud = false; };

// Magazine
UCLASS() class USMItemFragment_Magazine : public USMItemFragment {
    FGameplayTag Caliber; int32 Capacity; FGameplayTag WellInterface; float ReloadSpeedMod;
    float MalfunctionMod; float LoadTimePerRound = 0.4f; bool bWitnessWindow; };

// Ammunition (the item side; ballistics live in USMAmmoDefinition, 32.4)
UCLASS() class USMItemFragment_Ammo : public USMItemFragment { TObjectPtr<USMAmmoDefinition> Ammo; };

// Armor
UCLASS() class USMItemFragment_Armor : public USMItemFragment {
    int32 ArmorClass; FGameplayTagContainer CoveredZones; FGameplayTag Material; float MaxDurability;
    float BluntThroughput; float RicochetChance; float MovePenalty; float TurnPenalty; float ErgoPenalty;
    float HearingPenalty; FGameplayTagContainer BlocksSlots; bool bHasIntegratedRig; FSMGridDef IntegratedRig;
    TSoftObjectPtr<USkeletalMesh> WornMesh; };

// Equipment (helmets, face, ears)
UCLASS() class USMItemFragment_Equipment : public USMItemFragment {
    FGameplayTag Slot; FGameplayTagContainer BlocksSlots; float HearingAmplify; float LoudCompression;
    float FlashProtection; float FOVVignette; TSoftObjectPtr<USkeletalMesh> WornMesh;
    TArray<TSubclassOf<UGameplayEffect>> WhileEquippedEffects; };

// Throwable
UCLASS() class USMItemFragment_Throwable : public USMItemFragment {
    TSubclassOf<ASMThrownProjectile> ProjectileClass; float Fuse; bool bImpact; float ThrowSpeedOverhand = 18.f;
    float ThrowSpeedUnderhand = 8.f; };

// Key
UCLASS() class USMItemFragment_Key : public USMItemFragment { FName KeyId; int32 MaxUses; FText LocationHint; };

// Note
UCLASS() class USMItemFragment_Note : public USMItemFragment { FName NoteId; };

// Salt
UCLASS() class USMItemFragment_Salt : public USMItemFragment {
    float DetectionBonus; float GlowIntensity; float HumRadius; bool bAttractsHollows; float AttractRadius; };

// Tool (barometer, compass, scanner, rebreather, repair kits, lockpicks, salt pick, boat repair, fuel)
UCLASS() class USMItemFragment_Tool : public USMItemFragment {
    FGameplayTag ToolType; int32 Uses; float UseTime; TMap<FName, float> Params; };

// Contract item
UCLASS() class USMItemFragment_ContractItem : public USMItemFragment { FName ContractId; bool bSpawnsOnlyForHolder = true; };

// Currency
UCLASS() class USMItemFragment_Currency : public USMItemFragment { };
```

## 32.3 WEAPON DEFINITION

```cpp
UCLASS() class USMWeaponDefinition : public USMItemDefinition   // a weapon is an item
{
    FText Manufacturer; FGameplayTag WeaponClass;               // Weapon.Class.AssaultRifle ...
    FGameplayTag AnimFamily;                                     // Anim.Family.AR, .AK, .HK, .Bolt, ...
    TSubclassOf<ASMWeapon> WeaponActorClass;
    TSoftObjectPtr<USkeletalMesh> ReceiverMesh;
    TSubclassOf<UAnimInstance> WeaponAnimClass;
    TSubclassOf<UAnimInstance> CharacterAnimLayer;               // ALI implementation for this family
    TArray<FSMSlotDef> Slots;                                    // receiver root slots (see 32.5.1)
    TArray<FSMDefaultPart> StockParts;                           // the trader configuration
    FSMWeaponBaseStats BaseStats;                                // see below
    TArray<ESMFireMode> FireModes;                               // in selector order
    int32 BurstCount = 3; float BurstRPM = 0;
    bool bOpenBolt = false; bool bClosedBolt = true; int32 InternalMagCapacity = 0; // for internal mags/tubes
    FGameplayTag ReloadStyle;                                    // Reload.Magazine, .PerRound, .Belt, .Cylinder, .Break, .Stripper
    float BoltCycleTime = 0; float PumpTime = 0;
    float DurabilityBurnPerShot; FGameplayTagContainer MalfunctionTypes;
    float HeatPerShot = 0; float HeatDissipation = 0; bool bHasBarrelChange = false;
    float SoundRadius; FGameplayTag SoundSet;                    // audio
    TSoftObjectPtr<UCameraShakeBase> FireShake;
    FSMRecoilProfile Recoil; FSMProceduralMotionProfile Motion;  // part 05
    TArray<FName> Presets;                                       // USMWeaponPreset ids
    bool bUsableUnderwater = false; bool bUsableChestDeep = false; // pistols true
    TArray<FSMHandPose> HandPoses;                               // per grip type
};

USTRUCT() struct FSMWeaponBaseStats {
    float Ergonomics; float RecoilVertical; float RecoilHorizontal; float FirstShotMultiplier = 1.3f;
    float RecoilRecoveryRate; float RecoilRecoveryDelay; float CameraKickRatio = 0.65f;
    float AccuracyMOA; float HipSpread; float RPM; float ADSTime; float ReloadTactical; float ReloadEmpty;
    float ReloadFast; float SwayAmplitude; float SwayFrequency; float EffectiveRange;
    float MassRef; float InertiaRef; float BalanceIdealCm; };

USTRUCT() struct FSMRecoilProfile {
    TObjectPtr<UCurveVector2D> Pattern;      // shot index -> bias
    FVector VisualKickLocation; FRotator VisualKickRotation; float SpringStiffness; float SpringDamping; };
```

## 32.4 AMMO DEFINITION

```cpp
UCLASS() class USMAmmoDefinition : public USMPrimaryDataAsset {
    FGameplayTag Caliber; FText DisplayName; bool bTracer; FLinearColor TracerColor;
    float MuzzleVelocityRef; float RefBarrelInches; float VelocitySensitivity;   // per inch
    float DragK; float WindSensitivity; float MassGrams;
    float BaseDamage; float Penetration; float ArmorDamagePct;
    TObjectPtr<UCurveFloat> DamageFalloff;     // velocity fraction -> damage multiplier
    int32 Projectiles = 1; TObjectPtr<USMSpreadPattern> PelletPattern;          // shotguns
    float LightBleedChance; float HeavyBleedChance; float FractureChance;
    bool bIncendiary; bool bSubsonic;          // computed from velocity but cached
    float DurabilityBurnMod = 1.0f; float RecoilMod = 1.0f; float AccuracyMod = 1.0f;
    float RicochetChanceMod = 1.0f; FGameplayTag ImpactEffectSet;
    TObjectPtr<USMItemDefinition> ItemDef;     // the inventory item for this ammo
};
```

## 32.5 ATTACHMENT DEFINITION

```cpp
UCLASS() class USMAttachmentDefinition : public USMItemDefinition {
    FText Manufacturer; FGameplayTag AttachmentCategory;           // Attachment.Category.Optic ...
    FGameplayTagContainer ProvidesInterfaces;                       // what it plugs into (Attachment.Interface.Rail.Picatinny)
    FGameplayTagContainer Traits;                                   // Caliber.*, SuppressorRating.*, Gas.*, Handguard.FSBCompatible
    TSoftObjectPtr<UStreamableRenderAsset> Mesh;                    // static or skeletal
    TSubclassOf<UAnimInstance> AnimClass;                           // for animated parts
    FTransform AttachOffset;
    TArray<FSMSlotDef> Slots;                                       // child slots
    TArray<FSMStatModifier> Modifiers;
    FGameplayTagQuery BlocksQuery;                                  // slots it blocks
    int32 RailFootprint = 0;                                        // for rail-mounted parts
    float SilhouetteImportance = 0;                                 // part 08.6.1
    bool bSkinnable = true;
    FSMAttachmentFunctional Functional;                             // variant by category, below
};

USTRUCT() struct FSMSlotDef {
    FName SlotName; FName Socket; FGameplayTagQuery Accepts; bool bRequired; FName DefaultPart;
    bool bIsRail = false; FVector RailDirection = FVector::ForwardVector; int32 RailLength = 0; float RailPitchCm = 1.0f;
    FText DisplayName; };

USTRUCT() struct FSMAttachmentFunctional {
    // Optic
    float MagMin = 1, MagMax = 1; bool bFFP = false; FName ReticleId; float EyeReliefMinCm, EyeReliefMaxCm, EyeReliefIdealCm;
    float ScopeFOVAt1x; TArray<int32> ZeroSteps; bool bIlluminated; int32 IllumLevels; bool bThermal; bool bNightVision;
    float BatteryMinutes; FName LensMaterialPreset; float ADSPenalty; bool bMagnifierFlip; bool bGlint;
    // Muzzle / suppressor
    float SoundReductionSuper, SoundReductionSub; float FlashReduction; float HeatPerShot; float POIShiftMOA;
    float BackpressureRPMBonus; float BackpressureMalfunction; FGameplayTag MuzzleFlashSet; FGameplayTag SuppressedSoundSet;
    float Degradation = 0;  // oil filter
    // Barrel
    float LengthInches; float MOA; float DurabilityMult; FGameplayTag CaliberTag; FGameplayTag GasLength;
    // Light / laser
    float Lumens; float BeamAngle; TArray<FGameplayTag> Modes; FLinearColor LaserColor; bool bIR;
    // Stock
    int32 Positions; float FoldedErgo; float FoldedRecoil; float CheekHeightCm; float LengthOfPullCm;
    // Bipod
    float DeployHeightCm; float PanDeg; bool bCant;
    // Gas
    TArray<FGameplayTag> GasSettings;
    // Trigger
    TArray<ESMFireMode> FireModeOverride;
};
```

## 32.6 WEAPON PRESET

```cpp
UCLASS() class USMWeaponPreset : public USMPrimaryDataAsset {
    FName WeaponId; FText DisplayName; FText Description;
    TArray<FSMPresetPart> Parts;  // { PartId, ParentIndex, Slot, RailPos }
    FName DefaultAmmo; };
```

## 32.7 LOOT TABLE

```cpp
UCLASS() class USMLootTable : public USMPrimaryDataAsset {
    FInt32Interval Rolls; float NothingWeight;
    TArray<FSMLootEntry> Entries; };

USTRUCT() struct FSMLootEntry {
    FName ItemId;               // or
    FName TableId;              // nested
    float Weight; FInt32Interval Stack = {1,1}; FFloatInterval DurabilityRange = {0.4f, 1.0f};
    FGameplayTagQuery Conditions; // RaidType.*, Zone.Tier.*, Surge.Phase.*, Contract.Active.<id>
    bool bApplyRarityMultiplier = true; };
```

Loot spawn points and containers reference tables by ID. The exporter writes tables flattened (nested tables resolved into expected-value form) for the backend's plausibility checks.

## 32.8 CONTRACT

```cpp
UCLASS() class USMContractDefinition : public USMPrimaryDataAsset {
    FName TraderId; FText Title; FText Description; FText CompletionText; FText FailText;
    FSMRequirementSet Prerequisites; TArray<FSMObjective> Objectives; FSMReward Reward;
    bool bRepeatable = false; FGameplayTag Pool;   // Contract.Pool.Daily, .Weekly, .Main, .Side
    bool bSingleRaid = false; FGameplayTagQuery FailConditions;
    TArray<FName> SpawnsContractItems;              // item ids with spawn locations (via world markers)
    int32 SortOrder; FName ChainNext; };

USTRUCT() struct FSMObjective {
    FName ObjectiveId; FGameplayTag Type;           // Objective.Kill, .HandOver, .FindAndExtract, .Visit, .Place, .Survive, .Use, .Build, .Interact, .Stat
    FText Description; int32 Count = 1;
    FGameplayTagQuery TargetQuery;                  // e.g. AI.Archetype.Hollow.Shambler, Team.Player
    FName ZoneId; FName LocationId; FName ItemId; FGameplayTag ItemCategory; bool bRequireFiR;
    FGameplayTagQuery ConditionQuery;               // Weapon.Class.*, Condition.Headshot, Condition.Night, Condition.DuringSurge, Condition.Distance.Over100
    float MinDistance = 0; FName ExtractionId;
    FSMBuildRequirement Build;                      // for Objective.Build: stat thresholds and required part categories
    bool bOptional = false; };
```

## 32.9 STATION AND RECIPE

```cpp
UCLASS() class USMStationDefinition : public USMPrimaryDataAsset {
    FText DisplayName; FText Description; FName ShipLocation;     // camera spot id
    TArray<FSMStationLevel> Levels; };

USTRUCT() struct FSMStationLevel {
    int32 Level; FText EffectsText; FSMRequirementSet Requirements; int32 BuildSeconds;
    TArray<FSMStationEffect> Effects;   // { Type: StashRows / SecurePouchSize / BuildSlots / RepairDiscount / CraftSlots / Unlock, Value, Id }
    TArray<FName> UnlocksRecipes; FName VisualStateId; };

UCLASS() class USMRecipeDefinition : public USMPrimaryDataAsset {
    FName StationId; int32 StationLevel; TArray<FSMItemCost> Inputs; FSMItemCost Output; int32 Seconds; };
```

## 32.10 TRADER

```cpp
UCLASS() class USMTraderDefinition : public USMPrimaryDataAsset {
    FText DisplayName; FText Title; TSoftObjectPtr<UTexture2D> Portrait; FName StationCameraSpot;
    float Markup; float BuyRate; TMap<FGameplayTag, float> CategoryBuyRates;   // overrides (Agnes: Salt 0.8)
    FGameplayTagQuery BuysQuery;
    TArray<FSMLoyaltyLevel> Loyalty;   // requirements and discount per level
    TArray<FSMStockEntry> Stock;       // { EntryId, ItemId or PresetId, Count, RestockHours, LoyaltyRequired, UnlockedByContract }
    TArray<FSMBarterEntry> Barters;
    FName DialogueTable; };
```

## 32.11 COSMETIC

```cpp
UCLASS() class USMCosmeticDefinition : public USMPrimaryDataAsset {
    FGameplayTag Type;  // Cosmetic.Clothing.Head, .Finish, .Charm, .Engraving, .Emote, .Gesture, .Title, .Banner, .Emblem, .Reticle, .FacePaint, .Tattoo
    FText DisplayName; FText UnlockText; ESMRarity Rarity; TSoftObjectPtr<UTexture2D> Icon;
    TSoftObjectPtr<UObject> Asset;      // mesh, material instance, montage, texture
    TArray<FLinearColor> ColorVariants; int64 DoraPrice = 0;   // 0 = not sold
    bool bHasEmissive = false; float EmissiveLuminance = 0;    // validated against the readability cap
    FGameplayTagContainer BodyMask;     // body sections hidden
    bool bFitsUnderHelmet = false; };
```

## 32.12 AI ARCHETYPE

```cpp
UCLASS() class USMAIArchetype : public USMPrimaryDataAsset {
    FGameplayTag ArchetypeTag; TSubclassOf<ASMAICharacter> CharacterClass;
    TArray<TSoftObjectPtr<USkeletalMesh>> MeshVariants; TArray<FName> ClothingVariants;
    TSubclassOf<UAnimInstance> AnimClass; TObjectPtr<UStateTree> StateTree;
    FSMPerceptionConfig Perception;     // sight range, cone, hearing multiplier, salt sense, detection rates
    TObjectPtr<ULyraAbilitySet> AbilitySet; FSMAttributeDefaults Attributes;
    TMap<FGameplayTag, float> ZoneMultipliers;   // Zone.Head 2.0 etc.
    FName LootTable; float LootChance; FName SoundSet; int32 XP;
    FSMAILoadoutPool Loadouts;          // Wardens: weapon presets, armor, helmet, rig, meds, with weights
    float WalkSpeed, RunSpeed; float ScaleMin = 0.92f, ScaleMax = 1.08f; };
```

## 32.13 WORLD DEFINITIONS

```cpp
UCLASS() class USMZoneDef : public USMPrimaryDataAsset {
    FText DisplayName; FName District; int32 LootTier; float DangerMultiplier;
    float BaseElevation; float MaxFloodHeight; float FloodLag;
    TArray<float> ExposureByDirection;   // 8
    TArray<float> DelayByDirection;      // 8, seconds
    TArray<float> PeakByWave;            // 3, meters
    FGameplayTag EnvironmentClass;       // for audio tails and ambience
    FName AmbienceBed; };

UCLASS() class USMExtractionDef : public USMPrimaryDataAsset {
    FText DisplayName; FGameplayTag Type;       // Extraction.Boat, .Fixed, .Conditional
    TArray<FSMTimeWindow> Windows;              // seeded ranges
    TArray<FSMExtractionConditionDef> Conditions; float BoardingSeconds; float HoldSeconds = 8.f;
    FName BoatClass; FName ApproachSpline; FName ExitSpline; bool bNightOnly; TArray<FGameplayTag> RaidTypes;
    FText MapHint; };

UCLASS() class USMRaidTypeDef : public USMPrimaryDataAsset {
    FText DisplayName; float Duration; int32 MaxPlayers; bool bRiskless; bool bMatchmade;
    float HollowDensity; bool bWardens; float RarityBonus; FName SurgeProfile; FName TimeOfDayProfile;
    FSMRequirementSet Unlock; };
```

## 32.14 RETICLE

```cpp
UCLASS() class USMReticleDefinition : public USMPrimaryDataAsset {
    FText DisplayName; ESMAngleUnit Units;   // MOA or Mil
    TArray<FSMReticlePrimitive> Primitives;  // { Type: Dot/Circle/Line/Chevron/Hash/Text, Pos, Size, Thickness, Rotation, Text }
    bool bGeneratedBDC = false; FName BDCAmmo; int32 BDCZero; TArray<int32> BDCDistances;
    FLinearColor DefaultColor; bool bIlluminatedCenterOnly; };
```

## 32.15 NOTES AND ACHIEVEMENTS

```cpp
UCLASS() class USMNoteDefinition : public USMPrimaryDataAsset {
    FText Title; FText Body; FGameplayTag Style;   // Note.Style.Typewriter, .Handwritten, .LANTERN, .Child, .Printed
    FName Location; FName JournalSection; FName UnlocksLore; };

UCLASS() class USMAchievementDefinition : public USMPrimaryDataAsset {
    FText Title; FText Description; FName StatKey; int64 Threshold; FSMReward Reward; bool bHidden; };
```

## 32.16 THE CATALOG EXPORT FORMAT

The exporter writes one JSON file per build:

```json
{
  "catalogVersion": "1057",
  "generatedAt": "2026-10-16T20:00:00Z",
  "items":       { "MED_Bandage": { "category": "Item.Category.Medical", "rarity": "Common", "baseValue": 1800, "weight": 0.05, "size": [1,1], "maxStack": 1, "traits": [], "fragments": { "medical": { "useTime": 3.0, "uses": 1, "stopsLightBleed": true } } } },
  "weapons":     { "WPN_Mako": { "...item fields": "", "slots": [ ... ], "stockParts": [ ... ], "baseStats": { ... }, "fireModes": ["Semi","Auto"] } },
  "attachments": { "OPT_LumenR2": { "...item fields": "", "category": "Attachment.Category.Optic", "provides": ["Attachment.Interface.Rail.Picatinny"], "slots": [], "modifiers": [ { "stat": "Stat.Ergonomics", "op": "AddFlat", "value": -1 } ], "blocks": null, "railFootprint": 4 } },
  "ammo":        { "AMMO_556_M855": { "caliber": "Caliber.556", "muzzleVelocityRef": 940, "refBarrelInches": 20, "baseDamage": 50, "penetration": 14, "armorDamagePct": 55, "itemDef": "AMMO_556_M855_Item" } },
  "lootTables":  { "...": "" },
  "lootExpected":{ "standard": { "mean": 4120000, "stdev": 610000 }, "night": { "mean": 5300000, "stdev": 820000 } },
  "contracts":   { "...": "" },
  "stations":    { "...": "" },
  "recipes":     { "...": "" },
  "traders":     { "...": "" },
  "cosmetics":   { "...": "" },
  "presets":     { "...": "" },
  "raidTypes":   { "...": "" },
  "extractions": { "...": "" },
  "achievements":{ "...": "" },
  "tagHierarchy":[ "Attachment.Interface.Rail.Picatinny", "..." ]
}
```

Tag queries are exported in a simple JSON form (`{ "all": [...], "any": [...], "none": [...] }` nested) that the TypeScript validator evaluates. Keep tag queries in data within that expressible subset.

## 32.17 DATA ENTRY WORKFLOW

For bulk content (items, attachments, loot tables, contracts), keep a human-editable source in `design/data/*.csv` or `*.yaml`, and generate the data assets from it with the authoring toolsets (part 30.9). The data assets are the runtime truth; the CSV/YAML is the authoring truth. Regenerate assets from source with a toolset call, never edit both by hand. A CI check verifies the assets match the source files (by regenerating into a temp folder and diffing the exported catalog).

---

End of part 32. Next: `33_INPUT_CONTROLS_ACCESSIBILITY.md`.
