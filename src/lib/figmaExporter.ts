import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { FigmaTokenGroup, Hexcode, PaletteResult } from "./types";

const CONNECTION_CHARACTER = "/";

export function exportFigmaTokens(
	palettes: PaletteResult | PaletteResult[],
): FigmaTokenGroup {
	const arr = Array.isArray(palettes) ? palettes : [palettes];
	const result: FigmaTokenGroup = {};

	for (const palette of arr) {
		// Kebab-case the name (spaces → hyphens) then use "/" as the
		// hierarchical separator between the name and the shade number.
		const paletteName = palette.name.toLowerCase().replace(/\s+/g, "-");
		for (const color of palette.colors) {
			const tokenName = `${paletteName}${CONNECTION_CHARACTER}${color.shade}`;
			result[tokenName] = {
				$type: "color",
				$value: {
					colorSpace: "srgb",
					components: [
						color.rgb[0] / 255,
						color.rgb[1] / 255,
						color.rgb[2] / 255,
					],
					alpha: 1,
					hex: color.hex.toUpperCase() as Hexcode,
				},
				$extensions: {
					"com.figma.scopes": ["ALL_SCOPES"],
					"com.figma.isOverride": true,
				},
			};
		}
	}

	result["com.figma.modeName"] = "Mode 1";

	return result;
}

export function setTokensAlpha(obj: unknown, alpha: number): unknown {
	if (Array.isArray(obj)) {
		return obj.map((item) => setTokensAlpha(item, alpha));
	}
	if (obj !== null && typeof obj === "object") {
		const record = obj as Record<string, unknown>;
		if (record.$type === "color" && record.$value) {
			return {
				...record,
				$value: {
					...(record.$value as Record<string, unknown>),
					alpha: alpha,
				},
			};
		}
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(record)) {
			result[key] = setTokensAlpha(value, alpha);
		}
		return result;
	}
	return obj;
}

/**
 * Returns the list of per-opacity token payloads (10 % – 100 %) without
 * touching the file system.
 */
export function buildTransparencyTokensList(
	tokens: FigmaTokenGroup,
): { filename: string; tokens: unknown }[] {
	const entries: { filename: string; tokens: unknown }[] = [];

	for (let percent = 10; percent <= 100; percent += 10) {
		const alpha = Math.round((percent / 100) * 10) / 10;
		entries.push({
			filename: `${percent}.tokens.json`,
			tokens: setTokensAlpha(tokens, alpha),
		});
	}

	return entries;
}

export async function generateTransparencyTokens(
	tokens: FigmaTokenGroup,
	outDir: string,
) {
	await mkdir(outDir, { recursive: true });

	for (const {
		filename,
		tokens: modifiedTokens,
	} of buildTransparencyTokensList(tokens)) {
		const outFile = join(outDir, filename);
		await Bun.write(outFile, JSON.stringify(modifiedTokens, null, 2));
	}
}
