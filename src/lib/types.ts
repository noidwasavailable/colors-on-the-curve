export type CurveType =
	| "linear"
	| "easeIn"
	| "easeOut"
	| "easeInOut"
	| "parabolic";

export interface CurveConfig {
	start: number;
	end: number;
	curve: CurveType;
}

export interface SaturationConfig {
	peak: number; // Peak saturation value (e.g. 100)
	minDark: number; // Saturation at the darkest shade (e.g. 20)
	minLight: number; // Saturation at the lightest shade (e.g. 10)
	curve: CurveType;
}

export interface PaletteConfig {
	version?: number;
	colorSpace?: "oklch" | "hsl";
	id?: string;
	name?: string;
	baseHue: number; // 0 - 360
	hueShift?: number; // total shift in degrees from lightest to darkest (e.g. -20 or 15)
	hueCurve?: CurveType; // curve to apply to the hue shift
	saturation: SaturationConfig;
	chroma?: SaturationConfig;
	lightness: CurveConfig; // typically start = 95 (lightest), end = 10 (darkest)
	oklchLightness?: CurveConfig;
	shades: number[]; // e.g., [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
	cmykSafe?: boolean; // if true, forces output to remain within standard CMYK limits (TAC <= 300%)
	cmykReconciliation?: "clamp" | "scale-down";
	srgbReconciliation?: "l4-binary-search" | "min-de-projection";
}

export interface ColorResult {
	shade: number;
	hex: string;
	rgb: [number, number, number];
	hsl: [number, number, number];
	cmyk: [number, number, number, number]; // percentages 0-100
	isCmykSafe: boolean; // false if color exceeded TAC or limits before clamping
	oklch?: [number, number, number];
	isOutOfSrgbGamut?: boolean;
}

export interface PaletteResult {
	id?: string;
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
	version?: number;
	colorSpace?: "oklch" | "hsl";
	namePrefix?: string;
	names?: string[];
	hues: HueRangeConfig;
	hueShift?: number;
	hueCurve?: CurveType;
	saturation: SaturationConfig;
	chroma?: SaturationConfig;
	lightness: CurveConfig;
	oklchLightness?: CurveConfig;
	shades: number[];
	cmykSafe?: boolean;
	cmykReconciliation?: "clamp" | "scale-down";
	srgbReconciliation?: "l4-binary-search" | "min-de-projection";
}

export type ConfigInput = PaletteConfig | PaletteConfig[] | PalettesConfig;

export type FigmaColorSpace = "srgb" | "p3";
export type FigmaExtensionOptions =
	| "com.figma.scopes"
	| "com.figma.isOverride"
	| "com.figma.variableId"
	| "com.figma.hiddenFromPublishing"
	| "com.figma.codeSyntax";
export type Hexcode = `#${string}`;

export type FigmaToken = {
	$type: "color";
	$value: {
		colorSpace: FigmaColorSpace;
		components: [number, number, number];
		alpha: number;
		hex: Hexcode;
	};
	$extensions?: {
		[key in FigmaExtensionOptions]?:
			| string
			| string[]
			| boolean
			| Record<string, string>;
	};
};

export interface FigmaTokenGroup {
	[key: string]:
		| FigmaToken
		| FigmaTokenGroup
		| string
		| number
		| boolean
		| unknown[];
}
