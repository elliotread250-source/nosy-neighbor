# SALTMARROW: PART 29, ANIMATION

Animation is where the character becomes a body and the gun becomes heavy. The plan: use the Game Animation Sample's motion matching locomotion as the foundation, layer a weapon-handling system on top with procedural motion (part 05), and author or source the weapon-specific montages (reloads, bolt cycles, inspects) for each weapon family. All animation is on the UE5 mannequin skeleton so every source retargets cleanly.

---

## 29.1 THE FOUNDATION: GAME ANIMATION SAMPLE

Epic's Game Animation Sample Project (GASP, free, UE 5.4+) provides a production-quality motion matching locomotion set for the UE5 mannequin: hundreds of animations covering walk, jog, run, starts, stops, pivots, turns in place, slopes, stairs, crouching, traversal (vault, mantle, hurdle), with a Pose Search database setup, Chooser tables, and an animation blueprint built on motion matching. It's the best free locomotion foundation available. Use it.

Steps: migrate the GASP animation content and its anim blueprint structure into the project (respecting its license: it's free for use in Unreal Engine projects; check the current terms on Fab and record them). Adapt the character's movement component (part 04) to feed the motion matching trajectory: the trajectory prediction component in GASP reads the movement component's velocity, acceleration and desired facing; make sure our custom gaits (walk 1.8, jog 3.6, sprint 5.6 m/s) map to GASP's gait databases (GASP has walk, run and sprint gaits; retune its speeds or add a jog database at 3.6 m/s by time-scaling the run set and filtering).

Motion matching runs on the client for the local player and for simulated proxies. On the server, the character doesn't need full motion matching (it's expensive). Run a cheap locomotion blend space on the server for hitbox posing (driven by speed and direction), which keeps hitboxes close enough to what clients see. Verify hitbox alignment with a debug draw comparing the client's pose and the server's for 10 typical movements (they should match within 8 cm at the head and chest).

## 29.2 THE ANIMATION BLUEPRINT STRUCTURE

`ABP_Salvager` (the main anim BP, a C++ `USMAnimInstance` base for performance-critical values computed on worker threads with `NativeThreadSafeUpdateAnimation`):

1. Locomotion (motion matching, from GASP): full body, outputs the base pose.
2. Stance and state overlays: crouch and prone (GASP covers crouch; prone needs its own set: prone idle, crawl forward/back/left/right, prone turn in place, transitions in and out), swimming (surface swim, underwater swim, treading water, from a mocap source or a marketplace set), wading (a custom wading gait: leaning forward, high knees, slower cadence; blend with the walk set by water depth), ladder climbing, downed (crawling on the belly, injured), boat seated (driver and passenger poses).
3. Upper body weapon layer: the weapon pose (idle, ready, ADS, lowered, high ready, sprint carry) per weapon family (pistol, rifle, bullpup, shotgun pump, LMG, bolt-action, launcher), applied as a layered blend per bone from the spine upward, with the weapon held by the right hand and the left hand IK'd to the weapon's grip point (part 08).
4. Additive layers: lean (spine and head rotation additive), aim offset (pitch and yaw for aiming up and down and turning the upper body before the feet turn), breathing (a subtle idle breathing additive scaled by stamina: heavier breathing when exhausted), injuries (a limping additive for leg fractures, a cradled arm for arm fractures, a hunched posture for stomach damage), cold (a shivering additive above Cold 50).
5. Procedural weapon layer (part 05.4.7): sway, recoil, movement bob and inertia applied to the weapon's IK target through a Control Rig or a custom anim node, after the weapon pose.
6. Montages: reloads, weapon switches, inspects, interactions (opening doors, searching containers, picking up items, healing, using items), mantles and vaults (if not handled by GASP's traversal), melee, throws, gestures and emotes, hit reactions.
7. IK: hand IK (left hand to the weapon grip, right hand to the pistol grip), foot IK (foot placement on uneven ground and stairs, from GASP), look-at (the head looks at the aim point; for others' characters, the head looks where the player is aiming, which is a readability feature).
8. Physics: a small physical animation layer for hit reactions (a short physics blend on the hit bone chain: part 29.6) and ragdoll on death.

Linked anim layers (UE's linked anim graph) for the weapon layer: each weapon family has an anim layer interface implementation (`ALI_Weapon`) with its own idle/ADS/sprint poses and montage slots, swapped when the weapon changes. That's the Lyra pattern, and it scales.

Threading: all anim BPs use thread-safe update functions and property access, with no Blueprint event graph logic per frame. Fast path everywhere.

## 29.3 FIRST PERSON

Part 04 decided on true first person (the same body). In ADS and in first-person mode, the camera attaches to the head (with stabilization: a camera smoothing node that filters the head bone's high-frequency motion, so the view doesn't bounce with every step), the head is hidden for the owner, and the arms and weapon render with the first-person FOV (if the installed engine supports first-person rendering primitives; otherwise, use a separate FOV material trick for the weapon only, or accept the world FOV).

First-person polish: weapon pose adjustments in ADS so the weapon sits correctly to the eye (part 08's ADS alignment), weapon sway and inertia (procedural layer), visible hands and gloves, a "weapon down" pose when sprinting, and the arms visible in mantles and ladder climbs (they should look physical in first person too).

## 29.4 WEAPON ANIMATION SETS

Each weapon family needs a set of montages, played on the character and synced on the weapon's skeletal mesh (the weapon has its own animations for bolt, charging handle, magazine, etc., triggered by notifies or played as a synced montage on the weapon mesh).

| Family | Weapons | Required montages |
|---|---|---|
| Pistol (semi) | Kestrel 9, Sever, Harbormaster, Hornet | Draw, holster, idle, ADS idle, fire (additive), tac reload, empty reload (slide release), malfunction clears (3), inspect, check mag, check chamber, sprint pose, melee bash (pistol whip) |
| Revolver | Rook | Draw, holster, fire (DA hammer), reload loose rounds (open, eject, insert ×N, close), reload speed loader, inspect (spin the cylinder), check (open cylinder) |
| Flare pistol | Signal Pistol | Draw, fire, reload (break open, eject, insert, close), fire upward pose |
| AR pattern | Mako, Skerry, Corsair, Gannet, Frigate | Draw (from back and sling), holster, fire, tac reload, empty reload (bolt catch), empty reload (charging handle, for some configs), fast reload (drop mag), check mag, check chamber (press check), malfunction clears (3), inspect, fire mode switch, sprint, melee bash, bipod deploy |
| AK pattern | Bora, Bora-S, Bora-L, Squall, Drakon | Draw, holster, fire, tac reload (mag-on-mag), empty reload (rock in, reach-over charging handle), fast reload, check mag, check chamber, malfunctions, inspect, selector (loud clack), sprint, melee, drum reload variant |
| HK roller | Fulmar, Albatross | Draw, holster, fire, tac reload, empty reload (HK slap), check, malfunctions, inspect, selector |
| PDW | Shearwater | Draw, holster, fire, top mag reload, check (look at the mag), inspect |
| Bullpup | Petrel | Draw, holster, fire, tac and empty reload (behind the grip), check, inspect |
| Bolt action | Fathom, Old Mariner, Jury, Leviathan | Draw, holster, fire, bolt cycle (hip and ADS), mag reload (detachable), stripper clip reload (Old Mariner), per-round reload (Jury), check, inspect |
| Lever action | Tern | Draw, holster, fire, lever cycle (hip and ADS), per-round reload through the gate, check, inspect |
| Pump shotgun | Breaker | Draw, holster, fire, pump (hip and ADS), per-shell reload (tube), empty reload (shell into the port then pump), side saddle reload variant, inspect |
| Break action | Selkie, Coach, Pipe | Draw, holster, fire (single and double), reload (open, eject, insert 1 or 2, close), inspect |
| LMG | Grom, Bulwark | Draw, holster, fire, belt reload (the long one), magazine reload (Bulwark), barrel change, bipod deploy, check (look at the belt), inspect |
| SMG (open bolt) | Bilge Pump | Draw, holster, fire, reload (side mag), charge, inspect |
| Launcher | Thumper | Draw, holster, fire, reload (break open), sight flip-up |
| Harpoon | Whaler | Draw, holster, fire, reload (load a bolt), reel in, swim fire (underwater pose) |

Timing rule: the montage durations must match the weapon's reload stats from parts 06 and 07 (with attachment modifiers applied: play rate = base duration / modified duration). Notifies mark the gameplay moments: "mag detached" (the old mag's rounds are removed from the weapon), "mag attached" (the new mag's rounds become available), "chambered" (the weapon can fire), "reload interruptible after" (a sprint or fire input can cancel from here on, with the right state), and audio events (part 28).

Interruptions: reloads can be canceled by sprinting, by switching weapons, or by firing (for per-round reloads). A canceled magazine reload before "mag attached" leaves the weapon without a magazine (realistic and harsh; the old mag is in your rig if it was a tac reload, or on the ground if fast reload).

### 29.4.1 Sourcing weapon animations

Weapon animations are the hardest content to source. Options, in order of preference:

1. Free animation packs on Fab with game-use licenses for the UE5 mannequin (Epic has released several free packs over time; check what's available, and check Lyra's own weapon animations, which cover pistol, rifle and shotgun basics on the mannequin and can be used in UE projects).
2. Paid packs: don't buy without asking me, but list the good options with prices in `design/ASSET_OPTIONS.md` so I can decide.
3. Author in-engine: UE's animation editing tools (Control Rig animation in Sequencer, the animation mode's keyframing tools) are capable for weapon montages. Author reloads by keyframing hand IK controls relative to the weapon, using Control Rig. It's slow, but montages are short, and once the AR set exists, the other families are variations.
4. Procedural fallbacks: for low-priority actions (inspect variants, rare malfunctions), procedural animations (Control Rig driven by curves) are acceptable.

Prioritize: Tier 0's four weapons get full sets (pistol, AR, bolt action; the Gannet uses the AR set). Tier 1 adds AK, HK roller, pump shotgun, revolver, break action (for the Coach Gun) and open-bolt SMG. Tier 2 adds the rest.

## 29.5 INTERACTION ANIMATIONS

Doors (push open, pull open, slow open, kick, unlock with a key), containers (open drawer, open locker, open crate lid, search with one hand while holding a weapon low, search bodies kneeling), picking up items (crouch pick up, from a shelf, from a table: chosen by the item's height relative to the character), healing (bandage wrap on a limb, tourniquet, splint, injector to the thigh, pills, medkit use, surgery kit: a long, uncomfortable animation), eating and drinking, using items (flare upward, compass raise, barometer check, radio talk gesture), harvesting salt (scraping with the knife), boarding boats, starting an outboard (pull cord), steering, swimming strokes, reviving (kneel, apply chest compressions and a stim: 6 s) and being revived (on the ground). There's no carrying or dragging in v1.

Use Motion Warping for interactions that need precise positioning (doors, containers, ladders, revives): the character warps to the interaction's alignment point at the start of the montage.

## 29.6 HIT REACTIONS AND DEATH

Hit reactions: a blend of a physical animation layer (Physical Animation Component with a short burst of physics on the hit body chain, weighted by damage: a shoulder hit jerks the arm and torso) and a set of directional additive flinches (front, back, left, right; upper and lower). Players flinch visibly when hit (for the shooter's feedback) but the flinch is additive and short so it doesn't take control away. Armor-stopped hits have a smaller flinch.

Stagger: heavy hits (shotgun close range, melee heavy, Brute slams) trigger a stagger montage (0.5 s, movement slowed).

Knockdown (Brute charge, waves on the breakwater): a ragdoll-blend knockdown with a get-up montage (blend from ragdoll to the get-up animation using pose snapshot).

Death: ragdoll from the current pose with the impulse of the killing hit (directional, scaled by damage), plus a few "final" animations for specific cases (a slump against a wall when killed near one, using a trace to pick it: optional polish). Ragdoll settles and then freezes (part 11). Ragdolls aren't replicated: each client simulates its own, so bodies can rest in slightly different positions on different clients. That's acceptable visually, but the lootable body's interaction volume must be where everyone can reach it: the server's body position is authoritative for the loot interaction, and clients snap their ragdoll toward the server's settled position (a replicated final root position and rotation) after settling, with a blend.

## 29.7 HOLLOW AND WARDEN ANIMATION

Hollows: a separate locomotion set, not motion matching (cheaper, and their movement is simpler): blend spaces for the shamble (walk with heavy, uncoordinated steps, arms limp or raised), the run (lurching, faster), Crawler crawl and lunge, Brute heavy walk and charge, Wailer stand and scream, Bloat waddle, Drowner swim. Idles (sway, twitch, stare at memory points, sit slumped, submerged rise), attacks (grab, bite, swipe, slam, lunge), reactions (stagger, burn flee, flinch), deaths (crumble, fall), and the "rise from the water" animation (a slow stand-up from lying underwater, with water pouring off). Hollow animation variety: random play rate (0.9 to 1.1), mirrored variants, and per-instance additive twitches so a crowd of Shamblers doesn't move in sync.

Use Animation Sharing for distant Hollows (part 13).

Wardens: use the player's animation system (motion matching is too expensive for 18 AI at once on the server; on clients, Wardens use the GASP locomotion with a cheaper database subset). They use the same weapon animation sets.

Bosses: unique animation sets authored for the Ferryman (a heavy, slow walk, the hook throw and pull, the sweep, ringing the bell, wading into the water) and the Choir (singing loops, recoil when hit, the pulse, death sequence per singer).

## 29.8 FACIAL ANIMATION

Minimal: blinks, eye saccades and look-at on the player character's face (visible in the menu and death cam), pain expressions on damage (a quick facial pose additive), exertion expressions when sprinting and mantling, and the MetaHuman face's idle. For traders (NPCs at the Halcyon), idle facial animation and simple talking (jaw movement driven by the subtitle text timing: approximate lip flap, which is acceptable without voice audio) or MetaHuman Animator data if I can record some later.

## 29.9 RETARGETING AND SKELETON RULES

Everything targets the UE5 mannequin skeleton (`SK_Mannequin`). Any animation from another skeleton is retargeted with IK Retargeter assets (UE 5.4+ retargeting tools) and checked for foot sliding and hand alignment on weapons. Weapon skeletons have a consistent bone naming scheme: `root`, `weapon_root`, `bolt`, `charging_handle`, `trigger`, `selector`, `mag_release`, `bolt_catch`, `magazine`, `ejection_cover`, `hammer`, `cylinder`, `lever`, `pump`, `barrels` (for break actions), `bipod_l`, `bipod_r`, `stock_slide`. Every weapon socket follows the naming in part 08.

## 29.10 ANIMATION PERFORMANCE

Budget on the client: under 2.5 ms of animation work (worker threads, so it mostly affects CPU headroom) for 12 players and 60 Hollows in view, on Medium. Tools: Update Rate Optimization (URO) for distant characters, the Animation Budget Allocator, LOD-based anim graph simplification (distant players skip IK and procedural layers, distant Hollows use shared animation), and `VisibilityBasedAnimTickOption` set to only tick pose when rendered (except the server's hitbox posing).

On the server (host), the per-character animation cost must be minimal: only the cheap server locomotion for hitboxes and montages for gameplay timing (reload notifies run on the server: make sure montage notifies that matter for gameplay fire on the server even if the mesh isn't rendered; use `EMontagePlayReturnType` and notifies with `bTriggerOnDedicatedServer`/listen server equivalents).

## 29.11 ANIMATION ACCEPTANCE TESTS

No foot sliding over 3 cm per step at walk, jog and sprint on flat ground and stairs (an automated test measures foot bone velocity during plant phases).

Left hand IK stays on the weapon's grip point within 1 cm during idle, ADS, reload (except where the montage releases it) and fire, for every weapon config in the fuzz corpus (part 08).

Every reload montage's notifies fire at the right gameplay times and the montage duration matches the stat within 0.05 s.

Server hitboxes match the client pose within 8 cm at head and chest for the standard movement set.

Animation cost stays within budget in the crowd scene.

---

End of part 29. Next: `30_CODE_ARCHITECTURE.md`.
