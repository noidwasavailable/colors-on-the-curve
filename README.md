# Mathematical Color Palette Generator

A robust CLI utility for calculating visually smooth and mathematically precise UI color palettes based on HSL curves, with built-in CMYK gamut safety parsing.

## Features

- **Mathematical Curve Interpolation:** Use `linear`, `easeIn`, `easeOut`, `easeInOut`, or `parabolic` curves to transition saturation and lightness over shade indices.
- **Parametric Saturation:** Support for granular saturation points (peak, minLight, minDark) mapped seamlessly.
- **Gamut Safety:** Programmatically enforces 300% Total Area Coverage (TAC) CMYK maximum limits out of the box. Automatically desaturates off-gamut colors to ensure print and digital safety.
- **Native TypeScript Setup:** Define configurations utilizing native TypeScript definitions. 

## Installation

This project is built using [Bun](https://bun.sh/).

```bash
bun install
```

## Usage

1. **Create a Configuration File:**
   See `example.config.ts` for an idea of how to structure your palette configuration. Ensure it exports your configuration using `export default`.

   ```ts
   import type { PaletteConfig } from './src/types';

   const config: PaletteConfig = {
     name: "Ocean Blue",
     baseHue: 210,
     hueShift: -15,
     saturation: { peak: 100, minDark: 40, minLight: 20, curve: 'parabolic' },
     lightness: { start: 96, end: 12, curve: 'easeOut' },
     shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
     cmykSafe: true
   };

   export default config;
   ```

2. **Run the Generator:**

   ```bash
   bun run src/cli.ts example.config.ts
   ```

   This outputs a detailed JSON representation mapping your generated color steps to their `HEX`, `RGB`, `HSL`, and `CMYK` values.

## Running Tests

Validations and boundary limits are comprehensively tested using Bun's native TS test runner.

```bash
bun test
```
