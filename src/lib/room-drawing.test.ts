import { describe, expect, it } from "vitest";
import {
    canAppendPoint,
    canClose,
    edgeEndAtPointer,
    pointAtDistance,
    resolveDraftPointer,
    roundPointCm,
    snapDirection,
    snapToCorner,
} from "@/lib/room-drawing";
import type { PointCm } from "@/lib/plan-schema";

const pts = (...coords: [number, number][]): PointCm[] => coords.map(([x, y]) => ({ x, y }));
const p = (x: number, y: number): PointCm => ({ x, y });

describe("roundPointCm", () => {
    it("rounds to 0,1 cm without -0", () => {
        expect(roundPointCm(p(337.46, -0.04))).toEqual({ x: 337.5, y: 0 });
        expect(Object.is(roundPointCm(p(-0.01, 0)).x, 0)).toBe(true);
    });
});

describe("snapDirection", () => {
    it("snaps (100, 100) → pointer (430, 108) to the right", () => {
        expect(snapDirection(p(100, 100), p(430, 108), false)).toEqual({ x: 1, y: 0 });
    });

    it.each([
        [p(90, 300), { x: 0, y: 1 }],
        [p(-200, 150), { x: -1, y: 0 }],
        [p(110, -50), { x: 0, y: -1 }],
    ])("snaps the pointer %j to the nearest axis", (pointer, direction) => {
        expect(snapDirection(p(100, 100), pointer, false)).toEqual(direction);
    });

    it("follows the pointer with free", () => {
        const direction = snapDirection(p(100, 100), p(400, 500), true);
        expect(direction?.x).toBeCloseTo(0.6);
        expect(direction?.y).toBeCloseTo(0.8);
    });

    it("has no direction at distance 0", () => {
        expect(snapDirection(p(100, 100), p(100, 100), false)).toBeNull();
        expect(snapDirection(p(100, 100), p(100, 100), true)).toBeNull();
    });
});

describe("edgeEndAtPointer", () => {
    it("shows a horizontal edge to (430, 100) for the pointer at (430, 108)", () => {
        expect(edgeEndAtPointer(p(100, 100), p(430, 108), false)).toEqual({ x: 430, y: 100 });
    });

    it("ends at the pointer with free", () => {
        expect(edgeEndAtPointer(p(100, 100), p(400, 200), true)).toEqual({ x: 400, y: 200 });
    });

    it("is null at distance 0", () => {
        expect(edgeEndAtPointer(p(100, 100), p(100, 100), false)).toBeNull();
    });
});

describe("pointAtDistance", () => {
    it("puts 337,5 cm to the right of (0, 0) at (337,5, 0)", () => {
        expect(pointAtDistance(p(0, 0), { x: 1, y: 0 }, 337.5)).toEqual({ x: 337.5, y: 0 });
    });

    it("puts 560 cm below (337,5, 0) at (337,5, 560)", () => {
        expect(pointAtDistance(p(337.5, 0), { x: 0, y: 1 }, 560)).toEqual({ x: 337.5, y: 560 });
    });

    it("rounds to 0,1 cm", () => {
        expect(pointAtDistance(p(0, 0), { x: Math.SQRT1_2, y: Math.SQRT1_2 }, 100)).toEqual({ x: 70.7, y: 70.7 });
    });
});

describe("snapToCorner", () => {
    const corners = pts([350, 0], [360, 0], [0, 0]);

    it("snaps within the radius", () => {
        expect(snapToCorner(p(347, 4), corners, 6)).toEqual({ x: 350, y: 0 });
    });

    it("does not snap outside the radius", () => {
        expect(snapToCorner(p(340, 0), corners, 6)).toBeNull();
    });

    it("takes the nearest corner", () => {
        expect(snapToCorner(p(356, 0), corners, 8)).toEqual({ x: 360, y: 0 });
    });
});

describe("canAppendPoint", () => {
    const drawn = pts([0, 0], [300, 0], [300, 300]);

    it("always allows the first point", () => {
        expect(canAppendPoint([], p(0, 0))).toBe(true);
    });

    it("allows an edge that crosses nothing", () => {
        expect(canAppendPoint(drawn, p(0, 300))).toBe(true);
    });

    it("rejects an edge crossing the first edge: (300, 300) → (150, −100)", () => {
        expect(canAppendPoint(drawn, p(150, -100))).toBe(false);
    });

    it("rejects an edge of 0 cm", () => {
        expect(canAppendPoint(drawn, p(300, 300))).toBe(false);
    });

    it("rejects an edge running back over the previous one", () => {
        expect(canAppendPoint(drawn, p(300, 100))).toBe(false);
        expect(canAppendPoint(drawn, p(300, -50))).toBe(false);
    });

    it("rejects a point on an earlier edge or on the start point", () => {
        expect(canAppendPoint(drawn, p(150, 0))).toBe(false);
        expect(canAppendPoint(drawn, p(0, 0))).toBe(false);
    });
});

describe("canClose", () => {
    it("needs at least 3 corners", () => {
        expect(canClose(pts([0, 0], [300, 0]))).toBe(false);
        expect(canClose(pts([0, 0], [300, 0], [300, 300]))).toBe(true);
    });

    it("closes the rectangle 337,5 × 560 cm", () => {
        expect(canClose(pts([0, 0], [337.5, 0], [337.5, 560], [0, 560]))).toBe(true);
    });

    it("rejects a closing edge crossing the outline", () => {
        // The closing edge (0, 300) → (0, 0) crosses the edge (−100, 100) → (200, 100).
        expect(canClose(pts([0, 0], [200, 0], [200, 100], [-100, 100], [-100, 200], [0, 300]))).toBe(false);
    });

    it("rejects a closing edge of 0 cm", () => {
        expect(canClose(pts([0, 0], [300, 0], [300, 300], [0, 0]))).toBe(false);
    });
});

describe("resolveDraftPointer", () => {
    const roomCorners = pts([350, 0], [700, 0]);
    /** 8 screen px at 100 % zoom. */
    const radius = 8;

    it("puts the start point exactly on a room corner 5 screen px away", () => {
        expect(resolveDraftPointer([], p(354, 3), roomCorners, radius, false)).toEqual({
            point: { x: 350, y: 0 },
            snapped: true,
            closes: false,
        });
    });

    it("uses the rounded pointer as start point away from corners", () => {
        expect(resolveDraftPointer([], p(100.04, 99.96), roomCorners, radius, false)).toEqual({
            point: { x: 100, y: 100 },
            snapped: false,
            closes: false,
        });
    });

    it("snaps the direction of the next edge", () => {
        expect(resolveDraftPointer(pts([100, 100]), p(430, 108), [], radius, false).point).toEqual({ x: 430, y: 100 });
        expect(resolveDraftPointer(pts([100, 100]), p(400, 200), [], radius, true).point).toEqual({ x: 400, y: 200 });
    });

    it("lets a corner win over the direction", () => {
        expect(resolveDraftPointer(pts([0, 30]), p(345, 4), roomCorners, radius, false).point).toEqual({ x: 350, y: 0 });
    });

    it("closes on the start point from 3 corners on", () => {
        const three = pts([0, 0], [300, 0], [300, 300]);
        expect(resolveDraftPointer(three, p(3, -4), [], radius, false)).toEqual({ point: { x: 0, y: 0 }, snapped: true, closes: true });
        expect(resolveDraftPointer(three.slice(0, 2), p(3, -4), [], radius, false).closes).toBe(false);
    });

    it("has no point on the last corner", () => {
        expect(resolveDraftPointer(pts([0, 0], [300, 0]), p(300, 0), [], radius, false).point).toBeNull();
    });
});
