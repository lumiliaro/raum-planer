import { describe, expect, it } from "vitest";
import type { ShapePatch } from "@/lib/plan-schema";
import { canDelete, isPatchAllowed } from "@/lib/shape-lock";
import { rect, STYLE } from "@/test/plan-fixtures";

const open = rect(1);
const locked = rect(2, { locked: true });

describe("isPatchAllowed", () => {
    it("allows everything for a shape that is not locked", () => {
        expect(isPatchAllowed(open, { x: 10, widthCm: 50, mirrored: true })).toBe(true);
        expect(isPatchAllowed(rect(3, { locked: false }), { rotationDeg: 90 })).toBe(true);
    });

    it.each<[string, ShapePatch]>([
        ["label", { label: "Schrank" }],
        ["style", { style: { ...STYLE, fill: "#000000" } }],
        ["locked", { locked: false }],
        ["an empty patch", {}],
    ])("allows %s on a locked shape", (_, patch) => {
        expect(isPatchAllowed(locked, patch)).toBe(true);
    });

    it.each<[string, ShapePatch]>([
        ["x", { x: 10 }],
        ["rotationDeg", { rotationDeg: 90 }],
        ["mirrored", { mirrored: true }],
        ["widthCm", { widthCm: 50 }],
        ["legAWidthCm", { legAWidthCm: 20 } as ShapePatch],
        ["pointsCm", { pointsCm: [] } as ShapePatch],
        ["a mixed patch", { label: "Schrank", x: 10 }],
    ])("rejects %s on a locked shape", (_, patch) => {
        expect(isPatchAllowed(locked, patch)).toBe(false);
    });
});

describe("canDelete", () => {
    it("is true only without a lock", () => {
        expect(canDelete(open)).toBe(true);
        expect(canDelete(rect(3, { locked: false }))).toBe(true);
        expect(canDelete(locked)).toBe(false);
    });
});
