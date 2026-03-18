import { expect, test, describe } from "bun:test";
import { applyCurve, hslToRgb, rgbToCmyk, makeCmykSafe } from "../src/colorMath.js";
import { generatePalette } from "../src/generator.js";
import type { PaletteConfig } from "../src/types.js";

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
});
