import { describe, expect, it } from "vitest";
import { ShapeSchema, type Shape } from "@/lib/plan-schema";
import { applyTransform, moveBy, roundCm } from "@/lib/shape-transform";
import { rect, STYLE, uuid } from "@/test/plan-fixtures";

const ellipse: Extract<Shape, { kind: "ellipse" }> = {
    id: uuid(7),
    kind: "ellipse",
    x: 100,
    y: 100,
    rotationDeg: 0,
    mirrored: false,
    style: STYLE,
    widthCm: 80,
    depthCm: 80,
};

const asRect = (s: Shape) => s as Extract<Shape, { kind: "rect" }>;

describe("roundCm", () => {
    it("rounds to 0,1 cm without -0", () => {
        expect(roundCm(424.50000000001)).toBe(424.5);
        expect(roundCm(52.04)).toBe(52);
        expect(roundCm(0.15)).toBe(0.2);
        expect(Object.is(roundCm(-0.04), 0)).toBe(true);
    });
});

describe("moveBy", () => {
    it("adds the snapped offset to the start position exactly", () => {
        const moved = moveBy(rect(1, { x: 37, y: 120 }), 15, 0);
        expect(moved.x).toBe(52);
        expect(moved.y).toBe(120);
    });

    it("rounds to 0,1 cm and keeps size, rotation and id", () => {
        const start = asRect(rect(1, { x: 0.1, y: 0.2, rotationDeg: 48 }));
        const moved = asRect(moveBy(start, 0.2, 0.1));
        expect(moved.x).toBe(0.3);
        expect(moved.y).toBe(0.3);
        expect(moved).toMatchObject({ id: start.id, widthCm: 200, depthCm: 90, rotationDeg: 48 });
        expect(ShapeSchema.safeParse(moved).success).toBe(true);
    });
});

describe("applyTransform", () => {
    it("takes position, size and rotation, rounded to 0,1 cm", () => {
        const result = applyTransform(asRect(rect(1)), {
            xCm: 424.49999999,
            yCm: 189.0000001,
            widthCm: 125.00000003,
            depthCm: 60,
            rotationDeg: 0,
        });
        expect(result).toMatchObject({ x: 424.5, y: 189, widthCm: 125, depthCm: 60, rotationDeg: 0 });
    });

    it("enforces the minimum size of 1 cm", () => {
        const result = applyTransform(ellipse, { xCm: 0, yCm: 0, widthCm: 0.02, depthCm: -3, rotationDeg: 0 });
        expect(result.widthCm).toBe(1);
        expect(result.depthCm).toBe(1);
        expect(ShapeSchema.safeParse(result).success).toBe(true);
    });

    it("shrinks the corner radius to half the shorter side", () => {
        const start = asRect(rect(1, { widthCm: 200, depthCm: 90, cornerRadiusCm: 40 }));
        const result = applyTransform(start, { xCm: 100, yCm: 85, widthCm: 200, depthCm: 60, rotationDeg: 0 });
        expect(result.depthCm).toBe(60);
        expect(result.cornerRadiusCm).toBe(30);
        expect(ShapeSchema.safeParse(result).success).toBe(true);

        const kept = applyTransform(start, { xCm: 100, yCm: 100, widthCm: 300, depthCm: 90, rotationDeg: 0 });
        expect(kept.cornerRadiusCm).toBe(40);
    });

    it("snaps and normalizes the rotation", () => {
        const at = (rotationDeg: number) =>
            applyTransform(ellipse, { xCm: 100, yCm: 100, widthCm: 80, depthCm: 80, rotationDeg }).rotationDeg;
        expect(at(93)).toBe(90);
        expect(at(47.6)).toBe(48);
        expect(at(-30)).toBe(330);
        expect(at(359.6)).toBe(0);
    });

    it("keeps a typed rotation on a pure resize", () => {
        const start = asRect(rect(1, { widthCm: 100, rotationDeg: 93 }));
        const resize = (rotationDeg: number) =>
            applyTransform(start, { xCm: 100, yCm: 100, widthCm: 120, depthCm: 90, rotationDeg });
        expect(resize(93).rotationDeg).toBe(93);
        expect(resize(93).widthCm).toBe(120);
        expect(resize(93.0000001).rotationDeg).toBe(93);
        expect(resize(92.9999999).rotationDeg).toBe(93);
        expect(resize(-267).rotationDeg).toBe(93);
    });

    it("snaps the rotation only after an actual rotation", () => {
        const rotate = (from: number, to: number) =>
            applyTransform(asRect(rect(1, { rotationDeg: from })), {
                xCm: 100,
                yCm: 100,
                widthCm: 200,
                depthCm: 90,
                rotationDeg: to,
            }).rotationDeg;
        expect(rotate(0, 93)).toBe(90);
        expect(rotate(0, 47.6)).toBe(48);
        expect(rotate(93, 95)).toBe(90);
        expect(rotate(93, 120.4)).toBe(120);
    });

    it("keeps the legs of an L-shape", () => {
        const lShape: Shape = {
            ...ellipse,
            kind: "l-shape",
            widthCm: 280,
            depthCm: 200,
            legAWidthCm: 90,
            legBWidthCm: 90,
        };
        const result = applyTransform(lShape, { xCm: 60, yCm: 100, widthCm: 200, depthCm: 200, rotationDeg: 0 });
        expect(result).toMatchObject({ widthCm: 200, depthCm: 200, legAWidthCm: 90, legBWidthCm: 90, x: 60 });
        expect(ShapeSchema.safeParse(result).success).toBe(true);
    });

    it("writes an exact square for a door", () => {
        const { depthCm: _depth, ...rest } = ellipse;
        const door: Shape = { ...rest, kind: "door-swing", widthCm: 80 };
        const result = applyTransform(door, { xCm: 105, yCm: 95, widthCm: 90.00000004, depthCm: 89.9999999, rotationDeg: 0 });
        expect(result).toEqual({ ...door, widthCm: 90, x: 105, y: 95 });
        expect("depthCm" in result).toBe(false);
        expect(ShapeSchema.safeParse(result).success).toBe(true);
    });

    it("produces shapes that pass the plan schema and keep id and kind", () => {
        for (const shape of [asRect(rect(1, { cornerRadiusCm: 10 })), ellipse]) {
            const result = applyTransform(shape, {
                xCm: 210.04,
                yCm: -5,
                widthCm: 12.34,
                depthCm: 6.66,
                rotationDeg: 400,
            });
            expect(result.id).toBe(shape.id);
            expect(result.kind).toBe(shape.kind);
            expect(ShapeSchema.safeParse(result).success).toBe(true);
        }
    });
});
