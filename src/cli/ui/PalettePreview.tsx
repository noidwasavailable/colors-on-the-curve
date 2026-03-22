/** @jsxImportSource @opentui/react */
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useMemo, useState } from "react";
import { PREVIEW_UI, UI_TEXT, type UiMode } from "@/lib/constants";
import type {
	ConfigInput,
	PaletteConfig,
	PaletteResult,
	PalettesConfig,
} from "@/lib/types";
import { UI_COLORS } from "./colors";

interface PalettePreviewProps {
	config: ConfigInput;
	mode: UiMode;
	activeIndex: number;
	previewState: {
		palettes: PaletteResult[];
		previewError: string | null;
	};
}

const VISIBLE_SWATCH_COUNT = 11;
const SWATCH_BLOCK_WIDTH = 6;
const SWATCH_BLOCK_HEIGHT = 2;
const SWATCH_BLOCK = " ".repeat(SWATCH_BLOCK_WIDTH);

export function PalettePreview({
	config,
	mode,
	activeIndex,
	previewState,
}: PalettePreviewProps) {
	const [scrollOffset, setScrollOffset] = useState(0);

	const isCmykSafeOn = useMemo(() => {
		if (mode === "PALETTES") {
			const arr = config as PaletteConfig[];
			return arr[activeIndex]?.cmykSafe ?? false;
		}
		return (config as PalettesConfig).cmykSafe ?? false;
	}, [config, mode, activeIndex]);

	const { palettes, previewError } = previewState;

	const maxColors = useMemo(
		() =>
			palettes.reduce(
				(max, palette) => Math.max(max, palette.colors.length),
				0,
			),
		[palettes],
	);

	const maxOffset = Math.max(0, maxColors - VISIBLE_SWATCH_COUNT);

	useEffect(() => {
		setScrollOffset((prev) => Math.min(prev, maxOffset));
	}, [maxOffset]);

	useKeyboard((event) => {
		if (event.name === "," || event.name === "h") {
			setScrollOffset((prev) => Math.max(0, prev - 1));
			return;
		}

		if (event.name === "." || event.name === "l") {
			setScrollOffset((prev) => Math.min(maxOffset, prev + 1));
		}
	});

	if (previewError) {
		return (
			<text fg={UI_COLORS.error}>
				{UI_TEXT.generateErrorPrefix} {previewError}
			</text>
		);
	}

	if (!palettes.length) {
		return <text fg={UI_COLORS.error}>{UI_TEXT.noPalettesGenerated}</text>;
	}

	const visibleStart = scrollOffset + 1;
	const visibleEnd = Math.min(scrollOffset + VISIBLE_SWATCH_COUNT, maxColors);

	return (
		<box flexDirection="column">
			{maxOffset > 0 && (
				<box marginBottom={1} flexDirection="row">
					<text fg={UI_COLORS.muted}>{PREVIEW_UI.horizontalOverflowHint}</text>
					<text fg={UI_COLORS.muted}>
						{" "}
						Scroll: ,/. ({visibleStart}-{visibleEnd} of {maxColors})
					</text>
				</box>
			)}

			<box flexDirection="column">
				{palettes.map((palette, i) => {
					const visibleColors = palette.colors.slice(
						scrollOffset,
						scrollOffset + VISIBLE_SWATCH_COUNT,
					);
					const hasLeft = scrollOffset > 0;
					const hasRight =
						scrollOffset + VISIBLE_SWATCH_COUNT < palette.colors.length;

					return (
						<box
							// biome-ignore lint/suspicious/noArrayIndexKey: Array size is static and never reorders
							key={`${palette.name}-${i}`}
							flexDirection="row"
							marginBottom={0}
						>
							<box width={20}>
								<text
									fg={i !== activeIndex ? UI_COLORS.muted : UI_COLORS.accent}
								>
									<strong>{`${palette.name} (${i + 1})`}</strong>
								</text>
							</box>

							<text fg={UI_COLORS.muted}>{hasLeft ? "‹ " : "  "}</text>

							<box flexDirection="row">
								{visibleColors.map((color) => (
									<box key={color.shade} flexDirection="column" marginRight={1}>
										{Array(SWATCH_BLOCK_HEIGHT)
											.fill(null)
											.map((_, rowIdx) => (
												<text
													// biome-ignore lint/suspicious/noArrayIndexKey: Array size is static and never reorders
													key={rowIdx}
													bg={color.hex}
													fg={color.hsl[2] > 55 ? "black" : "white"}
												>
													{SWATCH_BLOCK}
												</text>
											))}
										<text
											attributes={
												isCmykSafeOn && !color.isCmykSafe
													? undefined
													: TextAttributes.DIM
											}
											fg={isCmykSafeOn && !color.isCmykSafe ? "red" : undefined}
										>
											{" "}
											{color.shade}
										</text>
									</box>
								))}
							</box>

							<text fg={UI_COLORS.muted}>{hasRight ? " ›" : ""}</text>
						</box>
					);
				})}
			</box>
		</box>
	);
}
