// @ts-ignore
import { getColorName, initColors, ORIGINAL_COLORS, type FORMATTED_COLOR } from 'ntc-ts';
import { applyCurve, hslToRgb, rgbToHex, makeCmykSafe, rgbToCmyk } from './colorMath.js';
import type { PaletteConfig, PaletteResult, ColorResult } from './types.js';

// Init the available colors for ntc-ts
initColors(ORIGINAL_COLORS);

export function generatePalette(config: PaletteConfig): PaletteResult {
  const { shades, baseHue, hueShift = 0, saturation, lightness, cmykSafe = false } = config;

  if (shades.length === 0) {
    return { name: config.name || 'Unnamed Palette', colors: [] };
  }

  const minShade = Math.min(...shades);
  const maxShade = Math.max(...shades);
  const range = maxShade - minShade;

  const colors: ColorResult[] = shades.map(shade => {
    // Determine t from 0.0 to 1.0 based on shade value
    const t = range === 0 ? 0.5 : (shade - minShade) / range;

    // 1. Hue calculation
    const h = (baseHue + (hueShift * t)) % 360;
    const finalH = h < 0 ? h + 360 : h;

    // 2. Lightness calculation
    const lProgression = applyCurve(t, lightness.curve);
    const finalL = lightness.start + (lightness.end - lightness.start) * lProgression;

    // 3. Saturation calculation
    let finalS = 0;
    if (t < 0.5) {
      const halfT = t * 2;
      const p = applyCurve(halfT, saturation.curve);
      finalS = saturation.minLight + (saturation.peak - saturation.minLight) * p;
    } else {
      const halfT = (t - 0.5) * 2;
      const p = applyCurve(halfT, saturation.curve);
      finalS = saturation.peak + (saturation.minDark - saturation.peak) * p;
    }

    // 4. Conversion to RGB
    const [r, g, b] = hslToRgb(finalH, finalS, finalL);

    // 5. CMYK Safety
    const safetyResult = makeCmykSafe(r, g, b, 300);
    const isCmykSafe = safetyResult.isSafe;

    let finalRgb = cmykSafe ? safetyResult.rgb : [r, g, b] as [number, number, number];
    let finalHsl = cmykSafe ? safetyResult.hsl : [finalH, finalS, finalL] as [number, number, number];
    let finalCmyk = safetyResult.cmyk;

    if (!cmykSafe && !isCmykSafe) {
      finalCmyk = rgbToCmyk(r, g, b); // The unclamped CMYK
    }

    const hex = rgbToHex(finalRgb[0], finalRgb[1], finalRgb[2]);

    return {
      shade,
      hex,
      rgb: finalRgb,
      hsl: [Math.round(finalHsl[0]), Math.round(finalHsl[1]), Math.round(finalHsl[2])],
      cmyk: finalCmyk,
      isCmykSafe
    };
  });

  const paletteName = config.name ?? (() => {
    const baseColor = colors.reduce((prev, curr) =>
      Math.abs(curr.shade - 500) < Math.abs(prev.shade - 500) ? curr : prev
    );
    const match: FORMATTED_COLOR = getColorName(baseColor.hex);
    return match.name as string
  })()

  return {
    name: paletteName,
    colors
  };
}
