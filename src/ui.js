import Phaser from 'phaser';
import { audio } from './audio.js';
import { saveSettings } from './save.js';

export const W = 1280, H = 720;
export const K = 2;                                   // texture supersampling (assets are authored at 2x)
export const Z = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1)); // canvas sharpness factor
export const FONT = '"Trebuchet MS", Verdana, "Segoe UI", sans-serif';

/** Fit the 1280x720 design space into a canvas that is Z times larger (keeps everything crisp on HiDPI). */
export const cam = s => { s.cameras.main.setZoom(Z).setScroll(640 - 640 * Z, 360 - 360 * Z); };
export const spr = (s, x, y, key) => s.add.image(x, y, key).setScale(1 / K);

export function txt(s, x, y, str, size = 20, color = '#fff', o = {}) {
  const t = s.add.text(x, y, str, {
    fontFamily: FONT, fontSize: size + 'px', color, stroke: o.stroke ?? '#0b1226',
    strokeThickness: o.st ?? Math.max(2, size / 8), align: o.align || 'left', fontStyle: o.bold ? 'bold' : 'normal',
    wordWrap: o.w ? { width: o.w } : undefined,
  });
  t.setResolution(2); t.setOrigin(o.ox ?? 0.5, o.oy ?? 0.5); return t;
}

export function button(s, x, y, w, h, label, cb, o = {}) {
  const c = s.add.container(x, y), g = s.add.graphics();
  const t = txt(s, 0, 0, label, o.size || 22, '#fff', { bold: true, align: 'center' });
  c.add([g, t]); c.setSize(w, h); c.disabled = false;
  const draw = over => {
    g.clear(); const dis = c.disabled, base = dis ? 0x3a4257 : over ? (o.hover || 0x1fb5a8) : (o.color || 0x0f8b8d);
    g.fillStyle(0x000000, 0.4); g.fillRoundedRect(-w / 2 + 2, -h / 2 + 5, w, h, 12);
    g.fillStyle(0x2a1a0a, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.fillStyle(dis ? 0x66708a : 0xd4a72c, 1); g.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 10);
    g.fillStyle(0x0b1226, 1); g.fillRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 8);
    g.fillStyle(base, 1); g.fillRoundedRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 7);
    g.fillStyle(0xffffff, over && !dis ? 0.3 : 0.18); g.fillRoundedRect(-w / 2 + 8, -h / 2 + 8, w - 16, (h - 16) / 2, 6);
    if (over && !dis) { g.lineStyle(3, 0xfff3a0, 0.85); g.strokeRoundedRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 13); }
  };
  draw(false); c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => { if (c.disabled) return; draw(true); s.tweens.add({ targets: c, scale: 1.04, duration: 90 }); audio.sfx('hover'); });
  c.on('pointerout', () => { draw(false); s.tweens.add({ targets: c, scale: 1, duration: 90 }); });
  c.on('pointerdown', () => {
    audio.init();
    if (c.disabled) { audio.sfx('error'); if (o.onDisabled) o.onDisabled(); return; }
    audio.sfx('click'); cb();
  });
  c.setDisabled = d => { c.disabled = d; t.setAlpha(d ? 0.55 : 1); draw(false); return c; };
  c.setLabel = l => { t.setText(l); return c; };
  if (o.disabled) c.setDisabled(true);
  return c;
}

export function slider(s, x, y, w, label, get, set) {
  const lab = txt(s, x, y - 22, label, 18, '#fff', { ox: 0, bold: true });
  const track = s.add.rectangle(x + w / 2, y + 8, w, 8, 0x223355).setStrokeStyle(2, 0x0f8b8d).setInteractive({ useHandCursor: true });
  const fill = s.add.rectangle(x, y + 8, Math.max(1, w * get()), 8, 0x1fb5a8).setOrigin(0, 0.5);
  const knob = s.add.circle(x + w * get(), y + 8, 13, 0xf2d479).setStrokeStyle(3, 0xffffff).setInteractive({ draggable: true, useHandCursor: true });
  const pct = txt(s, x + w + 34, y + 8, Math.round(get() * 100) + '%', 16, '#fff');
  const upd = px => {
    const v = Phaser.Math.Clamp((px - x) / w, 0, 1); knob.x = x + w * v; fill.setSize(Math.max(1, w * v), 8);
    pct.setText(Math.round(v * 100) + '%'); set(v);
  };
  knob.on('drag', (p, dx) => upd(dx));
  track.on('pointerdown', p => upd(p.worldX));
  return [lab, track, fill, knob, pct];
}

export function go(scene, key, data) {
  if (scene._leaving) return; scene._leaving = true;
  scene.cameras.main.fadeOut(250, 10, 18, 40);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

export function skyGradient(s, top, bottom) {
  const g = s.add.graphics(); g.fillGradientStyle(top, top, bottom, bottom, 1); g.fillRect(0, 0, W, H); return g;
}

export function subtitle(s, str, y = 690) {
  audio.say(str);
  if (!audio.s.subtitles) return;
  if (!s._sub) s._sub = txt(s, W / 2, y, '', 22, '#fff', { bold: true }).setDepth(1800);
  s._sub.setText(str).setAlpha(1); s.tweens.killTweensOf(s._sub);
  s.tweens.add({ targets: s._sub, alpha: 0, delay: 2200, duration: 500 });
}

function panel(s, x, y, w, h) {
  const p = s.add.graphics(); p.fillStyle(0x14284b, 1); p.fillRoundedRect(x, y, w, h, 20);
  p.lineStyle(3, 0xf2d479, 1); p.strokeRoundedRect(x, y, w, h, 20); return p;
}

export function confirmDialog(s, msg, onYes, yes = 'Yes', no = 'Cancel') {
  const c = s.add.container(0, 0).setDepth(1500);
  const z = s.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
  const p = panel(s, W / 2 - 250, H / 2 - 110, 500, 220);
  const t = txt(s, W / 2, H / 2 - 35, msg, 22, '#fff', { align: 'center', w: 440 });
  const close = () => c.destroy();
  const b1 = button(s, W / 2 - 110, H / 2 + 60, 190, 52, yes, () => { close(); onYes(); }, { size: 20 });
  const b2 = button(s, W / 2 + 110, H / 2 + 60, 190, 52, no, close, { size: 20, color: 0x6b3fb5, hover: 0x8a56e0 });
  c.add([z, p, t, b1, b2]); return c;
}

export function openSettings(s, onClose) {
  const S = audio.s; let changed = false;
  const c = s.add.container(0, 0).setDepth(2000);
  const z = s.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive();
  c.add([z, panel(s, 240, 50, 800, 620), txt(s, W / 2, 95, 'Settings', 34, '#f2d479', { bold: true })]);
  [['master', 'Master'], ['music', 'Music'], ['sfx', 'Sound Effects'], ['voice', 'Voice'], ['ambient', 'Ambient']]
    .forEach(([k, l], i) => c.add(slider(s, 300, 170 + i * 62, 560, l, () => S[k], v => audio.setVol(k, v))));
  const mk = (label, get, set, x, y) => {
    const b = button(s, x, y, 230, 46, '', () => { set(!get()); b.setLabel(label + ': ' + (get() ? 'ON' : 'OFF')); }, { size: 18 });
    b.setLabel(label + ': ' + (get() ? 'ON' : 'OFF')); return b;
  };
  c.add([
    mk('Mute', () => S.muted, v => audio.setMuted(v), 380, 520),
    mk('Mist', () => S.mist, v => { S.mist = v; saveSettings(S); changed = true; }, 640, 520),
    mk('Reduced Motion', () => S.reducedMotion, v => { S.reducedMotion = v; saveSettings(S); changed = true; }, 900, 520),
    mk('Subtitles', () => S.subtitles, v => { S.subtitles = v; saveSettings(S); }, 510, 585),
    button(s, 770, 585, 230, 46, 'Close', () => { c.destroy(); if (onClose) onClose(changed); }, { size: 20, color: 0x6b3fb5, hover: 0x8a56e0 }),
  ]);
  return c;
}
