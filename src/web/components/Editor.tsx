import { useMemo } from "react";
import {
	EDITOR_PROPERTIES,
	type EditorPropertyMeta,
	type PropertyPath,
	type UiMode,
} from "@/lib/constants";
import type { ConfigInput, PaletteConfig, PalettesConfig } from "@/lib/types";
import { NumberInput } from "../ui/NumberInput";
import { SegmentedControl } from "../ui/SegmentedControl";
import { SliderInput } from "../ui/SliderInput";
import { Toggle } from "../ui/Toggle";

interface EditorProps {
	config: ConfigInput;
	mode: UiMode;
	onChange: (updater: (prev: ConfigInput) => ConfigInput) => void;
	onModeChange: (newMode: UiMode) => void;
	outOfGamutCount?: number;
}

function getPathValue<T = unknown>(obj: ConfigInput, path: PropertyPath): T {
	const [firstKey, secondKey] = path;
	const root = obj as unknown as Record<string, unknown>;
	if (secondKey === undefined) return root?.[firstKey] as T;
	const nested = root?.[firstKey] as Record<string, unknown> | undefined;
	return nested?.[secondKey] as T;
}

function setPathValue(
	obj: ConfigInput,
	path: PropertyPath,
	value: unknown,
): ConfigInput {
	const [firstKey, secondKey] = path;
	const root = obj as unknown as Record<string, unknown>;
	const next = { ...root };

	if (secondKey === undefined) {
		next[firstKey] = value;
		return next as unknown as ConfigInput;
	}

	next[firstKey] = {
		...((next[firstKey] as Record<string, unknown>) ?? {}),
		[secondKey]: value,
	};
	return next as unknown as ConfigInput;
}

export function Editor({
	config,
	mode,
	onChange,
	onModeChange,
	outOfGamutCount,
}: EditorProps) {
	const allProps = useMemo<readonly EditorPropertyMeta[]>(() => {
		const modeSpecific =
			mode === "SPECTRUM"
				? EDITOR_PROPERTIES.spectrumOnly
				: EDITOR_PROPERTIES.palettesOnly;
		return [...modeSpecific, ...EDITOR_PROPERTIES.common];
	}, [mode]);

	const handleChange = (prop: EditorPropertyMeta, value: unknown) => {
		onChange((prev) => setPathValue(prev, prop.path, value));
	};

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
			<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
				<span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }}>Mode</span>
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<button
						type="button"
						className={`btn ${mode === "PALETTES" ? "active" : ""}`}
						onClick={() => onModeChange("PALETTES")}
					>
						Palettes
					</button>
					<button
						type="button"
						className={`btn ${mode === "SPECTRUM" ? "active" : ""}`}
						onClick={() => onModeChange("SPECTRUM")}
					>
						Spectrum
					</button>
				</div>
			</div>

			<hr
				style={{
					border: "0",
					borderTop: "1px solid var(--border-color)",
					margin: "0",
				}}
			/>

			<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
				{allProps.map((prop) => {
					const rawValue = getPathValue(config, prop.path);

					if (prop.kind === "number") {
						const numValue = typeof rawValue === "number" ? rawValue : prop.min;
						return (
							<div key={prop.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: "0.25rem",
									}}
								>
									<label
										htmlFor={prop.id}
										style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }}
										title={prop.description}
									>
										{prop.label}
									</label>
								</div>
								{prop.id === "huesCount" ? (
									<NumberInput
										id={prop.id}
										value={numValue}
										min={prop.min}
										max={prop.max}
										step={prop.step}
										onChange={(val) => handleChange(prop, val)}
									/>
								) : (
									<SliderInput
										id={prop.id}
										value={numValue}
										min={prop.min}
										max={prop.max}
										step={prop.step}
										onChange={(val) => handleChange(prop, val)}
									/>
								)}
								{prop.description && (
									<div
										style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.25rem" }}
									>
										{prop.description}
									</div>
								)}
							</div>
						);
					}

					if (prop.kind === "toggle") {
						const isChecked = Boolean(rawValue);
						return (
							<div
								key={prop.id}
								style={{
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									justifyContent: "space-between",
									gap: "0.5rem",
								}}
							>
								<div style={{ display: "flex", flexDirection: "column" }}>
									<span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }} title={prop.description}>
										{prop.label}
									</span>
									{prop.description && (
										<span
											style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}
										>
											{prop.description}
										</span>
									)}
								</div>
								<Toggle
									id={prop.id}
									checked={isChecked}
									onChange={(val) => handleChange(prop, val)}
									onLabel={prop.onLabel}
									offLabel={prop.offLabel}
								/>
							</div>
						);
					}

					if (prop.kind === "select") {
						return (
							<div key={prop.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
								<label
									htmlFor={prop.id}
									style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }}
									title={prop.description}
								>
									{prop.label}
								</label>
								<SegmentedControl
									id={prop.id}
									options={prop.options}
									value={String(rawValue)}
									onChange={(val) => handleChange(prop, val)}
								/>
								{prop.description && (
									<div
										style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "-0.25rem" }}
									>
										{prop.description}
									</div>
								)}
							</div>
						);
					}

					return null;
				})}
			</div>

			{outOfGamutCount !== undefined &&
				outOfGamutCount > 0 &&
				"cmykSafe" in config &&
				(config as PaletteConfig | PalettesConfig).cmykSafe && (
					<div
						style={{
							color: "var(--danger-color)",
							fontSize: "0.875rem",
							fontWeight: 500,
							padding: "0.5rem",
							background: "rgba(239, 68, 68, 0.1)",
							borderRadius: "var(--radius-sm)",
							textAlign: "center",
						}}
					>
						⚠️ {outOfGamutCount} colors out of gamut
					</div>
				)}
		</div>
	);
}
