import Phaser from 'phaser';
import DATA from '../data/game.json';
import { audio } from '../audio.js';
import { loadSave, writeSave, defaultSave, clearSave } from '../save.js';
import { W, H, K, cam, spr, txt, button, go, confirmDialog, openSettings, skyGradient, subtitle } from '../ui.js';

export default class Home extends Phaser.Scene {
  constructor() { super('Home'); }
  create() {
    this._leaving = false; this._sub = null; cam(this);
    const S = audio.s, rm = this.rm = S.reducedMotion; this.moved = false;
    this.cameras.main.fadeIn(400, 10, 18, 40);
    audio.playMusic('home'); audio.setAmbient('home');
    skyGradient(this, 0x15306e, 0x7fd6d9);
    const art = this.textures.exists('bg_home'); // optional painted background (see src/assets.js)
    if (art) this.add.image(W / 2, H / 2, 'bg_home').setDisplaySize(W, H);
    spr(this, 1020, 140, 'particle').setTint(0xffe9a8).setBlendMode('ADD').setScale(12).setAlpha(0.6);

    // parallax layers
    this.sky = this.add.container(0, 0); this.far = this.add.container(0, 0); this.mid = this.add.container(0, 0); this.near = this.add.container(0, 0);
    this.par = [[this.sky, 6], [this.far, 12], [this.mid, 20], [this.near, 36]];

    // clouds
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      const c = spr(this, Phaser.Math.Between(0, W), Phaser.Math.Between(40, 260), 'cloud').setScale(Phaser.Math.FloatBetween(0.35, 0.7)).setAlpha(Phaser.Math.FloatBetween(0.6, 0.95));
      c.spd = Phaser.Math.FloatBetween(6, 20); this.sky.add(c); this.clouds.push(c);
    }
    // mountains + castle
    const mg = this.add.graphics();
    mg.fillStyle(0x4b5aa8, 0.9); mg.fillPoints([[-100, 580], [100, 370], [240, 470], [420, 330], [620, 480], [800, 390], [1000, 490], [1180, 360], [1380, 580]].map(p => ({ x: p[0], y: p[1] })), true);
    mg.fillStyle(0x6a77c4, 0.9); mg.fillPoints([[-100, 600], [60, 450], [300, 520], [520, 430], [760, 530], [960, 450], [1200, 530], [1380, 600]].map(p => ({ x: p[0], y: p[1] })), true);
    this.far.add(mg);
    this.far.add(spr(this, 900, 380, 'castle'));
    [[830, 262], [1010, 262], [900, 238]].forEach(([x, y]) => {
      const f = spr(this, x, y, 'flag').setOrigin(0, 0.5); this.far.add(f);
      if (!rm) this.tweens.add({ targets: f, angle: { from: -8, to: 8 }, duration: Phaser.Math.Between(700, 1100), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    if (S.mist) for (let i = 0; i < 3; i++) {
      const m = spr(this, 200 + i * 450, 470 + i * 12, 'mist').setScale(3.4).setAlpha(0.5); this.far.add(m);
      if (!rm) this.tweens.add({ targets: m, x: m.x + 140, duration: 11000 + i * 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // cliff + waterfall
    const cg = this.add.graphics(); cg.fillStyle(0x5a528f, 1); cg.fillPoints([[120, 210], [350, 210], [380, 580], [90, 580]].map(p => ({ x: p[0], y: p[1] })), true);
    cg.fillStyle(0x6f67a8, 1); cg.fillRect(110, 200, 250, 24);
    this.mid.add(cg);
    this.fall = this.add.tileSprite(235, 400, 64, 360, 'water').setTileScale(1 / K, 1 / K); this.mid.add(this.fall);
    const pond = this.add.ellipse(235, 585, 280, 44, 0x3aa6c9, 0.85); this.mid.add(pond);
    if (!rm) for (let i = 0; i < 2; i++) {
      const r = this.add.ellipse(235, 585, 60, 12).setStrokeStyle(2, 0xffffff, 0.7); this.mid.add(r);
      this.tweens.add({ targets: r, scaleX: 4, scaleY: 4, alpha: 0, duration: 2400, repeat: -1, delay: i * 1200 });
    }
    const spray = spr(this, 235, 565, 'particle').setTint(0xffffff).setBlendMode('ADD').setScale(7).setAlpha(0.5); this.mid.add(spray);
    if (!rm) this.tweens.add({ targets: spray, alpha: 0.2, yoyo: true, repeat: -1, duration: 900 });
    // hills + trees
    const hg = this.add.graphics(); hg.fillStyle(0x1f7a4e, 1); hg.fillEllipse(640, 740, 1700, 360); hg.fillStyle(0x24885a, 1); hg.fillEllipse(1000, 750, 1100, 300);
    this.mid.add(hg);
    [[450, 590, 0.7], [570, 600, 0.55], [760, 580, 0.8], [1100, 585, 0.75], [1230, 600, 0.6], [60, 610, 0.65]].forEach(([x, y, s]) => {
      const t = spr(this, x, y, 'tree').setOrigin(0.5, 1).setScale(s); this.mid.add(t);
      if (!rm) this.tweens.add({ targets: t, angle: { from: -1.6, to: 1.6 }, duration: Phaser.Math.Between(1800, 2800), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    if (art) { this.far.setVisible(false); this.mid.setVisible(false); }
    // foreground
    const fg = this.add.graphics(); fg.fillStyle(0x16603f, 1); fg.fillEllipse(640, 790, 1700, 320); this.near.add(fg);
    const cols = [0xffffff, 0xffb3e0, 0xffe27a, 0xc9a8ff, 0x9fe8ff];
    for (let i = 0; i < 34; i++) {
      const f = spr(this, Phaser.Math.Between(-20, W + 20), Phaser.Math.Between(650, 715), 'flower').setOrigin(0.5, 1).setTint(Phaser.Utils.Array.GetRandom(cols)).setScale(Phaser.Math.FloatBetween(0.7, 1.2));
      this.near.add(f); if (!rm) this.tweens.add({ targets: f, angle: { from: -6, to: 6 }, duration: Phaser.Math.Between(1200, 2200), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    [[90, 715, 0.9], [1190, 715, 1.0], [330, 722, 0.6]].forEach(([x, y, s]) => {
      const glow = spr(this, x, y - 40 * s, 'particle').setTint(0xc9a8ff).setBlendMode('ADD').setScale(9 * s).setAlpha(0.6);
      const c = spr(this, x, y, 'crystal').setOrigin(0.5, 1).setScale(s); this.near.add([glow, c]);
      if (!rm) this.tweens.add({ targets: glow, alpha: 0.2, yoyo: true, repeat: -1, duration: 1400 + x, ease: 'Sine.easeInOut' });
    });
    // heroes (characters react on click)
    [['h_archer', 930, 708, 2], ['h_prince', 1035, 704, 0], ['h_princess', 1140, 708, 1]].forEach(([k, x, y, hi]) => {
      const h = spr(this, x, y, k).setOrigin(0.5, 1).setScale(0.7).setInteractive({ useHandCursor: true }); this.near.add(h);
      if (!rm) this.tweens.add({ targets: h, scaleY: 0.73, duration: 1300 + hi * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      h.on('pointerdown', () => { audio.init(); audio.sfx('click'); subtitle(this, `${DATA.heroes[hi].name}: ${DATA.heroes[hi].line}`);
        this.tweens.add({ targets: h, y: y - 16, duration: 120, yoyo: true }); });
    });
    // mascot fairy
    this.fairy = spr(this, 1000, 330, 'fairy').setScale(0.75).setInteractive({ useHandCursor: true });
    if (!rm) this.tweens.add({ targets: this.fairy, y: 310, x: 1015, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.easeInOut' });
    this.fairy.on('pointerdown', () => { audio.init(); audio.sfx('click'); subtitle(this, `Pip: ${DATA.heroes[3].line}`); this.tweens.add({ targets: this.fairy, angle: 360, duration: 500 }); this.fairy.angle = 0; });

    // fireflies + butterflies
    this.flies = []; this.bfs = [];
    if (!rm) {
      for (let i = 0; i < 26; i++) {
        const f = spr(this, 0, 0, 'particle').setTint(0xfff3a0).setBlendMode('ADD').setScale(Phaser.Math.FloatBetween(0.6, 1.1));
        f.bx = Phaser.Math.Between(0, W); f.by = Phaser.Math.Between(380, 690); f.ph = Math.random() * 6; this.flies.push(f);
      }
      for (let i = 0; i < 4; i++) { const b = spr(this, 0, 0, 'butterfly').setScale(0.9); b.bx = 300 + i * 220; b.by = 560 + (i % 2) * 40; b.ph = i * 1.7; this.bfs.push(b); }
      this.time.addEvent({ delay: 7000, loop: true, callback: () => this.sendBird() }); this.time.delayedCall(1500, () => this.sendBird());
    }

    // title
    for (let i = 0; i < 4; i++) {
      const r = spr(this, 260 + i * 260, -20, 'ray').setOrigin(0.5, 0).setScale(1.6 + i * 0.2, 1.5).setAngle(-12 + i * 3).setBlendMode('ADD').setAlpha(0.16);
      if (!rm) this.tweens.add({ targets: r, alpha: 0.05, angle: r.angle + 4, yoyo: true, repeat: -1, duration: 3500 + i * 700, ease: 'Sine.easeInOut' });
    }
    this.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W, H);
    if (!rm) { this.time.addEvent({ delay: 24000, loop: true, callback: () => this.flyDragon() }); this.time.delayedCall(4000, () => this.flyDragon()); }
    const ttl = spr(this, W / 2, 132, 'title');
    if (!rm) this.tweens.add({ targets: ttl, scale: 0.515, yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.easeInOut' });

    // menu
    const pg = this.add.graphics(); pg.fillStyle(0x0b1226, 0.45); pg.fillRoundedRect(430, 262, 420, 340, 22); pg.lineStyle(2, 0xf2d479, 0.8); pg.strokeRoundedRect(430, 262, 420, 340, 22);
    const save = loadSave();
    button(this, W / 2, 322, 340, 64, 'Play Campaign', () => this.play(), { size: 28 });
    button(this, W / 2, 398, 340, 56, 'Continue Journey', () => go(this, 'Map'), { size: 24, disabled: !save, color: 0x2f9e4a, hover: 0x45c262 });
    button(this, W / 2 - 105, 470, 200, 50, 'World Map', () => go(this, 'Map'), { size: 19 });
    button(this, W / 2 + 105, 470, 200, 50, 'Heroes & Towers', () => this.info(), { size: 18 });
    button(this, W / 2 - 105, 535, 200, 50, 'Endless (Soon)', () => {}, { size: 18, disabled: true });
    button(this, W / 2 + 105, 535, 200, 50, 'Settings', () => this.openSet(), { size: 19 });
    this.mute = button(this, 90, 36, 150, 40, '', () => { audio.setMuted(!audio.s.muted); this.mute.setLabel(audio.s.muted ? 'Sound: OFF' : 'Sound: ON'); }, { size: 17 });
    this.mute.setLabel(audio.s.muted ? 'Sound: OFF' : 'Sound: ON');
    txt(this, W / 2, 705, 'Tip: click the heroes and the fairy!', 16, '#e6f6f6');

    this.input.on('pointermove', () => { this.moved = true; });
    this.input.keyboard.on('keydown-ENTER', () => this.play());
  }
  play() {
    const sv = loadSave(), start = () => { clearSave(); writeSave(defaultSave()); go(this, 'Map'); };
    if (sv) confirmDialog(this, 'Start a new journey?\nYour saved progress will be replaced.', start, 'New Journey', 'Cancel'); else start();
  }
  openSet() { openSettings(this, changed => { if (changed) this.scene.restart(); }); }
  flyDragon() {
    const fromLeft = Math.random() < 0.5, y = Phaser.Math.Between(110, 250), d = spr(this, fromLeft ? -150 : W + 150, y, 'dragon_a').setScale(0.55).setFlipX(!fromLeft).setDepth(30);
    audio.sfx('roar'); let up = true;
    const flap = this.time.addEvent({ delay: 230, loop: true, callback: () => { up = !up; d.setTexture(up ? 'dragon_a' : 'dragon_b'); } });
    this.tweens.add({ targets: d, x: fromLeft ? W + 150 : -150, duration: 14000, onComplete: () => { flap.remove(); d.destroy(); } });
    this.tweens.add({ targets: d, y: y + 40, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });
  }
  sendBird() {
    const b = spr(this, -40, Phaser.Math.Between(90, 230), 'bird').setScale(0.9); this.sky.add(b);
    this.tweens.add({ targets: b, x: W + 60, duration: 9000, onComplete: () => b.destroy() });
    this.tweens.add({ targets: b, scaleY: 0.35, yoyo: true, repeat: -1, duration: 220 });
    this.tweens.add({ targets: b, y: b.y + 30, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });
  }
  info() {
    const c = this.add.container(0, 0).setDepth(1500);
    const z = this.add.rectangle(W / 2, H / 2, W, H, 0, 0.7).setInteractive();
    const p = this.add.graphics(); p.fillStyle(0x14284b, 1); p.fillRoundedRect(110, 40, 1060, 640, 20); p.lineStyle(3, 0xf2d479, 1); p.strokeRoundedRect(110, 40, 1060, 640, 20);
    c.add([z, p, txt(this, 370, 80, 'Towers', 30, '#f2d479', { bold: true }), txt(this, 900, 80, 'Heroes', 30, '#f2d479', { bold: true })]);
    Object.values(DATA.towers).forEach((d, i) => {
      const key = Object.keys(DATA.towers)[i], y = 150 + i * 118;
      c.add([spr(this, 170, y, 't_' + key).setScale(0.7), txt(this, 220, y - 28, `${d.name} - ${d.cost} gold`, 22, '#fff', { ox: 0, bold: true }),
        txt(this, 220, y + 12, d.desc, 16, '#cfe', { ox: 0, w: 380 })]);
    });
    DATA.heroes.forEach((h, i) => {
      const y = 175 + i * 118;
      c.add([spr(this, 710, y, h.tex).setScale(0.75), txt(this, 760, y - 30, h.name, 22, '#fff', { ox: 0, bold: true }), txt(this, 760, y - 2, h.role, 15, '#cfe', { ox: 0, w: 380 }), txt(this, 760, y + 26, h.ability, 15, '#ffd23f', { ox: 0, w: 380 })]);
    });
    c.add(button(this, W / 2, 635, 220, 46, 'Close', () => c.destroy(), { size: 20, color: 0x6b3fb5, hover: 0x8a56e0 }));
  }
  update(t, dt) {
    const s = dt / 1000, tt = t / 1000;
    this.fall.tilePositionY -= 300 * s / 1;
    if (this.rm) return;
    this.clouds.forEach(c => { c.x += c.spd * s; if (c.x > W + 200) c.x = -200; });
    const nx = this.moved ? (this.input.activePointer.x / this.scale.width - 0.5) * 2 : 0;
    this.par.forEach(([c, f]) => { c.x += (-nx * f - c.x) * 0.06; });
    this.flies.forEach(f => { f.x = f.bx + Math.sin(tt * 0.6 + f.ph) * 40; f.y = f.by + Math.cos(tt * 0.8 + f.ph) * 22; f.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(tt * 1.7 + f.ph))); });
    this.bfs.forEach(b => { b.x = b.bx + Math.cos(tt * 0.5 + b.ph) * 150; b.y = b.by + Math.sin(tt * 0.9 + b.ph) * 36; b.setScale(0.9 * (0.4 + 0.6 * Math.abs(Math.sin(tt * 12 + b.ph))), 0.9); });
  }
}
