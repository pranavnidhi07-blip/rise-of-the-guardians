import Phaser from 'phaser';
import DATA from '../data/game.json';
import { audio } from '../audio.js';
import { loadSave, writeSave, defaultSave } from '../save.js';
import { WORLDS, LEVELS } from '../data/worlds.js';
import { W, H, K, cam, spr, txt, button, go, openSettings, subtitle } from '../ui.js';

const makePath = pts => { const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, cum, total: cum[cum.length - 1] }; };
const pointAt = (p, d) => { d = Phaser.Math.Clamp(d, 0, p.total); let i = 1; while (i < p.cum.length - 1 && p.cum[i] < d) i++; const a = p.pts[i - 1], b = p.pts[i], t = (d - p.cum[i - 1]) / ((p.cum[i] - p.cum[i - 1]) || 1); return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t }; };
const distSeg = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy; let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0; t = Phaser.Math.Clamp(t, 0, 1); return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy)); };
const BARKS = ['Hold the line!', 'For the Heart Crystal!', 'Here they come!', 'Steady, Guardians!'];
const MODES = ['first', 'strong', 'close'], MODE_LABEL = { first: 'First', strong: 'Strongest', close: 'Closest' };

export default class Game extends Phaser.Scene {
  constructor() { super('Game'); }
  init(d) { this.levelId = (d && d.level) || 1; }

  create() {
    this._leaving = false; this._sub = null; cam(this);
    const L = this.L = LEVELS.find(l => l.id === this.levelId), T = this.T = WORLDS[L.world]; this.S = audio.s; this.rm = this.S.reducedMotion;
    Object.assign(this, { gold: L.gold, lives: L.lives, maxLives: L.lives, waveIdx: -1, waveActive: false, queue: [], waveClock: 0, speed: 1, paused: false, over: false,
      enemies: [], towers: [], projs: [], build: null, sel: null, targeting: null, cd: { meteor: 0, freeze: 0 }, tut: L.id === 1 ? 0 : -1, ghost: null, ghostR: null, panel: null, pauseC: null, tutC: null, uid: 0 });
    this.gp = makePath(T.path); this.ap = makePath(T.air);
    this.cameras.main.fadeIn(300, 10, 18, 40);
    if (this.input.mouse) this.input.mouse.disableContextMenu();
    this.drawMap(); this.makeFx(); this.makeWeather(); this.makeHUD(); this.bindInput(); this.showPreview();
    audio.playMusic(T.music); audio.setAmbient(T.amb); audio.setIntensity(0);
    this.time.delayedCall(400, () => this.msg(`${T.name}: ${L.name}`, '#f2d479'));
    if (this.tut === 0) this.tutSay('Welcome, Guardian! Pick a tower below (or press 1-4), then click the grass to build it.');
  }

  // ---------------------------------------------------------------- map
  pathDist(x, y) { const p = this.T.path; let m = 1e9; for (let i = 1; i < p.length; i++) m = Math.min(m, distSeg(x, y, p[i - 1], p[i])); return m; }
  drawMap() {
    const g = this.add.graphics().setDepth(0), RND = Phaser.Math.RND, T = this.T, pts = T.path;
    const artKey = ['bg_map_' + T.id, 'bg_map'].find(k => this.textures.exists(k));
    this.obstacles = [];
    if (artKey) this.add.image(W / 2, H / 2, artKey).setDisplaySize(W, H).setDepth(0); // painted map: edit the path in src/data/worlds.js to match it
    else {
      g.fillGradientStyle(T.ground[0], T.ground[0], T.ground[1], T.ground[1], 1); g.fillRect(0, 0, W, H);
      RND.sow(['rotg', this.levelId]);
      for (let i = 0; i < 50; i++) { g.fillStyle(T.patch, 0.22); g.fillEllipse(RND.between(0, W), RND.between(60, 620), RND.between(60, 170), RND.between(20, 55)); }
      for (let i = 0; i < 14; i++) { g.fillStyle(T.light, T.lightA); g.fillEllipse(RND.between(0, W), RND.between(70, 600), RND.between(90, 200), RND.between(40, 80)); }
      g.lineStyle(2, T.tuft, 0.55); for (let i = 0; i < 420; i++) { const x = RND.between(0, W), y = RND.between(60, 620); g.lineBetween(x, y, x + RND.between(-3, 3), y - RND.between(4, 8)); }
      if (T.extras === 'ice') {
        for (let i = 0; i < 18; i++) { g.fillStyle(0xbfe3f5, 0.5); g.fillEllipse(RND.between(0, W), RND.between(70, 610), RND.between(80, 190), RND.between(24, 50)); }
        for (let i = 0; i < 70; i++) { g.fillStyle(0xffffff, 0.85); g.fillCircle(RND.between(0, W), RND.between(60, 620), RND.between(1, 2)); }
      }
      if (T.extras === 'void') {
        g.lineStyle(2, 0xb080ff, 0.55);
        for (let i = 0; i < 24; i++) { let x = RND.between(0, W), y = RND.between(70, 610); for (let k = 0; k < 4; k++) { const nx = x + RND.between(-50, 50), ny = y + RND.between(-30, 30); g.lineBetween(x, y, nx, ny); x = nx; y = ny; } }
      }
      if (T.extras === 'lava') {
        let n = 0, tr = 0;
        while (n < 7 && tr++ < 200) {
          const x = RND.between(60, 1220), y = RND.between(110, 600), rw = RND.between(70, 120);
          if (this.pathDist(x, y) < 88 + rw * 0.3 || Math.hypot(x - T.end[0], y - T.end[1]) < 130 || this.obstacles.some(o => Math.hypot(o.x - x, o.y - y) < 110)) continue;
          n++; g.fillStyle(0x2a0f08, 1); g.fillEllipse(x, y, rw + 14, rw * 0.5 + 10); g.fillStyle(0xff5a1a, 0.95); g.fillEllipse(x, y, rw, rw * 0.5); g.fillStyle(0xffd23f, 0.85); g.fillEllipse(x, y, rw * 0.5, rw * 0.22);
          this.obstacles.push({ x, y, r: rw * 0.42 });
          const gl = spr(this, x, y, 'particle').setTint(0xff7a2a).setBlendMode('ADD').setScale(rw / 14).setAlpha(0.35).setDepth(2);
          if (!this.rm) this.tweens.add({ targets: gl, alpha: 0.15, yoyo: true, repeat: -1, duration: 1100 + n * 150 });
        }
      }
      const stroke = (w, col, a = 1) => { g.lineStyle(w, col, a); g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokePath(); g.fillStyle(col, a); pts.forEach(p => g.fillCircle(p[0], p[1], w / 2)); };
      const pc = T.pathCols; stroke(76, pc[0], 0.5); stroke(68, pc[1]); stroke(60, pc[2]); stroke(52, pc[3]); stroke(30, pc[4], 0.45);
      for (let i = 1; i < pts.length; i++) { const [a1, b1] = [pts[i - 1], pts[i]], n = Math.floor(Math.hypot(b1[0] - a1[0], b1[1] - a1[1]) / 18);
        for (let k = 0; k < n; k++) { const t = k / n, x = a1[0] + (b1[0] - a1[0]) * t + RND.between(-18, 18), y = a1[1] + (b1[1] - a1[1]) * t + RND.between(-18, 18); g.fillStyle(RND.pick(T.pebbles), 0.45); g.fillEllipse(x, y, RND.between(5, 10), RND.between(3, 6)); } }
      const bag = []; T.decor.forEach(d => { for (let i = 0; i < d.w; i++) bag.push(d); });
      let tries = 0, placed = 0;
      while (placed < 18 && tries++ < 600) {
        const x = RND.between(40, 1240), y = RND.between(130, 600);
        if (this.pathDist(x, y) < 78 || Math.hypot(x - T.end[0], y - T.end[1]) < 120 || this.obstacles.some(o => Math.hypot(o.x - x, o.y - y) < 100)) continue;
        const d = RND.pick(bag); placed++; this.obstacles.push({ x, y: y - 10, r: d.r });
        const im = spr(this, x, y, d.k).setOrigin(0.5, 1).setDepth(y).setScale(d.s); if (d.tint) im.setTint(d.tint);
        if (!this.rm && d.k.startsWith('tree') && tries % 3 === 0) this.tweens.add({ targets: im, angle: { from: -1.5, to: 1.5 }, duration: 2000 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      if (T.flowers) { const cols = [0xffffff, 0xffb3e0, 0xffe27a, 0xc9a8ff]; for (let i = 0; i < 80; i++) { const x = RND.between(10, 1270), y = RND.between(90, 610); if (this.pathDist(x, y) < 40) continue; spr(this, x, y, 'flower').setOrigin(0.5, 1).setDepth(1).setTint(RND.pick(cols)).setScale(0.45); } }
    }
    for (let i = 0; i < 3; i++) { const r = spr(this, 250 + i * 380, 60, 'ray').setOrigin(0.5, 0).setScale(1.7, 1.5).setAngle(-14 + i * 4).setTint(T.ray).setBlendMode('ADD').setAlpha(0.09).setDepth(3);
      if (!this.rm) this.tweens.add({ targets: r, alpha: 0.03, yoyo: true, repeat: -1, duration: 4000 + i * 800 }); }
    this.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W, H).setDepth(850);
    // heart crystal (base) + spawn portal
    const [bx, by] = T.end;
    const glow = spr(this, bx + 20, by - 30, 'particle').setTint(T.crystal).setBlendMode('ADD').setScale(14).setDepth(5).setAlpha(0.7);
    this.base = spr(this, bx + 25, by + 40, 'crystal').setOrigin(0.5, 1).setScale(0.85).setDepth(by + 50); if (T.id > 0) this.base.setTint(T.crystal);
    const portal = spr(this, 20, pts[0][1], 'particle').setTint(0x8a56e0).setBlendMode('ADD').setScale(9).setDepth(5);
    if (!this.rm) { this.tweens.add({ targets: glow, alpha: 0.3, yoyo: true, repeat: -1, duration: 1200 }); this.tweens.add({ targets: portal, scale: 7, yoyo: true, repeat: -1, duration: 900 }); }
    if (this.S.mist) for (let i = 0; i < 3; i++) { const m = spr(this, 200 + i * 450, 130 + i * 90, 'mist').setScale(3.4).setAlpha(T.id === 2 ? 0.3 : 0.2).setDepth(2); if (T.id === 2) m.setTint(0x442a22); if (T.id === 3) m.setTint(0x88aa99); if (!this.rm) this.tweens.add({ targets: m, x: m.x + 120, duration: 12000 + i * 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }
    this.hb = this.add.graphics().setDepth(300); this.selG = this.add.graphics().setDepth(480);
  }
  makeWeather() {
    const T = this.T, f = this.rm ? 260 : 110, X = { min: 0, max: W }; let cfg = null, tint = 0xffffff;
    switch (T.weather) {
      case 'snow': cfg = { x: X, y: -10, lifespan: 9000, speedY: { min: 40, max: 90 }, speedX: { min: -25, max: 25 }, scale: { min: 0.15, max: 0.4 }, alpha: { min: 0.5, max: 0.95 }, frequency: f, quantity: 1 }; break;
      case 'leaves': cfg = { x: X, y: -10, lifespan: 9000, speedY: { min: 25, max: 55 }, speedX: { min: 10, max: 40 }, scale: { min: 0.2, max: 0.35 }, alpha: 0.8, frequency: f * 3, quantity: 1 }; tint = 0xa8d86a; break;
      case 'embers': cfg = { x: X, y: 730, lifespan: 6000, speedY: { min: -130, max: -60 }, speedX: { min: -30, max: 30 }, scale: { start: 0.35, end: 0 }, alpha: { start: 1, end: 0 }, frequency: f * 0.8, quantity: 1, blendMode: 'ADD' }; tint = 0xff8a3a; break;
      case 'wisps': cfg = { x: X, y: { min: 300, max: 700 }, lifespan: 7000, speedY: { min: -25, max: -8 }, speedX: { min: -15, max: 15 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.6, end: 0 }, frequency: f * 1.5, quantity: 1, blendMode: 'ADD' }; tint = 0x9aff9a; break;
      case 'motes': cfg = { x: X, y: { min: 200, max: 700 }, lifespan: 8000, speedY: { min: -30, max: -10 }, speedX: { min: -20, max: 20 }, scale: { start: 0.45, end: 0 }, alpha: { start: 0.7, end: 0 }, frequency: f * 1.2, quantity: 1, blendMode: 'ADD' }; tint = 0xc08aff; break;
    }
    if (cfg) { cfg.tint = tint; this.add.particles(0, 0, 'particle', cfg).setDepth(700); }
    if (!this.rm && (T.weather === 'wisps' || T.weather === 'motes')) this.time.addEvent({ delay: 13000, loop: true, callback: () => { if (!this.paused && !this.over) this.cameras.main.flash(140, 170, 170, 255); } });
  }
  makeFx() {
    const mk = (tint, sp, life, sc) => this.add.particles(0, 0, 'particle', { speed: { min: sp * 0.4, max: sp }, lifespan: life, scale: { start: sc, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false, tint }).setDepth(260);
    this.fx = { death: mk(0xff7a4a, 160, 450, 0.5), hit: mk(0xffffff, 90, 250, 0.3), coin: mk(0xffd23f, 120, 500, 0.35), magic: mk(0xb388ff, 150, 500, 0.45), ice: mk(0x8fe3ff, 120, 450, 0.4), up: mk(0xf2d479, 170, 600, 0.4) };
  }
  burst(k, x, y, n) { this.fx[k].explode(this.rm ? Math.ceil(n / 3) : n, x, y); }

  // ---------------------------------------------------------------- HUD
  makeHUD() {
    const d = 900, bar = this.add.graphics().setDepth(d);
    bar.fillStyle(0x0e1b38, 0.92); bar.fillRect(0, 0, W, 56); bar.fillRect(0, 628, W, 92); bar.lineStyle(3, 0xf2d479, 1); bar.lineBetween(0, 56, W, 56); bar.lineBetween(0, 628, W, 628);
    this.hud = {};
    spr(this, 34, 28, 'i_heart').setDepth(d + 1); this.hud.lives = txt(this, 56, 28, '', 24, '#fff', { ox: 0, bold: true }).setDepth(d + 1);
    spr(this, 160, 28, 'i_coin').setDepth(d + 1); this.hud.gold = txt(this, 182, 28, '', 24, '#ffd23f', { ox: 0, bold: true }).setDepth(d + 1);
    this.hud.wave = txt(this, 300, 28, '', 22, '#fff', { ox: 0, bold: true }).setDepth(d + 1);
    this.prevC = this.add.container(0, 0).setDepth(d + 1);
    this.bSpeed = button(this, 830, 28, 70, 38, '1x', () => this.toggleSpeed(), { size: 18 }).setDepth(d + 1);
    this.bPause = button(this, 915, 28, 96, 38, 'Pause', () => this.togglePause(), { size: 18 }).setDepth(d + 1);
    this.bSet = button(this, 1025, 28, 116, 38, 'Settings', () => this.openSet(), { size: 18 }).setDepth(d + 1);
    this.bQuit = button(this, 1135, 28, 90, 38, 'Map', () => go(this, 'Map', { world: this.L.world }), { size: 18, color: 0x6b3fb5, hover: 0x8a56e0 }).setDepth(d + 1);
    this.tbtn = {};
    Object.keys(DATA.towers).forEach((k, i) => {
      const t = DATA.towers[k];
      const b = button(this, 105 + i * 165, 674, 156, 76, '', () => this.pickTower(k), { size: 14, onDisabled: () => this.msg('Not enough gold!', '#ff8a7a') });
      b.add([spr(this, -52, -2, 't_' + k).setScale(0.38), txt(this, 20, -20, t.name, 18, '#fff', { bold: true }), txt(this, 20, 3, t.cost + ' gold', 16, '#ffd23f'), txt(this, 20, 24, '[' + (i + 1) + ']', 13, '#bcd')]);
      b.setDepth(d + 1); this.tbtn[k] = b;
    });
    this.bMeteor = button(this, 745, 674, 112, 76, 'Meteor\n[M]', () => this.useMeteor(), { size: 17, color: 0xb5472f, hover: 0xd65b3e }).setDepth(d + 1);
    this.bFreeze = button(this, 865, 674, 112, 76, 'Freeze\n[F]', () => this.useFreeze(), { size: 17, color: 0x2e7fbf, hover: 0x4a9fe0 }).setDepth(d + 1);
    this.bStart = button(this, 1160, 674, 200, 76, 'Start Wave 1', () => this.startWave(), { size: 22, color: 0x2f9e4a, hover: 0x45c262 }).setDepth(d + 1);
    this.toast = txt(this, W / 2, 160, '', 26, '#fff', { bold: true }).setDepth(950).setAlpha(0);
    this._l = this._g = this._w = this._m = this._f = null;
  }
  hudUpdate() {
    if (this._l !== this.lives) { this._l = this.lives; this.hud.lives.setText(this.lives + '/' + this.maxLives); }
    if (this._g !== this.gold) {
      this._g = this.gold; this.hud.gold.setText(String(Math.floor(this.gold)));
      Object.keys(this.tbtn).forEach(k => this.tbtn[k].setDisabled(this.gold < DATA.towers[k].cost));
      if (this.panel && this.panel.up) this.panel.up.setDisabled(this.panel.tw.tier >= 3 || this.gold < DATA.towers[this.panel.tw.type].upgrades[this.panel.tw.tier - 1]);
    }
    const w = Math.max(0, this.waveIdx + 1); if (this._w !== w) { this._w = w; this.hud.wave.setText('Wave ' + w + '/' + this.L.waves.length); }
    const m = Math.ceil(this.cd.meteor), f = Math.ceil(this.cd.freeze);
    if (m !== this._m) { this._m = m; this.bMeteor.setLabel(m > 0 ? `Meteor\n${m}s` : 'Meteor\n[M]'); this.bMeteor.setDisabled(m > 0); }
    if (f !== this._f) { this._f = f; this.bFreeze.setLabel(f > 0 ? `Freeze\n${f}s` : 'Freeze\n[F]'); this.bFreeze.setDisabled(f > 0); }
  }
  showPreview() {
    this.prevC.removeAll(true); const nx = this.waveIdx + 1, waves = this.L.waves;
    if (nx >= waves.length) return;
    this.prevC.add(txt(this, 420, 28, this.waveActive ? 'Next:' : 'Coming:', 18, '#cfeff0', { ox: 0 }));
    let x = 500; waves[nx].forEach(g => { const im = this.add.image(x, 28, 'e_' + g.t); im.setScale(32 / im.height); this.prevC.add([im, txt(this, x + 22, 28, 'x' + g.n, 18, '#fff', { ox: 0, bold: true })]); x += 84; });
  }
  msg(s, color = '#fff') { this.toast.setText(s).setColor(color).setAlpha(1); this.tweens.killTweensOf(this.toast); this.tweens.add({ targets: this.toast, alpha: 0, delay: 1700, duration: 500 }); }
  bark(line) { subtitle(this, line, 604); }
  tutSay(text) {
    if (this.tutC) this.tutC.destroy();
    const c = this.add.container(0, 0).setDepth(940), g = this.add.graphics();
    g.fillStyle(0x14284b, 0.94); g.fillRoundedRect(110, 66, 560, 72, 14); g.lineStyle(2, 0xf2d479); g.strokeRoundedRect(110, 66, 560, 72, 14);
    const f = spr(this, 68, 104, 'fairy').setScale(0.55);
    c.add([g, f, txt(this, 390, 102, text, 17, '#fff', { w: 520, align: 'center' })]); this.tutC = c; audio.say(text);
    if (!this.rm) this.tweens.add({ targets: f, y: 98, yoyo: true, repeat: -1, duration: 700 });
  }
  tutEvent(e) {
    if (this.tut < 0) return;
    if (this.tut === 0 && e === 'placed') { this.tut = 1; this.tutSay('Nice! Click your tower to upgrade it, sell it or change its aim.'); }
    else if (this.tut === 1 && e === 'selected') { this.tut = 2; this.tutSay('Now press Start Wave. Enemies that reach the crystal cost lives!'); }
    else if (this.tut === 2 && e === 'wave') { this.tut = -1; this.tutSay('Use Meteor and Freeze when things get tough. Cannons cannot hit flyers!'); this.time.delayedCall(8000, () => { if (this.tutC) { this.tutC.destroy(); this.tutC = null; } }); }
  }

  // ---------------------------------------------------------------- input
  bindInput() {
    const kb = this.input.keyboard, keys = Object.keys(DATA.towers);
    kb.on('keydown-SPACE', () => this.togglePause());
    kb.on('keydown-ESC', () => { if (this.build || this.sel || this.targeting) this.cancelAll(); else this.togglePause(); });
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((n, i) => kb.on('keydown-' + n, () => this.pickTower(keys[i])));
    kb.on('keydown-ENTER', () => this.startWave()); kb.on('keydown-N', () => this.startWave());
    kb.on('keydown-M', () => this.useMeteor()); kb.on('keydown-F', () => this.useFreeze()); kb.on('keydown-X', () => this.toggleSpeed());
    this.input.on('pointermove', p => this.moveGhost(p));
    this.input.on('pointerdown', (p, over) => { if (this.paused || this.over || over.length) return; this.mapClick(p); });
  }
  mapClick(p) {
    if (p.rightButtonDown()) { this.cancelAll(); return; }
    const x = p.worldX, y = p.worldY;
    if (this.targeting === 'meteor') { if (y > 60 && y < 626) this.castMeteor(x, y); return; }
    if (this.build) { this.moveGhost(p); this.tryPlace(x, y); return; }
    this.deselect();
  }
  cancelAll() {
    this.build = null; this.targeting = null; if (this.ghost) { this.ghost.destroy(); this.ghost = null; } if (this.ghostR) { this.ghostR.destroy(); this.ghostR = null; } this.deselect();
  }
  pickTower(k) {
    if (this.over || this.paused) return; const d = DATA.towers[k];
    if (this.build === k) { this.cancelAll(); return; }
    if (this.gold < d.cost) { this.msg('Not enough gold for ' + d.name + '!', '#ff8a7a'); audio.sfx('error'); return; }
    this.cancelAll(); this.build = k; const p = this.input.activePointer;
    this.ghost = spr(this, p.worldX, p.worldY, 't_' + k).setAlpha(0.8).setDepth(500); this.ghostR = this.add.graphics().setDepth(499); this.moveGhost(p);
  }
  canPlace(x, y) {
    if (x < 30 || x > 1250 || y < 82 || y > 596) return false;
    if (this.pathDist(x, y) < 44) return false;
    if (this.towers.some(t => Math.hypot(t.x - x, t.y - y) < 50)) return false;
    if (this.obstacles.some(o => Math.hypot(o.x - x, o.y - y) < o.r + 16)) return false;
    return Math.hypot(x - (this.T.end[0] + 25), y - this.T.end[1]) > 70;
  }
  moveGhost(p) {
    if (!this.build || !this.ghost) return; const x = p.worldX, y = p.worldY, ok = this.canPlace(x, y), r = DATA.towers[this.build].range;
    this.ghost.setPosition(x, y); ok ? this.ghost.clearTint() : this.ghost.setTint(0xff5555);
    this.ghostR.clear().fillStyle(ok ? 0x66ff99 : 0xff6666, 0.15).fillCircle(x, y, r).lineStyle(2, ok ? 0x66ff99 : 0xff6666, 0.8).strokeCircle(x, y, r);
  }
  tryPlace(x, y) {
    const k = this.build, d = DATA.towers[k];
    if (this.gold < d.cost) { this.msg('Not enough gold!', '#ff8a7a'); audio.sfx('error'); return; }
    if (!this.canPlace(x, y)) { this.msg("Can't build there!", '#ff8a7a'); audio.sfx('error'); return; }
    this.gold -= d.cost;
    const sprite = spr(this, x, y, 't_' + k).setDepth(y).setInteractive({ useHandCursor: true });
    const tw = { type: k, x, y, tier: 1, cd: 0.3, mode: 'first', invested: d.cost, sprite, pips: this.add.graphics().setDepth(y + 1) };
    sprite.on('pointerdown', () => { if (this.paused || this.over || this.build || this.targeting) return; this.select(tw); });
    this.drawPips(tw); this.towers.push(tw); audio.sfx('place'); this.burst('up', x, y, 10);
    this.tweens.add({ targets: sprite, scale: { from: 0.2, to: 1 / K }, duration: 200, ease: 'Back.easeOut' });
    this.cancelAll(); this.tutEvent('placed');
  }
  drawPips(tw) { tw.pips.clear().fillStyle(0xf2d479, 1); for (let i = 0; i < tw.tier; i++) tw.pips.fillCircle(tw.x - (tw.tier - 1) * 5 + i * 10, tw.y + 30, 3.2); }
  tstat(tw) { const d = DATA.towers[tw.type], m = 1 + 0.6 * (tw.tier - 1); return { dmg: d.dmg * m, range: d.range * (1 + 0.08 * (tw.tier - 1)), rate: d.rate * (1 - 0.12 * (tw.tier - 1)) }; }
  select(tw) {
    this.cancelAll(); this.sel = tw; audio.sfx('click'); this.showPanel(tw); this.tutEvent('selected');
  }
  deselect() { this.sel = null; this.selG.clear(); if (this.panel) { this.panel.c.destroy(); this.panel = null; } }
  showPanel(tw) {
    if (this.panel) this.panel.c.destroy();
    const d = DATA.towers[tw.type], st = this.tstat(tw), px = tw.x > 900 ? tw.x - 250 : tw.x + 40, py = Phaser.Math.Clamp(tw.y - 80, 70, 460);
    this.selG.clear().lineStyle(2, 0xffffff, 0.8).fillStyle(0xffffff, 0.1).fillCircle(tw.x, tw.y, st.range).strokeCircle(tw.x, tw.y, st.range);
    const c = this.add.container(px, py).setDepth(950), g = this.add.graphics();
    g.fillStyle(0x14284b, 0.96); g.fillRoundedRect(0, 0, 210, 160, 12); g.lineStyle(2, 0xf2d479); g.strokeRoundedRect(0, 0, 210, 160, 12);
    c.add([g, txt(this, 105, 20, `${d.name}  Lv ${tw.tier}`, 19, '#f2d479', { bold: true }), txt(this, 105, 44, `Damage ${Math.round(st.dmg)}   Range ${Math.round(st.range)}`, 14, '#fff')]);
    const cost = tw.tier < 3 ? d.upgrades[tw.tier - 1] : 0;
    const up = button(this, 105, 80, 190, 36, tw.tier < 3 ? `Upgrade (${cost}g)` : 'Max level', () => this.upgrade(tw), { size: 16, onDisabled: () => this.msg(tw.tier >= 3 ? 'Already max level' : 'Not enough gold!', '#ff8a7a'), color: 0x2f9e4a, hover: 0x45c262 });
    up.setDisabled(tw.tier >= 3 || this.gold < cost);
    const sell = button(this, 55, 128, 92, 34, 'Sell +' + Math.floor(tw.invested * 0.7), () => this.sell(tw), { size: 14, color: 0xb5472f, hover: 0xd65b3e });
    const aim = button(this, 155, 128, 100, 34, 'Aim: ' + MODE_LABEL[tw.mode], () => { tw.mode = MODES[(MODES.indexOf(tw.mode) + 1) % 3]; this.showPanel(tw); }, { size: 13, color: 0x6b3fb5, hover: 0x8a56e0 });
    c.add([up, sell, aim]); this.panel = { c, tw, up };
  }
  upgrade(tw) {
    const d = DATA.towers[tw.type], cost = d.upgrades[tw.tier - 1]; if (tw.tier >= 3 || this.gold < cost) return;
    this.gold -= cost; tw.tier++; tw.invested += cost; this.drawPips(tw); audio.sfx('upgrade'); this.burst('up', tw.x, tw.y, 14);
    this.tweens.add({ targets: tw.sprite, scale: 1.25 / K, duration: 120, yoyo: true }); this.showPanel(tw);
  }
  sell(tw) { this.gold += Math.floor(tw.invested * 0.7); audio.sfx('sell'); this.burst('coin', tw.x, tw.y, 10); tw.sprite.destroy(); tw.pips.destroy(); this.towers = this.towers.filter(t => t !== tw); this.deselect(); }

  // ---------------------------------------------------------------- game flow
  toggleSpeed() { this.speed = this.speed === 1 ? 2 : 1; this.bSpeed.setLabel(this.speed + 'x'); }
  togglePause() {
    if (this.over) return; this.paused = !this.paused;
    if (this.paused) {
      const c = this.add.container(0, 0).setDepth(1500), z = this.add.rectangle(W / 2, H / 2, W, H, 0, 0.6).setInteractive(), p = this.add.graphics();
      p.fillStyle(0x14284b, 1); p.fillRoundedRect(450, 160, 380, 400, 20); p.lineStyle(3, 0xf2d479); p.strokeRoundedRect(450, 160, 380, 400, 20);
      c.add([z, p, txt(this, W / 2, 210, 'Paused', 38, '#f2d479', { bold: true }),
        button(this, W / 2, 285, 260, 54, 'Resume', () => this.togglePause(), { size: 22, color: 0x2f9e4a, hover: 0x45c262 }),
        button(this, W / 2, 355, 260, 54, 'Restart Level', () => this.scene.restart({ level: this.levelId }), { size: 22 }),
        button(this, W / 2, 425, 260, 54, 'Settings', () => openSettings(this, () => {}), { size: 22 }),
        button(this, W / 2, 495, 260, 54, 'Quit to Map', () => go(this, 'Map', { world: this.L.world }), { size: 22, color: 0x6b3fb5, hover: 0x8a56e0 })]);
      this.pauseC = c; this.bPause.setLabel('Resume');
    } else { if (this.pauseC) this.pauseC.destroy(); this.pauseC = null; this.bPause.setLabel('Pause'); }
  }
  openSet() { const was = this.paused; this.paused = true; openSettings(this, () => { this.paused = was; }); }
  startWave() {
    if (this.over || this.paused || this.waveActive) return;
    this.waveIdx++; if (this.waveIdx >= this.L.waves.length) { this.waveIdx = this.L.waves.length - 1; return; }
    const wave = this.L.waves[this.waveIdx]; this.queue = []; let t = 0;
    wave.forEach(g => { for (let i = 0; i < g.n; i++) { this.queue.push({ t, type: g.t }); t += g.i; } t += 1.2; });
    this.waveClock = 0; this.waveActive = true; audio.sfx('wave');
    const boss = wave.some(g => g.t === 'boss');
    if (boss) { audio.playMusic('boss'); audio.sfx('roar'); this.bark(this.T.bossName + ' approaches!'); } else { audio.setIntensity(this.waveIdx / Math.max(1, this.L.waves.length - 1)); this.bark(Phaser.Utils.Array.GetRandom(BARKS)); }
    this.bStart.setLabel('Wave in progress').setDisabled(true); this.showPreview(); this.tutEvent('wave');
  }
  endWave() {
    this.waveActive = false; const bonus = 15 + this.waveIdx * 5; this.gold += bonus; audio.sfx('coin'); this.burst('coin', 640, 360, 16);
    if (this.waveIdx >= this.L.waves.length - 1) { this.victory(); return; }
    this.msg(`Wave cleared! +${bonus} gold`, '#ffd23f'); this.bStart.setLabel('Start Wave ' + (this.waveIdx + 2)).setDisabled(false); this.showPreview();
  }
  victory() {
    this.over = true; audio.stinger('victory'); this.bark('Victory!');
    const r = this.lives / this.maxLives, stars = r >= 0.8 ? 3 : r >= 0.4 ? 2 : 1;
    const sv = loadSave() || defaultSave(); sv.stars[this.levelId] = Math.max(sv.stars[this.levelId] || 0, stars);
    sv.unlocked = Math.max(sv.unlocked, Math.min(this.levelId + 1, LEVELS.length)); writeSave(sv);
    this.time.delayedCall(1800, () => go(this, 'Result', { win: true, level: this.levelId, stars, lives: this.lives }));
  }
  defeat() { this.over = true; audio.stinger('defeat'); this.cancelAll(); this.time.delayedCall(1500, () => go(this, 'Result', { win: false, level: this.levelId, stars: 0, lives: 0 })); }

  // ---------------------------------------------------------------- abilities
  useMeteor() {
    if (this.over || this.paused) return;
    if (this.cd.meteor > 0) { this.msg('Meteor is recharging...'); audio.sfx('error'); return; }
    this.cancelAll(); this.targeting = 'meteor'; this.msg('Click the battlefield to call the Meteor!', '#ffb347');
  }
  castMeteor(x, y) {
    this.targeting = null; this.cd.meteor = 25; audio.sfx('meteor'); this.bark('Meteor incoming!');
    const m = spr(this, x + 140, y - 460, 'p_magic').setScale(4 / K).setDepth(700).setTint(0xff8a3a);
    this.tweens.add({ targets: m, x, y, duration: 550, ease: 'Quad.easeIn', onComplete: () => {
      m.destroy(); this.cameras.main.shake(this.rm ? 0 : 250, 0.008); this.burst('death', x, y, 36); this.burst('magic', x, y, 20);
      const ring = this.add.circle(x, y, 10, 0xffb347, 0.5).setDepth(340); this.tweens.add({ targets: ring, scale: 9.5, alpha: 0, duration: 400, onComplete: () => ring.destroy() });
      this.enemies.slice().forEach(e => { if (!e.dead && Math.hypot(e.x - x, e.y - y) < 95 + e.r) this.damageEnemy(e, 160, true); });
    } });
  }
  useFreeze() {
    if (this.over || this.paused) return;
    if (this.cd.freeze > 0) { this.msg('Freeze is recharging...'); audio.sfx('error'); return; }
    this.cd.freeze = 30; audio.sfx('freeze'); this.bark('Freeze!'); this.cameras.main.flash(250, 140, 210, 255);
    this.enemies.forEach(e => { if (!e.dead) { this.slowEnemy(e, 0.12, 3.5); this.burst('ice', e.x, e.y, 5); } });
  }

  // ---------------------------------------------------------------- enemies
  spawn(type, startD = 0) {
    const d = DATA.enemies[type], T = this.T, boss = type === 'boss', sc = boss ? T.bossScale : 1, tint = boss ? T.bossTint : T.enemyTint, path = d.air ? this.ap : this.gp, p = pointAt(path, startD), s = spr(this, p.x, p.y, 'e_' + type).setDepth(200).setScale(sc / K);
    if (tint) s.setTint(tint);
    const hp = d.hp * (this.L.hpMul || 1);
    this.enemies.push({ id: this.uid++, type, hp, maxHp: hp, speed: d.speed, reward: d.reward, lives: d.lives, armor: d.armor || 0, air: !!d.air, heal: !!d.heal, r: d.r * sc, baseTint: tint,
      path, d: startD, x: p.x, y: p.y, sprite: s, slowF: 1, slowT: 0, dead: false, healT: 1, enraged: false });
  }
  restoreTint(e) { const c = e.enraged ? 0xff7766 : e.baseTint; c ? e.sprite.setTint(c) : e.sprite.clearTint(); }
  slowEnemy(e, f, t) { e.slowF = Math.min(e.slowF, f); e.slowT = Math.max(e.slowT, t); e.sprite.setTint(0x8fd8ff); }
  damageEnemy(e, dmg, ignoreArmor) {
    if (e.dead) return; const real = Math.max(1, Math.round(dmg - (ignoreArmor ? 0 : e.armor))); e.hp -= real;
    this.floatText(e.x, e.y - 20, real); audio.sfx('hit');
    if (e.type === 'boss' && !e.enraged && e.hp < e.maxHp * 0.5 && e.hp > 0) {
      e.enraged = true; this.restoreTint(e); audio.sfx('roar'); this.msg('The boss is enraged!', '#ff8a7a'); this.cameras.main.shake(this.rm ? 0 : 250, 0.006);
      for (let i = 0; i < 3; i++) this.spawn('runner', Math.max(0, e.d - 20 - i * 25));
    }
    if (e.hp <= 0) this.killEnemy(e);
  }
  killEnemy(e) {
    if (e.dead) return; e.dead = true; this.gold += e.reward; audio.sfx('death'); audio.sfx('coin');
    this.burst('death', e.x, e.y, e.type === 'boss' ? 40 : 10); this.burst('coin', e.x, e.y, 4); this.floatText(e.x, e.y - 34, '+' + e.reward, '#ffd23f'); e.sprite.destroy();
    if (e.type === 'boss') this.cameras.main.shake(this.rm ? 0 : 400, 0.01);
  }
  reachBase(e) {
    if (e.dead || this.over) return; e.dead = true; e.sprite.destroy(); this.lives = Math.max(0, this.lives - e.lives);
    audio.sfx('life'); this.cameras.main.shake(this.rm ? 0 : 150, 0.005); this.msg(`-${e.lives} life${e.lives > 1 ? 's' : ''}!`, '#ff8a7a'); this.burst('magic', e.x, e.y, 10);
    if (this.lives <= 0) this.defeat();
  }
  floatText(x, y, s, color = '#fff') { const t = txt(this, x, y, String(s), 16, color, { bold: true }).setDepth(600); this.tweens.add({ targets: t, y: y - 26, alpha: 0, duration: 650, onComplete: () => t.destroy() }); }

  // ---------------------------------------------------------------- simulation
  update(time, delta) {
    this.hudUpdate(); if (this.paused || this.over) return;
    const dt = Math.min(delta, 50) / 1000 * this.speed;
    this.cd.meteor = Math.max(0, this.cd.meteor - dt); this.cd.freeze = Math.max(0, this.cd.freeze - dt);
    if (this.waveActive) { this.waveClock += dt; while (this.queue.length && this.queue[0].t <= this.waveClock) this.spawn(this.queue.shift().type); }
    this.updateEnemies(dt, time); this.updateTowers(dt); this.updateProjs(dt);
    if (this.waveActive && !this.queue.length && !this.enemies.length && !this.over) this.endWave();
    this.drawBars();
  }
  updateEnemies(dt, time) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) { e.slowF = 1; this.restoreTint(e); } }
      if (e.heal) { e.healT -= dt; if (e.healT <= 0) { e.healT = 1.6; for (const o of this.enemies) if (!o.dead && o !== e && o.hp < o.maxHp && Math.hypot(o.x - e.x, o.y - e.y) < 110) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.1); } }
      e.d += e.speed * e.slowF * (e.enraged ? 1.6 : 1) * dt;
      const p = pointAt(e.path, e.d); e.x = p.x; e.y = p.y;
      e.sprite.setPosition(p.x, p.y - (e.air ? 12 : 0)).setDepth(e.air ? 400 : 200 + p.y / 10);
      if (!this.rm) e.sprite.angle = Math.sin(time / 110 + e.id) * 5;
      if (e.d >= e.path.total) this.reachBase(e);
    }
    this.enemies = this.enemies.filter(e => !e.dead);
  }
  pickTarget(tw, st) {
    const d = DATA.towers[tw.type]; let best = null, bv = -1e9;
    for (const e of this.enemies) {
      if (e.dead || (e.air && !d.air)) continue; const dist = Math.hypot(e.x - tw.x, e.y - tw.y); if (dist > st.range + e.r * 0.5) continue;
      const v = tw.mode === 'first' ? e.d / e.path.total : tw.mode === 'strong' ? e.hp : -dist; if (v > bv) { bv = v; best = e; }
    }
    return best;
  }
  updateTowers(dt) {
    for (const tw of this.towers) {
      tw.cd -= dt; if (tw.cd > 0) continue; const st = this.tstat(tw), tgt = this.pickTarget(tw, st); if (!tgt) continue;
      tw.cd = st.rate; const d = DATA.towers[tw.type]; audio.sfx('shoot_' + tw.type);
      const sy = tw.y - 14, s = spr(this, tw.x, sy, d.proj).setDepth(350);
      this.projs.push({ s, x: tw.x, y: sy, t: tgt, tx: tgt.x, ty: tgt.y, speed: d.speed, dmg: st.dmg, splash: d.splash || 0, slow: d.slow || 0, slowTime: d.slowTime || 0, type: tw.type });
      this.tweens.add({ targets: tw.sprite, scale: 1.1 / K, duration: 70, yoyo: true });
    }
  }
  updateProjs(dt) {
    for (const p of this.projs) {
      if (!p.t.dead) { p.tx = p.t.x; p.ty = p.t.y; }
      const dx = p.tx - p.x, dy = p.ty - p.y, dist = Math.hypot(dx, dy), step = p.speed * dt;
      if (dist <= step + 4) { this.impact(p); p.done = true; p.s.destroy(); continue; }
      p.x += dx / dist * step; p.y += dy / dist * step; p.s.setPosition(p.x, p.y); if (p.type === 'archer') p.s.setRotation(Math.atan2(dy, dx));
    }
    this.projs = this.projs.filter(p => !p.done);
  }
  impact(p) {
    if (p.splash) {
      this.burst('death', p.tx, p.ty, 12); const r = this.add.circle(p.tx, p.ty, 6, 0xffb347, 0.5).setDepth(340);
      this.tweens.add({ targets: r, scale: p.splash / 6, alpha: 0, duration: 260, onComplete: () => r.destroy() });
      for (const e of this.enemies.slice()) if (!e.dead && !e.air && Math.hypot(e.x - p.tx, e.y - p.ty) <= p.splash + e.r * 0.5) this.damageEnemy(e, p.dmg);
    } else if (!p.t.dead) {
      if (p.slow) { this.slowEnemy(p.t, p.slow, p.slowTime); this.burst('ice', p.t.x, p.t.y, 6); } else this.burst(p.type === 'mage' ? 'magic' : 'hit', p.t.x, p.t.y, 5);
      this.damageEnemy(p.t, p.dmg);
    }
  }
  drawBars() {
    const g = this.hb; g.clear();
    for (const e of this.enemies) {
      if (e.dead || e.hp >= e.maxHp) continue; const w = e.type === 'boss' ? 70 : 30, x = e.x - w / 2, y = e.y - (e.type === 'boss' ? 70 : 28) - (e.air ? 12 : 0), f = Math.max(0, e.hp / e.maxHp);
      g.fillStyle(0x000000, 0.7); g.fillRect(x - 1, y - 1, w + 2, 6); g.fillStyle(f > 0.5 ? 0x5bd36a : f > 0.25 ? 0xffd23f : 0xff5a5a, 1); g.fillRect(x, y, w * f, 4);
    }
  }
}
