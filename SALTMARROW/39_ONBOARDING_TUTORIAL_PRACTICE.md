# SALTMARROW: PART 39, ONBOARDING, THE SHAKEDOWN, THE RANGE AND PRACTICE

Extraction shooters lose most new players in the first hour. They die with no idea why, lose gear they didn't know was at risk, and quit. This part is our answer: a guided first raid (the Shakedown), a firing range that doubles as a gunsmith test bench, a Practice sandbox, and a set of first-ten-raids protections that make early raids gentle without making the game soft.

The rule: teach by doing, in the world, with Sparks and the Captain as the voices. No walls of text. No pop-up that stops the game for more than 4 seconds.

---

## 39.1 THE FIRST LAUNCH FLOW (RECAP)

Title, callsign, character creator, Halcyon main with the Shakedown card pulsing (part 01.16, part 23.2). The player can skip the Shakedown ("I've played extraction shooters before"), which drops them into Main with a smaller card "Take the Shakedown any time from PLAY." Skipping grants nothing; the "Fresh Off the Boat" achievement requires completing the Shakedown.

## 39.2 THE SHAKEDOWN (GUIDED FIRST RAID)

A special riskless raid (part 03.3.2) on Harbourside, solo or with the squad (if a friend invites a new player, the Shakedown can be played together; the guidance appears for the new player only). Duration: no hard timer for the first run; the Surge comes on a scripted trigger instead of a clock. Loadout: a fixed kit (Gannet with 3 mags, Kestrel 9, 2 bandages, a splint, an IFAK, painkillers, a daypack, a police stab vest, a hard hat), so the player learns with a known set, and nothing from their stash is used.

The beats (each a scripted objective with a world marker and a short Sparks or Captain line as subtitles):

1. The landing (West Slipway). Sparks: "Morning, new crew. This is Sparks on the Halcyon. I'll be in your ear. Walk up the slip and get your feet under you." Movement hints (WASD/stick, sprint, crouch) appear as small prompts near the bottom of the screen, one at a time, and fade once used.

2. The mantle. A low wall blocks the path with a gap too narrow to squeeze through. Prompt: "Jump to climb over." A second, higher wall requires a high mantle.

3. The lifeboat station: looting. Sparks: "Lifeboat station. They'll have left supplies. Search the lockers." Prompt: Interact to open, then the search reveal. The inventory opens with an overlay highlighting the loot panel and the backpack, with a two-line explanation ("Drag items into your bag. Bigger items take more space.") and a "Got it" button. The player moves 3 items. Then: "Ctrl+click moves items fast." Then close.

4. A note. One locker has a note (the coxswain's callout log). Prompt: "Right-click > Read." The Journal is mentioned: "Notes you read are kept in your Journal back on the Halcyon."

5. The first Hollow. At the lifeboat station's door, a single Shambler stands at the quay staring at the water (a memory point). Sparks: "That's one of the drowned. They hear better than they see. Shoot it in the head, or don't let it grab you." Prompts: ADS, fire. If grabbed: the break-free prompt appears with "Mash F!". After the kill: "Gunfire carries. Anything nearby heard that."

6. Two more Hollows come around the corner (attracted by the noise). Teaches: noise attracts.

7. Healing. Scripted: a Crawler lunges from under the quay as the player walks past (it can't kill: a scripted hit that leaves a light bleed and leg damage). Captain on the radio (her first line): "You're bleeding. Use a bandage before you do anything else." Prompt: H (health screen) or the quick slot. Teaches bleeds, the health doll, and the splint if the fracture triggered.

8. The weapon. A short corridor in the harbour master's office with three targets (old dartboards and paper targets on the wall) for a moment of shooting practice: reload (R), check mag (hold R), fire modes (B). Tomasz's voice on the radio (his first line): "That's my Gannet you're holding. Be gentle with the trigger."

9. Loot and value. The Drowned Man pub has a wedding gifts table with valuables. Sparks: "Valuables sell well. Check the tooltip for what they're worth." The appraisal is enabled during the Shakedown even without the Appraiser upgrade.

10. The Surge. Triggered when the player leaves the pub (or after 8 minutes). Sparks: "Pressure's dropping. Look southwest." The camera nudges (a gentle, skippable look-at assist) toward the storm wall appearing over the sea. "That's the Surge. When it hits, the water comes up, and so do they. Get to high ground or get to a boat." The HUD weather indicator is highlighted with a tooltip.

11. The rising water. The quay floods to knee depth as the player moves; a short swim section (the lowest street floods to 1.6 m) teaches swimming and the weight rule (the daypack is light, so no sinking; a prompt explains "Carrying a lot? You'll sink. Drop your bag if you have to.").

12. Extraction. Sparks: "There's a boat coming into the cannery jetty. Ninety seconds. Go." The map opens with a prompt (M), showing the extraction. A few Hollows rise from the water between the player and the jetty (low difficulty). The player boards: "Stay on the boat until it leaves."

13. The summary, explained. The post-raid pages have short annotations: "Everything you extracted with is yours. If you'd died, you'd have lost your gear. In the Shakedown, nothing was at risk." Then the Captain in the Halcyon: "Back in one piece. Good. That was the easy one."

14. Back on the Halcyon: a guided tour of three screens with one prompt each: STASH ("Your stash. What you bring home lives here."), TRADERS (the Captain greets you; sell one item: "Sell what you don't need."), LOADOUT ("Next time, you choose what to bring. What you bring, you can lose."). Then the Captain's first contract (Cold Storage) is offered, and the PLAY button pulses for a Standard raid with the hint "Ready? Your first real raid. Bring something cheap."

The Shakedown takes 12 to 18 minutes. Track each beat's completion time in telemetry (`tutorial_step`) to find where players stall.

## 39.3 THE FIRST TEN RAIDS

Protections and nudges for players with fewer than 10 Standard raids:

Matchmaking: new players are bucketed together when possible (part 18). Lobbies with new players get a "New Salvagers" flag, and hosts with mostly new players get a 15% lower Warden accuracy and 10% fewer Hollows (raid-wide, so it's fair inside the raid). That softening disappears at 10 raids.

Hints: contextual hints (control hints, part 33.5.4) for things the Shakedown didn't cover, shown once each: first locked door ("Locked: find a key, or try a lockpick"), first time Overloaded, first malfunction ("Your gun jammed. Press R to clear it."), first downed squadmate, first salt deposit, first body loot, first conditional extraction, first time near a boss arena, first Night raid.

Death explanations: on the death summary for the first 10 raids, a short "What happened" line from the death data ("You were shot in the head from 140 m by a salvager with a Skua. Helmets stop many rounds to the head.", "You drowned. Heavy loads sink. Drop your backpack (hold G) to float."), and a tip linked to the cause.

Scavenger runs: the PLAY screen suggests a Scav run when the player's stash value is low ("Low on gear? Go in as a Scavenger: free kit, nothing to lose.").

Starter contracts: the first 4 Captain contracts and the first 3 Tomasz contracts double as soft tutorials (find specific supplies, learn the hospital, modify a weapon in the gunsmith, use a suppressor).

## 39.4 THE GUNSMITH TUTORIAL

The first time the player opens the Gunsmith (or as part of Tomasz's second contract, "Make It Yours"), a short guided sequence at the bench: click the muzzle slot, hover parts to see the stats change, install a muzzle brake bought from Tomasz (the contract gives 5,000 Scrip for it), check the recoil bar, then click Test Fire and fire a magazine in the range. Tomasz's lines guide it ("See? The bar moved. Less kick. Now the gun is louder. Everything costs something.").

## 39.5 THE FIRING RANGE

`L_Range`: a part of the Halcyon's car deck (in fiction: the stern section, with a long open view toward a set of floating targets on the water and a small steel target field on a moored barge). Always available from the Gunsmith (Test Fire) and from PLAY > Practice > Range.

Features: steel targets at 25, 50, 100, 200, 300, 400 and 600 m (on the barge and on buoys), which ring on hit and show the impact point on a small HUD panel (an inset camera at the target), a paper target lane at 15 and 25 m with a "reset" button, a moving target track (a sled on a rail at 50 m, Gunsmith Bench L3), a recoil wall, a timer for drills (a "draw and fire" drill, a reload drill, a transition drill: rifle to pistol), a dummy wearing armor of a chosen class to test ammo penetration (with a readout), and a weapon rack giving temporary access to every weapon and part the player has unlocked or owns (in the range only; nothing is consumed: ammo is free, parts aren't removed from the stash).

The range shows hidden stats (exact ammo count, damage numbers optional, the hit zone and damage on each hit), which makes it the place to learn.

## 39.6 PRACTICE MODE

Practice (offline, standalone): any district of the map, configurable: time of day, weather, Surge on/off and timing (compressed or normal), Hollow density (none to brutal), Wardens on/off, AI difficulty (Easy, Normal, Hard, Brutal), the boss (none, Ferryman, Choir in Tier 2), loadout (any weapon and attachment, regardless of ownership, with the gunsmith available in a "Practice Gunsmith" mode that uses the full catalog), invulnerability toggle, infinite ammo toggle, and a "spawn here" free camera mode for exploring the map.

Nothing in Practice touches the backend's stash or progression. Practice works offline (if the backend is unreachable, Practice is still available from the title screen's offline option).

Practice is also the testing ground for you: the debug commands (`sm.ai.spawn`, `sm.surge.skipto`, etc.) are available in Practice in development builds.

## 39.7 ONBOARDING ACCEPTANCE TESTS

A new player completes the Shakedown without external help (tested with people who haven't seen the game: the first friends playtest is literally this test). Target: 90% completion and a median time under 18 minutes.

Every Shakedown beat can't soft-lock: each beat has a fallback (if the scripted Crawler can't reach the player, the bleed applies anyway with a "you cut yourself on the quay" line; if the player swims away from the route, the extraction boat still waits until they arrive).

The Shakedown works for a squad of 2 or 3 with one new player and two veterans (veterans see no prompts, the new player sees all).

The first-10-raids softening applies only when the flag says so and is removed at raid 10.

---

End of part 39. Next: `40_ROADMAP_AND_MILESTONES.md`.
