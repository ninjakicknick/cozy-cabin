// Pure controller interpretation; the same commands drive actual keyboard and gamepad input.
export function gamepadCommands(pad,previous={},now=0){
  if(!pad)return {commands:[],state:{buttons:[],axis:'',repeatAt:0}};
  const buttons=pad.buttons.map(b=>Boolean(b.pressed)),edge=i=>buttons[i]&&!previous.buttons?.[i];
  const x=pad.axes?.[0]||0,y=pad.axes?.[1]||0;
  const axis=Math.abs(x)>.55?(x>0?'right':'left'):Math.abs(y)>.55?(y>0?'down':'up'):'';
  const axisEdge=axis&&(axis!==previous.axis||now>(previous.repeatAt||0));
  const commands=[];
  if(edge(1))commands.push('back');else if(edge(0))commands.push('act');
  if(edge(3))commands.push('lights');if(edge(2))commands.push('secondary');if(edge(9))commands.push('mute');
  for(const [i,direction] of [[12,'up'],[13,'down'],[14,'left'],[15,'right']])if(edge(i)||(axisEdge&&axis===direction))commands.push(direction);
  return {commands,state:{buttons,axis,repeatAt:axisEdge?now+(axis!==previous.axis?420:220):previous.repeatAt||0}};
}
