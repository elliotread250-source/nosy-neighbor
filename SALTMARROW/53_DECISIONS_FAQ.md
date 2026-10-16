# SALTMARROW: PART 53, THE DECISIONS FAQ

Questions you'll hit while building, answered in advance. These are the forks where projects like this usually stall or drift. If your question is here, take the answer and move on. If it isn't, decide using the pillars (part 01.4), record it in `DECISIONS.md`, and add it here.

---

## 53.1 SCOPE AND PRIORITIES

### A system is half done and a new milestone task is calling. Which wins?

Finish the half-done system to its acceptance tests first. A pile of 80%-done systems is the most common way games die. The only exception: a blocker that needs my input. Then park it, log it, and move to the next task in the same milestone.

### The bible asks for something the engine can't do well. What now?

Do the closest thing that preserves the pillar it serves, write down what you gave up and why in `DECISIONS.md`, and tell me in the session summary. Don't build a custom engine feature to get the last 10% unless the pillar depends on it (gun feel and networking might; a decorative effect never does).

### Should I build feature X "properly" now or hack it for the milestone?

Build the data model and the network contract properly from the start, every time: those are expensive to change later. Presentation (UI polish, VFX, animation detail) can be a first pass and improved later. If in doubt: proper data, cheap visuals.

### Can I add a feature that isn't in the bible because it would be cool?

Write it as a proposal in `design/IDEAS.md` and tell me. Don't build it unasked. The exception is tiny quality-of-life touches that take under an hour and don't touch gameplay rules (a sound, a tooltip, an animation flourish); do those and mention them.

### Two parts of the bible contradict each other. Which wins?

The more specific and the later part wins for numbers (part 43 beats earlier balance figures; part 26 beats part 01 on scope rendering; part 33's final gamepad table beats anything before it). The pillars win for intent. If still unclear, ask.

## 53.2 ENGINE AND TOOLS

### Lyra won't build with the installed engine version. What do I do?

Check Fab for the Lyra version matching the engine. If none exists, try the nearest older engine version that has both Lyra and the Game Animation Sample (if it's installed or installable). If none of that works within a day, start from a blank C++ project and add GAS, Enhanced Input, Common UI and CommonUser manually (part 30.1). Tell me which path you took.

### Should I use Blueprints or C++ for this?

Rules (part 30.7): core rules, networking and anything per-frame on many actors in C++. Presentation, widget layout, simple level scripting and cosmetic sequencing in Blueprints. When a Blueprint graph passes 30 nodes, move it to C++.

### The unreal-mcp tool I need doesn't exist. Do I work around it?

If it's a one-off, use what exists (the Python or console command paths through the editor, or edit the asset files' sources where possible). If you'll need it again, write a toolset function with the `create-toolset` skill. Never hand-edit binary `.uasset` files.

### Live Coding failed or behaves strangely.

Close the editor, do a full build from the command line (part 30.8), reopen. Live Coding can't handle header changes reliably (new UPROPERTYs, new classes, changed class layouts); use full builds for those.

### Should I use Mover 2.0, Iris, Substrate, Mass, or another newer engine system?

Only if the installed engine marks it production-ready and it clearly serves a pillar. Defaults: CMC (not Mover), the standard replication system plus Replication Graph (not Iris), legacy materials (not Substrate) unless production-ready, regular actors for AI (not Mass). Each of these is in its respective part with the reasoning.

### The editor crashes when I do X through the MCP.

Reproduce it once manually to confirm it's not the MCP, save often, and work around it. Log it in `BUILD_LOG.md` with the crash log path. If it's an engine bug, find another way to achieve the result.

## 53.3 ART AND CONTENT

### I can't find a free asset of the quality we need.

Build a decent placeholder in-engine (part 07.8 and 41.1), label it WIP in development builds, and add the gap with a recommended paid option to `ASSET_OPTIONS.md`. Never ship a grey box where a player looks closely; a clean kitbash with good materials is always possible.

### A third-party asset has an unclear license.

Don't use it. Find another one or make it.

### Should every building be enterable?

No. About 70% of houses (part 14.13.3), all hero buildings, and nothing that looks enterable but isn't.

### How much detail goes into interiors that few players visit?

The PCG room fill (part 14.13.4) plus one story detail per building. Hand-dressing is for hero buildings and story rooms only.

### The salt glow or another effect makes the scene look like a different game.

Tone it down. The world is grounded and cold; the uncanny elements are small, rare and cyan-pale. If a screenshot looks like a fantasy game, the effect is too strong.

### How gory should it be?

Grim, not splatter. Blood on hits and decals, no dismemberment of humans (Hollows can lose forearms, part 13.3.1, and their "blood" is salt dust and grey fluid), no gore close-ups, no cruelty animations. The game is about loss, not shock.

## 53.4 GAMEPLAY AND BALANCE

### Players will exploit X (third-person peeking, prone in the water, standing on a car roof).

Check whether the relevant system already handles it (the LOS relevancy filter for peeking, part 18.8.2; the prone rules in water, part 04.6). If it's a genuine exploit that breaks a pillar, fix it at the system level, not with a special case for that spot.

### A weapon is clearly too strong in playtests.

Tune its data (recoil, spread, damage via its ammo, price, stock availability) within its feel brief (part 50.5), not by adding special rules. Check the TTK simulation (part 43.3) still lands in band. Record the change.

### Should I add hit markers or damage numbers for clarity?

Hit markers yes (server-confirmed, part 24.3.1). Damage numbers only in Practice and the range.

### Should there be a minimap?

No. The compass, the paper map, pings and sound are the navigation tools.

### Do Hollows respawn?

The director can respawn them out of sight to maintain the population (part 13.3.3). Never spawn them in view or within 40 m of a player except from tide spawn points during a Surge (which is the visible "rising from the sea" moment).

### Should AI ever cheat (see through walls, know player positions)?

No. AI uses the same perception rules as everything else (part 13.2), with one exception: Hollows' salt sense (a soft, short-range attraction to salt carriers), which is a designed mechanic, not a cheat.

### A player is stuck somewhere (geometry trap).

That's a bug. Add a "Stuck" button in the in-raid pause menu (Tier 1 safety net) that, after a 10 s hold with no damage taken, moves the player to the nearest valid nav point within 10 m. Log every use with the position so we can fix the geometry.

### Should loot be shared or per player?

Shared world loot (part 03.8): what one player takes is gone for others. Contract items are the only per-player spawns (part 12.8.4).

## 53.5 NETWORKING AND BACKEND

### EOS isn't set up yet. Can I continue?

Yes. Use the Null online subsystem and LAN/IP connections for development (part 40.1, task 0.13). Keep the EOS-specific code behind the identity and session interfaces so swapping in EOS is configuration, not a rewrite.

### Device ID login doesn't work through the OSS.

Use the EOS SDK directly for identity (part 18.3.4) through a small wrapper class.

### Should the client ever write to the database directly?

Never. The client only talks to the api over HTTPS with its JWT.

### Should the host trust a joining client's inventory?

Never. The host builds every player's inventory from the backend's entry manifest (part 18.7.1).

### A raid report fails validation. What does the player see?

The summary shows the committed result (what passed), and the rejected items are listed as "Could not be verified" with an apology and a support code (the raid ID). The raid is flagged for my review (part 21). Never silently drop items without telling the player.

### The backend is down. What happens to a raid in progress?

The raid continues (the host's game doesn't need the backend mid-raid). Checkpoints queue locally and retry. Reports persist to disk and retry until acknowledged (part 20.14). Players in menus see "Offline: changes disabled" (part 23.14). New raids can't start until the backend is back (the join call needs it).

### Should I use Railway's MCP or the CLI?

The MCP tools first (they're designed for this), the Railway CLI as a fallback. Confirm with me before anything destructive (part 19.3).

### Do I need a separate staging EOS deployment?

Yes: the EOS dev portal's Dev sandbox for staging and development builds, the Live deployment for production builds (part 18.3.3). Build configs pick the right one.

## 53.6 PROCESS

### How often do I commit?

At least every working session, and every time a task's tests pass. Small commits with clear messages. Push to the feature branch; merge to `develop` with a PR when a feature is done.

### When do I ask for a playtest?

At every milestone gate (part 40), and any time a feel question comes up that only a human can answer (part 37.7).

### How do I report a problem I can't solve?

In the session summary: what you tried, what happened (logs, screenshots), what you think the cause is, and two or three options with your recommendation.

### I'm not sure if something looks good.

Take a screenshot, compare it to the reference board and the look rules (part 25.1), and if still unsure, show me. Never say it looks good without looking at it.

### Can I skip a test that's slow or flaky?

No. Fix the flakiness or make it faster. If a test genuinely can't be made reliable, tell me and we'll decide together.

### The design bible is too long to keep in context. What do I do?

Keep the parts for the current milestone open and re-read part 01 (pillars), part 40 (roadmap) and `BUILD_LOG.md` at the start of each session. Search the bible for specifics when needed (`grep` is your friend; every important value has a stable name).

---

End of part 53. Next: `54_RISKS_AND_WORKING_RULES.md`.
