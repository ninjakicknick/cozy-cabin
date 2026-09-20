import { propagation, soundOrigins, fireWarmth } from './rhythms.js?v=66';
import { baseArt } from './world.js?v=66';
// Loop seams are blended once in the decoded buffer. Native Web Audio looping
// continues without animation frames, media events, or just-in-time JS timers.
export function loopSamples(input, overlap) {
  const length = input.length - overlap;
  const result = new Float32Array(length);
  result.set(input.subarray(overlap, length));
  for (let i = 0; i < overlap; i++) {
    const p = i / overlap;
    result[length - overlap + i] = input[length + i] * Math.cos(p * Math.PI / 2)
      + input[i] * Math.sin(p * Math.PI / 2);
  }
  return result;
}
const mixes = {
  clockWall:[.2,.055,.12,1600],snug:[.11,.09,.025,800],snugRest:[.10,.12,.02,750],instrument:[.09,.08,.02,800],
  windowLake: [.1,.3,.04,1000],
  kitchen: [.13,.09,.065,1100], drawer: [.12,.08,.065,1100], mudroom:[.055,.2,.03,700],
  porch:[.018,.43,.018,500], porchSeat:[.015,.4,.015,500], lake:[.01,.47,.01,500],
  loft:[.075,.12,.04,800], bed:[.055,.10,.035,650], telescope:[.07,.12,.04,750],
  eaves:[.025,.08,.02,500], cushion:[.022,.07,.015,500],
  room: [.32, .15, .13, 2200], chair: [.57, .08, .09, 3200],
  floor: [.72, .04, .05, 4200], fire: [.65, .07, .08, 3800],
  window: [.14, .36, .07, 1200], books: [.24, .12, .12, 1900],
  book: [.24, .12, .12, 1900], record: [.21, .10, .24, 1800], cat: [.24, .11, .10, 1700],
};
export class CabinAudio {
  constructor(onStatus = () => {}) {
    this.onStatus = onStatus;
    this.layers = new Map();
    this.pending = new Map();
    this.voices = new Set();
    this.view = 'room';
    this.settings = {};
  }
  async wake() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.settings.muted ? 0 : .8;
        this.master.connect(this.ctx.destination);
        this.createClock();
      }
      if (this.ctx.state !== 'running') await this.ctx.resume();
      await Promise.all(['fire', 'wind', 'record', ...(this.settings.recordSide ? ['recordB'] : [])].map(name => this.load(name)));
      this.mix(this.view, this.settings);
      this.onStatus(this.layers.has('fire') && this.layers.has('wind'));
    } catch { this.onStatus(false); }
  }
  async load(name) {
    if (this.layers.has(name)) return;
    if (this.pending.has(name)) return this.pending.get(name);
    const task = (async () => {
      const paths = { fire: 'fireplace-loop.mp3', wind: 'winter-wind-loop.mp3', record: 'the-long-way-home.mp3', recordB: 'before-the-road.mp3' };
      const response = await fetch(`assets/audio/${paths[name]}`);
      if (!response.ok) throw new Error(`Missing ambience: ${name}`);
      const decoded = await this.ctx.decodeAudioData(await response.arrayBuffer());
      const overlap = Math.min(Math.floor(decoded.sampleRate * (name.startsWith('record') ? 2 : 3)), Math.floor(decoded.length / 4));
      const buffer = this.ctx.createBuffer(decoded.numberOfChannels, decoded.length - overlap, decoded.sampleRate);
      for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
        buffer.copyToChannel(loopSamples(decoded.getChannelData(channel), overlap), channel);
      }
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = 0;
      filter.type = 'lowpass';
      filter.frequency.value = 4200;
      source.connect(filter).connect(gain).connect(this.master);
      source.start(0, Math.random() * (name.startsWith('record') ? 0 : buffer.duration));
      this.layers.set(name, { source, gain, filter, buffer, transport: null });
    })().finally(() => this.pending.delete(name));
    this.pending.set(name, task);
    return task;
  }
  ramp(param, value, seconds = 1.3) {
    const now = this.ctx.currentTime;
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
    else { param.cancelScheduledValues(now); param.setValueAtTime(param.value, now); }
    param.setTargetAtTime(value, now, Math.max(.015, seconds / 4));
  }
  mix(view, settings) {
    this.view = view;
    this.settings = { ...settings };
    if (!this.ctx) return;
    const [fire, wind, , frequency] = mixes[view] || mixes[baseArt(view)] || mixes.room;
    const outside = ['porch','porchSeat','lake'].includes(view);
    const recordPath=propagation(view,'hearth',settings.windowOpen);
    const windPath=propagation(view,'porch',settings.windowOpen);
    const windowGain=settings.windowOpen?Math.min(2.6,windPath.gain/propagation(view,'porch',false).gain):1;
    for(const voice of this.voices)this.positionVoice(voice);
    this.recordTransport();
    if(this.ticker){const p=propagation(view,'clockWall',settings.windowOpen);this.ramp(this.ticker.gain.gain,settings.clockRunning?p.gain*.045:0,.7);this.ramp(this.ticker.filter.frequency,p.cutoff,.7);}
    this.ramp(this.master.gain, settings.muted ? 0 : .8, .25);
    for (const [name, layer] of this.layers) {
      const level = name === 'fire' ? fire * (.65 + fireWarmth(settings)*.47)
        : name === 'wind' ? wind * windowGain * (settings.weatherWind || 1) * (settings.blanket && view === 'porchSeat' ? .78 : 1)
        : settings.recordOn && name === (settings.recordSide ? 'recordB' : 'record') ? .24*recordPath.gain*(settings.listening?.6:1) : 0;
      this.ramp(layer.gain.gain, level);
      this.ramp(layer.filter.frequency, name === 'fire' ? frequency : name === 'wind' ? (outside ? 7000 : windPath.cutoff) : recordPath.cutoff);
    }
  }
  createClock(){
    const ctx=this.ctx,buffer=ctx.createBuffer(1,Math.round(ctx.sampleRate*1.6),ctx.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){const t=i/ctx.sampleRate,beat=t%.8;if(beat<.042)data[i]=(Math.sin(beat*Math.PI*2*(t<.8?1100:820))*.6+(Math.random()*2-1)*.25)*Math.exp(-beat*105);}
    const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();source.buffer=buffer;source.loop=true;gain.gain.value=0;filter.type='lowpass';source.connect(filter).connect(gain).connect(this.master);source.start();this.ticker={source,gain,filter};
  }
  recordTransport() {
    if(!this.settings.recordOn)return;
    const name=this.settings.recordSide?'recordB':'record',layer=this.layers.get(name);
    if(!layer)return;
    const key=String(this.settings.life?.recordAt||0);
    if(layer.transport===key)return;
    layer.source.stop();layer.source.disconnect();
    const source=this.ctx.createBufferSource();source.buffer=layer.buffer;source.loop=true;
    source.connect(layer.filter);
    const elapsed=Math.max(0,(Date.now()-(this.settings.life?.recordAt||Date.now()))/1000);
    source.start(0,elapsed%layer.buffer.duration);
    source.stop(this.ctx.currentTime+Math.max(.01,192-elapsed));
    layer.source=source;layer.transport=key;
  }
  positionVoice(voice) {
    const path=propagation(this.view,voice.origin,this.settings.windowOpen);
    this.ramp(voice.gain.gain,path.gain*(this.settings.listening&&voice.origin==='porch'?1.2:1),.7);
    this.ramp(voice.filter.frequency,path.cutoff,.7);
    this.ramp(voice.pan.pan,path.pan,.7);
  }
  voice(kind,local) {
    const gain=this.ctx.createGain(),filter=this.ctx.createBiquadFilter(),pan=this.ctx.createStereoPanner();
    const voice={gain,filter,pan,origin:local?null:soundOrigins[kind]};
    filter.type='lowpass';gain.connect(filter).connect(pan).connect(this.master);
    const path=propagation(this.view,voice.origin,this.settings.windowOpen);
    gain.gain.value=path.gain;filter.frequency.value=path.cutoff;pan.pan.value=path.pan;
    this.voices.add(voice);
    return {input:gain,close:()=>{gain.disconnect();filter.disconnect();pan.disconnect();this.voices.delete(voice)}};
  }
  sound(kind,local=true) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (['chime','owl','bird','lakeBell','kettle','musicbox','cup','toneLow','toneMiddle','toneHigh'].includes(kind)) { this.melody(kind,local); return; }
    const ctx = this.ctx, now = ctx.currentTime, voice=this.voice(kind,local);
    const duration = kind==='winding'?1.8:kind==='key'?.28:kind === 'purr' ? 2.1 : kind === 'wood' || kind === 'roof' ? .65 : .18;
    const gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = kind === 'purr'
        ? (Math.sin(t * Math.PI * 2 * 94) * .55 + (Math.random() * 2 - 1) * .15) * (.55 + .45 * Math.sin(t * 2 * Math.PI * 25))
        : kind==='winding'?(Math.random()*2-1)*Math.exp(-(t%.26)*45):kind==='key'?Math.sin(t*2*Math.PI*2200)*Math.exp(-t*20):Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource(); source.buffer = buffer;
    filter.type = kind === 'page' ? 'highpass' : 'lowpass';
    filter.frequency.value = kind === 'page' ? 1600 : kind === 'purr' ? 280 : 520;
    gain.gain.setValueAtTime(.001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'purr' ? .12 : kind === 'roof' ? .024 : .065, now + .02);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    source.connect(filter).connect(gain).connect(voice.input);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); voice.close(); };
    source.start();
  }
  melody(kind,local=true) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx=this.ctx, now=ctx.currentTime,voice=this.voice(kind,local);
    const patterns={toneLow:[261.63],toneMiddle:[329.63],toneHigh:[392],chime:[880,1174.66,1318.5],owl:[310,280],bird:[1700,2300,1900],lakeBell:[392,523.25],kettle:[980,1010],musicbox:[523.25,659.25,783.99,587.33,523.25],cup:[1800]};
    const notes=patterns[kind]||patterns.chime;
    let remaining=notes.length;
    notes.forEach((freq,index)=>{
      const osc=ctx.createOscillator(),overtone=ctx.createOscillator(),gain=ctx.createGain(),harmonic=ctx.createGain();
      const start=now+index*(kind==='musicbox'?.68:kind==='bird'?.13:.5),duration=kind==='bird'?.18:kind==='cup'?.25:kind.startsWith('tone')?3.8:2.4;
      osc.type='sine';osc.frequency.setValueAtTime(freq,start);
      if(kind==='owl'||kind==='bird')osc.frequency.exponentialRampToValueAtTime(freq*.86,start+duration);
      overtone.frequency.value=freq*2.007;harmonic.gain.value=.12;
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime((kind.startsWith('tone')?.085:kind==='bird'?.025:kind==='kettle'?.035:.045),start+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      osc.connect(gain);overtone.connect(harmonic).connect(gain);gain.connect(voice.input);
      osc.start(start);overtone.start(start);osc.stop(start+duration+.05);overtone.stop(start+duration+.05);
      osc.onended=()=>{osc.disconnect();overtone.disconnect();harmonic.disconnect();gain.disconnect();if(--remaining===0)voice.close()};
    });
  }

}
