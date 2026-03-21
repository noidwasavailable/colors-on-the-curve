import { randomUUIDv7 } from "bun";
import { Box, Text, useApp, useInput } from "ink";
import { UncontrolledTextInput } from "ink-text-input";
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
import { addPalette, removePalette, renamePalette } from "@/lib/paletteUtils";
import type {
	ConfigInput,
	PaletteConfig,
	PaletteResult,
	PalettesConfig,
} from "@/lib/types";
import type { SaveFunction } from "../types";
import { Editor } from "./Editor";
import { PalettePreview } from "./PalettePreview";

const helpText = await Bun.file(new URL("../help.txt", import.meta.url)).text();

interface AppProps {
	initialConfig: ConfigInput;
	initialMode: UiMode;
	onSave: SaveFunction;
	exportTokens: boolean;
	exportTransparencyTokens: boolean;
}

export function App({
	initialConfig,
	initialMode,
	onSave,
	exportTokens,
	exportTransparencyTokens,
}: AppProps) {
	const { exit } = useApp();
	const [config, setConfig] = useState<ConfigInput>(initialConfig);
	const [mode, setMode] = useState<UiMode>(initialMode);
	const [activeIndex, setActiveIndex] = useState(0);
	const [status, setStatus] = useState<string>(UI_TEXT.statusEditing);
	const [exportTokensEnabled, setExportTokensEnabled] =
		useState<boolean>(exportTokens);
	const [exportTransparencyEnabled, setExportTransparencyEnabled] =
		useState<boolean>(exportTransparencyTokens);

	const [persistedArrayConfig, setPersistedArrayConfig] = useState<
		PaletteConfig[] | null
	>(null);
	const [persistedSpectrumConfig, setPersistedSpectrumConfig] =
		useState<PalettesConfig | null>(null);

	const [isRenaming, setIsRenaming] = useState(false);
	const [isHelp, setIsHelp] = useState(false);

	const activeConfig =
		mode === "PALETTES" ? (config as PaletteConfig[])[activeIndex] : config;

	const previewState = useMemo(() => {
		let palettes: PaletteResult[] = [];
		let previewError: string | null = null;

		try {
			if (mode === "PALETTES") {
				const arr = config as PaletteConfig[];
				palettes = arr.map(generatePalette);
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
	}, [config, mode]);

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
			setMode("PALETTES");
			setConfig(
				initialConfig.length
					? initialConfig
					: [{ ...defaultPaletteConfig, id: randomUUIDv7() }],
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

		setMode("PALETTES");
		setConfig([
			{
				...defaultPaletteConfig,
				id: randomUUIDv7(),
				...(initialConfig as PaletteConfig),
			},
		]);
	}, [initialConfig]);

	useInput((input) => {
		if (isHelp) {
			setIsHelp(false);
			return;
		}
		if (isRenaming) return;
		if (status !== UI_TEXT.statusEditing) return;

		if (input === "h") {
			setIsHelp(true);
			return;
		}

		if (input === "q") {
			exit();
			return;
		}

		if (input === "s") {
			void saveAndExit();
			return;
		}

		if (input === "r") {
			setIsRenaming(true);
			return;
		}

		if (input === APP_TOGGLES.exportTokens.key) {
			setExportTokensEnabled((prev) => !prev);
			return;
		}

		if (input === "p") {
			setExportTransparencyEnabled((prev) => !prev);
			return;
		}

		if (input === "+") {
			if (mode === "PALETTES") {
				const { newConfig, newActiveIndex } = addPalette(
					config as PaletteConfig[],
					activeIndex,
					randomUUIDv7,
				);
				setConfig(newConfig);
				setActiveIndex(newActiveIndex);
			}
			return;
		}

		if (input === "m") {
			if (mode === "PALETTES") {
				setPersistedArrayConfig(config as PaletteConfig[]);
				if (persistedSpectrumConfig) {
					setConfig(persistedSpectrumConfig);
				} else {
					setConfig({
						...defaultPalettesConfig,
					});
				}
				setMode("SPECTRUM");
			} else if (mode === "SPECTRUM") {
				setPersistedSpectrumConfig(config as PalettesConfig);
				if (persistedArrayConfig) {
					setConfig(persistedArrayConfig);
					setActiveIndex(0);
				} else {
					const spec = config as PalettesConfig;
					setConfig([
						{
							...defaultPaletteConfig,
							id: randomUUIDv7(),
							baseHue: spec.hues.start,
							saturation: spec.saturation,
							lightness: spec.lightness,
							shades: spec.shades,
							cmykSafe: spec.cmykSafe,
						},
					]);
					setActiveIndex(0);
				}
				setMode("PALETTES");
			}
			return;
		}

		if (mode === "PALETTES") {
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

			if (input === "-") {
				const { newConfig, newActiveIndex } = removePalette(
					config as PaletteConfig[],
					activeIndex,
					activeIndex,
				);
				setConfig(newConfig);
				setActiveIndex(newActiveIndex);
				return;
			}
		}
		const numMatch = input.match(/^[1-9]$/);
		if (numMatch) {
			const targetIndex = parseInt(numMatch[0], 10) - 1;
			if (targetIndex < previewState.palettes.length) {
				setActiveIndex(targetIndex);
			}
			return;
		}
	});

	const saveAndExit = async () => {
		setStatus(UI_TEXT.statusSaving);

		try {
			const outputData = previewState.palettes;
			const tokensData = exportTokensEnabled
				? exportFigmaTokens(outputData)
				: undefined;

			const res = await onSave(config, mode, outputData, tokensData, {
				exportTokens: exportTokensEnabled,
				transparencyTokens: exportTransparencyEnabled,
			});

			setStatus(`${UI_TEXT.savedToPrefix} ${res.outFilePath}`);
			if (res.tokensSaved) {
				console.log(`${UI_TEXT.savedTokensPrefix} ${res.tokensFilePath}`);
			}
			if (res.transparencyTokensSaved) {
				console.log(`Transparency tokens saved to ${res.transparencyDir}`);
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

	if (isHelp) {
		return (
			<Box
				padding={2}
				flexDirection="column"
				borderStyle="round"
				borderColor="cyan"
			>
				<Text>{helpText}</Text>
				<Box marginTop={1}>
					<Text color="#A0A0A0">(Press any key to go back)</Text>
				</Box>
			</Box>
		);
	}

	if (isRenaming) {
		const activePaletteResult = previewState.palettes[activeIndex];
		return (
			<Box
				padding={1}
				flexDirection="column"
				borderStyle="single"
				borderColor="green"
			>
				<Text bold>Rename Palette</Text>

				{activePaletteResult && (
					<Box flexDirection="row" marginY={1}>
						{activePaletteResult.colors.slice(0, 11).map((color) => (
							<Text key={color.shade} backgroundColor={color.hex}>
								{"    "}
							</Text>
						))}
					</Box>
				)}

				<Box flexDirection="row">
					<Text>New Name: </Text>
					<UncontrolledTextInput
						onSubmit={(query) => {
							const newConfig = renamePalette(config, mode, activeIndex, query);
							setConfig(newConfig);
							setIsRenaming(false);
						}}
					/>
				</Box>
				<Text color="#A0A0A0">(Press Enter to save)</Text>
			</Box>
		);
	}

	const onUpdateConfig = (updater: (prev: ConfigInput) => ConfigInput) => {
		setConfig((prev) => {
			if (mode === "PALETTES") {
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
				<Text color="#A0A0A0">
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
					borderColor="#A0A0A0"
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
					borderColor="#A0A0A0"
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
					<Text color="#A0A0A0">
						{MODE_ACTIONS[mode]?.map((action, index) => (
							<React.Fragment key={`${mode}-${action.key}-${action.label}`}>
								<Text bold>{action.key} </Text>
								{action.label}
								{index < (MODE_ACTIONS[mode]?.length ?? 0) - 1 ? "  " : ""}
							</React.Fragment>
						))}
					</Text>

					<Text color="#A0A0A0">
						{NAVIGATION_ACTIONS.map((action, index) => (
							<React.Fragment key={`${action.key}-${action.label}`}>
								<Text bold>{action.key} </Text>
								{action.label}
								{index < NAVIGATION_ACTIONS.length - 1 ? "  " : ""}
							</React.Fragment>
						))}
					</Text>

					<Text color={exportTokensEnabled ? "green" : "#A0A0A0"}>
						<Text bold>{APP_TOGGLES.exportTokens.key} </Text>
						{APP_TOGGLES.exportTokens.label}:{" "}
						<Text bold>{exportTokensEnabled ? "ON" : "OFF"}</Text>
					</Text>
					<Text color={exportTransparencyEnabled ? "green" : "#A0A0A0"}>
						<Text bold>p </Text>
						Transparency Tokens:{" "}
						<Text bold>{exportTransparencyEnabled ? "ON" : "OFF"}</Text>
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
