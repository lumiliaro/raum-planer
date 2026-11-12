import { describe, expect, it } from "vitest";
import { ShapeSchema, type PointCm, type Shape } from "@/lib/plan-schema";
import {
    applySizeCm,
    clampToGrid,
    getDimensionLimits,
    getMinSizeCm,
    getSizeCm,
    resizeKeepingAnchor,
    type DimensionField,
} from "@/lib/shape-resize";
import { rect, STYLE, uuid } from "@/test/plan-fixtures";

const base = { id: uuid(80), x: 0, y: 0, rotationDeg: 0, mirrored: false, style: STYLE };

const lShape: Shape = { ...base, kind: "l-shape", widthCm: 280, depthCm: 200, legAWidthCm: 90, legBWidthCm: 90 };
const uShape: Shape = { ...base, kind: "u-shape", widthCm: 300, depthCm: 240, baseWidthCm: 60, sideWidthCm: 60 };
const corner: Shape = { ...base, kind: "corner", widthCm: 90, depthCm: 90 };
const door = (overrides: Partial<Shape> = {}): Shape =>
    ({ ...base, kind: "door-swing", widthCm: 80, x: 100, y: 200, ...overrides }) as Shape;

const HINGE = { x: -0.5, y: 0.5 };

/** Hinge position on the floor plan: local hinge, mirrored, rotated and moved to the center. */
function hingeOnPlan(shape: Shape): PointCm {
    const w = getSizeCm(shape).widthCm;
    const lx = (shape.mirrored ? 1 : -1) * (w / 2);
    const ly = w / 2;
    const rad = (shape.rotationDeg * Math.PI) / 180;
    return {
        x: shape.x + lx * Math.cos(rad) - ly * Math.sin(rad),
        y: shape.y + lx * Math.sin(rad) + ly * Math.cos(rad),
    };
}

describe("getSizeCm / getMinSizeCm", () => {
    it("treats a door as a square of its width", () => {
        expect(getSizeCm(door())).toEqual({ widthCm: 80, depthCm: 80 });
    });

    it("keeps every gap at least as large as the leg next to it", () => {
        expect(getMinSizeCm(lShape)).toEqual({ widthCm: 180, depthCm: 180 });
        expect(getMinSizeCm(uShape)).toEqual({ widthCm: 180, depthCm: 120 });
        expect(getMinSizeCm(corner)).toEqual({ widthCm: 0, depthCm: 0 });
    });
});

describe("applySizeCm", () => {
    it("keeps the legs of an L-shape", () => {
        const patch = applySizeCm(lShape, { widthCm: 200, depthCm: 200 });
        expect(patch).toEqual({ widthCm: 200, depthCm: 200 });
        expect({ ...lShape, ...patch }).toMatchObject({ legAWidthCm: 90, legBWidthCm: 90 });
    });

    it("sizes a corner like a rectangle and a door by its width", () => {
        expect(applySizeCm(corner, { widthCm: 120, depthCm: 90 })).toEqual({ widthCm: 120, depthCm: 90 });
        expect(applySizeCm(door(), { widthCm: 90, depthCm: 90 })).toEqual({ widthCm: 90 });
    });

    it("shrinks a rectangle's corner radius", () => {
        const shape = rect(1, { widthCm: 200, depthCm: 90, cornerRadiusCm: 40 });
        expect(applySizeCm(shape, { widthCm: 200, depthCm: 60 })).toEqual({
            widthCm: 200,
            depthCm: 60,
            cornerRadiusCm: 30,
        });
    });
});

describe("clampToGrid", () => {
    it("stops at the smallest grid value not below the minimum", () => {
        expect(clampToGrid(280, 60, 180, 5)).toBe(180);
        expect(clampToGrid(283, 60, 180, 5)).toBe(183);
        expect(clampToGrid(283, 60, 180, 1)).toBe(180);
        expect(clampToGrid(300, 100, 180, 5)).toBe(180);
    });

    it("keeps a requested value at or above the minimum", () => {
        expect(clampToGrid(280, 200, 180, 5)).toBe(200);
        expect(clampToGrid(280, 180, 180, 5)).toBe(180);
    });

    it("never enlarges a shape that is already below the minimum", () => {
        expect(clampToGrid(150, 60, 180, 5)).toBe(150);
    });
});

describe("resizeKeepingAnchor", () => {
    it("moves the center of a door so the hinge stays", () => {
        const center = resizeKeepingAnchor(door(), { widthCm: 90, depthCm: 90 }, HINGE);
        expect(center.x).toBeCloseTo(105, 9);
        expect(center.y).toBeCloseTo(195, 9);
    });

    it.each([
        [90, false],
        [217, false],
        [0, true],
        [217, true],
    ])("keeps the hinge at %i° (mirrored: %s)", (rotationDeg, mirrored) => {
        const before = door({ rotationDeg, mirrored });
        const center = resizeKeepingAnchor(before, { widthCm: 90, depthCm: 90 }, HINGE);
        const after = { ...before, ...center, widthCm: 90 } as Shape;
        const h0 = hingeOnPlan(before);
        const h1 = hingeOnPlan(after);
        expect(h1.x).toBeCloseTo(h0.x, 9);
        expect(h1.y).toBeCloseTo(h0.y, 9);
    });
});

describe("getDimensionLimits", () => {
    const cases: Array<[string, Shape, DimensionField, { minExclusive: number; maxExclusive?: number }]> = [
        ["L-Form Breite", lShape, "widthCm", { minExclusive: 90 }],
        ["L-Form Tiefe", lShape, "depthCm", { minExclusive: 90 }],
        ["L-Form Schenkel A", lShape, "legAWidthCm", { minExclusive: 0, maxExclusive: 200 }],
        ["L-Form Schenkel B", lShape, "legBWidthCm", { minExclusive: 0, maxExclusive: 280 }],
        ["U-Form Breite", uShape, "widthCm", { minExclusive: 120 }],
        ["U-Form Tiefe", uShape, "depthCm", { minExclusive: 60 }],
        ["U-Form Basis", uShape, "baseWidthCm", { minExclusive: 0, maxExclusive: 240 }],
        ["U-Form Seiten", uShape, "sideWidthCm", { minExclusive: 0, maxExclusive: 150 }],
        ["Ecke Breite", corner, "widthCm", { minExclusive: 0 }],
        ["Ecke Tiefe", corner, "depthCm", { minExclusive: 0 }],
        ["Tür Breite", door(), "widthCm", { minExclusive: 0 }],
    ];

    it.each(cases)("%s", (_name, shape, field, limits) => {
        expect(getDimensionLimits(shape, field)).toEqual(limits);
    });

    it.each(cases)("%s matches the plan schema", (_name, shape, field) => {
        const { minExclusive, maxExclusive } = getDimensionLimits(shape, field);
        const valid = (value: number) => ShapeSchema.safeParse({ ...shape, [field]: value }).success;
        expect(valid(minExclusive)).toBe(false);
        expect(valid(minExclusive + 1)).toBe(true);
        if (maxExclusive !== undefined) {
            expect(valid(maxExclusive)).toBe(false);
            expect(valid(maxExclusive - 1)).toBe(true);
        }
    });

    it("rejects fields a kind does not have", () => {
        expect(() => getDimensionLimits(door(), "depthCm")).toThrow();
        expect(() => getDimensionLimits(corner, "legAWidthCm")).toThrow();
    });
});
