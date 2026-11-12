import { describe, expect, it } from "vitest";
import { GRID_STEP_CM, gridLines, visibleGridStepCm } from "@/lib/grid";

describe("gridLines", () => {
    it("has lines at 0, 100 and 200 in the range −50 … 250 cm", () => {
        expect(gridLines({ x: -50, y: -50, width: 300, height: 300 })).toEqual({ xs: [0, 100, 200], ys: [0, 100, 200] });
    });

    it("uses a step of 100 cm", () => {
        expect(GRID_STEP_CM).toBe(100);
        const { xs } = gridLines({ x: 0, y: 0, width: 1000, height: 10 });
        expect(xs).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    });

    it("includes lines on the edges and handles negative areas", () => {
        expect(gridLines({ x: -300, y: 100, width: 200, height: 100 })).toEqual({ xs: [-300, -200, -100], ys: [100, 200] });
    });

    it("has no lines for an empty area", () => {
        expect(gridLines({ x: 10, y: 10, width: 0, height: 500 })).toEqual({ xs: [], ys: [] });
        expect(gridLines({ x: 10, y: 10, width: 500, height: 0 })).toEqual({ xs: [], ys: [] });
    });

    it("has no lines between two multiples", () => {
        expect(gridLines({ x: 10, y: 10, width: 80, height: 80 })).toEqual({ xs: [], ys: [] });
    });

    it("never returns −0", () => {
        const { xs } = gridLines({ x: -0.5, y: 0, width: 1, height: 1 });
        expect(Object.is(xs[0], 0)).toBe(true);
    });

    it("stays below about 300 lines at 10 % zoom on a large screen", () => {
        const { xs, ys } = gridLines({ x: 0, y: 0, width: 2560 / 0.1, height: 1440 / 0.1 });
        expect(xs.length + ys.length).toBeLessThan(420);
    });
});

describe("gridLines with the grid of the settings (Feineres Raster)", () => {
    it("has lines every 50 cm for a spacing of 50 cm", () => {
        expect(gridLines({ x: -60, y: 0, width: 220, height: 120 }, 50)).toEqual({ xs: [-50, 0, 50, 100, 150], ys: [0, 50, 100] });
    });
});

describe("visibleGridStepCm", () => {
    it("keeps the spacing while the lines are at least 4 px apart", () => {
        expect(visibleGridStepCm(50, 1)).toBe(50);
        expect(visibleGridStepCm(100, 0.04)).toBe(100);
        expect(visibleGridStepCm(10, 0.4)).toBe(10);
    });

    it("thins out to every 2nd, 5th, 10th … line at a small zoom", () => {
        // 10 cm at 10 % zoom = 1 px → every 5th line (50 cm = 5 px)
        expect(visibleGridStepCm(10, 0.1)).toBe(50);
        // 10 cm at 20 % zoom = 2 px → every 2nd line (20 cm = 4 px)
        expect(visibleGridStepCm(10, 0.2)).toBe(20);
        // 10 cm at 3 % zoom = 0,3 px → every 20th line (200 cm = 6 px)
        expect(visibleGridStepCm(10, 0.03)).toBe(200);
    });

    it("keeps the axis: every drawn line is a multiple of the set spacing, 0 included", () => {
        const step = visibleGridStepCm(10, 0.1);
        const { xs } = gridLines({ x: -500, y: 0, width: 1000, height: 10 }, step);
        expect(xs).toContain(0);
        for (const x of xs) expect(Math.abs(x % 10)).toBe(0);
    });

    it("draws at most one line per 4 px for a 10 cm grid at 10 % zoom on a large screen", () => {
        const scale = 0.1;
        const { xs, ys } = gridLines({ x: 0, y: 0, width: 2560 / scale, height: 1440 / scale }, visibleGridStepCm(10, scale));
        expect(xs.length).toBeLessThanOrEqual(2560 / 4 + 1);
        expect(ys.length).toBeLessThanOrEqual(1440 / 4 + 1);
    });
});
