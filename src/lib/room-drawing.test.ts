import { describe, expect, it } from "vitest";
import {
    canAppendPoint,
    canClose,
    draftGuideSources,
    edgeEndAtPointer,
    parseOffsetCm,
    pointAtDistance,
    pointOnWall,
    resolveDraftPointer,
    roundPointCm,
    snapDirection,
    snapToCorner,
    snapToGuides,
    snapToWall,
    wallDistances,
    wallLines,
    type WallLine,
} from "@/lib/room-drawing";
import type { PointCm, Room } from "@/lib/plan-schema";

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

describe("draftGuideSources", () => {
    it("leaves out the last corner and lists own corners before room corners", () => {
        expect(draftGuideSources(pts([0, 0], [300, 0], [300, 200]), pts([500, 500]))).toEqual(pts([0, 0], [300, 0], [500, 500]));
        expect(draftGuideSources([], pts([500, 500]))).toEqual(pts([500, 500]));
    });
});

describe("snapToGuides", () => {
    const sources = pts([0, 0], [300, 200]);

    it("snaps within the tolerance, not beyond", () => {
        expect(snapToGuides(p(6, 100), sources, ["x"], 8)).toEqual({
            point: { x: 0, y: 100 },
            guides: [{ axis: "x", valueCm: 0, from: { x: 0, y: 0 } }],
        });
        expect(snapToGuides(p(12, 100), sources, ["x"], 8)).toEqual({ point: { x: 12, y: 100 }, guides: [] });
    });

    it("only snaps the requested axis", () => {
        expect(snapToGuides(p(6, 203), sources, ["x"], 8).point).toEqual({ x: 0, y: 203 });
        expect(snapToGuides(p(6, 203), sources, ["y"], 8).point).toEqual({ x: 6, y: 200 });
    });

    it("snaps both axes to two guides", () => {
        const snapped = snapToGuides(p(4, 197), sources, ["x", "y"], 8);
        expect(snapped.point).toEqual({ x: 0, y: 200 });
        expect(snapped.guides).toEqual([
            { axis: "x", valueCm: 0, from: { x: 0, y: 0 } },
            { axis: "y", valueCm: 200, from: { x: 300, y: 200 } },
        ]);
    });

    it("takes the nearest guide and the first one on a tie", () => {
        expect(snapToGuides(p(3, 0), pts([0, 50], [5, 50]), ["x"], 8).point.x).toBe(5);
        const tie = snapToGuides(p(5, 50), draftGuideSources(pts([0, 0], [100, 0]), pts([10, 300])), ["x"], 8);
        expect(tie.guides[0].from).toEqual({ x: 0, y: 0 });
    });
});

describe("resolveDraftPointer", () => {
    const roomCorners = pts([350, 0], [700, 0]);
    /** 8 screen px at 100 % zoom. */
    const radius = 8;
    const opts = (free = false, guides = true) => ({ radiusCm: radius, free, guides, walls: null, stepCm: 5 });

    it("puts the start point exactly on a room corner 5 screen px away", () => {
        expect(resolveDraftPointer([], p(354, 3), roomCorners, opts())).toEqual({
            point: { x: 350, y: 0 },
            snapped: true,
            closes: false,
            guides: [],
        });
    });

    it("uses the rounded pointer as start point away from corners and guides", () => {
        expect(resolveDraftPointer([], p(100.04, 99.96), roomCorners, opts())).toEqual({
            point: { x: 100, y: 100 },
            snapped: false,
            closes: false,
            guides: [],
        });
    });

    it("snaps the direction of the next edge", () => {
        expect(resolveDraftPointer(pts([100, 100]), p(430, 108), [], opts()).point).toEqual({ x: 430, y: 100 });
        expect(resolveDraftPointer(pts([100, 100]), p(400, 200), [], opts(true)).point).toEqual({ x: 400, y: 200 });
    });

    it("lets a corner win over the direction", () => {
        expect(resolveDraftPointer(pts([0, 30]), p(345, 4), roomCorners, opts()).point).toEqual({ x: 350, y: 0 });
    });

    it("closes on the start point from 3 corners on", () => {
        const three = pts([0, 0], [300, 0], [300, 300]);
        expect(resolveDraftPointer(three, p(3, -4), [], opts())).toEqual({
            point: { x: 0, y: 0 },
            snapped: true,
            closes: true,
            guides: [],
        });
        expect(resolveDraftPointer(three.slice(0, 2), p(3, -4), [], opts()).closes).toBe(false);
    });

    it("has no point on the last corner", () => {
        expect(resolveDraftPointer(pts([0, 0], [300, 0]), p(300, 0), [], opts()).point).toBeNull();
    });

    describe("guides", () => {
        const three = pts([0, 0], [300, 0], [300, 200]);
        const wohnen = pts([0, 0], [500, 0], [500, 400], [0, 400]);

        it("makes the opposite edge as long as the first one (Gegenkante gleich lang)", () => {
            expect(resolveDraftPointer(three, p(6, 203), [], opts())).toEqual({
                point: { x: 0, y: 200 },
                snapped: false,
                closes: false,
                guides: [{ axis: "x", valueCm: 0, from: { x: 0, y: 0 } }],
            });
        });

        it("does not snap beyond the tolerance (Außerhalb der Toleranz)", () => {
            expect(resolveDraftPointer(three, p(12, 203), [], opts())).toMatchObject({ point: { x: 12, y: 200 }, guides: [] });
        });

        it("aligns with the neighbouring room (Bündig mit dem Nachbarraum)", () => {
            const r = resolveDraftPointer(pts([600, 0], [900, 0]), p(902, 395), wohnen, opts());
            expect(r.point).toEqual({ x: 900, y: 400 });
            expect(r.guides).toHaveLength(1);
            expect(r.guides[0]).toMatchObject({ axis: "y", valueCm: 400 });
        });

        it("snaps the first point to a room's line (Erster Punkt in der Flucht)", () => {
            expect(resolveDraftPointer([], p(600, 404), wohnen, opts()).point).toEqual({ x: 600, y: 400 });
        });

        it("snaps each axis with a free angle (Freier Winkel an der Hilfslinie)", () => {
            expect(resolveDraftPointer(pts([0, 0], [300, 0]), p(4, 197), [], opts(true)).point).toEqual({ x: 0, y: 197 });
        });

        it("keeps a straight edge straight: only the axis across the edge snaps", () => {
            // Horizontal edge from (300, 200); (150, 3) is near y = 0 but y must stay 200.
            expect(resolveDraftPointer(three, p(150, 203), pts([150, 3]), opts()).point).toEqual({ x: 150, y: 200 });
        });

        it("lets the start point win over a guide (Startpunkt vor Hilfslinie)", () => {
            expect(resolveDraftPointer(three, p(3, 4), [], opts())).toMatchObject({ point: { x: 0, y: 0 }, closes: true, guides: [] });
        });

        it("does not snap to guides when they are off (Strg, Schalter aus)", () => {
            expect(resolveDraftPointer(three, p(6, 203), [], opts(false, false))).toEqual({
                point: { x: 6, y: 200 },
                snapped: false,
                closes: false,
                guides: [],
            });
            // Corners still snap.
            expect(resolveDraftPointer([], p(354, 3), roomCorners, opts(false, false)).point).toEqual({ x: 350, y: 0 });
        });

        it("never pulls the corner onto the last one", () => {
            // Guide x = 300 through (300, 0) would collapse the edge from (300, 200).
            expect(resolveDraftPointer(three, p(295, 201), [], opts()).point).toEqual({ x: 295, y: 200 });
        });
    });
});

const room = (id: string, points: PointCm[], thickness: number | number[] = 15): Room => ({
    id,
    name: id,
    pointsCm: points,
    openings: [],
    wallThicknessCm: Array.isArray(thickness) ? thickness : points.map(() => thickness),
    color: null,
    locked: false,
});

/** „Wohnen“: 500 cm × 400 cm, clockwise on screen, 15 cm walls. */
const WOHNEN = room("wohnen", pts([0, 0], [500, 0], [500, 400], [0, 400]));
const line = (lines: WallLine[], edgeIndex: number, face: "inner" | "outer") =>
    lines.find((l) => l.source.kind === "room" && l.source.edgeIndex === edgeIndex && l.source.face === face)!;

describe("wallLines", () => {
    it("gives the inner and outer line of each edge; the top outer line runs at y = −15 cm", () => {
        const lines = wallLines([WOHNEN]);
        expect(lines).toHaveLength(8);
        expect(line(lines, 0, "inner")).toEqual({
            source: { kind: "room", roomId: "wohnen", edgeIndex: 0, face: "inner" },
            start: { x: 0, y: 0 },
            end: { x: 500, y: 0 },
            lengthCm: 500,
            outwardNormal: { x: 0, y: -1 },
        });
        expect(line(lines, 0, "outer")).toMatchObject({ start: { x: 0, y: -15 }, end: { x: 500, y: -15 }, lengthCm: 500 });
        expect(line(lines, 1, "outer")).toMatchObject({ start: { x: 515, y: 0 }, end: { x: 515, y: 400 } });
    });

    it("puts the outer side outside for a counter-clockwise room too", () => {
        const ccw = room("ccw", pts([0, 0], [0, 400], [500, 400], [500, 0]));
        const top = wallLines([ccw]).find((l) => l.source.kind === "room" && l.source.face === "outer" && l.start.y < 0)!;
        expect(top).toMatchObject({ source: { edgeIndex: 3 }, start: { x: 500, y: -15 }, end: { x: 0, y: -15 } });
    });

    it("moves each edge by its own wall thickness", () => {
        const lines = wallLines([room("w", pts([0, 0], [500, 0], [500, 400], [0, 400]), [36.5, 24, 15, 11.5])]);
        expect(line(lines, 0, "outer").start).toEqual({ x: 0, y: -36.5 });
        expect(line(lines, 1, "outer").start).toEqual({ x: 524, y: 0 });
        expect(line(lines, 3, "outer").start).toEqual({ x: -11.5, y: 400 });
    });

    it("leaves out edges of 0 cm", () => {
        const lines = wallLines([room("z", pts([0, 0], [500, 0], [500, 0], [500, 400], [0, 400]))]);
        expect(lines.map((l) => (l.source.kind === "room" ? l.source.edgeIndex : -1))).not.toContain(1);
        expect(lines).toHaveLength(8);
    });
});

describe("snapToWall", () => {
    const lines = wallLines([WOHNEN]);
    const snap = (x: number, y: number, stepCm = 5) => snapToWall(p(x, y), lines, { radiusCm: 8, stepCm });

    it("snaps (262 cm, −17 cm) to (260 cm, −15 cm) on the outer side, 240 cm from the nearer right end", () => {
        expect(snap(262, -17)).toMatchObject({
            line: { source: { edgeIndex: 0, face: "outer" } },
            fromEnd: "end",
            offsetCm: 240,
            point: { x: 260, y: -15 },
        });
        expect(snap(237, -17)).toMatchObject({ fromEnd: "start", offsetCm: 235, point: { x: 235, y: -15 } });
    });

    it("snaps (262 cm, 4 cm) to (260 cm, 0 cm) on the inner side", () => {
        expect(snap(262, 4)).toMatchObject({ line: { source: { edgeIndex: 0, face: "inner" } }, point: { x: 260, y: 0 } });
    });

    it("counts from the nearer end: (437 cm, −14 cm) → (435 cm, −15 cm), 65 cm from the right end", () => {
        expect(snap(437, -14)).toMatchObject({ fromEnd: "end", offsetCm: 65, point: { x: 435, y: -15 } });
    });

    it("snaps in 1-cm steps with Alt: (262,4 cm, −17 cm) → (262 cm, −15 cm)", () => {
        expect(snap(262.4, -17, 1)?.point).toEqual({ x: 262, y: -15 });
    });

    it("snaps on a slanted edge from (0, 0) to (300, 400): 262 cm along → (156 cm, 208 cm)", () => {
        const slanted = wallLines([room("s", pts([0, 0], [300, 400], [0, 400]))]);
        const position = snapToWall(p(157.2, 209.6), slanted, { radiusCm: 8, stepCm: 5 });
        expect(position).toMatchObject({ point: { x: 156, y: 208 } });
        expect(wallDistances(position!)).toEqual({ fromStartCm: 260, fromEndCm: 240 });
    });

    it("is null beside the end of a wall or too far away", () => {
        expect(snap(530, -15)).toBeNull();
        expect(snap(262, -60)).toBeNull();
    });

    it("takes the nearest of two lines", () => {
        // A 6-cm wall: both sides are within reach; the nearer one wins.
        const thin = wallLines([room("t", pts([0, 0], [500, 0], [500, 400], [0, 400]), 6)]);
        expect(snapToWall(p(100, -4), thin, { radiusCm: 8, stepCm: 5 })).toMatchObject({ line: { source: { face: "outer" } } });
        expect(snapToWall(p(100, -2), thin, { radiusCm: 8, stepCm: 5 })).toMatchObject({ line: { source: { face: "inner" } } });
    });

    it("keeps the point on the line", () => {
        expect(snap(499, -15, 7)).toMatchObject({ fromEnd: "end", offsetCm: 0, point: { x: 500, y: -15 } });
        const short = wallLines([room("k", pts([0, 0], [12, 0], [12, 400], [0, 400]))]);
        expect(snapToWall(p(5.9, -15), short, { radiusCm: 8, stepCm: 10 })).toMatchObject({ offsetCm: 10, point: { x: 10, y: -15 } });
    });
});

describe("pointOnWall, wallDistances and parseOffsetCm", () => {
    const top = line(wallLines([WOHNEN]), 0, "outer");

    it("puts 260 cm from the left end at (260 cm, −15 cm), from the right end at (240 cm, −15 cm)", () => {
        expect(pointOnWall(top, "start", 260)).toEqual({ x: 260, y: -15 });
        expect(pointOnWall(top, "end", 260)).toEqual({ x: 240, y: -15 });
    });

    it("puts 0 cm on the reference end", () => {
        expect(pointOnWall(top, "start", 0)).toEqual({ x: 0, y: -15 });
        expect(pointOnWall(top, "end", 0)).toEqual({ x: 500, y: -15 });
    });

    it("gives both distances", () => {
        expect(wallDistances({ line: top, fromEnd: "start", offsetCm: 260, point: p(260, -15) })).toEqual({
            fromStartCm: 260,
            fromEndCm: 240,
        });
        expect(wallDistances({ line: top, fromEnd: "end", offsetCm: 65, point: p(435, -15) })).toEqual({
            fromStartCm: 435,
            fromEndCm: 65,
        });
    });

    it("parses „260“, „12,5“, „12.5“ and „0“; rejects empty and other text", () => {
        expect(parseOffsetCm("260")).toBe(260);
        expect(parseOffsetCm("12,5")).toBe(12.5);
        expect(parseOffsetCm("12.5")).toBe(12.5);
        expect(parseOffsetCm("0")).toBe(0);
        expect(parseOffsetCm("")).toBeNull();
        expect(parseOffsetCm("12,")).toBeNull();
        expect(parseOffsetCm("-5")).toBeNull();
    });
});

describe("resolveDraftPointer with walls", () => {
    const wohnenLines = wallLines([WOHNEN]);
    const wallOpts = (walls: WallLine[] | null = wohnenLines, stepCm = 5) => ({
        radiusCm: 8,
        free: false,
        guides: true,
        walls,
        stepCm,
    });

    it("lets a room corner win over the wall position at (497 cm, 3 cm)", () => {
        const resolved = resolveDraftPointer([], p(497, 3), WOHNEN.pointsCm, wallOpts());
        expect(resolved).toEqual({ point: { x: 500, y: 0 }, snapped: true, closes: false, guides: [] });
    });

    it("lets the wall position win over a guide (corner of „Bad“ at x = 263 cm)", () => {
        const corners = [...WOHNEN.pointsCm, p(263, -300)];
        const resolved = resolveDraftPointer([], p(262, -17), corners, wallOpts());
        expect(resolved.point).toEqual({ x: 260, y: -15 });
        expect(resolved.guides).toEqual([]);
        expect(resolved.wall).toMatchObject({ offsetCm: 240, fromEnd: "end" });
    });

    it("has no wall position with walls off", () => {
        const resolved = resolveDraftPointer([], p(262, -17), WOHNEN.pointsCm, wallOpts(null));
        expect(resolved.point).toEqual({ x: 262, y: -17 });
        expect(resolved.wall).toBeUndefined();
    });

    it("has no wall position from the second corner on", () => {
        const resolved = resolveDraftPointer(pts([100, -200]), p(102, -17), WOHNEN.pointsCm, wallOpts());
        expect(resolved.point).toEqual({ x: 100, y: -17 });
        expect(resolved.wall).toBeUndefined();
    });
});
