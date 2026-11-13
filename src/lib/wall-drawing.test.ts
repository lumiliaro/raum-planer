import { describe, expect, it } from "vitest";
import type { PointCm, Wall } from "@/lib/plan-schema";
import { pointOnWall, snapToWall, wallAnchorOf, wallDistances, wallLineFor, wallLines, type WallLine } from "@/lib/room-drawing";
import { draftTargets, freeWallLines, resolveWallPointer, snapEndToWallLine, wallSnapTargets } from "@/lib/wall-drawing";
import { rectPoints, room, uuid, wall } from "@/test/plan-fixtures";

const p = (x: number, y: number): PointCm => ({ x, y });

/** „Wohnen“: (0|0)–(500|400), 15 cm walls. */
const WOHNEN = room(1, "Wohnen", rectPoints(0, 0, 500, 400));
/** Wall A: (100|200)→(400|200), 10 cm. */
const A = wall(2, p(100, 200), p(400, 200), 10);

const targets = (walls: readonly Wall[] = [], rooms = [WOHNEN], exceptId?: string) => wallSnapTargets(rooms, walls, exceptId);

describe("draftTargets", () => {
    it("gives only the rooms' corners and wall lines for „Raum“, also the free walls for „Wand“", () => {
        expect(draftTargets("room", [WOHNEN], [A])).toEqual({ corners: WOHNEN.pointsCm, lines: wallLines([WOHNEN]) });
        expect(draftTargets("wall", [WOHNEN], [A])).toEqual(wallSnapTargets([WOHNEN], [A]));
    });
});

describe("wallSnapTargets", () => {
    it("collects room corners and wall ends, room wall lines and wall sides, without the excepted wall", () => {
        const other = wall(5, p(0, 500), p(300, 500));
        const all = wallSnapTargets([WOHNEN], [A, other]);
        expect(all.corners).toEqual([...WOHNEN.pointsCm, A.startCm, A.endCm, other.startCm, other.endCm]);
        expect(all.lines).toHaveLength(8 + 4);
        const without = wallSnapTargets([WOHNEN], [A, other], A.id);
        expect(without.corners).toEqual([...WOHNEN.pointsCm, other.startCm, other.endCm]);
        expect(without.lines.filter((l) => l.source.kind === "wall")).toHaveLength(2);
    });
});

const opts = (overrides: Partial<{ free: boolean; snap: boolean; stepCm: number }> = {}) => ({
    radiusCm: 8,
    free: false,
    snap: true,
    stepCm: 5,
    ...overrides,
});

describe("freeWallLines (Wandlinien beim Wandzeichnen)", () => {
    it("gives both sides of a wall, 300 cm each (Seiten einer Wand)", () => {
        const lines = freeWallLines([A]);
        expect(lines).toHaveLength(2);
        expect(lines.map((l) => [l.source, l.start, l.end, l.lengthCm])).toEqual([
            [{ kind: "wall", wallId: A.id, side: "left" }, p(100, 205), p(400, 205), 300],
            [{ kind: "wall", wallId: A.id, side: "right" }, p(100, 195), p(400, 195), 300],
        ]);
    });

    it("leaves out the wall being dragged", () => {
        expect(freeWallLines([A, wall(3)], A.id).every((l) => l.source.kind === "wall" && l.source.wallId === uuid(3))).toBe(true);
    });

    it("snaps a start point to (230|205) with 130 and 170 cm to the ends (Seite einer anderen Wand)", () => {
        const position = snapToWall(p(232, 207), freeWallLines([A]), { radiusCm: 8, stepCm: 5 });
        expect(position?.point).toEqual(p(230, 205));
        expect(wallDistances(position!)).toEqual({ fromStartCm: 130, fromEndCm: 170 });
    });

    it("finds the anchored side again and measures from the other end after Tab", () => {
        const lines = freeWallLines([A]);
        const position = snapToWall(p(232, 207), lines, { radiusCm: 8, stepCm: 5 })!;
        const anchor = wallAnchorOf(position);
        const line = wallLineFor(lines, anchor) as WallLine;
        expect(line.source).toEqual({ kind: "wall", wallId: A.id, side: "left" });
        expect(pointOnWall(line, "start", 260)).toEqual(p(360, 205));
        expect(pointOnWall(line, "end", 260)).toEqual(p(140, 205));
        expect(wallLineFor(freeWallLines([]), anchor)).toBeNull();
    });
});

describe("snapEndToWallLine (Endpunkt einer Wand an einer Wandlinie)", () => {
    const roomLines = wallLines([WOHNEN]);

    it("ends a partition at (260|400) from (260|0), pointer (262|396) (Trennwand von Wand zu Wand)", () => {
        expect(snapEndToWallLine(p(260, 0), { x: 0, y: 1 }, p(262, 396), roomLines, 8)).toEqual(p(260, 400));
    });

    it("ends at the side of another wall: (250|0) → (250|195) (Bis an eine andere Wand)", () => {
        const lines = [...roomLines, ...freeWallLines([A])];
        expect(snapEndToWallLine(p(250, 0), { x: 0, y: 1 }, p(252, 193), lines, 8)).toEqual(p(250, 195));
    });

    it("meets the line at a free angle: (100|100), pointer (401|397) → (404|400) (Schräg zur Wandlinie)", () => {
        const d = { x: 301 / Math.hypot(301, 297), y: 297 / Math.hypot(301, 297) };
        expect(snapEndToWallLine(p(100, 100), d, p(401, 397), roomLines, 8)).toEqual(p(404, 400));
    });

    it("ignores a parallel line", () => {
        expect(snapEndToWallLine(p(100, 396), { x: 1, y: 0 }, p(300, 398), roomLines, 8)).toBeNull();
    });

    it("ignores an intersection beyond the ends of the line", () => {
        // x = 600 crosses y = 400 outside 0 … 500.
        expect(snapEndToWallLine(p(600, 0), { x: 0, y: 1 }, p(602, 396), roomLines, 8)).toBeNull();
    });

    it("ignores an intersection farther than the radius from the pointer", () => {
        // Nearly along the line: the pointer is 3 cm beside y = 400, the intersection far away.
        const d = { x: Math.cos(0.02), y: Math.sin(0.02) };
        expect(snapEndToWallLine(p(0, 395), d, p(100, 397), roomLines, 8)).toBeNull();
    });

    it("ignores an intersection on the start point", () => {
        expect(snapEndToWallLine(p(260, 400), { x: 0, y: -1 }, p(260, 396), roomLines, 8)).toBeNull();
    });
});

describe("resolveWallPointer – corners and wall ends (Wandpunkte an Ecken und Wandenden einrasten)", () => {
    it("puts the start on the room corner (500|0) at 5 px beside it (An Raumecke ansetzen)", () => {
        expect(resolveWallPointer(null, p(497, 4), targets(), opts())).toEqual({ point: p(500, 0), snapped: true, guides: [] });
    });

    it("ends at the end (300|0) of another wall (Zwei Wände zu einer Ecke verbinden)", () => {
        const other = wall(5, p(0, 0), p(300, 0));
        const resolved = resolveWallPointer(p(300, 200), p(303, 4), targets([other], []), opts());
        expect(resolved).toEqual({ point: p(300, 0), snapped: true, guides: [] });
    });

    it("lets corners snap with snapping off", () => {
        expect(resolveWallPointer(null, p(497, 4), targets(), opts({ snap: false })).point).toEqual(p(500, 0));
    });
});

describe("resolveWallPointer – guides (Hilfslinien beim Wandzeichnen)", () => {
    it("ends at (600|400) in line with the room corner, guide from (500|400) (Wand bis in die Flucht der Raumecke)", () => {
        const resolved = resolveWallPointer(p(600, 50), p(603, 396), targets(), opts());
        expect(resolved.point).toEqual(p(600, 400));
        expect(resolved.guides).toEqual([{ axis: "y", valueCm: 400, from: p(500, 400) }]);
    });

    it("shows no guide at (603|360)", () => {
        expect(resolveWallPointer(p(600, 50), p(603, 360), targets(), opts())).toEqual({ point: p(600, 360), snapped: false, guides: [] });
    });

    it("puts the start at (700|400) in line (Startpunkt in der Flucht)", () => {
        expect(resolveWallPointer(null, p(700, 404), targets(), opts()).point).toEqual(p(700, 400));
    });

    it("ends at (200|300) in line with the end of another wall (In der Flucht eines Wandendes)", () => {
        const other = wall(5, p(0, 0), p(0, 300));
        const resolved = resolveWallPointer(p(200, 0), p(195, 305), targets([other], []), opts());
        expect(resolved.point).toEqual(p(200, 300));
        expect(resolved.guides).toEqual([{ axis: "y", valueCm: 300, from: p(0, 300) }]);
    });

    it("does not pull the end onto the start", () => {
        const resolved = resolveWallPointer(p(0, 395), p(5, 397), targets([], []), opts({ free: true }));
        expect(resolved.point).toEqual(p(5, 397));
    });
});

describe("resolveWallPointer – precedence (Vorrang beim Einrasten während des Wandzeichnens)", () => {
    it("lets the wall side win over the guide through the wall ends (Wandlinie vor Hilfslinie)", () => {
        const resolved = resolveWallPointer(p(250, 0), p(252, 193), targets([A]), opts());
        expect(resolved).toEqual({ point: p(250, 195), snapped: true, guides: [] });
    });

    it("lets a room corner win over a wall line", () => {
        expect(resolveWallPointer(null, p(497, 3), targets(), opts()).point).toEqual(p(500, 0));
    });

    it("puts the start on the inner side of the room wall: (262|4) → (260|0) (Innenseite einer Raumwand)", () => {
        const resolved = resolveWallPointer(null, p(262, 4), targets(), opts());
        expect(resolved.point).toEqual(p(260, 0));
        expect(resolved.wall).toMatchObject({ line: { source: { kind: "room", face: "inner" } } });
    });

    it("ends a partition on the room wall: (260|0), pointer (262|396) → (260|400)", () => {
        expect(resolveWallPointer(p(260, 0), p(262, 396), targets(), opts())).toEqual({ point: p(260, 400), snapped: true, guides: [] });
    });
});

describe("resolveWallPointer – snapping off (Hilfslinien beim Wandzeichnen abschalten)", () => {
    it("ends at (250|193) with Ctrl (Mit Strg ohne Wandlinie)", () => {
        const resolved = resolveWallPointer(p(250, 0), p(252, 193), targets([A]), opts({ snap: false }));
        expect(resolved).toEqual({ point: p(250, 193), snapped: false, guides: [] });
    });

    it("puts the start at (700|404) with „Einrasten“ off", () => {
        expect(resolveWallPointer(null, p(700, 404), targets(), opts({ snap: false }))).toEqual({ point: p(700, 404), snapped: false, guides: [] });
    });

    it("keeps the direction snapping to 0°/90°/180°/270°", () => {
        expect(resolveWallPointer(p(100, 100), p(430, 108), targets([], []), opts({ snap: false })).point).toEqual(p(430, 100));
    });
});

describe("resolveWallPointer – drawing (Wand zeichnen)", () => {
    it("shows a horizontal wall to (430|100) for the pointer at (430|108) (Waagerechte Wand)", () => {
        expect(resolveWallPointer(p(100, 100), p(430, 108), targets([], []), opts()).point).toEqual(p(430, 100));
    });

    it("follows the pointer with Shift (Freier Winkel)", () => {
        expect(resolveWallPointer(p(100, 100), p(400, 200), targets([], []), opts({ free: true })).point).toEqual(p(400, 200));
    });

    it("has no point on the start itself", () => {
        expect(resolveWallPointer(p(100, 100), p(100, 100), targets([], []), opts()).point).toBeNull();
    });

    it("snaps a dragged end like the end point, without the dragged wall's own ends and sides (Wand verlängern)", () => {
        const dragged = wall(7);
        const resolved = resolveWallPointer(dragged.startCm, p(520, 106), targets([dragged], [], dragged.id), opts());
        expect(resolved.point).toEqual(p(520, 100));
    });
});
