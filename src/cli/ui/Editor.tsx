import React, { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  EDITOR_PROPERTIES,
  UI_TEXT,
  type EditorPropertyMeta,
  type PropertyPath,
  type UiMode,
} from "@/lib/constants";

interface EditorProps {
  config: any;
  mode: UiMode;
  onChange: (updater: (prev: any) => any) => void;
  outOfGamutCount?: number;
}

function getPathValue(obj: any, path: PropertyPath): any {
  const [firstKey, secondKey] = path;
  if (secondKey === undefined) return obj?.[firstKey];
  return obj?.[firstKey]?.[secondKey];
}

function setPathValue(obj: any, path: PropertyPath, value: any): any {
  const [firstKey, secondKey] = path;
  const next = { ...obj };

  if (secondKey === undefined) {
    next[firstKey] = value;
    return next;
  }

  next[firstKey] = { ...(next[firstKey] ?? {}), [secondKey]: value };
  return next;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function Editor({ config, mode, onChange, outOfGamutCount }: EditorProps) {
  const [activePropIndex, setActivePropIndex] = useState(0);

  const allProps = useMemo<readonly EditorPropertyMeta[]>(() => {
    const modeSpecific =
      mode === "SPECTRUM"
        ? EDITOR_PROPERTIES.spectrumOnly
        : EDITOR_PROPERTIES.singleOnly;

    return [...modeSpecific, ...EDITOR_PROPERTIES.common];
  }, [mode]);

  const safeActiveIndex = clamp(
    activePropIndex,
    0,
    Math.max(0, allProps.length - 1),
  );
  const activeProp = allProps[safeActiveIndex];

  useInput((input, key) => {
    if (key.upArrow) {
      setActivePropIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      setActivePropIndex((prev) => Math.min(allProps.length - 1, prev + 1));
      return;
    }

    const prop = allProps[activePropIndex];
    if (!prop) return;

    const isAdjustKey = key.leftArrow || key.rightArrow;
    const isToggleKey = input === " " || key.return;
    if (!isAdjustKey && !isToggleKey) return;

    const direction = key.rightArrow ? 1 : key.leftArrow ? -1 : 0;

    if (prop.kind === "number") {
      if (!isAdjustKey) return;

      const currentRaw = getPathValue(config, prop.path);
      const current = typeof currentRaw === "number" ? currentRaw : prop.min;
      const delta = (key.shift ? prop.step * 10 : prop.step) * direction;
      const nextValue = clamp(current + delta, prop.min, prop.max);
      if (nextValue === current) return;

      onChange((prev) => setPathValue(prev, prop.path, nextValue));
      return;
    }

    if (prop.kind === "toggle") {
      const currentRaw = getPathValue(config, prop.path);
      const current = Boolean(currentRaw);
      onChange((prev) => setPathValue(prev, prop.path, !current));
      return;
    }

    if (prop.kind === "select") {
      if (!isAdjustKey) return;

      const currentRaw = getPathValue(config, prop.path);
      const currentIndex = prop.options.findIndex(
        (opt) => opt.value === currentRaw,
      );
      const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = clamp(
        fallbackIndex + direction,
        0,
        prop.options.length - 1,
      );
      const nextOption = prop.options[nextIndex];
      if (!nextOption) return;

      onChange((prev) => setPathValue(prev, prop.path, nextOption.value));
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold underline>
          {UI_TEXT.editorTitle}
        </Text>
      </Box>

      {allProps.map((prop, index) => {
        const isActive = index === safeActiveIndex;
        const rawValue = getPathValue(config, prop.path);

        let renderedValue = "";
        if (prop.kind === "number") {
          const numberValue =
            typeof rawValue === "number" ? rawValue : prop.min;
          renderedValue = numberValue.toString();
        } else if (prop.kind === "toggle") {
          const enabled = Boolean(rawValue);
          renderedValue = enabled
            ? (prop.onLabel ?? "ON")
            : (prop.offLabel ?? "OFF");
        } else {
          const selected = prop.options.find((o) => o.value === rawValue);
          renderedValue = selected?.label ?? prop.options[0]?.label ?? "";
        }

        return (
          <Box key={prop.id}>
            <Text color={isActive ? "green" : undefined}>
              {isActive ? "> " : "  "}
              {prop.label.padEnd(15, " ")}: {renderedValue}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={1} flexDirection="column">
        <Text color="yellow">{activeProp?.description ?? ""}</Text>
        {activeProp?.id === "cmykSafe" && config.cmykSafe && outOfGamutCount !== undefined && outOfGamutCount > 0 && (
          <Text color="red">{outOfGamutCount} colors out of gamut</Text>
        )}
      </Box>
    </Box>
  );
}
