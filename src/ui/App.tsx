import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import type { ConfigInput, PaletteConfig, PalettesConfig } from "../types";
import { defaultPaletteConfig, defaultPalettesConfig } from "../defaults";
import { Editor } from "./Editor";
import { PalettePreview } from "./PalettePreview";
import { generatePalette, expandPalettesConfig } from "../generator";
import { exportFigmaTokens } from "../figmaExporter";

type Mode = "SINGLE" | "ARRAY" | "SPECTRUM";

interface AppProps {
  initialConfig: ConfigInput;
  onSave: (data: any, tokens?: any) => Promise<any>;
  exportTokens: boolean;
}

export function App({ initialConfig, onSave, exportTokens }: AppProps) {
  const { exit } = useApp();
  const [config, setConfig] = useState<ConfigInput>(initialConfig);
  const [mode, setMode] = useState<Mode>("SINGLE");
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState<string>("Editing");

  useEffect(() => {
    if (Array.isArray(initialConfig)) {
      setMode("ARRAY");
      setConfig(
        initialConfig.length ? initialConfig : [{ ...defaultPaletteConfig }],
      );
    } else if (
      "hues" in initialConfig &&
      initialConfig.hues &&
      typeof initialConfig.hues === "object"
    ) {
      setMode("SPECTRUM");
      setConfig({ ...defaultPalettesConfig, ...initialConfig });
    } else {
      setMode("SINGLE");
      setConfig({
        ...defaultPaletteConfig,
        ...(initialConfig as PaletteConfig),
      });
    }
  }, []);

  useInput((input, key) => {
    if (status !== "Editing") return;
    if (input === "q") {
      exit();
      return;
    }
    if (input === "s") {
      saveAndExit();
      return;
    }

    if (input === "a" || input === "+") {
      if (mode === "SINGLE") {
        const singleConfig = config as Partial<PaletteConfig>;
        const current: PaletteConfig = {
          ...defaultPaletteConfig,
          name: singleConfig.name,
          baseHue: singleConfig.baseHue ?? defaultPaletteConfig.baseHue,
          hueShift: singleConfig.hueShift ?? defaultPaletteConfig.hueShift,
          hueCurve: singleConfig.hueCurve ?? defaultPaletteConfig.hueCurve,
          saturation:
            singleConfig.saturation ?? defaultPaletteConfig.saturation,
          lightness: singleConfig.lightness ?? defaultPaletteConfig.lightness,
          shades: singleConfig.shades ?? defaultPaletteConfig.shades,
          cmykSafe: singleConfig.cmykSafe ?? defaultPaletteConfig.cmykSafe,
        };
        setConfig([current, { ...current }]);
        setMode("ARRAY");
        setActiveIndex(1);
      } else if (mode === "ARRAY") {
        const arr = [...(config as PaletteConfig[])];
        const activePalette = arr[activeIndex] ?? { ...defaultPaletteConfig };
        arr.push({ ...activePalette });
        setConfig(arr);
        setActiveIndex(arr.length - 1);
      }
    }

    if (input === "m") {
      if (mode === "SINGLE") {
        const current = config as PaletteConfig;
        setConfig({
          ...defaultPalettesConfig,
          hues: {
            start: current.baseHue,
            end: (current.baseHue + 60) % 360,
            count: 3,
            curve: "linear",
          },
          saturation: current.saturation,
          lightness: current.lightness,
          shades: current.shades,
          cmykSafe: current.cmykSafe,
        });
        setMode("SPECTRUM");
      }
    }

    if (mode === "ARRAY") {
      if (input === "[" || input === "{") {
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (input === "]" || input === "}") {
        setActiveIndex((i) =>
          Math.min((config as PaletteConfig[]).length - 1, i + 1),
        );
      } else if (key.delete || key.backspace) {
        const arr = [...(config as PaletteConfig[])];
        if (arr.length > 1) {
          arr.splice(activeIndex, 1);
          setConfig(arr);
          setActiveIndex(Math.min(activeIndex, arr.length - 1));
        } else {
          setConfig(arr[0] ?? { ...defaultPaletteConfig });
          setMode("SINGLE");
          setActiveIndex(0);
        }
      }
    }

    if (mode === "SPECTRUM") {
      const spec = config as PalettesConfig;
      if (spec.hues.count <= 1 && input === "u") {
        setConfig({
          ...defaultPaletteConfig,
          baseHue: spec.hues.start,
          saturation: spec.saturation,
          lightness: spec.lightness,
          shades: spec.shades,
          cmykSafe: spec.cmykSafe,
        });
        setMode("SINGLE");
      }
    }
  });

  const saveAndExit = async () => {
    setStatus("Saving...");
    try {
      let configArray: PaletteConfig[] = [];
      if (mode === "ARRAY") {
        configArray = config as PaletteConfig[];
      } else if (mode === "SPECTRUM") {
        configArray = expandPalettesConfig(config as PalettesConfig);
      } else {
        configArray = [config as PaletteConfig];
      }

      const results = configArray.map(generatePalette);
      const outputData = mode === "SINGLE" ? results[0] : results;
      const tokensData = exportTokens ? exportFigmaTokens(results) : undefined;

      const res = await onSave(outputData, tokensData);
      setStatus(`Saved to: ${res.outFilePath}`);
      if (res.tokensSaved)
        console.log(`Saved tokens to: ${res.tokensFilePath}`);
      setTimeout(exit, 500);
    } catch (e) {
      console.error(e);
      exit(e as Error);
    }
  };

  if (status !== "Editing") {
    return (
      <Box padding={1}>
        <Text color="green">{status}</Text>
      </Box>
    );
  }

  const activeConfig =
    mode === "ARRAY" ? (config as PaletteConfig[])[activeIndex] : config;

  const onUpdateConfig = (updater: (prev: any) => any) => {
    setConfig((prev) => {
      if (mode === "ARRAY") {
        const arr = [...(prev as PaletteConfig[])];
        arr[activeIndex] = updater(arr[activeIndex] || defaultPaletteConfig);
        return arr;
      }
      return updater(prev);
    });
  };

  return (
    <Box flexDirection="column" paddingX={1} paddingTop={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">
          🎨 Interactive Generative Palette CLI
        </Text>
        <Text color="gray">
          Mode:{" "}
          <Text bold color="yellow">
            {mode}
          </Text>
        </Text>
      </Box>

      <Box flexDirection="row">
        <Box
          width={40}
          marginRight={2}
          borderStyle="single"
          borderColor="gray"
          flexDirection="column"
        >
          <Editor
            config={activeConfig || defaultPaletteConfig}
            mode={mode}
            onChange={onUpdateConfig}
          />
        </Box>
        <Box
          flexGrow={1}
          borderStyle="single"
          borderColor="gray"
          flexDirection="column"
          paddingX={1}
          paddingY={1}
        >
          <PalettePreview
            config={config || defaultPaletteConfig}
            mode={mode}
            activeIndex={activeIndex}
          />
        </Box>
      </Box>

      <Box
        marginTop={1}
        flexDirection="row"
        justifyContent="flex-start"
        gap={2}
      >
        <Box flexDirection="column">
          <Text color="gray">
            {mode === "SINGLE" && (
              <>
                <Text bold>+ </Text>Add Palette Mode <Text bold>m </Text>
                Multi-Hue Mode{" "}
              </>
            )}
            {mode === "ARRAY" && (
              <>
                <Text bold>[ ] </Text>Paginate <Text bold>Del </Text>Remove{" "}
                <Text bold>+ </Text>Add{" "}
              </>
            )}
            {mode === "SPECTRUM" && (
              <>
                <Text bold>u </Text>Unbox to Single(if count=1){" "}
              </>
            )}
          </Text>
          <Text color="gray">
            <Text bold>Up/Down </Text>Select Prop <Text bold>Left/Right </Text>
            Change Value
          </Text>
        </Box>

        <Box flexDirection="column" alignItems="flex-end" flexGrow={1}>
          <Text color="green" bold>
            [S] Save & Exit
          </Text>
          <Text color="red" bold>
            [Q] Quit
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
