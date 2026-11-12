import { describe, expect, it } from "vitest";
import { ShapeStyleSchema } from "@/lib/plan-schema";
import { DEFAULT_SHAPE_STYLE } from "@/lib/shape-factory";
import { findActivePreset, STYLE_PRESETS } from "@/lib/style-presets";

describe("STYLE_PRESETS", () => {
    it("has the 8 presets in the order of the style guide", () => {
        expect(STYLE_PRESETS.map((p) => p.name)).toEqual([
            "Grau",
            "Blau",
            "Violett",
            "Gelb",
            "Türkis",
            "Orange",
            "Grün",
            "Nur Rand",
        ]);
    });

    it("each preset is a valid style", () => {
        for (const { fill, stroke } of STYLE_PRESETS) {
            expect(ShapeStyleSchema.safeParse({ fill, stroke, strokeWidth: 1.5, opacity: 1 }).success).toBe(true);
        }
    });
});

describe("findActivePreset", () => {
    it("finds Grau for the default style of new shapes", () => {
        expect(findActivePreset(DEFAULT_SHAPE_STYLE)?.name).toBe("Grau");
    });

    it("ignores case", () => {
        expect(findActivePreset({ fill: "#fde68a", stroke: "#92400e" })?.name).toBe("Gelb");
    });

    it("finds Nur Rand for no fill", () => {
        expect(findActivePreset({ fill: null, stroke: "#27272A" })?.name).toBe("Nur Rand");
    });

    it("finds nothing for free colors", () => {
        expect(findActivePreset({ fill: "#A7F3D0", stroke: "#52525B" })).toBeNull();
        expect(findActivePreset({ fill: null, stroke: "#52525B" })).toBeNull();
        expect(findActivePreset({ fill: "#E4E4E7", stroke: "#27272A" })).toBeNull();
    });
});
