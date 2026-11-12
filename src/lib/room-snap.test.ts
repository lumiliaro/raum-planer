import { describe, expect, it } from "vitest";
import type { PointCm, Room } from "@/lib/plan-schema";
import {
    WALL_SNAP_CAPTURE_PX,
    WALL_SNAP_RELEASE_PX,
    edgeOutwardNormals,
    snapRoomDrag,
    type RoomDragSnapInput,
    type WallStick,
} from "@/lib/room-snap";
import { snapDelta } from "@/lib/snap";

/** Clockwise rectangle (on screen): edges top, right, bottom, left. */
function rect(x: number, y: number, width: number, height: number): PointCm[] {
    return [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
    ];
}

function room(id: string, pointsCm: PointCm[], wallThicknessCm: number[] = pointsCm.map(() => 15)): Room {
    return { id, name: id, pointsCm, openings: [], wallThicknessCm, color: null, locked: false };
}

const TOP = 0;
const RIGHT = 1;
const BOTTOM = 2;
const LEFT = 3;

const wohnen = room("wohnen", rect(0, 0, 337.5, 560));
/** "Diele", 200 cm × 300 cm, top-left corner at (400 cm, 100 cm). */
const DIELE = rect(400, 100, 200, 300);

const STEP = 5;
const grid = (d: PointCm): PointCm => ({ x: snapDelta(d.x, STEP), y: snapDelta(d.y, STEP) });

/** Drag at `scale` screen px per cm; `rawDelta` in cm, grid of 5 cm. */
function drag(
    rawDelta: PointCm,
    options: { others?: Room[]; sticks?: WallStick[]; scale?: number; points?: PointCm[]; thickness?: number[] } = {},
) {
    const points = options.points ?? DIELE;
    const scale = options.scale ?? 1;
    const input: RoomDragSnapInput = {
        points,
        wallThicknessCm: options.thickness ?? points.map(() => 15),
        others: options.others ?? [wohnen],
        rawDelta,
        gridDelta: grid(rawDelta),
        sticks: options.sticks ?? [],
        captureCm: WALL_SNAP_CAPTURE_PX / scale,
        releaseCm: WALL_SNAP_RELEASE_PX / scale,
    };
    return snapRoomDrag(input);
}

/** Top-left corner of the Diele after the drag. */
const corner = (delta: PointCm) => ({ x: 400 + delta.x, y: 100 + delta.y });

/** Pointer offset that puts the Diele's top-left corner at (x, y) in the pointer position. */
const to = (x: number, y: number): PointCm => ({ x: x - 400, y: y - 100 });

/** Stuck to the right edge of "Wohnen" with the top-left corner at (352,5 cm, 100 cm). */
function stuckToWohnen() {
    const result = drag(to(350, 100));
    expect(result.sticks).toHaveLength(1);
    return result.sticks;
}

describe("edgeOutwardNormals", () => {
    it("points outwards for a clockwise rectangle", () => {
        expect(edgeOutwardNormals(rect(0, 0, 100, 50))).toEqual([
            { x: 0, y: -1 },
            { x: 1, y: -0 },
            { x: 0, y: 1 },
            { x: -1, y: -0 },
        ]);
    });

    it("points outwards for a counter-clockwise rectangle", () => {
        const ccw = [...rect(0, 0, 100, 50)].reverse(); // edges: bottom, right, top, left
        const normals = edgeOutwardNormals(ccw).map((n) => n && { x: n.x + 0, y: n.y + 0 });
        expect(normals).toEqual([
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: 0 },
        ]);
    });

    it("returns null for an edge of length 0", () => {
        expect(edgeOutwardNormals([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 10 }])[0]).toBeNull();
    });
});

describe("snapRoomDrag: capture", () => {
    it("An Nachbarwand heranschieben: 50 cm to the left ends at 352,5 cm", () => {
        const result = drag({ x: -50, y: 0 });
        expect(corner(result.delta)).toEqual({ x: 352.5, y: 100 });
        expect(result.sticks).toEqual([
            expect.objectContaining({ roomId: "wohnen", edgeIndex: RIGHT, movingEdgeIndex: LEFT }),
        ]);
    });

    it("Dickere Wand zählt: 24 cm wall, pointer at 365 cm ends at 361,5 cm", () => {
        const thick = room("wohnen", rect(0, 0, 337.5, 560), [15, 24, 15, 15]);
        const result = drag(to(365, 100), { others: [thick] });
        expect(corner(result.delta).x).toBeCloseTo(361.5);
    });

    it("the thicker wall also counts when it belongs to the dragged room", () => {
        const result = drag(to(365, 100), { thickness: [15, 15, 15, 24] });
        expect(corner(result.delta).x).toBeCloseTo(361.5);
    });

    it("Zu weit entfernt: at 380 cm nothing sticks", () => {
        const result = drag(to(380, 100));
        expect(result.sticks).toEqual([]);
        expect(corner(result.delta).x).toBe(380);
    });

    it("Kanten liegen sich nicht gegenüber: below y = 600 cm nothing sticks", () => {
        const result = drag(to(355, 605));
        expect(result.sticks).toEqual([]);
        expect(corner(result.delta)).toEqual({ x: 355, y: 605 });
    });

    it("edges facing the same way do not stick", () => {
        // Diele left edge right next to the left edge of "Wohnen", both facing left.
        const result = drag(to(5, 100));
        expect(result.sticks.some((s) => s.edgeIndex === LEFT)).toBe(false);
    });

    it("sticks to a locked neighbour as well", () => {
        const result = drag({ x: -50, y: 0 }, { others: [{ ...wohnen, locked: true }] });
        expect(corner(result.delta).x).toBe(352.5);
    });

    it("the smallest deviation wins", () => {
        // A second room right of the Diele, its left edge 20 cm away (deviation 5 cm vs. 2,5 cm).
        const right = room("right", rect(620, 0, 200, 600));
        const result = drag({ x: -50, y: 0 }, { others: [right, wohnen] });
        expect(result.sticks).toHaveLength(1);
        expect(result.sticks[0].roomId).toBe("wohnen");
    });
});

describe("snapRoomDrag: hysteresis", () => {
    it("Entlang gleiten: stays at 352,5 cm and moves 100 cm down", () => {
        const sticks = stuckToWohnen();
        const result = drag({ x: -45, y: 100 }, { sticks });
        expect(corner(result.delta)).toEqual({ x: 352.5, y: 200 });
        expect(result.sticks).toHaveLength(1);
    });

    it("Über das Wandende hinaus: releases once the edges no longer overlap", () => {
        const sticks = stuckToWohnen();
        const result = drag(to(352.5, 605), { sticks });
        expect(result.sticks).toEqual([]);
    });

    it("Leichtes Wegziehen hält: 20 cm away from the wall", () => {
        const sticks = stuckToWohnen();
        const result = drag(to(372.5, 100), { sticks });
        expect(corner(result.delta).x).toBe(352.5);
        expect(result.sticks).toHaveLength(1);
    });

    it("Losreißen: 30 cm away releases and follows the pointer in the grid", () => {
        const sticks = stuckToWohnen();
        const raw = to(382.5, 100);
        const result = drag(raw, { sticks });
        expect(result.sticks).toEqual([]);
        expect(result.delta).toEqual(grid(raw));
    });

    it("In die Wand drücken: 20 cm into the wall holds", () => {
        const sticks = stuckToWohnen();
        const result = drag(to(332.5, 100), { sticks });
        expect(corner(result.delta).x).toBe(352.5);
        expect(result.sticks).toHaveLength(1);
    });

    it("sticks again after tearing off when coming back within 8 px", () => {
        const sticks = stuckToWohnen();
        const torn = drag(to(382.5, 100), { sticks });
        expect(torn.sticks).toEqual([]);
        const between = drag(to(370, 100), { sticks: torn.sticks });
        expect(between.sticks).toEqual([]);
        const back = drag(to(357, 100), { sticks: between.sticks });
        expect(back.sticks).toHaveLength(1);
        expect(corner(back.delta).x).toBe(352.5);
    });

    it("Gleich große Wirkung beim Zoomen: at 2 px/cm 10 cm holds, 15 cm releases", () => {
        const sticks = drag(to(354, 100), { scale: 2 }).sticks;
        expect(sticks).toHaveLength(1);
        expect(drag(to(362.5, 100), { scale: 2, sticks }).sticks).toHaveLength(1);
        expect(drag(to(367.5, 100), { scale: 2, sticks }).sticks).toEqual([]);
    });
});

describe("snapRoomDrag: flush corners", () => {
    it("Oberkanten in einer Flucht: top at 5 cm snaps to 0 cm", () => {
        const result = drag(to(350, 5));
        expect(corner(result.delta)).toEqual({ x: 352.5, y: 0 });
    });

    it("Unterkanten in einer Flucht: bottom at 555 cm snaps to 560 cm", () => {
        const result = drag(to(350, 255));
        expect(corner(result.delta).y + 300).toBe(560);
    });

    it("Weit weg von jeder Ecke: top stays at 100 cm", () => {
        const result = drag(to(350, 100));
        expect(corner(result.delta).y).toBe(100);
    });

    it("snaps the corner without hysteresis: 9 cm away follows the grid", () => {
        const result = drag(to(350, 9));
        expect(corner(result.delta).y).toBe(10);
    });
});

describe("snapRoomDrag: two walls", () => {
    /** "Küche" above "Wohnen", bottom edge at y = −15 cm from x = 0 to x = 600 cm. */
    const kueche = room("kueche", rect(0, -315, 600, 300));

    it("In eine Ecke schieben: ends at (352,5 cm, 0 cm) and reports both walls", () => {
        const result = drag(to(357, 4), { others: [wohnen, kueche] });
        expect(corner(result.delta)).toEqual({ x: 352.5, y: 0 });
        expect(result.sticks).toHaveLength(2);
        expect(result.sticks).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ roomId: "wohnen", edgeIndex: RIGHT }),
                expect.objectContaining({ roomId: "kueche", edgeIndex: BOTTOM, movingEdgeIndex: TOP }),
            ]),
        );
    });

    it("releases only one of two walls", () => {
        const others = [wohnen, kueche];
        const { sticks } = drag(to(357, 4), { others });
        const result = drag(to(387, 4), { others, sticks });
        expect(result.sticks).toEqual([expect.objectContaining({ roomId: "kueche" })]);
        expect(corner(result.delta).y).toBe(0);
        expect(corner(result.delta).x).toBe(385);
    });

    it("never holds two parallel walls", () => {
        // A room right of the Diele at exactly one wall distance in the stuck position.
        const right = room("right", rect(567.5, 0, 200, 600));
        const result = drag({ x: -50, y: 0 }, { others: [wohnen, right] });
        expect(result.sticks).toHaveLength(1);
    });

    it("sticks to two slanted walls at their wall distance", () => {
        // Moving triangle: vertical left edge and a top edge rising 30°.
        const angle = (30 * Math.PI) / 180;
        const dir = { x: Math.cos(angle), y: -Math.sin(angle) };
        const a = { x: 100, y: 200 };
        const b = { x: a.x + 200 * dir.x, y: a.y + 200 * dir.y };
        const c = { x: 100, y: 400 };
        const triangle = [a, b, c];
        const normals = edgeOutwardNormals(triangle);
        const topNormal = normals[0]!;
        // Neighbour above the slanted edge, 15 + 3 cm away; neighbour left of the vertical edge, 15 + 4 cm away.
        const shift = (p: PointCm, f: number) => ({ x: p.x + topNormal.x * f, y: p.y + topNormal.y * f });
        const above = room("above", [shift(b, 18), shift(a, 18), shift(a, 300)]);
        const left = room("left", rect(-100, 0, 100 + 81, 600));
        const result = snapRoomDrag({
            points: triangle,
            wallThicknessCm: [15, 15, 15],
            others: [above, left],
            rawDelta: { x: 0, y: 0 },
            gridDelta: { x: 0, y: 0 },
            sticks: [],
            captureCm: 8,
            releaseCm: 24,
        });
        expect(result.sticks).toHaveLength(2);
        const moved = triangle.map((p) => ({ x: p.x + result.delta.x, y: p.y + result.delta.y }));
        // Left edge 15 cm right of the neighbour's edge at x = 81 cm.
        expect(moved[0].x).toBeCloseTo(96);
        // Slanted edge 15 cm from the neighbour's edge along its normal.
        const distance = (moved[0].x - shift(a, 18).x) * topNormal.x + (moved[0].y - shift(a, 18).y) * topNormal.y;
        expect(distance).toBeCloseTo(-15);
    });
});
