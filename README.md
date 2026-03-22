# Colors on the Curve
### Mathematically Precise Color Palettes

A robust utility for calculating visually smooth and mathematically precise UI color palettes based on HSL curves, with built-in CMYK gamut safety and Figma token export.

## Features

- **Mathematical Curve Interpolation:** Use `linear`, `easeIn`, `easeOut`, `easeInOut`, or `parabolic` curves for saturation, lightness, and hue shift.
- **Parametric Saturation:** Granular saturation control via peak, minLight, and minDark anchor points.
- **Gamut Safety:** Automatically desaturates off-gamut colors to stay within standard CMYK TAC limits (≤ 300%).
- **Export Formats:** JSON palettes, Figma Design Tokens (DTCG), and per-opacity transparency token files.
- **Three Interfaces:** Interactive web app, interactive CLI, and a headless TypeScript/JS library.

---

## 🌐 Web Application

The web app provides a fully interactive, visual palette builder with real-time previews and one-click export.

### Running locally

This project uses [Bun](https://bun.sh/).

```bash
bun install
bun run dev-web
```

Open `http://localhost:3000` to get started.

### What you can do

- Build and rename unlimited palettes in Array or Spectrum generation modes.
- Adjust hue, saturation, lightness, hue shift, and shades with `+/−` steppers.
- Preview all shades with their hex, HSL, CMYK values and WCAG contrast ratios.
- **Export** as structured JSON, Figma Design Tokens, or a ZIP including per-opacity transparency token files.
- **Import** a previously exported JSON file to resume your session.

---

## 🖥️ CLI Application

The CLI offers the same generation engine in a fully interactive terminal UI powered by Ink/React.

### Running

```bash
bun run cli [configPath] [options]
```

| Argument / Option | Description |
|---|---|
| `configPath` | Path to a `.ts` or `.json` config file. If omitted, starts with defaults. |
| `--out-dir=<dir>` | Directory to write output files (default: current working directory) |
| `--tokens` | Export Figma Design Tokens alongside the palette JSON |
| `--transparency-tokens` | Export per-opacity transparency token files (10 %–100 %). Requires `--tokens`. |
| `-h, --help` | Print the help message and exit |

### Interactive keyboard controls

**PALETTES mode**

| Key | Action |
|---|---|
| `↑ / ↓` | Move between editable properties |
| `← / →` | Change value (hold `Shift` for ×10 steps) |
| `r` | Rename the current palette |
| `m` | Switch to SPECTRUM mode |
| `+` | Add a new palette (auto-shifts hue) |
| `-` | Remove the current palette |
| `1 – 9` | Jump directly to a palette by index |
| `[ / ]` | Paginate through palettes |

**Global**

| Key | Action |
|---|---|
| `s` | Save all palettes to JSON and exit |
| `q` | Quit without saving |
| `h` | Show the help screen |
| `t` | Toggle Figma token export on save |
| `p` | Toggle transparency token export on save (requires tokens on) |

---

## 📦 Library (npm)

`colors-on-the-curve` is published as a standalone ESM package. Install it in your own project:

```bash
npm install colors-on-the-curve
# or
bun add colors-on-the-curve
```

### Quick start

```ts
import { generatePalette, expandPalettesConfig } from 'colors-on-the-curve';
import type { PaletteConfig, PalettesConfig } from 'colors-on-the-curve';

// Single palette
const config: PaletteConfig = {
  name: 'Ocean Blue',
  baseHue: 210,
  hueShift: -15,
  hueCurve: 'easeOut',
  saturation: { peak: 100, minDark: 40, minLight: 20, curve: 'parabolic' },
  lightness: { start: 96, end: 12, curve: 'easeOut' },
  shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  cmykSafe: true,
};

const result = generatePalette(config);
console.log(result.colors); // ColorResult[]
```

### Spectrum / multi-palette generation

```ts
// Generate a range of palettes spread across the hue wheel
const palettesConfig: PalettesConfig = {
  namePrefix: 'Brand',
  hues: { start: 0, end: 300, count: 6, curve: 'easeInOut' },
  hueShift: -10,
  saturation: { peak: 90, minDark: 30, minLight: 10, curve: 'parabolic' },
  lightness: { start: 95, end: 10, curve: 'easeOut' },
  shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  cmykSafe: true,
};

const palettes = expandPalettesConfig(palettesConfig); // PaletteConfig[]
const results = palettes.map(generatePalette);          // PaletteResult[]
```

### Exporting tokens

```ts
import { exportFigmaTokens, generateTransparencyTokens } from 'colors-on-the-curve';

// Figma Design Tokens (DTCG format)
const tokens = exportFigmaTokens(results);

// Transparency tokens (returns one token group per opacity step)
const transparencyTokens = generateTransparencyTokens(results);
```

### Exported API surface

| Export | Kind | Description |
|---|---|---|
| `generatePalette` | function | Generate a single `PaletteResult` from a `PaletteConfig` |
| `expandPalettesConfig` | function | Expand a `PalettesConfig` into an array of `PaletteConfig` |
| `exportFigmaTokens` | function | Build a DTCG-compatible Figma token tree |
| `generateTransparencyTokens` | function | Generate per-opacity transparency token groups |
| `buildTransparencyTokensList` | function | List individual transparency token entries |
| `setTokensAlpha` | function | Apply a custom alpha to a token group |
| `applyCurve` | function | Apply a named curve to a value |
| `hslToRgb`, `rgbToHex`, `rgbToHsl`, `rgbToCmyk`, `makeCmykSafe` | functions | Color math utilities |
| `defaultPaletteConfig`, `defaultPalettesConfig`, `defaultShades`, … | constants | Sensible defaults for configs |
| `PaletteConfig`, `PalettesConfig`, `PaletteResult`, `ColorResult`, `CurveConfig`, `SaturationConfig`, `CurveType`, `ConfigInput`, `FigmaToken`, `FigmaTokenGroup`, `Hexcode` | types | Full TypeScript type definitions |

---

## 🧪 Tests

Unit and boundary tests are written with Bun's native test runner.

```bash
bun test
```

---

## Building

| Script | Description |
|---|---|
| `bun run build-lib` | Compile the library to `dist/lib/` |
| `bun run build-web` | Bundle the web app to `dist/web/` |
| `bun run build-cli` | Compile a standalone CLI binary to `dist/cli/` |
