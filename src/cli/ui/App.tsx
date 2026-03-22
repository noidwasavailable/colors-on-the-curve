/** @jsxImportSource @opentui/react */

import { useKeyboard } from "@opentui/react";
import { randomUUIDv7 } from "bun";
import React, { useEffect, useMemo, useState } from "react";
import helpText from "@/cli/help.txt";
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
import { UI_COLORS } from "./colors";
import { Editor } from "./Editor";
import { PalettePreview } from "./PalettePreview";

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
	const [renameValue, setRenameValue] = useState("");
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

	useKeyboard((key) => {
		if (isHelp) {
			setIsHelp(false);
			return;
		}
		if (isRenaming) return;
		if (status !== UI_TEXT.statusEditing) return;

		const ch = key.name;

		if (ch === "h") {
			setIsHelp(true);
			return;
		}

		if (ch === "q") {
			process.exit(0);
		}

		if (ch === "s") {
			saveAndExit();
			return;
		}

		if (ch === "r") {
			setRenameValue("");
			setIsRenaming(true);
			return;
		}

		if (ch === APP_TOGGLES.exportTokens.key) {
			setExportTokensEnabled((prev) => !prev);
			return;
		}

		if (ch === "p") {
			setExportTransparencyEnabled((prev) => !prev);
			return;
		}

		if (ch === "+") {
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

		if (ch === "m") {
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
			if (ch === "[" || ch === "{") {
				setActiveIndex((i) => Math.max(0, i - 1));
				return;
			}

			if (ch === "]" || ch === "}") {
				setActiveIndex((i) =>
					Math.min((config as PaletteConfig[]).length - 1, i + 1),
				);
				return;
			}

			if (ch === "-") {
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

		const numMatch = ch.match(/^[1-9]$/);
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

			setTimeout(() => process.exit(0), 500);
		} catch (e) {
			console.error(e);
			process.exit(1);
		}
	};

	if (status !== UI_TEXT.statusEditing) {
		return (
			<box padding={1}>
				<text fg={UI_COLORS.success}>{status}</text>
			</box>
		);
	}

	if (isHelp) {
		return (
			<box
				padding={2}
				flexDirection="column"
				border
				borderStyle="rounded"
				borderColor={UI_COLORS.accent}
			>
				<text>{helpText}</text>
				<box marginTop={1}>
					<text fg={UI_COLORS.muted}>(Press any key to go back)</text>
				</box>
			</box>
		);
	}

	if (isRenaming) {
		const activePaletteResult = previewState.palettes[activeIndex];
		return (
			<box
				padding={1}
				flexDirection="column"
				border
				borderStyle="single"
				borderColor={UI_COLORS.rename}
			>
				<text>
					<strong>Rename Palette</strong>
				</text>

				{activePaletteResult && (
					<box flexDirection="row" marginY={1}>
						{activePaletteResult.colors.slice(0, 11).map((color) => (
							<text key={color.shade} bg={color.hex}>
								{"    "}
							</text>
						))}
					</box>
				)}

				<box flexDirection="row">
					<text>New Name: </text>
					{/*
					  The input component needs an explicit size (flexGrow) from the first
					  render so opentui allocates a stable buffer region. Without it, the
					  component starts at 0-width and the first few keystrokes appear to
					  overwrite each other before the layout stabilises.
					*/}
					<input
						focused
						placeholder="type new name…"
						style={{ flexGrow: 1 }}
						onInput={setRenameValue}
						onSubmit={(query) => {
							const name = typeof query === "string" ? query : renameValue;
							const newConfig = renamePalette(config, mode, activeIndex, name);
							setConfig(newConfig);
							setIsRenaming(false);
							setRenameValue("");
						}}
					/>
				</box>
				<text fg={UI_COLORS.muted}>(Press Enter to save)</text>
			</box>
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
		<box flexDirection="column" paddingX={1} paddingTop={1}>
			<box marginBottom={1} justifyContent="space-between">
				<text fg={UI_COLORS.accent}>
					<strong>{UI_TEXT.title}</strong>
				</text>
				<text fg={UI_COLORS.muted}>
					{UI_TEXT.modeLabel}:{" "}
					<strong fg={UI_COLORS.warning}>{MODE_LABELS[mode]}</strong>
				</text>
			</box>

			<box flexDirection="row">
				<box
					width={44}
					marginRight={2}
					border
					borderStyle="single"
					borderColor={UI_COLORS.muted}
					flexDirection="column"
				>
					<Editor
						config={activeConfig || defaultPaletteConfig}
						mode={mode}
						onChange={onUpdateConfig}
						outOfGamutCount={outOfGamutCount}
					/>
				</box>

				<box
					flexGrow={1}
					border
					borderStyle="single"
					borderColor={UI_COLORS.muted}
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
				</box>
			</box>

			<box marginTop={1} flexDirection="row" justifyContent="space-between">
				<box flexDirection="column">
					<text fg={UI_COLORS.muted}>
						{MODE_ACTIONS[mode]?.map((action, index) => (
							<React.Fragment key={`${mode}-${action.key}-${action.label}`}>
								<strong>{action.key} </strong>
								{action.label}
								{index < (MODE_ACTIONS[mode]?.length ?? 0) - 1 ? "  " : ""}
							</React.Fragment>
						))}
					</text>

					<text fg={UI_COLORS.muted}>
						{NAVIGATION_ACTIONS.map((action, index) => (
							<React.Fragment key={`${action.key}-${action.label}`}>
								<strong>{action.key} </strong>
								{action.label}
								{index < NAVIGATION_ACTIONS.length - 1 ? "  " : ""}
							</React.Fragment>
						))}
					</text>

					<text fg={exportTokensEnabled ? UI_COLORS.success : UI_COLORS.muted}>
						<strong>{APP_TOGGLES.exportTokens.key} </strong>
						{APP_TOGGLES.exportTokens.label}:{" "}
						<strong>{exportTokensEnabled ? "ON" : "OFF"}</strong>
					</text>
					<text
						fg={exportTransparencyEnabled ? UI_COLORS.success : UI_COLORS.muted}
					>
						<strong>p </strong>
						Transparency Tokens:{" "}
						<strong>{exportTransparencyEnabled ? "ON" : "OFF"}</strong>
					</text>
				</box>

				<box flexDirection="column" alignItems="flex-end">
					{GLOBAL_ACTIONS.map((action) => (
						<text
							key={`${action.key}-${action.label}`}
							fg={action.key === "q" ? UI_COLORS.error : UI_COLORS.success}
						>
							<strong>
								[{action.key}] {action.label}
							</strong>
						</text>
					))}
				</box>
			</box>
		</box>
	);
}
