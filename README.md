# Mathematical Color Palette Generator

A robust utility for calculating visually smooth and mathematically precise UI color palettes based on HSL curves, with built-in CMYK gamut safety parsing.

## Features

- **Mathematical Curve Interpolation:** Use `linear`, `easeIn`, `easeOut`, `easeInOut`, or `parabolic` curves to transition saturation and lightness over shade indices.
- **Parametric Saturation:** Support for granular saturation points (peak, minLight, minDark) mapped seamlessly.
- **Gamut Safety:** Programmatically enforces CMYK maximum limits out of the box. Automatically desaturates off-gamut colors to ensure print and digital safety.
- **Export Formats:** Generate palettes and optionally export Figma Design Tokens seamlessly.

## Installation

This project is built using [Bun](https://bun.sh/).

```bash
bun install
```

## Usage: Web Application

The project includes an interactive web application for generating, previewing, and exporting palettes visually.

```bash
bun run dev-web
```
This will start a local server at `http://localhost:3000` where you can interactively build colors, check contrast, and manage palette arrays. 

## Usage: CLI Application

You can also run the generator entirely within your terminal using the interactive Ink-based CLI.

```bash
bun run cli [configPath] [options]
```

### CLI Options

- `configPath`: Path to a `.ts` or `.json` config file to load. If omitted, uses an interactive default.
- `--out-dir=<dir>`: Directory to save generated JSON palettes (default: "data")
- `--tokens`: Export Figma tokens alongside palettes
- `-h, --help`: Show the CLI help menu

**Interactive Controls**:
When running the CLI, you have access to real-time adjustments via your keyboard:
- **Navigation:** `↑/↓` to select properties, `←/→` to adjust values
- **Palettes Mode:** `+` to add new, `-` to remove, `1-9` to immediately jump to a specific palette
- **Renaming:** `r` to type a new palette name with a visual color preview
- **Switch Modes:** `m` toggles between Array generation and full Spectrum generation
- **Globally:** `s` to write structured JSON outputs and exit

## Usage: Core Library

To use the generator programmatically in your own code, import the underlying typescript library functions.

```ts
import { generatePalette } from './src/lib/generator';
import type { PaletteConfig } from './src/lib/types';

const config: PaletteConfig = {
  name: "Ocean Blue",
  baseHue: 210,
  hueShift: -15,
  saturation: { peak: 100, minDark: 40, minLight: 20, curve: 'parabolic' },
  lightness: { start: 96, end: 12, curve: 'easeOut' },
  shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  cmykSafe: true
};

const result = generatePalette(config);
console.log(result.colors);
```

## Running Tests

Validations and boundary limits are comprehensively tested using Bun's native testing module.

```bash
bun test
```
