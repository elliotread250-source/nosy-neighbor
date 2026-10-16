# SALTMARROW: PART 35, PERFORMANCE BUDGETS AND OPTIMIZATION

Pillar 5 says it runs on a mid-range laptop. This part turns that into numbers: reference hardware, frame time budgets per system, memory budgets, network budgets, the benchmark that measures them, and the optimization playbook. Performance is a feature, measured from Tier 0, not a pass at the end.

---

## 35.1 REFERENCE HARDWARE

| Name | Spec | Target |
|---|---|---|
| Steam Deck class | AMD APU (4 Zen 2 cores, RDNA2 8 CU), 16 GB shared, 1280×800 | Low preset, 30 fps locked, TSR 50% to 67% |
| Minimum PC | GTX 1660 Super / RX 5600 XT, Ryzen 5 2600 / i5-9400, 16 GB, SSD | Low, 1080p, 60 fps (TSR Performance) |
| Reference laptop (the main target) | RTX 3060 Laptop (6 GB), Ryzen 7 5800H / i7-11800H, 16 GB, NVMe | Medium, 1080p, 60 fps (TSR Quality or DLSS Quality) |
| Recommended desktop | RTX 3070 / RX 6800, Ryzen 5 5600X / i5-12400, 16 GB | High, 1440p, 60 fps |
| High end | RTX 4080 / RX 7900 XTX, Ryzen 7 7800X3D, 32 GB | Epic, 4K with upscaling, 60+ fps (or 1440p 120) |
| Host reference CPU | Ryzen 5 3600 / i5-10400 (6 cores), 16 GB | Hosts a 12-player raid with a stable 60 Hz server tick while playing at Medium |

Storage: SSD required (minimum spec). The game install target is under 40 GB in v1.

## 35.2 FRAME TIME BUDGETS (REFERENCE LAPTOP, MEDIUM, 1080P, 60 FPS = 16.6 MS)

### 35.2.1 Game thread (client, not hosting)

| System | Budget (ms) |
|---|---|
| Character movement (local + 11 remote players) | 0.8 |
| Animation (game thread part; most on workers) | 0.6 |
| AI (client side: just replicated characters) | 0.3 |
| Projectiles (cosmetic, client side) | 0.3 |
| Physics (game thread part) | 0.6 |
| Audio (game thread: occlusion traces, voice management) | 0.4 |
| UI and HUD | 0.6 |
| Gameplay (abilities, effects, interactions, inventory, world systems, Surge) | 1.2 |
| Network (receive, process replication) | 1.0 |
| Engine overhead (world tick, streaming, GC amortized) | 2.0 |
| Total target | 7.8 (leaving headroom; the render thread is usually the limit) |

### 35.2.2 Game thread (host, adds the server work)

| Additional server system | Budget (ms) |
|---|---|
| AI (60 Hollows, 15 Wardens, director) | 3.0 |
| Server projectiles (simulation, lag compensation) | 1.5 |
| Replication (ServerReplicateActors, Replication Graph, LOS relevancy) | 2.0 |
| Server movement validation | 0.6 |
| Server gameplay (damage, inventory authority, loot, Surge, extraction) | 1.0 |
| Backend calls (checkpoint serialization every 10 s, amortized) | 0.1 |
| Total extra | 8.2 |

So the host's game thread runs about 16 ms at peak: right at the 60 Hz edge on the host reference CPU. That's why the host gets an automatic frame cap and why AI and replication must hit their budgets. If the host's game thread exceeds 16.6 ms for more than 5% of frames in a full raid, the server tick drops to 45 Hz and AI LOD gets more aggressive automatically (a "host pressure" governor reading the frame time: `USMHostPerformanceGovernor`).

### 35.2.3 Render thread and RHI

Target under 12 ms on the reference laptop, with draw calls under 3,500 at the worst view (the church belfry looking over the town) thanks to Nanite (Nanite draws are cheap; the remaining draw calls are characters, translucency, VFX, UI and non-Nanite meshes).

### 35.2.4 GPU (reference laptop, Medium, 1080p, TSR Quality from ~720p internal)

| Pass | Budget (ms) |
|---|---|
| Nanite and base pass (geometry) | 3.0 |
| Shadows (VSM) | 2.0 |
| Lumen (GI and reflections, software, Medium) | 3.5 |
| Lighting (direct, local lights) | 1.0 |
| Translucency (rain, storm curtains, smoke, water surfaces) | 1.5 |
| Water (single layer water, underwater) | 0.6 |
| Volumetrics (fog, clouds) | 0.8 |
| Post-processing (TSR, bloom, grading, DoF in menus) | 1.2 |
| VFX (Niagara, at peak) | 1.0 |
| UI | 0.3 |
| Total | 14.9 (target 16.6 with headroom for spikes) |

At peak Surge, VFX and translucency get an extra 1.0 ms combined budget, compensated by the storm's darker scenes and reduced view distance in fog (scale view distance down when fog is thick: there's no point rendering what fog hides).

Scope rendering in PiP mode on High: +3.0 ms allowed (part 26).

## 35.3 MEMORY BUDGETS

| Resource | Reference laptop | Steam Deck |
|---|---|---|
| System RAM (game client) | under 8 GB | under 6 GB |
| System RAM (client + server when hosting) | under 10 GB | (hosting not recommended) |
| VRAM | under 5.5 GB at Medium | under 4 GB at Low (shared) |
| Texture streaming pool | 2,000 MB at Medium | 1,000 MB at Low |
| Nanite streaming pool | default, tuned | reduced |
| Audio memory | under 400 MB | under 300 MB |

Textures: use texture streaming and Virtual Texturing aggressively; set LOD groups correctly; make sure UI and HUD textures don't stream (never blurry icons).

Loading: the raid map loads in under 25 s on an NVMe SSD (masked by the boat ride, part 23.13), the Halcyon in under 10 s.

## 35.4 NETWORK BUDGETS

Part 18: under 60 KB/s per client at peak, under 25 KB/s average; host upstream under 6 Mbps for 11 clients. Checkpoint uploads (10 s) under 20 KB each.

## 35.5 THE BENCHMARK

Build a deterministic benchmark (`L_Saltmarrow` with the `-benchmark` command line flag) that a CI machine or I can run:

1. A camera flythrough (a Level Sequence) covering the worst views: the church belfry 360° pan, the harbor from the Kittiwake Lass at storm peak, the cannery interior with 20 Hollows, the high street at night with flashlights, underwater in the harbor, the moor at dusk with fog.
2. A scripted combat scene: 12 bot players (replicated through a local listen server with headless bot clients, or simulated proxies driven by recorded replays) fighting around the cannery during the Surge peak with 40 Hollows, smoke, fire and a boss.
3. A UI sequence: open the stash (full), the gunsmith (25-part weapon, field strip), the map, the inventory with a body loot.

Output: a CSV of frame times (game, render, GPU, RHI), the 1% and 0.1% lows, hitches over 50 ms (with their cause from the stats), memory high-water marks, and a summary per section, written to `Saved/Benchmarks/<date>.csv` and pushed as an artifact. Use Unreal Insights traces for deep dives (`-trace=cpu,gpu,frame,bookmark,memory,net` with a trace file per run).

Pass criteria: every section's average frame time within its target on the reference machine for the preset, 1% lows above 45 fps (for a 60 fps target), and zero hitches over 100 ms after the PSO cache is warm.

## 35.6 THE OPTIMIZATION PLAYBOOK

When something's over budget, these are the usual fixes, in rough order of cost and payoff:

Game thread: reduce tick frequency (components that tick at 60 Hz but only need 10 Hz), switch Blueprint logic to C++, use significance management for anything that scales with count (AI, characters, VFX, audio emitters), use async traces, avoid per-frame allocations (TArray reserve, inline allocators, object pools), use push model replication and dormancy, make sure animation runs on worker threads (thread-safe updates, fast path), batch RPCs.

Render thread: reduce draw calls (Nanite for static meshes, instancing for repeated non-Nanite meshes, merge small props with HLOD or by authoring), reduce dynamic shadow casters, use distance culling (cull distance volumes for small props; Nanite handles its own), simplify materials (fewer layers on small props: the Lite master), reduce translucency layers.

GPU: tune Lumen (reduce final gather quality, use the "Lumen Scene Detail" setting appropriately, keep emissive-only lighting from being a Lumen burden), tune VSM (reduce WPO invalidations: WPO disable distances on foliage, cache static shadows), reduce translucency overdraw (half resolution separate translucency, fewer layers in the storm curtain), lower the screen percentage with TSR (the cheapest big win on laptops), and reduce post-processing costs (bloom quality, DoF only where needed).

Memory: texture sizes and LOD bias per platform group, stream more aggressively, unload Halcyon content in raid and vice versa, avoid hard references between big assets (use soft references and the asset manager), audit with `memreport -full` and the Memory Insights trace.

Hitches: PSO precaching and the bundled cache (part 26), async loading for everything that streams during play (weapon meshes for players who just appeared, clothing, VFX), avoid synchronous loads (log them: `s.VerboseLoading` or the "Sync load" warnings in development builds, and treat every sync load during gameplay as a bug), garbage collection tuning (incremental GC, cluster creation for static content, pooling for frequently spawned actors).

Steam Deck specifics: the Low preset without Lumen, 30 fps cap, TSR at 50% to 67%, reduced AI animation (more animation sharing), audio voices capped lower, and FSR as an upscaler option. Test on a real Deck if I can get one; otherwise test at the Deck's resolution with a GPU-limited profile on the minimum PC.

## 35.7 PERFORMANCE GOVERNANCE

Every milestone (part 40) has a performance gate: the benchmark must pass on the reference laptop before the milestone is accepted. Between milestones, run the benchmark weekly (or on every merge to `develop` if a CI machine with a GPU is available, which it probably isn't in v1: run it manually on my machine through you and the editor, and record results in `design/PERF_LOG.md`).

Add `stat` and Insights bookmarks around every major system (`TRACE_CPUPROFILER_EVENT_SCOPE` and `SCOPE_CYCLE_COUNTER` with `STATGROUP_Saltmarrow*` groups) so a capture shows where time goes by system name.

## 35.8 PERFORMANCE ACCEPTANCE TESTS

The benchmark passes for each preset on its reference hardware.

The host stress test (12 bot clients, full AI, Surge peak) holds a 60 Hz server tick for 90% of frames on the host reference CPU.

Memory stays within budget through 3 consecutive raids without a restart (no leaks: memory high-water mark after raid 3 within 5% of raid 1).

No sync loads during gameplay in a development build playthrough (zero warnings).

---

End of part 35. Next: `36_BUILD_RELEASE_DEPLOY.md`.
