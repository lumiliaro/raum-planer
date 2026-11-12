import { describe, expect, it } from "vitest";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import {
    FINE_SNAP_STEP_CM,
    SNAP_STEP_CM,
    snapDelta,
    snapResizeBox,
    snapRotationDeg,
    snapSquareResizeBox,
    snapStepCm,
    type Box,
} from "@/lib/snap";

describe("snapStepCm", () => {
    it("uses 5 cm, or 1 cm with Alt, with the factory settings", () => {
        expect(SNAP_STEP_CM).toBe(5);
        expect(FINE_SNAP_STEP_CM).toBe(1);
        expect(snapStepCm(false, FACTORY_SETTINGS)).toBe(5);
        expect(snapStepCm(true, FACTORY_SETTINGS)).toBe(1);
    });

    it("uses the steps of the settings: 2,5 cm, or 0,5 cm with Alt", () => {
        const settings = { ...FACTORY_SETTINGS, snapStepCm: 2.5, fineSnapStepCm: 0.5 };
        expect(snapStepCm(false, settings)).toBe(2.5);
        expect(snapStepCm(true, settings)).toBe(0.5);
    });

    it("moves a rectangle at x = 100 cm dragged by 6 cm to 105 cm (Fangschritt 2,5 cm)", () => {
        const settings = { ...FACTORY_SETTINGS, snapStepCm: 2.5, fineSnapStepCm: 0.5 };
        expect(100 + snapDelta(6, snapStepCm(false, settings))).toBe(105);
    });

    it("moves it by 6,3 cm with Alt to 106,5 cm (Feiner Fangschritt)", () => {
        const settings = { ...FACTORY_SETTINGS, snapStepCm: 2.5, fineSnapStepCm: 0.5 };
        expect(100 + snapDelta(6.3, snapStepCm(true, settings))).toBe(106.5);
    });
});

describe("snapDelta", () => {
    it("rounds to the nearest multiple of the step", () => {
        expect(snapDelta(13, 5)).toBe(15);
        expect(snapDelta(2, 5)).toBe(0);
        expect(snapDelta(-13, 5)).toBe(-15);
        expect(snapDelta(13.4, 1)).toBe(13);
        expect(snapDelta(22, 5)).toBe(20);
    });

    it("never returns -0", () => {
        expect(Object.is(snapDelta(-2, 5), 0)).toBe(true);
        expect(Object.is(snapDelta(-0.4, 1), 0)).toBe(true);
    });
});

describe("snapRotationDeg", () => {
    it.each([
        [93, 90],
        [47.6, 48],
        [-30, 330],
        [359.6, 0],
        [266, 270],
        [264, 264],
        [0, 0],
        [-3, 0],
        [365, 0],
        [720 + 180.5, 180],
        [354.4, 354],
    ])("%d° → %d°", (input, expected) => {
        const result = snapRotationDeg(input);
        expect(result).toBe(expected);
        expect(Object.is(result, -0)).toBe(false);
    });
});

describe("snapResizeBox", () => {
    const DEG = Math.PI / 180;

    /** Box of local size w × h whose top-left corner is at (x, y), rotated by `deg`. */
    const box = (x: number, y: number, w: number, h: number, deg = 0): Box => ({
        x,
        y,
        width: w,
        height: h,
        rotation: deg * DEG,
    });

    /** Corners of a box in absolute coordinates: tl, tr, br, bl. */
    function corners(b: Box) {
        const cos = Math.cos(b.rotation);
        const sin = Math.sin(b.rotation);
        const at = (u: number, v: number) => ({ x: b.x + u * cos - v * sin, y: b.y + u * sin + v * cos });
        return { tl: at(0, 0), tr: at(b.width, 0), br: at(b.width, b.height), bl: at(0, b.height) };
    }

    /** Simulates dragging edges of `start` in its local axes, as the transformer reports it. */
    function dragged(start: Box, d: { left?: number; right?: number; top?: number; bottom?: number }): Box {
        const cos = Math.cos(start.rotation);
        const sin = Math.sin(start.rotation);
        const left = d.left ?? 0;
        const top = d.top ?? 0;
        return {
            x: start.x + left * cos - top * sin,
            y: start.y + left * sin + top * cos,
            width: start.width - left + (d.right ?? 0),
            height: start.height - top + (d.bottom ?? 0),
            rotation: start.rotation,
        };
    }

    const expectPoint = (p: { x: number; y: number }, q: { x: number; y: number }) => {
        expect(p.x).toBeCloseTo(q.x, 9);
        expect(p.y).toBeCloseTo(q.y, 9);
    };

    for (const deg of [0, 30, 90]) {
        describe(`at ${deg}° rotation`, () => {
            const start = box(300, 200, 100, 60, deg);

            it("right edge +22 at step 5 → width +20, left edge stays", () => {
                const result = snapResizeBox(start, dragged(start, { right: 22 }), 5, 1);
                expect(result.width).toBeCloseTo(120, 9);
                expect(result.height).toBeCloseTo(60, 9);
                expect(result.rotation).toBe(start.rotation);
                expectPoint(corners(result).tl, corners(start).tl);
                expectPoint(corners(result).bl, corners(start).bl);
                if (deg === 0) {
                    expect(result.x).toBe(300);
                    expect(result.y).toBe(200);
                }
            });

            it("left edge −13 at step 5 → width +15, right edge stays", () => {
                const result = snapResizeBox(start, dragged(start, { left: -13 }), 5, 1);
                expect(result.width).toBeCloseTo(115, 9);
                expectPoint(corners(result).tr, corners(start).tr);
                expectPoint(corners(result).br, corners(start).br);
            });

            it("corner anchor snaps both axes, the opposite corner stays", () => {
                const result = snapResizeBox(start, dragged(start, { right: 7.3, bottom: 13 }), 5, 1);
                expect(result.width).toBeCloseTo(105, 9);
                expect(result.height).toBeCloseTo(75, 9);
                expectPoint(corners(result).tl, corners(start).tl);

                const topLeft = snapResizeBox(start, dragged(start, { left: 12, top: -8 }), 5, 1);
                expect(topLeft.width).toBeCloseTo(90, 9);
                expect(topLeft.height).toBeCloseTo(70, 9);
                expectPoint(corners(topLeft).br, corners(start).br);
            });

            it("fine step snaps to 1", () => {
                const result = snapResizeBox(start, dragged(start, { bottom: 7.3 }), 1, 1);
                expect(result.width).toBeCloseTo(100, 9);
                expect(result.height).toBeCloseTo(67, 9);
                expectPoint(corners(result).tl, corners(start).tl);
            });

            it("takes separate minimums for width and height, also after a far jump", () => {
                const min = { width: 95, height: 30 };
                const narrow = snapResizeBox(start, dragged(start, { right: -90 }), 5, min);
                expect(narrow.width).toBeCloseTo(95, 9);
                expectPoint(corners(narrow).tl, corners(start).tl);
                const flat = snapResizeBox(start, dragged(start, { top: 200 }), 5, min);
                expect(flat.height).toBeCloseTo(30, 9);
                expect(flat.width).toBeCloseTo(100, 9);
                expectPoint(corners(flat).br, corners(start).br);
            });

            it("keeps a square: the width snaps, the height follows, the opposite corner stays", () => {
                const square = box(300, 200, 80, 80, deg);
                const topRight = snapSquareResizeBox(square, dragged(square, { right: 9.2, top: -9.2 }), 5, 1);
                expect(topRight.width).toBeCloseTo(90, 9);
                expect(topRight.height).toBeCloseTo(90, 9);
                expectPoint(corners(topRight).bl, corners(square).bl);

                const bottomLeft = snapSquareResizeBox(square, dragged(square, { left: 12, bottom: -12 }), 5, 1);
                expect(bottomLeft.width).toBeCloseTo(70, 9);
                expect(bottomLeft.height).toBeCloseTo(70, 9);
                expectPoint(corners(bottomLeft).tr, corners(square).tr);
            });

            it("keeps a square at its minimum", () => {
                const square = box(300, 200, 80, 80, deg);
                const result = snapSquareResizeBox(square, dragged(square, { right: -200, bottom: -200 }), 5, 5);
                expect(result.width).toBeCloseTo(5, 9);
                expect(result.height).toBeCloseTo(5, 9);
                expectPoint(corners(result).tl, corners(square).tl);
            });

            it("keeps the minimum width when dragged past the opposite edge", () => {
                const result = snapResizeBox(start, dragged(start, { right: -140 }), 5, 2);
                expect(result.width).toBeCloseTo(2, 9);
                expectPoint(corners(result).tl, corners(start).tl);

                const fromLeft = snapResizeBox(start, dragged(start, { left: 130 }), 5, 2);
                expect(fromLeft.width).toBeCloseTo(2, 9);
                expectPoint(corners(fromLeft).tr, corners(start).tr);
            });
        });
    }

    it("returns the start box when no edge moved beyond float noise", () => {
        const start = box(300, 200, 100, 60, 30);
        const noisy = { ...start, x: start.x + 1e-10, width: start.width - 1e-10 };
        const result = snapResizeBox(start, noisy, 5, 1);
        expect(result.width).toBeCloseTo(100, 9);
        expectPoint(corners(result).tl, corners(start).tl);
    });
});
