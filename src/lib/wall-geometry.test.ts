import { describe, expect, it } from "vitest";
import type { PointCm, Wall } from "@/lib/plan-schema";
import {
    joinedEnds,
    setWallLength,
    translateWall,
    wallBandOutline,
    wallBounds,
    wallDirection,
    wallEnds,
    wallLengthCm,
    wallNormal,
    wallSideLines,
} from "@/lib/wall-geometry";
import { uuid } from "@/test/plan-fixtures";

const wall = (n: number, start: PointCm, end: PointCm, thicknessCm = 15): Wall => ({
    id: uuid(n),
    startCm: start,
    endCm: end,
    thicknessCm,
});

/** Points rounded to 0.001 cm, so floating-point noise does not matter. */
const rounded = (points: PointCm[]) => points.map((p) => ({ x: Math.round(p.x * 1000) / 1000 + 0, y: Math.round(p.y * 1000) / 1000 + 0 }));

describe("wallLengthCm / wallDirection / wallNormal", () => {
    it("measures the center line", () => {
        expect(wallLengthCm(wall(1, { x: 100, y: 100 }, { x: 430, y: 100 }))).toBe(330);
        expect(wallLengthCm(wall(1, { x: 0, y: 0 }, { x: 300, y: 400 }))).toBe(500);
    });

    it("gives the unit direction and the normal turned by 90°", () => {
        const w = wall(1, { x: 0, y: 0 }, { x: 300, y: 400 });
        expect(wallDirection(w)).toEqual({ x: 0.6, y: 0.8 });
        expect(wallNormal(w)).toEqual({ x: -0.8, y: 0.6 });
    });

    it("has no direction for a wall of 0 cm", () => {
        expect(wallDirection(wall(1, { x: 5, y: 5 }, { x: 5, y: 5 }))).toBeNull();
        expect(wallBandOutline(wall(1, { x: 5, y: 5 }, { x: 5, y: 5 }))).toEqual([]);
    });
});

describe("wallBandOutline (Band um die Mittellinie)", () => {
    it("is the rectangle (100|92,5)…(430|107,5) for (100|100)→(430|100) with 15 cm", () => {
        const outline = wallBandOutline(wall(1, { x: 100, y: 100 }, { x: 430, y: 100 }));
        expect(rounded(outline)).toEqual([
            { x: 100, y: 107.5 },
            { x: 430, y: 107.5 },
            { x: 430, y: 92.5 },
            { x: 100, y: 92.5 },
        ]);
        expect(wallBounds(wall(1, { x: 100, y: 100 }, { x: 430, y: 100 }))).toEqual({ x: 100, y: 92.5, width: 330, height: 15 });
    });

    it("reaches half the thickness beyond a capped end", () => {
        const outline = wallBandOutline(wall(1, { x: 0, y: 0 }, { x: 300, y: 0 }, 10), false, true);
        expect(rounded(outline)).toEqual([
            { x: 0, y: 5 },
            { x: 305, y: 5 },
            { x: 305, y: -5 },
            { x: 0, y: -5 },
        ]);
    });
});

describe("joinedEnds (Ecken zwischen Wänden schließen)", () => {
    it("closes the L corner of (0|0)→(300|0) and (300|0)→(300|200), 10 cm each", () => {
        const a = wall(1, { x: 0, y: 0 }, { x: 300, y: 0 }, 10);
        const b = wall(2, { x: 300, y: 0 }, { x: 300, y: 200 }, 10);
        const joined = joinedEnds([a, b]);
        expect(joined.get(a.id)).toEqual({ start: false, end: true });
        expect(joined.get(b.id)).toEqual({ start: true, end: false });
        // The square (295|−5)…(305|5) lies in the union of both capped bands.
        const bandA = wallBounds({ ...a, endCm: { x: 305, y: 0 } });
        const bandB = wallBounds({ ...b, startCm: { x: 300, y: -5 } });
        expect(bandA).toEqual({ x: 0, y: -5, width: 305, height: 10 });
        expect(bandB).toEqual({ x: 295, y: -5, width: 10, height: 205 });
        expect(rounded(wallBandOutline(b, true, false))[0]).toEqual({ x: 295, y: -5 });
    });

    it("leaves free ends without cap", () => {
        const a = wall(1, { x: 0, y: 0 }, { x: 300, y: 0 });
        const b = wall(2, { x: 0, y: 100 }, { x: 300, y: 100 });
        expect(joinedEnds([a, b]).get(a.id)).toEqual({ start: false, end: false });
    });

    it("counts ends 0.04 cm apart as joined after rounding to 0.1 cm", () => {
        const a = wall(1, { x: 0, y: 0 }, { x: 300, y: 0 });
        const b = wall(2, { x: 300.04, y: 0 }, { x: 300, y: 200 });
        expect(joinedEnds([a, b]).get(a.id)?.end).toBe(true);
    });

    it("does not join a wall with itself", () => {
        const a = wall(1, { x: 0, y: 0 }, { x: 300, y: 0 });
        expect(joinedEnds([a]).get(a.id)).toEqual({ start: false, end: false });
    });
});

describe("setWallLength", () => {
    it("keeps the start and moves the end: 330 → 300 cm (Wand kürzen)", () => {
        const w = wall(1, { x: 100, y: 100 }, { x: 430, y: 100 });
        expect(setWallLength(w, 300)).toEqual({ ...w, endCm: { x: 400, y: 100 } });
    });

    it("keeps the direction of a sloped wall", () => {
        const w = wall(1, { x: 0, y: 0 }, { x: 300, y: 400 });
        expect(setWallLength(w, 250)?.endCm).toEqual({ x: 150, y: 200 });
    });

    it("rejects 0 cm and less", () => {
        const w = wall(1, { x: 0, y: 0 }, { x: 300, y: 0 });
        expect(setWallLength(w, 0)).toBeNull();
        expect(setWallLength(w, -5)).toBeNull();
    });
});

describe("translateWall", () => {
    it("moves both ends, rounded to 0.1 cm", () => {
        const w = wall(1, { x: 100, y: 100 }, { x: 430, y: 100 });
        expect(translateWall(w, 50.04, 20)).toEqual({ ...w, startCm: { x: 150, y: 120 }, endCm: { x: 480, y: 120 } });
    });
});

describe("wallSideLines (Seiten einer Wand)", () => {
    it("gives y = 205 and y = 195, 300 cm each, for (100|200)→(400|200) with 10 cm", () => {
        const sides = wallSideLines(wall(1, { x: 100, y: 200 }, { x: 400, y: 200 }, 10));
        expect(sides.map((s) => ({ side: s.side, start: s.start, end: s.end, normal: s.normal }))).toEqual([
            { side: "left", start: { x: 100, y: 205 }, end: { x: 400, y: 205 }, normal: { x: -0, y: 1 } },
            { side: "right", start: { x: 100, y: 195 }, end: { x: 400, y: 195 }, normal: { x: 0, y: -1 } },
        ]);
    });
});

describe("wallEnds", () => {
    it("lists start and end of every wall", () => {
        const a = wall(1, { x: 0, y: 0 }, { x: 300, y: 0 });
        const b = wall(2, { x: 0, y: 100 }, { x: 0, y: 300 });
        expect(wallEnds([a, b])).toEqual([a.startCm, a.endCm, b.startCm, b.endCm]);
    });
});
