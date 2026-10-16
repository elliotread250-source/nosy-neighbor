# SALTMARROW: PART 31, GAMEPLAY ABILITY SYSTEM

GAS is the backbone for actions, attributes and status effects. It gives us client prediction for abilities, replicated attributes, tag-based state, and a single damage pipeline shared by players and AI. This part lists the attribute sets, every ability, every effect, the tag taxonomy, and the rules for using GAS without it becoming a tangle.

---

## 31.1 WHERE THE ASC LIVES

Players: the Ability System Component lives on the PlayerState (Lyra's pattern), so it survives pawn death and respawn edge cases, and the avatar is the character. Replication mode: Mixed.

AI: the ASC lives on the AI character itself. Replication mode: Minimal.

Bosses: as AI.

## 31.2 ATTRIBUTE SETS

### 31.2.1 USMHealthSet

Per-zone health with max values: `HeadHP`, `HeadMax`, `ThoraxHP`, `ThoraxMax`, `StomachHP`, `StomachMax`, `LeftArmHP`, `LeftArmMax`, `RightArmHP`, `RightArmMax`, `LeftLegHP`, `LeftLegMax`, `RightLegHP`, `RightLegMax`. Derived (not replicated, computed on demand): `TotalHP`, `TotalMax`.

Meta attributes (not replicated, used in damage executions): `IncomingDamage` (with the target zone passed through the effect context), `IncomingHealing`, `IncomingBlunt`.

`PostGameplayEffectExecute` handles: applying incoming damage to the zone, spill-over (part 05.7), death checks (head or thorax at 0, or total at 0), downed checks (part 03), destroyed-zone tags (`State.Zone.Destroyed.LeftLeg`), and broadcasting events for UI and audio.

### 31.2.2 USMStaminaSet

`Stamina`, `StaminaMax`, `StaminaRegenRate`, `StaminaRegenDelay`, `Breath` (shares the stamina pool underwater in v1; keep it as a separate attribute so the Rebreather and Deep Breath can extend it cleanly), `BreathMax`.

### 31.2.3 USMSurvivalSet

`Hydration` (0 to 100), `Cold` (0 to 100), `SaltSickness` (0 to 100), `Wetness` (0 to 1, for Soaked), `Weight` (current carried kg, set by the inventory), `WeightLimitBurdened`, `WeightLimitOverloaded`, `WeightLimitImmobile`.

### 31.2.4 USMCombatSet

Modifiers applied to the character's combat behavior (used by stims and injuries): `SwayMultiplier`, `RecoilMultiplier`, `ADSSpeedMultiplier`, `ReloadSpeedMultiplier`, `MoveSpeedMultiplier`, `DamageResistance` (post-armor, for the Grom stim), `HearingMultiplier` (headsets), `DetectionMultiplier` (salt and stealth effects for AI perception).

### 31.2.5 Armor state

Armor durability lives on the armor item instances (inventory), not in attributes. The damage execution reads the equipped armor from the inventory component, resolves penetration (part 05.8), writes back durability through the inventory component (replicated with the item), and applies the remaining damage to the health set.

## 31.3 THE DAMAGE PIPELINE

All damage goes through one execution calculation, `USMDamageExecution`:

1. Input: a damage effect spec with set-by-caller magnitudes (`Data.Damage.Base`, `Data.Damage.Penetration`, `Data.Damage.ArmorDamage`), the hit zone and sub-zone in the context (`FSMGameplayEffectContext` extends `FGameplayEffectContext` with the hit zone, the hit result, the projectile's ammo ID, the instigating weapon ID, and flags: headshot, explosion, melee, burn, drowning, fall).
2. Zone multiplier (part 05.7.1) for the target's zone.
3. Armor resolution if the zone is covered (part 05.8): penetration roll with a seeded random stream (seeded by the projectile ID so the result is reproducible in logs), damage reduction or blunt conversion, armor durability write-back.
4. Resistances: `DamageResistance` from the combat set.
5. Output: `IncomingDamage` (to the zone) and `IncomingBlunt`.
6. Status effect rolls (bleed chances per ammo and zone, fracture chances) apply follow-up gameplay effects from the execution (via conditional gameplay effects or by applying them in `PostGameplayEffectExecute` based on tags in the spec).
7. Events: a `GameplayEvent.Damage.Taken` to the target (for aim punch, hit reactions, UI) and `GameplayEvent.Damage.Dealt` to the source (for hit markers, telemetry, contracts).

The same pipeline handles explosions (blast per zone with line-of-sight), fire (periodic effect), drowning (periodic thorax), falls (legs), melee, and Hollow attacks. AI uses it identically.

## 31.4 ABILITIES

All abilities are C++ base classes with data-driven subclasses (Blueprint data-only subclasses or data assets that configure them). Activation policies, instancing (instanced per actor for stateful abilities), net execution policies (Local Predicted for player actions, Server Only for some), and tags.

| Ability | Activation | Net policy | Blocks | Notes |
|---|---|---|---|---|
| `GA_Sprint` | Input held | Local predicted | Fire, ADS, Reload (cancels), Interact (long ones) | Drains stamina via a periodic effect |
| `GA_Crouch` / `GA_Prone` | Input | Local predicted | Prone blocks sprint, jump | Movement component does the work; the ability manages tags |
| `GA_Jump` / mantle | Input | Local predicted | | Mantle selection from part 04 |
| `GA_Lean` | Input | Local predicted | | |
| `GA_ADS` | Input held/toggle | Local predicted | Sprint | Sets `State.ADS` |
| `GA_Fire` | Input | Local predicted | Sprint, Reload (unless per-round reload), Swap | Owns fire mode logic, sends shots (part 05) |
| `GA_Reload` (tac, empty, fast) | Input | Local predicted | Fire (except per-round), Sprint cancels | Montage with notifies |
| `GA_CheckMagazine`, `GA_CheckChamber` | Input held | Local predicted | | |
| `GA_ClearMalfunction` | Input | Local predicted | | |
| `GA_SwitchFireMode` | Input | Local predicted | | |
| `GA_ZeroAdjust`, `GA_OpticToggle`, `GA_MagnificationCycle` | Input | Local predicted | | |
| `GA_WeaponSwap` (primary, secondary, holster, melee) | Input | Local predicted | | Draw/holster montages |
| `GA_Melee` (quick, heavy) | Input | Local predicted | | Cone trace on the server |
| `GA_Throw` | Input | Local predicted (visual), server spawns | | Cooking, arc preview |
| `GA_UseItem` (medical, food, stims) | Input / inventory | Local predicted start, server applies | Fire, Sprint | Interruptible |
| `GA_Interact` | Input | Local predicted (start), server validates | | Hold durations |
| `GA_Search` | Interact on container | Server authoritative | | Reveals items over time |
| `GA_Revive` | Interact on downed squadmate | Server | Fire | 6 s hold |
| `GA_Downed` | Automatic | Server | Most abilities | Crawl, bleed out timer |
| `GA_GiveUp` | Input while downed | Server | | |
| `GA_Ping` | Input | Local, server relays | | |
| `GA_Emote` / `GA_Gesture` | Input | Local predicted | Combat | |
| `GA_HoldBreath` | Input in ADS (scoped) | Local predicted | | Stamina drain |
| `GA_DeployBipod` | Input / prone | Local predicted | | |
| `GA_BoardBoat`, `GA_DriveBoat` | Interact | Server | Fire (driver) | |
| `GA_HarvestSalt` | Interact | Server | Fire | Loud |
| `GA_FieldModify` (Tier 2) | Inventory | Server | Fire, Sprint | |
| `GA_BreakGrab` | Input mash while grabbed | Server counts | | |
| Hollow abilities | AI | Server | | Grab, bite, slam, charge, scream, burst, lunge, drag under |
| Warden abilities | AI | Server | | Same weapon abilities as players, plus Heal Ally, Call Reinforcements |
| Boss abilities | AI | Server | | Hook Pull, Sweep, Toll the Bell, Fare, Low Tide; Song, Harmony, Pulse, Choir of the Drowned |

Ability sets: `AbilitySet_Salvager` (granted to every player pawn), `AbilitySet_Weapon_<Family>` (granted when a weapon family is equipped: reload variants, bolt cycle, pump), `AbilitySet_Hollow_<Type>`, `AbilitySet_Warden`, `AbilitySet_Boss_Ferryman`, `AbilitySet_Boss_Choir`.

## 31.5 GAMEPLAY EFFECTS

Status effects (part 05.9) as gameplay effects with their tags, durations and periodic executions: `GE_Bleed_Light` (periodic -0.8 HP/s on the zone, granted tag `Status.Bleed.Light.<Zone>`), `GE_Bleed_Heavy`, `GE_Fracture_<Limb>` (infinite until treated), `GE_Pain` (duration refreshed by damage), `GE_Painkiller` (suppresses pain and fracture effects via tag requirements: the penalties' effects have `Ongoing Tag Requirements` that ignore when `Status.Painkiller` is present), `GE_Concussion`, `GE_Stun`, `GE_Burning`, `GE_Cold_Tick` (computed from wetness and exposure every second), `GE_Dehydration`, `GE_SaltSickness`, `GE_Adrenaline`, `GE_Shaken`, `GE_Soaked`, `GE_Waterlogged` (on weapons: a tag on the weapon state, not the character), `GE_Exhausted`, stim effects and aftereffects (`GE_Stim_<Name>` and `GE_Stim_<Name>_After`), injury movement modifiers (`GE_Injury_LegFracture`), weight brackets (`GE_Weight_Burdened`, applied by the inventory when weight crosses thresholds), `GE_Downed`, `GE_Grabbed`, `GE_Deafened`, `GE_Familiarity_<Weapon>` (mastery bonus, part 17), `GE_Swimming`, `GE_Wading_<Depth>`.

Healing effects: `GE_Heal_Instant` (with set-by-caller amount and zone), `GE_Heal_OverTime`, `GE_StopBleed_Light` (removes effects with the tag), `GE_StopBleed_Heavy`, `GE_FixFracture`, `GE_Surgery` (restores a destroyed zone with a max HP reduction).

Gameplay cues: `GameplayCue.Character.Hit` (impact effects on characters), `.Heal`, `.Bleed` (drips), `.Burning`, `.Wet`, `.SaltCrust`, `.BreathFog`, `.Downed`, `.Revived`, `.Stim`, `.Weapon.Fire` (for AI weapons; players use the weapon fire event path for efficiency), `.Weapon.Malfunction`, `.Explosion` (cosmetic), `.Hollow.Rise`, `.Hollow.Scream`, `.Boss.*`.

## 31.6 THE TAG TAXONOMY

Part 42 has the complete list. The top-level families:

`Input.*` (input action tags, Lyra-style), `Ability.*` (ability identity and type), `State.*` (character state: `State.ADS`, `State.Sprinting`, `State.Crouched`, `State.Prone`, `State.Downed`, `State.Dead`, `State.Grabbed`, `State.Swimming`, `State.Wading`, `State.InInventory`, `State.Reloading`, `State.Interacting`, `State.OnLadder`, `State.InBoat`, `State.Extracting`, `State.Zone.Destroyed.*`), `Status.*` (status effects), `Data.*` (set-by-caller keys), `Event.*` (gameplay events), `GameplayCue.*`, `Item.*` (item categories and traits, used by inventory rules), `Attachment.*` (interfaces and categories, part 08), `Caliber.*`, `Damage.*` (damage types: `Damage.Ballistic`, `.Explosive`, `.Fire`, `.Melee`, `.Drowning`, `.Fall`, `.Salt`), `Zone.*` (hit zones), `AI.*` (AI states and archetypes), `World.*` (surfaces, environment classes, flood zones), `Team.*` (squad IDs are dynamic, so team tags are just `Team.Player`, `Team.Hollow`, `Team.Warden`), `Cheat.*` (debug).

Rules: tags are the language for state. Don't add a boolean to a class when a tag would do. Do keep tag queries simple: never write a query that needs 6 clauses; make a new tag.

## 31.7 GAS NETWORKING NOTES

Prediction keys for every locally predicted ability; test misprediction rollback (e.g. reload predicted on the client while the server says the weapon is malfunctioning: the client's montage stops and the state reconciles).

Attribute replication: health zones replicate to the owner every change and to others only in summary form (others don't see your exact zone HP; squadmates see the summary bar: replicate a compressed "health summary" byte array on the PlayerState for squadmates only, and nothing for enemies).

Effect replication: Mixed mode means only the owner gets full effect replication; others get tags and cues. Make sure UI for others (squad bars) reads the summary, not effects.

Batching: use `FScopedServerAbilityRPCBatcher` for activate-then-fire patterns (weapon fire right after ADS) to reduce RPCs.

## 31.8 GAS ACCEPTANCE TESTS

Damage execution unit tests: every ammo against every armor class at 10, 100 and 300 m produces the expected penetration probabilities (Monte Carlo within 2%) and damage distributions.

Status effects apply, tick and are removed by the right items.

Painkillers suppress penalties and the penalties return when they expire.

A predicted reload on a client at 200 ms latency, interrupted by sprinting, reconciles without a duplicated or lost magazine.

---

End of part 31. Next: `32_DATA_SCHEMAS.md`.
