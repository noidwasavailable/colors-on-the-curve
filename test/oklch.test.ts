import { describe, expect, test } from "bun:test";
import { makeCmykSafe, oklchToRgb } from "@/lib/colorMath";
import { expandPalettesConfig, generatePalette } from "@/lib/generator";
import type { PaletteConfig, PalettesConfig } from "@/lib/types";

describe("OKLCH Color Math", () => {
	test("oklchToRgb basic gray scale", () => {
		// White
		let rgb = oklchToRgb(1, 0, 0);
		expect(rgb[0]).toBe(255);
		expect(rgb[1]).toBe(255);
		expect(rgb[2]).toBe(255);

		// Black
		rgb = oklchToRgb(0, 0, 0);
		expect(rgb[0]).toBe(0);
		expect(rgb[1]).toBe(0);
		expect(rgb[2]).toBe(0);
	});

	test("oklchToRgb correctly calculates known in-gamut color", () => {
		// sRGB Red [255, 0, 0] is roughly OKLCH 0.628, 0.258, 29.2
		// We'll test a slightly desaturated known-safe red to ensure it converts cleanly
		const [r, g, b] = oklchToRgb(0.6, 0.15, 29.2);

		expect(r).toBeGreaterThan(180);
		expect(g).toBeLessThan(100);
		expect(b).toBeLessThan(100);
	});

	test("oklchToRgb out-of-gamut color with L4 Binary Search", () => {
		// Highly saturated green, out of sRGB gamut
		const l = 0.5;
		const c = 0.4; // Exceeds sRGB
		const h = 140;

		const result = oklchToRgb(l, c, h, "l4-binary-search");

		// The returned RGB should be strictly bounded between 0 and 255
		expect(result[0]).toBeGreaterThanOrEqual(0);
		expect(result[0]).toBeLessThanOrEqual(255);
		expect(result[1]).toBeGreaterThanOrEqual(0);
		expect(result[1]).toBeLessThanOrEqual(255);
		expect(result[2]).toBeGreaterThanOrEqual(0);
		expect(result[2]).toBeLessThanOrEqual(255);
	});

	test("oklchToRgb out-of-gamut color with Min dE Projection", () => {
		const l = 0.5;
		const c = 0.4;
		const h = 140;

		const result = oklchToRgb(l, c, h, "min-de-projection");

		// The returned RGB should be bounded between 0 and 255
		expect(result[0]).toBeGreaterThanOrEqual(0);
		expect(result[0]).toBeLessThanOrEqual(255);
		expect(result[1]).toBeGreaterThanOrEqual(0);
		expect(result[1]).toBeLessThanOrEqual(255);
		expect(result[2]).toBeGreaterThanOrEqual(0);
		expect(result[2]).toBeLessThanOrEqual(255);
	});
});

describe("OKLCH CMYK Safety", () => {
	test("makeCmykSafe reduces OKLCH chroma when colorSpace is oklch for unsafe colors", () => {
		// R=0, G=255, B=0 generates TAC of 200. We restrict it to 150 to force mitigation.
		const result = makeCmykSafe(0, 255, 0, 150, {
			colorSpace: "oklch",
			originalCoords: [0.86, 0.29, 142],
		});

		expect(result.isSafe).toBe(false); // Should have triggered mitigation
		// OKLCH is returned in the safe payload
		expect(result).toHaveProperty("oklch");

		if (result.oklch) {
			// Lightness and Hue should remain mostly untouched (within rounding margins for conversions)
			expect(result.oklch[0]).toBeCloseTo(0.86, 1);
			// Chroma should be actively reduced from 0.29
			expect(result.oklch[1]).toBeLessThan(0.29);
		}
	});

	test("makeCmykSafe leaves in-gamut OKLCH colors completely unmodified", () => {
		// Medium gray is very safe in CMYK (low TAC, 0 chroma)
		const result = makeCmykSafe(128, 128, 128, 300, {
			colorSpace: "oklch",
			originalCoords: [0.5, 0.0, 0],
		});

		expect(result.isSafe).toBe(true);
		expect(result.oklch).toBeDefined();
		expect(result.oklch?.[0]).toBe(0.5);
		expect(result.oklch?.[1]).toBe(0.0);
		expect(result.oklch?.[2]).toBe(0);
	});
});

describe("Generator with OKLCH", () => {
	test("generatePalette supports OKLCH color space natively", () => {
		const config: PaletteConfig = {
			name: "OKLCH Test",
			colorSpace: "oklch",
			baseHue: 150,
			chroma: { peak: 0.15, minDark: 0.05, minLight: 0.02, curve: "linear" },
			oklchLightness: { start: 0.95, end: 0.1, curve: "linear" },
			lightness: { start: 95, end: 10, curve: "linear" }, // fallback for strict type checking
			saturation: { peak: 100, minDark: 50, minLight: 50, curve: "linear" }, // fallback
			shades: [100, 500, 900],
		};

		const result = generatePalette(config);
		expect(result.colors.length).toBe(3);

		// Ensure OKLCH tuple is present on color result
		expect(result.colors[0]).toHaveProperty("oklch");
		expect(result.colors[0]).toHaveProperty("isOutOfSrgbGamut");

		// Lightness should be scaled roughly to the curve
		expect(result.colors[0]?.oklch?.[0]).toBeCloseTo(0.95, 1);
		expect(result.colors[1]?.oklch?.[0]).toBeCloseTo(0.525, 1);
		expect(result.colors[2]?.oklch?.[0]).toBeCloseTo(0.1, 1);
	});

	test("generatePalette accurately flags isOutOfSrgbGamut", () => {
		const config: PaletteConfig = {
			name: "Gamut Flag Test",
			colorSpace: "oklch",
			baseHue: 150,
			// Shade 100 gets c=0.05 (in gamut), Shade 900 gets c=0.4 (out of gamut)
			chroma: { peak: 0.4, minDark: 0.4, minLight: 0.05, curve: "linear" },
			oklchLightness: { start: 0.9, end: 0.5, curve: "linear" },
			lightness: { start: 90, end: 50, curve: "linear" },
			saturation: { peak: 100, minDark: 100, minLight: 10, curve: "linear" },
			shades: [100, 900],
		};

		const result = generatePalette(config);
		expect(result.colors.length).toBe(2);
		expect(result.colors[0]?.isOutOfSrgbGamut).toBe(false);
		expect(result.colors[1]?.isOutOfSrgbGamut).toBe(true);
	});

	test("generatePalette correctly scales down chroma for cmykReconciliation: scale-down", () => {
		const config: PaletteConfig = {
			name: "CMYK Scale Down Test",
			colorSpace: "oklch",
			baseHue: 140, // Green easily exceeds CMYK limits when saturated
			chroma: { peak: 0.35, minDark: 0.35, minLight: 0.05, curve: "linear" },
			oklchLightness: { start: 0.9, end: 0.2, curve: "linear" },
			lightness: { start: 90, end: 20, curve: "linear" },
			saturation: { peak: 100, minDark: 100, minLight: 10, curve: "linear" },
			shades: [100, 900], // 100 should be natively safe, 900 highly unsafe
			cmykSafe: true,
			cmykReconciliation: "scale-down",
		};

		const unsafeConfig = { ...config, cmykSafe: false };
		const safeResult = generatePalette(config);
		const unsafeResult = generatePalette(unsafeConfig);

		const origSafeChroma = unsafeResult.colors[0]?.oklch?.[1] ?? 0;
		const origUnsafeChroma = unsafeResult.colors[1]?.oklch?.[1] ?? 0;
		const newSafeChroma = safeResult.colors[0]?.oklch?.[1] ?? 0;
		const newUnsafeChroma = safeResult.colors[1]?.oklch?.[1] ?? 0;

		// Even though shade 100 was natively safe, its chroma must be reduced to maintain the palette ratio
		expect(newSafeChroma).toBeLessThanOrEqual(origSafeChroma);

		// Both should have approximately the same proportional reduction ratio applied
		const ratio1 = newSafeChroma / origSafeChroma;
		const ratio2 = newUnsafeChroma / origUnsafeChroma;
		expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.05);
	});

	test("generatePalette falls back to HSL for legacy configs", () => {
		const legacyConfig: PaletteConfig = {
			name: "Legacy HSL Test",
			baseHue: 210,
			saturation: { peak: 100, minDark: 50, minLight: 50, curve: "linear" },
			lightness: { start: 90, end: 10, curve: "linear" },
			shades: [500],
		};

		const result = generatePalette(legacyConfig);
		expect(result.colors.length).toBe(1);
		expect(result.colors[0]).toHaveProperty("hsl");
		// If colorSpace isn't explicitly defined but saturation values exist on a 0-100 scale,
		// it should successfully generate a shade via the HSL pipeline.
		expect(result.colors[0]?.hsl[1]).toBeGreaterThan(0);
	});
});

describe("Palettes Config Expansion with OKLCH", () => {
	test("expandPalettesConfig clones OKLCH-specific fields", () => {
		const config: PalettesConfig = {
			namePrefix: "OKLCH Expansion",
			colorSpace: "oklch",
			hues: { start: 0, end: 100, count: 2, curve: "linear" },
			chroma: { peak: 0.2, minDark: 0.1, minLight: 0.05, curve: "linear" },
			oklchLightness: { start: 0.95, end: 0.15, curve: "easeOut" },
			srgbReconciliation: "l4-binary-search",
			lightness: { start: 90, end: 10, curve: "linear" },
			saturation: { peak: 100, minDark: 50, minLight: 50, curve: "linear" },
			shades: [100, 500],
		};

		const expanded = expandPalettesConfig(config);
		expect(expanded.length).toBe(2);

		const p1 = expanded[0];
		expect(p1).toBeDefined();
		if (p1) {
			expect(p1.colorSpace).toBe("oklch");
			expect(p1.chroma?.peak).toBe(0.2);
			expect(p1.oklchLightness?.curve).toBe("easeOut");
			expect(p1.srgbReconciliation).toBe("l4-binary-search");
		}
	});
});
