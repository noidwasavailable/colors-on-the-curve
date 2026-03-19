import type { PalettesConfig } from './src/types';

const config: PalettesConfig = {
  names: [
    "Red",
    "Orange",
    "Amber",
    "Yellow",
    "Lime",
    "Green",
    "Emerald",
    "Teal",
    "Cyan",
    "Sky",
    "Blue",
    "Indigo",
    "Violet",
    "Purple",
    "Fuchsia",
    "Pink",
    "Rose",
  ],
  hues: {
    start: 5,
    end: 339,
    count: 17,
    curve: "linear"
  },
  hueShift: 0,
  saturation: {
    peak: 95,
    minDark: 95,
    minLight: 80,
    curve: "easeInOut",
  },
  lightness: { start: 97, end: 3, curve: "linear" },
  shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  cmykSafe: true,
  cmykReconciliation: "scale-down"
};

export default config;