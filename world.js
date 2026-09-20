import { clockLabel } from './clock.js?v=66';
// Scene coordinates are percentages in the original artwork, independent of screen size.
// A scene owns its exits and objects; input devices all use the same definitions.
const spot = (id, label, x, y, target, kind = 'go', extra = {}) => ({id,label,x,y,[kind]:target,...extra});
export const art = {
  room: {unlit:'assets/scenes/room-unlit.webp',src:'assets/living-room.png',alt:'The firelit living room overlooking the snowy lake', snow:[[44,11],[84,11],[84,49],[44,49]], lights:[65.1,39.4], videos:[['assets/fireplace.mp4',17.1,47.4,14.3,29]]},
  chair: {unlit:'assets/scenes/chair-unlit.webp',src:'assets/chair-view.png',alt:'Seated in the armchair, beside the fire',videos:[['assets/chair-fireplace.mp4',74,29,18.2,35.5]],snow:[[8,3],[26,3],[26,43],[8,43]]},
  floor: {unlit:'assets/scenes/floor-unlit.webp',src:'assets/floor-fireplace.png',alt:'Lying on the rug, close to the fire',videos:[['assets/floor-fireplace.mp4',35,4,58,69]]},
  kitchen:{unlit:'assets/scenes/kitchen-unlit.webp',src:'assets/scenes/kitchen.webp',alt:'A small timber kitchen, with a boot room to the left and loft stairs to the right',snow:[[46,18],[59,18],[59,38],[46,38]]},
  mudroom:{unlit:'assets/scenes/mudroom-unlit.webp',variant:{unlit:'assets/scenes/mudroom-empty-unlit.webp',src:'assets/scenes/mudroom-empty.webp',state:'key-away',clip:'polygon(25% 21%,29% 21%,29% 36%,25% 36%)'},src:'assets/scenes/mudroom.webp',alt:'Coats, boots and a bench beside the door to the porch',snow:[[57,18],[68,18],[68,44],[57,44]]},
  porch:{night:'assets/scenes/porch-night.webp',src:'assets/scenes/porch.webp',alt:'A sheltered timber porch above a snowy lake',snow:[[47,0],[100,0],[100,100],[67,71],[49,52]],lights:[68.7,44]},
  loft:{night:'assets/scenes/loft-night.webp',src:'assets/scenes/loft.webp',alt:'A low sleeping loft with a writing desk, telescope and a little cupboard under the eaves',snow:[[44,18],[54,0],[72,20],[72,39],[44,39]],lights:[68,30.7]},
  eaves:{src:'assets/scenes/eaves.webp',alt:'A small wool-lined hiding place under the roof, looking through a round window',snow:[[48,25],[55,25],[58,33],[58,44],[52,50],[46,45],[44,35]]},
  clockWall:{unlit:'assets/scenes/clock-wall-unlit.webp',src:'assets/scenes/clock-wall.webp',alt:'A walnut wall clock between the bookshelves and the stone chimney',variant:{unlit:'assets/scenes/clock-open-unlit.webp',src:'assets/scenes/clock-open.webp',state:'secret-open'}},
  snugBed:{unlit:'assets/scenes/snug-bed-lights-out.webp',src:'assets/scenes/snug-bed.webp',alt:'Lying on the daybed, looking up through the timber-framed glass roof at snowy pines',snowPanes:[[[11,0],[28,0],[30,32],[15,25]],[[34,0],[65,0],[60,46],[35,36]],[[72,0],[97,0],[85,56],[65,48]],[[16,31],[30,37],[31,62],[19,56]],[[35,42],[59,51],[56,74],[35,65]],[[65,55],[83,61],[78,87],[61,78]]]},
  snug:{unlit:'assets/scenes/snug-unlit.webp',src:'assets/scenes/snug.webp',alt:'A small wool-lined room behind the warm chimney, beneath a sloping glass roof',snow:[[23,0],[73,0],[69,29],[29,20]]},
  drawer:{src:'assets/scenes/drawer.webp',alt:'An open kitchen drawer containing recipe cards, a postcard and an old brass compass'},
};
export const scenes = {
  room:{art:'room',label:'Living room',default:'chair',spots:[
    spot('books','Bookshelf',10,31,'books'),spot('fire','Fireplace',24,60,'fire'),spot('chair','Sit in the armchair',54,58,'chair'),
    spot('window','Snowy window',62,28,'window'),spot('record','Record player',86,49,'record'),spot('cat','Sleeping cat',88,76,'cat'),
    spot('kitchen','Turn toward the kitchen',50,94,'kitchen','go',{edge:true,w:18,h:10})]},
  chair:{art:'chair',label:'In the armchair',parent:'room',default:'floor',rest:true,spots:[spot('floor','Lie by the fire',55,80,'floor','go',{w:30,h:25})]},
  floor:{art:'floor',label:'Beside the fire',parent:'chair',rest:true,actions:['tend','pet']},
  books:{art:'room',label:'At the bookshelf',parent:'room',zoom:[1.9,10,31],actions:['book','clockView']},
  fire:{art:'room',label:'At the fireplace',parent:'room',zoom:[2.18,24,60],actions:['tend']},
  window:{art:'room',label:'At the window',parent:'room',zoom:[1.75,62,28],rest:true,actions:['window','look']},
  windowLake:{art:'porch',label:'Through the living-room window',parent:'window',zoom:[3,68,45],rest:true,actions:['listen']},
  record:{art:'room',label:'At the record player',parent:'room',zoom:[2,86,49],actions:['record','flip']},
  cat:{art:'room',label:'Beside the sleeping cat',parent:'room',zoom:[2.35,88,76],actions:['pet']},
  kitchen:{art:'kitchen',label:'Kitchen',parent:'room',default:'kettle',spots:[
    spot('mudroom','Step into the boot room',18,45,'mudroom','go',{w:18,h:40}),spot('kettle','The enamel kettle',77,44,'kettle','do'),
    spot('drawer','Open the kitchen drawer',62,53,'drawer'),spot('loft','Climb the stairs',94,52,'loft','go',{w:12,h:35}),
    spot('mugs','The two mugs',82,51,'tea','do'),spot('room','Back to the fire',28,90,'room','go',{edge:true})]},
  drawer:{art:'drawer',label:'An open drawer',parent:'kitchen',default:'postcard',spots:[
    spot('recipe','Untie the recipe cards',26,42,'recipe','do',{w:24,h:30}),spot('postcard','Turn over the postcard',54,42,'postcard','do',{w:25,h:28}),spot('compass','Lift the compass',75,40,'compass','do',{w:16,h:25})]},
  mudroom:{art:'mudroom',label:'Boot room',parent:'kitchen',default:'porch',spots:[
    spot('porch','Open the porch door',65,49,'porch','go',{w:19,h:42}),spot('bench','Pull the bench drawer',34,76,'bench','do'),
    spot('key','The small brass key',27.5,29,'key','do',{w:7,h:17}),spot('porchLamp','Porch light switch',77.5,40,'porchLamp','do'),spot('scarf','The wool scarf',34,34,'scarf','do'),
    spot('kitchen','Back into the kitchen',8,62,'kitchen','go',{edge:true,w:13,h:35})]},
  porch:{art:'porch',label:'On the porch',parent:'mudroom',default:'porchSeat',rest:true,spots:[
    spot('door','Go inside',12,45,'mudroom','go',{w:15,h:38}),spot('porchSeat','Sit under the eaves',20,77,'porchSeat','go',{w:25,h:25}),
    spot('chime','Touch the wind chime',62,18,'chime','do',{w:9,h:28}),spot('bowl','Brush snow from the dish',86,72,'bowl','do'),spot('lake','Look across the lake',69,46,'lake','go',{w:20,h:20})]},
  porchSeat:{art:'porch',label:'On the porch bench',parent:'porch',zoom:[1.23,61,46],rest:true,actions:['blanket','listen']},
  lake:{art:'porch',label:'Across the lake',parent:'porch',zoom:[2.45,68,45],rest:true,actions:['listen']},
  loft:{art:'loft',label:'Sleeping loft',parent:'kitchen',default:'desk',spots:[
    spot('bed','Lie beneath the quilt',25,43,'bed','go',{w:28,h:26}),spot('desk','The letter on the desk',61,45,'letter','do'),
    spot('lamp','The desk lamp',50,33,'lamp','do'),spot('telescope','Look through the telescope',69,36,'telescope','go'),
    spot('cupboard','The little cupboard',88,54,'eaves','go',{w:17,h:30}),spot('stairs','Go downstairs',17,87,'kitchen','go',{edge:true,w:20,h:20})]},
  bed:{art:'loft',label:'Under the quilt',parent:'loft',zoom:[1.55,34,39],rest:true,actions:['quilt']},
  telescope:{art:'loft',label:'Through the telescope',parent:'loft',rest:true,scope:true,actions:['scope']},
  eaves:{art:'eaves',label:'Under the eaves',parent:'loft',default:'cushion',rest:true,spots:[
    spot('tin','Open the biscuit tin',28,68,'tin','do'),spot('boat','The small wooden boat',35,55,'boat','do'),
    spot('cushion','Settle on the cushion',64,65,'cushion','go',{w:24,h:20}),spot('picture','Look at the pinned photograph',80,34,'photograph','do'),
    spot('out','Back into the loft',93,90,'loft','go',{edge:true})]},
  clockWall:{art:'clockWall',label:'Beside the old clock',parent:'books',default:'clock',spots:[spot('clock','The old clock',49.7,30,'clock','do',{w:14,h:40}),spot('passage','The concealed opening',55,55,'opening','do',{w:22,h:50})]},
  snug:{art:'snug',label:'Behind the warm stone',parent:'clockWall',default:'rest',spots:[spot('rest','Lie on the bed',45,63,'snugRest','go',{w:43,h:37}),spot('lantern','The brass lantern',82,51,'lantern','do',{w:12,h:33}),spot('instrument','The little wooden instrument',90,70,'instrument'),spot('out','Back through the panel',7,92,'clockWall','go',{edge:true})]},
  snugRest:{art:'snugBed',label:'Lying beneath the glass roof',parent:'snug',rest:true,actions:['lantern','listen']},
  instrument:{art:'snug',label:'At the little instrument',parent:'snug',zoom:[1.65,78,61],actions:['toneLow','toneMiddle','toneHigh']},
  cushion:{art:'eaves',label:'In the quiet under the roof',parent:'eaves',zoom:[1.25,54,38],rest:true,actions:['musicbox']},
};
export function visibleSpots(view,memory={}){return (scenes[view].spots||[]).filter(s=>{if(s.when&&!memory[s.when])return false;if(s.id==='passage')return memory.secretOpen;return true}).map(s=>s.id==='key'&&memory.clockKey&&memory.clockKey!=='hook'?{...s,label:'The empty hook'}:s.id==='clock'&&memory.secretOpen?{...s,x:41.5,y:30,w:9}:s.id==='passage'?{...s,label:memory.panelOpen?'The concealed opening':'The concealed panel'}:s);}
export function baseArt(view){ return scenes[view]?.art || 'room'; }
export function actionLabel(id,m,now=Date.now()) {
  if(id==='clock')return clockLabel(m);
  return ({enterSecret:'Step through the opening',closePanel:'Close the panel',clockView:'Look beside the shelves',lantern:m.lanternTurning?'Let the lantern rest':'Turn the lantern',toneLow:'Pluck the low tine',toneMiddle:'Pluck the middle tine',toneHigh:'Pluck the high tine',book:'Open the clothbound book',tend:m.emberUntil>now?'Let the fire settle':'Add a log',pet:'Pet the cat',
    window:m.windowOpen?'Close the window':'Crack the window',look:'Look out toward the lake',
    record:m.recordOn?'Lift the needle':'Lower the needle',flip:'Turn the record over',blanket:m.blanket?'Fold back the blanket':'Pull the blanket around you',
    sip:'Take a sip',listen:'Listen',quilt:m.quilt?'Fold back the quilt':'Pull up the quilt',scope:'Adjust the focus',musicbox:m.musicbox?'Let it wind down':'Wind the little music box'})[id] || id;
}
