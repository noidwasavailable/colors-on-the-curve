import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { ConfigInput, PaletteConfig, PalettesConfig } from "../types";

interface EditorProps {
  config: any;
  mode: "SINGLE" | "ARRAY" | "SPECTRUM";
  onChange: (updater: (prev: any) => any) => void;
}

export function Editor({ config, mode, onChange }: EditorProps) {
  const isSpectrum = mode === "SPECTRUM";

  const properties = isSpectrum
    ? [
        {
          label: "Hues Count",
          val: config.hues?.count ?? 1,
          step: 1,
          min: 1,
          max: 20,
          path: ["hues", "count"],
        },
        {
          label: "Hues Start",
          val: config.hues?.start ?? 0,
          step: 1,
          min: 0,
          max: 360,
          path: ["hues", "start"],
        },
        {
          label: "Hues End",
          val: config.hues?.end ?? 360,
          step: 1,
          min: 0,
          max: 360,
          path: ["hues", "end"],
        },
      ]
    : [
        {
          label: "Base Hue",
          val: config.baseHue ?? 0,
          step: 1,
          min: 0,
          max: 360,
          path: ["baseHue"],
        },
      ];

  const commonProperties = [
    {
      label: "Hue Shift",
      val: config.hueShift ?? 0,
      step: 1,
      min: -360,
      max: 360,
      path: ["hueShift"],
    },
    {
      label: "Sat Peak",
      val: config.saturation?.peak ?? 100,
      step: 1,
      min: 0,
      max: 100,
      path: ["saturation", "peak"],
    },
    {
      label: "Sat Min Dark",
      val: config.saturation?.minDark ?? 30,
      step: 1,
      min: 0,
      max: 100,
      path: ["saturation", "minDark"],
    },
    {
      label: "Sat Min Light",
      val: config.saturation?.minLight ?? 15,
      step: 1,
      min: 0,
      max: 100,
      path: ["saturation", "minLight"],
    },
    {
      label: "Light Start",
      val: config.lightness?.start ?? 95,
      step: 1,
      min: 0,
      max: 100,
      path: ["lightness", "start"],
    },
    {
      label: "Light End",
      val: config.lightness?.end ?? 10,
      step: 1,
      min: 0,
      max: 100,
      path: ["lightness", "end"],
    },
  ];

  const allProps = [...properties, ...commonProperties];

  const [activePropIndex, setActivePropIndex] = useState(0);

  useInput((input, key) => {
    // Only capture up/down and left/right. Everything else handled by app.
    if (key.upArrow) {
      setActivePropIndex(Math.max(0, activePropIndex - 1));
    } else if (key.downArrow) {
      setActivePropIndex(Math.min(allProps.length - 1, activePropIndex + 1));
    } else if (key.leftArrow || key.rightArrow) {
      const prop = allProps[activePropIndex];
      if (!prop) return;

      const sign = key.rightArrow ? 1 : -1;
      const amount = key.shift ? prop.step * 10 : prop.step;
      const newVal = Math.min(
        prop.max,
        Math.max(prop.min, prop.val + sign * amount),
      );

      if (newVal !== prop.val) {
        onChange((prev) => {
          const next = { ...prev };
          const [firstKey, secondKey] = prop.path;
          if (!firstKey) return next;

          if (secondKey === undefined) {
            next[firstKey] = newVal;
          } else {
            next[firstKey] = { ...(next[firstKey] ?? {}), [secondKey]: newVal };
          }

          return next;
        });
      }
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold underline>
          Editor Controls
        </Text>
      </Box>
      {allProps.map((p, i) => (
        <Box key={p.label}>
          <Text color={i === activePropIndex ? "green" : undefined}>
            {i === activePropIndex ? "> " : "  "}
            {p.label.padEnd(15, " ")}: {p.val.toString().padStart(4, " ")}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
