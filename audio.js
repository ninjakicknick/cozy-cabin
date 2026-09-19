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
      await Promise.all(['fire', 'wind', 'record'].map(name => this.load(name)));
      this.mix(this.view, this.settings);
      this.onStatus(this.layers.has('fire') && this.layers.has('wind'));
    } catch { this.onStatus(false); }
  }
  async load(name) {
    if (this.layers.has(name)) return;
    if (this.pending.has(name)) return this.pending.get(name);
    const task = (async () => {
      const paths = { fire: 'fireplace-loop.mp3', wind: 'winter-wind-loop.mp3', record: 'the-long-way-home.mp3' };
      const response = await fetch(`assets/audio/${paths[name]}`);
      if (!response.ok) throw new Error(`Missing ambience: ${name}`);
      const decoded = await this.ctx.decodeAudioData(await response.arrayBuffer());
      const overlap = Math.min(Math.floor(decoded.sampleRate * (name === 'record' ? 2 : 3)), Math.floor(decoded.length / 4));
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
      source.start(0, Math.random() * (name === 'record' ? 0 : buffer.duration));
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
    const [fire, wind, record, frequency] = mixes[view] || mixes.room;
    this.ramp(this.master.gain, settings.muted ? 0 : .8, .25);
    for (const [name, layer] of this.layers) {
      const level = name === 'fire' ? fire * (settings.emberUntil > Date.now() ? 1.12 : 1)
        : name === 'wind' ? wind * (settings.windowOpen ? 1.7 : 1)
        : settings.recordOn ? record : 0;
      this.ramp(layer.gain.gain, level);
      this.ramp(layer.filter.frequency, name === 'fire' ? frequency : name === 'wind' ? (settings.windowOpen ? 5500 : 1600) : 3200);
    }
  }
  sound(kind) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx, now = ctx.currentTime;
    const duration = kind === 'purr' ? 2.1 : kind === 'wood' ? .42 : .18;
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
    gain.gain.exponentialRampToValueAtTime(kind === 'purr' ? .16 : .065, now + .02);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    source.connect(filter).connect(gain).connect(this.master);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start();
  }
}
