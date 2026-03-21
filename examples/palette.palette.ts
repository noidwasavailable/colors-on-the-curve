import type { PaletteConfig } from '../src/types';

const config: PaletteConfig = {
  name: "Forest Green",
  baseHue: 145,
  hueShift: 20,
  hueCurve: 'easeInOut',
  saturation: { peak: 90, minDark: 30, minLight: 15, curve: 'parabolic' },
  lightness: { start: 95, end: 10, curve: 'easeInOut' },
  shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  cmykSafe: true
};

export default config;
