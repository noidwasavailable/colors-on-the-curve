import { mkdir } from "node:fs/promises";
import { join } from "path";
import type { PaletteResult, FigmaTokenGroup, Hexcode } from "./types";

const CONNECTION_CHARACTER = "/"

export function exportFigmaTokens(palettes: PaletteResult | PaletteResult[]): FigmaTokenGroup {
  const arr = Array.isArray(palettes) ? palettes : [palettes];
  const result: FigmaTokenGroup = {};

  for (const palette of arr) {
    // Figma usually likes single words or kebab-case for tokens.
    // Use the palette name as the base prefix.
    const paletteName = palette.name.toLowerCase().replace(/\s+/g, CONNECTION_CHARACTER);
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

export function setTokensAlpha(obj: any, alpha: number): any {
  if (Array.isArray(obj)) {
    return obj.map(item => setTokensAlpha(item, alpha));
  }
  if (obj !== null && typeof obj === 'object') {
    if (obj.$type === 'color' && obj.$value) {
      return {
        ...obj,
        $value: {
          ...obj.$value,
          alpha: alpha
        }
      };
    }
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = setTokensAlpha(value, alpha);
    }
    return result;
  }
  return obj;
}

export async function generateTransparencyTokens(tokens: FigmaTokenGroup, outDir: string) {
  await mkdir(outDir, { recursive: true });

  for (let percent = 0; percent <= 100; percent += 10) {
    let alpha: number;
    if (percent === 0 || percent === 100) {
      alpha = 1; // 0 is same as 100 (no transparency)
    } else {
      alpha = Math.round((percent / 100) * 10) / 10;
    }

    const modifiedTokens = setTokensAlpha(tokens, alpha);
    const outFile = join(outDir, `${percent}.tokens.json`);

    await Bun.write(outFile, JSON.stringify(modifiedTokens, null, 2));
  }
}