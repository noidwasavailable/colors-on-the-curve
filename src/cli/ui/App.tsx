import { Box, Text, useApp, useInput } from "ink";
import React, { useEffect, useMemo, useState } from "react";
import {
	APP_TOGGLES,
	GLOBAL_ACTIONS,
	MODE_ACTIONS,
	MODE_LABELS,
	NAVIGATION_ACTIONS,
	UI_TEXT,
	type UiMode,
} from "@/lib/constants";
import { defaultPaletteConfig, defaultPalettesConfig } from "@/lib/defaults";
import { exportFigmaTokens } from "@/lib/figmaExporter";
import { expandPalettesConfig, generatePalette } from "@/lib/generator";
import type {
	ConfigInput,
	PaletteConfig,
	PaletteResult,
	PalettesConfig,
} from "@/lib/types";
import type { SaveFunction } from "../types";
import { Editor } from "./Editor";
import { PalettePreview } from "./PalettePreview";

interface AppProps {
	initialConfig: ConfigInput;
	onSave: SaveFunction;
	exportTokens: boolean;
}

export function App({ initialConfig, onSave, exportTokens }: AppProps) {
	const { exit } = useApp();
	const [config, setConfig] = useState<ConfigInput>(initialConfig);
	const [mode, setMode] = useState<UiMode>("SINGLE");
	const [activeIndex, setActiveIndex] = useState(0);
	const [status, setStatus] = useState<string>(UI_TEXT.statusEditing);
	const [exportTokensEnabled, setExportTokensEnabled] =
		useState<boolean>(exportTokens);

	const activeConfig =
		mode === "ARRAY" ? (config as PaletteConfig[])[activeIndex] : config;

	const previewState = useMemo(() => {
		let palettes: PaletteResult[] = [];
		let previewError: string | null = null;

		try {
			if (mode === "SINGLE") {
				palettes = [generatePalette(config as PaletteConfig)];
			} else if (mode === "ARRAY") {
				const arr = config as PaletteConfig[];
				const selected = arr[activeIndex];
				palettes = selected ? [generatePalette(selected)] : [];
			} else {
				const expanded = expandPalettesConfig(config as PalettesConfig);
				palettes = expanded.map(generatePalette);
			}
		} catch (error) {
			palettes = [];
			previewError =
				error instanceof Error ? error.message : "Unknown preview error";
		}

		return { palettes, previewError };
	}, [config, mode, activeIndex]);

	const outOfGamutCount = useMemo(() => {
		let count = 0;
		for (const p of previewState.palettes) {
			for (const c of p.colors) {
				if (!c.isCmykSafe) count++;
			}
		}
		return count;
	}, [previewState.palettes]);

	useEffect(() => {
		if (Array.isArray(initialConfig)) {
			setMode("ARRAY");
			setConfig(
				initialConfig.length ? initialConfig : [{ ...defaultPaletteConfig }],
			);
			return;
		}

		if (
			"hues" in initialConfig &&
			initialConfig.hues &&
			typeof initialConfig.hues === "object"
		) {
			setMode("SPECTRUM");
			setConfig({ ...defaultPalettesConfig, ...initialConfig });
			return;
		}

		setMode("SINGLE");
		setConfig({
			...defaultPaletteConfig,
			...(initialConfig as PaletteConfig),
		});
	}, [initialConfig]);

	useInput((input, key) => {
		if (status !== UI_TEXT.statusEditing) return;

		if (input === "q") {
			exit();
			return;
		}

		if (input === "s") {
			void saveAndExit();
			return;
		}

		if (input === APP_TOGGLES.exportTokens.key) {
			setExportTokensEnabled((prev) => !prev);
			return;
		}

		if (input === "a" || input === "+") {
			if (mode === "SINGLE") {
				const singleConfig = config as Partial<PaletteConfig>;
				const current: PaletteConfig = {
					...defaultPaletteConfig,
					name: singleConfig.name,
					baseHue: singleConfig.baseHue ?? defaultPaletteConfig.baseHue,
					hueShift: singleConfig.hueShift ?? defaultPaletteConfig.hueShift,
					hueCurve: singleConfig.hueCurve ?? defaultPaletteConfig.hueCurve,
					saturation:
						singleConfig.saturation ?? defaultPaletteConfig.saturation,
					lightness: singleConfig.lightness ?? defaultPaletteConfig.lightness,
					shades: singleConfig.shades ?? defaultPaletteConfig.shades,
					cmykSafe: singleConfig.cmykSafe ?? defaultPaletteConfig.cmykSafe,
				};
				setConfig([current, { ...current }]);
				setMode("ARRAY");
				setActiveIndex(1);
				return;
			}

			if (mode === "ARRAY") {
				const arr = [...(config as PaletteConfig[])];
				const activePalette = arr[activeIndex] ?? { ...defaultPaletteConfig };
				arr.push({ ...activePalette });
				setConfig(arr);
				setActiveIndex(arr.length - 1);
			}
			return;
		}

		if (input === "m") {
			if (mode === "SINGLE") {
				const current = config as PaletteConfig;
				setConfig({
					...defaultPalettesConfig,
					hues: {
						start: current.baseHue,
						end: (current.baseHue + 60) % 360,
						count: 3,
						curve: "linear",
					},
					saturation: current.saturation,
					lightness: current.lightness,
					shades: current.shades,
					cmykSafe: current.cmykSafe,
				});
				setMode("SPECTRUM");
			}
			return;
		}

		if (mode === "ARRAY") {
			if (input === "[" || input === "{") {
				setActiveIndex((i) => Math.max(0, i - 1));
				return;
			}

			if (input === "]" || input === "}") {
				setActiveIndex((i) =>
					Math.min((config as PaletteConfig[]).length - 1, i + 1),
				);
				return;
			}

			if (key.delete || key.backspace) {
				const arr = [...(config as PaletteConfig[])];
				if (arr.length > 1) {
					arr.splice(activeIndex, 1);
					setConfig(arr);
					setActiveIndex(Math.min(activeIndex, arr.length - 1));
				} else {
					setConfig(arr[0] ?? { ...defaultPaletteConfig });
					setMode("SINGLE");
					setActiveIndex(0);
				}
				return;
			}
		}

		if (mode === "SPECTRUM") {
			const spec = config as PalettesConfig;
			if (spec.hues.count <= 1 && input === "u") {
				setConfig({
					...defaultPaletteConfig,
					baseHue: spec.hues.start,
					saturation: spec.saturation,
					lightness: spec.lightness,
					shades: spec.shades,
					cmykSafe: spec.cmykSafe,
				});
				setMode("SINGLE");
			}
		}
	});

	const saveAndExit = async () => {
		setStatus(UI_TEXT.statusSaving);

		try {
			let configArray: PaletteConfig[] = [];

			if (mode === "ARRAY") {
				configArray = config as PaletteConfig[];
			} else if (mode === "SPECTRUM") {
				configArray = expandPalettesConfig(config as PalettesConfig);
			} else {
				configArray = [config as PaletteConfig];
			}

			const results = configArray.map(generatePalette);
			const outputData = mode === "SINGLE" ? results[0] : results;
			const tokensData = exportTokensEnabled
				? exportFigmaTokens(results)
				: undefined;

			const res = await onSave(outputData, tokensData, {
				exportTokens: exportTokensEnabled,
			});

			setStatus(`${UI_TEXT.savedToPrefix} ${res.outFilePath}`);
			if (res.tokensSaved) {
				console.log(`${UI_TEXT.savedTokensPrefix} ${res.tokensFilePath}`);
			}

			setTimeout(exit, 500);
		} catch (e) {
			console.error(e);
			exit(e as Error);
		}
	};

	if (status !== UI_TEXT.statusEditing) {
		return (
			<Box padding={1}>
				<Text color="green">{status}</Text>
			</Box>
		);
	}

	const onUpdateConfig = (updater: (prev: ConfigInput) => ConfigInput) => {
		setConfig((prev) => {
			if (mode === "ARRAY") {
				const arr = [...(prev as PaletteConfig[])];
				arr[activeIndex] = updater(
					arr[activeIndex] || defaultPaletteConfig,
				) as PaletteConfig;
				return arr;
			}
			return updater(prev) as ConfigInput;
		});
	};

	return (
		<Box flexDirection="column" paddingX={1} paddingTop={1}>
			<Box marginBottom={1} justifyContent="space-between">
				<Text bold color="cyan">
					{UI_TEXT.title}
				</Text>
				<Text color="gray">
					{UI_TEXT.modeLabel}:{" "}
					<Text bold color="yellow">
						{MODE_LABELS[mode]}
					</Text>
				</Text>
			</Box>

			<Box flexDirection="row">
				<Box
					width={44}
					marginRight={2}
					borderStyle="single"
					borderColor="gray"
					flexDirection="column"
				>
					<Editor
						config={activeConfig || defaultPaletteConfig}
						mode={mode}
						onChange={onUpdateConfig}
						outOfGamutCount={outOfGamutCount}
					/>
				</Box>

				<Box
					flexGrow={1}
					borderStyle="single"
					borderColor="gray"
					flexDirection="column"
					paddingX={1}
					paddingY={1}
				>
					<PalettePreview
						config={config || defaultPaletteConfig}
						mode={mode}
						activeIndex={activeIndex}
						previewState={previewState}
					/>
				</Box>
			</Box>

			<Box marginTop={1} flexDirection="row" justifyContent="space-between">
				<Box flexDirection="column">
					<Text color="gray">
						{MODE_ACTIONS[mode].map((action, index) => (
							<React.Fragment key={`${mode}-${action.key}-${action.label}`}>
								<Text bold>{action.key} </Text>
								{action.label}
								{index < MODE_ACTIONS[mode].length - 1 ? "  " : ""}
							</React.Fragment>
						))}
					</Text>

					<Text color="gray">
						{NAVIGATION_ACTIONS.map((action, index) => (
							<React.Fragment key={`${action.key}-${action.label}`}>
								<Text bold>{action.key} </Text>
								{action.label}
								{index < NAVIGATION_ACTIONS.length - 1 ? "  " : ""}
							</React.Fragment>
						))}
					</Text>

					<Text color={exportTokensEnabled ? "green" : "gray"}>
						<Text bold>{APP_TOGGLES.exportTokens.key} </Text>
						{APP_TOGGLES.exportTokens.label}:{" "}
						<Text bold>{exportTokensEnabled ? "ON" : "OFF"}</Text>
					</Text>
				</Box>

				<Box flexDirection="column" alignItems="flex-end">
					{GLOBAL_ACTIONS.map((action) => (
						<Text
							key={`${action.key}-${action.label}`}
							color={action.key === "q" ? "red" : "green"}
							bold
						>
							[{action.key}] {action.label}
						</Text>
					))}
				</Box>
			</Box>
		</Box>
	);
}
