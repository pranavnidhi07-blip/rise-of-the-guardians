// Procedural audio engine (Web Audio API): music, SFX, ambient and TTS voice. No audio files needed.
import { loadSettings, saveSettings } from './save.js';
const mf = n => 440 * Math.pow(2, (n - 69) / 12);

const TRACKS = {
  home:  { bpm: 76,  wave: 'triangle', prog: [[57,60,64],[53,57,60],[60,64,67],[55,59,62]], arp: [0,1,2,1,0,1,2,1], arpOct: 12, scale: [69,72,74,76,79,81], mel: 0.35, bass: false, drums: 0 },
  level: { bpm: 108, wave: 'triangle', prog: [[50,53,57],[46,50,53],[53,57,60],[48,52,55]], arp: [0,2,1,2,0,2,1,2], arpOct: 12, scale: [62,65,67,69,72,74], mel: 0.3,  bass: true,  drums: 1 },
  boss:  { bpm: 132, wave: 'sawtooth', prog: [[52,55,59],[48,52,55],[50,54,57],[47,51,54]], arp: [0,1,2,1,2,1,0,2], arpOct: 12, scale: [64,67,69,70,71,76], mel: 0.4,  bass: true,  drums: 2 },
  level_ice:    { bpm: 92,  wave: 'sine',     prog: [[52,55,59],[48,52,55],[55,59,62],[50,54,57]], arp: [0,1,2,1,2,1,0,1], arpOct: 12, scale: [64,67,69,71,74], mel: 0.45, bass: true, drums: 1 },
  level_fire:   { bpm: 118, wave: 'sawtooth', prog: [[45,48,52],[41,45,48],[43,47,50],[40,44,47]], arp: [0,2,1,2,0,2,1,2], arpOct: 12, scale: [57,60,62,64,67], mel: 0.25, bass: true, drums: 1 },
  level_curse:  { bpm: 84,  wave: 'triangle', prog: [[50,53,56],[47,50,54],[52,55,58],[49,52,56]], arp: [0,1,2,1,0,2,1,2], arpOct: 12, scale: [62,63,66,69,70], mel: 0.3,  bass: true, drums: 0 },
  level_shadow: { bpm: 100, wave: 'sawtooth', prog: [[43,46,50],[41,44,48],[39,43,46],[40,44,47]], arp: [0,2,1,2,2,1,0,1], arpOct: 12, scale: [55,58,60,62,65], mel: 0.35, bass: true, drums: 1 },
};

class AudioManager {
  constructor() { this.s = loadSettings(); this.ctx = null; this.active = 0; this.music = null; this.amb = null; this.intensity = 0; this.want = null; this.wantAmb = null; this.last = {}; }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.connect(c.destination);
    this.bus = {};
    for (const k of ['music', 'sfx', 'ambient']) { const g = c.createGain(); g.connect(this.master); this.bus[k] = g; }
    const len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = b;
    this.applyVolumes();
    if (c.state === 'suspended') c.resume();
    if (this.want) { const w = this.want; this.want = null; this.playMusic(w); }
    if (this.wantAmb) { const w = this.wantAmb; this.wantAmb = null; this.setAmbient(w); }
  }
  applyVolumes() {
    if (!this.ctx) return; const s = this.s, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.02);
    this.bus.music.gain.setTargetAtTime(s.music, t, 0.02);
    this.bus.sfx.gain.setTargetAtTime(s.sfx, t, 0.02);
    this.bus.ambient.gain.setTargetAtTime(s.ambient, t, 0.02);
    if (s.muted || s.voice === 0) try { speechSynthesis.cancel(); } catch {}
  }
  setVol(k, v) { this.s[k] = v; saveSettings(this.s); this.applyVolumes(); }
  setMuted(m) { this.s.muted = m; saveSettings(this.s); this.applyVolumes(); }
  setIntensity(v) { this.intensity = Math.max(0, Math.min(1, v)); }

  // ---------- one-shot helpers (SFX bus) ----------
  tone(f, o = {}) {
    if (!this.ctx || this.active > 24) return;
    const c = this.ctx, d = o.d || 0.1, t = c.currentTime + (o.at || 0), det = o.exact ? 0 : (Math.random() - 0.5) * 0.08;
    const osc = c.createOscillator(), g = c.createGain(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f * (1 + det), t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to * (1 + det)), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.v || 0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g); g.connect(this.bus.sfx); osc.start(t); osc.stop(t + d + 0.05);
    this.active++; osc.onended = () => { this.active--; };
  }
  noise(d, v = 0.2, freq = 1500, type = 'lowpass', at = 0) {
    if (!this.ctx || this.active > 24) return;
    const c = this.ctx, t = c.currentTime + at, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.bus.sfx); s.start(t, Math.random()); s.stop(t + d + 0.05);
    this.active++; s.onended = () => { this.active--; };
  }
  sfx(name) {
    if (!this.ctx) return;
    const now = performance.now();
    if ((name === 'hit' || name.startsWith('shoot') || name === 'death' || name === 'hover') && now - (this.last[name] || 0) < 60) return;
    this.last[name] = now;
    switch (name) {
      case 'click': this.tone(660, { d: .08, type: 'triangle', v: .25, to: 880 }); break;
      case 'hover': this.tone(900, { d: .04, v: .06 }); break;
      case 'place': this.tone(220, { d: .15, type: 'square', v: .15, to: 440 }); this.noise(.1, .15, 800); break;
      case 'shoot_archer': this.noise(.06, .12, 3000, 'highpass'); this.tone(900, { d: .08, type: 'sawtooth', v: .06, to: 400 }); break;
      case 'shoot_cannon': this.noise(.25, .3, 300); this.tone(110, { d: .2, type: 'square', v: .2, to: 50 }); break;
      case 'shoot_frost': this.tone(1400, { d: .2, v: .1, to: 2000 }); break;
      case 'shoot_mage': this.tone(500, { d: .25, type: 'sawtooth', v: .08, to: 1200 }); break;
      case 'hit': this.noise(.05, .1, 2000); break;
      case 'death': this.tone(300, { d: .2, type: 'square', v: .12, to: 80 }); break;
      case 'coin': this.tone(1200, { d: .08, type: 'square', v: .1 }); this.tone(1600, { d: .12, type: 'square', v: .1, at: .07 }); break;
      case 'upgrade': [523, 659, 784].forEach((f, i) => this.tone(f, { d: .15, type: 'triangle', v: .2, at: i * .08, exact: true })); break;
      case 'sell': [784, 659, 523].forEach((f, i) => this.tone(f, { d: .12, type: 'triangle', v: .2, at: i * .06, exact: true })); break;
      case 'wave': this.tone(220, { d: .5, type: 'sawtooth', v: .15, exact: true }); this.tone(330, { d: .5, type: 'sawtooth', v: .15, at: .15, exact: true }); break;
      case 'life': this.tone(200, { d: .3, type: 'sawtooth', v: .22, to: 100 }); break;
      case 'meteor': this.noise(.9, .35, 400); this.tone(90, { d: .8, type: 'sawtooth', v: .25, to: 40 }); break;
      case 'freeze': this.tone(2200, { d: .6, v: .15, to: 500 }); this.noise(.5, .1, 4000, 'highpass'); break;
      case 'error': this.tone(150, { d: .15, type: 'square', v: .15 }); break;
      case 'roar': this.noise(1.1, .28, 500); this.tone(160, { d: 1.1, type: 'sawtooth', v: .22, to: 55 }); this.tone(90, { d: 1.1, type: 'square', v: .12, to: 40, at: .1 }); break;
      case 'boss': this.tone(70, { d: 1, type: 'sawtooth', v: .3, to: 45 }); this.noise(.8, .2, 200); break;
    }
  }
  stinger(name) {
    if (!this.ctx) return; this.stopMusic(0.4);
    const seq = name === 'victory' ? [[72,0],[76,.14],[79,.28],[84,.42]] : [[60,0],[57,.25],[53,.5],[48,.75]];
    seq.forEach(([n, at], i) => this.tone(mf(n), { d: i === 3 ? 1.1 : .3, type: name === 'victory' ? 'triangle' : 'sawtooth', v: .22, at, exact: true }));
  }

  // ---------- music ----------
  mt(out, f, t, dur, type, vol, slide) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, 0.06));
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  nz(out, t, dur, type, freq, vol) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  playMusic(name) {
    if (!this.ctx) { this.want = name; return; }
    if (this.curName === name) return;
    this.stopMusic(1.0); this.curName = name;
    const tr = TRACKS[name]; if (!tr) return; const c = this.ctx;
    const out = c.createGain(); out.gain.value = 0; out.gain.linearRampToValueAtTime(1, c.currentTime + 1.2); out.connect(this.bus.music);
    const m = { tr, out, step: 0, next: c.currentTime + 0.1 };
    m.timer = setInterval(() => this.tick(m), 80); this.music = m;
  }
  stopMusic(fade = 1) {
    const m = this.music; this.curName = null; this.want = null; if (!m) return;
    clearInterval(m.timer); const t = this.ctx.currentTime;
    m.out.gain.cancelScheduledValues(t); m.out.gain.setValueAtTime(m.out.gain.value, t); m.out.gain.linearRampToValueAtTime(0, t + fade);
    setTimeout(() => { try { m.out.disconnect(); } catch {} }, fade * 1000 + 600); this.music = null;
  }
  tick(m) {
    const c = this.ctx, st = 60 / m.tr.bpm / 2;
    while (m.next < c.currentTime + 0.3) { this.sched(m, m.step, m.next, st); m.next += st; m.step++; }
  }
  sched(m, step, t, st) {
    const tr = m.tr, pos = step % 8, chord = tr.prog[Math.floor(step / 8) % tr.prog.length], out = m.out, I = this.intensity;
    if (pos === 0) chord.forEach(n => this.mt(out, mf(n), t, st * 8, 'sine', 0.045));
    this.mt(out, mf(chord[tr.arp[pos]] + tr.arpOct), t, st * 0.9, tr.wave, tr.wave === 'sawtooth' ? 0.03 : 0.06);
    if (pos % 2 === 0 && Math.random() < tr.mel * (0.6 + I * 0.6)) this.mt(out, mf(tr.scale[Math.floor(Math.random() * tr.scale.length)] + 12), t, st * 1.6, 'sine', 0.06);
    if (tr.bass && pos % 4 === 0) this.mt(out, mf(chord[0] - 12), t, st * 3.6, 'triangle', 0.13);
    if (tr.drums) {
      const d = tr.drums === 2 ? 1 : I;
      if (pos % 4 === 0) this.mt(out, 140, t, 0.12, 'sine', 0.45, 45);
      if (d > 0.35) this.nz(out, t, 0.04, 'highpass', 7000, pos % 2 ? 0.03 : 0.06);
      if (d > 0.7 && (pos === 2 || pos === 6)) this.nz(out, t, 0.12, 'bandpass', 1800, 0.14);
    }
  }

  // ---------- ambient ----------
  setAmbient(name) {
    this.wantAmb = name; if (!this.ctx) return; if (this.ambName === name) return; this.ambName = name; this.stopAmb(); if (name === 'off') return;
    const PR = { home: { wg: .16, water: 1, birds: 1, crick: 1, owl: .12 }, level: { wg: .08, birds: 1, crick: 1, owl: .1 },
      ice: { wg: .22, wf: 900 }, fire: { wg: .1, wf: 200, rumble: 1, crackle: 1 }, curse: { wg: .12, wf: 300, owl: .3, crick: 1 }, shadow: { wg: .06, drone: 1 } };
    const p = PR[name] || PR.level, c = this.ctx, out = c.createGain(); out.gain.value = 0; out.gain.linearRampToValueAtTime(1, c.currentTime + 2); out.connect(this.bus.ambient);
    const nodes = [out];
    const noise = () => { const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; s.start(); nodes.push(s); return s; };
    const wind = noise(), f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = p.wf || 420; f.Q.value = 0.7;
    const wg = c.createGain(); wg.gain.value = p.wg;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.1; const lg = c.createGain(); lg.gain.value = p.wg * 0.35; lfo.connect(lg); lg.connect(wg.gain); lfo.start(); nodes.push(lfo);
    wind.connect(f); f.connect(wg); wg.connect(out);
    if (p.water) { const w = noise(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), gw = c.createGain();
      hp.type = 'highpass'; hp.frequency.value = 500; lp.type = 'lowpass'; lp.frequency.value = 2600; gw.gain.value = 0.07; w.connect(hp); hp.connect(lp); lp.connect(gw); gw.connect(out); }
    if (p.rumble) { const r = noise(), lp = c.createBiquadFilter(), gr = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = 110; gr.gain.value = 0.35; r.connect(lp); lp.connect(gr); gr.connect(out); }
    if (p.drone) [55, 55.8, 82.4].forEach(fr => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = fr; g.gain.value = 0.05; o.connect(g); g.connect(out); o.start(); nodes.push(o); });
    const timer = setInterval(() => { // birds
      if (p.birds && Math.random() < 0.7) { const base = 2200 + Math.random() * 1500, t = c.currentTime, n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) this.mt(out, base * (1 + i * 0.08), t + i * 0.11, 0.09, 'sine', 0.05, base * 1.3); }
    }, 3000);
    const timer2 = setInterval(() => { // crickets, owl, crackling fire
      const t = c.currentTime;
      if (p.crick && Math.random() < 0.6) for (let i = 0; i < 4; i++) this.mt(out, 4300, t + i * 0.07, 0.04, 'sine', 0.018);
      if (p.owl && Math.random() < p.owl) { this.mt(out, 380, t, 0.35, 'sine', 0.05, 330); this.mt(out, 360, t + 0.5, 0.45, 'sine', 0.05, 300); }
      if (p.crackle) for (let i = 0; i < 3; i++) if (Math.random() < 0.6) this.nz(out, t + Math.random() * 1.6, 0.04, 'highpass', 3000, 0.05);
    }, 1900);
    this.amb = { out, nodes, timer, timer2 };
  }
  stopAmb() {
    const a = this.amb; if (!a) return; clearInterval(a.timer); clearInterval(a.timer2); const t = this.ctx.currentTime;
    a.out.gain.cancelScheduledValues(t); a.out.gain.setValueAtTime(a.out.gain.value, t); a.out.gain.linearRampToValueAtTime(0, t + 1);
    setTimeout(() => a.nodes.forEach(n => { try { n.stop && n.stop(); n.disconnect(); } catch {} }), 1300); this.amb = null;
  }

  // ---------- voice (browser text-to-speech) ----------
  say(text) {
    if (this.s.muted || this.s.voice <= 0 || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text);
      u.volume = this.s.voice * this.s.master; u.rate = 1.05; u.pitch = 1.25; speechSynthesis.speak(u);
    } catch {}
  }
}
export const audio = new AudioManager();
