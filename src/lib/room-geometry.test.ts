import { describe, expect, it } from "vitest";
import {
    boundsCm,
    containsPoint,
    edgeLengthsCm,
    hasNoZeroEdges,
    isSimplePolygon,
    labelPointCm,
    roomAreaM2,
    segmentsIntersect,
    setEdgeLength,
    shapeIdsInRoom,
    translatePoints,
    wallBandOutline,
} from "@/lib/room-geometry";
import type { PointCm } from "@/lib/plan-schema";

const pts = (...coords: [number, number][]): PointCm[] => coords.map(([x, y]) => ({ x, y }));
/** Four points as a tuple, for `segmentsIntersect(...seg(…))`. */
const seg = (...coords: [[number, number], [number, number], [number, number], [number, number]]) =>
    pts(...coords) as [PointCm, PointCm, PointCm, PointCm];

const WOHNEN = pts([0, 0], [337.5, 0], [337.5, 560], [0, 560]);
/** L-shaped room from the spec: Kante 3 is 120 cm long. */
const L_ROOM = pts([0, 0], [400, 0], [400, 120], [280, 120], [280, 300], [0, 300]);
/** Thin L whose centroid lies outside the room. */
const THIN_L = pts([0, 0], [400, 0], [400, 50], [50, 50], [50, 400], [0, 400]);

describe("edgeLengthsCm", () => {
    it("gives 337,5 / 560 / 337,5 / 560 for the 337,5 × 560 cm rectangle", () => {
        expect(edgeLengthsCm(WOHNEN)).toEqual([337.5, 560, 337.5, 560]);
    });

    it("closes the outline with the edge from the last to the first point", () => {
        expect(edgeLengthsCm(pts([0, 0], [300, 0], [0, 400]))).toEqual([300, 500, 400]);
    });
});

describe("hasNoZeroEdges", () => {
    it("is true for a rectangle", () => {
        expect(hasNoZeroEdges(WOHNEN)).toBe(true);
    });

    it("is false for a doubled point", () => {
        expect(hasNoZeroEdges(pts([0, 0], [300, 0], [300, 0], [300, 200]))).toBe(false);
    });

    it("is false if the last point repeats the first one", () => {
        expect(hasNoZeroEdges(pts([0, 0], [300, 0], [300, 200], [0, 0]))).toBe(false);
    });

    it("accepts an edge of 0,1 cm", () => {
        expect(hasNoZeroEdges(pts([0, 0], [0.1, 0], [0.1, 100]))).toBe(true);
    });
});

describe("segmentsIntersect", () => {
    const [a, b, c, d] = pts([0, 0], [100, 100], [0, 100], [100, 0]);

    it("detects crossing segments", () => {
        expect(segmentsIntersect(a, b, c, d)).toBe(true);
    });

    it("detects touching segments", () => {
        expect(segmentsIntersect(...seg([0, 0], [100, 0], [50, 0], [50, 50]))).toBe(true);
    });

    it("detects overlapping collinear segments", () => {
        expect(segmentsIntersect(...seg([0, 0], [100, 0], [50, 0], [150, 0]))).toBe(true);
    });

    it("is false for parallel or separate segments", () => {
        expect(segmentsIntersect(...seg([0, 0], [100, 0], [0, 10], [100, 10]))).toBe(false);
        expect(segmentsIntersect(...seg([0, 0], [100, 0], [101, 0], [200, 0]))).toBe(false);
        expect(segmentsIntersect(...seg([0, 0], [100, 100], [60, 0], [100, 40]))).toBe(false);
    });
});

describe("isSimplePolygon", () => {
    it("accepts a rectangle, a triangle and an L-shape", () => {
        expect(isSimplePolygon(WOHNEN)).toBe(true);
        expect(isSimplePolygon(pts([0, 0], [300, 0], [0, 400]))).toBe(true);
        expect(isSimplePolygon(L_ROOM)).toBe(true);
    });

    it("rejects the loop (0,0), (300,300), (300,0), (0,300)", () => {
        expect(isSimplePolygon(pts([0, 0], [300, 300], [300, 0], [0, 300]))).toBe(false);
    });

    it("rejects an edge doubling back on the line of its predecessor", () => {
        expect(isSimplePolygon(pts([0, 0], [300, 0], [200, 0], [200, 100]))).toBe(false);
    });

    it("rejects a flat triangle", () => {
        expect(isSimplePolygon(pts([0, 0], [100, 0], [200, 0]))).toBe(false);
    });

    it("rejects an outline touching itself in a corner", () => {
        expect(isSimplePolygon(pts([0, 0], [200, 0], [200, 100], [100, 0], [100, 200], [0, 200]))).toBe(false);
    });

    it("rejects fewer than 3 points", () => {
        expect(isSimplePolygon(pts([0, 0], [300, 0]))).toBe(false);
    });
});

describe("boundsCm", () => {
    it("encloses all points", () => {
        expect(boundsCm(pts([10, -20], [50, 0], [-5, 40]))).toEqual({ x: -5, y: -20, width: 55, height: 60 });
    });
});

describe("containsPoint", () => {
    it("tells inside from outside", () => {
        expect(containsPoint(L_ROOM, { x: 100, y: 200 })).toBe(true);
        expect(containsPoint(L_ROOM, { x: 350, y: 200 })).toBe(false);
        expect(containsPoint(L_ROOM, { x: -1, y: 10 })).toBe(false);
    });
});

describe("shapeIdsInRoom", () => {
    const WOHNEN_400 = pts([0, 0], [400, 0], [400, 500], [0, 500]);
    const at = (id: string, x: number, y: number) => ({ id, x, y });

    it("takes a shape whose center lies inside, not one outside", () => {
        expect(shapeIdsInRoom(WOHNEN_400, [at("sofa", 200, 100), at("tisch", 600, 100)])).toEqual(["sofa"]);
    });

    it("decides by the center only (Mittelpunkt entscheidet)", () => {
        // Schrank 100 cm breit at 380 cm reaches 30 cm beyond the edge; Regal at 430 cm reaches 20 cm in.
        expect(shapeIdsInRoom(WOHNEN_400, [at("schrank", 380, 200), at("regal", 430, 200)])).toEqual(["schrank"]);
    });

    it("leaves out a shape in the cut-out corner of an L-shaped room", () => {
        expect(shapeIdsInRoom(L_ROOM, [at("in", 100, 200), at("eck", 350, 200)])).toEqual(["in"]);
    });

    it("keeps the order of the shapes and gives an empty list for no shapes", () => {
        expect(shapeIdsInRoom(WOHNEN_400, [at("c", 300, 300), at("a", 10, 10), at("b", 200, 400)])).toEqual(["c", "a", "b"]);
        expect(shapeIdsInRoom(WOHNEN_400, [])).toEqual([]);
    });
});

describe("labelPointCm", () => {
    it("is the center of a rectangle", () => {
        expect(labelPointCm(WOHNEN)).toEqual({ x: 168.75, y: 280 });
    });

    it.each([
        ["the L-shape from the spec", L_ROOM],
        ["a thin L-shape whose centroid lies outside", THIN_L],
    ])("lies inside %s", (_name, points) => {
        expect(containsPoint(points, labelPointCm(points))).toBe(true);
    });

    it("uses the middle of the horizontal section if the centroid lies outside", () => {
        const label = labelPointCm(THIN_L);
        expect(label.x).toBeCloseTo(25);
        expect(label.y).toBeCloseTo(118.33, 1);
    });
});

describe("translatePoints", () => {
    it("moves all points and keeps the edge lengths", () => {
        const moved = translatePoints(WOHNEN, 25, -10);
        expect(moved).toEqual(pts([25, -10], [362.5, -10], [362.5, 550], [25, 550]));
        expect(edgeLengthsCm(moved)).toEqual(edgeLengthsCm(WOHNEN));
    });
});

describe("setEdgeLength", () => {
    it("keeps a rectangle a rectangle: Kante 1 → 350 cm also makes Kante 3 350 cm", () => {
        const result = setEdgeLength(WOHNEN, 0, 350);
        expect(result).toEqual({ ok: true, points: pts([0, 0], [350, 0], [350, 560], [0, 560]) });
        if (!result.ok) return;
        expect(edgeLengthsCm(result.points)).toEqual([350, 560, 350, 560]);
    });

    it("moves the two points after the edge of a triangle", () => {
        expect(setEdgeLength(pts([0, 0], [300, 0], [0, 400]), 0, 400)).toEqual({
            ok: true,
            points: pts([0, 0], [400, 0], [100, 400]),
        });
    });

    it("rejects shortening Kante 1 of the L-shape from 400 to 280 cm: Kante 3 would vanish", () => {
        expect(setEdgeLength(L_ROOM, 0, 280)).toEqual({ ok: false, reason: "too-short", edgeIndex: 2 });
    });

    it("rejects a compensating edge that would point the other way", () => {
        expect(setEdgeLength(L_ROOM, 0, 250)).toEqual({ ok: false, reason: "too-short", edgeIndex: 2 });
    });

    it("rejects a change creating a loop", () => {
        // Lengthening the top of a U-shaped notch pushes its right part through the room.
        const room = pts([0, 0], [100, 0], [100, 100], [200, 100], [200, 0], [300, 0], [300, 200], [0, 200]);
        expect(setEdgeLength(room, 1, 250)).toEqual({ ok: false, reason: "intersects" });
    });

    it("moves the points 0 and 1 for the last edge", () => {
        expect(setEdgeLength(WOHNEN, 3, 600)).toEqual({
            ok: true,
            points: pts([0, -40], [337.5, -40], [337.5, 560], [0, 560]),
        });
    });

    it("rounds the result to 0,1 cm", () => {
        const result = setEdgeLength(pts([0, 0], [300, 0], [300, 300]), 2, 400);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        for (const p of result.points) {
            expect(Math.round(p.x * 10) / 10).toBe(p.x);
            expect(Math.round(p.y * 10) / 10).toBe(p.y);
        }
        expect(result.points[0]).toEqual({ x: 17.2, y: 17.2 });
    });

    it("rejects a length of 0 cm for the edge itself", () => {
        expect(setEdgeLength(WOHNEN, 1, 0)).toEqual({ ok: false, reason: "too-short", edgeIndex: 1 });
    });
});

describe("wallBandOutline", () => {
    /** Rectangle (0|0)–(500|400), clockwise on screen; edge 0 is the top one, edge 3 the left one. */
    const RECT = pts([0, 0], [500, 0], [500, 400], [0, 400]);
    const close = (actual: PointCm[], expected: PointCm[]) => {
        expect(actual).toHaveLength(expected.length);
        actual.forEach((p, i) => {
            expect(p.x).toBeCloseTo(expected[i].x, 6);
            expect(p.y).toBeCloseTo(expected[i].y, 6);
        });
    };

    it("moves every edge of the rectangle 15 cm outwards and meets at the corners", () => {
        close(wallBandOutline(RECT, [15, 15, 15, 15]), pts([-15, -15], [515, -15], [515, 415], [-15, 415]));
    });

    it("gives the same corners for the rectangle counter-clockwise", () => {
        const ccw = [...RECT].reverse();
        close(wallBandOutline(ccw, [15, 15, 15, 15]), pts([-15, 415], [515, 415], [515, -15], [-15, -15]));
    });

    it("reaches (−15 | −36,5) at the top left corner with 36,5 cm on top and 15 cm on the left", () => {
        const outline = wallBandOutline(RECT, [36.5, 15, 15, 15]);
        close(outline, pts([-15, -36.5], [515, -36.5], [515, 415], [-15, 415]));
    });

    it("joins the concave corner of an L-shaped room at the intersection of the moved edges", () => {
        // L_ROOM: (0,0) (400,0) (400,120) (280,120) (280,300) (0,300), clockwise; the concave corner is (280|120).
        const outline = wallBandOutline(L_ROOM, [15, 15, 15, 24, 15, 15]);
        close(outline, pts([-15, -15], [415, -15], [415, 135], [304, 135], [304, 315], [-15, 315]));
    });

    it("makes a step between collinear edges of 15 and 24 cm", () => {
        const room = pts([0, 0], [200, 0], [400, 0], [400, 300], [0, 300]);
        const outline = wallBandOutline(room, [15, 24, 15, 15, 15]);
        close(outline, pts([-15, -15], [200, -15], [200, -24], [415, -24], [415, 315], [-15, 315]));
    });

    it("keeps one point between collinear edges of the same thickness", () => {
        const room = pts([0, 0], [200, 0], [400, 0], [400, 300], [0, 300]);
        close(wallBandOutline(room, [15, 15, 15, 15, 15]), pts([-15, -15], [200, -15], [415, -15], [415, 315], [-15, 315]));
    });

    it("bevels a very sharp corner instead of a long miter tip", () => {
        const triangle = pts([0, 0], [400, 0], [0, 30]);
        const outline = wallBandOutline(triangle, [15, 15, 15]);
        expect(outline.length).toBe(4);
        for (const p of outline) {
            const nearest = Math.min(...triangle.map((c) => Math.hypot(p.x - c.x, p.y - c.y)));
            expect(nearest).toBeLessThanOrEqual(2 * 15 + 1e-6);
        }
    });

    it("gives finite points for 100 cm on a 20 cm edge", () => {
        const room = pts([0, 0], [20, 0], [20, 200], [0, 200]);
        const outline = wallBandOutline(room, [100, 15, 15, 15]);
        expect(outline.length).toBeGreaterThanOrEqual(4);
        for (const p of outline) {
            expect(Number.isFinite(p.x)).toBe(true);
            expect(Number.isFinite(p.y)).toBe(true);
        }
        expect(Math.min(...outline.map((p) => p.y))).toBeCloseTo(-100, 6);
    });

    it("does not change its input", () => {
        const input = structuredClone(RECT);
        wallBandOutline(input, [36.5, 15, 15, 15]);
        expect(input).toEqual(RECT);
    });
});

describe("roomAreaM2", () => {
    const kitchen: PointCm[] = [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 312.5 },
        { x: 0, y: 312.5 },
    ];

    it("gives the inner area of a rectangle in m²", () => {
        expect(roomAreaM2(kitchen)).toBeCloseTo(12.5, 10);
    });

    it("gives the area of an L-shaped room", () => {
        // 400 × 400 minus a 200 × 200 corner = 12 m².
        const l: PointCm[] = [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
            { x: 400, y: 200 },
            { x: 200, y: 200 },
            { x: 200, y: 400 },
            { x: 0, y: 400 },
        ];
        expect(roomAreaM2(l)).toBeCloseTo(12, 10);
    });

    it("is positive for counter-clockwise points too", () => {
        expect(roomAreaM2([...kitchen].reverse())).toBeCloseTo(12.5, 10);
    });
});
