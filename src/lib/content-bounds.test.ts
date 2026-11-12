import { describe, expect, it } from "vitest";
import { EMPTY_FLOOR_BOUNDS, floorContentBounds, visibleUnderlayRect } from "@/lib/content-bounds";
import { CAL_EG, rect, rectPoints, room, underlay, uuid } from "@/test/plan-fixtures";

/** Underlay 1240 × 1754 px at 1 px/cm: 0 … 1 240 cm wide. */
const SCAN = { x: 0, y: 0, width: 1240, height: 1754 };

const expectRect = (actual: { x: number; y: number; width: number; height: number }, expected: typeof actual) => {
    for (const key of ["x", "y", "width", "height"] as const) expect(actual[key]).toBeCloseTo(expected[key], 9);
};

describe("floorContentBounds", () => {
    it("is 0 … 1 000 cm in both directions for an empty floor", () => {
        expect(floorContentBounds({ underlayRect: null, shapes: [] })).toEqual({ x: 0, y: 0, width: 1000, height: 1000 });
        expect(EMPTY_FLOOR_BOUNDS).toEqual({ x: 0, y: 0, width: 1000, height: 1000 });
    });

    it("contains two rooms of the Keller from (0, 0) to (900, 600) with their 15-cm wall band", () => {
        const rooms = [room(1, "Lager", rectPoints(0, 0, 400, 600)), room(2, "Werkstatt", rectPoints(415, 100, 485, 500))];
        expect(floorContentBounds({ underlayRect: null, shapes: [], rooms })).toEqual({
            x: -15,
            y: -15,
            width: 930,
            height: 630,
        });
    });

    it("reaches up to y = −36,5 cm for a room with a 36,5 cm wall on top", () => {
        const wohnen = room(1, "Wohnen", rectPoints(0, 0, 500, 400), [], [36.5, 15, 15, 15]);
        expect(floorContentBounds({ underlayRect: null, shapes: [], rooms: [wohnen] })).toEqual({
            x: -15,
            y: -36.5,
            width: 530,
            height: 451.5,
        });
    });

    it("is the underlay alone without shapes", () => {
        expect(floorContentBounds({ underlayRect: SCAN, shapes: [] })).toEqual(SCAN);
    });

    it("contains a cupboard at x = 1 500 cm beside a 1 240 cm wide underlay", () => {
        const cupboard = rect(1, { x: 1500, y: 300, widthCm: 200, depthCm: 60 });
        expectRect(floorContentBounds({ underlayRect: SCAN, shapes: [cupboard] }), {
            x: 0,
            y: 0,
            width: 1600,
            height: 1754,
        });
    });

    it("counts a rotated shape with its rotated outline", () => {
        const turned = rect(1, { x: 500, y: 500, widthCm: 200, depthCm: 60, rotationDeg: 90 });
        expectRect(floorContentBounds({ underlayRect: null, shapes: [turned] }), {
            x: 470,
            y: 400,
            width: 60,
            height: 200,
        });
    });

    it("unites several shapes without underlay", () => {
        const a = rect(1, { x: -100, y: 50, widthCm: 100, depthCm: 100 });
        const b = rect(2, { x: 300, y: 700, widthCm: 100, depthCm: 100 });
        expectRect(floorContentBounds({ underlayRect: null, shapes: [a, b] }), { x: -150, y: 0, width: 500, height: 750 });
    });

    it("skips shapes without outline (polygon)", () => {
        const polygon = {
            ...rect(1),
            id: uuid(2),
            kind: "polygon" as const,
            pointsCm: [
                { x: 0, y: 0 },
                { x: 5000, y: 0 },
                { x: 0, y: 5000 },
            ],
        };
        expect(floorContentBounds({ underlayRect: SCAN, shapes: [polygon] })).toEqual(SCAN);
    });
});

describe("visibleUnderlayRect", () => {
    it("is the rectangle of a visible underlay whose image is shown", () => {
        expect(visibleUnderlayRect(underlay(), true)).toEqual(SCAN);
        expect(visibleUnderlayRect(underlay(CAL_EG), true)?.width).toBeCloseTo(1240 / 0.9986, 9);
    });

    it("does not count a hidden underlay", () => {
        expect(visibleUnderlayRect(underlay(null, { visible: false }), true)).toBeNull();
    });

    it("does not count an underlay whose image is missing or still loading, nor a missing underlay", () => {
        expect(visibleUnderlayRect(underlay(), false)).toBeNull();
        expect(visibleUnderlayRect(undefined, true)).toBeNull();
    });
});
