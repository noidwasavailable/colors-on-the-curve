import { resolve, basename, extname, join } from 'path';
import { generatePalette } from './generator.js';
import type { PaletteConfig } from './types.js';
import { mkdir, writeFile } from 'fs/promises';

async function main() {
  const args = process.argv.slice(2);
  const configPath = args.find(a => !a.startsWith('--'));
  const outDirArg = args.find(a => a.startsWith('--out-dir='));
  
  const outDir = outDirArg?.split('=')[1] || 'data';

  if (!configPath) {
    console.error('Usage: bun run src/cli.ts <path-to-config.ts> [--out-dir=path/to/dir]');
    process.exit(1);
  }

  const fullPath = resolve(process.cwd(), configPath);
  
  try {
    const configModule = await import(fullPath);
    const configs: PaletteConfig | PaletteConfig[] = configModule.default || configModule.config;

    if (!configs) {
      console.error('Config file must export a default object/array or a named export "config".');
      process.exit(1);
    }

    const configArray = Array.isArray(configs) ? configs : [configs];
    const results = configArray.map(generatePalette);

    const outFilename = basename(configPath!, extname(configPath!)) + '.json';
    const outDirPath = resolve(process.cwd(), outDir);
    await mkdir(outDirPath, { recursive: true });
    
    const outFilePath = join(outDirPath, outFilename);
    const outputData = Array.isArray(configs) ? results : results[0];

    await writeFile(outFilePath, JSON.stringify(outputData, null, 2), 'utf-8');
    console.log(`Successfully generated and saved palette to: ${outFilePath}`);
  } catch (err) {
    console.error('Failed to generate palette:', err);
    process.exit(1);
  }
}

main();
