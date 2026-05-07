/** @jsxImportSource @opentui/react */
import { useKeyboard } from "@opentui/react";
import { useMemo, useState } from "react";
import {
	EDITOR_PROPERTIES,
	type EditorPropertyMeta,
	type PropertyPath,
	UI_TEXT,
	type UiMode,
} from "@/lib/constants";
import type { ConfigInput } from "@/lib/types";
import { UI_COLORS } from "./colors";

interface EditorProps {
	config: ConfigInput;
	mode: UiMode;
	onChange: (updater: (prev: ConfigInput) => ConfigInput) => void;
	outOfGamutCount?: number;
	outOfSrgbCount?: number;
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

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function Editor({
	config,
	mode,
	onChange,
	outOfGamutCount,
	outOfSrgbCount,
}: EditorProps) {
	const [activePropIndex, setActivePropIndex] = useState(0);

	const allProps = useMemo<readonly EditorPropertyMeta[]>(() => {
		const modeSpecific =
			mode === "SPECTRUM"
				? EDITOR_PROPERTIES.spectrumOnly
				: EDITOR_PROPERTIES.palettesOnly;

		const colorSpace = "colorSpace" in config ? config.colorSpace : "oklch";

		return [...modeSpecific, ...EDITOR_PROPERTIES.common].filter((prop) => {
			if (colorSpace === "hsl") {
				return (
					!prop.id.startsWith("chroma") &&
					!prop.id.startsWith("oklchLight") &&
					!prop.id.startsWith("srgbRecon")
				);
			}
			// OKLCH is default
			return !prop.id.startsWith("sat") && !prop.id.startsWith("light");
		});
	}, [mode, config]);

	const safeActiveIndex = clamp(
		activePropIndex,
		0,
		Math.max(0, allProps.length - 1),
	);
	const activeProp = allProps[safeActiveIndex];

	useKeyboard((event) => {
		if (event.name === "up") {
			setActivePropIndex((prev) =>
				Math.max(0, Math.min(prev, allProps.length - 1) - 1),
			);
			return;
		}

		if (event.name === "down") {
			setActivePropIndex((prev) =>
				Math.min(allProps.length - 1, Math.min(prev, allProps.length - 1) + 1),
			);
			return;
		}

		const prop = allProps[safeActiveIndex];
		if (!prop) return;

		const isLeftRight = event.name === "left" || event.name === "right";
		const isToggleKey = event.name === "space" || event.name === "return";
		if (!isLeftRight && !isToggleKey) return;

		const direction =
			event.name === "right" ? 1 : event.name === "left" ? -1 : 0;

		if (prop.kind === "number") {
			if (!isLeftRight) return;

			const currentRaw = getPathValue(config, prop.path);
			const current = typeof currentRaw === "number" ? currentRaw : prop.min;
			const delta = (event.shift ? prop.step * 10 : prop.step) * direction;
			const nextValue = Number(
				clamp(current + delta, prop.min, prop.max).toFixed(3),
			);
			if (nextValue === current) return;

			onChange((prev) => setPathValue(prev, prop.path, nextValue));
			return;
		}

		if (prop.kind === "toggle") {
			const currentRaw = getPathValue(config, prop.path);
			const current = Boolean(currentRaw);
			onChange((prev) => setPathValue(prev, prop.path, !current));
			return;
		}

		if (prop.kind === "select") {
			if (!isLeftRight) return;

			const currentRaw = getPathValue(config, prop.path);
			const currentIndex = prop.options.findIndex(
				(opt) => opt.value === currentRaw,
			);
			const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;
			const nextIndex = clamp(
				fallbackIndex + direction,
				0,
				prop.options.length - 1,
			);
			const nextOption = prop.options[nextIndex];
			if (!nextOption) return;

			onChange((prev) => setPathValue(prev, prop.path, nextOption.value));
		}
	});

	return (
		<box flexDirection="column" paddingX={2} paddingY={1}>
			<box marginBottom={1}>
				<text>
					<strong>
						<u>{UI_TEXT.editorTitle}</u>
					</strong>
				</text>
			</box>

			{allProps.map((prop, index) => {
				const isActive = index === safeActiveIndex;
				const rawValue = getPathValue(config, prop.path);

				let renderedValue = "";
				if (prop.kind === "number") {
					const numberValue =
						typeof rawValue === "number" ? rawValue : prop.min;
					renderedValue = numberValue.toString();
				} else if (prop.kind === "toggle") {
					const enabled = Boolean(rawValue);
					renderedValue = enabled
						? (prop.onLabel ?? "ON")
						: (prop.offLabel ?? "OFF");
				} else {
					const selected = prop.options.find((o) => o.value === rawValue);
					renderedValue = selected?.label ?? prop.options[0]?.label ?? "";
				}

				return (
					<box key={prop.id}>
						<text fg={isActive ? UI_COLORS.success : undefined}>
							{isActive ? "> " : "  "}
							{prop.label.padEnd(15, " ")}: {renderedValue}
						</text>
					</box>
				);
			})}

			<box marginTop={1} flexDirection="column">
				<text fg={UI_COLORS.warning}>{activeProp?.description ?? ""}</text>
				{activeProp?.id === "cmykSafe" &&
					"cmykSafe" in config &&
					config.cmykSafe &&
					outOfGamutCount !== undefined &&
					outOfGamutCount > 0 && (
						<text fg={UI_COLORS.error}>
							{outOfGamutCount} colors out of gamut
						</text>
					)}
				{("colorSpace" in config ? config.colorSpace : "oklch") === "oklch" &&
					outOfSrgbCount !== undefined &&
					outOfSrgbCount > 0 && (
						<text fg={UI_COLORS.warning}>
							{outOfSrgbCount} colors mapped to sRGB
						</text>
					)}
			</box>
		</box>
	);
}
