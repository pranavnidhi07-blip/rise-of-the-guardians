import Phaser from 'phaser';
import { LEVELS } from '../data/worlds.js';
import { audio } from '../audio.js';
import { W, H, cam, spr, txt, button, go, skyGradient } from '../ui.js';

export default class Result extends Phaser.Scene {
  constructor() { super('Result'); }
  init(d) { this.d = d; }
  create() {
    this._leaving = false; cam(this); const d = this.d; this.cameras.main.fadeIn(400, 10, 18, 40);
    skyGradient(this, d.win ? 0x15306e : 0x2a1a2e, d.win ? 0x7fd6d9 : 0x5a3a4a);
    this.time.delayedCall(3500, () => { audio.playMusic('home'); audio.setAmbient('home'); });
    const p = this.add.graphics(); p.fillStyle(0x14284b, 0.95); p.fillRoundedRect(380, 90, 520, 540, 24); p.lineStyle(4, 0xf2d479, 1); p.strokeRoundedRect(380, 90, 520, 540, 24);
    txt(this, W / 2, 160, d.win ? 'VICTORY!' : 'DEFEAT', 64, d.win ? '#f2d479' : '#ff8a7a', { bold: true, stroke: '#3a2a00', st: 8 });
    const L = LEVELS.find(l => l.id === d.level);
    txt(this, W / 2, 225, L.name, 26, '#fff');
    for (let k = 0; k < 3; k++) {
      const s = spr(this, W / 2 - 90 + k * 90, 320, k < d.stars ? 'i_star' : 'i_star0').setScale(0).setAngle(-30);
      this.tweens.add({ targets: s, scale: 1.7, angle: 0, delay: 400 + k * 350, duration: 400, ease: 'Back.easeOut', onStart: () => { if (k < d.stars) this.time.delayedCall(0, () => audio.sfx('coin')); } });
    }
    txt(this, W / 2, 420, d.win ? `Crystal lives left: ${d.lives}` : 'The Heart Crystal has fallen...\nTry a different tower mix!', 22, '#fff', { align: 'center' });
    let y = 490;
    if (d.win && d.level < LEVELS.length) { button(this, W / 2, y, 300, 52, 'Next Level', () => go(this, 'Game', { level: d.level + 1 }), { size: 22, color: 0x2f9e4a, hover: 0x45c262 }); y += 62; }
    button(this, W / 2, y, 300, 52, 'Retry', () => go(this, 'Game', { level: d.level }), { size: 22 }); y += 62;
    button(this, W / 2, y, 300, 52, 'World Map', () => go(this, 'Map', { world: L.world }), { size: 22, color: 0x6b3fb5, hover: 0x8a56e0 });
    for (let i = 0; i < 30 && d.win; i++) { const f = spr(this, Phaser.Math.Between(0, W), -20, 'particle').setTint(Phaser.Utils.Array.GetRandom([0xffd23f, 0xff7ac8, 0x9fe8ff, 0xc9a8ff])).setBlendMode('ADD').setScale(1.4);
      this.tweens.add({ targets: f, y: H + 20, x: f.x + Phaser.Math.Between(-80, 80), duration: Phaser.Math.Between(2500, 5000), delay: Phaser.Math.Between(0, 2000), repeat: -1 }); }
  }
}
