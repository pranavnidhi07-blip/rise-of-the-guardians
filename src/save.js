const SAVE_KEY = 'rotg_save', SET_KEY = 'rotg_settings', VER = 1;
export const defaultSave = () => ({ schemaVersion: VER, unlocked: 1, stars: {} });
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || d.schemaVersion !== VER || !Number.isInteger(d.unlocked) || d.unlocked < 1 || d.unlocked > 99) return null;
    if (typeof d.stars !== 'object' || d.stars === null) return null;
    for (const k of Object.keys(d.stars)) if (![0, 1, 2, 3].includes(d.stars[k])) return null;
    return d;
  } catch { return null; }
}
export const writeSave = d => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch {} };
export const clearSave = () => { try { localStorage.removeItem(SAVE_KEY); } catch {} };
const DEF = { master: 0.8, music: 0.6, sfx: 0.8, voice: 0.9, ambient: 0.5, muted: false, mist: true, reducedMotion: false, subtitles: true };
export function loadSettings() {
  try {
    const d = JSON.parse(localStorage.getItem(SET_KEY) || '{}'); const s = { ...DEF };
    for (const k of Object.keys(DEF)) if (typeof d[k] === typeof DEF[k]) s[k] = d[k];
    return s;
  } catch { return { ...DEF }; }
}
export const saveSettings = s => { try { localStorage.setItem(SET_KEY, JSON.stringify(s)); } catch {} };
