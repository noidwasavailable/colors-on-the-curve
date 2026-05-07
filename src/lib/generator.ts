import {
	type FORMATTED_COLOR,
	getColorName,
	initColors,
	ORIGINAL_COLORS,
	// @ts-expect-error import doesnt have type definitions
} from "ntc-ts";
import {
	applyCurve,
	hslToRgb,
	isSrgbDisplayable,
	makeCmykSafe,
	oklchToRgb,
	rgbToCmyk,
	rgbToHex,
} from "./colorMath";
import type {
	ColorResult,
	PaletteConfig,
	PaletteResult,
	PalettesConfig,
} from "./types";

// Init the available colors for ntc-ts
initColors(ORIGINAL_COLORS);

export function generatePalette(config: PaletteConfig): PaletteResult {
	const isLegacyConfig =
		config.version === undefined &&
		config.colorSpace === undefined &&
		config.saturation !== undefined &&
		config.chroma === undefined;
	const colorSpace = config.colorSpace ?? (isLegacyConfig ? "hsl" : "oklch");
	const srgbReconciliation = config.srgbReconciliation ?? "min-de-projection";

	const {
		shades,
		baseHue,
		hueShift = 0,
		saturation,
		lightness,
		cmykSafe = false,
		cmykReconciliation = "scale-down",
	} = config;

	const chroma = config.chroma ?? {
		peak: 0.15,
		minDark: 0.05,
		minLight: 0.02,
		curve: "linear",
	};
	const oklchLightness = config.oklchLightness ?? {
		start: 0.95,
		end: 0.1,
		curve: "linear",
	};

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

		let r: number, g: number, b: number;
		let finalL = 0;
		let finalS = 0;
		let finalOkL = 0;
		let finalOkC = 0;
		let isOutOfSrgbGamut = false;

		if (colorSpace === "oklch") {
			// Lightness calculation
			const lProgression = applyCurve(t, oklchLightness.curve);
			finalOkL =
				oklchLightness.start +
				(oklchLightness.end - oklchLightness.start) * lProgression;

			// Chroma calculation
			if (t < 0.5) {
				const halfT = t * 2;
				const p = applyCurve(halfT, chroma.curve);
				finalOkC = chroma.minLight + (chroma.peak - chroma.minLight) * p;
			} else {
				const halfT = (t - 0.5) * 2;
				const p = applyCurve(halfT, chroma.curve);
				finalOkC = chroma.peak + (chroma.minDark - chroma.peak) * p;
			}

			isOutOfSrgbGamut = !isSrgbDisplayable(finalOkL, finalOkC, finalH);

			[r, g, b] = oklchToRgb(finalOkL, finalOkC, finalH, srgbReconciliation);
		} else {
			// HSL Lightness calculation
			const lProgression = applyCurve(t, lightness.curve);
			finalL =
				lightness.start + (lightness.end - lightness.start) * lProgression;

			// HSL Saturation calculation
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

			[r, g, b] = hslToRgb(finalH, finalS, finalL);
		}

		return {
			shade,
			finalH,
			finalS,
			finalL,
			finalOkL,
			finalOkC,
			r,
			g,
			b,
			isOutOfSrgbGamut,
		};
	});

	const reconciledColors = rawColors.map((raw) => {
		const safetyResult = makeCmykSafe(raw.r, raw.g, raw.b, 300, {
			colorSpace,
			originalCoords: [raw.finalOkL, raw.finalOkC, raw.finalH],
		});
		let ratio = 1.0;
		if (!safetyResult.isSafe) {
			if (colorSpace === "oklch" && raw.finalOkC > 0 && safetyResult.oklch) {
				ratio = safetyResult.oklch[1] / raw.finalOkC;
			} else if (colorSpace === "hsl" && raw.finalS > 0) {
				ratio = safetyResult.hsl[1] / raw.finalS;
			}
		}
		return { ...raw, safetyResult, isOrigSafe: safetyResult.isSafe, ratio };
	});

	let minRatio = 1.0;
	if (cmykSafe && cmykReconciliation === "scale-down") {
		minRatio = Math.min(...reconciledColors.map((c) => c.ratio));
	}

	const colors: ColorResult[] = reconciledColors.map((c) => {
		let finalRgb: [number, number, number];
		let finalHsl: [number, number, number];
		let finalCmyk: [number, number, number, number];
		let finalOklch: [number, number, number] | undefined;

		if (cmykSafe) {
			if (cmykReconciliation === "scale-down") {
				if (colorSpace === "oklch") {
					const newOkC = c.finalOkC * minRatio;
					const [nR, nG, nB] = oklchToRgb(
						c.finalOkL,
						newOkC,
						c.finalH,
						srgbReconciliation,
					);
					finalRgb = [nR, nG, nB];
					finalOklch = [c.finalOkL, newOkC, c.finalH];
					const safeTest = makeCmykSafe(nR, nG, nB, 300, {
						colorSpace: "oklch",
						originalCoords: [c.finalOkL, newOkC, c.finalH],
					});
					finalCmyk = safeTest.cmyk;
					finalHsl = safeTest.hsl; // Approximate HSL from safety result
				} else {
					const newS = c.finalS * minRatio;
					const [nR, nG, nB] = hslToRgb(c.finalH, newS, c.finalL);
					finalRgb = [nR, nG, nB];
					finalHsl = [c.finalH, newS, c.finalL];
					const safeTest = makeCmykSafe(nR, nG, nB, 300);
					finalCmyk = safeTest.cmyk;
				}
			} else {
				// clamp
				finalRgb = c.safetyResult.rgb;
				finalHsl = c.safetyResult.hsl;
				finalCmyk = c.safetyResult.cmyk;
				finalOklch = c.safetyResult.oklch;
			}
		} else {
			finalRgb = [c.r, c.g, c.b];
			if (colorSpace === "oklch") {
				finalOklch = [c.finalOkL, c.finalOkC, c.finalH];
				finalHsl = c.safetyResult.hsl; // fallback
			} else {
				finalHsl = [c.finalH, c.finalS, c.finalL];
			}
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
			oklch: finalOklch,
			isOutOfSrgbGamut: c.isOutOfSrgbGamut,
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
		id: config.id,
		name: paletteName,
		colors,
	};
}

export function expandPalettesConfig(config: PalettesConfig): PaletteConfig[] {
	const isLegacyConfig =
		config.version === undefined &&
		config.colorSpace === undefined &&
		config.saturation !== undefined &&
		config.chroma === undefined;
	const colorSpace = config.colorSpace ?? (isLegacyConfig ? "hsl" : "oklch");

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
			colorSpace,
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
			colorSpace,
			baseHue: finalHue,
			name: resolveName(i),
		});
	}

	return result;
}
