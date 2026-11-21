// 5 worlds, each with its own map layout, palette, scenery, weather, music and boss. 5 levels per world = 25 levels.
const pathEnd = p => p[p.length - 1];
const air = p => [[-30, p[0][1] + 140 > 600 ? p[0][1] - 140 : p[0][1] + 140], pathEnd(p)];

export const WORLDS = [
  { id: 0, name: 'Enchanted Forest', tag: 'Beginner', bossName: 'Elder Wyrm',
    ground: [0x3fae62, 0x1d6844], patch: 0x58c878, tuft: 0x1a5a34, light: 0xfff3a0, lightA: 0.07,
    pathCols: [0x2b5a2a, 0x4a3318, 0x8a6a3c, 0xd9bd80, 0xe6cf9a], pebbles: [0xb89a62, 0xeed9a8, 0xa5885a],
    decor: [{ k: 'tree', s: 0.52, r: 28, w: 5 }, { k: 'crystal', s: 0.45, r: 22, w: 1 }, { k: 'rock', s: 0.5, r: 22, w: 2 }], flowers: true,
    ray: 0xfff4be, crystal: 0xc9a8ff, enemyTint: null, bossTint: null, bossScale: 1, music: 'level', amb: 'level', weather: 'leaves', card: [0x3fae62, 0x1d6844],
    path: [[-30, 190], [280, 190], [280, 440], [620, 440], [620, 200], [940, 200], [940, 470], [1180, 470]],
    names: ['Whispering Glade', 'Mossy Ruins', 'Fairy Hollow', 'Ancient Roots', 'Heart Grove'] },
  { id: 1, name: 'Frozen Mountains', tag: 'Intermediate', bossName: 'Frost Drake',
    ground: [0xdcecf7, 0x8fb5d0], patch: 0xffffff, tuft: 0x7aa0bf, light: 0xbfe8ff, lightA: 0.1, extras: 'ice',
    pathCols: [0x4a6a85, 0x5f7f99, 0x8fb0c6, 0xc9deea, 0xeaf6ff], pebbles: [0xffffff, 0xb8d4e6, 0x9bbbd0],
    decor: [{ k: 'tree_snow', s: 0.52, r: 28, w: 5 }, { k: 'ice_spike', s: 0.5, r: 22, w: 2 }, { k: 'rock_snow', s: 0.5, r: 22, w: 2 }], flowers: false,
    ray: 0xbfe8ff, crystal: 0x9fe8ff, enemyTint: 0xcfe6ff, bossTint: 0x9fd8ff, bossScale: 1.05, music: 'level_ice', amb: 'ice', weather: 'snow', card: [0xdcecf7, 0x7aa4c8],
    path: [[-30, 120], [400, 120], [400, 330], [150, 330], [150, 520], [700, 520], [700, 260], [1000, 260], [1000, 450], [1180, 450]],
    names: ['Frostbite Pass', 'Glacier Bridge', 'Blizzard Ridge', 'Crystal Cavern', "Frost Drake's Peak"] },
  { id: 2, name: 'Volcanic Wasteland', tag: 'Advanced', bossName: 'Magma Dragon',
    ground: [0x4a3a38, 0x1f1514], patch: 0x6a4a40, tuft: 0x120a0a, light: 0xff7a3a, lightA: 0.08, extras: 'lava',
    pathCols: [0x120a0a, 0x2a1c1a, 0x5a4540, 0x8a6a5e, 0xa88a7a], pebbles: [0x7a5a4e, 0x3a2a26, 0xb08a70],
    decor: [{ k: 'tree_dead', s: 0.5, r: 24, w: 3, tint: 0x5a4a44 }, { k: 'spike_obsidian', s: 0.5, r: 22, w: 3 }, { k: 'rock_lava', s: 0.5, r: 22, w: 3 }], flowers: false,
    ray: 0xff8a4a, crystal: 0xff7a4a, enemyTint: 0xffc09a, bossTint: 0xff7a4a, bossScale: 1.1, music: 'level_fire', amb: 'fire', weather: 'embers', card: [0x5a3a30, 0x1f1514],
    path: [[-30, 500], [250, 500], [250, 200], [560, 200], [560, 430], [860, 430], [860, 170], [1060, 170], [1060, 400], [1180, 400]],
    names: ['Ash Fields', 'Lava Crossing', 'Obsidian Gate', 'Magma Forge', 'Ember Throne'] },
  { id: 3, name: 'Cursed Kingdom', tag: 'Expert', bossName: 'Lich Wyrm',
    ground: [0x4a5a58, 0x1c2626], patch: 0x6a7e78, tuft: 0x101818, light: 0x9aff9a, lightA: 0.06,
    pathCols: [0x10161a, 0x242c32, 0x4a5258, 0x7a8288, 0x9aa2a8], pebbles: [0x6a7278, 0x3a4248, 0x9aa2a8],
    decor: [{ k: 'tree_dead', s: 0.52, r: 24, w: 3, tint: 0x8a8aa0 }, { k: 'tomb', s: 0.55, r: 18, w: 4 }, { k: 'lantern', s: 0.55, r: 12, w: 2 }], flowers: false,
    ray: 0x9aff9a, crystal: 0x9aff9a, enemyTint: 0xc8b8e8, bossTint: 0x9aff9a, bossScale: 1.15, music: 'level_curse', amb: 'curse', weather: 'wisps', card: [0x4a5a58, 0x1c2626],
    path: [[-30, 300], [200, 300], [200, 520], [480, 520], [480, 170], [760, 170], [760, 520], [1000, 520], [1000, 300], [1180, 300]],
    names: ['Haunted Gate', 'Graveyard Lane', 'Ghost Market', "Necromancer's Tower", 'The Fallen Castle'] },
  { id: 4, name: 'Shadow Realm', tag: 'Final challenge', bossName: 'The Shadow King',
    ground: [0x2a1f4a, 0x0e0a1e], patch: 0x4a3a7a, tuft: 0x080514, light: 0xc08aff, lightA: 0.08, extras: 'void',
    pathCols: [0x07040f, 0x1a1236, 0x3a2a6a, 0x5a4a98, 0x8a78c8], pebbles: [0x6a58a8, 0x2a1f4a, 0xa898e0],
    decor: [{ k: 'spire', s: 0.5, r: 24, w: 4 }, { k: 'crystal', s: 0.5, r: 22, w: 2, tint: 0x7a5aff }, { k: 'rock', s: 0.5, r: 22, w: 2, tint: 0x6a5a98 }], flowers: false,
    ray: 0xc08aff, crystal: 0xc08aff, enemyTint: 0xb8a8e8, bossTint: 0x6a5a9a, bossScale: 1.3, music: 'level_shadow', amb: 'shadow', weather: 'motes', card: [0x3a2a6a, 0x0e0a1e],
    path: [[-30, 560], [1050, 560], [1050, 400], [230, 400], [230, 230], [1180, 230]],
    names: ['Void Threshold', 'Whispering Dark', 'Broken Stars', 'Black Citadel', "Shadow King's Lair"] },
];
WORLDS.forEach(w => { w.air = air(w.path); w.end = pathEnd(w.path); });

function genWaves(n, lv, boss) {
  const waves = [], count = 5 + lv;
  for (let i = 0; i < count; i++) {
    const k = i % 4, s = n * 0.9 + i * 1.6, rn = Math.round(6 + s), ri = Math.max(0.3, 0.9 - n * 0.015 - i * 0.02), g = [];
    if (k === 0) g.push({ t: 'runner', n: rn, i: ri });
    else if (k === 1) { g.push({ t: 'runner', n: Math.round(rn * 0.7), i: ri }); g.push({ t: 'tank', n: Math.max(2, Math.round(2 + s / 3)), i: 1.6 }); }
    else if (k === 2) { g.push({ t: 'flyer', n: Math.max(3, Math.round(3 + s / 2)), i: 1.1 }); g.push({ t: 'runner', n: Math.round(rn * 0.6), i: ri }); }
    else { g.push({ t: 'tank', n: Math.max(3, Math.round(3 + s / 3)), i: 1.3 }); if (n >= 3) g.push({ t: 'healer', n: Math.max(2, Math.round(2 + s / 5)), i: 1.6 }); g.push({ t: 'runner', n: Math.round(rn * 0.5), i: ri }); }
    waves.push(g);
  }
  if (boss) waves.push([{ t: 'boss', n: 1, i: 1 }, { t: 'tank', n: 4 + Math.floor(n / 4), i: 1.5 }, { t: 'flyer', n: 6, i: 1.0 }]);
  return waves;
}
export const LEVELS = [];
WORLDS.forEach(w => w.names.forEach((name, lv) => {
  const n = w.id * 5 + lv, boss = lv === 4;
  LEVELS.push({ id: n + 1, world: w.id, lv, name, boss, gold: 220 + n * 15, lives: 20, hpMul: 1 + n * 0.06, waves: genWaves(n, lv, boss) });
}));
