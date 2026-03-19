import type { PaletteResult } from "./types";

const CONNECTION_CHARACTER = "/"

export function exportFigmaTokens(palettes: PaletteResult | PaletteResult[]) {
  const arr = Array.isArray(palettes) ? palettes : [palettes];
  const result: any = {};

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
          hex: color.hex.toUpperCase(),
        },
        $extensions: {
          "com.figma.scopes": ["ALL_SCOPES"],
          "com.figma.isOverride": true,
        },
      };
    }
  }

  result["$extensions"] = {
    "com.figma.modeName": "Mode 1",
  };

  return result;
}
