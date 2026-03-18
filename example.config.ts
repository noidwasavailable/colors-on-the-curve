import type { PaletteConfig } from './src/types';

const config: PaletteConfig = {
  name: "Ocean Blue",
  baseHue: 210,
  hueShift: -15,   // Shift slightly to cyan (195) for the lightest shade
  saturation: {
    peak: 100,
    minDark: 40,
    minLight: 20,
    curve: 'parabolic'
  },
  lightness: {
    start: 96,
    end: 12,
    curve: 'easeOut'
  },
  shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  cmykSafe: true
};

export default config;
