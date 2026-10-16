# SALTMARROW: PART 54, RISKS, HONEST LIMITS AND WORKING RULES

The last part of the bible is the most honest one. This is a huge project. Most games of this scope are built by teams of 30 to 100 people over three to five years. We're doing it with one AI agent, one human, free tools and a lot of discipline. That's possible for a smaller version of this vision and impossible for all of it at once. This part names the risks, says what we'll do about each, and sets the working rules that keep the project alive.

---

## 54.1 THE BIG RISKS

### 54.1.1 Scope

Risk: the bible describes a game that would take a professional studio years. Trying to build it all in parallel produces a pile of unfinished systems and nothing playable.

Response: the tiers and milestones (parts 01.8 and 40). Each milestone is a complete playable build. Tier 1 alone (Harbourside, 12 weapons, Hollows, the Surge, persistence, multiplayer) is already a real game. If we only ever finish Tier 1, we've made something friends can play. Treat Tier 2 and beyond as a bonus earned by finishing Tier 1 well.

### 54.1.2 Art volume

Risk: 36 weapons, 260 attachments, a 1.4 km island, hundreds of props, characters, Hollows, animations. Sourcing and making that much art is the slowest part of the project, and placeholder art makes a game feel unfinished even when it plays well.

Response: the sourcing plan (part 41), kitbashing and procedural tools, a consistent material system that unifies mixed sources (part 41.4), and aggressive prioritization: the first-person view of the four Tier 0 weapons and the Harbourside district get the art budget first. Everything else waits. Paid asset packs (with my approval) are the biggest accelerator available; list the options early.

### 54.1.3 Animation

Risk: weapon animations (reloads, bolt cycles, inspects) for many families are hard to source and slow to author, and bad animation makes great guns feel bad.

Response: Lyra's and GASP's animations as the foundation, a short list of families for Tier 0 and 1 (pistol, AR, bolt, AK, HK, pump, revolver, break, open bolt), Control Rig authoring for the rest, and accepting simpler animations for rare actions. Consider a paid weapon animation pack (ask me).

### 54.1.4 Networking complexity

Risk: listen-server networking with 12 players, 60 AI, projectile ballistics, lag compensation, a grid inventory and a custom relevancy filter is genuinely hard. Desyncs and rubber-banding destroy the experience.

Response: networking from day one (part 18 rule), test at simulated latency on every feature, bot soak tests (part 37.5), the Replication Graph and push model early, and conservative scope (12 players, not 30). If the host CPU can't handle the full AI load, reduce AI counts before anything else.

### 54.1.5 Host performance

Risk: the host runs the game and the server; on a mid-range PC, 60 Hollows, 15 Wardens and 11 clients may push the game thread past 16 ms.

Response: the AI significance system, the host performance governor (part 35.2.2), host selection (part 18.6.3), and, as the last resort, lower population caps when hosting on weaker machines. Long-term: dedicated servers (Tier 4).

### 54.1.6 Cheating as host

Risk: a host can cheat. Among friends this is a small risk; with strangers it grows.

Response: backend validation (parts 12.9, 21) catches economic cheats. In-raid host cheats aren't preventable without dedicated servers. Accept it for v1. Private raids for friends sidestep it.

### 54.1.7 The backend and data loss

Risk: losing the database loses every player's stash. Bugs in the stash engine can duplicate or delete items.

Response: transactions, versioning, idempotency, the ledger, fuzz tests (part 19), and daily backups with a tested restore (part 19.11). Never ship a backend change without running the stash fuzz suite.

### 54.1.8 Distribution friction

Risk: an unsigned exe triggers SmartScreen; a 2 GB+ download is slow; friends give up before playing.

Response: package size discipline, clear download page instructions, the code signing decision (part 36.3.3), and optionally itch.io. Test the full download-to-raid flow on a clean machine before every release (part 36.7).

### 54.1.9 Engine and plugin churn

Risk: engine updates break plugins, Lyra or GASP; features marked experimental change.

Response: lock the engine version (part 30.2). Don't upgrade mid-milestone. Avoid experimental systems (part 53.2).

### 54.1.10 Legal

Risk: names, trademarks and licenses. "Saltmarrow" might be taken; weapon designs might look too much like real trademarked guns; an asset might have the wrong license.

Response: check the name before any public release (⚑ ask me: I'll search trademarks and app stores), fictional manufacturers and designs that avoid trademarked silhouettes and logos (part 02.9), and the license rules (part 41). Before any public release, review the credits and licenses with me.

### 54.1.11 The context window

Risk: you (Claude Code) can't hold 200,000 words of design and a large codebase in context at once. Details get lost across sessions.

Response: the bible is split into parts so you load what you need; `BUILD_LOG.md` and `DECISIONS.md` carry state between sessions; part 40 tells you where you are; every important value has a stable name you can search for; and the data-driven architecture means most knowledge lives in data assets you can query, not in your memory.

## 54.2 WHAT THIS GAME IS NOT GOING TO BE (PLAINLY)

It won't match the content volume of commercial extraction shooters with hundred-person teams. It won't have voice-acted characters in v1. It won't have dedicated servers or kernel anti-cheat in v1. It won't be on consoles. The art won't be uniformly AAA; some of it will be good kitbash. That's fine. What it can be, if we're disciplined, is a tight, atmospheric, mechanically deep extraction shooter on one beautiful island with a signature mechanic nobody else has (the rising tide), guns that feel great and a gunsmith people love, which a group of friends can download and play together tonight. That's the target, and it's a great one.

## 54.3 THE WORKING RULES (THE SHORT LIST)

These are the rules from across the bible, collected. Follow them every session.

1. Read before you build. At the start of each session: `BUILD_LOG.md`, part 40 (where are we), and the parts for the current task.
2. Pillars first. When unsure, the five pillars (part 01.4) decide.
3. Playable always. The project never sits unplayable for more than a session. Keep old paths working behind a cvar during big changes.
4. Networked from line one. Test every gameplay feature with 2+ clients at 150 ms latency before calling it done.
5. Server authority. The server decides gameplay; the backend decides persistence; the client decides nothing but inputs and cosmetics.
6. Data, not code, for content. Weapons, items, AI, loot, contracts, stations, cosmetics: all data assets, generated from authoring sources where possible.
7. C++ for systems, Blueprints for presentation.
8. Tests prove it. A system is done when its acceptance tests pass. Write them as you go. Run them before every merge.
9. Look at what you make. Screenshots and playtests for anything visual or feel-related. Never claim it looks or feels right without checking.
10. Performance is a feature. Respect the budgets (part 35). Profile when a budget is at risk, not after.
11. Toolsets for repetition. If you do something through the MCP more than three times, write a toolset.
12. Log everything. `BUILD_LOG.md` every session, `DECISIONS.md` for deviations, `CREDITS.md` for every asset, `FEEL_LOG.md` and `PERF_LOG.md` as they apply.
13. Commit and push every session. Small commits. Clear messages. Feature branches, PRs into `develop`.
14. Ask at the ⚑ points and for anything that's my call: money, public releases, names, legal, destructive actions on Railway or GitHub, and feel sign-offs.
15. Don't ask about things that are your call: implementation details, naming within conventions, the order of tasks within a milestone.
16. Be honest. Label placeholders. Report failures with logs. Say what's broken. "It works" means you ran it.
17. Licenses are sacred. No asset without a verified, recorded, commercial-compatible license.
18. No em dashes in any player-facing text (part 02.11). The house style for all writing in the game: plain, specific, human.
19. Fairness is a design rule. No setting, cosmetic or input method may give an information advantage (parts 10.9, 33.4, 34.5).
20. Ship to friends. The goal is the evening in part 01.14. Every decision should get us closer to it.

## 54.4 THE DEFINITION OF DONE FOR V1 (RELEASE 0.1)

Release 0.1 is done when all of this is true:

A clean Windows machine can download the game from the download page, run it, sign in with no account form, create a character, complete the Shakedown, and join a friend's squad by friend code within 10 minutes of starting the download (on a reasonable connection).

Two to twelve players can play a Standard raid in Harbourside together through EOS, from different networks, with the Surge, Hollows, loot, extraction and death, at 60 fps on the reference laptop at Medium, and the host's server holds 60 Hz.

What players extract persists on the Railway backend, what they lose is gone, and nothing duplicates.

Twelve weapons feel great (signed off by me in the feel review), with a working gunsmith and its bench screen.

The Captain and Tomasz trade and give 8 contracts.

Crashes report to the backend, and the update prompt works.

Three friends who've never seen it play three raids with me, and someone says "one more".

## 54.5 A NOTE FROM ME

I've given you the most detailed brief I could. Use it as a map, not a cage: where you find a better way that serves the pillars, take it and tell me. Where the map is wrong, say so. I'd rather have a smaller game that's brilliant than a bigger one that's broken. Build it like you'd want to play it.

---

End of part 54. Next: `55_REFERENCE_CODE_SKELETONS.md`.
