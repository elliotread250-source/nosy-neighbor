# SALTMARROW: PART 55, REFERENCE CODE SKELETONS

Starting skeletons for the classes that everything else depends on. They're not complete implementations; they're the shapes, with the important signatures, members and comments, so the architecture in parts 04, 05, 08, 11, 15, 18 and 20 lands in code the same way it was designed. Adapt names to the engine version's APIs (verify each engine call against the installed source; signatures drift between versions). Where Lyra provides a base class, derive from it.

---

## 55.1 THE MOVEMENT COMPONENT AND ITS SAVED MOVE (PART 04)

```cpp
// SMCharacterMovementComponent.h
#pragma once
#include "GameFramework/CharacterMovementComponent.h"
#include "SMCharacterMovementComponent.generated.h"

UENUM(BlueprintType)
enum class ESMCustomMovementMode : uint8
{
    None, Mantling, Vaulting, LadderClimbing, Wading, Prone, Downed, BoatSeated
};

UENUM(BlueprintType)
enum class ESMGait : uint8 { Walk, Jog, Sprint };

USTRUCT()
struct FSMMantleState
{
    GENERATED_BODY()
    UPROPERTY() FVector_NetQuantize10 StartLocation;
    UPROPERTY() FVector_NetQuantize10 TargetLocation;
    UPROPERTY() float StartTime = 0.f;       // server world time
    UPROPERTY() float Duration = 0.f;
    UPROPERTY() uint8 Type = 0;              // 0 low, 1 high, 2 vault
};

// Extra per-move data beyond the 4 compressed flags.
struct FSMCharacterNetworkMoveData : public FCharacterNetworkMoveData
{
    uint8 GaitAndStance = 0;   // 2 bits gait, 2 bits stance, 2 bits aim, 2 bits lean sign
    int8 LeanAnalog = 0;       // -127..127
    uint8 WeightBracket = 0;   // 0 none, 1 burdened, 2 overloaded, 3 immobile
    uint8 InjuryFlags = 0;     // bit0 left leg fx, bit1 right leg fx
    FSMMantleState Mantle;     // only serialized when mantling (bit in GaitAndStance high nibble or a separate flag)

    virtual void ClientFillNetworkMoveData(const FSavedMove_Character& ClientMove, ENetworkMoveType MoveType) override;
    virtual bool Serialize(UCharacterMovementComponent& CharacterMovement, FArchive& Ar, UPackageMap* PackageMap, ENetworkMoveType MoveType) override;
};

struct FSMCharacterNetworkMoveDataContainer : public FCharacterNetworkMoveDataContainer
{
    FSMCharacterNetworkMoveDataContainer() { NewMoveData = &MoveData[0]; PendingMoveData = &MoveData[1]; OldMoveData = &MoveData[2]; }
    FSMCharacterNetworkMoveData MoveData[3];
};

class FSMSavedMove : public FSavedMove_Character
{
public:
    uint8 SavedGaitAndStance = 0;
    int8 SavedLean = 0;
    uint8 SavedWeightBracket = 0;
    uint8 SavedInjuryFlags = 0;
    FSMMantleState SavedMantle;

    virtual void Clear() override;
    virtual void SetMoveFor(ACharacter* C, float InDeltaTime, FVector const& NewAccel, FNetworkPredictionData_Client_Character& ClientData) override;
    virtual void PrepMoveFor(ACharacter* C) override;
    virtual bool CanCombineWith(const FSavedMovePtr& NewMove, ACharacter* InCharacter, float MaxDelta) const override;
    virtual uint8 GetCompressedFlags() const override;
};

class FSMNetworkPredictionData_Client : public FNetworkPredictionData_Client_Character
{
public:
    FSMNetworkPredictionData_Client(const UCharacterMovementComponent& ClientMovement) : FNetworkPredictionData_Client_Character(ClientMovement) {}
    virtual FSavedMovePtr AllocateNewMove() override { return FSavedMovePtr(new FSMSavedMove()); }
};

UCLASS()
class SALTMARROWGAME_API USMCharacterMovementComponent : public UCharacterMovementComponent // or ULyraCharacterMovementComponent
{
    GENERATED_BODY()
public:
    USMCharacterMovementComponent();

    // Speeds in cm/s (part 04.2.1). Tuned in data via USMMovementSettings.
    UPROPERTY(EditDefaultsOnly, Category="SM|Speed") float WalkSpeed = 180.f;
    UPROPERTY(EditDefaultsOnly, Category="SM|Speed") float JogSpeed = 360.f;
    UPROPERTY(EditDefaultsOnly, Category="SM|Speed") float SprintSpeed = 560.f;
    UPROPERTY(EditDefaultsOnly, Category="SM|Speed") float ADSSpeed = 190.f;
    UPROPERTY(EditDefaultsOnly, Category="SM|Speed") float ProneSpeed = 65.f;

    // Client-set intent (predicted)
    ESMGait RequestedGait = ESMGait::Jog;
    bool bWantsProne = false;
    bool bWantsADS = false;
    int8 LeanInput = 0;

    // Replicated-by-move state
    uint8 WeightBracket = 0;
    uint8 InjuryFlags = 0;
    FSMMantleState MantleState;

    // Queries
    float GetWaterDepthAtLocation() const;          // via USMWaterQuerySubsystem
    bool TryStartMantle();                           // part 04.5.1 detection
    bool CanProneAt(const FVector& Location, float Yaw) const; // part 04.6 body box

    // UCharacterMovementComponent
    virtual float GetMaxSpeed() const override;
    virtual float GetMaxAcceleration() const override;
    virtual void UpdateFromCompressedFlags(uint8 Flags) override;
    virtual FNetworkPredictionData_Client* GetPredictionData_Client() const override;
    virtual void OnMovementUpdated(float DeltaSeconds, const FVector& OldLocation, const FVector& OldVelocity) override;
    virtual void PhysCustom(float DeltaTime, int32 Iterations) override;
    virtual void MoveAutonomous(float ClientTimeStamp, float DeltaTime, uint8 CompressedFlags, const FVector& NewAccel) override;

protected:
    void PhysMantle(float DeltaTime, int32 Iterations);   // moves along a curve from Start to Target over Duration
    void PhysLadder(float DeltaTime, int32 Iterations);
    void PhysWading(float DeltaTime, int32 Iterations);   // walking with depth-based speed and drag
    void PhysProne(float DeltaTime, int32 Iterations);    // walking with body box checks
    float ComputeEncumbranceMultiplier() const;           // part 43.5
    float ComputeInjuryMultiplier() const;

private:
    FSMCharacterNetworkMoveDataContainer MoveDataContainer;
};
```

Notes: set `SetNetworkMoveDataContainer(MoveDataContainer)` in the constructor. Server validation of speed (part 04.15) happens by computing `GetMaxSpeed()` from the server's own view of gait, weight and injuries, not the client's claims; the client's weight bracket in the move data is only used to detect mismatch for telemetry.

## 55.2 THE PROJECTILE SUBSYSTEM (PART 05)

```cpp
// SMProjectileSubsystem.h
#pragma once
#include "Subsystems/WorldSubsystem.h"
#include "SMProjectileSubsystem.generated.h"

class USMAmmoDefinition;

struct FSMProjectile
{
    FVector Position;            // cm (LWC doubles)
    FVector Velocity;            // cm/s
    const USMAmmoDefinition* Ammo = nullptr;
    TWeakObjectPtr<AController> Instigator;
    TWeakObjectPtr<AActor> Weapon;
    double FireServerTime = 0.0;
    float DistanceTravelled = 0.f;
    float PenetrationRemaining = 0.f;
    float MuzzleSpeed = 0.f;     // for velocity fraction
    float LagCompensationSec = 0.f; // shooter ping offset, capped at 0.25
    uint32 Id = 0;
    uint8 Flags = 0;             // Tracer, Ricocheted, Cosmetic (client-only), Subsonic
    uint8 RicochetCount = 0;
};

UCLASS()
class SALTMARROWCOMBAT_API USMProjectileSubsystem : public UTickableWorldSubsystem
{
    GENERATED_BODY()
public:
    // Server: spawn an authoritative projectile after shot validation.
    uint32 SpawnAuthoritative(const FVector& Origin, const FVector& Direction, const USMAmmoDefinition* Ammo,
                              float MuzzleSpeedCmPerSec, AController* Instigator, AActor* Weapon,
                              double FireServerTime, float ShooterPingSec);

    // Client: spawn a cosmetic projectile for predicted tracers and impacts (never applies damage).
    void SpawnCosmetic(const FVector& Origin, const FVector& Direction, const USMAmmoDefinition* Ammo, float MuzzleSpeed, bool bTracer);

    virtual void Tick(float DeltaTime) override;
    virtual TStatId GetStatId() const override { RETURN_QUICK_DECLARE_CYCLE_STAT(USMProjectileSubsystem, STATGROUP_Tickables); }

private:
    static constexpr float FixedStep = 1.f / 120.f;
    static constexpr int32 MaxStepsPerFrame = 8;
    float Accumulator = 0.f;

    TArray<FSMProjectile> Active;       // swap-remove on death
    TArray<FSMProjectile> Cosmetic;

    void StepAll(float Dt);
    // Integrates per part 43.1: v(x) = v0 e^(-Kx) equivalent in time: dv/dt = -K v^2, plus gravity and wind.
    void Integrate(FSMProjectile& P, float Dt) const;
    // Line trace prev->next on the Projectile channel, against world and (server) rewound hitboxes.
    bool TraceSegment(FSMProjectile& P, const FVector& From, const FVector& To, TArray<FHitResult>& OutHits) const;
    // Penetration, ricochet, water (part 05.6) and damage application via GAS (part 31.3).
    void ResolveHit(FSMProjectile& P, const FHitResult& Hit);
    void BatchImpactForReplication(const FHitResult& Hit, uint8 ImpactType);
};
```

Tests: `Saltmarrow.Combat.Ballistics.DropTable` (fires a projectile in an empty test world at each zero distance and compares drop to the precomputed table within 2 cm), `Saltmarrow.Combat.Ballistics.Retention` (velocity at 100/300 m matches part 43.1 within 1%), `Saltmarrow.Combat.Projectiles.Perf600` (600 projectiles under 1.5 ms).

## 55.3 LAG COMPENSATION (PART 05.11)

```cpp
// SMLagCompensationComponent.h
USTRUCT()
struct FSMHitboxSnapshot
{
    GENERATED_BODY()
    double ServerTime = 0.0;
    TArray<FTransform, TInlineAllocator<20>> BodyTransforms; // one per hitbox body in the physics asset, fixed order
    FBox Bounds;
};

UCLASS(ClassGroup=(SM), meta=(BlueprintSpawnableComponent))
class SALTMARROWCOMBAT_API USMLagCompensationComponent : public UActorComponent
{
    GENERATED_BODY()
public:
    static constexpr float HistorySeconds = 0.4f;
    static constexpr float MaxRewindSeconds = 0.25f;

    // Server: called every server tick after animation/physics update.
    void RecordSnapshot(double ServerTime);
    // Server: interpolated hitboxes at a past time (clamped to MaxRewind).
    bool GetHitboxesAt(double ServerTime, TArray<FTransform>& OutTransforms, FBox& OutBounds) const;
    // Server: segment test against rewound hitboxes, returning the zone tag and hit location.
    bool TraceRewound(double ServerTime, const FVector& From, const FVector& To, FGameplayTag& OutZone, FHitResult& OutHit) const;

private:
    TArray<FSMHitboxSnapshot> Ring; int32 Head = 0;
    UPROPERTY() TArray<FName> HitboxBodies;  // body names, mapped to zone tags by USMHitZoneComponent
};
```

## 55.4 THE WEAPON CONFIG NETSERIALIZE (PART 08.11)

```cpp
// In SMWeaponTypes.h
USTRUCT(BlueprintType)
struct FSMWeaponConfig
{
    GENERATED_BODY()
    // ... fields from part 08.1.1 ...

    bool NetSerialize(FArchive& Ar, UPackageMap* Map, bool& bOutSuccess);
};

template<> struct TStructOpsTypeTraits<FSMWeaponConfig> : public TStructOpsTypeTraitsBase2<FSMWeaponConfig>
{
    enum { WithNetSerializer = true };
};

// In SMWeaponTypes.cpp
bool FSMWeaponConfig::NetSerialize(FArchive& Ar, UPackageMap* Map, bool& bOutSuccess)
{
    // The catalog index maps FPrimaryAssetId <-> uint16, built at startup in a deterministic order
    // and verified by hash at join (part 08.11).
    USMCatalogIndex& Catalog = USMCatalogIndex::Get();

    uint16 WeaponIdx = Ar.IsSaving() ? Catalog.ToIndex(WeaponId) : 0;
    Ar << WeaponIdx;
    if (Ar.IsLoading()) WeaponId = Catalog.FromIndex(WeaponIdx);

    uint8 NumParts = Ar.IsSaving() ? (uint8)FMath::Min(Parts.Num(), 64) : 0;
    Ar << NumParts;
    if (Ar.IsLoading()) Parts.SetNum(NumParts);
    for (FSMPartNode& Node : Parts)
    {
        uint16 PartIdx = Ar.IsSaving() ? Catalog.ToIndex(Node.PartId) : 0;
        Ar << PartIdx;
        if (Ar.IsLoading()) Node.PartId = Catalog.FromIndex(PartIdx);
        Ar << Node.ParentIndex;
        uint8 SlotIdx = Ar.IsSaving() ? Catalog.SlotToIndex(WeaponId, Node.ParentSlot) : 0; // slot names are per-parent; index within parent's slot list
        Ar << SlotIdx;
        if (Ar.IsLoading()) Node.ParentSlot = Catalog.IndexToSlot(Parts, Node.ParentIndex, SlotIdx);
        uint8 Dur = Ar.IsSaving() ? (uint8)FMath::Clamp(FMath::RoundToInt(Node.Durability * 2.55f), 0, 255) : 0;
        Ar << Dur;
        if (Ar.IsLoading()) Node.Durability = Dur / 2.55f;
        Ar << Node.RailPosition;      // uint8
        Ar << Node.CosmeticSkinIndex; // uint8
        // InstanceId is NOT serialized here: owner-only data travels in the inventory fast array.
    }
    Ar << FireModeIndex;
    int16 Zero = ZeroDistanceMeters; Ar << Zero; ZeroDistanceMeters = Zero;
    bOutSuccess = true;
    return true;
}
```

## 55.5 THE INVENTORY FAST ARRAY (PART 11.4)

```cpp
// SMInventoryTypes.h
USTRUCT()
struct FSMInventoryEntry : public FFastArraySerializerItem
{
    GENERATED_BODY()
    UPROPERTY() FSMItemInstance Item;      // instance id, def id, stack, durability, flags, custom
    UPROPERTY() FSMGridPlacement Placement;// container id, grid, x, y, rotated, or equip slot
    void PreReplicatedRemove(const struct FSMInventoryList& InArraySerializer);
    void PostReplicatedAdd(const struct FSMInventoryList& InArraySerializer);
    void PostReplicatedChange(const struct FSMInventoryList& InArraySerializer);
};

USTRUCT()
struct FSMInventoryList : public FFastArraySerializer
{
    GENERATED_BODY()
    UPROPERTY() TArray<FSMInventoryEntry> Entries;
    UPROPERTY(NotReplicated) TObjectPtr<class USMInventoryComponent> Owner;

    bool NetDeltaSerialize(FNetDeltaSerializeInfo& DeltaParms)
    {
        return FFastArraySerializer::FastArrayDeltaSerialize<FSMInventoryEntry, FSMInventoryList>(Entries, DeltaParms, *this);
    }
};
template<> struct TStructOpsTypeTraits<FSMInventoryList> : public TStructOpsTypeTraitsBase2<FSMInventoryList>
{
    enum { WithNetDeltaSerializer = true };
};

// SMInventoryComponent.h
UCLASS(ClassGroup=(SM), meta=(BlueprintSpawnableComponent))
class SALTMARROWINVENTORY_API USMInventoryComponent : public UActorComponent
{
    GENERATED_BODY()
public:
    USMInventoryComponent();
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;
    // Replicated to owner only (COND_OwnerOnly). Others see equipment visuals via USMEquipmentVisualsComponent.

    // Client requests (predicted in UI, validated on server)
    UFUNCTION(Server, Reliable) void ServerMoveItem(FGuid ItemId, FSMGridPlacement Target);
    UFUNCTION(Server, Reliable) void ServerSplitStack(FGuid ItemId, int32 Count, FGuid NewId, FSMGridPlacement Target);
    UFUNCTION(Server, Reliable) void ServerEquip(FGuid ItemId, FGameplayTag Slot);
    UFUNCTION(Server, Reliable) void ServerDrop(FGuid ItemId);
    UFUNCTION(Server, Reliable) void ServerTransferFromContainer(AActor* Container, FGuid ItemId, FSMGridPlacement Target);
    UFUNCTION(Server, Reliable) void ServerLoadMagazine(FGuid MagId, FGuid AmmoId, int32 Count);

    // Shared validation (also used by the client prediction and mirrored in the backend TS)
    bool CanPlace(const FSMItemInstance& Item, const FSMGridPlacement& Target, FText* OutReason = nullptr) const;
    float GetTotalWeight() const;

    // Server only: build from the backend's entry manifest (part 18.7.1)
    void InitializeFromManifest(const struct FSMEntryManifest& Manifest);
    // Server only: produce the report's item list (part 20.10)
    void BuildReportItems(TArray<struct FSMReportItem>& Out) const;

    DECLARE_MULTICAST_DELEGATE(FOnInventoryChanged);
    FOnInventoryChanged OnInventoryChanged;

private:
    UPROPERTY(Replicated) FSMInventoryList List;
};
```

## 55.6 THE SURGE SUBSYSTEM (PART 15)

```cpp
// SMSurgeSubsystem.h
UCLASS()
class SALTMARROWWORLD_API USMSurgeSubsystem : public UTickableWorldSubsystem
{
    GENERATED_BODY()
public:
    // Called on server and clients with the same seed and direction (from the GameState).
    void InitializeSchedule(int32 Seed, uint8 Direction, const class USMRaidTypeDef* RaidType);

    const FSMSurgeSchedule& GetSchedule() const { return Schedule; }
    // Deterministic, pure functions of raid time and location:
    float GetZoneWaterHeight(FName ZoneId, double RaidTime) const;   // part 15.4.1
    float GetFrontDistance(double RaidTime) const;                   // part 15.3
    FSMWeatherState EvaluateWeather(double RaidTime, const FVector& Location) const; // part 15.7
    void GetLightningStrikes(double FromTime, double ToTime, TArray<struct FSMLightningStrike>& Out) const; // seeded

    // Events for AI, loot, extraction, radio (part 15.10)
    DECLARE_MULTICAST_DELEGATE_OneParam(FOnSurgeWave, int32 /*Wave*/);
    FOnSurgeWave OnWarning, OnArrival, OnPeak, OnLull;
    DECLARE_MULTICAST_DELEGATE_TwoParams(FOnZoneEvent, FName /*Zone*/, float /*Level*/);
    FOnZoneEvent OnZoneFlooded, OnZoneReceded;

    virtual void Tick(float DeltaTime) override;
    virtual TStatId GetStatId() const override { RETURN_QUICK_DECLARE_CYCLE_STAT(USMSurgeSubsystem, STATGROUP_Tickables); }

private:
    FSMSurgeSchedule Schedule;
    TMap<FName, TObjectPtr<const class USMZoneDef>> Zones;
    double GetRaidTime() const;   // from ASMRaidGameState's start time and the synced server clock
    void PushToMaterialParameters(const FSMWeatherState& State) const; // MPC_World, MPC_Flood
    void UpdateFloodVolumes(double RaidTime);
    FRandomStream MakeStream(uint32 Salt) const { return FRandomStream(Schedule.Seed ^ Salt); }
};
```

Determinism test: `Saltmarrow.World.Surge.Determinism` builds the schedule twice from the same inputs and compares 20 sample evaluations bit for bit.

## 55.7 THE NOISE SUBSYSTEM (PART 28.1)

```cpp
// SMNoiseSubsystem.h
USTRUCT()
struct FSMNoiseEvent
{
    GENERATED_BODY()
    UPROPERTY() FVector_NetQuantize Location;
    UPROPERTY() float Radius = 0.f;          // gameplay radius after attenuation
    UPROPERTY() FGameplayTag Type;           // Event.Noise.*
    UPROPERTY() TWeakObjectPtr<AActor> Instigator;
    UPROPERTY() uint8 EnvClass = 0;          // for gunshot tails
    UPROPERTY() double ServerTime = 0.0;     // for sound-speed delay
    UPROPERTY() uint16 SoundId = 0;          // compact id into the sound set table
};

UCLASS()
class SALTMARROWGAME_API USMNoiseSubsystem : public UWorldSubsystem
{
    GENERATED_BODY()
public:
    // Server: report a noise. Routes to AI perception and to clients within (attenuated) radius.
    void ReportNoise(const FSMNoiseEvent& Event);
private:
    float AttenuateByWalls(const FVector& From, const FVector& To, float Radius) const; // one trace, halve per wall
    void SendToRelevantClients(const FSMNoiseEvent& Event);  // unreliable client RPC on each player controller in range
};
```

## 55.8 THE API CLIENT (PART 20.14)

```cpp
// SMApiClient.h
DECLARE_DELEGATE_TwoParams(FSMApiResponse, bool /*bOk*/, const struct FSMApiResult& /*Result*/);

UENUM() enum class ESMApiRetry : uint8 { None, Idempotent, UntilAcknowledged };

UCLASS()
class SALTMARROWONLINE_API USMApiClient : public UGameInstanceSubsystem
{
    GENERATED_BODY()
public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    void SetBaseUrl(const FString& Url);       // from build config or -backend=
    bool IsAuthenticated() const;

    // Auth
    void AuthWithEOS(const FString& EosIdToken, const FString& DisplayName, FSMApiResponse OnDone);

    // Generic typed request: TReq and TResp are generated USTRUCTs (tools/gen-api-structs.ts)
    template<typename TReq, typename TResp>
    void Send(const FString& Verb, const FString& Path, const TReq& Body, TFunction<void(bool, const TResp&, const struct FSMApiError&)> OnDone,
              ESMApiRetry Retry = ESMApiRetry::Idempotent);

    // Raid reports persist to disk until acknowledged (part 20.14)
    void QueueRaidReport(const FString& RaidId, const struct FSMRaidReport& Report);
    void FlushPendingReports();

private:
    FString BaseUrl; FString Jwt; FString RefreshToken; FDateTime JwtExpiry;
    void RefreshIfNeeded(TFunction<void()> Then);
    FString NewIdempotencyKey() const;          // UUID
    void ApplyCommonHeaders(TSharedRef<class IHttpRequest> Req) const; // auth, build, catalog, idempotency
    void HandleRetry(/*...*/);                  // backoff 1,2,4,8 s; reports up to 60 s, indefinitely
};
```

## 55.9 THE BACKEND STASH ENGINE (PART 19.6), TYPESCRIPT

```ts
// backend/src/services/stash-service.ts
import { db } from "../db";
import { items, stashes } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { validateGunsmith } from "../catalog/gunsmith";
import { catalog } from "../catalog/catalog";
import { AppError } from "../lib/errors";

export type StashOp =
  | { op: "move"; item: string; to: Placement }
  | { op: "rotate"; item: string }
  | { op: "split"; item: string; count: number; newId: string; to: Placement }
  | { op: "merge"; from: string; into: string }
  | { op: "discard"; item: string }
  | { op: "load_ammo"; mag: string; ammo: string; count: number }
  | { op: "unload_ammo"; mag: string; to: Placement }
  | { op: "gunsmith_install"; weapon: string; part: string; parentPart: string | null; slot: string; railPos: number | null }
  | { op: "gunsmith_remove"; weapon: string; part: string; to: Placement }
  | { op: "examine"; def: string };

export async function applyStashOps(playerId: string, expectedVersion: number, ops: StashOp[]) {
  if (ops.length === 0 || ops.length > 200) throw new AppError("VALIDATION_FAILED", "ops length");
  return db.transaction(async (tx) => {
    const [stash] = await tx.select().from(stashes).where(eq(stashes.playerId, playerId)).for("update");
    if (!stash) throw new AppError("NOT_FOUND", "stash");
    if (stash.version !== expectedVersion) {
      throw new AppError("STASH_VERSION_CONFLICT", "stash changed", { currentVersion: stash.version });
    }
    const all = await tx.select().from(items).where(and(eq(items.playerId, playerId), eq(items.location, "stash")));
    const state = StashState.load(stash, all, catalog());   // in-memory tree with grids
    ops.forEach((op, i) => {
      const err = state.apply(op);                          // pure; mirrors USMInventoryComponent::CanPlace
      if (err) throw new AppError("VALIDATION_FAILED", err, { opIndex: i });
    });
    for (const w of state.touchedWeapons()) {
      const res = validateGunsmith(w.config, catalog());
      if (!res.ok) throw new AppError("GUNSMITH_INVALID", res.reasons.join("; "));
    }
    const { changed, removed, created } = state.diff();
    await state.write(tx, changed, removed, created);       // only touched rows
    const newVersion = stash.version + 1;
    await tx.update(stashes).set({ version: newVersion }).where(eq(stashes.playerId, playerId));
    return { version: newVersion, changed: state.serialize(changed.concat(created)), removed };
  });
}
```

## 55.10 THE RAID REPORT WORKER (PART 19.7.4)

```ts
// backend/src/jobs/process-raid-report.ts
export async function processRaidReport(job: { raidId: string; playerId: string }) {
  return db.transaction(async (tx) => {
    const rp = await loadRaidPlayerForUpdate(tx, job.raidId, job.playerId);
    if (rp.committedAt) return { skipped: "already committed" };           // idempotent
    const raid = await loadRaid(tx, job.raidId);
    const ledger = await loadLedger(tx, job.raidId);                          // raid_loot + all entry manifests + claims
    const report = rp.report as RaidReport;

    const verdict = verifyItems(report.items, rp.entryManifest, ledger);      // part 12.9 rules, lineage totals
    const plausible = checkPlausibility(report, raid, ledger);               // XP bounds, kill counts
    if (!plausible.ok) await flagRaid(tx, raid.id, plausible.reasons);

    if (report.result === "extracted" || raid.riskless) {
      await moveItemsToStash(tx, job.playerId, verdict.accepted, { foundInRaid: true, resetForeignSkins: true });
    }
    await destroyLostItems(tx, job.playerId, rp.entryManifest, verdict.accepted, raid.riskless);
    await claimLedger(tx, job.raidId, job.playerId, verdict.accepted);
    await applyProgress(tx, job.playerId, report);                            // XP (50% on death), stats, contracts, reputation, unlocks
    await appendHistory(tx, report.history);
    await markCommitted(tx, job.raidId, job.playerId, verdict.rejected);
    return { accepted: verdict.accepted.length, rejected: verdict.rejected.length };
  });
}
```

## 55.11 HOW TO USE THESE

Copy each skeleton into its module, fill in the bodies against the design parts named in each section, and write the listed tests first where possible. Keep the public shapes unless you have a reason (then update this part and `DECISIONS.md`). When an engine API differs in the installed version (method names, override signatures, header paths), follow the engine, and fix the skeleton here so the next reader isn't misled.

---

End of part 55. Next: `56_ATTACHMENT_AND_AMMO_DESCRIPTIONS.md` (the last part).
