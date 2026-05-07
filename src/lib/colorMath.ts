import { differenceEuclidean, displayable, toGamut } from "culori";
import type { CurveType } from "./types";

export function isSrgbDisplayable(l: number, c: number, h: number): boolean {
	return displayable({ mode: "oklch", l, c, h });
}

/**
 * Normalizes 't' between 0 and 1, applying the requested curve.
 * @param t - Linear progress from 0.0 to 1.0
 * @param curve - The curve type
 */
export function applyCurve(t: number, curve: CurveType): number {
	switch (curve) {
		case "linear":
			return t;
		case "easeIn":
			return t * t;
		case "easeOut":
			return t * (2 - t);
		case "easeInOut":
			return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
		case "parabolic":
			// 0 at t=0, 1 at t=0.5, 0 at t=1
			return 1 - (2 * t - 1) ** 2;
		default:
			return t;
	}
}

/**
 * Converts HSL to RGB
 * @param h Hue 0-360
 * @param s Saturation 0-100
 * @param l Lightness 0-100
 * @returns [R, G, B] each 0-255
 */
export function hslToRgb(
	h: number,
	s: number,
	l: number,
): [number, number, number] {
	s /= 100;
	l /= 100;
	const k = (n: number) => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n: number) =>
		l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return [
		Math.round(f(0) * 255),
		Math.round(f(8) * 255),
		Math.round(f(4) * 255),
	];
}

/**
 * Converts RGB to HEX
 */
export function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (c: number) => Math.round(c).toString(16).padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts RGB to CMYK
 * @param r 0-255
 * @param g 0-255
 * @param b 0-255
 * @returns [C, M, Y, K] each 0-100
 */
export function rgbToCmyk(
	r: number,
	g: number,
	b: number,
): [number, number, number, number] {
	let c = 1 - r / 255;
	let m = 1 - g / 255;
	let y = 1 - b / 255;
	const k = Math.min(c, Math.min(m, y));

	if (k === 1) {
		return [0, 0, 0, 100];
	}

	c = (c - k) / (1 - k);
	m = (m - k) / (1 - k);
	y = (y - k) / (1 - k);

	return [
		Math.round(c * 100),
		Math.round(m * 100),
		Math.round(y * 100),
		Math.round(k * 100),
	];
}

/**
 * RGB to HSL inside CMYK conversions
 */
export function rgbToHsl(
	r: number,
	g: number,
	b: number,
): [number, number, number] {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h = 0,
		s = 0,
		l = (max + min) / 2;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Takes RGB input and evaluates if TAC <= 300%.
 * If it exceeds standard CMYK limits, it desaturates slightly until it fits, modifying both CMYK and RGB.
 */
export function makeCmykSafe(
	r: number,
	g: number,
	b: number,
	maxTac: number = 300,
	options?: {
		colorSpace?: "hsl" | "oklch";
		originalCoords?: [number, number, number];
	},
): {
	isSafe: boolean;
	rgb: [number, number, number];
	cmyk: [number, number, number, number];
	hsl: [number, number, number];
	oklch?: [number, number, number];
} {
	let [c, m, y, k] = rgbToCmyk(r, g, b);
	let tac = c + m + y + k;
	const isSafe = tac <= maxTac;
	let [h, s, l] = rgbToHsl(r, g, b);

	let outOklch: [number, number, number] | undefined;

	if (options?.colorSpace === "oklch" && options.originalCoords) {
		outOklch = [...options.originalCoords] as [number, number, number];
	}

	if (isSafe && k <= 100) {
		return {
			isSafe: true,
			rgb: [r, g, b],
			cmyk: [c, m, y, k],
			hsl: [h, s, l],
			oklch: outOklch,
		};
	}

	if (options?.colorSpace === "oklch" && outOklch) {
		let [okL, okC, okH] = outOklch;
		while ((tac > maxTac || k > 100) && okC > 0) {
			okC -= 0.01;
			if (okC < 0) okC = 0;
			[r, g, b] = oklchToRgb(okL, okC, okH, "min-de-projection");
			[c, m, y, k] = rgbToCmyk(r, g, b);
			tac = c + m + y + k;
		}
		[h, s, l] = rgbToHsl(r, g, b);
		return {
			isSafe: false,
			rgb: [r, g, b],
			cmyk: [c, m, y, k],
			hsl: [h, s, l],
			oklch: [okL, okC, okH],
		};
	}

	// Desaturate slightly until safe
	while ((tac > maxTac || k > 100) && s > 0) {
		s -= 1; // Decrease saturation
		[r, g, b] = hslToRgb(h, s, l);
		[c, m, y, k] = rgbToCmyk(r, g, b);
		tac = c + m + y + k;
	}

	return { isSafe: false, rgb: [r, g, b], cmyk: [c, m, y, k], hsl: [h, s, l] };
}

/**
 * Converts OKLCH to sRGB, resolving out-of-gamut colors using the specified reconciliation method.
 * @param l Lightness 0.0 - 1.0
 * @param c Chroma 0.0 - ~0.4
 * @param h Hue 0 - 360
 * @param srgbReconciliation The reconciliation method to use for out-of-gamut colors
 * @returns [R, G, B] each 0-255
 */
export function oklchToRgb(
	l: number,
	c: number,
	h: number,
	srgbReconciliation:
		| "l4-binary-search"
		| "min-de-projection" = "min-de-projection",
): [number, number, number] {
	const color = { mode: "oklch" as const, l, c, h };
	let mapped: { r?: number; g?: number; b?: number };
	if (srgbReconciliation === "l4-binary-search") {
		// CSS Color Module Level 4 algorithm
		mapped = toGamut("rgb", "oklch")(color) as {
			r?: number;
			g?: number;
			b?: number;
		};
	} else {
		// Min dE Projection (Approximated with OKLab distance)
		mapped = toGamut(
			"rgb",
			"oklch",
			differenceEuclidean("oklab") as unknown as number,
			0.02,
		)(color) as { r?: number; g?: number; b?: number };
	}

	// Ensure values are properly clamped to 0-1 before scaling to 0-255
	const r = Math.max(0, Math.min(1, mapped.r ?? 0));
	const g = Math.max(0, Math.min(1, mapped.g ?? 0));
	const b = Math.max(0, Math.min(1, mapped.b ?? 0));

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
