# Rise of the Guardians

A fantasy tower defense game for the browser, built with **Phaser 3 + Vite** following the SDDrise-of-the-guardians v1.1 (see `docs/`).
All art is drawn in code at 2x resolution and all audio (music, SFX, ambient) is synthesized with the Web Audio API,
so there are **no asset files and no licensing issues**.

## Run it
Requires Node.js 18+.

    npm install
    npm run dev        # open the URL it prints (usually http://localhost:5173)
    npm run build      # production build in dist/ (host on Netlify, GitHub Pages, etc.)

## What is included
- Animated home screen: parallax scenery, drifting clouds, waterfall, swaying trees, glowing crystals, fireflies,
  butterflies, birds, optional mist, clickable heroes and fairy, music + ambient sound
- "Click to begin" screen (browsers need a click before audio), loading bar
- World map with 3 levels (Whispering Glade, Mossy Ruins, Heart Grove with a boss), stars, locked levels
- 4 towers x 3 upgrade tiers, sell, aim modes (First / Strongest / Closest), range preview
- 5 enemy types (runner, tank, flyer, healer, boss with an enrage phase)
- Wave preview, start-next-wave, 1x/2x speed, pause, restart, Meteor and Freeze abilities with cooldowns
- Level 1 tutorial led by the fairy mascot, 1-3 star ratings, victory/defeat screens
- Audio: separate Music / SFX / Voice / Ambient sliders + mute, all saved; voice lines use browser text-to-speech with subtitles
- Settings: mist toggle, Reduced Motion, subtitles
- Save/Continue Journey with schema version and validation; New Game asks before overwriting

## 5 worlds, 25 levels (v1.2)
| World | Look | Weather / sound | Boss |
|---|---|---|---|
| Enchanted Forest | green meadow, trees, flowers | drifting leaves, birds, crickets, owl | Elder Wyrm |
| Frozen Mountains | snow, ice patches, pines, ice spikes | snowfall, howling wind | Frost Drake |
| Volcanic Wasteland | ash ground, glowing lava pools, obsidian | rising embers, rumble, crackling | Magma Dragon |
| Cursed Kingdom | grey graveyard, tombs, lanterns, dead trees | green wisps, lightning flashes, owl | Lich Wyrm |
| Shadow Realm | void cracks, dark spires, purple crystals | floating motes, low drone | The Shadow King |

Each world has its own map layout (enemy route), colour palette, scenery, enemy colouring, music track and ambient sound.
Worlds unlock in order (clear a world's levels to open the next). The last level of each world is a boss fight.
Edit `src/data/worlds.js` to change paths, palettes, level names, or the wave generator.

## Visual upgrade (v1.1.1)
- "3D-style" shaded art: gradients, rim light, specular highlights and contact shadows on every tower, enemy and hero
- Prince Aldric, Princess Elara, Rowan the archer and Pip the fairy; a purple dragon boss and a flying dragon on the home screen
- Gold embossed title, god rays, vignette, richer forest ground and stone path, forest ambience (wind, waterfall, birds, crickets, owl)
- **Drop-in painted art:** see `docs/ASSETS.md` and `src/assets.js` to replace any sprite or the home/battlefield backgrounds with real paintings

## Controls
Mouse or touch. Keys: 1-4 pick tower, Space pause, Enter/N start wave, M meteor, F freeze, X speed, Esc cancel.

## Where to change things
- `src/data/game.json`: towers, enemies, levels, waves, path (balance without touching code)
- `src/audio.js`: music tracks (`TRACKS`), sound effects
- `src/textures.js`: all artwork
- `src/scenes/`: Boot, Begin, Home, MapScene, Game, Result

## Notes
- Sharpness: canvas is scaled by devicePixelRatio (max 1.5) and textures are authored at 2x.
- Voice lines depend on the browser's built-in voices, so they sound different per device.
- Performance target is 60 FPS; the Settings > Reduced Motion option lowers effects for slower machines.
