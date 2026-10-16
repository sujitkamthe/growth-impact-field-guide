# Feedback, every day: storyboard

The third film, about building a habit of frequent, genuine feedback, from the side of the person giving it and the side of the person hearing it. It plays in the same valley, with the same explorer, villagers, fog of war and game HUD as the guide's film (see `../../STORYBOARD.md` and `../../WORLD.md`), so it feels like another episode of the same game. It runs 2:10 with the default voice. The narration is in `script.js` beside this file and is quoted in full below; this file says what is on screen. The film follows the guide's own wording in `v2/content/feedback.md`, the "Giving feedback during the cycle" section of `v2/content/teammates.md` and the "Feedback is a habit" principle.

## Look and feel

Everything from the first film applies: a high three-quarter game camera, real walking (about 1.3 m/s, each walk timed by its path length), calm eased motion, the HUD (quest box, toasts, the notes counter, the parchment card and the area rows), captions, and Sahaj indigo on the explorer and the HUD. The film is set on one ordinary day in the village, from early morning to golden hour, with the sun moving on from chapter to chapter, because the point is that feedback belongs to a normal day rather than to an event.

The explorer starts where the first film leaves them, with Team reach (the fog lifted over the whole village, `layout.REVEALS.afterGrowth`), so in this film they are the most experienced person on their team. All three districts' banners are up.

Ideas are places and actions in the village, never diagrams:

- **Small and often**: two pairs of villagers, one at the market's workbench and one at the door of a house west of the square, turn to each other every few seconds; one talks with their hands, the other nods, and then the other way round. The exchanges carry on in the background of every chapter.
- **A showcase**: at the head of the bridge road a teammate shows the client's two people the finished cart, loaded. When it ends, the client takes the cart's shafts and pulls it away over the bridge.
- **In private**: a short walk out of the square to the riverbank east of the bridge, two people alone by the water.
- **A note**: the HUD's parchment card, always in the guide's form: what I saw, what it changed, what to try instead when something should change, and the area when it helps.
- **The notes counter** counts the feedback the explorer has been given, as in the first film.
- **The team check** is the team standing in a small circle between the notice board and the fountain, with the HUD's three area rows: two marked, Org & Community's slot still empty.

The cast, by villager index: 10 the new joiner, who arrives over the bridge; 4 the teammate who gives the showcase; 2 and 3 the client's people; 8 the teammate who watches the showcase and takes the explorer aside; 6 the planner, who runs the client's planning, at the hall's door; 5 a teammate reading the notice board; 0, 1, 7 and 9 the village's background pairs. The film's places, paths and shots are in `chapters/_feedback.js`.

## Chapters

### 1. Small and often (`habit`)
Early morning.
1. "At Sahaj, feedback is part of an ordinary day: genuine, frequent and open, a few words soon after the moment, from anyone to anyone."
   The camera comes down from high over the valley to the square. The background pairs turn to each other; at the head of the bridge road the showcase is under way, a teammate watching from the square's north side; the explorer stands in the square and glances over at it. The new joiner is walking in over the bridge.
2. "It's for your growth, not a mark for your self-assessment: a teammate's view of what you could try next, while there's still time to try it."
   The camera settles on the explorer, who turns back as the joiner comes off the bridge and stops in front of them. Quest box: "Make feedback a habit".

### 2. Ask first (`ask`)
1. "If you've been on the team the longest, go first: ask for feedback, including from the newest people on the team, and ask about your own work."
   Close on the two of them. The explorer asks with a small gesture; the joiner answers at some length; the explorer nods. Toast, labelled "Ask first": "What would you change about how I run planning?" The notes counter appears at 1.
2. "When the answer is critical, thank them, even if you disagree. Everyone watching learns from your answer whether it is safe to say it again."
   The explorer asks again; the joiner answers, glancing towards the hall; the explorer nods. Toast, labelled "Thank them": "Thanks, that's useful. Tell me more?" Notes: 2. The explorer turns to the showcase.

### 3. The same day (`give`)
1. "When a teammate's work goes well, tell them that day, while you both remember the moment."
   The showcase ends: the client nods, steps round to the cart's shafts and pulls it away over the bridge, their colleague walking on ahead. The teammate who gave the showcase walks over to the explorer, and the joiner heads off across the square to the notice board.
2. "Say what you saw and what it changed, and, if it helps, which area it belongs to. 'Nice work' is kind, but it doesn't say what to do again."
   The explorer tells them, and the parchment card opens, labelled "Said the same day": "What I saw: your fix halved the page load", "What it changed: the client noticed it in the showcase", "Which expectation: Client & Delivery, technical craft". The teammate nods. Behind them, the teammate who watched comes over and waits their turn.

### 4. What should change (`change`)
1. "When something should change, don't hold it back to be kind. Say it soon and in private, about the work, not the person, with one thing to try instead."
   The waiting teammate asks for two minutes (toast, labelled "Soon, in private": "Got two minutes?"), and the two of them walk out of the square to the riverbank east of the bridge, while the teammate from the showcase steps back to watch the bridge.
2. "And say why you're telling them: you expect a lot of their work because you know they can do it."
   Seen from across the river: the teammate talks it through. The card opens, labelled "In private": "What I saw: you agreed the date before showing our estimate", "What it changed: long hours, or a missed date", "Which expectation: Client & Delivery, delivery ownership", "Try next time: show both options and let the client choose".
3. "When it's said to you and you feel a 'yes, but' coming, ask a question instead: what would you have done?"
   The explorer starts to explain with a gesture (toast, labelled "The first instinct": "Yes, but…"), stops halfway, looks out at the water for a moment, nods, and asks with a smaller gesture. Toast, labelled "Hearing it": "What would you have done?" The teammate answers.
4. "Then thank them, and hear it as one moment in one piece of work, not a verdict on you. You can decide later what to do with it."
   The explorer nods and raises a hand in thanks; the teammate nods back. Notes: 3.

### 5. Every way, every area (`everyone`)
1. "There are no titles at Sahaj, so how long someone has been here is never a reason to stay quiet, in either direction. Say what you see to anyone, without fear."
   The camera rises from the riverbank over the village. At the notice board the new joiner turns to the older teammate reading beside them and tells them something; they nod. The explorer sets off for the hall.
2. "It covers more than the code too: how someone works with the client, who grew because of them, and what they gave back to Sahaj."
   The HUD's three area rows appear and fill one by one, Client & Delivery, People & Team, Org & Community, while the exchanges go on at the market, by the houses and at the notice board, where the teammate now answers the joiner. The teammate from the riverbank walks back towards the square; the explorer reaches the hall's door.
3. "Tell the people already doing well what their work changed, and ask what they'd like to take on next."
   At the hall's door, the planner. The explorer tells them what their work changed, then points out over the river; they both look, and the planner nods. Toast, labelled "Ask for more": "What would you like to take on next?"

### 6. Closing the loop (`loop`)
Afternoon.
1. "When you act on feedback, go back and tell the person who gave it what you changed and what happened."
   The explorer walks from the hall's door to the teammate from the riverbank, who is waiting between the notice board and the fountain, and tells them. The card opens, labelled "Going back": "What I changed: I showed the client both options", "What happened: they chose the smaller release".
2. "Knowing it made a difference is what makes them tell you again next time."
   The teammate nods, then tells the explorer something more. Notes: 4. Around them the rest of the team gathers into a circle for the team check: the planner from the hall, the joiner and the reader from the notice board.

### 7. Looking ahead (`ahead`)
Late afternoon into golden hour.
1. "At each team check, look for what nobody has seen yet, such as an area with no feedback, and agree who will arrange an opportunity for it next cycle."
   The team in its circle. The HUD's area rows show Client & Delivery and People & Team marked and Org & Community's slot still empty; toast, labelled "Team check": "Where is evidence missing?" The teammate from the riverbank speaks, the others nod, and the planner raises a hand to arrange it. Quest box: "Next cycle: an opportunity in Org & Community".
2. "Make it weekly. This week, tell one teammate what you saw them do and what it changed, and ask another what you could do differently next time."
   The rows go, and the camera pulls up high over the village in golden light, the pairs still turning to each other. Quest box: "This week: tell one, ask one". The player's end card follows, with "Read about feedback" and "Watch How growth works at Sahaj".
