# Replacing the built-in art with your own painted assets

1. Export a transparent PNG named `<key>.png` into `public/assets/images/`.
2. Add the key to `OVERRIDES` in `src/assets.js`.
3. Restart `npm run dev`. The PNG is auto-resized to the logical size below; draw it at 2x or 3x that size for sharpness.

Keep the camera angle and lighting direction (light from top-left) consistent across assets.

| Key | Logical size (px) | Type |
|---|---|---|
| `t_archer` | 64 x 64 | Tower |
| `t_cannon` | 64 x 64 | Tower |
| `t_frost` | 64 x 64 | Tower |
| `t_mage` | 64 x 64 | Tower |
| `e_runner` | 44 x 44 | Enemy |
| `e_tank` | 52 x 52 | Enemy |
| `e_flyer` | 56 x 46 | Enemy |
| `e_healer` | 44 x 50 | Enemy |
| `e_boss` | 140 x 120 | Enemy |
| `dragon_a` | 220 x 130 | Flying dragon wing frame |
| `dragon_b` | 220 x 130 | Flying dragon wing frame |
| `p_arrow` | 16 x 16 | Projectile |
| `p_ball` | 16 x 16 | Projectile |
| `p_ice` | 16 x 16 | Projectile |
| `p_magic` | 16 x 16 | Projectile |
| `particle` | 16 x 16 | Scenery / effect |
| `mist` | 300 x 120 | Scenery / effect |
| `ray` | 160 x 520 | Scenery / effect |
| `vignette` | 320 x 180 | Scenery / effect |
| `title` | 780 x 210 | Scenery / effect |
| `i_coin` | 24 x 24 | Icon |
| `i_heart` | 24 x 24 | Icon |
| `i_star` | 36 x 36 | Icon |
| `i_star0` | 36 x 36 | Icon |
| `fairy` | 64 x 76 | Scenery / effect |
| `h_prince` | 64 x 84 | Hero |
| `h_princess` | 64 x 84 | Hero |
| `h_archer` | 64 x 84 | Hero |
| `tree` | 100 x 130 | Scenery / effect |
| `flower` | 18 x 22 | Scenery / effect |
| `rock` | 64 x 44 | Scenery / effect |
| `crystal` | 52 x 76 | Scenery / effect |
| `cloud` | 180 x 80 | Scenery / effect |
| `butterfly` | 24 x 18 | Scenery / effect |
| `bird` | 28 x 12 | Scenery / effect |
| `castle` | 240 x 240 | Scenery / effect |
| `flag` | 24 x 16 | Scenery / effect |
| `water` | 64 x 64 | Scenery / effect |
| `tree_snow` | 100 x 130 | Scenery / effect |
| `ice_spike` | 52 x 80 | Scenery / effect |
| `rock_snow` | 64 x 44 | Scenery / effect |
| `tree_dead` | 100 x 130 | Scenery / effect |
| `rock_lava` | 64 x 44 | Scenery / effect |
| `spike_obsidian` | 52 x 80 | Scenery / effect |
| `tomb` | 44 x 56 | Scenery / effect |
| `lantern` | 30 x 70 | Scenery / effect |
| `spire` | 60 x 110 | Scenery / effect |

## Full-screen backgrounds
Put JPG/PNG files in `public/assets/images/backgrounds/` and register them in `BACKGROUNDS` in `src/assets.js`:
- `bg_home`: Home screen (1280x720 or larger). Animated particles, fireflies, mist, rays, dragon and heroes still play on top.
- `bg_map_0` to `bg_map_4`: battlefield of world 1 to 5 (or `bg_map` for all). Edit that world's `path` in `src/data/worlds.js` so enemies follow the road in your painting.

## Where to get art
Kenney.nl, OpenGameArt.org and itch.io (game assets > fantasy / tower defense), or commission a 2D artist. Check each licence before shipping.