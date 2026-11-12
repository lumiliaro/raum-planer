import { describe, expect, it } from "vitest";
import { edgeFrame } from "@/lib/opening-geometry";
import {
    createOpening,
    defaultOpeningWidthCm,
    DEFAULT_DOOR_WIDTH_CM,
    DEFAULT_PASSAGE_WIDTH_CM,
    DEFAULT_WINDOW_WIDTH_CM,
    dragOffset,
    EDGE_HIT_TOLERANCE_PX,
    nearestRoomEdge,
    newOpeningSnap,
} from "@/lib/opening-placement";
import { openingSnapTargets } from "@/lib/opening-snap";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import { FINE_SNAP_STEP_CM, SNAP_STEP_CM } from "@/lib/snap";
import { rectPoints, room, uuid } from "@/test/plan-fixtures";

/** „Wohnen“: (0|0), (500|0), (500|400), (0|400). */
const WOHNEN = room(1, "Wohnen", rectPoints(0, 0, 500, 400));
const TOLERANCE = 10;

describe("nearestRoomEdge", () => {
    it("hits the top edge for a click 5 cm outside it, at the click's x", () => {
        expect(nearestRoomEdge([WOHNEN], { x: 200, y: -5 }, TOLERANCE)).toEqual({ roomId: WOHNEN.id, edgeIndex: 0, tCm: 200 });
    });

    it("hits the band 14 cm outside also with a tiny tolerance", () => {
        expect(nearestRoomEdge([WOHNEN], { x: 200, y: -14 }, 0.5)).toMatchObject({ edgeIndex: 0, tCm: 200 });
        expect(nearestRoomEdge([WOHNEN], { x: 200, y: -16 }, 0.5)).toBeNull();
    });

    it("hits the band over the edge's whole wall thickness: 30 cm outside a 36,5 cm wall, not a 15 cm one", () => {
        const thick = room(2, "Wohnen", rectPoints(0, 0, 500, 400), [], [36.5, 15, 15, 15]);
        const atZoom100 = EDGE_HIT_TOLERANCE_PX / 1;
        expect(nearestRoomEdge([thick], { x: 200, y: -30 }, atZoom100)).toMatchObject({ edgeIndex: 0, tCm: 200 });
        expect(nearestRoomEdge([WOHNEN], { x: 200, y: -30 }, atZoom100)).toBeNull();
    });

    it("hits within the tolerance inside the room", () => {
        expect(nearestRoomEdge([WOHNEN], { x: 200, y: 8 }, TOLERANCE)).toMatchObject({ edgeIndex: 0, tCm: 200 });
        expect(nearestRoomEdge([WOHNEN], { x: 200, y: 12 }, TOLERANCE)).toBeNull();
    });

    it("hits nothing in the middle of the room", () => {
        expect(nearestRoomEdge([WOHNEN], { x: 250, y: 200 }, TOLERANCE)).toBeNull();
    });

    it("gives the t of the bottom edge from its start (x = 500 cm)", () => {
        expect(nearestRoomEdge([WOHNEN], { x: 340, y: 405 }, TOLERANCE)).toMatchObject({ edgeIndex: 2, tCm: 160 });
    });

    it("lets the nearer edge win between two rooms 12 cm apart", () => {
        const bad = room(2, "Bad", rectPoints(0, 412, 300, 200));
        expect(nearestRoomEdge([WOHNEN, bad], { x: 100, y: 405 }, TOLERANCE)).toMatchObject({ roomId: WOHNEN.id, edgeIndex: 2 });
        expect(nearestRoomEdge([WOHNEN, bad], { x: 100, y: 408 }, TOLERANCE)).toMatchObject({ roomId: bad.id, edgeIndex: 0 });
    });

    it("hits nothing without rooms", () => {
        expect(nearestRoomEdge([], { x: 0, y: 0 }, TOLERANCE)).toBeNull();
    });
});

describe("createOpening", () => {
    const top = edgeFrame(WOHNEN.pointsCm, 0);
    const doors885 = { ...FACTORY_SETTINGS, doorWidthCm: 88.5 };

    it("uses the door width from the settings: 88,5 cm (Anforderung mit festem Wert)", () => {
        expect(createOpening("door", 0, top, 200, uuid(9), doors885)).toMatchObject({ widthCm: 88.5, offsetCm: 155.75 });
    });

    it("shrinks the set door width of 88,5 cm to a 60 cm edge", () => {
        const short = room(3, "WC", rectPoints(0, 0, 60, 150));
        expect(createOpening("door", 0, edgeFrame(short.pointsCm, 0), 30, uuid(9), doors885)).toMatchObject({ widthCm: 60, offsetCm: 0 });
    });

    it("takes the window and passage widths from the settings", () => {
        const widths = { ...FACTORY_SETTINGS, windowWidthCm: 101, passageWidthCm: 90 };
        expect(defaultOpeningWidthCm("window", widths)).toBe(101);
        expect(defaultOpeningWidthCm("passage", widths)).toBe(90);
        expect(defaultOpeningWidthCm("door", widths)).toBe(80);
    });

    it("puts a door at x = 200 cm with offset 160 cm, hinge left, opening inwards, without remembered sizes", () => {
        expect(createOpening("door", 0, top, 200, uuid(9), FACTORY_SETTINGS)).toEqual({
            id: uuid(9),
            kind: "door",
            edgeIndex: 0,
            offsetCm: 160,
            widthCm: DEFAULT_DOOR_WIDTH_CM,
            swing: { hinge: "start", side: "inside" },
            beforeFullEdge: null,
        });
    });

    it("pushes a window at x = 20 cm onto the edge: offset 0 cm, width 120 cm, no swing", () => {
        expect(createOpening("window", 0, top, 20, uuid(9), FACTORY_SETTINGS)).toMatchObject({
            offsetCm: 0,
            widthCm: DEFAULT_WINDOW_WIDTH_CM,
            swing: null,
        });
    });

    it("pushes it back from the far end", () => {
        expect(createOpening("window", 0, top, 495, uuid(9), FACTORY_SETTINGS).offsetCm).toBe(380);
    });

    it("rounds the center to whole cm", () => {
        expect(createOpening("door", 0, top, 200.4, uuid(9), FACTORY_SETTINGS).offsetCm).toBe(160);
    });

    it("shrinks a door to a 60 cm edge with offset 0 cm", () => {
        const short = room(3, "WC", rectPoints(0, 0, 60, 150));
        expect(createOpening("door", 0, edgeFrame(short.pointsCm, 0), 30, uuid(9), FACTORY_SETTINGS)).toMatchObject({ widthCm: 60, offsetCm: 0 });
    });

    it("puts a 100 cm passage from y = 210 cm to y = 310 cm for a click on the wall band at y = 260 cm, without remembered sizes (Offenes Stück in der Wand)", () => {
        const eltern = room(4, "Eltern", rectPoints(0, 0, 420, 330));
        const hit = nearestRoomEdge([eltern], { x: 425, y: 260 }, TOLERANCE);
        expect(hit).toEqual({ roomId: eltern.id, edgeIndex: 1, tCm: 260 });
        const right = edgeFrame(eltern.pointsCm, 1);
        expect(right.lengthCm).toBe(330);
        expect(DEFAULT_PASSAGE_WIDTH_CM).toBe(100);
        expect(createOpening("passage", 1, right, 260, uuid(9), FACTORY_SETTINGS)).toEqual({
            id: uuid(9),
            kind: "passage",
            edgeIndex: 1,
            offsetCm: 210,
            widthCm: 100,
            swing: null,
            beforeFullEdge: null,
        });
    });

    it("shrinks a passage to a 60 cm edge with offset 0 cm (Kurze Kante)", () => {
        const short = room(3, "WC", rectPoints(0, 0, 60, 150));
        expect(createOpening("passage", 0, edgeFrame(short.pointsCm, 0), 30, uuid(9), FACTORY_SETTINGS)).toMatchObject({
            widthCm: 60,
            offsetCm: 0,
            swing: null,
        });
    });

    it("hinges a door on the left seen from inside also on the bottom edge", () => {
        const bottom = edgeFrame(WOHNEN.pointsCm, 2);
        expect(createOpening("door", 2, bottom, 160, uuid(9), FACTORY_SETTINGS).swing).toEqual({ hinge: bottom.leftEnd, side: "inside" });
    });
});

describe("dragOffset", () => {
    it("snaps +37 cm to +35 cm with the 5 cm grid and keeps +37 cm with the 1 cm grid", () => {
        expect(dragOffset(160, 37, SNAP_STEP_CM, 500, 80)).toBe(195);
        expect(dragOffset(160, 37, FINE_SNAP_STEP_CM, 500, 80)).toBe(197);
    });

    it("stops at the end of the edge (offset 420 cm) and at its start", () => {
        expect(dragOffset(160, 400, SNAP_STEP_CM, 500, 80)).toBe(420);
        expect(dragOffset(160, -400, SNAP_STEP_CM, 500, 80)).toBe(0);
    });
});

describe("snap points when setting", () => {
    const top = edgeFrame(WOHNEN.pointsCm, 0);
    const TOL_100 = 8;

    it("centers a window clicked at x = 245 cm: 190–310 cm (Fenster mittig setzen)", () => {
        const snap = newOpeningSnap("window", top, 245, [], TOL_100, FACTORY_SETTINGS);
        expect(snap).toEqual({ offsetCm: 190, kind: "center", markAtCm: 250 });
        expect(createOpening("window", 0, top, 245, uuid(9), FACTORY_SETTINGS, snap)).toMatchObject({ offsetCm: 190, widthCm: 120 });
    });

    it("puts it at 185–305 cm without snapping (Ohne Rastpunkte)", () => {
        expect(createOpening("window", 0, top, 245, uuid(9), FACTORY_SETTINGS).offsetCm).toBe(185);
        expect(createOpening("window", 0, top, 245, uuid(9), FACTORY_SETTINGS, null).offsetCm).toBe(185);
    });

    it("centers at zoom 50 % (16 cm) for a click at x = 236 cm, not at zoom 100 %", () => {
        expect(newOpeningSnap("window", top, 236, [], 16, FACTORY_SETTINGS)?.offsetCm).toBe(190);
        expect(newOpeningSnap("window", top, 236, [], TOL_100, FACTORY_SETTINGS)).toBeNull();
    });

    it("does not snap a door clicked at x = 200 cm (Tür in die obere Wand)", () => {
        expect(newOpeningSnap("door", top, 200, [], TOL_100, FACTORY_SETTINGS)).toBeNull();
    });

    it("snaps beside an opening already on the edge", () => {
        expect(newOpeningSnap("window", top, 233, [{ offsetCm: 50, widthCm: 120 }], TOL_100, FACTORY_SETTINGS)).toMatchObject({
            kind: "neighbor",
            offsetCm: 170,
        });
    });
});

describe("snap points when dragging", () => {
    const snap = (others: { offsetCm: number; widthCm: number }[], widthCm: number) => ({
        targets: openingSnapTargets(500, widthCm, others),
        toleranceCm: 8,
    });

    it("snaps a door at 160 cm dragged by −154 cm flush to the corner (Bündig an die Ecke ziehen)", () => {
        expect(dragOffset(160, -154, SNAP_STEP_CM, 500, 80, snap([], 80))).toEqual({
            offsetCm: 0,
            snap: { offsetCm: 0, kind: "corner", markAtCm: 0 },
        });
    });

    it("gives 5 cm for the same drag without snap points (Ziehen ohne Rastpunkte)", () => {
        expect(dragOffset(160, -154, SNAP_STEP_CM, 500, 80, null)).toEqual({ offsetCm: 5, snap: null });
    });

    it("snaps window B at 300 cm dragged by −127 cm beside window A at 50–170 cm (Fensterband)", () => {
        expect(dragOffset(300, -127, SNAP_STEP_CM, 500, 120, snap([{ offsetCm: 50, widthCm: 120 }], 120))).toEqual({
            offsetCm: 170,
            snap: { offsetCm: 170, kind: "neighbor", markAtCm: 170 },
        });
    });

    it("keeps the grid for +37 cm with no snap point in reach (Tür verschieben)", () => {
        expect(dragOffset(160, 37, SNAP_STEP_CM, 500, 80, snap([], 80))).toEqual({ offsetCm: 195, snap: null });
    });

    it("snaps also with the 1 cm grid", () => {
        expect(dragOffset(160, 47, FINE_SNAP_STEP_CM, 500, 80, snap([], 80))).toMatchObject({ offsetCm: 210, snap: { kind: "center" } });
    });

    it("stops at the end of the edge (Am Kantenende)", () => {
        expect(dragOffset(160, 400, SNAP_STEP_CM, 500, 80, snap([], 80))).toMatchObject({ offsetCm: 420 });
    });
});
