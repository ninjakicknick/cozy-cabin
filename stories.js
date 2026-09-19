export const notebook=[
 ['November','The first snow came while the kettle was on.\n\nI put another cup out. Old habit.\n\nThere is enough wood beneath the window to last until the road appears again.'],
 ['A small repair','The window latch sticks in the cold. Lift it a little before you pull.\n\nThe record with the plain sleeve belongs here. Please leave it when you go.'],
 ['Undated','I used to count the lit windows across the lake.\n\nThree on clear nights. Two when it snows.\n\nYesterday there were four.'],
 ['Inside the back cover','If you came here to get something done, I am afraid I have misplaced the clock key.\n\nStay anyway.'],
];
export function paper(id,m){return ({
 recipe:{title:'For a cold evening',text:'Black tea. A little orange peel. Two cloves, never three.\n\nLet it sit while you find the other cup.\n\nBelow, in a different hand:\n“Still good without the cloves.”',footer:'A recipe card, softened at the corners.'},
 postcard:{title:'The other side',text:'We took the last boat before the snow. I have your scarf, and you have my good compass.\n\nKeep both, if you like. I know the way.\n\n— E.',footer:'The postmark has run into the mountain. Summer, 1978.'},
 bench:{title:'In the bench drawer',text:'A single wool mitten. A packet of seeds. A ferry timetable printed for a summer that has already passed.\n\nThe last crossing has been circled in blue pencil.\n\nUnder it: “They wait if they can see the porch light.”',footer:'Nothing here needs taking.'},
 letter:{title:'A letter never posted',text:'I moved the little boat upstairs. It kept pointing toward the door, and I found it rather persuasive.\n\nThe place under the roof is still yours. I have left the tin where you can reach it.\n\nNo need to write back. Leave the kettle warm.',footer:'There is no address on the envelope.'},
 tin:{title:'Inside the biscuit tin',text:m.tinVisits>2?'Beneath the buttons, a folded scrap.\n\n“The boat is not lost. It is waiting for the lake to remember summer.”\n\nYou leave the paper exactly as it was.':'Three wooden buttons. A length of blue thread. A small wind-up mechanism wrapped in felt.\n\nOn the lid, scratched very faintly:\n“For nights when the house is too quiet.”',footer:'The felt still smells faintly of cedar.'},
 photograph:{title:'On the back of the photograph',text:m.signalSeen?'The same lake. No houses on the far shore.\n\nAt the bottom, in the familiar blue pencil:\n“Sometimes they come back for the light.”':'The same mountain. The same lake.\n\nBut there are no houses on the far shore.\n\nA date has been crossed out so carefully that the paper is nearly worn through.',footer:'You turn the photograph back toward the room.'},
 scarf:{title:'A small sewn label',text:'E. MARLOW\n\nA second name was unpicked long ago.\n\nThere is a little blue thread caught in the wool.',footer:'The scarf is warmer than the room.'},
 })[id]}
