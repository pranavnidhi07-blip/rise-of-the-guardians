// ---- DROP-IN PAINTED ART -------------------------------------------------------------
// 1) Sprites: put a PNG named <key>.png in  public/assets/images/  and add the key here.
//    Keys and recommended pixel sizes are listed in docs/ASSETS.md (e.g. 't_archer', 'e_boss', 'h_prince').
//    The PNG is automatically resized and used instead of the built-in drawing.
export const OVERRIDES = [
  // 't_archer', 'e_runner', 'h_prince',
];
// 2) Full-screen painted backgrounds (JPG/PNG, 1280x720 or bigger), path relative to public/assets/images/
//    bg_home -> Home screen   |   bg_map -> every battlefield   |   bg_map_0 ... bg_map_4 -> one specific world
//    (then edit that world's "path" in src/data/worlds.js so enemies follow the road in your art)
export const BACKGROUNDS = {
  // bg_home: 'backgrounds/home.jpg',
  // bg_map_0: 'backgrounds/forest-map.jpg',
  // bg_map_1: 'backgrounds/frozen-map.jpg',
};
