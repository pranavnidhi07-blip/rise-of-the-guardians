import Phaser from 'phaser';
import { audio } from '../audio.js';
import { W, H, cam, spr, txt, skyGradient, go } from '../ui.js';

// "Press to begin" screen: browsers only allow audio after a user gesture.
export default class Begin extends Phaser.Scene {
  constructor() { super('Begin'); }
  create() {
    this._leaving = false; cam(this); this.cameras.main.fadeIn(300, 10, 18, 40);
    skyGradient(this, 0x14284b, 0x4fb8c8);
    for (let i = 0; i < 30; i++) {
      const f = spr(this, Phaser.Math.Between(0, W), Phaser.Math.Between(100, H), 'particle').setTint(0xfff3a0).setBlendMode('ADD').setScale(Phaser.Math.FloatBetween(0.6, 1.2));
      this.tweens.add({ targets: f, y: f.y - 60, alpha: 0.2, duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    spr(this, W / 2, 270, 'title');
    const fairy = spr(this, W / 2, 440, 'fairy').setScale(0.9);
    this.tweens.add({ targets: fairy, y: 425, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
    const t = txt(this, W / 2, 580, 'Click or tap to begin', 30, '#fff', { bold: true });
    this.tweens.add({ targets: t, alpha: 0.35, yoyo: true, repeat: -1, duration: 800 });
    txt(this, W / 2, 650, 'Best with sound on', 18, '#bcd');
    const start = () => { audio.init(); audio.sfx('click'); audio.playMusic('home'); audio.setAmbient('home'); go(this, 'Home'); };
    this.input.once('pointerdown', start); this.input.keyboard.once('keydown', start);
  }
}
