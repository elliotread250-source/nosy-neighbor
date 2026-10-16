# SALTMARROW: PART 16, BOATS AND EXTRACTION

Boats are how you arrive, how you cross the water once the streets drown, and usually how you leave. Extraction is the end of every successful raid and the most tense minute of it. This part covers both: the boat vehicles (Tier 2 for player-driven boats, Tier 1 for the scripted extraction boats), and the complete extraction catalog with conditions.

---

## 16.1 THE EXTRACTION BOAT (TIER 1)

The Halcyon sends boats to scheduled extraction points. These aren't player-driven. They're scripted actors that arrive, wait and leave, and they're the most important set piece in the raid.

### 16.1.1 The boats

Two models. The Gull (a 9 m wooden fishing boat with a small wheelhouse, an open deck at the stern, a diesel engine with a thumping exhaust, painted white with a blue stripe and the Halcyon's council stamp on the bow) used for harbor and jetty extractions. The Petrel RIB (a 7 m rigid inflatable, grey, with twin outboards) used for beach and cove extractions. Both have an NPC crew (one or two "Halcyon boatmen": oilskin-clad figures who stay at the helm, don't fight, can't be killed (they duck below the gunwale when shot at, and they're flagged invulnerable), and shout lines: "Come on, come on!", "We're leaving!", "Get down!").

### 16.1.2 The sequence

1. Call: Sparks announces the boat on the radio at T-120 s ("Gull's coming into the cannery jetty. Two minutes."). The extraction marker on the map changes to "Arriving 2:00".
2. Approach: the boat appears on the horizon at T-90 s and motors in on a spline path. Its engine is audible from 300 m (part 28) and its navigation lights are visible. Everyone on the map knows it's coming.
3. Arrival: the boat docks (or beaches, for RIBs) at T-0. A boarding volume (the deck area) becomes active. The extraction marker shows "Boarding: 1:30". The boat's horn blasts once.
4. Wait: the boat waits 90 s (60 s for RIBs). Horn at 30 s and 10 s before leaving. The crew shouts.
5. Departure: the boat leaves along its exit spline. Everyone in the boarding volume at the moment of departure is extracted (their character is removed from the raid with a fade, after a 3 s "riding away" moment where the camera pulls back to show the boat leaving). Anyone who steps off is not extracted.

Players in the boarding volume see an "EXTRACTING" banner with the countdown. If they leave the volume, the banner turns into "LEAVING THE BOAT" with a 2 s grace (if they step back in, nothing changes).

### 16.1.3 Physics and the boat

The extraction boat is a kinematic actor (it moves along its spline with authored motion and a simple bobbing from the Water plugin's wave height at its location: sample the ocean height at bow and stern and rotate/position accordingly). It's not a physics-simulated vehicle. Characters standing on it are based on it (CMC's based movement handles moving platforms well). Replicate the boat's spline position as a single float (distance along the spline) plus the start time; clients reproduce the motion locally.

Damage: the boat can't be destroyed. It's cover, and its wooden hull is penetrable by rifle rounds (wood penetration, part 05), so hiding in the boat isn't safe from fire.

### 16.1.4 Extraction counts

Each scheduled boat comes once per raid unless noted. The boat schedule is seeded (part 16.4 lists the windows). A raid has at least 4 scheduled boats, at least one of which arrives after 24:00.

## 16.2 PLAYER BOATS (TIER 2)

From Tier 2, squads can bring their own boat into the raid (if their Halcyon Boathouse station is built, part 17), or find and start a boat in the raid.

### 16.2.1 Boat types

| Boat | Seats | Speed (max) | Hull HP | Fuel | Noise | Notes |
|---|---|---|---|---|---|---|
| Rowing Dinghy | 2 (1 rows) | 2.2 m/s | 300 | none | very quiet | Found in raid (harbor), silent, slow, a great stealth option |
| Skiff (outboard) | 3 | 9 m/s | 600 | 20 min | loud (220 m) | The standard player boat; Boathouse level 1 |
| Petrel RIB | 4 | 14 m/s | 900 (tubes) | 15 min | very loud (300 m) | Boathouse level 3; fast and fragile |
| Gull Launch | 6 | 7 m/s | 1,600 | 30 min | loud | Boathouse level 4 (Tier 3); slow, armored with sheet steel |

### 16.2.2 Boat physics

Player boats are physics-simulated vehicles using the Water plugin's buoyancy component (pontoons at the corners, sampled against the ocean and flood volumes) and a custom movement component for thrust and steering: forward thrust from the engine at the stern (applied at the propeller position, below the waterline), rudder force proportional to forward speed and rudder angle, linear and angular drag (higher sideways drag than forward drag: boats don't slide sideways much), and waves pushing the hull through buoyancy.

Driving controls: W/S throttle (with gears: reverse, idle, slow, half, full; holding W ramps the throttle), A/D rudder, Space for the horn, F to exit. The driver can't shoot (except the Gull Launch has a pintle mount, Tier 3). Passengers can shoot from the boat (with a sway penalty from the boat's motion: sway ×1.5 at speed, ×1.2 idle).

Networking: physics-simulated vehicles in a listen-server game are a known pain. Use the server-authoritative physics with client-side prediction for the driver only through Chaos's networked physics (UE 5.4+ has "Networked Physics" with resimulation for physics-predicted objects; check what the installed engine version provides). If networked physics prediction isn't reliable enough, fall back to: server-authoritative simulation, the driver sends inputs, the server simulates and replicates the boat's state at 30 Hz, the driver's client does a lightweight local prediction of the boat's transform (simple integration of the replicated velocity plus local input) and smoothly corrects. Boats are slow and heavy, so 100 ms of input delay with smoothing feels acceptable on water. Record which approach you use in `DECISIONS.md` and test both at 150 ms latency.

### 16.2.3 Boat damage and sinking

Hull HP: when it reaches 0, the boat sinks over 20 s (taking on water, the stern dropping, then going under), and everyone has to swim. Partial damage creates leaks: below 50% hull HP, the boat takes on water (slower, lower in the water); below 25%, it slows to half speed. The engine can be hit separately (a weak point on the stern, 150 HP): a destroyed engine stops the boat (rowing is possible in the skiff, at 1.5 m/s). Repair: a Boat Repair Kit item (3 uses, 8 s each, +200 hull HP).

Fuel: boats burn fuel over driving time. Out of fuel, the engine stops. Fuel cans (part 12) refill 10 minutes of driving each (6 s to refuel).

### 16.2.4 Boat extraction

Driving your own boat out through the map boundary buoys (at any open water edge) extracts everyone aboard. That's the payoff for bringing a boat. To make it fair, the outer buoy line has a 6 s "leaving" timer during which the boat must stay outside the line, shown on the HUD. Boats can also be used to reach islets and the Teeth, and to escape flooded areas.

### 16.2.5 Boat theft and boat persistence

A squad's boat in the raid can be stolen by anyone: there's no key. If another squad drives it out, they extract with it, and it's theirs (it becomes an item in their Boathouse; boats are items with instance IDs). If the boat sinks, it's lost. If you extract without your boat, it's lost (it stays in the raid). Boats are expensive, so this matters.

Where squads bring their boat: at insertion, the squad's boat arrives with them (instead of a Halcyon boat, the squad leader's boat drops them off and is left moored at the insertion point). Only one boat per squad.

## 16.3 EXTRACTION TYPES (REFERENCE)

Part 03 defines the types. Here's how each works mechanically.

Boat (scheduled): 16.1.

Fixed: an extraction volume (cylinder, 6 m radius) marked in the world by a beacon (a battery-powered orange strobe on a pole and a painted marker, or a flare burning at night). Stand in it for 8 s continuously (any damage taken resets the timer; moving within the volume is allowed). The HUD shows a ring filling. At completion, the player is extracted (fade out with "EXTRACTED").

Conditional: a fixed or boat extraction that's only active when a condition is met, checked by a `USMExtractionCondition` object (data-driven). Conditions: pay Scrip (an interaction at the extraction: a smuggler NPC or a cashbox), have an item (a key, a flare: consumed or not), world state (a switch has been thrown somewhere: the winch power), phase (only during Calm/Lull), raid type (Night only), squad condition (all living squadmates present: used for the LISTENER helipad), no backpack (the cave route), or a signal (fire a flare of a specific color at the location).

## 16.4 THE EXTRACTION CATALOG

Times are raid time. "Window" is when it's active. Boat windows are the boat's arrival time ranges (seeded within the range).

| # | Name | Location | Type | Window | Condition | Notes |
|---|---|---|---|---|---|---|
| E1 | Ferry Ramp | Terminal linkspan, Harbourside | Boat (Gull) | Arrives 11:00 to 13:00 and 25:00 to 26:30 | none | Two boats per raid. The final boat at 25:00+ docks at the flooded ramp: you have to wade out through the yard. |
| E2 | Cannery Jetty | Cannery, Harbourside | Boat (Gull) | Arrives 8:00 to 10:00, or 18:00 to 20:00 (one of the two, seeded) | none | Very exposed to the chimney and the cold store roof. |
| E3 | Lifeboat Slipway | Lifeboat station | Boat (RIB) | Arrives 4 min after the winch is powered, any time after 15:00 | Winch powered with a Slipway Fuse (from the power station or the cannery engine room, inserted at the boathouse fuse box) | The RIB launches down the slipway, idles at the bottom for 60 s. |
| E4 | Breakwater Light | End of the east breakwater | Fixed | 0:00 to Surge 2 arrival | none | Closes when the waves start. A long, exposed walk. |
| E5 | Hilltop Flare | Signal from the Kirkhill graveyard, board at the East Shore Noust | Conditional boat (RIB) | Any time | Fire a red flare from inside the graveyard. 90 s later a Halcyon RIB arrives at the East Shore Noust (the beach below the hill's east side, 400 m away and downhill) and waits 60 s | You signal from the hill, then race down to the shore, and everyone on the map saw your flare. |
| E6 | Distillery Pier | North coast | Boat (Gull) | Arrives 14:00 to 16:30 | none | |
| E7 | Caravan Cliff Path | North coast, caravan park | Fixed | Calm and Lull phases only | none | A steep path down the cliff to a cove where a Halcyon dinghy is beached. |
| E8 | Peat Road Checkpoint | Northwest edge | Fixed | All raid | none | The far edge of the map. Safe-ish and far from loot. |
| E9 | Airfield Helipad | Airfield | Conditional fixed | Night raids: 18:00+; Standard: any time after a green flare fired on the pad (then 2 minutes later) | Night or green flare | A light helicopter lands for 45 s. Loud. |
| E10 | Gannet Rock Helipad | Gannet Rock | Fixed | All raid | none | Reachable by boat or a very long swim. |
| E11 | Kirk Holm Jetty | Kirk Holm | Boat (RIB) | Arrives 16:00 to 22:00 | none | Kirk Holm is cut off after Surge 1 except by boat or swimming the channel. |
| E12 | The Smuggler | One of three coves (seeded: West Cove below the hotel, Seal Cove on the north coast, the Noust on the east shore) | Conditional boat | Any time after 6:00 | Pay 7,500 Scrip (physical, in the raid) to the smuggler NPC at the cove | Nils's contact. Shown on the map only to players who have Nils loyalty 2+, otherwise found by exploring. |
| E13 | LISTENER Helipad | The Teeth | Conditional fixed | After Surge 2 | Use the Warden officer's radio code item at the helipad's radio, and all living squadmates present | Tier 2. A military helicopter, unknown allegiance (lore seed), takes you off. |

## 16.5 EXTRACTION RULES AND EDGE CASES

Extraction is per player, not per squad. A squad can split: one player extracts on a boat while others stay.

An extracting player can't be "pulled back". Once extracted, the character's actor is destroyed (after the fade), and the player is out.

Items dropped by an extracting player within the last 3 s before extraction stay in the world.

A downed player can't use fixed extractions (they can't stay in a volume without crawling, and the timer requires not being downed). On a boat, see part 03.

Extraction while bleeding: allowed. Status effects are cleared on extraction (the player is healed on the Halcyon; healing between raids is free in v1, a deliberate choice to keep the meta loop light).

The extraction timer and the final departure use the server's time; the client's banner is only a display.

## 16.6 EXTRACTION PRESENTATION

On extraction, the player sees:

1. The 3 s "leaving" moment (boat pulling away, helicopter lifting, a fade on the fixed extraction while the character walks out of frame).
2. A black screen with the word EXTRACTED in the title font, the raid time, and Sparks's line ("Good to have you back, salvager.").
3. The raid summary (part 24).

If the player was the host and other players remain, the summary screen shows the "still hosting" banner (part 03).

## 16.7 BOAT AND EXTRACTION ACCEPTANCE TESTS

A scripted boat arrives, waits and leaves on schedule on the server and all clients, with clients' boat positions within 0.3 m of the server's.

Players standing on a moving extraction boat don't slide off, jitter or fall through at 150 ms latency.

Everyone in the boarding volume at departure is extracted, and nobody outside it is.

A fixed extraction timer resets on damage.

A conditional extraction's condition is checked on the server and can't be satisfied by a client message alone.

Player boats: two players in a skiff at 150 ms latency can cross the harbor without either seeing a correction larger than 0.5 m.

Sinking a boat drops all passengers into the water and they can swim.

---

End of part 16. Next: `17_PROGRESSION_TRADERS_HALCYON.md`.
