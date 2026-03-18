export type CurveType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'parabolic';

export interface CurveConfig {
  start: number;
  end: number;
  curve: CurveType;
}

export interface SaturationConfig {
  peak: number;    // Peak saturation value (e.g. 100)
  minDark: number; // Saturation at the darkest shade (e.g. 20)
  minLight: number;// Saturation at the lightest shade (e.g. 10)
  curve: CurveType;
}

export interface PaletteConfig {
  name?: string;
  baseHue: number;          // 0 - 360
  hueShift?: number;        // total shift in degrees from lightest to darkest (e.g. -20 or 15)
  hueCurve?: CurveType;     // curve to apply to the hue shift
  saturation: SaturationConfig;
  lightness: CurveConfig;   // typically start = 95 (lightest), end = 10 (darkest)
  shades: number[];         // e.g., [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  cmykSafe?: boolean;       // if true, forces output to remain within standard CMYK limits (TAC <= 300%)
}

export interface ColorResult {
  shade: number;
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
  cmyk: [number, number, number, number]; // percentages 0-100
  isCmykSafe: boolean; // false if color exceeded TAC or limits before clamping
}

export interface PaletteResult {
  name: string;
  colors: ColorResult[];
}

export interface HueRangeConfig {
  start: number;
  end: number;
  count: number;
  curve?: CurveType;
}

export interface PalettesConfig {
  namePrefix?: string;
  names?: string[];
  hues: HueRangeConfig;
  hueShift?: number;
  hueCurve?: CurveType;
  saturation: SaturationConfig;
  lightness: CurveConfig;
  shades: number[];
  cmykSafe?: boolean;
}

export type ConfigInput = PaletteConfig | PaletteConfig[] | PalettesConfig;
