import { describe, expect, it } from "vitest";
import { getLabelAnchorCm, getOutlineCm, MAX_CURVE_DEVIATION_CM, sampleEllipseArc } from "@/lib/outline";
import type { PointCm, Shape } from "@/lib/plan-schema";
import { rect, STYLE, uuid } from "@/test/plan-fixtures";

function ellipse(widthCm: number, depthCm: number, overrides: Partial<Shape> = {}): Shape {
    return {
        id: uuid(50),
        kind: "ellipse",
        x: 0,
        y: 0,
        rotationDeg: 0,
        mirrored: false,
        style: STYLE,
        widthCm,
        depthCm,
        ...overrides,
    } as Shape;
}

const dist = (p: PointCm, q: PointCm) => Math.hypot(p.x - q.x, p.y - q.y);
const mid = (p: PointCm, q: PointCm): PointCm => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
const hasPoint = (points: PointCm[], q: PointCm) => points.some((p) => dist(p, q) < 1e-9);

function outline(shape: Shape): PointCm[] {
    const points = getOutlineCm(shape);
    if (!points) throw new Error("expected an outline");
    return points;
}

/** Each consecutive pair of points, including last → first. */
function segments(points: PointCm[]): Array<[PointCm, PointCm]> {
    return points.map((p, i) => [p, points[(i + 1) % points.length]]);
}

describe("getOutlineCm", () => {
    it("does not depend on position or rotation", () => {
        const a = rect(1, { widthCm: 100, depthCm: 60, x: 0, y: 0, rotationDeg: 0 });
        const b = rect(2, { widthCm: 100, depthCm: 60, x: 400, y: 250, rotationDeg: 45 });
        expect(getOutlineCm(a)).toEqual(getOutlineCm(b));
    });

    it("is the same for the same shape", () => {
        const shape = rect(1, { widthCm: 220, depthCm: 95, cornerRadiusCm: 10 });
        expect(getOutlineCm(shape)).toEqual(getOutlineCm(structuredClone(shape)));
    });

    describe("rectangle", () => {
        it("consists of the four corners without corner radius", () => {
            expect(getOutlineCm(rect(1, { widthCm: 100, depthCm: 60, cornerRadiusCm: 0 }))).toEqual([
                { x: -50, y: -30 },
                { x: 50, y: -30 },
                { x: 50, y: 30 },
                { x: -50, y: 30 },
            ]);
        });

        it("replaces each corner by a quarter arc", () => {
            const points = outline(rect(1, { widthCm: 220, depthCm: 95, cornerRadiusCm: 10 }));
            for (const p of points) {
                expect(p.x).toBeGreaterThanOrEqual(-110);
                expect(p.x).toBeLessThanOrEqual(110);
                expect(p.y).toBeGreaterThanOrEqual(-47.5);
                expect(p.y).toBeLessThanOrEqual(47.5);
            }
            expect(hasPoint(points, { x: -100, y: -47.5 })).toBe(true);
            expect(hasPoint(points, { x: 110, y: -37.5 })).toBe(true);

            const center = { x: 100, y: -37.5 };
            const topRightArc = points.filter((p) => p.x >= 100 && p.y <= -37.5);
            expect(topRightArc.length).toBeGreaterThanOrEqual(3);
            for (const p of topRightArc) expect(Math.abs(dist(p, center) - 10)).toBeLessThan(0.01);
        });

        it.each([2, 10, 45])("keeps the sagitta of arcs with radius %i cm within 0,5 cm", (r) => {
            const points = outline(rect(1, { widthCm: 200, depthCm: 100, cornerRadiusCm: r }));
            const centers = [
                { x: 100 - r, y: -50 + r },
                { x: 100 - r, y: 50 - r },
                { x: -100 + r, y: 50 - r },
                { x: -100 + r, y: -50 + r },
            ];
            let arcSegments = 0;
            for (const [p, q] of segments(points)) {
                // Arc segments: both ends lie on the same corner circle (straight edges never do).
                const c = centers.find((c) => Math.abs(dist(p, c) - r) < 1e-9 && Math.abs(dist(q, c) - r) < 1e-9);
                if (!c) continue;
                arcSegments++;
                expect(r - dist(mid(p, q), c)).toBeLessThanOrEqual(MAX_CURVE_DEVIATION_CM);
            }
            expect(arcSegments).toBeGreaterThanOrEqual(8);
        });

        it("has no duplicate points when the radius is half the shorter side", () => {
            const points = outline(rect(1, { widthCm: 200, depthCm: 60, cornerRadiusCm: 30 }));
            for (const [p, q] of segments(points)) expect(dist(p, q)).toBeGreaterThan(0);
        });
    });

    describe("ellipse", () => {
        it("contains the four vertices of a round table, all 40 cm from the center", () => {
            const points = outline(ellipse(80, 80));
            for (const v of [
                { x: 40, y: 0 },
                { x: 0, y: 40 },
                { x: -40, y: 0 },
                { x: 0, y: -40 },
            ]) {
                expect(points).toContainEqual(v);
            }
            for (const p of points) expect(Math.abs(Math.hypot(p.x, p.y) - 40)).toBeLessThan(0.01);
        });

        it("spans the full width and depth of an oval table", () => {
            const points = outline(ellipse(200, 100));
            const xs = points.map((p) => p.x);
            const ys = points.map((p) => p.y);
            expect(Math.min(...xs)).toBe(-100);
            expect(Math.max(...xs)).toBe(100);
            expect(Math.min(...ys)).toBe(-50);
            expect(Math.max(...ys)).toBe(50);
        });

        it.each([
            [10, 10],
            [80, 80],
            [400, 60],
            [1000, 1000],
        ])("deviates at most 0,5 cm from the exact ellipse (%i × %i cm)", (w, d) => {
            const a = w / 2;
            const b = d / 2;
            const points = outline(ellipse(w, d));
            expect(points.length % 4).toBe(0);
            expect(points.length).toBeGreaterThanOrEqual(32);
            const n = points.length;
            for (let i = 0; i < n; i++) {
                const p = points[i];
                const q = points[(i + 1) % n];
                // Points sit at t = 2πi/n; the curve point at the middle parameter
                // bounds the distance from the chord midpoint to the ellipse.
                const t = (2 * Math.PI * (i + 0.5)) / n;
                const onCurve = { x: a * Math.cos(t), y: b * Math.sin(t) };
                expect(dist(mid(p, q), onCurve)).toBeLessThanOrEqual(MAX_CURVE_DEVIATION_CM);
                // and every point lies on the ellipse
                expect(Math.abs((p.x / a) ** 2 + (p.y / b) ** 2 - 1)).toBeLessThan(1e-9);
            }
        });
    });

    it("mirrors at the vertical axis and keeps the point order", () => {
        for (const shape of [rect(1, { widthCm: 220, depthCm: 95, cornerRadiusCm: 10 }), ellipse(200, 100)]) {
            const plain = outline(shape);
            const mirrored = outline({ ...shape, mirrored: true });
            expect(mirrored).toEqual(plain.map((p) => ({ x: p.x === 0 ? 0 : -p.x, y: p.y })));
        }
    });

    it("reports no outline for polygons yet, and leaves the shape unchanged", () => {
        const polygon: Shape = {
            id: uuid(60),
            kind: "polygon",
            x: 0,
            y: 0,
            rotationDeg: 0,
            mirrored: false,
            style: STYLE,
            pointsCm: [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 0, y: 10 },
            ],
        };
        const copy = structuredClone(polygon);
        expect(getOutlineCm(polygon)).toBeNull();
        expect(polygon).toEqual(copy);
    });
});

describe("getLabelAnchorCm", () => {
    it("is the center of rectangles and ellipses, also mirrored, never -0", () => {
        for (const shape of [rect(1, { widthCm: 220, depthCm: 95 }), ellipse(200, 100)]) {
            for (const mirrored of [false, true]) {
                const anchor = getLabelAnchorCm({ ...shape, mirrored });
                expect(anchor).toEqual({ x: 0, y: 0 });
                expect(Object.is(anchor.x, 0)).toBe(true);
                expect(Object.is(anchor.y, 0)).toBe(true);
            }
        }
    });
});

const base = { x: 0, y: 0, rotationDeg: 0, mirrored: false, style: STYLE };

function lShape(widthCm: number, depthCm: number, legAWidthCm: number, legBWidthCm: number, mirrored = false): Shape {
    return { ...base, id: uuid(70), kind: "l-shape", widthCm, depthCm, legAWidthCm, legBWidthCm, mirrored };
}

function uShape(widthCm: number, depthCm: number, baseWidthCm: number, sideWidthCm: number, mirrored = false): Shape {
    return { ...base, id: uuid(71), kind: "u-shape", widthCm, depthCm, baseWidthCm, sideWidthCm, mirrored };
}

function corner(widthCm: number, depthCm: number, mirrored = false): Shape {
    return { ...base, id: uuid(72), kind: "corner", widthCm, depthCm, mirrored };
}

function door(widthCm: number, mirrored = false): Shape {
    return { ...base, id: uuid(73), kind: "door-swing", widthCm, mirrored };
}

function bounds(points: PointCm[]) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** Largest distance between a chord midpoint and the ellipse (cx, cy, rx, ry), for consecutive arc points. */
function maxChordDeviation(arc: PointCm[], cx: number, cy: number, rx: number, ry: number): number {
    let max = 0;
    for (let i = 0; i + 1 < arc.length; i++) {
        const t0 = Math.atan2((arc[i].y - cy) / ry, (arc[i].x - cx) / rx);
        let t1 = Math.atan2((arc[i + 1].y - cy) / ry, (arc[i + 1].x - cx) / rx);
        if (t1 < t0 - Math.PI) t1 += 2 * Math.PI;
        const m = mid(arc[i], arc[i + 1]);
        // Distance from the chord midpoint to the curve, sampled finely between both ends.
        let nearest = Infinity;
        for (let k = 0; k <= 200; k++) {
            const t = t0 + ((t1 - t0) * k) / 200;
            nearest = Math.min(nearest, dist(m, { x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) }));
        }
        max = Math.max(max, nearest);
    }
    return max;
}

describe("sampleEllipseArc", () => {
    it("starts and ends exactly", () => {
        const arc = sampleEllipseArc(-45, -45, 90, 90, 0, 90);
        expect(arc[0]).toEqual({ x: 45, y: -45 });
        expect(arc[arc.length - 1]).toEqual({ x: -45, y: 45 });
        const door = sampleEllipseArc(-40, 40, 80, 80, -90, 0);
        expect(door[0]).toEqual({ x: -40, y: -40 });
        expect(door[door.length - 1]).toEqual({ x: 40, y: 40 });
    });

    it.each([
        [90, 90, 8],
        [300, 300, 14],
        [120, 80, 0],
    ])("keeps all points on the ellipse and chords within 0,5 cm (%i × %i cm)", (rx, ry, segments) => {
        const arc = sampleEllipseArc(0, 0, rx, ry, 0, 90);
        if (segments) expect(arc.length - 1).toBe(segments);
        expect(arc.length - 1).toBeGreaterThanOrEqual(6);
        for (const p of arc) {
            const t = Math.atan2(p.y / ry, p.x / rx);
            expect(dist(p, { x: rx * Math.cos(t), y: ry * Math.sin(t) })).toBeLessThan(0.01);
        }
        expect(maxChordDeviation(arc, 0, 0, rx, ry)).toBeLessThanOrEqual(MAX_CURVE_DEVIATION_CM);
    });

    it("uses at least 6 segments for tiny arcs", () => {
        expect(sampleEllipseArc(0, 0, 0.1, 0.1, 0, 90)).toHaveLength(7);
    });
});

describe("getOutlineCm – further shapes", () => {
    it("builds the L-shape with leg A at the bottom and leg B on the left", () => {
        expect(getOutlineCm(lShape(280, 200, 90, 90))).toEqual([
            { x: -140, y: 100 },
            { x: 140, y: 100 },
            { x: 140, y: 10 },
            { x: -50, y: 10 },
            { x: -50, y: -100 },
            { x: -140, y: -100 },
        ]);
    });

    it("puts the inner corner of an L-shape at the leg thicknesses", () => {
        expect(outline(lShape(240, 160, 60, 100))[3]).toEqual({ x: -20, y: 20 });
    });

    it("builds the U-shape open at the top", () => {
        expect(getOutlineCm(uShape(300, 240, 60, 60))).toEqual([
            { x: -150, y: -120 },
            { x: -90, y: -120 },
            { x: -90, y: 60 },
            { x: 90, y: 60 },
            { x: 90, y: -120 },
            { x: 150, y: -120 },
            { x: 150, y: 120 },
            { x: -150, y: 120 },
        ]);
    });

    it("builds a square corner as a quarter circle around the bottom left", () => {
        const points = outline(corner(90, 90));
        expect(points[0]).toEqual({ x: -45, y: 45 });
        expect(points[1]).toEqual({ x: 45, y: 45 });
        expect(points[points.length - 1]).toEqual({ x: -45, y: -45 });
        for (const p of points.slice(1)) expect(Math.abs(dist(p, { x: -45, y: 45 }) - 90)).toBeLessThanOrEqual(0.01);
    });

    it("builds an uneven corner as a quarter ellipse within 0,5 cm", () => {
        const arc = outline(corner(120, 80)).slice(1);
        for (const p of arc) expect(Math.abs(((p.x + 60) / 120) ** 2 + ((p.y - 40) / 80) ** 2 - 1)).toBeLessThan(1e-9);
        expect(maxChordDeviation(arc, -60, 40, 120, 80)).toBeLessThanOrEqual(MAX_CURVE_DEVIATION_CM);
    });

    it("builds a door: hinge, end of the leaf, then the swing to the bottom right", () => {
        const points = outline(door(80));
        expect(points[0]).toEqual({ x: -40, y: 40 });
        expect(points[1]).toEqual({ x: -40, y: -40 });
        expect(points[points.length - 1]).toEqual({ x: 40, y: 40 });
        for (const p of points.slice(1)) expect(Math.abs(dist(p, { x: -40, y: 40 }) - 80)).toBeLessThanOrEqual(0.01);
        expect(maxChordDeviation(points.slice(1), -40, 40, 80, 80)).toBeLessThanOrEqual(MAX_CURVE_DEVIATION_CM);
    });

    it.each([false, true])("fills the bounding rectangle exactly (mirrored: %s)", (mirrored) => {
        expect(bounds(outline(lShape(280, 200, 90, 90, mirrored)))).toEqual({ minX: -140, maxX: 140, minY: -100, maxY: 100 });
        expect(bounds(outline(uShape(300, 240, 60, 60, mirrored)))).toEqual({ minX: -150, maxX: 150, minY: -120, maxY: 120 });
        expect(bounds(outline(corner(120, 80, mirrored)))).toEqual({ minX: -60, maxX: 60, minY: -40, maxY: 40 });
        expect(bounds(outline(door(90, mirrored)))).toEqual({ minX: -45, maxX: 45, minY: -45, maxY: 45 });
    });

    it("mirrors the L-shape: leg B along the right edge", () => {
        const points = outline(lShape(280, 200, 90, 90, true));
        expect(points).toContainEqual({ x: 50, y: -100 });
        expect(points).toContainEqual({ x: 140, y: -100 });
        expect(points).not.toContainEqual({ x: -50, y: -100 });
    });

    it("mirrors the door: hinge bottom right, swing ends bottom left", () => {
        const points = outline(door(80, true));
        expect(points[0]).toEqual({ x: 40, y: 40 });
        expect(points[1]).toEqual({ x: 40, y: -40 });
        expect(points[points.length - 1]).toEqual({ x: -40, y: 40 });
    });
});

describe("getLabelAnchorCm – further shapes", () => {
    it("puts the label in the middle of leg A of an L-shape", () => {
        expect(getLabelAnchorCm(lShape(280, 200, 90, 90))).toEqual({ x: 0, y: 55 });
    });

    it("puts the label in the middle of the base of a U-shape", () => {
        expect(getLabelAnchorCm(uShape(300, 240, 60, 60))).toEqual({ x: 0, y: 90 });
    });

    it("puts the label at the centroid of a corner", () => {
        const anchor = getLabelAnchorCm(corner(90, 90));
        expect(anchor.x).toBeCloseTo(-6.8, 1);
        expect(anchor.y).toBeCloseTo(6.8, 1);
    });

    it("puts the label at the centroid of the swing, mirrored with the door", () => {
        const plain = getLabelAnchorCm(door(90));
        expect(plain.x).toBeCloseTo(-45 + 38.2, 1);
        expect(plain.y).toBeCloseTo(45 - 38.2, 1);
        const mirrored = getLabelAnchorCm(door(90, true));
        expect(mirrored).toEqual({ x: -plain.x, y: plain.y });
    });
});
