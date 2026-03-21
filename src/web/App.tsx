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
import { Preview } from "./components/Preview";
import "./index.css";

export function App() {
	const [mode, setMode] = useState<UiMode>("SINGLE");
	const [config, setConfig] = useState<ConfigInput>({
		...defaultPaletteConfig,
	});
	const [activeIndex, setActiveIndex] = useState(0);
	const [exportTokensEnabled, setExportTokensEnabled] = useState(false);

	const previewState = useMemo(() => {
		let palettes: PaletteResult[] = [];
		let previewError: string | null = null;

		try {
			if (mode === "SINGLE") {
				palettes = [generatePalette(config as PaletteConfig)];
			} else if (mode === "ARRAY") {
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
		mode === "ARRAY" ? (config as PaletteConfig[])[activeIndex] : config;

	const handleConfigChange = (updater: (prev: ConfigInput) => ConfigInput) => {
		setConfig((prev) => {
			if (mode === "ARRAY") {
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

		if (newMode === "SINGLE") {
			const current =
				mode === "ARRAY"
					? ((config as PaletteConfig[])[0] ?? defaultPaletteConfig)
					: (config as PalettesConfig);
			setConfig({
				...defaultPaletteConfig,
				baseHue: "hues" in current ? current.hues.start : current.baseHue,
				saturation: current.saturation,
				lightness: current.lightness,
				shades: current.shades,
				cmykSafe: current.cmykSafe,
			});
		} else if (newMode === "ARRAY") {
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
			setConfig([
				{ ...current, id: crypto.randomUUID() },
				{ ...current, id: crypto.randomUUID() },
			]);
			setActiveIndex(1);
		} else if (newMode === "SPECTRUM") {
			const current =
				mode === "ARRAY"
					? ((config as PaletteConfig[])[0] ?? defaultPaletteConfig)
					: (config as PaletteConfig);
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
		}
		setMode(newMode);
	};

	const handleAddPalette = () => {
		if (mode !== "ARRAY") return;
		const arr = [...(config as PaletteConfig[])];
		const activePalette = arr[activeIndex] ?? { ...defaultPaletteConfig };
		arr.push({
			...JSON.parse(JSON.stringify(activePalette)),
			id: crypto.randomUUID(),
		});
		setConfig(arr);
		setActiveIndex(arr.length - 1);
	};

	const handleRemovePalette = (indexToRemove: number) => {
		if (mode !== "ARRAY") return;
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
		if (mode === "SINGLE") {
			setConfig({ ...config, name: newName } as ConfigInput);
		} else if (mode === "ARRAY") {
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
		<div className="app-container">
			<aside className="sidebar">
				<header className="sidebar-header">
					<h1>Colors on the Curve</h1>
				</header>
				<div className="sidebar-content">
					<Editor
						config={activeConfig || defaultPaletteConfig}
						mode={mode}
						onChange={handleConfigChange}
						onModeChange={handleModeChange}
						outOfGamutCount={outOfGamutCount}
					/>
				</div>
			</aside>

			<main className="main-content">
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "1.5rem 1.5rem 0",
						flexShrink: 0,
					}}
				>
					<div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
						<h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
							Preview
						</h2>
						<span className="text-muted text-sm">
							{previewState.palettes.length} palettes
						</span>
					</div>
					<div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
						<label
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								fontSize: "0.875rem",
								cursor: "pointer",
								color: "var(--text-muted)",
							}}
						>
							<input
								type="checkbox"
								checked={exportTokensEnabled}
								onChange={(e) => setExportTokensEnabled(e.target.checked)}
							/>
							Figma Tokens
						</label>
						<button
							type="button"
							className="btn active"
							onClick={handleExport}
							disabled={previewState.palettes.length === 0}
						>
							Export JSON
						</button>
					</div>
				</div>
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
