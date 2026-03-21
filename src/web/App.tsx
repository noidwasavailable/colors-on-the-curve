import { useMemo, useState } from "react";
import type { UiMode } from "@/lib/constants";
import { defaultPaletteConfig, defaultPalettesConfig } from "@/lib/defaults";
import { exportFigmaTokens } from "@/lib/figmaExporter";
import { expandPalettesConfig, generatePalette } from "@/lib/generator";
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
	}
} as const;

export function App() {
	const [mode, setMode] = useState<UiMode>("PALETTES");
	const [config, setConfig] = useState<ConfigInput>([
		{ ...defaultPaletteConfig, id: crypto.randomUUID() },
	]);
	const [activeIndex, setActiveIndex] = useState(0);
	const [exportTokensEnabled, setExportTokensEnabled] = useState(false);
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
		const arr = [...(config as PaletteConfig[])];
		const activePalette = arr[activeIndex] ?? { ...defaultPaletteConfig };
		const nextHue = (activePalette.baseHue + 20) % 360;
		arr.push({
			...JSON.parse(JSON.stringify(activePalette)),
			baseHue: nextHue,
			id: crypto.randomUUID(),
		});
		setConfig(arr);
		setActiveIndex(arr.length - 1);
	};

	const handleRemovePalette = (indexToRemove: number) => {
		if (mode !== "PALETTES") return;
		const arr = [...(config as PaletteConfig[])];
		if (arr.length > 1) {
			arr.splice(indexToRemove, 1);
			setConfig(arr);
			if (activeIndex >= arr.length) {
				setActiveIndex(arr.length - 1);
			} else if (activeIndex >= indexToRemove) {
				setActiveIndex(Math.max(0, activeIndex - 1));
			}
		} else {
			window.alert("Cannot remove the last palette in the array.");
		}
	};

	const handleRenamePalette = (index: number, newName: string) => {
		if (mode === "PALETTES") {
			const arr = [...(config as PaletteConfig[])];
			arr[index] = { ...(arr[index] || defaultPaletteConfig), name: newName };
			setConfig(arr);
		} else if (mode === "SPECTRUM") {
			const pConfig = { ...(config as PalettesConfig) };
			const names = pConfig.names ? [...pConfig.names] : [];
			while (names.length <= index) names.push("");
			names[index] = newName;
			setConfig({ ...pConfig, names });
		}
	};

	const handleExport = () => {
		if (previewState.palettes.length === 0) return;

		const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(previewState.palettes, null, 2))}`;
		const a = document.createElement("a");
		a.href = dataStr;
		a.download = "palettes.json";
		a.click();

		if (exportTokensEnabled) {
			const tokens = exportFigmaTokens(previewState.palettes);
			const tokensStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(tokens, null, 2))}`;
			const t = document.createElement("a");
			t.href = tokensStr;
			t.download = "tokens.json";
			t.click();
		}
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
					onExport={handleExport}
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
