import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type {
	ConfigInput,
	PaletteConfig,
	PalettesConfig,
	PaletteResult,
} from "@/lib/types";
import { PREVIEW_UI, UI_TEXT, type UiMode } from "@/lib/constants";

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
		if (mode === "ARRAY") {
			const arr = config as PaletteConfig[];
			return arr[activeIndex]?.cmykSafe ?? false;
		}
		return (config as any).cmykSafe ?? false;
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

	useInput((input) => {
		if (input === "," || input === "h") {
			setScrollOffset((prev) => Math.max(0, prev - 1));
			return;
		}

		if (input === "." || input === "l") {
			setScrollOffset((prev) => Math.min(maxOffset, prev + 1));
		}
	});

	if (previewError) {
		return (
			<Text color="red">
				{UI_TEXT.generateErrorPrefix} {previewError}
			</Text>
		);
	}

	if (!palettes.length) {
		return <Text color="red">{UI_TEXT.noPalettesGenerated}</Text>;
	}

	const visibleStart = scrollOffset + 1;
	const visibleEnd = Math.min(scrollOffset + VISIBLE_SWATCH_COUNT, maxColors);

	return (
		<Box flexDirection="column">
			{maxOffset > 0 && (
				<Box marginBottom={1} flexDirection="row">
					<Text color="gray">{PREVIEW_UI.horizontalOverflowHint}</Text>
					<Text color="gray">
						{" "}
						Scroll: ,/. ({visibleStart}-{visibleEnd} of {maxColors})
					</Text>
				</Box>
			)}

			<Box flexDirection="column">
				{palettes.map((palette, i) => {
					const visibleColors = palette.colors.slice(
						scrollOffset,
						scrollOffset + VISIBLE_SWATCH_COUNT,
					);
					const hasLeft = scrollOffset > 0;
					const hasRight =
						scrollOffset + VISIBLE_SWATCH_COUNT < palette.colors.length;

					return (
						<Box
							key={`${palette.name}-${i}`}
							flexDirection="row"
							marginBottom={0}
						>
							<Box width={20}>
								<Text bold color="cyan">
									{mode === "ARRAY"
										? `${palette.name} (${activeIndex + 1})`
										: palette.name}
								</Text>
							</Box>

							<Text color="gray">{hasLeft ? "‹ " : "  "}</Text>

							<Box flexDirection="row">
								{visibleColors.map((color) => (
									<Box key={color.shade} flexDirection="column" marginRight={1}>
										{Array(SWATCH_BLOCK_HEIGHT)
											.fill(null)
											.map(() => SWATCH_BLOCK)
											.map((_, i) => (
												<Text
													key={i}
													backgroundColor={color.hex}
													color={color.hsl[2] > 55 ? "black" : "white"}
												>
													{SWATCH_BLOCK}
												</Text>
											))}
										{/*<Text
                      backgroundColor={color.hex}
                      color={color.hsl[2] > 55 ? "black" : "white"}
                    >
                      {SWATCH_BLOCK}
                    </Text>*/}
										<Text
											dimColor={!(isCmykSafeOn && !color.isCmykSafe)}
											color={
												isCmykSafeOn && !color.isCmykSafe ? "red" : undefined
											}
										>
											{" "}
											{color.shade}
										</Text>
									</Box>
								))}
							</Box>

							<Text color="gray">{hasRight ? " ›" : ""}</Text>
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}
