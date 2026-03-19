import {
  getColorName,
  initColors,
  ORIGINAL_COLORS,
  type FORMATTED_COLOR,
  // @ts-ignore import doesnt have type definitions
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
    cmykReconciliation = "scale-down",
  } = config;

  if (shades.length === 0) {
    return { name: config.name || "Unnamed Palette", colors: [] };
  }

  const minShade = Math.min(...shades);
  const maxShade = Math.max(...shades);
  const range = maxShade - minShade;

  const rawColors = shades.map((shade) => {
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

    return { shade, finalH, finalS, finalL, r, g, b };
  });

  const reconciledColors = rawColors.map((raw) => {
    const safetyResult = makeCmykSafe(raw.r, raw.g, raw.b, 300);
    let ratio = 1.0;
    if (!safetyResult.isSafe && raw.finalS > 0) {
      ratio = safetyResult.hsl[1] / raw.finalS;
    }
    return { ...raw, safetyResult, isOrigSafe: safetyResult.isSafe, ratio };
  });

  let minRatio = 1.0;
  if (cmykSafe && cmykReconciliation === "scale-down") {
    minRatio = Math.min(...reconciledColors.map((c) => c.ratio));
  }

  const colors: ColorResult[] = reconciledColors.map((c) => {
    let finalRgb, finalHsl, finalCmyk;

    if (cmykSafe) {
      if (cmykReconciliation === "scale-down") {
        const newS = c.finalS * minRatio;
        const [nR, nG, nB] = hslToRgb(c.finalH, newS, c.finalL);
        finalRgb = [nR, nG, nB] as [number, number, number];
        finalHsl = [c.finalH, newS, c.finalL] as [number, number, number];
        const safeTest = makeCmykSafe(nR, nG, nB, 300);
        finalCmyk = safeTest.cmyk;
      } else { // clamp
        finalRgb = c.safetyResult.rgb;
        finalHsl = c.safetyResult.hsl;
        finalCmyk = c.safetyResult.cmyk;
      }
    } else {
      finalRgb = [c.r, c.g, c.b] as [number, number, number];
      finalHsl = [c.finalH, c.finalS, c.finalL] as [number, number, number];
      finalCmyk = rgbToCmyk(c.r, c.g, c.b);
    }

    const hex = rgbToHex(finalRgb[0], finalRgb[1], finalRgb[2]);

    return {
      shade: c.shade,
      hex,
      rgb: finalRgb,
      hsl: [
        Math.round(finalHsl[0]),
        Math.round(finalHsl[1]),
        Math.round(finalHsl[2]),
      ],
      cmyk: finalCmyk,
      isCmykSafe: c.isOrigSafe,
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
