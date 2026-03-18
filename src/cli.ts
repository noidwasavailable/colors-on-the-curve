import { resolve, basename, extname, join } from 'path';
import { generatePalette, expandPalettesConfig } from './generator.js';
import type { PaletteConfig, ConfigInput, PalettesConfig } from './types.js';
import { exportFigmaTokens } from './figmaExporter.js';
import { mkdir, writeFile } from 'fs/promises';

async function main() {
  const args = process.argv.slice(2);
  const configPath = args.find(a => !a.startsWith('--'));
  const outDirArg = args.find(a => a.startsWith('--out-dir='));
  const exportTokens = args.includes('--tokens');
  
  const outDir = outDirArg?.split('=')[1] || 'data';

  if (!configPath) {
    console.error('Usage: bun run src/cli.ts <path-to-config.ts> [--out-dir=path/to/dir] [--tokens]');
    process.exit(1);
  }

  const fullPath = resolve(process.cwd(), configPath);
  
  try {
    const configModule = await import(fullPath);
    const configs: ConfigInput = configModule.default || configModule.config;

    if (!configs) {
      console.error('Config file must export a default object/array or a named export "config".');
      process.exit(1);
    }

    let configArray: PaletteConfig[] = [];
    if (Array.isArray(configs)) {
      configArray = configs.flatMap(c => 
        ('hues' in c && c.hues && typeof c.hues === 'object') 
          ? expandPalettesConfig(c as PalettesConfig) 
          : c as PaletteConfig
      );
    } else if ('hues' in configs && configs.hues && typeof configs.hues === 'object') {
      configArray = expandPalettesConfig(configs as PalettesConfig);
    } else {
      configArray = [configs as PaletteConfig];
    }
    
    const results = configArray.map(generatePalette);

    const baseName = basename(configPath!, extname(configPath!));
    const outDirPath = resolve(process.cwd(), outDir);
    await mkdir(outDirPath, { recursive: true });
    
    const outFilename = baseName + '.json';
    const outFilePath = join(outDirPath, outFilename);
    const outputData = Array.isArray(configs) ? results : results[0];

    await writeFile(outFilePath, JSON.stringify(outputData, null, 2), 'utf-8');
    console.log(`Successfully generated and saved palette to: ${outFilePath}`);

    if (exportTokens) {
      const tokensFilename = baseName + '.tokens.json';
      const tokensFilePath = join(outDirPath, tokensFilename);
      const tokensData = exportFigmaTokens(results);
      await writeFile(tokensFilePath, JSON.stringify(tokensData, null, 2), 'utf-8');
      console.log(`Successfully generated and saved Figma tokens to: ${tokensFilePath}`);
    }

  } catch (err) {
    console.error('Failed to generate palette:', err);
    process.exit(1);
  }
}

main();
