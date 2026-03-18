import { resolve } from 'path';
import { generatePalette } from './generator.js';
import type { PaletteConfig } from './types.js';

async function main() {
  const args = process.argv.slice(2);
  const configPath = args[0];

  if (!configPath) {
    console.error('Usage: bun run src/cli.ts <path-to-config.ts>');
    process.exit(1);
  }

  const fullPath = resolve(process.cwd(), configPath);
  
  try {
    const configModule = await import(fullPath);
    const config: PaletteConfig = configModule.default || configModule.config;

    if (!config) {
      console.error('Config file must export a default object or a named export "config".');
      process.exit(1);
    }

    const result = generatePalette(config);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Failed to generate palette:', err);
    process.exit(1);
  }
}

main();
