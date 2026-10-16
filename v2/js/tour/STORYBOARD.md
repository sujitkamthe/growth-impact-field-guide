# The guide in three minutes: storyboard

A short film in the style of a 3D strategy game, think Age of Empires: a living valley seen from a high three-quarter angle, covered in fog of war, and one explorer walking into it and discovering things. The fog is the guide's central idea made literal: **your scope is how far your reach extends, so it is how much of the map you can see.** As the explorer grows, the fog lifts further.

The narrator reads each line aloud (pre-rendered neural voices, the same edge-tts pipeline as Talon World) and the line shows as a caption. The words live in `script.js`; this file says what is on screen.

## Look and feel

- **A real game world.** Low-poly but rich: rolling grass terrain with vertex-coloured variation, trees, flowers, rocks, fences, crops, a river with a bridge, a lake, a village of timber houses, a windmill and a watermill. Warm sun with soft shadows, a sky gradient, distance haze. Assets are CC0 from Kenney (Nature, Fantasy Town, Survival kits) and Quaternius (natural-proportion people with Idle, Walk, Wave and Interact animations), in `v2/assets/tour/`.
- **Fog of war.** Unrevealed ground is covered by a soft dark-blue-grey fog with a feathered edge, exactly like an RTS. Reveals are circles that grow; they accumulate through the film.
- **Game camera.** Mostly a high three-quarter view (pitch about 50°, telephoto lens) that follows the explorer and glides between places, with occasional lower shots for moments (the reflection in the lake, the fire). No cuts; every move eases.
- **Game HUD** (HTML overlay, calm, in the site's font): a quest box top-left ("Discover the five principles · 3/5"), a "Discovered" toast when a landmark is found, and a notes counter during feedback. Captions bottom-centre.
- **People feel alive.** The explorer walks with real strides (no sliding), pauses, looks around, waves, kneels to work (Interact). Villagers idle, walk and wave. The faces have no expressions, so warmth comes from body language and pacing.
- **No infographics.** Ideas are places and actions in the world, never diagrams. The three area colours (teal, blue, amber) appear only as banners and flags in the village districts.
- **Nothing says "level up".** Growth is the fog lifting and the explorer's reach widening, never a rank or a title.

## The map

One valley, about 140 × 140 m, laid out so the story walks across it (`layout.js` holds the exact coordinates):

- **Camp** (south-west corner): a tent and a campfire, where the explorer starts.
- **Crossroads**: a signpost with arrows pointing several ways, north-east of the camp.
- **Stone ring**: a circle of standing stones of equal height on a low hill.
- **Lake** (west): still water with lily pads.
- **Your plot**: a small fenced crop field at the edge of the village, with **neighbours' plots** beside it.
- **The village** (centre): three districts around a square.
  - Client & Delivery (east, by the river): market stalls, a workbench, a watermill, a cart, teal banners.
  - People & Team (south-west): timber houses with gardens where villagers gather, blue banners.
  - Org & Community (centre): the square with a fountain and a **notice board**, amber banners.
- **The river** (north of the village) with a **bridge**, and beyond it **the wider valley**: a second hamlet, a windmill on a hill, tents, more fields, the map's edge still fogged.

## Chapters

### 1. Arrival (`arrival`)
Fog covers everything but a small circle around the camp. Morning light. The explorer steps out of the tent, stretches (Idle), looks around and walks a few steps towards the fog; it parts around them. Quest box: "Explore the field".

### 2. Five principles (`principles`)
The explorer walks a path; each principle is a place discovered as the fog lifts, with a "Discovered" toast and the quest box counting 1/5 to 5/5.
1. Five principles: the quest box changes to "Discover the five principles · 0/5"; the camera follows the explorer onto the path.
2. Growth is self-directed: the **crossroads** emerge from the fog. The explorer stops at the signpost, looks down two of the paths, and chooses one.
3. No titles: the **stone ring** on the hill, every stone the same height; the explorer walks into the middle, and the camera rises to show the view reaching further from the top of the hill.
4. Written down, visible and fair: at the edge of the village, the **notice board**, with two villagers reading it.
5. Feedback in the moment: two villagers on the path turn and wave to the explorer, and the explorer waves back.
6. Honest reflection: the **lake**. The camera comes down low; the explorer stands at the shore and the still water reflects them.

### 3. How far you reach (`scopes`)
1. Your scope is how far you can see: the camera pulls up to show the revealed patches and the fog beyond.
2. Direct: the explorer tends **their own plot** (Interact); the fog around them is tight, just the plot.
3. Extended: the explorer walks to a neighbour's plot and works alongside them; the fog lifts over the **neighbouring plots**.
4. Team: the camera rises over **the whole village** as the fog clears across it: the mill turning, villagers at work.
5. Wider: the fog rolls back **across the river** to the second hamlet, the windmill and the far fields.
6. Each scope includes the ones inside it: one smooth pull back over everything revealed, the explorer small in the middle.

### 4. Three areas (`areas`)
1. Three areas: the camera settles over the village square.
2. Client & Delivery: glide east to the market and the watermill; teal banners unfurl; a villager loads the cart and it rolls off towards the bridge.
3. People & Team: glide to the houses; blue banners unfurl; two villagers work together at a garden, one helping the other.
4. Org & Community: glide to the square; amber banners unfurl around the fountain; villagers gather.
5. Each area rated on its own: three small flags rise on poles in the square, one per area, in the area colours, to show each area is judged separately (no scores or numbers).

### 5. Your strengths (`strengths`)
Noon in the square, straight on from Areas, and back to the same spot at the end, so Your quest starts as Areas left it.
1. Growing through what you do best: the explorer walks to the square's east edge and looks out to the market; Client & Delivery's name stays bright while the other two dim. Quest box: "Agree where you go deep".
2. All three areas stay part of what's expected: the other two names come back up as the explorer looks round at each district in turn.
3. Handing one responsibility to a teammate who accepts it: the villager watching from the square's south side walks over; the explorer hands something over (Interact), they take it (Interact) and nod. A parchment card opens in the HUD, "Specialist agreement", its lines appearing as the narrator names them: a strength your team relies on, one responsibility accepted by a teammate.
4. A stronger contribution in return, named by what it achieves and who it helps: the teammate heads back; the explorer turns to the market and works, the market lit while it is shown (as in Areas, a moment's light, not reach). The card's third line: a stronger contribution through your strength.
5. The teammate chose to take it on, so it isn't extra work quietly left with them, and it counts toward their growth: the explorer walks back to the fountain, the teammate nods from their spot, and the quest box ticks: "Agreement made".

### 6. Your quest (`expectations`)
1. A new cycle, a new quest: the explorer walks to the **notice board** and pins up a sheet (Interact). Quest box: "Write your expectations".
2. Scope, specifics, growth: close shot of the board; the sheet fills with three lines of writing.
3. Teammates review: villagers walk up and read it; one points at the sheet (Interact), the explorer adjusts it (Interact), and they all wave. Quest box ticks: "Expectations agreed".

### 7. Along the way (`feedback`)
Time passes: the sun moves across the sky over the chapter.
1. Ask for feedback often: a montage-like glide following the explorer between the market, a house and the square; at each, a villager walks up and hands over a note (Interact). The HUD notes counter goes 1, 2, 3.
2. Saw, changed, relates to: one note opens briefly as a small parchment card in the HUD with three short lines: "What I saw", "What it changed", "Which expectation".
3. You keep every note: the notes counter settles at 6.

### 8. Around the fire (`self-assessment`)
Dusk. A campfire in the square, the windmill silhouetted.
1. Look back one area at a time: the explorer sits by the fire (Idle) reading their notes; the HUD shows three area rows.
2. Rate each area: the HUD rows fill in: Client & Delivery "Meets", People & Team "Exceeds", Org & Community "Meets".
3. Teammates confirm, correct or add: villagers come and stand around the fire; one by one they nod (a small dip) and one adds a note.

### 9. Further (`growth`)
Morning again.
1. A stretch: the explorer crosses **the bridge** for the first time and starts working in the hamlet beyond the river.
2. Exceeding in one area: fog lifts a little across the river around that work.
3. Scope raised: as the explorer works in all three districts, the fog rolls back further and stays back: the revealed area is now wider than before. Quest box: "Your reach has grown".
4. A new season begins: sunrise light sweeps across the valley; the quest box resets to a new quest.

### 10. Your turn (`close`)
The camera rises high over the valley: everything the explorer has revealed, villagers going about their day, fog still at the far edges because there is always more to explore. The player shows "Find your scope" and "Watch again".
