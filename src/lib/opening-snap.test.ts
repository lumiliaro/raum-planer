import { describe, expect, it } from "vitest";
import { openingSnapTargets, SNAP_POINT_TOLERANCE_PX, snapOpeningOffset, type SnapTarget } from "@/lib/opening-snap";

describe("openingSnapTargets", () => {
    it("gives center 190 cm and corners 0 cm and 380 cm for a 120 cm window on a 500 cm edge", () => {
        expect(openingSnapTargets(500, 120, [])).toEqual([
            { offsetCm: 190, kind: "center", markAtCm: 250 },
            { offsetCm: 0, kind: "corner", markAtCm: 0 },
            { offsetCm: 380, kind: "corner", markAtCm: 500 },
        ]);
    });

    it("adds 170 cm right of a neighbor at 50–170 cm, but not −70 cm left of it (does not fit)", () => {
        const neighbors = openingSnapTargets(500, 120, [{ offsetCm: 50, widthCm: 120 }]).filter((t) => t.kind === "neighbor");
        expect(neighbors).toEqual([{ offsetCm: 170, kind: "neighbor", markAtCm: 170 }]);
    });

    it("marks a left neighbor target at the neighbor's start", () => {
        const neighbors = openingSnapTargets(500, 120, [{ offsetCm: 300, widthCm: 120 }]).filter((t) => t.kind === "neighbor");
        expect(neighbors).toEqual([{ offsetCm: 180, kind: "neighbor", markAtCm: 300 }]);
    });

    it("drops neighbor targets past the far end", () => {
        expect(openingSnapTargets(500, 120, [{ offsetCm: 400, widthCm: 100 }]).map((t) => t.offsetCm)).toEqual([190, 0, 380, 280]);
    });

    it("gives only offset 0 when the opening is as wide as the edge", () => {
        expect(openingSnapTargets(60, 60, []).every((t) => t.offsetCm === 0)).toBe(true);
    });
});

describe("snapOpeningOffset", () => {
    const targets = openingSnapTargets(500, 120, []);

    it("uses 8 screen px", () => {
        expect(SNAP_POINT_TOLERANCE_PX).toBe(8);
    });

    it("snaps raw 185 cm to the center with 8 cm tolerance", () => {
        expect(snapOpeningOffset(185, targets, 8)).toEqual({ offsetCm: 190, kind: "center", markAtCm: 250 });
    });

    it("snaps raw 176 cm to the center with 16 cm tolerance (zoom 50 %), not with 8 cm", () => {
        expect(snapOpeningOffset(176, targets, 16)?.kind).toBe("center");
        expect(snapOpeningOffset(176, targets, 8)).toBeNull();
    });

    it("lets the nearest target win", () => {
        const withNeighbor = openingSnapTargets(500, 120, [{ offsetCm: 50, widthCm: 120 }]);
        expect(snapOpeningOffset(173, withNeighbor, 30)).toMatchObject({ kind: "neighbor", offsetCm: 170 });
    });

    it("prefers center over corner over neighbor on a tie", () => {
        const tie: SnapTarget[] = [
            { offsetCm: 10, kind: "neighbor", markAtCm: 10 },
            { offsetCm: 0, kind: "corner", markAtCm: 0 },
            { offsetCm: 10, kind: "center", markAtCm: 70 },
        ];
        expect(snapOpeningOffset(5, tie, 8)?.kind).toBe("center");
        expect(snapOpeningOffset(5, tie.slice(0, 2), 8)?.kind).toBe("corner");
        // A neighbor that coincides with the center or a corner.
        expect(snapOpeningOffset(190, openingSnapTargets(500, 120, [{ offsetCm: 310, widthCm: 50 }]), 8)?.kind).toBe("center");
        expect(snapOpeningOffset(0, openingSnapTargets(500, 120, [{ offsetCm: 120, widthCm: 50 }]), 8)?.kind).toBe("corner");
    });

    it("gives null without targets", () => {
        expect(snapOpeningOffset(100, [], 8)).toBeNull();
    });
});
