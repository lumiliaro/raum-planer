import { describe, expect, it } from "vitest";
import { ShapeSchema } from "@/lib/plan-schema";
import { createShape } from "@/lib/shape-factory";
import { uuid } from "@/test/plan-fixtures";

const STYLE = { fill: "#E4E4E7", stroke: "#52525B", strokeWidth: 1.5, opacity: 1 };

describe("createShape", () => {
    it("creates a 100 × 60 cm rectangle without radius or rotation", () => {
        expect(createShape("rect", { x: 412.4, y: 188.6 }, uuid(1))).toEqual({
            id: uuid(1),
            kind: "rect",
            x: 412,
            y: 189,
            rotationDeg: 0,
            mirrored: false,
            style: STYLE,
            widthCm: 100,
            depthCm: 60,
            cornerRadiusCm: 0,
        });
    });

    it("creates an 80 × 80 cm ellipse", () => {
        expect(createShape("ellipse", { x: 10, y: 20 }, uuid(2))).toEqual({
            id: uuid(2),
            kind: "ellipse",
            x: 10,
            y: 20,
            rotationDeg: 0,
            mirrored: false,
            style: STYLE,
            widthCm: 80,
            depthCm: 80,
        });
    });

    it("has no label and does not share the style object", () => {
        const a = createShape("rect", { x: 0, y: 0 }, uuid(1));
        const b = createShape("rect", { x: 0, y: 0 }, uuid(2));
        expect(a.label).toBeUndefined();
        expect(a.style).not.toBe(b.style);
    });

    it("rounds the center to whole cm without -0", () => {
        const shape = createShape("ellipse", { x: -0.4, y: 0.5 }, uuid(3));
        expect(Object.is(shape.x, 0)).toBe(true);
        expect(shape.y).toBe(1);
    });

    it("creates the further shapes with their default sizes", () => {
        const at = { x: 400, y: 250 };
        expect(createShape("l-shape", at, uuid(5))).toMatchObject({
            kind: "l-shape",
            widthCm: 120,
            depthCm: 100,
            legAWidthCm: 40,
            legBWidthCm: 40,
            style: STYLE,
        });
        expect(createShape("u-shape", at, uuid(5))).toMatchObject({
            kind: "u-shape",
            widthCm: 140,
            depthCm: 100,
            baseWidthCm: 30,
            sideWidthCm: 30,
            style: STYLE,
        });
        expect(createShape("corner", at, uuid(5))).toMatchObject({ kind: "corner", widthCm: 90, depthCm: 90, style: STYLE });
        for (const kind of ["l-shape", "u-shape", "corner"] as const) {
            expect(createShape(kind, at, uuid(5))).toMatchObject({ x: 400, y: 250, rotationDeg: 0, mirrored: false });
        }
    });

    it("no longer inserts furniture doors (door-swing)", () => {
        // @ts-expect-error door-swing is no InsertableKind any more
        expect(() => createShape("door-swing", { x: 10, y: 20 }, uuid(6))).toThrow();
    });

    it("gives L-Form, U-Form and Ecke the style of a new rectangle", () => {
        for (const kind of ["l-shape", "u-shape", "corner"] as const) {
            expect(createShape(kind, { x: 0, y: 0 }, uuid(6)).style).toEqual(createShape("rect", { x: 0, y: 0 }, uuid(7)).style);
        }
    });

    it("passes the plan schema", () => {
        for (const kind of ["rect", "ellipse", "l-shape", "u-shape", "corner"] as const) {
            expect(ShapeSchema.safeParse(createShape(kind, { x: 412.4, y: 188.6 }, uuid(4))).success).toBe(true);
        }
    });
});
