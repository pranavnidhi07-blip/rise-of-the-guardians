import Phaser from 'phaser';
import { W, H, cam, txt, skyGradient } from '../ui.js';
import { JOBS, mk } from '../textures.js';
import { OVERRIDES, BACKGROUNDS } from '../assets.js';
import { K } from '../ui.js';

export default class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.load.on('loaderror', f => console.warn('Optional asset not found:', f.key));
    OVERRIDES.forEach(k => this.load.image(k, `assets/images/${k}.png`));
    Object.entries(BACKGROUNDS).forEach(([k, f]) => this.load.image(k, `assets/images/${f}`));
  }
  create() {
    // convert painted sprites to the same 2x logical size the procedural art uses
    OVERRIDES.forEach(k => {
      const job = JOBS.find(j => j[0] === k); if (!job || !this.textures.exists(k)) return;
      const img = this.textures.get(k).getSourceImage(), cv = document.createElement('canvas'); cv.width = job[1] * K; cv.height = job[2] * K;
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); this.textures.remove(k); this.textures.addCanvas(k, cv);
    });
    cam(this); skyGradient(this, 0x14284b, 0x0f8b8d);
    txt(this, W / 2, H / 2 - 50, 'Loading the realm...', 30, '#f2d479', { bold: true });
    this.add.rectangle(W / 2, H / 2 + 10, 400, 16, 0x0b1226).setStrokeStyle(2, 0xf2d479);
    const bar = this.add.rectangle(W / 2 - 200, H / 2 + 10, 2, 16, 0x1fb5a8).setOrigin(0, 0.5);
    let i = 0;
    const run = () => {
      for (let n = 0; n < 4 && i < JOBS.length; n++, i++) mk(this, ...JOBS[i]);
      bar.setSize(Math.max(2, 400 * i / JOBS.length), 16);
      if (i >= JOBS.length) this.time.delayedCall(200, () => this.scene.start('Begin')); else this.time.delayedCall(16, run);
    };
    run();
  }
}
