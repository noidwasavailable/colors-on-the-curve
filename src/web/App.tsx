import JSZip from "jszip";
import { useMemo, useState } from "react";
import type { UiMode } from "@/lib/constants";
import { defaultPaletteConfig, defaultPalettesConfig } from "@/lib/defaults";
import {
	buildTransparencyTokensList,
	exportFigmaTokens,
} from "@/lib/figmaExporter";
import { expandPalettesConfig, generatePalette } from "@/lib/generator";
import { addPalette, removePalette, renamePalette } from "@/lib/paletteUtils";
import type {
	ConfigInput,
	PaletteConfig,
	PaletteResult,
	PalettesConfig,
} from "@/lib/types";
import { Editor } from "./components/Editor";
import { Header } from "./components/Header";
import { Preview } from "./components/Preview";
import { PreviewHeader } from "./components/PreviewHeader";
import "./index.css";

const appStyles = {
	container: {
		display: "flex",
		height: "100vh",
		padding: "var(--pane-gap)",
		gap: "var(--pane-gap)",
		maxWidth: "1600px",
		margin: "0 auto",
	},
	sidebar: {
		width: "var(--sidebar-width)",
		minWidth: "var(--sidebar-width)",
		background: "var(--bg-panel)",
		backdropFilter: "blur(24px)",
		WebkitBackdropFilter: "blur(24px)",
		border: "1px solid var(--border-color)",
		borderRadius: "var(--radius-lg)",
		display: "flex",
		flexDirection: "column",
		overflowY: "auto",
		boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
	},
	sidebarContent: {
		flex: 1,
		padding: "1.5rem",
		overflowY: "auto",
		display: "flex",
		flexDirection: "column",
		gap: "1.5rem",
	},
	mainContent: {
		flex: 1,
		background: "var(--bg-panel)",
		backdropFilter: "blur(24px)",
		WebkitBackdropFilter: "blur(24px)",
		border: "1px solid var(--border-color)",
		borderRadius: "var(--radius-lg)",
		display: "flex",
		flexDirection: "column",
		overflow: "hidden",
		boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
	},
} as const;

export function App() {
	const [mode, setMode] = useState<UiMode>("PALETTES");
	const [config, setConfig] = useState<ConfigInput>([
		{ ...defaultPaletteConfig, id: crypto.randomUUID() },
	]);
	const [activeIndex, setActiveIndex] = useState(0);
	const [exportTokensEnabled, setExportTokensEnabled] = useState(false);
	const [exportTransparencyEnabled, setExportTransparencyEnabled] =
		useState(false);
	const [persistedArrayConfig, setPersistedArrayConfig] = useState<
		PaletteConfig[] | null
	>(null);
	const [persistedSpectrumConfig, setPersistedSpectrumConfig] =
		useState<PalettesConfig | null>(null);

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

	const activeConfig =
		mode === "PALETTES" ? (config as PaletteConfig[])[activeIndex] : config;

	const handleConfigChange = (updater: (prev: ConfigInput) => ConfigInput) => {
		setConfig((prev) => {
			if (mode === "PALETTES") {
				const arr = [...(prev as PaletteConfig[])];
				arr[activeIndex] = updater(
					arr[activeIndex] || defaultPaletteConfig,
				) as PaletteConfig;
				return arr;
			}
			return updater(prev);
		});
	};

	const handleModeChange = (newMode: UiMode) => {
		if (mode === newMode) return;

		if (mode === "PALETTES") {
			setPersistedArrayConfig(config as PaletteConfig[]);
		} else if (mode === "SPECTRUM") {
			setPersistedSpectrumConfig(config as PalettesConfig);
		}

		if (newMode === "PALETTES") {
			if (persistedArrayConfig) {
				setConfig(persistedArrayConfig);
				setActiveIndex(0);
			} else {
				const current =
					mode === "SPECTRUM"
						? {
								...defaultPaletteConfig,
								baseHue: (config as PalettesConfig).hues.start,
								saturation: (config as PalettesConfig).saturation,
								lightness: (config as PalettesConfig).lightness,
								shades: (config as PalettesConfig).shades,
								cmykSafe: (config as PalettesConfig).cmykSafe,
							}
						: (config as PaletteConfig);
				setConfig([{ ...current, id: crypto.randomUUID() }]);
				setActiveIndex(0);
			}
		} else if (newMode === "SPECTRUM") {
			if (persistedSpectrumConfig) {
				setConfig(persistedSpectrumConfig);
			} else {
				setConfig(defaultPalettesConfig);
			}
		}
		setMode(newMode);
	};

	const handleAddPalette = () => {
		if (mode !== "PALETTES") return;
		const { newConfig, newActiveIndex } = addPalette(
			config as PaletteConfig[],
			activeIndex,
			() => crypto.randomUUID(),
		);
		setConfig(newConfig);
		setActiveIndex(newActiveIndex);
	};

	const handleRemovePalette = (indexToRemove: number) => {
		if (mode !== "PALETTES") return;

		if ((config as PaletteConfig[]).length <= 1) {
			window.alert("Cannot remove the last palette in the array.");
			return;
		}

		const { newConfig, newActiveIndex } = removePalette(
			config as PaletteConfig[],
			activeIndex,
			indexToRemove,
		);
		setConfig(newConfig);
		setActiveIndex(newActiveIndex);
	};

	const handleRenamePalette = (index: number, newName: string) => {
		const newConfig = renamePalette(config, mode, index, newName);
		setConfig(newConfig);
	};

	const handleExport = async () => {
		if (previewState.palettes.length === 0) return;

		const exportData = {
			version: 1,
			mode,
			config,
			palettes: previewState.palettes,
		};

		const zip = new JSZip();
		zip.file("palettes.json", JSON.stringify(exportData, null, 2));

		if (exportTokensEnabled) {
			const tokens = exportFigmaTokens(previewState.palettes);
			zip.file("palettes.tokens.json", JSON.stringify(tokens, null, 2));

			if (exportTransparencyEnabled) {
				const transparencyFolder = zip.folder("transparency");
				if (transparencyFolder) {
					for (const { filename, tokens: tTokens } of buildTransparencyTokensList(tokens)) {
						transparencyFolder.file(filename, JSON.stringify(tTokens, null, 2));
					}
				}
			}
		}

		const blob = await zip.generateAsync({ type: "blob" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "palettes.zip";
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleImport = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (re) => {
				try {
					const content = JSON.parse(re.target?.result as string);
					if (content.config && content.mode) {
						setMode(content.mode);
						setConfig(content.config);
						setActiveIndex(0);
					} else {
						window.alert(
							"Invalid JSON format. Make sure it was exported from this app.",
						);
					}
				} catch (err) {
					console.error("Import error:", err);
					window.alert("Error parsing JSON file.");
				}
			};
			reader.readAsText(file);
		};
		input.click();
	};

	return (
		<div style={appStyles.container}>
			<aside style={appStyles.sidebar}>
				<Header />
				<div style={appStyles.sidebarContent}>
					<Editor
						config={activeConfig || defaultPaletteConfig}
						mode={mode}
						onChange={handleConfigChange}
						onModeChange={handleModeChange}
						outOfGamutCount={outOfGamutCount}
					/>
				</div>
			</aside>

			<main style={appStyles.mainContent}>
				<PreviewHeader
					paletteCount={previewState.palettes.length}
					exportTokensEnabled={exportTokensEnabled}
					setExportTokensEnabled={setExportTokensEnabled}
					exportTransparencyEnabled={exportTransparencyEnabled}
					setExportTransparencyEnabled={setExportTransparencyEnabled}
					onExport={handleExport}
					onImport={handleImport}
				/>
				{previewState.previewError && (
					<div
						style={{
							color: "var(--danger-color)",
							padding: "1rem 1.5rem",
							fontSize: "0.875rem",
						}}
					>
						⚠️ {previewState.previewError}
					</div>
				)}
				<Preview
					palettes={previewState.palettes}
					mode={mode}
					activeIndex={activeIndex}
					onSelectPalette={setActiveIndex}
					onRemovePalette={handleRemovePalette}
					onAddPalette={handleAddPalette}
					onRenamePalette={handleRenamePalette}
				/>
			</main>
		</div>
	);
}

export default App;
