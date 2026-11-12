import { describe, expect, it } from "vitest";
import {
    doorLeaf,
    edgeFrame,
    edgeLengthCm,
    hingeFromSide,
    leftDistanceCm,
    OPENING_CUT_DEPTH_CM,
    offsetFromLeftDistance,
    openingGap,
    openingMisfit,
    sideFromHinge,
    windowSymbol,
} from "@/lib/opening-geometry";
import type { PointCm } from "@/lib/plan-schema";
import { distanceCm } from "@/lib/room-geometry";
import { rectPoints } from "@/test/plan-fixtures";

/** (0|0)–(500|400), clockwise on screen: edge 0 top, 1 right, 2 bottom, 3 left. */
const CW = rectPoints(0, 0, 500, 400);
/** The same rectangle counter-clockwise: (0|0), (0|400), (500|400), (500|0); edge 3 is the top one, edge 1 the bottom one. */
const CCW = [...CW].reverse().map((_, i, all) => all[(i + all.length - 1) % all.length]);
const TOP = { cw: 0, ccw: 3 };
const BOTTOM = { cw: 2, ccw: 1 };

const close = (p: PointCm, x: number, y: number) => {
    expect(p.x).toBeCloseTo(x, 6);
    expect(p.y).toBeCloseTo(y, 6);
};
/** The point of the edge at the left/right end, whatever the edge direction. */
const endPoint = (frame: ReturnType<typeof edgeFrame>, end: "start" | "end") => (end === "start" ? frame.start : frame.end);

describe("edgeFrame", () => {
    it("has the counter-clockwise rectangle set up as expected", () => {
        expect(CCW).toEqual([
            { x: 0, y: 0 },
            { x: 0, y: 400 },
            { x: 500, y: 400 },
            { x: 500, y: 0 },
        ]);
    });

    it.each([
        ["clockwise", CW, TOP.cw],
        ["counter-clockwise", CCW, TOP.ccw],
    ])("top edge (%s): outward points to −y, the left corner is x = 0 cm", (_name, points, index) => {
        const frame = edgeFrame(points, index);
        close(frame.outward, 0, -1);
        expect(frame.lengthCm).toBe(500);
        expect(endPoint(frame, frame.leftEnd).x).toBe(0);
    });

    it.each([
        ["clockwise", CW, BOTTOM.cw],
        ["counter-clockwise", CCW, BOTTOM.ccw],
    ])("bottom edge (%s): outward points to +y, the left corner is x = 500 cm", (_name, points, index) => {
        const frame = edgeFrame(points, index);
        close(frame.outward, 0, 1);
        expect(endPoint(frame, frame.leftEnd).x).toBe(500);
    });

    it("right edge (clockwise): outward points to +x, the left corner is the top one", () => {
        const frame = edgeFrame(CW, 1);
        close(frame.outward, 1, 0);
        expect(endPoint(frame, frame.leftEnd)).toEqual({ x: 500, y: 0 });
    });

    it("works for a slanted edge", () => {
        const points = [
            { x: 0, y: 0 },
            { x: 300, y: 0 },
            { x: 0, y: 400 },
        ];
        const frame = edgeFrame(points, 1);
        expect(frame.lengthCm).toBe(500);
        close(frame.dir, -0.6, 0.8);
        close(frame.outward, 0.8, 0.6);
    });
});

describe("edgeLengthCm / openingMisfit", () => {
    it("knows only existing edges", () => {
        expect(edgeLengthCm(CW, 3)).toBe(400);
        expect(edgeLengthCm(CW, 4)).toBeNull();
        expect(edgeLengthCm(CW, -1)).toBeNull();
    });

    it("tells a missing edge from an opening that sticks out", () => {
        expect(openingMisfit(CW, { edgeIndex: 0, offsetCm: 160, widthCm: 80 })).toBeNull();
        expect(openingMisfit(CW, { edgeIndex: 0, offsetCm: 380, widthCm: 120 })).toBeNull();
        expect(openingMisfit(CW, { edgeIndex: 0, offsetCm: 400, widthCm: 120 })).toBe("fit");
        expect(openingMisfit(CW, { edgeIndex: 7, offsetCm: 0, widthCm: 80 })).toBe("edge");
    });
});

describe("left distance", () => {
    it.each([
        ["top, clockwise (left = start)", CW, TOP.cw, 160, 160],
        ["top, counter-clockwise (left = end)", CCW, TOP.ccw, 160, 260],
        ["bottom, clockwise (left = start)", CW, BOTTOM.cw, 100, 100],
    ])("converts back and forth: %s", (_name, points, index, offsetCm, leftDistance) => {
        const frame = edgeFrame(points, index);
        expect(leftDistanceCm(frame, { offsetCm, widthCm: 80 })).toBe(leftDistance);
        expect(offsetFromLeftDistance(frame, 80, leftDistance)).toBe(offsetCm);
    });

    it("measures a window on the bottom edge from x = 500 cm", () => {
        // Window from x = 280 to 400 cm on the bottom edge: 100 cm from the left (= right on screen) corner.
        const frame = edgeFrame(CW, 2);
        expect(frame.leftEnd).toBe("start");
        expect(leftDistanceCm(frame, { offsetCm: 100, widthCm: 120 })).toBe(100);
    });
});

describe("hinge side", () => {
    it.each([
        ["clockwise", CW, TOP.cw],
        ["counter-clockwise", CCW, TOP.ccw],
    ])("hinge left on the top edge (%s) is at the x = 0 end", (_name, points, index) => {
        const frame = edgeFrame(points, index);
        const left = hingeFromSide("left", frame);
        const right = hingeFromSide("right", frame);
        expect(left).not.toBe(right);
        expect(endPoint(frame, left).x).toBe(0);
        expect(sideFromHinge(left, frame)).toBe("left");
        expect(sideFromHinge(right, frame)).toBe("right");
    });
});

describe("openingGap", () => {
    it("reaches from 1 cm inside to 40 cm outside over the opening's width in a 15 cm wall", () => {
        const gap = openingGap(edgeFrame(CW, 0), { offsetCm: 160, widthCm: 80 }, 15);
        expect(OPENING_CUT_DEPTH_CM).toBe(40);
        close(gap[0], 160, 1);
        close(gap[1], 240, 1);
        close(gap[2], 240, -40);
        close(gap[3], 160, -40);
    });

    it("reaches through the whole 60 cm wall", () => {
        const gap = openingGap(edgeFrame(CW, 0), { offsetCm: 100, widthCm: 100 }, 60);
        close(gap[0], 100, 1);
        close(gap[1], 200, 1);
        close(gap[2], 200, -60);
        close(gap[3], 100, -60);
    });
});

describe("doorLeaf", () => {
    const frame = edgeFrame(CW, 0);
    const door = (hinge: "start" | "end", side: "inside" | "outside") => ({
        edgeIndex: 0,
        offsetCm: 160,
        widthCm: 80,
        swing: { hinge, side },
    });

    it("hinge left, inside: leaf from (160|0) to (160|80), arc to (240|0)", () => {
        const leaf = doorLeaf(frame, door("start", "inside"));
        close(leaf.hinge, 160, 0);
        close(leaf.leafEnd, 160, 80);
        close(leaf.arcEnd, 240, 0);
    });

    it("hinge left, outside: leaf from (160|0) to (160|−80)", () => {
        const leaf = doorLeaf(frame, door("start", "outside"));
        close(leaf.hinge, 160, 0);
        close(leaf.leafEnd, 160, -80);
        close(leaf.arcEnd, 240, 0);
    });

    it("hinge right, inside: leaf from (240|0) to (240|80), arc to (160|0)", () => {
        const leaf = doorLeaf(frame, door("end", "inside"));
        close(leaf.hinge, 240, 0);
        close(leaf.leafEnd, 240, 80);
        close(leaf.arcEnd, 160, 0);
    });

    it("hinge right, outside: leaf from (240|0) to (240|−80)", () => {
        const leaf = doorLeaf(frame, door("end", "outside"));
        close(leaf.leafEnd, 240, -80);
        close(leaf.arcEnd, 160, 0);
    });

    it("draws a quarter arc around the hinge from the leaf end to the other end", () => {
        for (const [hinge, side] of [
            ["start", "inside"],
            ["start", "outside"],
            ["end", "inside"],
            ["end", "outside"],
        ] as const) {
            const leaf = doorLeaf(frame, door(hinge, side));
            expect(leaf.arcPoints[0]).toEqual(leaf.leafEnd);
            expect(leaf.arcPoints.at(-1)).toEqual(leaf.arcEnd);
            for (const p of leaf.arcPoints) expect(distanceCm(p, leaf.hinge)).toBeCloseTo(80, 6);
            // A quarter arc stays on the leaf's side of the edge.
            const sign = side === "inside" ? 1 : -1;
            for (const p of leaf.arcPoints) expect(sign * p.y).toBeGreaterThanOrEqual(-1e-9);
        }
    });
});

describe("windowSymbol", () => {
    it("is a rectangle 15 cm deep outwards with a center line at 7,5 cm", () => {
        const symbol = windowSymbol(edgeFrame(CW, 0), { offsetCm: 100, widthCm: 120 }, 15);
        close(symbol.outline[0], 100, 0);
        close(symbol.outline[1], 220, 0);
        close(symbol.outline[2], 220, -15);
        close(symbol.outline[3], 100, -15);
        close(symbol.centerLine[0], 100, -7.5);
        close(symbol.centerLine[1], 220, -7.5);
    });

    it("fills a 36,5 cm wall with its center line 18,25 cm outside the edge", () => {
        const symbol = windowSymbol(edgeFrame(CW, 0), { offsetCm: 100, widthCm: 120 }, 36.5);
        close(symbol.outline[0], 100, 0);
        close(symbol.outline[1], 220, 0);
        close(symbol.outline[2], 220, -36.5);
        close(symbol.outline[3], 100, -36.5);
        close(symbol.centerLine[0], 100, -18.25);
        close(symbol.centerLine[1], 220, -18.25);
    });
});
