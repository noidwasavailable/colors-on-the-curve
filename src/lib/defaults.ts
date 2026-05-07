import type {
	CurveConfig,
	HueRangeConfig,
	PaletteConfig,
	PalettesConfig,
	SaturationConfig,
} from "./types";

export const defaultSaturation: SaturationConfig = {
	peak: 85,
	minDark: 60,
	minLight: 90,
	curve: "easeInOut",
};

export const defaultLightness: CurveConfig = {
	start: 90,
	end: 15,
	curve: "linear",
};

export const defaultChroma: SaturationConfig = {
	peak: 0.15,
	minDark: 0.05,
	minLight: 0.05,
	curve: "easeInOut",
};

export const defaultOklchLightness: CurveConfig = {
	start: 0.95,
	end: 0.15,
	curve: "linear",
};

export const defaultShades = [
	50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

export const defaultPaletteConfig: Omit<PaletteConfig, "name"> = {
	colorSpace: "oklch",
	baseHue: 0,
	hueShift: 0,
	hueCurve: "linear",
	chroma: defaultChroma,
	oklchLightness: defaultOklchLightness,
	saturation: defaultSaturation,
	lightness: defaultLightness,
	shades: defaultShades,
	cmykSafe: false,
	cmykReconciliation: "scale-down",
	srgbReconciliation: "min-de-projection",
};

export const defaultHues: HueRangeConfig = {
	start: 5,
	end: 355,
	count: 11,
	curve: "linear",
};

export const defaultPalettesConfig: Omit<
	PalettesConfig,
	"names" | "namePrefix"
> = {
	colorSpace: "oklch",
	hues: defaultHues,
	hueShift: 0,
	hueCurve: "linear",
	chroma: defaultChroma,
	oklchLightness: defaultOklchLightness,
	saturation: defaultSaturation,
	lightness: defaultLightness,
	shades: defaultShades,
	cmykSafe: false,
	cmykReconciliation: "scale-down",
	srgbReconciliation: "min-de-projection",
};
