import { describe, expect, it } from "vitest";
import {
    clampScale,
    fitViewport,
    MAX_SCALE,
    MIN_SCALE,
    screenToWorld,
    visibleRectCm,
    worldToScreen,
    wheelFactor,
    zoomAt,
    zoomAtCenter,
    type Viewport,
} from "@/lib/viewport";

const IMAGE = { x: 0, y: 0, width: 1240, height: 1754 };

describe("clampScale", () => {
    it("limits to 0.1 … 8", () => {
        expect(MIN_SCALE).toBe(0.1);
        expect(MAX_SCALE).toBe(8);
        expect(clampScale(0.01)).toBe(0.1);
        expect(clampScale(20)).toBe(8);
        expect(clampScale(1.5)).toBe(1.5);
    });
});

describe("fitViewport", () => {
    it("fits a portrait image into a landscape view by height, centered, 24 px padding", () => {
        const view = { width: 1200, height: 800 };
        const vp = fitViewport(IMAGE, view);
        expect(vp.scale).toBeCloseTo((800 - 48) / 1754);
        const drawnW = IMAGE.width * vp.scale;
        const drawnH = IMAGE.height * vp.scale;
        expect(vp.y).toBeCloseTo(24);
        expect(vp.y + drawnH).toBeCloseTo(800 - 24);
        expect(vp.x).toBeCloseTo((1200 - drawnW) / 2);
        expect(vp.x + drawnW / 2).toBeCloseTo(600);
    });

    it("fits into a narrow portrait view by width, centered, 24 px padding", () => {
        const view = { width: 400, height: 1000 };
        const vp = fitViewport(IMAGE, view);
        expect(vp.scale).toBeCloseTo((400 - 48) / 1240);
        expect(vp.x).toBeCloseTo(24);
        expect(vp.x + IMAGE.width * vp.scale).toBeCloseTo(400 - 24);
        expect(vp.y + (IMAGE.height * vp.scale) / 2).toBeCloseTo(500);
    });

    it("respects the zoom limits", () => {
        expect(fitViewport(IMAGE, { width: 50, height: 50 }).scale).toBe(MIN_SCALE);
        expect(fitViewport({ x: 0, y: 0, width: 10, height: 10 }, { width: 5000, height: 5000 }).scale).toBe(MAX_SCALE);
    });

    it("centers a rectangle with an offset", () => {
        const view = { width: 1000, height: 600 };
        const bounds = { x: -200, y: 300, width: 1500, height: 400 };
        const vp = fitViewport(bounds, view);
        const center = worldToScreen(vp, { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 });
        expect(center.x).toBeCloseTo(500);
        expect(center.y).toBeCloseTo(300);
        expect(vp.scale).toBeCloseTo((1000 - 48) / 1500);
        expect(worldToScreen(vp, { x: -200, y: 0 }).x).toBeCloseTo(24);
    });

    it("fits the empty floor 0 … 1 000 cm", () => {
        const view = { width: 800, height: 600 };
        const vp = fitViewport({ x: 0, y: 0, width: 1000, height: 1000 }, view);
        expect(vp.scale).toBeCloseTo((600 - 48) / 1000);
        expect(worldToScreen(vp, { x: 0, y: 0 }).y).toBeCloseTo(24);
        expect(worldToScreen(vp, { x: 500, y: 500 })).toEqual({ x: 400, y: 300 });
    });

    it("zooms to the maximum for a single point", () => {
        const vp = fitViewport({ x: 50, y: 50, width: 0, height: 0 }, { width: 400, height: 400 });
        expect(vp.scale).toBe(MAX_SCALE);
        expect(worldToScreen(vp, { x: 50, y: 50 })).toEqual({ x: 200, y: 200 });
    });
});

describe("visibleRectCm", () => {
    it("is the view in cm", () => {
        const vp: Viewport = { scale: 0.5, x: 100, y: -50 };
        expect(visibleRectCm(vp, { width: 800, height: 600 })).toEqual({ x: -200, y: 100, width: 1600, height: 1200 });
    });
});

describe("screenToWorld", () => {
    it("is the inverse of the rendering transform", () => {
        const vp: Viewport = { scale: 0.75, x: 120, y: -40 };
        const worldPoint = { x: 300, y: 512 };
        const screen = worldToScreen(vp, worldPoint);
        expect(screen).toEqual({ x: 300 * 0.75 + 120, y: 512 * 0.75 - 40 });
        const back = screenToWorld(vp, screen);
        expect(back.x).toBeCloseTo(worldPoint.x);
        expect(back.y).toBeCloseTo(worldPoint.y);
    });
});

describe("zoomAt", () => {
    it("keeps the image point under the pointer fixed", () => {
        const vp: Viewport = { scale: 0.5, x: 100, y: 50 };
        const pointer = { x: 333, y: 221 };
        const before = screenToWorld(vp, pointer);
        const next = zoomAt(vp, pointer, 1.8);
        expect(next.scale).toBeCloseTo(0.9);
        const after = screenToWorld(next, pointer);
        expect(after.x).toBeCloseTo(before.x);
        expect(after.y).toBeCloseTo(before.y);
    });

    it("clamps at the limits and keeps the point fixed there too", () => {
        const pointer = { x: 10, y: 20 };
        const top = zoomAt({ scale: 8, x: 0, y: 0 }, pointer, 1.25);
        expect(top).toEqual({ scale: 8, x: 0, y: 0 });
        const bottom = zoomAt({ scale: 0.1, x: 5, y: 5 }, pointer, 0.8);
        expect(bottom.scale).toBe(0.1);
        expect(bottom.x).toBeCloseTo(5);
        expect(bottom.y).toBeCloseTo(5);
    });
});

describe("zoomAtCenter", () => {
    it("keeps the image point at the view center fixed", () => {
        const view = { width: 800, height: 600 };
        const vp: Viewport = { scale: 0.5, x: 30, y: 40 };
        const center = { x: 400, y: 300 };
        const before = screenToWorld(vp, center);
        const next = zoomAtCenter(vp, view, 1.25);
        expect(next.scale).toBeCloseTo(0.625);
        const after = screenToWorld(next, center);
        expect(after.x).toBeCloseTo(before.x);
        expect(after.y).toBeCloseTo(before.y);
    });
});

describe("wheelFactor", () => {
    it("zooms in for negative deltaY and out for positive", () => {
        expect(wheelFactor(-100)).toBeGreaterThan(1);
        expect(wheelFactor(100)).toBeLessThan(1);
        expect(wheelFactor(0)).toBe(1);
    });

    it("is symmetric: in and out by the same delta cancel out", () => {
        expect(wheelFactor(-120) * wheelFactor(120)).toBeCloseTo(1);
    });
});
