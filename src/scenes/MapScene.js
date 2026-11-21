import Phaser from 'phaser';
import { audio } from '../audio.js';
import { loadSave, defaultSave } from '../save.js';
import { WORLDS, LEVELS } from '../data/worlds.js';
import { W, H, cam, spr, txt, button, go, skyGradient, openSettings } from '../ui.js';

const CX = [170, 405, 640, 875, 1110];
const pointAt = (pts, t) => { const seg = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
  let d = t * tot; for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const f = Math.min(1, d / seg[i]); return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; } d -= seg[i]; } };

export default class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }
  init(d) { this.world = d && d.world !== undefined ? d.world : null; }
  create() {
    this._leaving = false; this._sub = null; cam(this); this.cameras.main.fadeIn(300, 10, 18, 40);
    audio.playMusic('home'); audio.setAmbient('home'); this.sv = loadSave() || defaultSave();
    if (this.world === null) this.worldSelect(); else this.levelSelect(this.world);
    button(this, 90, 36, 150, 40, 'Back', () => go(this, this.world === null ? 'Home' : 'Map'), { size: 18, color: 0x6b3fb5, hover: 0x8a56e0 });
    button(this, 1180, 36, 150, 40, 'Settings', () => openSettings(this, ch => { if (ch) this.scene.restart({ world: this.world }); }), { size: 18 });
  }
  starsOf(w) { let n = 0; for (let i = 1; i <= 5; i++) n += this.sv.stars[w * 5 + i] || 0; return n; }

  // ---------------------------------------------------------- 5 world cards
  worldSelect() {
    skyGradient(this, 0x15306e, 0x7fd6d9); skyGradient(this, 0x0d1b3a, 0x2a4a6a).setAlpha(0.55);
    txt(this, W / 2, 60, 'Choose Your World', 40, '#f2d479', { bold: true });
    this.hint = txt(this, W / 2, 650, '', 22, '#fff');
    WORLDS.forEach((w, i) => {
      const open = w.id * 5 + 1 <= this.sv.unlocked, cw = 210, ch = 400, c = this.add.container(CX[i], 370), g = this.add.graphics();
      g.fillStyle(0x000000, 0.4); g.fillRoundedRect(-cw / 2 + 4, -ch / 2 + 8, cw, ch, 18);
      g.fillStyle(w.card[0], 1); g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);
      g.fillStyle(w.card[1], 0.85); g.fillRoundedRect(-cw / 2, -ch / 2 + ch * 0.4, cw, ch * 0.6, { tl: 0, tr: 0, bl: 18, br: 18 });
      g.lineStyle(4, open ? 0xd4a72c : 0x66708a, 1); g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);
      // mini map of the real path
      const k = 0.14, ox = -w.path[0][0] * 0 - 90, oy = -150; g.lineStyle(7, w.pathCols[3], 1); g.beginPath();
      w.path.forEach((p, n) => { const x = Math.max(-90, Math.min(90, ox + (p[0] + 30) * k * 0.98)), y = oy + p[1] * k + 20; n ? g.lineTo(x, y) : g.moveTo(x, y); }); g.strokePath();
      c.add(g);
      const d0 = w.decor[0], d1 = w.decor[1];
      c.add([spr(this, -50, 40, d0.k).setOrigin(0.5, 1).setScale(0.5), spr(this, 40, 50, d1.k).setOrigin(0.5, 1).setScale(0.5)]);
      c.add([txt(this, 0, 80, w.name, 21, '#fff', { bold: true, align: 'center', w: 190 }), txt(this, 0, 128, w.tag, 15, '#f2d479'),
        spr(this, -34, 164, 'i_star').setScale(0.5), txt(this, 6, 164, `${this.starsOf(w.id)}/15`, 19, '#fff', { ox: 0, bold: true })]);
      if (!open) c.add([this.add.rectangle(0, 0, cw, ch, 0x0b1226, 0.62), txt(this, 0, -20, 'LOCKED', 26, '#ffcf6b', { bold: true }), txt(this, 0, 20, `Clear ${WORLDS[i - 1].name}`, 15, '#fff', { align: 'center', w: 170 })]);
      c.setSize(cw, ch).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => { this.tweens.add({ targets: c, scale: 1.05, duration: 120 }); audio.sfx('hover'); this.hint.setText(open ? `${w.name}: boss ${w.bossName}` : 'Locked'); });
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 120 }));
      c.on('pointerdown', () => { audio.init(); if (!open) { audio.sfx('error'); return; } audio.sfx('click'); go(this, 'Map', { world: i }); });
    });
  }

  // ---------------------------------------------------------- 5 levels of one world, laid out along its real path
  levelSelect(wi) {
    const w = WORLDS[wi], sv = this.sv, RND = Phaser.Math.RND; RND.sow(['map', wi]);
    skyGradient(this, w.ground[0], w.ground[1]);
    const g = this.add.graphics(), sx = 0.86, ox = 90, oy = 95, P = w.path.map(p => [ox + (p[0] + 30) * sx - 26, oy + p[1] * sx]);
    for (let i = 0; i < 24; i++) { g.fillStyle(w.patch, 0.2); g.fillEllipse(RND.between(0, W), RND.between(80, 700), RND.between(80, 200), RND.between(30, 60)); }
    const stroke = (wd, col, a = 1) => { g.lineStyle(wd, col, a); g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokePath(); g.fillStyle(col, a); P.forEach(p => g.fillCircle(p[0], p[1], wd / 2)); };
    stroke(60, w.pathCols[1]); stroke(50, w.pathCols[2]); stroke(40, w.pathCols[3]);
    const bag = []; w.decor.forEach(d => { for (let i = 0; i < d.w; i++) bag.push(d); });
    for (let i = 0, t = 0; i < 14 && t < 300; t++) { const x = RND.between(40, 1240), y = RND.between(150, 690); if (P.some((p, n) => n && this.dseg(x, y - 20, P[n - 1], p) < 60)) continue; i++;
      const d = RND.pick(bag), im = spr(this, x, y, d.k).setOrigin(0.5, 1).setDepth(y).setScale(d.s * 0.8); if (d.tint) im.setTint(d.tint); }
    for (let i = 0; i < 3; i++) spr(this, 250 + i * 380, 60, 'ray').setOrigin(0.5, 0).setScale(1.7, 1.5).setAngle(-14 + i * 4).setTint(w.ray).setBlendMode('ADD').setAlpha(0.1).setDepth(2);
    this.add.image(W / 2, H / 2, 'vignette').setDisplaySize(W, H).setDepth(850);
    txt(this, W / 2, 50, w.name, 40, '#f2d479', { bold: true }).setDepth(900); txt(this, W / 2, 92, w.tag, 20, '#fff').setDepth(900);
    this.info = txt(this, W / 2, 595, '', 22, '#fff', { align: 'center' }).setDepth(900);
    this.start = button(this, W / 2, 665, 280, 56, 'Start Level', () => go(this, 'Game', { level: this.sel }), { size: 26, color: 0x2f9e4a, hover: 0x45c262 }).setDepth(900);
    this.ring = this.add.circle(0, 0, 44).setStrokeStyle(5, 0xffffff).setDepth(899);
    this.tweens.add({ targets: this.ring, scale: 1.12, yoyo: true, repeat: -1, duration: 600 });
    this.pos = {};
    [0.1, 0.3, 0.5, 0.72, 0.95].forEach((t, i) => {
      const L = LEVELS[wi * 5 + i], open = L.id <= sv.unlocked, [x, y] = pointAt(P, t); this.pos[L.id] = [x, y];
      const n = this.add.circle(x, y, 32, open ? 0x0f8b8d : 0x44506a).setStrokeStyle(5, L.boss ? 0xff7a4a : open ? 0xf2d479 : 0x66708a).setInteractive({ useHandCursor: true }).setDepth(890);
      txt(this, x, y, open ? String(i + 1) : 'x', 30, '#fff', { bold: true }).setDepth(891);
      txt(this, x, y - 56, L.name, 17, '#fff', { bold: true, align: 'center', w: 170 }).setDepth(891);
      const st = sv.stars[L.id] || 0; for (let k = 0; k < 3; k++) spr(this, x - 28 + k * 28, y + 52, k < st ? 'i_star' : 'i_star0').setScale(0.5).setDepth(891);
      if (L.boss) spr(this, x + 62, y + 4, 'e_boss').setScale(0.3).setTint(w.bossTint || 0xffffff).setDepth(891);
      n.on('pointerdown', () => { audio.init(); if (!open) { audio.sfx('error'); return; } audio.sfx('click'); this.select(L.id); });
    });
    this.select(Math.max(wi * 5 + 1, Math.min(sv.unlocked, wi * 5 + 5)));
  }
  dseg(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy; let t = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy)); }
  select(id) {
    this.sel = id; const L = LEVELS.find(l => l.id === id), w = WORLDS[L.world], [x, y] = this.pos[id];
    this.ring.setPosition(x, y);
    this.info.setText(`${L.name}  -  ${L.waves.length} waves${L.boss ? '  -  BOSS: ' + w.bossName : ''}\nStarting gold ${L.gold}   Lives ${L.lives}`);
  }
}
