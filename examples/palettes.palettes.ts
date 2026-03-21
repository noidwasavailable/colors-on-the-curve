import type { PalettesConfig } from '../src/types';

const palettesConfig: PalettesConfig = {
  names: ["aaa", "bbb", "ccc"],
  namePrefix: "blue",
  hues: { start: 180, end: 240, count: 3, curve: 'easeInOut' },
  hueShift: -15,
  saturation: { peak: 100, minDark: 40, minLight: 20, curve: 'parabolic' },
  lightness: { start: 96, end: 12, curve: 'easeOut' },
  shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  cmykSafe: true
};

export default palettesConfig