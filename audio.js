import { baseArt } from './world.js?v=40';
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
      this.layers.set(name, { source, gain, filter });
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
    const [fire, wind, record, frequency] = mixes[view] || mixes[baseArt(view)] || mixes.room;
    const outside = ['porch','porchSeat','lake'].includes(view);
    this.ramp(this.master.gain, settings.muted ? 0 : .8, .25);
    for (const [name, layer] of this.layers) {
      const level = name === 'fire' ? fire * (settings.emberUntil > Date.now() ? 1.12 : 1)
        : name === 'wind' ? wind * (!outside && settings.windowOpen ? 1.4 : 1) * (settings.weatherWind || 1) * (settings.blanket && view === 'porchSeat' ? .78 : 1)
        : settings.recordOn && name === (settings.recordSide ? 'recordB' : 'record') ? record : 0;
      this.ramp(layer.gain.gain, level);
      this.ramp(layer.filter.frequency, name === 'fire' ? frequency : name === 'wind' ? (outside ? 7000 : settings.windowOpen ? 4500 : 1500) : 3200);
    }
  }
  sound(kind) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx, now = ctx.currentTime;
    if (['chime','owl','bird','lakeBell','kettle','musicbox','cup'].includes(kind)) { this.melody(kind); return; }
    const duration = kind === 'purr' ? 2.1 : kind === 'wood' || kind === 'roof' ? .65 : .18;
    const gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = kind === 'purr'
        ? (Math.sin(t * Math.PI * 2 * 94) * .55 + (Math.random() * 2 - 1) * .15) * (.55 + .45 * Math.sin(t * 2 * Math.PI * 25))
        : Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource(); source.buffer = buffer;
    filter.type = kind === 'page' ? 'highpass' : 'lowpass';
    filter.frequency.value = kind === 'page' ? 1600 : kind === 'purr' ? 280 : 520;
    gain.gain.setValueAtTime(.001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'purr' ? .12 : kind === 'roof' ? .024 : .065, now + .02);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    source.connect(filter).connect(gain).connect(this.master);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start();
  }
  melody(kind) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx=this.ctx, now=ctx.currentTime;
    const outside=['porch','porchSeat','lake'].includes(this.view);
    const patterns={chime:[880,1174.66,1318.5],owl:[310,280],bird:[1700,2300,1900],lakeBell:[392,523.25],kettle:[980,1010],musicbox:[523.25,659.25,783.99,587.33,523.25],cup:[1800]};
    const notes=patterns[kind]||patterns.chime;
    const distance=kind==='kettle'?(this.view==='kitchen'?1:.25):kind==='lakeBell'||kind==='owl'?(outside?1:.25):1;
    notes.forEach((freq,index)=>{
      const osc=ctx.createOscillator(),overtone=ctx.createOscillator(),gain=ctx.createGain(),harmonic=ctx.createGain();
      const start=now+index*(kind==='musicbox'?.68:kind==='bird'?.13:.5),duration=kind==='bird'?.18:kind==='cup'?.25:2.4;
      osc.type='sine';osc.frequency.setValueAtTime(freq,start);
      if(kind==='owl'||kind==='bird')osc.frequency.exponentialRampToValueAtTime(freq*.86,start+duration);
      overtone.frequency.value=freq*2.007;harmonic.gain.value=.12;
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime((kind==='bird'?.025:kind==='kettle'?.035:.045)*distance,start+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      osc.connect(gain);overtone.connect(harmonic).connect(gain);gain.connect(this.master);
      osc.start(start);overtone.start(start);osc.stop(start+duration+.05);overtone.stop(start+duration+.05);
      osc.onended=()=>{osc.disconnect();overtone.disconnect();harmonic.disconnect();gain.disconnect()};
    });
  }

}
