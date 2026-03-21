import type { UiMode } from "./constants";
import { defaultPaletteConfig } from "./defaults";
import type { ConfigInput, PaletteConfig, PalettesConfig } from "./types";

export function addPalette(
	config: PaletteConfig[],
	activeIndex: number,
	uuidGenerator: () => string,
): { newConfig: PaletteConfig[]; newActiveIndex: number } {
	const arr = [...config];
	const activePalette = arr[activeIndex] ?? { ...defaultPaletteConfig };
	const nextHue = (activePalette.baseHue + 20) % 360;
	arr.push({
		...JSON.parse(JSON.stringify(activePalette)),
		baseHue: nextHue,
		id: uuidGenerator(),
	});
	return { newConfig: arr, newActiveIndex: arr.length - 1 };
}

export function removePalette(
	config: PaletteConfig[],
	activeIndex: number,
	indexToRemove: number,
): { newConfig: PaletteConfig[]; newActiveIndex: number } {
	if (config.length <= 1) {
		return { newConfig: config, newActiveIndex: activeIndex }; // cannot remove last
	}
	const arr = [...config];
	arr.splice(indexToRemove, 1);

	let newActiveIndex = activeIndex;
	if (activeIndex >= arr.length) {
		newActiveIndex = arr.length - 1;
	} else if (activeIndex >= indexToRemove) {
		newActiveIndex = Math.max(0, activeIndex - 1);
	}

	return { newConfig: arr, newActiveIndex };
}

export function renamePalette(
	config: ConfigInput,
	mode: UiMode,
	index: number,
	newName: string,
): ConfigInput {
	if (mode === "PALETTES") {
		const arr = [...(config as PaletteConfig[])];
		arr[index] = { ...(arr[index] || defaultPaletteConfig), name: newName };
		return arr;
	}
	if (mode === "SPECTRUM") {
		const pConfig = { ...(config as PalettesConfig) };
		const names = pConfig.names ? [...pConfig.names] : [];
		while (names.length <= index) names.push("");
		names[index] = newName;
		return { ...pConfig, names };
	}
	return config;
}

export interface ExportData {
	version: number;
	mode: UiMode;
	config: ConfigInput;
	palettes: unknown; // PaletteResult[], defined where used or loosely bounded here
}
