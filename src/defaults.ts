import type { PaletteConfig, PalettesConfig, SaturationConfig, CurveConfig, HueRangeConfig } from './types.js';

export const defaultSaturation: SaturationConfig = {
  peak: 100,
  minDark: 30,
  minLight: 15,
  curve: 'parabolic'
};

export const defaultLightness: CurveConfig = {
  start: 95,
  end: 10,
  curve: 'easeInOut'
};

export const defaultShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const defaultPaletteConfig: Omit<PaletteConfig, 'name'> = {
  baseHue: 0,
  hueShift: 0,
  hueCurve: 'linear',
  saturation: defaultSaturation,
  lightness: defaultLightness,
  shades: defaultShades,
  cmykSafe: false
};

export const defaultHues: HueRangeConfig = {
  start: 0,
  end: 360,
  count: 1,
  curve: 'linear'
};

export const defaultPalettesConfig: Omit<PalettesConfig, 'names' | 'namePrefix'> = {
  hues: defaultHues,
  hueShift: 0,
  hueCurve: 'linear',
  saturation: defaultSaturation,
  lightness: defaultLightness,
  shades: defaultShades,
  cmykSafe: false
};
