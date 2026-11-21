import Phaser from 'phaser';
import { W, H, Z } from './ui.js';
import Boot from './scenes/Boot.js';
import Begin from './scenes/Begin.js';
import Home from './scenes/Home.js';
import MapScene from './scenes/MapScene.js';
import Game from './scenes/Game.js';
import Result from './scenes/Result.js';

new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: Math.round(W * Z), height: Math.round(H * Z), backgroundColor: '#0b1226',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true }, input: { activePointers: 3 },
  scene: [Boot, Begin, Home, MapScene, Game, Result],
});
