import type { CurveType } from "./types";

export type UiMode = "PALETTES" | "SPECTRUM";

export type PropertyPath = readonly [string] | readonly [string, string];

export interface SelectOption<T extends string = string> {
	value: T;
	label: string;
}

export interface BasePropertyMeta {
	id: string;
	label: string;
	description: string;
	path: PropertyPath;
}

export interface NumberPropertyMeta extends BasePropertyMeta {
	kind: "number";
	step: number;
	min: number;
	max: number;
}

export interface TogglePropertyMeta extends BasePropertyMeta {
	kind: "toggle";
	onLabel?: string;
	offLabel?: string;
}

export interface SelectPropertyMeta<T extends string = string>
	extends BasePropertyMeta {
	kind: "select";
	options: readonly SelectOption<T>[];
}

export type EditorPropertyMeta =
	| NumberPropertyMeta
	| TogglePropertyMeta
	| SelectPropertyMeta;

export interface KeyAction {
	key: string;
	label: string;
	description?: string;
}

export const CURVE_OPTIONS: readonly SelectOption<CurveType>[] = [
	{ value: "linear", label: "Linear" },
	{ value: "easeIn", label: "Ease In" },
	{ value: "easeOut", label: "Ease Out" },
	{ value: "easeInOut", label: "Ease In/Out" },
	{ value: "parabolic", label: "Parabolic" },
] as const;

export const UI_TEXT = {
	title: "🎨 Interactive Generative Palette CLI",
	modeLabel: "Mode",
	editorTitle: "Editor Controls",
	statusEditing: "Editing",
	statusSaving: "Saving...",
	noPalettesGenerated: "No palettes generated.",
	generateErrorPrefix: "Error generating palettes:",
	savedToPrefix: "Saved to:",
	savedTokensPrefix: "Saved tokens to:",
} as const;

export const MODE_LABELS: Record<UiMode, string> = {
	PALETTES: "Palettes",
	SPECTRUM: "Spectrum",
} as const;

export const GLOBAL_ACTIONS: readonly KeyAction[] = [
	{ key: "s", label: "Save & Exit" },
	{ key: "q", label: "Quit" },
] as const;

export const MODE_ACTIONS: Record<UiMode, readonly KeyAction[]> = {
	PALETTES: [
		{ key: "[ ]", label: "Paginate" },
		{ key: "del", label: "Remove Palette" },
		{ key: "+", label: "Add Palette" },
	],
	SPECTRUM: [{ key: "u", label: "Unbox to Palette" }],
} as const;

export const NAVIGATION_ACTIONS: readonly KeyAction[] = [
	{ key: "↑ / ↓", label: "Select Property" },
	{ key: "← / →", label: "Change Value" },
	{ key: "Shift + ← / →", label: "Change Value (x10 step)" },
] as const;

export const APP_TOGGLES = {
	exportTokens: {
		key: "t",
		label: "Export tokens on save",
		description:
			"Write a .tokens.json file alongside the palette output when enabled.",
	},
} as const;

export const EDITOR_PROPERTIES = {
	palettesOnly: [
		{
			id: "baseHue",
			kind: "number",
			label: "Base Hue",
			description: "Starting hue used to generate the palette.",
			path: ["baseHue"] as const,
			step: 1,
			min: 0,
			max: 360,
		},
	] as const satisfies readonly NumberPropertyMeta[],

	spectrumOnly: [
		{
			id: "huesCount",
			kind: "number",
			label: "Hues Count",
			description: "How many palettes to generate across the hue range.",
			path: ["hues", "count"] as const,
			step: 1,
			min: 1,
			max: 20,
		},
		{
			id: "huesStart",
			kind: "number",
			label: "Hues Start",
			description: "First hue in the generated spectrum range.",
			path: ["hues", "start"] as const,
			step: 1,
			min: 0,
			max: 360,
		},
		{
			id: "huesEnd",
			kind: "number",
			label: "Hues End",
			description: "Last hue in the generated spectrum range.",
			path: ["hues", "end"] as const,
			step: 1,
			min: 0,
			max: 360,
		},
		{
			id: "huesCurve",
			kind: "select",
			label: "Hues Curve",
			description: "Distribution curve used between start and end hues.",
			path: ["hues", "curve"] as const,
			options: CURVE_OPTIONS,
		},
	] as const satisfies readonly EditorPropertyMeta[],

	common: [
		{
			id: "hueShift",
			kind: "number",
			label: "Hue Shift",
			description: "Total hue drift from lightest to darkest shade.",
			path: ["hueShift"] as const,
			step: 1,
			min: -360,
			max: 360,
		},
		{
			id: "hueCurve",
			kind: "select",
			label: "Hue Curve",
			description: "Curve controlling how hue shift is applied across shades.",
			path: ["hueCurve"] as const,
			options: CURVE_OPTIONS,
		},
		{
			id: "satPeak",
			kind: "number",
			label: "Sat Peak",
			description: "Maximum saturation reached near the middle shades.",
			path: ["saturation", "peak"] as const,
			step: 1,
			min: 0,
			max: 100,
		},
		{
			id: "satMinDark",
			kind: "number",
			label: "Sat Min Dark",
			description: "Saturation floor for the darkest shade.",
			path: ["saturation", "minDark"] as const,
			step: 1,
			min: 0,
			max: 100,
		},
		{
			id: "satMinLight",
			kind: "number",
			label: "Sat Min Light",
			description: "Saturation floor for the lightest shade.",
			path: ["saturation", "minLight"] as const,
			step: 1,
			min: 0,
			max: 100,
		},
		{
			id: "satCurve",
			kind: "select",
			label: "Sat Curve",
			description: "Curve controlling saturation ramp toward dark/light ends.",
			path: ["saturation", "curve"] as const,
			options: CURVE_OPTIONS,
		},
		{
			id: "lightStart",
			kind: "number",
			label: "Light Start",
			description: "Lightness value used for the lightest shade.",
			path: ["lightness", "start"] as const,
			step: 1,
			min: 0,
			max: 100,
		},
		{
			id: "lightEnd",
			kind: "number",
			label: "Light End",
			description: "Lightness value used for the darkest shade.",
			path: ["lightness", "end"] as const,
			step: 1,
			min: 0,
			max: 100,
		},
		{
			id: "lightCurve",
			kind: "select",
			label: "Light Curve",
			description: "Curve controlling lightness interpolation per shade.",
			path: ["lightness", "curve"] as const,
			options: CURVE_OPTIONS,
		},
		{
			id: "cmykSafe",
			kind: "toggle",
			label: "CMYK Safe",
			description:
				"Clamp colors to CMYK-safe output when TAC exceeds print-safe limits.",
			path: ["cmykSafe"] as const,
			onLabel: "ON",
			offLabel: "OFF",
		},
		{
			id: "cmykReconciliation",
			kind: "select",
			label: "CMYK Reconcile",
			description: "Method to reconcile out-of-gamut colors",
			path: ["cmykReconciliation"] as const,
			options: [
				{ value: "scale-down", label: "Scale Down" },
				{ value: "clamp", label: "Clamp" },
			],
		},
	] as const satisfies readonly EditorPropertyMeta[],
} as const;

export const PREVIEW_UI = {
	horizontalOverflowHint: "Use horizontal scroll to view overflowed palettes.",
	swatchSampleText: "  AaAa  ",
} as const;
