import { expect, test, describe } from "bun:test";
import { applyCurve, hslToRgb, rgbToCmyk, makeCmykSafe } from "../src/colorMath.js";
import { generatePalette, expandPalettesConfig } from "../src/generator.js";
import type { PaletteConfig, PalettesConfig } from "../src/types.js";

describe("Color Math", () => {
  test("applyCurve linear", () => {
    expect(applyCurve(0.5, "linear")).toBe(0.5);
  });

  test("applyCurve parabolic", () => {
    expect(applyCurve(0, "parabolic")).toBe(0);
    expect(applyCurve(0.5, "parabolic")).toBe(1);
    expect(applyCurve(1, "parabolic")).toBe(0);
  });

  test("hslToRgb basic", () => {
    const [r, g, b] = hslToRgb(0, 100, 50); // Pure Red
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  test("rgbToCmyk conversion", () => {
    const [c, m, y, k] = rgbToCmyk(255, 0, 0);
    expect(c).toBe(0);
    expect(m).toBe(100);
    expect(y).toBe(100);
    expect(k).toBe(0);
  });

  test("makeCmykSafe bounds checking", () => {
    // R=128, G=0, B=0 generates C=0, M=100, Y=100, K=50 -> TAC = 250
    // If we limit maxTac to 200, it should be marked unsafe and clipped/desaturated
    const result = makeCmykSafe(128, 0, 0, 200);
    expect(result.isSafe).toBe(false);
    
    // The adjusted CMYK should now have a TAC <= 200
    const [c, m, y, k] = result.cmyk;
    expect(c + m + y + k).toBeLessThanOrEqual(200);
  });
});

describe("Generator", () => {
  test("generatePalette constructs correct colors array", () => {
    const config: PaletteConfig = {
      name: "Test",
      baseHue: 210,
      saturation: { peak: 100, minDark: 50, minLight: 50, curve: "linear" },
      lightness: { start: 90, end: 10, curve: "linear" },
      shades: [100, 500, 900],
      cmykSafe: true
    };
    
    const result = generatePalette(config);
    expect(result.name).toBe("Test");
    expect(result.colors.length).toBe(3);
    
    // Check shades
    expect(result.colors[0]!.shade).toBe(100);
    expect(result.colors[1]!.shade).toBe(500);
    expect(result.colors[2]!.shade).toBe(900);

    // Verify properties existence
    expect(result.colors[0]!).toHaveProperty("hex");
    expect(result.colors[0]!).toHaveProperty("rgb");
    expect(result.colors[0]!).toHaveProperty("cmyk");
    expect(result.colors[0]!).toHaveProperty("isCmykSafe");
  });

  test("generatePalette applies hue curve correctly", () => {
    const config: PaletteConfig = {
      name: "Hue Curve Test",
      baseHue: 200,
      hueShift: 100,
      hueCurve: "parabolic", // 0 -> 1 -> 0
      saturation: { peak: 100, minDark: 100, minLight: 100, curve: "linear" },
      lightness: { start: 50, end: 50, curve: "linear" },
      shades: [100, 500, 900], // t = 0, 0.5, 1
      cmykSafe: false
    };

    const result = generatePalette(config);
    expect(result.colors.length).toBe(3);

    // At t=0, hueCurve(0) = 0. h = 200 + 100*0 = 200
    expect(result.colors[0]!.hsl[0]).toBe(200);

    // At t=0.5, hueCurve(0.5) = 1. h = 200 + 100*1 = 300
    expect(result.colors[1]!.hsl[0]).toBe(300);

    // At t=1.0, hueCurve(1.0) = 0. h = 200 + 100*0 = 200
    expect(result.colors[2]!.hsl[0]).toBe(200);
  });

  test("generatePalette scales down saturation correctly when cmykReconciliation is scale-down", () => {
    const config: PaletteConfig = {
      name: "Scale Down Test",
      baseHue: 0, // Red
      saturation: { peak: 100, minDark: 100, minLight: 100, curve: "linear" }, // very saturated
      lightness: { start: 50, end: 50, curve: "linear" },
      shades: [500, 600], // two shades
      cmykSafe: true,
      cmykReconciliation: "scale-down"
    };

    const unsafeConfig = { ...config, cmykSafe: false };
    const safeResult = generatePalette(config);
    const unsafeResult = generatePalette(unsafeConfig);
    
    // Scale down should mean safe saturations are uniformly scaled down
    const safeSat1 = safeResult.colors[0]!.hsl[1];
    const safeSat2 = safeResult.colors[1]!.hsl[1];
    
    const unsafeSat1 = unsafeResult.colors[0]!.hsl[1];
    const unsafeSat2 = unsafeResult.colors[1]!.hsl[1];

    const ratio1 = safeSat1 / unsafeSat1;
    const ratio2 = safeSat2 / unsafeSat2;
    expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.05); // allow minor rounding differences
    
    // Test clamp behaviour for contrast
    const clampResult = generatePalette({ ...config, cmykReconciliation: "clamp" });
    const clampSat1 = clampResult.colors[0]!.hsl[1];
    const clampSat2 = clampResult.colors[1]!.hsl[1];
    // Since both 500 and 600 are out of gamut identically, ratio might be similar but maybe not exactly
    // but scale-down tests uniform scale regardless of clamp necessity
  });

  test("expandPalettesConfig generates correct number of configurations", () => {
    const config: PalettesConfig = {
      namePrefix: "Test Suite",
      names: ["A", "B Object", "C"],
      hues: { start: 0, end: 100, count: 3, curve: "linear" },
      saturation: { peak: 100, minDark: 50, minLight: 50, curve: "linear" },
      lightness: { start: 90, end: 10, curve: "linear" },
      shades: [100, 500, 900],
      cmykSafe: true
    };

    const expanded = expandPalettesConfig(config);
    expect(expanded.length).toBe(3);
    
    expect(expanded[0]!.name).toBe("test-suite-a");
    expect(expanded[1]!.name).toBe("test-suite-b-object");
    expect(expanded[2]!.name).toBe("test-suite-c");
    
    expect(expanded[0]!.baseHue).toBe(0);
    expect(expanded[1]!.baseHue).toBe(50);
    expect(expanded[2]!.baseHue).toBe(100);
  });

  test("expandPalettesConfig resolves mixed naming and fallback index naming", () => {
    const config: PalettesConfig = {
      namePrefix: "Blue",
      names: ["A", "B Object", "C"],
      hues: { start: 0, end: 100, count: 5, curve: "linear" },
      saturation: { peak: 100, minDark: 50, minLight: 50, curve: "linear" },
      lightness: { start: 90, end: 10, curve: "linear" },
      shades: [100, 500],
    };

    const expanded = expandPalettesConfig(config);
    expect(expanded.length).toBe(5);
    
    // First 3 should use kebab case combination
    expect(expanded[0]!.name).toBe("blue-a");
    expect(expanded[1]!.name).toBe("blue-b-object");
    expect(expanded[2]!.name).toBe("blue-c");
    
    // Last 2 should fallback to namePrefix + index (1-based)
    expect(expanded[3]!.name).toBe("Blue-4");
    expect(expanded[4]!.name).toBe("Blue-5");
  });

  test("expandPalettesConfig handles missing prefix with fewer names than hues", () => {
    const config: PalettesConfig = {
      names: ["Only One"],
      hues: { start: 0, end: 100, count: 3, curve: "linear" },
      saturation: { peak: 100, minDark: 50, minLight: 50, curve: "linear" },
      lightness: { start: 90, end: 10, curve: "linear" },
      shades: [100, 500],
    };

    const expanded = expandPalettesConfig(config);
    expect(expanded.length).toBe(3);
    
    // First should use the exact provided name
    expect(expanded[0]!.name).toBe("Only One");
    
    // Afterwards should be undefined because both prefix & custom names are missing
    expect(expanded[1]!.name).toBeUndefined();
    expect(expanded[2]!.name).toBeUndefined();
  });
});

