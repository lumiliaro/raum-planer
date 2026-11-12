import { describe, expect, it } from "vitest";
import type { Opening, PointCm, Shape } from "@/lib/plan-schema";
import {
    roomAtPoint,
    roomSnapLines,
    snapShapeMove,
    type ShapeExtent,
    type SnapAxis,
    type SnapLine,
    type SnapLineKind,
} from "@/lib/shape-snap";
import { rect, rectPoints, room, STYLE, uuid } from "@/test/plan-fixtures";

const TOP = 0;
const RIGHT = 1;

/** „Wohnen“ from the spec: (0 cm, 0 cm) … (500 cm, 400 cm), clockwise. */
const WOHNEN = rectPoints(0, 0, 500, 400);
const KUECHE = rectPoints(600, 0, 300, 400);

function opening(n: number, kind: Opening["kind"], edgeIndex: number, offsetCm: number, widthCm: number): Opening {
    return {
        id: uuid(100 + n),
        kind,
        edgeIndex,
        offsetCm,
        widthCm,
        swing: kind === "door" ? { hinge: "start", side: "inside" } : null,
        beforeFullEdge: null,
    };
}

const linesOf = (lines: SnapLine[], kind: SnapLineKind) =>
    lines
        .filter((l) => l.kind === kind)
        .map(({ axis, valueCm, features }) => ({ axis, valueCm, features }));

describe("roomSnapLines", () => {
    const expectedWalls = [
        { axis: "y", valueCm: 0, features: ["min"] },
        { axis: "x", valueCm: 500, features: ["max"] },
        { axis: "y", valueCm: 400, features: ["max"] },
        { axis: "x", valueCm: 0, features: ["min"] },
    ];

    it("gives the room center and the inner side of every wall (clockwise corners)", () => {
        const lines = roomSnapLines(room(1, "Wohnen", WOHNEN), []);
        expect(linesOf(lines, "room-center")).toEqual([
            { axis: "x", valueCm: 250, features: ["center"] },
            { axis: "y", valueCm: 200, features: ["center"] },
        ]);
        expect(linesOf(lines, "wall")).toEqual(expectedWalls);
    });

    it("gives the same walls for counter-clockwise corners", () => {
        const lines = roomSnapLines(room(1, "Wohnen", [...WOHNEN].reverse()), []);
        const sorted = (l: { axis: string; valueCm: number }[]) =>
            [...l].sort((a, b) => a.axis.localeCompare(b.axis) || a.valueCm - b.valueCm);
        expect(sorted(linesOf(lines, "wall"))).toEqual(sorted(expectedWalls));
    });

    it("uses the bounding box center and the inner side of all six walls of an L-shaped room", () => {
        const points: PointCm[] = [
            { x: 0, y: 0 },
            { x: 600, y: 0 },
            { x: 600, y: 200 },
            { x: 300, y: 200 },
            { x: 300, y: 400 },
            { x: 0, y: 400 },
        ];
        const lines = roomSnapLines(room(1, "L", points), []);
        expect(linesOf(lines, "room-center").map((l) => l.valueCm)).toEqual([300, 200]);
        expect(linesOf(lines, "wall")).toEqual([
            { axis: "y", valueCm: 0, features: ["min"] },
            { axis: "x", valueCm: 600, features: ["max"] },
            { axis: "y", valueCm: 200, features: ["max"] },
            { axis: "x", valueCm: 300, features: ["max"] },
            { axis: "y", valueCm: 400, features: ["max"] },
            { axis: "x", valueCm: 0, features: ["min"] },
        ]);
    });

    it("gives a line across the wall through the middle of each opening", () => {
        const openings = [opening(1, "window", TOP, 50, 120), opening(2, "door", RIGHT, 100, 80)];
        const lines = roomSnapLines(room(1, "Wohnen", WOHNEN, openings), []);
        expect(linesOf(lines, "opening")).toEqual([
            { axis: "x", valueCm: 110, features: ["center"] },
            { axis: "y", valueCm: 140, features: ["center"] },
        ]);
    });

    it("gives no wall and no opening line for a slanted edge", () => {
        const points: PointCm[] = [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
            { x: 300, y: 300 },
            { x: 0, y: 300 },
        ];
        const lines = roomSnapLines(room(1, "Schräg", points, [opening(1, "window", 1, 50, 100)]), []);
        expect(linesOf(lines, "wall")).toEqual([
            { axis: "y", valueCm: 0, features: ["min"] },
            { axis: "y", valueCm: 300, features: ["max"] },
            { axis: "x", valueCm: 0, features: ["min"] },
        ]);
        expect(linesOf(lines, "opening")).toEqual([]);
    });

    it("gives no line for an opening that does not fit on its edge", () => {
        const lines = roomSnapLines(room(1, "Wohnen", WOHNEN, [opening(1, "window", TOP, 450, 120)]), []);
        expect(linesOf(lines, "opening")).toEqual([]);
    });

    it("gives sides and middle of other shapes; a polygon gives none", () => {
        const table = rect(1, { widthCm: 160, depthCm: 90, x: 250, y: 200 });
        const polygon = {
            id: uuid(2),
            kind: "polygon",
            x: 100,
            y: 100,
            rotationDeg: 0,
            mirrored: false,
            style: STYLE,
            pointsCm: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }],
        } as Shape;
        const lines = roomSnapLines(room(1, "Wohnen", WOHNEN), [table, polygon]);
        expect(linesOf(lines, "shape")).toEqual([
            { axis: "x", valueCm: 170, features: ["min", "max"] },
            { axis: "x", valueCm: 250, features: ["center"] },
            { axis: "x", valueCm: 330, features: ["max", "min"] },
            { axis: "y", valueCm: 155, features: ["min", "max"] },
            { axis: "y", valueCm: 200, features: ["center"] },
            { axis: "y", valueCm: 245, features: ["max", "min"] },
        ]);
    });
});

/** Extent of an unrotated `width × depth` rectangle around its center. */
function extent(width: number, depth: number): Record<SnapAxis, ShapeExtent> {
    return { x: { min: -width / 2, max: width / 2 }, y: { min: -depth / 2, max: depth / 2 } };
}

interface MoveCase {
    start: PointCm;
    raw: PointCm;
    size: [number, number];
    lines: SnapLine[];
    tolerance?: number;
    step?: number;
}

function move({ start, raw, size, lines, tolerance = 8, step = 5 }: MoveCase) {
    const result = snapShapeMove({
        startCm: start,
        rawDeltaCm: raw,
        stepCm: step,
        extentCm: extent(...size),
        lines,
        toleranceCm: tolerance,
    });
    return { center: { x: start.x + result.deltaCm.x, y: start.y + result.deltaCm.y }, hits: result.hits };
}

describe("snapShapeMove", () => {
    const wohnenLines = (openings: Opening[] = [], shapes: Shape[] = []) =>
        roomSnapLines(room(1, "Wohnen", WOHNEN, openings), shapes);
    const TABLE_START = { x: 120, y: 300 };

    it("snaps a table to the room center on x; y stays on the grid", () => {
        const { center, hits } = move({ start: TABLE_START, raw: { x: 127, y: 0 }, size: [160, 90], lines: wohnenLines() });
        expect(center).toEqual({ x: 250, y: 300 });
        expect(hits.x?.kind).toBe("room-center");
        expect(hits.y).toBeNull();
    });

    it("keeps the grid on the other axis", () => {
        const { center } = move({ start: TABLE_START, raw: { x: 127, y: -13 }, size: [160, 90], lines: wohnenLines() });
        expect(center).toEqual({ x: 250, y: 285 });
    });

    it("snaps both axes", () => {
        const { center, hits } = move({ start: TABLE_START, raw: { x: 133, y: -96 }, size: [160, 90], lines: wohnenLines() });
        expect(center).toEqual({ x: 250, y: 200 });
        expect(hits.x?.kind).toBe("room-center");
        expect(hits.y?.kind).toBe("room-center");
    });

    it("centers a desk in front of the window", () => {
        const lines = wohnenLines([opening(1, "window", TOP, 50, 120)]);
        const { center, hits } = move({ start: { x: 300, y: 100 }, raw: { x: -186, y: 0 }, size: [120, 60], lines });
        expect(center).toEqual({ x: 110, y: 100 });
        expect(hits.x?.kind).toBe("opening");
    });

    it("puts a wardrobe against the wall", () => {
        const { center, hits } = move({ start: { x: 180, y: 100 }, raw: { x: 0, y: -66 }, size: [200, 60], lines: wohnenLines() });
        expect(center).toEqual({ x: 180, y: 30 });
        expect(hits.y?.kind).toBe("wall");
    });

    it("puts a rotated bed against the wall with its rotated outline", () => {
        // Bed 200 cm × 100 cm at 90°: its bounding box is 100 cm wide.
        const { center } = move({ start: { x: 300, y: 200 }, raw: { x: 146, y: 0 }, size: [100, 200], lines: wohnenLines() });
        expect(center.x).toBe(450);
    });

    it("puts a chest flush next to the table", () => {
        const table = rect(1, { widthCm: 160, depthCm: 90, x: 250, y: 200 });
        const { center, hits } = move({ start: { x: 70, y: 200 }, raw: { x: 67, y: 0 }, size: [60, 40], lines: wohnenLines([], [table]) });
        expect(center.x).toBe(140);
        expect(hits.x?.kind).toBe("shape");
    });

    it("aligns a lamp with the table's top", () => {
        const table = rect(1, { widthCm: 160, depthCm: 90, x: 250, y: 200 });
        const { center, hits } = move({ start: { x: 400, y: 100 }, raw: { x: 0, y: 72 }, size: [40, 40], lines: wohnenLines([], [table]) });
        expect(center.y).toBe(175);
        expect(hits.y?.kind).toBe("shape");
    });

    it("takes the grid without a shape in the room", () => {
        const { center } = move({ start: { x: 400, y: 100 }, raw: { x: 0, y: 72 }, size: [40, 40], lines: wohnenLines() });
        expect(center.y).toBe(170);
    });

    it("takes the nearest line: wall 4 cm before window middle 6 cm", () => {
        const lines = wohnenLines([opening(1, "window", TOP, 0, 120)]);
        const { center, hits } = move({ start: { x: 200, y: 100 }, raw: { x: -146, y: 0 }, size: [100, 40], lines });
        expect(center.x).toBe(50);
        expect(hits.x?.kind).toBe("wall");
    });

    it("breaks ties in the order wall, opening, room center, shape", () => {
        const at = (kind: SnapLineKind): SnapLine => ({ axis: "x", valueCm: 100, kind, features: ["center"] });
        const order: SnapLineKind[] = ["wall", "opening", "room-center", "shape"];
        for (let i = 0; i < order.length; i++) {
            // Worst first, so the winner never just comes first in the list.
            const lines = order.slice(i).reverse().map(at);
            const { hits } = move({ start: { x: 0, y: 0 }, raw: { x: 103, y: 0 }, size: [10, 10], lines });
            expect(hits.x?.kind).toBe(order[i]);
        }
    });

    it("depends on the tolerance (zoom)", () => {
        const lines = wohnenLines();
        expect(move({ start: TABLE_START, raw: { x: 116, y: 0 }, size: [160, 90], lines, tolerance: 8 }).center.x).toBe(235);
        expect(move({ start: TABLE_START, raw: { x: 116, y: 0 }, size: [160, 90], lines, tolerance: 16 }).center.x).toBe(250);
    });

    it("moves on the grid relative to the start without lines", () => {
        const { center, hits } = move({ start: { x: 37, y: 120 }, raw: { x: 13, y: 2 }, size: [100, 60], lines: [] });
        expect(center).toEqual({ x: 52, y: 120 });
        expect(hits).toEqual({ x: null, y: null });
    });

    it("snaps a stool to the center of the room it is dragged into", () => {
        const lines = roomSnapLines(room(2, "Küche", KUECHE), []);
        const { center } = move({ start: { x: 250, y: 300 }, raw: { x: 497, y: 0 }, size: [40, 40], lines });
        expect(center.x).toBe(750);
    });

    it("rounds the offset to 0.1 cm", () => {
        const line: SnapLine = { axis: "x", valueCm: 100.04, kind: "wall", features: ["center"] };
        const result = snapShapeMove({
            startCm: { x: 0, y: 0 },
            rawDeltaCm: { x: 101, y: 0 },
            stepCm: 5,
            extentCm: extent(10, 10),
            lines: [line],
            toleranceCm: 8,
        });
        expect(result.deltaCm.x).toBe(100);
    });
});

describe("roomAtPoint", () => {
    const rooms = [room(1, "Wohnen", WOHNEN), room(2, "Küche", KUECHE)];

    it("finds the room containing the point", () => {
        expect(roomAtPoint(rooms, { x: 250, y: 200 })?.name).toBe("Wohnen");
        expect(roomAtPoint(rooms, { x: 750, y: 200 })?.name).toBe("Küche");
    });

    it("is null between the rooms", () => {
        expect(roomAtPoint(rooms, { x: 550, y: 200 })).toBeNull();
    });

    it("counts a point on the outline as inside", () => {
        expect(roomAtPoint(rooms, { x: 500, y: 200 })?.name).toBe("Wohnen");
        expect(roomAtPoint(rooms, { x: 600, y: 200 })?.name).toBe("Küche");
        expect(roomAtPoint(rooms, { x: 250, y: 400 })?.name).toBe("Wohnen");
    });

    it("takes the first room when rooms overlap", () => {
        const overlapping = [room(3, "A", rectPoints(0, 0, 300, 300)), room(4, "B", rectPoints(100, 100, 300, 300))];
        expect(roomAtPoint(overlapping, { x: 200, y: 200 })?.name).toBe("A");
    });
});
