# SALTMARROW: PART 28, AUDIO

In an extraction shooter, sound is half the game. You hear the creak upstairs, the click of a mag change behind a wall, the crack of a round passing over your head and the slap of its echo off the water a beat later, and you know what to do. This part specifies the audio system, every sound family, the propagation model, the music, and the mix. Build it with MetaSounds, Audio Modulation, Submixes and Unreal's spatialization, plus our own gameplay sound event layer.

Quality bar: Hunt: Showdown and Insurgency: Sandstorm for weapons and propagation. If the gun sounds don't make me want to fire them again, they aren't done.

---

## 28.1 TWO SOUND SYSTEMS: GAMEPLAY AND AUDIO

There are two separate things that people call "sound", and the code must keep them apart.

Gameplay sound events: facts about the world used by game logic: "a gunshot happened here with loudness radius 320 m", "a footstep happened here with radius 28 m". They drive AI hearing (part 13), the network relevancy of sound (part 18), and which clients get told about a sound at all. Implemented by `USMNoiseSubsystem` on the server: `ReportNoise(Location, Radius, Type, Instigator)`. The server sends noise events to the clients within the radius (after occlusion attenuation of the radius: each wall between source and listener, from one trace, halves it), as compact unreliable events, and those clients play the audio.

Audio: the actual sound that plays on a client, with spatialization, occlusion filtering and reverb, driven either by local events (my own gunshot, my footsteps) or by received noise events (someone else's). Everything about how it sounds is client-side.

Why it matters: a client must never be able to hear a sound that the gameplay system didn't send it. That's the audio half of the anti-wallhack rule.

## 28.2 THE ENGINE SETUP

MetaSounds for all non-trivial sounds (weapons, footsteps, ambience, music stingers, UI where variation helps). Sound Cues are fine for simple one-shots.

Audio Modulation plugin: Control Buses for volume categories (Master, Effects, Weapons, Footsteps, Voice, Music, UI, Ambience, Radio) mapped to the settings sliders, plus dynamic mix states (combat ducking, Surge, underwater, deafened by explosions, inventory open).

Submixes: `Master` ← `Game` (with sub-submixes: `Weapons`, `World`, `Characters`, `Ambience`) ← `Reverb sends` (`Reverb_Interior_Small`, `Reverb_Interior_Large`, `Reverb_Industrial`, `Reverb_Outdoor_Town`, `Reverb_Outdoor_Open`, `Reverb_Underwater`), `Voice` (VOIP), `Radio` (Sparks, squad voice processing), `Music`, `UI`. A limiter on the master. A loudness meter in dev builds.

Spatialization: Unreal's default spatializer for most sources, with an optional HRTF mode (Settings > Audio > Spatial: Stereo Speakers, Headphones (HRTF)) using a binaural spatialization plugin compatible with the installed engine (check what's available: the engine's built-in binaural option or the Steam Audio plugin). Default: Headphones mode off, with a first-launch prompt asking "Are you using headphones?" (most players are).

Concurrency: limits per sound family (e.g. max 24 simultaneous footstep voices, 16 distant gunshot voices, 6 per-weapon-mechanical voices) with priority by loudness and distance. Voices for the local player's own actions get top priority.

Attenuation: custom curves per family (part 28.4), with air absorption (high frequency loss with distance, stronger in rain and fog) and occlusion (28.6).

## 28.3 WEAPON AUDIO

### 28.3.1 The layer model

Every gunshot is assembled from layers, each a MetaSound input or a sub-graph:

1. Mechanics (close, under 15 m only): the action cycling (bolt carrier, slide, roller lock, piston), the trigger, the hammer, the buffer spring. Per weapon. This is what makes weapons feel like objects.

2. Transient (the crack): the sharp, loud attack of the shot. Per caliber class, with variants per weapon (barrel length changes its character: short barrels are harsher).

3. Body (the boom): the low-mid weight of the report. Per caliber.

4. Tail (the environment's response): the echo and reverb of the shot in its surroundings, chosen by the shooter's environment, not the listener's (a shot fired inside the cannery sounds like a shot in a big metal hall to everyone; for distant listeners it's the "distant indoor" tail). Tails per environment class: Interior Small (rooms), Interior Large (halls, the cannery, the church), Industrial (metal spaces), Town (streets with buildings: slapback echoes), Open (moor: a long rolling tail), Coastal (by the sea: a tail with a long, smooth decay and a watery character, our signature), Cliff (a distinct echo off the cliffs), Water (on a boat). The shooter's client determines the environment from an Audio Gameplay Volume or a quick probe (a few traces measuring openness: distances to walls in 6 directions and a ceiling check), and sends the class with the fire event (3 bits) so others play the same tail.

5. Distance layers: for listeners far away, the close layers fade out and distance-specific recordings fade in: Mid (50 to 200 m: the crack softens, the body gets thicker), Far (200 to 600 m: a thump and a long tail), Very Far (over 600 m: a dull pop and rumble). Crossfades by distance. That's the single biggest factor in shots sounding real at range, and it's what lets players judge distance by ear.

6. Suppressed: a separate set: a much quieter thud and "pfft", the mechanics become the loudest layer, plus the gas "tick" and the supersonic crack downrange (layer 7) when using supersonic ammo.

7. Supersonic crack (downrange, part 05): when a supersonic projectile passes within 3 m of a listener, they hear a sharp crack from the projectile's closest point (a separate event from the server to that client), and then the gunshot itself arrives later (delayed by distance/343 m/s). That "crack-thump" gap tells experienced players the distance. Subsonic rounds instead give a whiz (a short buzzy doppler sound) and a thud.

8. Mechanical extras: brass hitting the ground (per surface, part 27), magazine insertion and removal, charging handle, bolt release, selector switches, bolt actions, pump actions, lever actions, revolver cylinder clicks, shell insertion, belt feeding, bipod deployment, optic magnification clicks, zeroing clicks, light and laser switches. All per weapon or per part family, and heard by others within 12 m (reloads are a noise event, part 13).

9. First-person "sweetener": a little extra low-end and mechanical detail for the local player's own weapon only (it's in your hands), which makes your own gun feel powerful without making others' guns louder.

Sound speed: the gunshot from a distant shooter arrives after `distance / 343` seconds. Implement it by delaying the playback on the client by that amount (the noise event carries the shot's server time). Lightning thunder too (part 15).

### 28.3.2 Per-weapon sound design notes

Part 06 and 07 describe each weapon's character. Summary of the main families:

9mm pistols and SMGs: sharp, snappy, a little hollow. The Bilge Pump rattles.
.45: deeper, rounder, less crack.
5.56: a sharp crack with a springy AR mechanical layer.
5.45: snappier, with a nasty brake blast.
7.62x39: harsh, heavy, a mechanical clatter.
7.62x51: a big, punishing crack and a long echo.
7.62x54R: like 7.62x51, louder and ringier.
.338: the loudest thing in the game; a crushing boom with a 3 s echo.
12 gauge: deep, wide booms; pumps and breaks are signature mechanical sounds.
.45-70: a deep, old-fashioned boom with the lever clack.
Harpoon: a pneumatic thump and a zipping line.
40mm: a hollow "thoonk" launch.

### 28.3.3 Sourcing

Real weapon recordings are expensive. Use royalty-free libraries with commercial game licenses: the Sonniss GDC Game Audio Bundles (free, royalty-free, include weapon and foley recordings), and other libraries with clear game-use licenses. Check every license and record it in `CREDITS.md`. Process and layer them in MetaSounds; build each weapon's sound from layers rather than one recording, so there's variation (pick from 4 to 8 variants per layer, randomized pitch ±3%, volume ±1.5 dB).

## 28.4 ATTENUATION AND LOUDNESS RADII

The audio attenuation curves match the gameplay radii from parts 04, 05 and 06 so that what you can hear matches what the AI can hear. Gameplay radius is where the sound becomes inaudible; the curve is logarithmic-ish so sounds fade naturally.

| Family | Gameplay radius | Notes |
|---|---|---|
| Unsuppressed rifle | 320 to 450 m | Distance layers to 1,200 m for "very far" (beyond gameplay radius it's ambient: the noise event isn't sent, but a generic "distant gunfire" ambience can play on all clients for shots over 600 m away, without position: a world flavor that reveals nothing) |
| Unsuppressed pistol | 150 to 220 m | |
| Suppressed rifle (supersonic) | 120 to 180 m | Plus the downrange crack |
| Suppressed rifle (subsonic) | 30 to 60 m | |
| Shotgun | 290 to 310 m | |
| Explosion | whole map | |
| Footsteps | 6 to 45 m (part 04) | |
| Reload | 12 m | |
| Looting a container | 10 m | |
| Door open (normal / slow / kicked) | 15 / 5 / 25 m | |
| Glass break | 30 m | |
| Voice (proximity) | 40 m | VOIP |
| Hollow vocalizations | 25 to 60 m | Wailer screams 120 m |
| Boat engine | 220 to 300 m | |
| Church bell | whole map | |

## 28.5 FOOTSTEPS AND FOLEY

Footsteps: MetaSound per surface (15 surfaces, part 04), with layers for heel and toe, gait variants (walk, jog, sprint, crouch walk), shoe type (boots by default; the footwear cosmetic changes the sound slightly: wellies squelch, trainers are softer, but within the same loudness: cosmetics never change gameplay loudness), weight bracket (heavier steps when Overloaded), and wetness (squelch when Soaked). 6 to 10 variants per surface per gait. Scuffs on turns and stops. Ladder steps (metal rungs, wooden rungs). Water steps (splash per depth).

Gear foley: cloth rustle on movement (per jacket material: oilskin crinkle, wool soft, waterproofs swish), gear rattle (armor creak, rig and pouch rattles, backpack straps, slung weapons tapping), and per-action foley (crouch, prone transitions, mantles: hands on stone or metal, vaults, landing thuds).

Heavy breathing: when exhausted (audible within 12 m) and when sprinting (only to yourself, unless exhausted).

## 28.6 OCCLUSION, OBSTRUCTION AND PROPAGATION

The model, per audible sound on the client:

1. Direct path test: a line trace from the listener (camera, or the character's head in first person) to the source, against an "audio" collision channel (walls, floors, large props; not foliage, not small props, not characters). If clear: no occlusion.

2. If blocked: count the walls (up to 3, with multi-hit traces) and look at their audio materials (thin wood, plaster, glass, brick, concrete, metal). Each wall applies a low-pass filter and attenuation by material (wood: -6 dB, LPF 2.5 kHz; brick: -14 dB, LPF 800 Hz; concrete: -18 dB, LPF 500 Hz; glass: -4 dB, LPF 4 kHz).

3. Portal propagation (for interiors): if the source is in a building and the listener isn't (or vice versa), find the nearest opening (doors, windows, holes; these are marked with `USMAudioPortalComponent`s on the building's openings, open state from door actors) and play the sound from the opening's position with a reduced occlusion, plus a quieter occluded direct path. That makes "the sound comes out of that window" work, which is how players locate someone in a building. Precompute building-to-portal mappings at map build time. Only for important sounds (gunshots, footsteps within 20 m, voices).

4. Distance and air absorption.

5. Reverb: the listener's environment sets the reverb send (Audio Gameplay Volumes per room type and per outdoor area), and the source's environment sets the gunshot tail (28.3.1).

Performance: occlusion traces are throttled (each source re-traces every 0.1 to 0.3 s depending on loudness and distance; footsteps under 10 m every 0.1 s) and batched as async traces. Budget: under 0.4 ms of game thread for audio occlusion at peak.

Underwater: when the listener's head is underwater, all non-underwater sounds are heavily low-passed (300 Hz) and attenuated, with an underwater ambience bed (muffled pressure, bubbles, distant thrums). Sounds underwater (Drowners, harpoon shots, bubbles) play clearly.

## 28.7 HEARING AND HEADSETS

Hearing protection and amplification (part 11): headsets apply a Control Bus mix: amplify quiet sounds (footsteps, foley, voices, reloads) by their amplification value, compress loud sounds (gunshots, explosions) to protect hearing, and add a subtle electronic color (a slight band-pass and a noise floor hiss at very low level for cheap headsets). Without a headset, gunshots at close range cause temporary hearing loss: tinnitus (a ringing tone fading over 3 to 8 s) and a dip in overall volume, scaled by loudness and proximity. Helmets with ear coverage and no headset muffle everything (-25% to -60%, from part 11).

Flashbangs and close explosions: deafened state (high pitch ringing, all other sounds dropped by -30 dB and recovering over 4 to 8 s).

## 28.8 VOICE AND RADIO PROCESSING

Squad voice: a radio effect on the incoming VOIP stream (band-pass 300 Hz to 3.4 kHz, light saturation, a short squelch click at start and end of transmission, a faint static bed), routed to the Radio submix. Distance doesn't matter. A setting can turn the radio effect off for clarity.

Proximity voice: no radio effect, spatialized at the speaker's head, with occlusion (the same model as 28.6), and distance attenuation to 40 m. When a squadmate is in proximity range and talking, you hear both the radio version and the proximity version; duck the radio version by -12 dB when the speaker is within 10 m and visible, so it doesn't sound doubled.

Sparks (radio broadcasts): processed like squad radio but with a warmer, "broadcast" AM radio color, heard by everyone, never spatialized, ducking other sounds slightly (-3 dB) while she talks. Her lines: since there's no voice actor in v1, Sparks's broadcasts are shown as subtitles with a radio static and squelch sound, and a short radio "chirp" melody unique to each message type (Surge warning, boat call, salt bloom, boss hint, last boat). If you can find a good royalty-free radio voice sample set, don't use TTS: a well-designed static-and-chirp system with subtitles is better than robotic speech.

## 28.9 AMBIENCE

The world must never be silent. Ambience is layered beds plus spot emitters:

Beds by zone (Audio Gameplay Volumes or zone-based selection): Harbour (water slapping on hulls and the quay, creaking ropes and masts, gulls, distant foghorn, rigging clinking), Town (wind in streets, a loose shutter banging, distant sheep (there are no dogs left on the island), a creaking sign, dripping), Moor (wind over heather, curlews and skylarks in calm weather, sheep, the wind turbines' whoosh near them), Coast and cliffs (waves breaking, surf roar, seabirds, wind), Interiors (room tone by building type: house creaks and ticking clocks (stopped clocks are creepy; one ticking clock in a whole town is creepier), cannery hum of a refrigeration unit still running on the power station's electricity, hospital buzzing lights, church: deep silence with drips and a faint wind in the tower), Underground (drips, pipes, distant rumbles), LISTENER (electronic hum, the array's faint pulsing tone underground).

Weather layers on top: rain (by intensity, on different surfaces: rain on roofs when indoors, on the sea, on metal, on your hood and helmet: a close rain-on-gear layer when outdoors), wind (by speed, with gusts and whistles around buildings), thunder (with distance delay and a deep rumble, part 15), the Surge (a rising roar of wind and sea as the front approaches; at the front, an overwhelming wall of sound; the final Surge adds the low drone of the Marrow, a sub-bass tone at about 40 Hz with harmonics, slowly pulsing with `LanternPulse`, felt as much as heard).

Spot emitters: placed in the level: dripping pipes, flapping tarps, banging doors (on wind), electrical hum near panels, a radio playing static in a house, the cannery's dripping fish, a windchime in a garden (one, creepy), boats knocking against the quay, bell buoys in the harbor mouth (a lovely, sad sound).

Hollow sounds: wet clicking, gurgling, low humming (Idle), sharp rasping inhale before attacks, the Wailer's scream (a horrible, unforgettable sound, with a 1.2 s build), Bloats' gurgling stomach, Crawlers' scraping, Brutes' heavy breathing and footfalls, Drowners' bubbling beneath the surface. All positioned, occluded and audible to players in their radii. Readability: each Hollow type must be identifiable by sound alone.

Wardens: voice lines (part 13), radio chatter, equipment foley.

## 28.10 MUSIC

Music is sparse in raid and warm in the Halcyon.

In-raid: no continuous music. Stingers only, through Quartz for musical timing (so stingers land on the beat of the ambient drone when it's playing): raid start (a low, short motif on cello and drone, 6 s), Surge warning (a rising string swell under the wind, 8 s), the Surge drone (a continuous, evolving drone during storm peaks: low strings, processed choir, sub-bass; it's ambient, not melodic), extraction available (a short, hopeful motif when an extraction you're near becomes available), extracting (a quiet pulse during the final 8 s), extracted (a resolving chord), downed (a muffled heartbeat and a dark low note), death (a single sustained low note fading out), boss encounter (the Ferryman: a slow, heavy sea shanty rhythm on low drums and a bowed saw; the Choir: their own song, diegetic, five voices in an unsettling cluster chord that resolves only when the last singer dies).

Halcyon: a small set of tracks in a folk-ambient style (fiddle, cello, low whistle, harmonium, guitar, ambient drones) that play in the menu scene: a main theme (the "Halcyon theme", melancholy and warm), a gunsmith track (calmer, with a ticking clock texture), a trader track variant per trader (the Captain: hymn-like harmonium; Tomasz: a jazzy upright bass and brushed drums (he plays jazz on his radio); Agnes: a sparse, eerie solo cello; Nils: a sly fiddle reel), and the Spindrift bar's jukebox (8 short tracks in a pub folk style, diegetic, Tier 3).

Main menu title theme: begins quiet and builds into the Surge drone when idle for 60 s, then resolves back.

Sourcing: commission or create original music, or use royalty-free music with clear game licenses. No copyrighted music. If you can't produce good music, ship with fewer, better tracks: four excellent tracks beat twelve mediocre ones. Record every music license in `CREDITS.md`.

## 28.11 THE MIX

Loudness target: integrated loudness around -18 LUFS for typical gameplay, true peak under -1 dBTP, measured over a 10-minute capture of a representative raid.

Priorities (from highest): the local player's gunfire and hit feedback, incoming fire (cracks, near misses), squad voice, nearby footsteps and foley (gameplay-critical), nearby enemy weapons, Hollow vocalizations near you, extraction cues and Sparks, explosions, distant gunfire, ambience, music.

Dynamic mix states (Audio Modulation mix states):

Combat: when firing or being shot at, duck ambience by -4 dB and music by -6 dB for 10 s.
Surge: raise wind and rain, reduce footstep audibility (gameplay already shrinks their radii), keep weapons and voices clear.
Inventory open: duck the world by -3 dB and add a slight low-pass (you're focused on your bag), but keep footsteps and gunshots clear (danger awareness).
Deafened: part 28.7.
Underwater: part 28.6.
Menu: the world bed of the Halcyon, music, UI.

Settings (part 34): Master, Effects, Weapons, Footsteps, Voice (squad, proximity), Radio (Sparks), Music (in raid stingers, menu music separately), UI, Ambience, plus dynamic range (Wide: cinematic; Medium; Narrow: night mode, compressing loud and quiet together, good for low volume and for hearing footsteps), the HRTF toggle, the "mono audio" accessibility option, and subtitles.

## 28.12 AUDIO ACCEPTANCE TESTS

Distance test: a rifle shot heard at 25, 100, 300 and 800 m in the combat test map has the correct layers and delay (verified by recording and by the layer debug view).

Occlusion test: a footstep behind a brick wall is heard filtered, through an open door it comes from the door, and with the door closed it's quieter.

Gameplay/audio parity: no client plays a positioned sound from another player without having received a noise event for it (a debug check in development builds asserts that every positioned audio source for a remote player has a matching event).

Every surface has footsteps for every gait.

Mix: the loudness target holds in a captured raid.

The audio game thread cost stays within budget at peak.

---

End of part 28. Next: `29_ANIMATION.md`.
