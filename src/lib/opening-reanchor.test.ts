import { describe, expect, it } from "vitest";
import { edgeFrame, leftDistanceCm, pointOnEdge } from "@/lib/opening-geometry";
import { reanchorOpenings } from "@/lib/opening-reanchor";
import type { Opening } from "@/lib/plan-schema";
import { setEdgeLength, translatePoints } from "@/lib/room-geometry";
import { rectPoints, uuid } from "@/test/plan-fixtures";

/** „Wohnen“ (0|0), (500|0), (500|400), (0|400): Kante 1 = edge 0 (top), Kante 3 = edge 2 (bottom). */
const WOHNEN = rectPoints(0, 0, 500, 400);
/** Window on the bottom edge from x = 400 to x = 280 cm (the edge runs from x = 500 to 0). */
const WINDOW: Opening = { id: uuid(1), kind: "window", edgeIndex: 2, offsetCm: 100, widthCm: 120, swing: null, beforeFullEdge: null };
/** Door on the top edge from x = 160 to x = 240 cm. */
const DOOR: Opening = { id: uuid(2), kind: "door", edgeIndex: 0, offsetCm: 160, widthCm: 80, swing: { hinge: "start", side: "inside" }, beforeFullEdge: null };

const edgeLength = (points: typeof WOHNEN, index: number, length: number) => {
    const result = setEdgeLength(points, index, length);
    if (!result.ok) throw new Error("setEdgeLength failed");
    return result.points;
};

describe("reanchorOpenings", () => {
    it("keeps the window on edge 3 at x = 280 to 400 cm when edge 1 becomes 520 cm", () => {
        const after = edgeLength(WOHNEN, 0, 520);
        const result = reanchorOpenings(WOHNEN, after, [WINDOW]);
        if (!result.ok) throw new Error("expected ok");
        const [window] = result.openings;
        const frame = edgeFrame(after, 2);
        const xs = [pointOnEdge(frame, window.offsetCm).x, pointOnEdge(frame, window.offsetCm + window.widthCm).x].sort((a, b) => a - b);
        expect(xs).toEqual([280, 400]);
        expect(leftDistanceCm(frame, window)).toBe(120);
    });

    it("keeps the door on edge 1 when edge 1 gets longer", () => {
        const result = reanchorOpenings(WOHNEN, edgeLength(WOHNEN, 0, 520), [DOOR]);
        expect(result).toEqual({ ok: true, openings: [DOOR] });
        if (result.ok) expect(result.openings[0]).toBe(DOOR);
    });

    it("fails with edge 0 and kind „door“ when edge 1 becomes 200 cm and the door reaches to 240 cm", () => {
        expect(reanchorOpenings(WOHNEN, edgeLength(WOHNEN, 0, 200), [WINDOW, DOOR])).toEqual({ ok: false, edgeIndex: 0, kind: "door" });
    });

    it("names the window when it no longer fits", () => {
        // Edge 1 to 150 cm: the bottom edge becomes 150 cm, the window keeps 400 cm to its end → offset −250.
        expect(reanchorOpenings(WOHNEN, edgeLength(WOHNEN, 0, 150), [WINDOW])).toEqual({ ok: false, edgeIndex: 2, kind: "window" });
    });

    it("keeps all offsets when the whole room moves", () => {
        const openings = [WINDOW, DOOR, { ...DOOR, id: uuid(3), edgeIndex: 1, offsetCm: 50 }];
        const result = reanchorOpenings(WOHNEN, translatePoints(WOHNEN, 100, -30), openings);
        expect(result).toEqual({ ok: true, openings });
    });

    it("is ok for a room without openings", () => {
        expect(reanchorOpenings(WOHNEN, edgeLength(WOHNEN, 0, 100), [])).toEqual({ ok: true, openings: [] });
    });
});
