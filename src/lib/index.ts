// Mathematical Utilities
export {
	applyCurve,
	hslToRgb,
	makeCmykSafe,
	rgbToCmyk,
	rgbToHex,
	rgbToHsl,
} from "./colorMath";
export type { UiMode } from "./constants";
export { CURVE_OPTIONS } from "./constants";

// Defaults & Constants
export {
	defaultHues,
	defaultLightness,
	defaultPaletteConfig,
	defaultPalettesConfig,
	defaultSaturation,
	defaultShades,
} from "./defaults";
// Figma & Token Exporters
export {
	buildTransparencyTokensList,
	exportFigmaTokens,
	generateTransparencyTokens,
	setTokensAlpha,
} from "./figmaExporter";

// Core Generator
export { expandPalettesConfig, generatePalette } from "./generator";
// Types
export type {
	ColorResult,
	ConfigInput,
	CurveConfig,
	CurveType,
	FigmaToken,
	FigmaTokenGroup,
	Hexcode,
	HueRangeConfig,
	PaletteConfig,
	PaletteResult,
	PalettesConfig,
	SaturationConfig,
} from "./types";
