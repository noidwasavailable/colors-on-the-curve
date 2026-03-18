import React from 'react';
import { Box, Text } from 'ink';
import { generatePalette, expandPalettesConfig } from '../generator.js';
import type { ConfigInput, PaletteConfig, PalettesConfig, PaletteResult } from '../types.js';

interface PalettePreviewProps {
  config: ConfigInput;
  mode: 'SINGLE' | 'ARRAY' | 'SPECTRUM';
  activeIndex: number;
}

export function PalettePreview({ config, mode, activeIndex }: PalettePreviewProps) {
  let palettes: PaletteResult[] = [];
  try {
    if (mode === 'SINGLE') {
      palettes = [generatePalette(config as PaletteConfig)];
    } else if (mode === 'ARRAY') {
      const arr = config as PaletteConfig[];
      if (arr[activeIndex]) {
        palettes = [generatePalette(arr[activeIndex] as PaletteConfig)];
      }
    } else if (mode === 'SPECTRUM') {
      const expanded = expandPalettesConfig(config as PalettesConfig);
      palettes = expanded.map(generatePalette);
    }
  } catch (e) {
    return <Text color="red">Error generating palettes: {(e as Error).message}</Text>;
  }

  if (!palettes.length) return <Text color="red">No palettes generated.</Text>;

  return (
    <Box flexDirection="column" gap={1}>
      {palettes.map((palette, i) => (
        <React.Fragment key={palette.name || i}>
          <Text bold color="cyan">{palette.name} {mode === 'ARRAY' ? `(Palette ${activeIndex + 1})` : ''}</Text>
          <Box flexDirection="row" flexWrap="wrap">
            {palette.colors.map(color => (
              <Box key={color.shade} flexDirection="column" alignItems="center" marginRight={1} marginBottom={1}>
                {/* Visual Swatch */}
                <Text backgroundColor={color.hex} color={color.hsl[2] > 50 ? 'black' : 'white'}>
                  {` Aa `}
                </Text>
                <Text dimColor>{color.shade}</Text>
                <Text dimColor>{color.hex}</Text>
              </Box>
            ))}
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
}
