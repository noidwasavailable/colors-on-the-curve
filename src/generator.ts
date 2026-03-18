// @ts-ignore
import {
  getColorName,
  initColors,
  ORIGINAL_COLORS,
  type FORMATTED_COLOR,
} from "ntc-ts";
import {
  applyCurve,
  hslToRgb,
  rgbToHex,
  makeCmykSafe,
  rgbToCmyk,
} from "./colorMath";
import type {
  PaletteConfig,
  PaletteResult,
  ColorResult,
  PalettesConfig,
} from "./types";

// Init the available colors for ntc-ts
initColors(ORIGINAL_COLORS);

export function generatePalette(config: PaletteConfig): PaletteResult {
  const {
    shades,
    baseHue,
    hueShift = 0,
    saturation,
    lightness,
    cmykSafe = false,
  } = config;

  if (shades.length === 0) {
    return { name: config.name || "Unnamed Palette", colors: [] };
  }

  const minShade = Math.min(...shades);
  const maxShade = Math.max(...shades);
  const range = maxShade - minShade;

  const colors: ColorResult[] = shades.map((shade) => {
    // Determine t from 0.0 to 1.0 based on shade value
    const t = range === 0 ? 0.5 : (shade - minShade) / range;

    // 1. Hue calculation
    const hueProgression = config.hueCurve ? applyCurve(t, config.hueCurve) : t;
    const h = (baseHue + hueShift * hueProgression) % 360;
    const finalH = h < 0 ? h + 360 : h;

    // 2. Lightness calculation
    const lProgression = applyCurve(t, lightness.curve);
    const finalL =
      lightness.start + (lightness.end - lightness.start) * lProgression;

    // 3. Saturation calculation
    let finalS = 0;
    if (t < 0.5) {
      const halfT = t * 2;
      const p = applyCurve(halfT, saturation.curve);
      finalS =
        saturation.minLight + (saturation.peak - saturation.minLight) * p;
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

    let finalRgb = cmykSafe
      ? safetyResult.rgb
      : ([r, g, b] as [number, number, number]);
    let finalHsl = cmykSafe
      ? safetyResult.hsl
      : ([finalH, finalS, finalL] as [number, number, number]);
    let finalCmyk = safetyResult.cmyk;

    if (!cmykSafe && !isCmykSafe) {
      finalCmyk = rgbToCmyk(r, g, b); // The unclamped CMYK
    }

    const hex = rgbToHex(finalRgb[0], finalRgb[1], finalRgb[2]);

    return {
      shade,
      hex,
      rgb: finalRgb,
      hsl: [
        Math.round(finalHsl[0]),
        Math.round(finalHsl[1]),
        Math.round(finalHsl[2]),
      ],
      cmyk: finalCmyk,
      isCmykSafe,
    };
  });

  const paletteName =
    config.name ??
    (() => {
      const baseColor = colors.reduce((prev, curr) =>
        Math.abs(curr.shade - 500) < Math.abs(prev.shade - 500) ? curr : prev,
      );
      const match: FORMATTED_COLOR = getColorName(baseColor.hex);
      return match.name as string;
    })();

  return {
    name: paletteName,
    colors,
  };
}

export function expandPalettesConfig(config: PalettesConfig): PaletteConfig[] {
  const result: PaletteConfig[] = [];
  const { hues, namePrefix, names, ...rest } = config;

  const resolveName = (index: number) => {
    const customName = names?.[index];
    if (namePrefix && customName) {
      const combined = `${namePrefix}-${customName}`;
      return combined.toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
    } else if (customName) {
      return customName;
    } else if (namePrefix) {
      return `${namePrefix}-${index + 1}`;
    }
    return undefined;
  };

  if (hues.count <= 0) return [];
  if (hues.count === 1) {
    result.push({
      ...rest,
      baseHue: hues.start,
      name: resolveName(0),
    });
    return result;
  }

  for (let i = 0; i < hues.count; i++) {
    const t = i / (hues.count - 1);
    const progression = hues.curve ? applyCurve(t, hues.curve) : t;
    const baseHue = (hues.start + (hues.end - hues.start) * progression) % 360;

    // Ensure hue is positive
    const finalHue = baseHue < 0 ? baseHue + 360 : baseHue;

    result.push({
      ...rest,
      baseHue: finalHue,
      name: resolveName(i),
    });
  }

  return result;
}
