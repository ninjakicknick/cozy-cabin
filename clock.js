// One small physical puzzle. The notebook is a clue, never a prerequisite.
export function readClock(raw={}) {
  const opened=raw.secretOpen===true;
  return {secretOpen:opened,clockKey:opened?'clock':['pocket','clock'].includes(raw.clockKey)?raw.clockKey:'hook',
    clockRunning:opened&&raw.clockRunning!==false,lanternTurning:raw.lanternTurning===true};
}
export function clockAction(memory,action) {
  if(action==='key'){
    if(memory.clockKey==='hook'){memory.clockKey='pocket';return {sound:'key',text:'The brass disappears into your palm, then your pocket.'};}
    return {text:memory.clockKey==='pocket'?'You feel the little weight in your pocket.':'Only the hook remains.'};
  }
  if(action!=='clock')return {};
  if(memory.secretOpen){memory.clockRunning=!memory.clockRunning;return {sound:'needle',text:memory.clockRunning?'A gentle nudge. It finds its rhythm again.':'You catch the pendulum lightly. The passage stays open.'};}
  if(memory.clockKey==='hook')return {text:'Still hands. Beneath them, a small square winding socket.'};
  if(memory.clockKey==='pocket'){memory.clockKey='clock';return {sound:'key',text:'It fits. The brass waits beneath your fingers.'};}
  memory.secretOpen=true;memory.clockRunning=true;
  return {sound:'winding',reveal:true,text:''};
}
export function canEnter(view,memory){return !['snug','snugRest','instrument'].includes(view)||memory.secretOpen;}
export function clockLabel(memory){return memory.secretOpen?(memory.clockRunning?'Still the pendulum':'Set the pendulum moving'):memory.clockKey==='clock'?'Wind the clock':memory.clockKey==='pocket'?'Fit the brass key':'Examine the clock';}
