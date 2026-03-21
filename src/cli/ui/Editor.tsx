import { Box, Text, useInput } from "ink";
import { useMemo, useState } from "react";
import {
	EDITOR_PROPERTIES,
	type EditorPropertyMeta,
	type PropertyPath,
	UI_TEXT,
	type UiMode,
} from "@/lib/constants";
import type { ConfigInput } from "@/lib/types";

interface EditorProps {
	config: ConfigInput;
	mode: UiMode;
	onChange: (updater: (prev: ConfigInput) => ConfigInput) => void;
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

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function Editor({
	config,
	mode,
	onChange,
	outOfGamutCount,
}: EditorProps) {
	const [activePropIndex, setActivePropIndex] = useState(0);

	const allProps = useMemo<readonly EditorPropertyMeta[]>(() => {
		const modeSpecific =
			mode === "SPECTRUM"
				? EDITOR_PROPERTIES.spectrumOnly
				: EDITOR_PROPERTIES.singleOnly;

		return [...modeSpecific, ...EDITOR_PROPERTIES.common];
	}, [mode]);

	const safeActiveIndex = clamp(
		activePropIndex,
		0,
		Math.max(0, allProps.length - 1),
	);
	const activeProp = allProps[safeActiveIndex];

	useInput((input, key) => {
		if (key.upArrow) {
			setActivePropIndex((prev) => Math.max(0, prev - 1));
			return;
		}

		if (key.downArrow) {
			setActivePropIndex((prev) => Math.min(allProps.length - 1, prev + 1));
			return;
		}

		const prop = allProps[activePropIndex];
		if (!prop) return;

		const isAdjustKey = key.leftArrow || key.rightArrow;
		const isToggleKey = input === " " || key.return;
		if (!isAdjustKey && !isToggleKey) return;

		const direction = key.rightArrow ? 1 : key.leftArrow ? -1 : 0;

		if (prop.kind === "number") {
			if (!isAdjustKey) return;

			const currentRaw = getPathValue(config, prop.path);
			const current = typeof currentRaw === "number" ? currentRaw : prop.min;
			const delta = (key.shift ? prop.step * 10 : prop.step) * direction;
			const nextValue = clamp(current + delta, prop.min, prop.max);
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
			if (!isAdjustKey) return;

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
		<Box flexDirection="column" paddingX={2} paddingY={1}>
			<Box marginBottom={1}>
				<Text bold underline>
					{UI_TEXT.editorTitle}
				</Text>
			</Box>

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
					<Box key={prop.id}>
						<Text color={isActive ? "green" : undefined}>
							{isActive ? "> " : "  "}
							{prop.label.padEnd(15, " ")}: {renderedValue}
						</Text>
					</Box>
				);
			})}

			<Box marginTop={1} flexDirection="column">
				<Text color="yellow">{activeProp?.description ?? ""}</Text>
				{activeProp?.id === "cmykSafe" &&
					"cmykSafe" in config &&
					config.cmykSafe &&
					outOfGamutCount !== undefined &&
					outOfGamutCount > 0 && (
						<Text color="red">{outOfGamutCount} colors out of gamut</Text>
					)}
			</Box>
		</Box>
	);
}
