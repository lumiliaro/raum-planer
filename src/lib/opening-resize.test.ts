import { describe, expect, it } from "vitest";
import { MIN_OPENING_WIDTH_CM, resizeOpening, resizeTargets, type ResizeSnap } from "@/lib/opening-resize";
import { SNAP_POINT_TOLERANCE_PX } from "@/lib/opening-snap";

const WINDOW = { offsetCm: 190, widthCm: 120 };

/** Snap points at the given zoom (screen px per cm), as the canvas builds them. */
const snapAt = (
    scale: number,
    opening: { offsetCm: number; widthCm: number },
    side: "start" | "end",
    others: { offsetCm: number; widthCm: number }[] = [],
    defaultWidthCm = 120,
    lengthCm = 500,
): ResizeSnap => {
    const fixed = side === "end" ? opening.offsetCm : opening.offsetCm + opening.widthCm;
    return {
        targets: resizeTargets(lengthCm, fixed, side, others, defaultWidthCm),
        toleranceCm: SNAP_POINT_TOLERANCE_PX / scale,
    };
};

describe("resizeTargets", () => {
    it("uses a minimum width of 10 cm", () => {
        expect(MIN_OPENING_WIDTH_CM).toBe(10);
    });

    it("gives corner, center, centered and default width for the right end of an opening fixed at 100 cm", () => {
        expect(resizeTargets(500, 100, "end", [], 100)).toEqual([
            { endCm: 500, kind: "corner", markAtCm: 500 },
            { endCm: 250, kind: "center", markAtCm: 250 },
            { endCm: 400, kind: "centered", markAtCm: 400 },
            { endCm: 200, kind: "default-width", markAtCm: 200 },
        ]);
    });

    it("gives the left corner and default width to the left for the start side", () => {
        expect(resizeTargets(500, 400, "start", [], 100)).toEqual([
            { endCm: 0, kind: "corner", markAtCm: 0 },
            { endCm: 250, kind: "center", markAtCm: 250 },
            { endCm: 100, kind: "centered", markAtCm: 100 },
            { endCm: 300, kind: "default-width", markAtCm: 300 },
        ]);
    });

    it("adds both ends of every neighbor that lie on the dragged side", () => {
        const neighbors = resizeTargets(500, 420, "start", [{ offsetCm: 50, widthCm: 120 }], 120).filter(
            (t) => t.kind === "neighbor",
        );
        expect(neighbors.map((t) => t.endCm)).toEqual([50, 170]);
    });

    it("drops targets on the wrong side of the fixed end or closer than 10 cm to it", () => {
        // Fixed at 245: center 250 is only 5 cm away, centered 255 only 10 cm (kept).
        const kinds = resizeTargets(500, 245, "end", [{ offsetCm: 100, widthCm: 50 }], 120).map((t) => t.kind);
        expect(kinds).toEqual(["corner", "centered", "default-width"]);
    });

    it("drops the default width target when it would leave the edge", () => {
        expect(resizeTargets(500, 450, "end", [], 120).some((t) => t.kind === "default-width")).toBe(false);
        expect(resizeTargets(500, 60, "start", [], 120).some((t) => t.kind === "default-width")).toBe(false);
    });
});

describe("resizeOpening: dragging the width", () => {
    it("Fenster breiter ziehen: right handle +33 cm gives width 155 cm, offset 190 cm", () => {
        expect(resizeOpening(WINDOW, "end", 33, 5, 500, snapAt(1, WINDOW, "end"))).toEqual({
            offsetCm: 190,
            widthCm: 155,
            snap: null,
        });
    });

    it("Linkes Ende ziehen: left handle +40 cm gives 230–310 cm", () => {
        expect(resizeOpening(WINDOW, "start", 40, 5, 500, snapAt(1, WINDOW, "start"))).toEqual({
            offsetCm: 230,
            widthCm: 80,
            snap: null,
        });
    });

    it("Am Kantenende: with Shift +300 cm stops at the right corner, width 310 cm", () => {
        expect(resizeOpening(WINDOW, "end", 300, 5, 500, null)).toEqual({ offsetCm: 190, widthCm: 310, snap: null });
    });

    it("Mindestbreite: right handle −200 cm keeps width 10 cm at offset 190 cm", () => {
        expect(resizeOpening(WINDOW, "end", -200, 5, 500, snapAt(1, WINDOW, "end"))).toMatchObject({
            offsetCm: 190,
            widthCm: 10,
        });
    });

    it("keeps the minimum width when dragging the left handle past the right end", () => {
        expect(resizeOpening(WINDOW, "start", 400, 5, 500, null)).toMatchObject({ offsetCm: 300, widthCm: 10 });
    });

    it("moves in 1-cm steps with Alt", () => {
        expect(resizeOpening(WINDOW, "end", 33, 1, 500, null)).toMatchObject({ widthCm: 153 });
    });

    it("stays unchanged when the edge is shorter than the minimum width", () => {
        expect(resizeOpening({ offsetCm: 0, widthCm: 8 }, "end", 20, 5, 8, null)).toEqual({
            offsetCm: 0,
            widthCm: 8,
            snap: null,
        });
    });
});

describe("resizeOpening: snap points", () => {
    it("Bis in die Ecke: right handle +185 cm snaps to the corner, width 310 cm", () => {
        const result = resizeOpening(WINDOW, "end", 185, 5, 500, snapAt(1, WINDOW, "end"));
        expect(result).toMatchObject({ offsetCm: 190, widthCm: 310 });
        expect(result.snap).toEqual({ endCm: 500, kind: "corner", markAtCm: 500 });
    });

    it("Bündig an das Nachbarfenster: B's left handle −126 cm gives 170–420 cm", () => {
        const b = { offsetCm: 300, widthCm: 120 };
        const result = resizeOpening(b, "start", -126, 5, 500, snapAt(1, b, "start", [{ offsetCm: 50, widthCm: 120 }]));
        expect(result).toMatchObject({ offsetCm: 170, widthCm: 250, snap: { kind: "neighbor", markAtCm: 170 } });
    });

    it("Bis zur Kantenmitte: passage 50–150 cm, right handle +97 cm gives 50–250 cm", () => {
        const passage = { offsetCm: 50, widthCm: 100 };
        const result = resizeOpening(passage, "end", 97, 5, 500, snapAt(1, passage, "end", [], 100));
        expect(result).toMatchObject({ offsetCm: 50, widthCm: 200, snap: { kind: "center" } });
    });

    it("Mittig auf der Kante: window 100–220 cm, right handle +176 cm gives 100–400 cm", () => {
        const window = { offsetCm: 100, widthCm: 120 };
        const result = resizeOpening(window, "end", 176, 5, 500, snapAt(1, window, "end"));
        expect(result).toMatchObject({ offsetCm: 100, widthCm: 300, snap: { kind: "centered" } });
    });

    it("Standardbreite: passage 20–80 cm, right handle +38 cm gives 20–120 cm", () => {
        const passage = { offsetCm: 20, widthCm: 60 };
        const result = resizeOpening(passage, "end", 38, 5, 500, snapAt(1, passage, "end", [], 100));
        expect(result).toMatchObject({ offsetCm: 20, widthCm: 100, snap: { kind: "default-width" } });
    });

    it("Toleranz hängt vom Zoom ab: +176 cm snaps to the corner at 50 %, not at 100 %", () => {
        expect(resizeOpening(WINDOW, "end", 176, 5, 500, snapAt(0.5, WINDOW, "end"))).toMatchObject({
            widthCm: 310,
            snap: { kind: "corner" },
        });
        expect(resizeOpening(WINDOW, "end", 176, 5, 500, snapAt(1, WINDOW, "end"))).toMatchObject({
            widthCm: 295,
            snap: null,
        });
    });

    it("Ohne Haltepunkte: with Shift +185 cm gives width 305 cm, 5 cm before the corner", () => {
        expect(resizeOpening(WINDOW, "end", 185, 5, 500, null)).toEqual({ offsetCm: 190, widthCm: 305, snap: null });
    });

    it("prefers corner over center on a tie", () => {
        const snap: ResizeSnap = {
            targets: [
                { endCm: 260, kind: "center", markAtCm: 260 },
                { endCm: 240, kind: "corner", markAtCm: 240 },
            ],
            toleranceCm: 20,
        };
        expect(resizeOpening({ offsetCm: 100, widthCm: 150 }, "end", 0, 5, 500, snap).snap?.kind).toBe("corner");
    });

    it("lets the nearest target win over a higher-ranked one", () => {
        const snap: ResizeSnap = {
            targets: [
                { endCm: 245, kind: "corner", markAtCm: 245 },
                { endCm: 252, kind: "default-width", markAtCm: 252 },
            ],
            toleranceCm: 20,
        };
        expect(resizeOpening({ offsetCm: 100, widthCm: 150 }, "end", 0, 5, 500, snap).snap?.kind).toBe("default-width");
    });
});
