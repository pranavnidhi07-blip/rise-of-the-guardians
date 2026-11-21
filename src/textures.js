// Procedural "3D-style" art: every asset is shaded with gradients, rim light, specular highlights and contact shadows.
// Drawn at 2x resolution. Any asset can be replaced by a painted PNG (see src/assets.js and docs/ASSETS.md).
import { K } from './ui.js';
const TAU = Math.PI * 2;
const hx = h => h.length === 4
  ? [...h.slice(1)].map(v => parseInt(v + v, 16))
  : [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
const L = (h, a) => { const [r, g, b] = hx(h), t = a > 0 ? 255 : 0, k = Math.abs(a), f = v => Math.round(v + (t - v) * k); return toHex(f(r), f(g), f(b)); };
const path = (c, pts) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
const outline = (c, col, w = 1.5) => { c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(); };
const poly = (c, pts, col, dir = 'h') => {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const g = dir === 'h' ? c.createLinearGradient(Math.min(...xs), 0, Math.max(...xs), 0) : c.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  g.addColorStop(0, L(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, L(col, -0.45));
  path(c, pts); c.fillStyle = g; c.fill(); outline(c, L(col, -0.7));
};
const ball = (c, x, y, rx, ry, col) => {
  const g = c.createRadialGradient(x - rx * 0.35, y - ry * 0.4, Math.min(rx, ry) * 0.1, x, y, Math.max(rx, ry) * 1.05);
  g.addColorStop(0, L(col, 0.5)); g.addColorStop(0.5, col); g.addColorStop(1, L(col, -0.55));
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = g; c.fill(); outline(c, L(col, -0.7));
};
const slab = (c, x, y, w, h, r, col) => {
  const g = c.createLinearGradient(x, y, x + w, y); g.addColorStop(0, L(col, 0.3)); g.addColorStop(0.5, col); g.addColorStop(1, L(col, -0.5));
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = g; c.fill(); outline(c, L(col, -0.7));
  c.beginPath(); c.moveTo(x + r, y + 1.6); c.lineTo(x + w - r, y + 1.6); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.4; c.stroke();
};
const shadow = (c, x, y, rx) => { c.save(); c.translate(x, y); c.scale(1, 0.28); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); };
const glow = (c, x, y, r, col) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
const dot = (c, x, y, r, col) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); };
const line = (c, pts, col, w) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.stroke(); };
const star = (c, cx, cy, r1, r2, col) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } poly(c, p, col, 'v'); };
const mirror = (pts, w) => pts.map(p => [w - p[0], p[1]]);

// stone cylinder platform shared by all towers
const base = (c, col = '#8d8f9e') => {
  shadow(c, 32, 58, 29);
  const g = c.createLinearGradient(7, 0, 57, 0); g.addColorStop(0, L(col, 0.25)); g.addColorStop(0.5, col); g.addColorStop(1, L(col, -0.55));
  c.fillStyle = g; c.beginPath(); c.ellipse(32, 47, 25, 10, 0, 0, TAU); c.fill(); c.fillRect(7, 37, 50, 10);
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; [16, 26, 38, 48].forEach(x => { c.beginPath(); c.moveTo(x, 37); c.lineTo(x + 2, 47); c.stroke(); });
  const t = c.createRadialGradient(26, 32, 2, 32, 37, 28); t.addColorStop(0, L(col, 0.5)); t.addColorStop(1, col);
  c.beginPath(); c.ellipse(32, 37, 25, 10, 0, 0, TAU); c.fillStyle = t; c.fill(); outline(c, L(col, -0.7));
};

function dragon(c, up) {
  shadow(c, 110, 122, 60);
  const wing = (dx, col) => {
    const y = up ? [4, 30, 60] : [90, 70, 56];
    poly(c, [[100 + dx, 62], [64 + dx, y[0]], [88 + dx, y[1]], [66 + dx, y[1] + 22], [100 + dx, y[2] + 10], [124 + dx, 66]], col, 'v');
    line(c, [[100 + dx, 62], [64 + dx, y[0]]], L(col, -0.6), 2); line(c, [[104 + dx, 64], [88 + dx, y[1]]], L(col, -0.6), 1.5);
  };
  wing(-10, '#8a1f8f');
  poly(c, [[60, 74], [20, 92], [4, 84], [18, 98], [64, 90]], '#4a2a7a', 'v');               // tail
  ball(c, 108, 76, 44, 22, '#4a2a7a'); ball(c, 112, 86, 32, 12, '#a77bd8');                   // body + belly
  poly(c, [[138, 66], [160, 40], [172, 46], [150, 78]], '#4a2a7a', 'v');                      // neck
  ball(c, 176, 40, 19, 13, '#5a2f94'); ball(c, 192, 46, 12, 8, '#6a3fa8');                    // head + snout
  poly(c, [[168, 30], [160, 10], [176, 28]], '#efe3c0'); poly(c, [[178, 28], [180, 8], [188, 30]], '#efe3c0'); // horns
  glow(c, 178, 38, 10, 'rgba(255,90,200,.8)'); dot(c, 178, 38, 3.2, '#ff7ad8'); dot(c, 178, 38, 1.2, '#300');
  [[196, 50], [190, 50]].forEach(([x, y]) => poly(c, [[x, y], [x + 2, y + 6], [x + 4, y]], '#fff'));
  for (let i = 0; i < 6; i++) poly(c, [[76 + i * 12, 58 - Math.abs(i - 2.5)], [80 + i * 12, 46 - Math.abs(i - 2.5) * 1.5], [84 + i * 12, 58 - Math.abs(i - 2.5)]], '#c43ad0');
  ball(c, 98, 100, 7, 10, '#3d2268'); ball(c, 128, 100, 7, 10, '#3d2268');
  wing(14, '#c43ad0');
  glow(c, 150, 70, 22, 'rgba(255,120,60,.25)');
}
function title(c) {
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const go = (txt, y, size, spacing) => {
    c.font = `bold ${size}px Georgia, "Palatino Linotype", serif`; if ('letterSpacing' in c) c.letterSpacing = spacing + 'px';
    c.shadowColor = 'rgba(255,190,60,.9)'; c.shadowBlur = 26; c.strokeStyle = '#2a1500'; c.lineWidth = size * 0.2; c.strokeText(txt, 390, y);
    c.shadowBlur = 0; const g = c.createLinearGradient(0, y - size / 2, 0, y + size / 2); g.addColorStop(0, '#fffbd0'); g.addColorStop(0.45, '#f7d65a'); g.addColorStop(0.55, '#e0a82e'); g.addColorStop(1, '#8a5a0a');
    c.fillStyle = g; c.fillText(txt, 390, y); c.strokeStyle = 'rgba(255,250,200,.55)'; c.lineWidth = 1.5; c.strokeText(txt, 390, y);
  };
  go('RISE OF THE', 44, 44, 10); go('GUARDIANS', 128, 108, 4);
  [[120, 'l'], [660, 'r']].forEach(([x]) => { line(c, [[x - 60, 44], [x + 60, 44]], '#e0a82e', 2); });
  poly(c, [[390 - 0, 188], [396, 194], [390, 200], [384, 194]], '#f7d65a', 'v');
  line(c, [[250, 194], [376, 194]], '#e0a82e', 2); line(c, [[404, 194], [530, 194]], '#e0a82e', 2);
}

export function mk(scene, key, w, h, fn) {
  if (scene.textures.exists(key)) return;
  const cv = document.createElement('canvas'); cv.width = w * K; cv.height = h * K;
  const c = cv.getContext('2d'); c.scale(K, K); fn(c); scene.textures.addCanvas(key, cv);
}

export const JOBS = [
  // ---------------- towers (64x64)
  ['t_archer', 64, 64, c => { base(c, '#8d8472'); slab(c, 22, 16, 20, 24, 3, '#a0703c'); c.strokeStyle = 'rgba(0,0,0,.3)'; [28, 33, 38].forEach(x => { c.beginPath(); c.moveTo(x, 17); c.lineTo(x, 39); c.stroke(); });
    poly(c, [[15, 19], [32, 3], [49, 19]], '#2f9d58'); slab(c, 27, 24, 10, 9, 2, '#22150a'); ball(c, 32, 29, 3.4, 3.4, '#f0c8a0'); poly(c, [[32, 3], [44, 6], [32, 9]], '#e0407e'); }],
  ['t_cannon', 64, 64, c => { base(c, '#7b7f8e'); ball(c, 32, 33, 17, 13, '#3b4252'); slab(c, 26, 6, 12, 28, 4, '#2b303c'); slab(c, 25, 5, 14, 5, 2, '#d4a72c'); [[22, 33], [42, 33], [32, 40]].forEach(([x, y]) => dot(c, x, y, 1.6, '#c9a227')); }],
  ['t_frost', 64, 64, c => { base(c, '#6b93a8'); glow(c, 32, 26, 30, 'rgba(120,220,255,.6)');
    poly(c, [[16, 16], [24, 32], [18, 46], [10, 32]], '#5fb8e8'); poly(c, mirror([[16, 16], [24, 32], [18, 46], [10, 32]], 64), '#5fb8e8');
    poly(c, [[32, 0], [43, 26], [32, 50], [21, 26]], '#8fe3ff'); line(c, [[32, 4], [37, 24]], 'rgba(255,255,255,.8)', 2); }],
  ['t_mage', 64, 64, c => { base(c, '#7a6aa8'); slab(c, 23, 22, 18, 22, 3, '#6a5aa8'); poly(c, [[16, 25], [32, 2], [48, 25]], '#7b49d1'); slab(c, 28, 31, 8, 10, 4, '#ffe27a');
    glow(c, 32, 10, 14, 'rgba(255,226,122,.7)'); ball(c, 32, 10, 5, 5, '#ffe27a'); }],
  // ---------------- enemies
  ['e_runner', 44, 44, c => { shadow(c, 22, 40, 16); poly(c, [[7, 14], [15, 20], [8, 26]], '#6bc04b'); poly(c, mirror([[7, 14], [15, 20], [8, 26]], 44), '#6bc04b');
    ball(c, 22, 28, 12, 11, '#5fae42'); ball(c, 22, 18, 10, 9, '#78cf55'); dot(c, 18, 17, 3, '#fff'); dot(c, 26, 17, 3, '#fff'); dot(c, 18.5, 17.5, 1.5, '#111'); dot(c, 26.5, 17.5, 1.5, '#111');
    poly(c, [[19, 23], [21, 26], [23, 23]], '#fff'); slab(c, 31, 26, 3, 12, 1, '#cfd6e0'); }],
  ['e_tank', 52, 52, c => { shadow(c, 26, 48, 20); slab(c, 8, 18, 36, 28, 8, '#6f7f5a'); slab(c, 12, 24, 28, 15, 5, '#8a8f9c'); [16, 26, 36].forEach(x => dot(c, x, 31, 1.8, '#d4cfae'));
    ball(c, 26, 15, 11, 10, '#7a9a5a'); poly(c, [[16, 11], [9, 0], [21, 8]], '#efe3c0'); poly(c, [[36, 11], [43, 0], [31, 8]], '#efe3c0');
    dot(c, 22, 15, 2.2, '#ff5a5a'); dot(c, 30, 15, 2.2, '#ff5a5a'); poly(c, [[20, 21], [22, 26], [24, 21]], '#fff'); poly(c, [[28, 21], [30, 26], [32, 21]], '#fff'); }],
  ['e_flyer', 56, 46, c => { shadow(c, 28, 44, 10); const w = [[28, 20], [2, 4], [10, 22], [4, 34], [22, 30]]; poly(c, w, '#7b49d1', 'v'); poly(c, mirror(w, 56), '#7b49d1', 'v');
    line(c, [[28, 20], [4, 8]], '#3a1f6b', 1.5); line(c, [[28, 20], [52, 8]], '#3a1f6b', 1.5); poly(c, [[28, 32], [23, 45], [33, 45]], '#5a3a9a', 'v');
    ball(c, 28, 24, 10, 13, '#5a3a9a'); ball(c, 28, 13, 8, 7, '#6b4aa8'); poly(c, [[22, 8], [19, 0], [25, 6]], '#efe3c0'); poly(c, [[34, 8], [37, 0], [31, 6]], '#efe3c0'); glow(c, 24, 12, 6, 'rgba(255,230,90,.9)'); glow(c, 32, 12, 6, 'rgba(255,230,90,.9)'); }],
  ['e_healer', 44, 50, c => { shadow(c, 22, 46, 15); poly(c, [[22, 16], [36, 46], [8, 46]], '#3a2a5a', 'v'); ball(c, 22, 15, 9, 9, '#4a3470'); ball(c, 22, 17, 5.5, 5, '#150b24');
    glow(c, 20, 17, 4, 'rgba(120,255,160,.9)'); glow(c, 25, 17, 4, 'rgba(120,255,160,.9)'); slab(c, 35, 12, 3, 34, 1, '#6b4a2a'); glow(c, 36.5, 10, 11, 'rgba(120,255,160,.7)'); ball(c, 36.5, 10, 4, 4, '#8affb0'); }],
  ['e_boss', 140, 120, c => { shadow(c, 70, 114, 52);
    const w = [[50, 56], [6, 14], [22, 50], [8, 68], [38, 66]]; poly(c, w, '#b02ab0', 'v'); poly(c, mirror(w, 140), '#b02ab0', 'v'); line(c, [[50, 56], [8, 16]], '#4a0f55', 2); line(c, mirror([[50, 56], [8, 16]], 140), '#4a0f55', 2);
    ball(c, 70, 76, 40, 30, '#4a2a7a'); ball(c, 70, 90, 24, 16, '#a77bd8');
    for (let i = 0; i < 5; i++) poly(c, [[44 + i * 12, 54], [50 + i * 12, 38 - (i === 2 ? 4 : 0)], [56 + i * 12, 54]], '#c43ad0');
    ball(c, 70, 44, 22, 17, '#5a2f94'); ball(c, 70, 58, 13, 9, '#6a3fa8');
    poly(c, [[52, 36], [42, 10], [62, 30]], '#efe3c0'); poly(c, mirror([[52, 36], [42, 10], [62, 30]], 140), '#efe3c0');
    glow(c, 58, 40, 11, 'rgba(255,90,200,.9)'); glow(c, 82, 40, 11, 'rgba(255,90,200,.9)'); dot(c, 58, 40, 3.6, '#ff7ad8'); dot(c, 82, 40, 3.6, '#ff7ad8'); dot(c, 58, 40, 1.3, '#300'); dot(c, 82, 40, 1.3, '#300');
    poly(c, [[62, 56], [64, 63], [66, 56]], '#fff'); poly(c, [[74, 56], [76, 63], [78, 56]], '#fff'); glow(c, 70, 66, 18, 'rgba(255,120,60,.45)');
    [[48, 106], [92, 106]].forEach(([x, y]) => { ball(c, x, y, 9, 7, '#3d2268'); poly(c, [[x - 6, y + 4], [x - 4, y + 10], [x - 2, y + 4]], '#efe3c0'); poly(c, [[x + 2, y + 4], [x + 4, y + 10], [x + 6, y + 4]], '#efe3c0'); }); }],
  ['dragon_a', 220, 130, c => dragon(c, true)],
  ['dragon_b', 220, 130, c => dragon(c, false)],
  // ---------------- projectiles / fx
  ['p_arrow', 16, 16, c => { line(c, [[1, 8], [11, 8]], '#8a5a2a', 2); poly(c, [[10, 4.5], [16, 8], [10, 11.5]], '#e8eef5'); poly(c, [[0, 5], [3, 8], [0, 11]], '#e0407e'); }],
  ['p_ball', 16, 16, c => ball(c, 8, 8, 6.5, 6.5, '#3b3f4f')],
  ['p_ice', 16, 16, c => { glow(c, 8, 8, 8, 'rgba(140,230,255,.7)'); poly(c, [[8, 0], [13, 8], [8, 16], [3, 8]], '#bff0ff'); }],
  ['p_magic', 16, 16, c => { const g = c.createRadialGradient(8, 8, 1, 8, 8, 8); g.addColorStop(0, '#fff'); g.addColorStop(0.45, '#c9a8ff'); g.addColorStop(1, 'rgba(138,86,224,0)'); c.fillStyle = g; c.fillRect(0, 0, 16, 16); }],
  ['particle', 16, 16, c => { const g = c.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 16, 16); }],
  ['mist', 300, 120, c => { c.scale(1, 0.4); const g = c.createRadialGradient(150, 150, 0, 150, 150, 150); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 300, 300); }],
  ['ray', 160, 520, c => { const g = c.createLinearGradient(0, 0, 0, 520); g.addColorStop(0, 'rgba(255,244,190,.8)'); g.addColorStop(1, 'rgba(255,244,190,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(50, 0); c.lineTo(110, 0); c.lineTo(160, 520); c.lineTo(0, 520); c.closePath(); c.fill(); }],
  ['vignette', 320, 180, c => { const g = c.createRadialGradient(160, 90, 50, 160, 90, 210); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(5,10,25,.7)'); c.fillStyle = g; c.fillRect(0, 0, 320, 180); }],
  ['title', 780, 210, title],
  // ---------------- icons
  ['i_coin', 24, 24, c => { ball(c, 12, 12, 10, 10, '#ffd23f'); c.beginPath(); c.arc(12, 12, 5.5, 0, TAU); c.strokeStyle = '#b8860b'; c.lineWidth = 1.5; c.stroke(); }],
  ['i_heart', 24, 24, c => { c.beginPath(); c.moveTo(12, 21); c.bezierCurveTo(-4, 10, 4, -2, 12, 6); c.bezierCurveTo(20, -2, 28, 10, 12, 21); const g = c.createRadialGradient(9, 8, 1, 12, 12, 12); g.addColorStop(0, '#ff8ab8'); g.addColorStop(1, '#c0245f'); c.fillStyle = g; c.fill(); outline(c, '#6a1038', 1.5); }],
  ['i_star', 36, 36, c => { glow(c, 18, 18, 18, 'rgba(255,210,63,.4)'); star(c, 18, 18, 16, 7, '#ffd23f'); }],
  ['i_star0', 36, 36, c => star(c, 18, 18, 16, 7, '#3b4560')],
  // ---------------- characters (64x84)
  ['fairy', 64, 76, c => { glow(c, 32, 40, 30, 'rgba(160,255,240,.35)');
    [[-0.5, 18], [0.5, 46]].forEach(([r, x]) => { const g = c.createLinearGradient(x - 12, 14, x + 12, 50); g.addColorStop(0, 'rgba(220,255,255,.9)'); g.addColorStop(1, 'rgba(120,200,230,.5)'); c.beginPath(); c.ellipse(x, 32, 12, 19, r, 0, TAU); c.fillStyle = g; c.fill(); outline(c, '#7cc8e0', 1.2); });
    poly(c, [[25, 38], [39, 38], [47, 66], [17, 66]], '#1fb5a8', 'v'); ball(c, 32, 29, 10, 10, '#ffd9b8'); poly(c, [[21, 24], [32, 14], [43, 24], [40, 20], [32, 18], [24, 20]], '#f2c94c'); ball(c, 32, 14, 5, 5, '#f2c94c');
    dot(c, 28, 30, 1.5, '#222'); dot(c, 36, 30, 1.5, '#222'); line(c, [[42, 44], [55, 24]], '#c9a227', 2.5); glow(c, 55, 21, 9, 'rgba(255,243,160,.8)'); star(c, 55, 21, 6, 2.6, '#fff3a0'); }],
  ['h_prince', 64, 84, c => { shadow(c, 32, 80, 22); poly(c, [[18, 34], [46, 34], [56, 78], [8, 78]], '#2e5fbf', 'v');
    slab(c, 22, 62, 8, 18, 3, '#3a4a78'); slab(c, 34, 62, 8, 18, 3, '#3a4a78'); slab(c, 20, 34, 24, 28, 6, '#c5ccd9'); line(c, [[22, 52], [42, 52]], '#d4a72c', 3); line(c, [[32, 36], [32, 52]], '#d4a72c', 2);
    ball(c, 32, 24, 10, 10, '#f2cfa8'); poly(c, [[22, 22], [32, 12], [42, 22], [40, 17], [32, 15], [24, 17]], '#6a3f1f');
    poly(c, [[22, 16], [24, 7], [28, 13], [32, 5], [36, 13], [40, 7], [42, 16]], '#f2c94c', 'v'); dot(c, 28, 25, 1.4, '#222'); dot(c, 36, 25, 1.4, '#222');
    slab(c, 47, 24, 5, 42, 2, '#e8eef5'); slab(c, 44, 52, 11, 4, 2, '#d4a72c'); slab(c, 5, 40, 15, 24, 6, '#2e5fbf'); star(c, 12.5, 52, 5, 2.2, '#f2c94c'); }],
  ['h_princess', 64, 84, c => { shadow(c, 32, 80, 24); poly(c, [[19, 20], [45, 20], [50, 58], [14, 58]], '#e8b84a', 'v');
    poly(c, [[22, 36], [42, 36], [58, 80], [6, 80]], '#d65aa8', 'v'); slab(c, 23, 31, 18, 13, 5, '#e879c0');
    ball(c, 32, 25, 10, 10, '#f6d4b4'); poly(c, [[22, 20], [32, 12], [42, 20], [38, 17], [32, 15], [26, 17]], '#e8b84a'); poly(c, [[26, 14], [28, 8], [32, 13], [36, 8], [38, 14]], '#f7e27a', 'v');
    dot(c, 28, 26, 1.4, '#3a2a4a'); dot(c, 36, 26, 1.4, '#3a2a4a'); line(c, [[29, 30], [32, 31.5], [35, 30]], '#c0455a', 1.2);
    slab(c, 50, 30, 3, 46, 1, '#d4a72c'); glow(c, 51.5, 26, 12, 'rgba(255,200,255,.8)'); star(c, 51.5, 26, 7, 3, '#fff3a0'); }],
  ['h_archer', 64, 84, c => { shadow(c, 32, 80, 22); poly(c, [[18, 34], [46, 34], [52, 78], [12, 78]], '#2f9d58', 'v'); slab(c, 22, 36, 20, 26, 5, '#7a5230');
    ball(c, 32, 22, 13, 12, '#17653a'); ball(c, 32, 26, 8, 8, '#f0c8a0'); dot(c, 29, 26, 1.3, '#222'); dot(c, 35, 26, 1.3, '#222');
    c.beginPath(); c.arc(54, 50, 26, -1.15, 1.15); c.strokeStyle = '#9a6b3c'; c.lineWidth = 3.5; c.stroke(); line(c, [[54 + 26 * Math.cos(-1.15), 50 + 26 * Math.sin(-1.15)], [54 + 26 * Math.cos(1.15), 50 + 26 * Math.sin(1.15)]], '#eee', 1); }],
  // ---------------- scenery
  ['tree', 100, 130, c => { shadow(c, 50, 124, 34); poly(c, [[43, 70], [57, 70], [60, 124], [40, 124]], '#7a5230'); ball(c, 50, 58, 34, 30, '#176b3a'); ball(c, 30, 70, 24, 22, '#1f8f4e'); ball(c, 70, 70, 24, 22, '#1f8f4e'); ball(c, 50, 38, 28, 24, '#25a35a'); ball(c, 40, 30, 14, 11, '#4cc47c'); }],
  ['flower', 18, 22, c => { line(c, [[9, 9], [9, 22]], '#2f8f4e', 2); [[9, 3], [14, 7], [12, 12], [6, 12], [4, 7]].forEach(([x, y]) => dot(c, x, y, 3.6, '#fff')); dot(c, 9, 8, 3, '#ffd23f'); }],
  ['rock', 64, 44, c => { shadow(c, 32, 40, 26); poly(c, [[6, 38], [10, 18], [26, 8], [46, 12], [58, 28], [56, 38]], '#8a8f99', 'v'); poly(c, [[10, 22], [24, 12], [36, 14], [22, 24]], '#3f8f4a'); }],
  ['crystal', 52, 76, c => { glow(c, 26, 40, 32, 'rgba(190,150,255,.45)'); poly(c, [[26, 1], [43, 26], [37, 74], [15, 74], [9, 26]], '#a47be0'); poly(c, [[26, 1], [26, 74], [37, 74], [43, 26]], '#6b3fb5'); line(c, [[24, 8], [16, 28]], 'rgba(255,255,255,.7)', 2); }],
  ['cloud', 180, 80, c => { [[50, 50, 26], [80, 38, 32], [115, 46, 30], [145, 54, 22]].forEach(([x, y, r]) => { const g = c.createRadialGradient(x - 6, y - 8, 2, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.98)'); g.addColorStop(1, 'rgba(205,220,240,.9)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }); }],
  ['butterfly', 24, 18, c => { [[7, 7, -0.5], [17, 7, 0.5]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, 7, 5, r, 0, TAU); c.fillStyle = '#ff7ac8'; c.fill(); outline(c, '#a8327a', 1); }); [[7, 12], [17, 12]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 5, 4, 0, 0, TAU); c.fillStyle = '#ffb3e0'; c.fill(); }); slab(c, 11, 3, 2, 12, 1, '#333'); }],
  ['bird', 28, 12, c => { line(c, [[2, 8], [8, 1], [14, 7]], '#1a2a4a', 2); line(c, [[14, 7], [20, 1], [26, 8]], '#1a2a4a', 2); }],
  ['castle', 240, 240, c => { shadow(c, 120, 232, 100);
    const stone = (x, y, w, h, col = '#9b94d0') => slab(c, x, y, w, h, 2, col);
    stone(50, 120, 140, 110, '#8f87c9'); stone(24, 76, 44, 154, '#a39bd8'); stone(172, 76, 44, 154, '#a39bd8'); stone(92, 54, 56, 176, '#b3acdf');
    [[24, 76, 44], [172, 76, 44]].forEach(([x, y, w]) => { for (let i = 0; i < 4; i++) slab(c, x + 2 + i * 11, y - 8, 8, 9, 1, '#a39bd8'); });
    poly(c, [[14, 80], [46, 22], [78, 80]], '#2e5fbf'); poly(c, [[162, 80], [194, 22], [226, 80]], '#2e5fbf'); poly(c, [[82, 58], [120, 4], [158, 58]], '#2e5fbf');
    slab(c, 104, 168, 32, 62, 16, '#3a2f6b'); [[46, 108], [194, 108], [120, 88], [120, 130]].forEach(([x, y]) => { glow(c, x, y, 10, 'rgba(255,226,122,.7)'); slab(c, x - 4, y - 8, 8, 14, 4, '#ffe27a'); }); }],
  ['flag', 24, 16, c => { slab(c, 0, 0, 2, 16, 1, '#555'); poly(c, [[2, 1], [24, 6], [2, 11]], '#e0407e', 'v'); }],
  ['water', 64, 64, c => { const g = c.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, '#4fc3e8'); g.addColorStop(0.5, '#a8ecff'); g.addColorStop(1, '#4fc3e8'); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    [[6, 4], [18, 20], [30, 8], [42, 26], [54, 12], [12, 36], [36, 40], [48, 48]].forEach(([x, y]) => { c.beginPath(); c.roundRect(x, y, 3, 26, 1.5); c.fillStyle = 'rgba(255,255,255,.75)'; c.fill(); }); }],
  // ---------------- world scenery
  ['tree_snow', 100, 130, c => { shadow(c, 50, 124, 32); poly(c, [[44, 96], [56, 96], [58, 124], [42, 124]], '#5a4030');
    [[78, 10, 40], [58, 24, 32], [38, 38, 26]].forEach(([yb, y0, hw], i) => { poly(c, [[50 - hw, yb + 22], [50, y0 + 2], [50 + hw, yb + 22]], '#2f6f6a', 'v'); poly(c, [[50 - hw * 0.62, yb + 2], [50, y0 + 2], [50 + hw * 0.62, yb + 2], [50 + hw * 0.3, yb + 8], [50, yb + 1], [50 - hw * 0.3, yb + 8]], '#f4fbff', 'v'); }); }],
  ['ice_spike', 52, 80, c => { glow(c, 26, 46, 30, 'rgba(150,230,255,.5)'); shadow(c, 26, 76, 22);
    poly(c, [[10, 76], [14, 36], [20, 76]], '#7fd0f0'); poly(c, [[34, 76], [40, 44], [44, 76]], '#7fd0f0'); poly(c, [[16, 76], [26, 2], [38, 76]], '#bff0ff'); line(c, [[24, 10], [22, 50]], 'rgba(255,255,255,.8)', 2); }],
  ['rock_snow', 64, 44, c => { shadow(c, 32, 40, 26); poly(c, [[6, 38], [10, 18], [26, 8], [46, 12], [58, 28], [56, 38]], '#7a8794', 'v'); poly(c, [[8, 22], [24, 8], [46, 12], [56, 26], [40, 20], [26, 24], [18, 20]], '#f4fbff', 'v'); }],
  ['tree_dead', 100, 130, c => { shadow(c, 50, 124, 30); poly(c, [[44, 40], [56, 40], [60, 124], [40, 124]], '#8a8a8a');
    [[[50, 70], [22, 40], [14, 18]], [[50, 56], [80, 34], [88, 12]], [[50, 90], [26, 74], [12, 70]], [[50, 82], [76, 64], [90, 60]], [[22, 40], [30, 20]], [[80, 34], [70, 14]]].forEach(b => line(c, b, '#6a6a6a', 5)); }],
  ['rock_lava', 64, 44, c => { shadow(c, 32, 40, 26); glow(c, 32, 30, 28, 'rgba(255,100,30,.4)'); poly(c, [[6, 38], [10, 18], [26, 8], [46, 12], [58, 28], [56, 38]], '#3a302e', 'v');
    line(c, [[16, 30], [28, 22], [36, 30], [48, 22]], '#ff7a2a', 2.5); line(c, [[24, 14], [30, 22]], '#ffb347', 2); }],
  ['spike_obsidian', 52, 80, c => { glow(c, 26, 60, 28, 'rgba(255,110,40,.45)'); shadow(c, 26, 76, 22);
    poly(c, [[8, 76], [16, 30], [22, 76]], '#26202a'); poly(c, [[30, 76], [38, 40], [46, 76]], '#26202a'); poly(c, [[14, 76], [26, 2], [38, 76]], '#3a2f42'); line(c, [[26, 6], [26, 70]], '#ff7a2a', 1.6); }],
  ['tomb', 44, 56, c => { shadow(c, 22, 52, 18); slab(c, 8, 18, 28, 34, 12, '#8a929c'); slab(c, 16, 8, 12, 14, 3, '#9aa2ac'); slab(c, 19, 12, 6, 24, 2, '#6a727c'); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(14, 44); c.lineTo(30, 44); c.stroke(); poly(c, [[6, 52], [38, 52], [34, 47], [10, 47]], '#3f7a45'); }],
  ['lantern', 30, 70, c => { shadow(c, 15, 66, 12); slab(c, 13, 14, 4, 52, 1, '#2a2f38'); glow(c, 15, 12, 18, 'rgba(154,255,154,.55)'); slab(c, 8, 4, 14, 16, 4, '#9aff9a'); poly(c, [[6, 5], [15, -2], [24, 5]].map(p => [p[0], p[1] + 2]), '#2a2f38'); }],
  ['spire', 60, 110, c => { glow(c, 30, 60, 36, 'rgba(180,120,255,.4)'); shadow(c, 30, 106, 24);
    poly(c, [[6, 106], [16, 50], [26, 106]], '#1a1230'); poly(c, [[36, 106], [46, 56], [54, 106]], '#1a1230'); poly(c, [[14, 106], [30, 2], [46, 106]], '#2e2250'); line(c, [[30, 8], [28, 100]], '#b080ff', 1.8); star(c, 30, 30, 5, 2, '#d6b8ff'); }],
];
