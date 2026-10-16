# SALTMARROW: PART 46, NARRATIVE: DIALOGUE, RADIO AND ITEM DESCRIPTIONS

The lines that give the world its voice: trader dialogue, Sparks's radio broadcasts, Warden callouts and chatter, and the item descriptions. Put them in string tables (`ST_Trader_Captain`, `ST_Sparks`, `ST_Warden_A`, `ST_Items`), with keys matching the IDs below, so they're localizable and swappable.

---

## 46.1 TRADER DIALOGUE

Each trader has lines for: Greeting (first visit of the session), Greeting after a successful raid, Greeting after a death, Purchase (small), Purchase (big, over 100k), Sale (small), Sale (big), Contract offered, Contract accepted, Contract completed, Loyalty up, Idle (shown after 20 s on their page), and Farewell. Two to four variants each, picked at random without repeating the last.

### 46.1.1 The Captain

Greeting: "Salvager." / "Back again." / "Make it quick, I've a council meeting." / "Morning. Or whatever it is."
After a successful raid: "Back in one piece. Good. Show me what you found." / "You came home. That's the job." / "Someone's mother will sleep tonight. Probably yours."
After a death: "I heard. You're lucky you weren't wearing anything worth crying over." / "Gear can be replaced. Get some rest first." / "We lose things out there. Today it was your things. Better than you."
Purchase (small): "Sensible." / "That'll keep you alive. Use it before you need it."
Purchase (big): "That's a lot of Scrip. Make sure you come back to spend more." / "I hope that's armor, not pride."
Sale (small): "We'll find a use for it." / "Every tin counts."
Sale (big): "That's a good haul. The council thanks you, grudgingly." / "Where did you find all this? No. Don't tell me."
Contract offered: "I've something that needs doing." / "Have a look at this. Don't say yes too quickly."
Contract accepted: "Good. Come back with it." / "Thank you. Don't be a hero about it."
Contract completed: "That's done. That matters more than you know." / "You've earned this. Take it before I change my mind."
Loyalty up: "You've been good to this ship. The council's noticed. I've noticed." / "I'm opening the good stores to you. Don't make me regret it."
Idle: "Don't sell everything to Nils. He's not your friend." / "I've buried a lot of people your age. Don't make me do it again." / "Check your bandages before you check your gun." / "The tide's turning early this week. Agnes is worried. I'm not. I'm busy."
Farewell: "Mind the water." / "Come back." / "Go on, then."

### 46.1.2 Tomasz

Greeting: "Ah! Customer." / "You again. Good. I have parts." / "Don't touch the vise. Hello." / "Come, come, look at this barrel first."
After a successful raid: "You're alive. Your gun is alive? Let me see the gun." / "Good! Now, the important question: what did you shoot it with?"
After a death: "They took your rifle? Which one? The Mako? With my trigger? Barbarians." / "You lost the gun. You'll build a better one. This is how it works."
Purchase (small): "Good choice. Mostly." / "That one's fine. Fine is underrated."
Purchase (big): "Now we're talking. Now we're really talking." / "You'll love it. If you don't love it, you're wrong."
Sale (small): "I'll take it. Somebody will want it. Somebody with poor taste."
Sale (big): "Where did you find this? No, tell me. Tell me everything. Where. How many. Was there more."
Contract offered: "I have a job for someone who knows the difference between a gas block and a flash hider. That's you. Probably." / "Listen. This is important. To me."
Contract accepted: "Wonderful. Don't break it." / "Go. Go! And bring me the springs."
Contract completed: "You did it. I'm almost proud. I'm completely proud." / "This is excellent. You should be a gunsmith. No, you shouldn't. You'd be my competition."
Loyalty up: "For you, now, the good shelf. The very good shelf. Don't tell Nils what's on it." / "We're friends now. Friends get discounts. Small ones."
Idle: "No, no, no. You don't put a compensator on a nine millimeter carbine. Why would you do this. Who taught you." / "A Harrow with clean glass, I'd pay a price that would make you cry." / "Jazz is the only music that understands gas pistons." / "Every gun is a compromise. The art is choosing what to lose."
Farewell: "Clean your rifle." / "Bring it back in one piece. The rifle. You also." / "Go with God, and with a spare magazine."

### 46.1.3 Mother Agnes

Greeting: "Sit, sit." / "Ah, there you are. I was thinking about you." / "Come in. Mind the jars." / "Peace be with you. And on you, I suppose."
After a successful raid: "Tell me what you saw out there. Did they hum? Did you hear them hum?" / "You brought yourself back. That's the only thing I'll ever really ask."
After a death: "I'm glad it was only your things." / "Rest. The salt will still be there tomorrow. Unfortunately."
Purchase (small): "Use it well." / "That one's gentle. Mostly."
Purchase (big): "These tinctures aren't sweets. Go carefully with them." / "I make these with my hands and with prayer. Don't waste either."
Sale (small): "Thank you, dear."
Sale (big, salt): "This salt is warm. Feel it. It shouldn't be warm." / "So much of it. Where was the water when you found this? No, I can guess."
Contract offered: "I have a question I can't answer from this room." / "Would you do something for me? It might be frightening. It might be nothing."
Contract accepted: "God keep you." / "Thank you. Come back and tell me everything."
Contract completed: "Yes. Yes, that's what I thought. Oh, I wish I'd been wrong." / "You've given me another piece. I don't know what the picture is yet."
Loyalty up: "I trust you now. That's not a small thing for me anymore." / "You may see my notes. Don't read them all at once."
Idle: "The ones who come out of the water were someone's children once. I don't ask you to spare them. I ask you to remember it." / "There's a station on the Teeth. I think the answer is in it. I think I'm afraid of the answer." / "Salt's always cold. Except when it isn't." / "I used to preach about the sea giving up its dead. I wasn't ready for it to happen."
Farewell: "Go in peace. Come back in one piece." / "I'll light a candle." / "Listen for the hum."

### 46.1.4 Nils

Greeting: "My friend! Come in, come in, don't touch the red one." / "Ah, my favorite customer. Today." / "Welcome to the engine room. Mind the oil. Mind me." / "You look rich. You look richer than yesterday. What happened?"
After a successful raid: "You made it! Everyone always says you won't, and look. Business." / "Survivors are my favorite people. They come back and spend money."
After a death: "Unlucky. Very unlucky. I have just the thing to change your luck. It's expensive." / "Dead and back again. That's twice you've cost somebody money. Not me, I hope."
Purchase (small): "A modest purchase. I respect modesty. I don't understand it." / "Thank you, come again, preferably with more Scrip."
Purchase (big): "Now THAT is a purchase. Champagne? I have no champagne. I have diesel." / "You will not regret this. If you regret it, there's no refunds."
Sale (small): "Ah, junk. I love junk. Junk is just treasure that hasn't met the right buyer."
Sale (big): "Everything has a price. Even you. Especially you, actually." / "Oh, you've been busy. And somebody has been very unlucky."
Contract offered: "I have a little errand. Very little. Mostly legal." / "You want to make some money? Of course you do. Everyone does. Some people do it with style."
Contract accepted: "Wonderful. Remember: I never asked you to do this." / "Good. And don't tell the Captain. She worries."
Contract completed: "Perfect. Beautiful. Here's your money and a little extra for your silence." / "You are a professional. I say that to very few people. Most of them are dead."
Loyalty up: "For you, now, the lockers. The red one too. Don't touch the red one." / "You're one of the family now. My family is very small and very rich."
Idle: "The Captain thinks I'm a bad influence. The Captain is correct." / "You want military grade? I have military grade. You want to know where it came from? You do not." / "Fuel prices go up when the storms come. It's not personal. It's weather." / "I'm not a criminal. I'm an entrepreneur in a jurisdiction that doesn't exist."
Farewell: "Ha det bra!" / "Come back richer." / "Don't die, it's bad for repeat business."

## 46.2 SPARKS (RADIO HALCYON)

Broadcast categories and lines. In v1 these show as subtitles with radio static and a chirp (part 28.8). The tone: quick, wry, warm underneath. Never more than two sentences.

Raid start (one per raid, by weather):
"Morning, crews. Good visibility, wind west at twenty knots, pressure's holding for now. Forecast says I don't know anything. Have a nice day."
"Afternoon, salvagers. It's damp. It's always damp. Go get rich."
"Fog's in thick off the harbor. You won't see them coming. They won't see you either. Fair's fair."
"Bright one today. Snipers love a bright day. Keep your heads down and your scopes covered."
"Drizzle. The kind that gets in your socks. Welcome to Saltmarrow."
"Night shift, crews. It's dark out there. That's it. That's the broadcast."

Surge warning (by wave):
"Halcyon to all crews. Pressure's dropping fast to the {direction}. Surge in {minutes} minutes. You know what that means. Move."
"Sky's turning over to the {direction}. Wave one's coming. Low ground first, then the rest."
"Second wave's building. It's a big one. Get your feet somewhere high."
"This is the big one. I'm not joking. Get to a boat or get to the hill."
"Barometer just did something I've never seen it do. Final Surge. Good luck."

Surge arrival:
"It's here. Hold on to something."
"Water's coming over the sea wall. If you're on the quay, you're swimming."
"They're coming up out of the harbor. Lots of them. Don't stop to count."

Lull:
"It's easing. Salt'll be out on the high-water line now. So will everyone else."
"Breathe. You've got a few minutes. Use them."

Boat calls:
"Gull's coming into the {extraction}. Two minutes."
"Boat's waiting at the {extraction}. Ninety seconds. Don't make the nice man wait."
"Thirty seconds at the {extraction}. He will leave. He always leaves."
"That's the last boat out of the {extraction}. Anyone still on the island after this, it's been nice knowing you."
"RIB's on its way to the {extraction}. Somebody fired a flare. Was it you? Run."

Events:
"Salt's lit up on the {zone} shore. Big batch. Every crew on the map heard me say that, by the way."
"Somebody's having a party at the {poi}. I can hear it from here. Stay safe, kids."
"Flare up over the {zone}. Not one of ours. Could be someone in trouble. Could be someone making trouble."
"Lights just went out all over town. The Wardens have blown a fuse, or they've done it on purpose. Either way, it's dark."
"The lighthouse just came on by itself. Cormac's still looking out for us. Don't stand in the beam."
"Gulls just went up over the {zone}. Something spooked them. Probably you."
"Somebody's ringing the church bell. In a storm. On purpose. I've got so many questions."

Boss hints:
"Fog's thick round the harbor mouth. Old-timers would say the Ferryman's working tonight."
"Wardens on the Teeth are screaming on their radios about singing. I don't want to know."

Leviathan fired:
"Somebody's brought the big gun. I'd stay indoors."

Raid end calls:
"Two minutes to the end of the window. If you're not on a boat, you're making a choice."
"That's it. Anyone left out there is the island's now."

Extraction (to the extracting player):
"Good to have you back, salvager."
"Welcome home. Kettle's on."
"You made it. Go tell the Captain before she starts worrying out loud."

Death (to the squad, when a squadmate dies; squad radio only):
"Lost signal on {callsign}. I'm sorry."
"{callsign}'s gone quiet. Keep moving."

## 46.3 WARDEN VOICE LINES (ONE SET; WRITE THREE)

Idle chatter (two Wardens near each other, at most once every 45 s per patrol):
"You hear from the Mainland?" "Course not."
"Kemp says the pay's coming next month." "Kemp said that last month."
"My socks haven't been dry since Year Three."
"Those Halcyon lot think we're the bad guys." "We shoot them." "Well. Yeah."
"Did you hear the singing last night? Under the station?" "Don't."
"I used to work the bar at the Kittiwake. Now look at me."
"Generator three's shaking again." "Don't run three."
"Saw a seal on the rocks. Thought it was one of them. Nearly shot it."
"When this is over, I'm going somewhere dry. Spain. The desert. Anywhere."
"It's not over. It's never over. That's the job."

Patrol and alert:
"Something moved by the {poi}." / "Hold up. Hear that?" / "Check the corners." / "Two on me, two on the road." / "Eyes up, it's getting dark."

Contact:
"Contact! {direction}!" / "Salvager! In the {poi}!" / "Movement on the roof!" / "I've got eyes on two of them!" / "Shots! They're shooting from the water!"

Combat:
"Changing mag!" / "Cover me!" / "Moving left, cover me!" / "Flank them, go!" / "Keep their heads down!" / "Frag out!" / "Smoke! Smoke!" / "I'm hit!" / "Man down! {name} is down!" / "Medic!" / "I'm patching him, cover us!" / "Push now, they're hurt!" / "Fall back! Fall back to the {place}!" / "Calling it in. Reinforcements in two." / "They've got armor, use the good rounds!"

Hollows:
"Drowned on the left!" / "Jesus, there's dozens of them!" / "Don't let them grab you!" / "It's a big one! Aim for the crystals!" / "Wailer! Kill it before it screams!" / "They're coming out of the water!"

Victory:
"Clear." / "Salvager down." / "Check the body. Take the good stuff." / "That's one less."

Names for the Wardens' callouts: Davies, Ross, Kemp, Linklater, Harcus, Spence, Drever, Rendall, Moar, Scott, Bain, Wylie.

## 46.4 ITEM DESCRIPTIONS

Every item needs one. Here's a full set for the items in parts 11 and 12 (weapons are in parts 06 and 07). Keep each under 45 words.

### 46.4.1 Medical

Field Dressing: "From the lifeboat station's stores. The wrapper's dated two years before the Surge. Still sterile, probably."
Army Bandage: "Thick, olive, and twice as long as you need. The Wardens get these by the crate. You get this one."
Tourniquet: "Windlass, strap, and a white tab where you write the time. Write the time. The surgeon will want to know."
Hemostatic Gauze: "Packed into a wound, it stops bleeding nothing else will. It also hurts more than anything else will."
SAM-type Splint: "A roll of foam-covered aluminum that bends into whatever shape your leg used to be."
Aluminum Splint: "A proper hospital splint, reusable, light. Somebody took this from St. Columba's and never brought it back."
Individual First Aid Kit: "A belt pouch of dressings, tape and a small miracle. The Halcyon issues one to every crew. Everyone uses theirs in the first ten minutes."
Car First Aid Kit: "From a glovebox on the ferry queue. Plasters, a foil blanket, a whistle. Better than nothing, which is the alternative."
Lifeboat Trauma Kit: "The kit the lifeboat crew carried to wrecks. Enough to keep a person alive for an hour. Use it to keep yourself alive for ten minutes."
Surgical Kit: "Clamps, sutures, a scalpel and a laminated card titled 'IF THERE IS NO DOCTOR'. There is no doctor."
Field Surgery Pouch: "A smaller, angrier surgical kit. For when you've got one chance and shaking hands."
Painkillers: "Co-codamol from Fraser's Pharmacy. Take two. Pretend your leg is fine. Your leg is not fine."
Morphine Auto-Injector: "Military. Press it to your thigh and the world gets soft at the edges. Don't do it twice."
Antibiotics: "Amoxicillin, in date, barely. On the Halcyon, these are worth more than bullets."
Insulin Vials: "Cold, careful glass. Someone on deck five needs these more than you need anything."
Mother's Salt Salve: "A tin of something grey and faintly warm. Agnes won't say what's in it. It works. That's what worries her."
Chemical Hand Warmers: "Shake, wait, feel your fingers again. A pack of two from the chandlery."
Emergency Foil Blanket: "Crinkly, shiny, ridiculous. Stops you dying of cold. Also makes you visible from space."

### 46.4.2 Stimulants

Adrenaline Shot: "The heart says go. The body says later. Later comes very quickly."
Steady: "A beta blocker from the hospital. Your hands stop shaking. So does a lot else."
Second Wind: "VMW military stimulant. You'll run like you're nineteen. You'll feel like you're ninety afterward."
Clotting Agent: "Your blood thickens like custard. Nothing leaks. You'll be thirsty for a week."
Tide Draught: "Mother Agnes's tincture. Pale, cloudy, warm in the vial. The drowned look through you like you're one of them. For a while."
Deep Breath: "Another of Agnes's. You can hold your breath for a very long time. Your lips go blue anyway."
Clarity: "Agnes calls it Clarity. The salvagers call it the Shimmer. For a minute, you can feel where everyone is. Then the headache comes."
VMW Grom Combat Stim: "A stim that makes bullets feel like suggestions. Wardens take it before they storm buildings. They shake for an hour after."

### 46.4.3 Food and drink

Water Bottle: "A plastic bottle of water from the Halcyon's desalinator. Tastes of the bottle. Tastes of being alive."
Canteen: "Dented aluminum with a felt cover. Three good drinks or one desperate one."
Tide Cola: "The island's own cola, a bit flat, very sweet. Ninety-percent sugar, ten-percent nostalgia."
Kittiwake Lager: "Warm, flat, and older than some salvagers. It'll warm you up and make your hands wobble."
Saltmarrow 12 Year Single Malt: "Peat, sea spray and toffee. The island's only famous export. Drinking it is a crime against Nils's profit margin."
Haldane's Finest Kippers: "The cannery's best, in a tin with a smiling fisherman on it. He has not been smiling for nine years."
Lowrie's Tinned Peaches: "Syrup and fruit. The best thing you'll eat this week."
Instant Soup: "Just add hot water. You have no hot water. Eat the powder. It's still soup, in principle."
Ship's Biscuit: "Hard enough to stop a 9mm round. Not tested. Probably."
Thermos of Tea: "The Captain makes every new salvager a flask. It's strong enough to strip paint. Drink it anyway."

### 46.4.4 Valuables

Wedding Ring: "A plain gold band. Engraved inside: 'Always'. It wasn't."
Gold Chain: "Heavy, real, and still clasped. Whoever wore it didn't have time to take it off."
Pocket Watch: "Silver, stopped at 22:40. Every watch on this island stopped at 22:40."
Wad of Mainland Notes: "Pre-Surge money, damp and stuck together. The Mainland still takes it. The Halcyon pays a fraction."
Old Coin Collection: "Pennies, shillings and a Viking-era silver piece, in a velvet tray from the heritage centre."
Silver Communion Cup: "From St. Brendan's. Agnes will know where it came from. She'll pretend she doesn't."
Ship in a Bottle: "Somebody spent a winter building this. Somebody else will spend Scrip buying it."
Brass Ship's Bell: "A bell from a boat that doesn't exist anymore. It still rings beautifully. Don't ring it."
Ship's Chronometer: "From the Orla Brae's bridge. Still keeping time, perfectly, for a ship that's going nowhere."
Painting (small seascape): "Oil on board. Saltmarrow harbor in better weather. The kind of weather nobody alive has seen in years."
The Laird's Portrait: "A Haldane in tweed, glaring down at everyone who's ever been poor. A beautiful gilt frame. Heavy. Very heavy."
Saltmarrow 25 Year (the Founder's Cask): "Bottled from the cask filled in 1898. Never sold. Never tasted. Never, until today, carried out of the distillery in a salvager's backpack."
Military Encrypted Tablet: "A rugged tablet with the Ministry's crest. Locked. Somebody on the Mainland wants what's on it badly."
LANTERN Hard Drive: "A grey drive in a padded case, labelled LNT/ARCHIVE/3. Agnes will want it. So will people she doesn't want to meet."
Lighthouse Lens Prism: "A glass prism from the Gannet Rock lamp. It throws rainbows on the inside of your bag."
Antique Sextant: "For finding your way by the stars. The stars haven't been out much lately."
Fishing Trophy: "BIGGEST COD 1989, P. LEASK. Peter's dad, probably. Heavy and sad."
Gold Tooth: "Prised from a Hollow's jaw. Don't think about it."

### 46.4.5 Salt

Marrow Salt Grains: "A pouch of pale grains, swept off a windowsill after the water went down. Warm to the touch, just. Most salt isn't."
Marrow Salt Shard: "A finger of crystal, faintly luminous in the dark. Mother Agnes pays for these. The Mainland pays more."
Marrow Salt Cluster: "A knuckle of pale crystal that glows like a dying coal when you cup it in your hands. It's warm. Ordinary salt is never warm."
Marrow Salt Geode: "A rough stone that opens into crystal, glowing from inside. It's heavier than it should be. It hums when you hold it to your ear."
Heart of the Tide: "A mass of living crystal the size of a child's head, pulsing with light, warm as skin. Everything that drowned on this island seems to want it back."

### 46.4.6 Barter (a selection; write the rest in the same voice)

Car Battery: "Heavy, mostly dead, completely essential. The Halcyon runs on a thousand of these."
Fuel Can: "Red, dented, half full of diesel. Don't shoot it. Don't let anyone else shoot it."
Copper Wire: "A coil stripped from a wall. Everything electrical on the Halcyon was a wall once."
Circuit Board: "Green, gold, and pulled from something that used to beep. Sparks can always use these."
Radio Valve: "A glass valve from an old radio set. Fragile. Warm when it works. Like salt, Sparks says, but not creepy."
Electric Motor: "Out of a washing machine, or a fan, or a fishing winch. Turns. That's all anyone asks."
Duct Tape: "Holds the Halcyon together. Holds most of the salvagers together too."
Bolts: "A jar of assorted bolts, sorted by nobody."
Steel Plate: "A sheet of good steel. The Locksmith wants it. So does everyone else."
Gun Oil: "A small bottle of light oil. Tomasz uses it on guns. Nils uses it on hinges. Agnes uses it on her knees."
Weapon Parts: "Pins, springs, extractors, in a tobacco tin. Tomasz will know what they are."
Optics Glass: "Lenses from binoculars, cameras, a telescope. Handle by the edges."
Salt-Etched Metal: "Steel that sat in Surge water and came out patterned like frost. It's harder than it was. Nobody knows why."
Sea Glass: "A smooth pebble of green glass from the beach. Pretty. Worthless. Nils will buy it anyway, for his 'niece'."

### 46.4.7 Gear (a selection)

Ferry Crew Hi-Vis Vest: "A padded hi-vis vest from the Halcyon's deck crew. It stops a knife. It doesn't stop being bright yellow."
Saltmarrow Police Stab Vest: "Built for Saturday nights at the Kittiwake, not for this. Better than a jumper."
Lifeboat Crew Flotation Armor: "Light armor sewn into a lifejacket. It floats. You float. That's the whole idea."
CDS Low-Vis Plate Carrier: "Thin plates, low profile, the listening station guards' choice. Comfortable until it isn't."
Warden Cuirass: "Steel plates bolted to a canvas harness, white chevron painted on the chest. It creaks. It stops rifle rounds. It creaks."
LANTERN Response Armor: "Matte grey, unmarked, impossibly light. LANTERN's response team wore this. It didn't help them."
Cannery Hard Hat: "Yellow plastic, a Haldane & Sons sticker, and a crack across the top that tells a story."
CDS High-Cut Ballistic Helmet: "Rails on the sides, a mount on the front, room for a headset. The listening station spared no expense, except on the guards."
Warden Sallet: "A steel helmet welded together from a car door and spite. You can't hear much in it. You don't die much in it either."
Commercial Diving Helmet: "Brass and glass. You'll breathe underwater. You'll see about as well as a goldfish in a jar."
Salvager's Belt: "A belt with a couple of pouches. Everyone starts with one. Most people end with one."
Fishing Vest: "A dozen pockets, most of them for flies. Now they're for bullets."
CDS Chest Rig: "Six magazine pouches across the chest. Run with it full and you sound like a cutlery drawer."
Medic's Bandolier: "Red cross on the strap, pouches for kits. Wardens will shoot you first. Your squad will love you."
Tidewater Daypack: "A hiking pack from the outdoor shop on the high street. Twenty litres of good intentions."
Fisherman's Kit Bag: "Rubberized, stinks of bait, completely waterproof. Your loot stays dry. You don't."
Salt Hauler's Frame Pack: "An aluminum frame and a canvas sack built to carry salt in bulk. Fill it and you'll walk like an old man and hum like a hive."
Waterproof Dry Bag: "Roll the top, clip it shut, throw it in the sea. It floats. It's the only thing on this island that does what it says."
Waist Pouch (secure): "A zipped pouch that never leaves your body. Whatever's inside comes home, even if you don't."

### 46.4.8 Tools and keys

Barometer: "A brass barometer from the harbor master's office. Watch the needle. When it drops, so does your luck."
Compass: "A lensatic compass. Always points north. Nothing else on the island does."
Scanner: "A handheld radio scanner. Tune it right and you'll hear the Wardens complaining about socks, and where they are."
Rebreather: "A diving rebreather from the lifeboat station. Two minutes of air underwater. Don't panic. Panicking uses air."
Lockpick Set: "Picks and tension wrenches in a leather roll. The Locksmith made these. The Locksmith will deny it."
Salt Pick: "A short, curved steel pick for prising salt off walls. Faster than a knife, louder than a knife."
Boat Repair Kit: "Epoxy, patches, rivets. Keeps a hull together long enough to get home."
NFB Vault Anteroom Key: "A brass key on a fob marked 'NFB Vault Anteroom'. The fob has teeth marks on it."
Cannery Safe Key: "A heavy key from the night watchman's belt. He didn't need it in the end."
Terminal Office Key: "A key on a lanyard printed with the ferry company's logo. Opens the ticket office and its little safe."
Pharmacy Key: "From the matron's desk drawer at St. Columba's. A paper tag says 'DISPENSARY, DO NOT LEND'."
Haldane Mausoleum Key: "A long iron key, rust-brown. The Haldanes locked their dead in. Nobody's sure what they were afraid of."
LANTERN Keycard: "A white plastic card with no markings except a small lantern symbol and a magnetic strip. It's warm."
Gault's Ticket Punch: "A ferry purser's ticket punch, brass, salt-crusted, still sharp. It opens the terminal strongroom. Thomas Gault would want you to have it, probably."

---

End of part 46. Next: `47_HARBOURSIDE_ROOM_BY_ROOM.md`.
