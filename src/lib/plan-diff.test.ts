import { describe, expect, it } from "vitest";
import {
    addFloor,
    addOpening,
    addRoom,
    addShape,
    createEmptyPlan,
    moveFloor,
    moveRoom,
    removeFloor,
    removeOpening,
    removeRoom,
    removeShape,
    renameFloor,
    renamePlan,
    setActiveFloor,
    setCalibration,
    setUnderlay,
    updateOpening,
    updateRoom,
    resetSettings,
    updateSettings,
    updateShape,
    updateUnderlay,
} from "@/lib/plan";
import { resolveHistoryFocus, type HistoryFocus, resolveHistoryName, sameContent } from "@/lib/plan-diff";
import type { Opening, Plan } from "@/lib/plan-schema";
import { setEdgeLength } from "@/lib/room-geometry";
import { CAL_EG, CAL_OG, legacyPlan, rect, rectPoints, room, underlay, uuid } from "@/test/plan-fixtures";

const T0 = new Date("2026-11-01T10:00:00.000Z");
const T1 = new Date("2026-11-11T10:00:00.000Z");

/** EG: shapes 1, 2, 3 and a calibrated underlay; OG: shape 4 and an uncalibrated underlay. */
function basePlan(): Plan {
    let plan = legacyPlan(T0);
    for (const n of [1, 2, 3]) plan = addShape(plan, "eg", rect(n), T0);
    plan = addShape(plan, "og", rect(4), T0);
    plan = setUnderlay(plan, "og", underlay(), T0);
    return setUnderlay(plan, "eg", underlay(CAL_EG), T0);
}

describe("sameContent", () => {
    it("ignores the active floor, updatedAt and the name", () => {
        const plan = basePlan();
        expect(sameContent(plan, plan)).toBe(true);
        expect(sameContent(plan, setActiveFloor(plan, "og"))).toBe(true);
        expect(sameContent(plan, { ...plan, updatedAt: T1.toISOString() })).toBe(true);
        expect(sameContent(plan, renamePlan(plan, "Umzug", T1))).toBe(true);
    });

    it("sees changed settings", () => {
        const plan = basePlan();
        expect(sameContent(plan, updateSettings(plan, { snapStepCm: 2.5 }, T1))).toBe(false);
        expect(sameContent(plan, { ...plan, settings: plan.settings })).toBe(true);
    });

    it("sees another shape list", () => {
        const plan = basePlan();
        expect(sameContent(plan, updateShape(plan, "eg", uuid(1), { x: 150 }, T1))).toBe(false);
    });

    it("sees another calibration of a floor", () => {
        const plan = basePlan();
        expect(sameContent(plan, setCalibration(plan, "og", CAL_OG, T1))).toBe(false);
    });

    it("sees a hidden underlay", () => {
        const plan = basePlan();
        expect(sameContent(plan, updateUnderlay(plan, "eg", { visible: false }, T1))).toBe(false);
    });

    it("sees an added and a removed underlay", () => {
        const plan = basePlan();
        expect(sameContent(plan, setUnderlay(plan, "dg", underlay(), T1))).toBe(false);
        expect(sameContent(plan, setUnderlay(plan, "eg", null, T1))).toBe(false);
    });

    it("sees another plan (import)", () => {
        expect(sameContent(basePlan(), createEmptyPlan(T1, () => uuid(500)))).toBe(false);
    });
});

describe("resolveHistoryFocus", () => {
    it("undoing a move on the ground floor focuses that floor and shape", () => {
        const after = basePlan();
        const before = setActiveFloor(updateShape(after, "eg", uuid(2), { x: 250 }, T1), "og");
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: uuid(2), roomId: null, openingId: null });
    });

    it("undoing „hide underlay“ on the ground floor focuses it without a shape", () => {
        const after = basePlan();
        const before = setActiveFloor(updateUnderlay(after, "eg", { visible: false }, T1), "og");
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: null, openingId: null });
    });

    it("undoing „remove underlay“ focuses that floor without a shape", () => {
        const after = setActiveFloor(basePlan(), "dg");
        const before = setUnderlay(after, "og", null, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "og", shapeId: null, roomId: null, openingId: null });
    });

    it("undoing an insert focuses the floor without a shape", () => {
        const after = setActiveFloor(basePlan(), "dg");
        const before = addShape(after, "og", rect(5), T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "og", shapeId: null, roomId: null, openingId: null });
    });

    it("undoing a delete selects the restored shape", () => {
        const after = basePlan();
        const before = removeShape(after, "eg", uuid(2), T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: uuid(2), roomId: null, openingId: null });
    });

    it("a change on several floors (import) keeps the restored active floor without a shape", () => {
        const before = basePlan();
        const after = setActiveFloor(legacyPlan(T1), "og");
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "og", shapeId: null, roomId: null, openingId: null });
    });

    it("two changed shapes on one floor focus the floor without a shape", () => {
        const before = basePlan();
        const after = { ...before, shapesByFloor: { ...before.shapesByFloor, eg: before.shapesByFloor.eg.toReversed() } };
        const moved = updateShape(updateShape(before, "eg", uuid(1), { x: 1 }, T1), "eg", uuid(3), { x: 3 }, T1);
        expect(resolveHistoryFocus(before, moved)).toEqual({ floorId: "eg", shapeId: null, roomId: null, openingId: null });
        // A reorder keeps every shape object: no single shape counts as changed.
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: null, openingId: null });
    });

    it("a changed calibration of the upper floor focuses it without a shape", () => {
        const before = basePlan();
        const after = setCalibration(before, "og", CAL_OG, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "og", shapeId: null, roomId: null, openingId: null });
    });
});

describe("floor list", () => {
    const KELLER = uuid(100);

    it("a renamed floor is no same content and gets the focus", () => {
        const before = basePlan();
        const after = renameFloor(before, "dg", "Studio", T1);
        expect(sameContent(before, after)).toBe(false);
        // Undo of the rename: from „Studio“ back to „Dachgeschoss“.
        expect(resolveHistoryFocus(after, before)).toEqual({ floorId: "dg", shapeId: null, roomId: null, openingId: null });
    });

    it("undoing an added floor (missing in `after`) focuses after.activeFloorId", () => {
        const after = setActiveFloor(basePlan(), "og");
        const before = addFloor(after, KELLER, "Keller", T1);
        expect(before.activeFloorId).toBe(KELLER);
        expect(sameContent(before, after)).toBe(false);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "og", shapeId: null, roomId: null, openingId: null });
    });

    it("a restored deleted floor gets the focus, also in the middle of the list", () => {
        const after = basePlan();
        const before = removeFloor(after, "og", T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "og", shapeId: uuid(4), roomId: null, openingId: null });
        const withDgShapes = addShape(addShape(basePlan(), "dg", rect(6), T0), "dg", rect(7), T0);
        expect(resolveHistoryFocus(removeFloor(withDgShapes, "dg", T1), withDgShapes)).toEqual({
            floorId: "dg",
            shapeId: null,
            roomId: null,
            openingId: null,
        });
    });

    it("a swap of two floors affects both and keeps after.activeFloorId", () => {
        const after = setActiveFloor(basePlan(), "dg");
        const before = moveFloor(after, "eg", "down", T1);
        expect(sameContent(before, after)).toBe(false);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "dg", shapeId: null, roomId: null, openingId: null });
    });

    it("switching floors alone is the same content", () => {
        const plan = addFloor(basePlan(), KELLER, "Keller", T1);
        expect(sameContent(plan, setActiveFloor(plan, "eg"))).toBe(true);
    });

    it("falls back to the first floor if the active one is missing in `after`", () => {
        const after = { ...basePlan(), activeFloorId: "kg" };
        const before = updateShape(updateShape(after, "eg", uuid(1), { x: 1 }, T1), "og", uuid(4), { x: 1 }, T1);
        expect((resolveHistoryFocus(before, after) as HistoryFocus).floorId).toBe("eg");
    });
});

describe("rooms", () => {
    const DIELE = room(11, "Diele", rectPoints(349, 0, 150, 200));
    const withRooms = () => addRoom(addRoom(basePlan(), "eg", room(10), T0), "eg", DIELE, T0);

    it("sees an added, changed, moved and removed room", () => {
        const plan = withRooms();
        expect(sameContent(plan, addRoom(plan, "og", room(12), T1))).toBe(false);
        expect(sameContent(plan, updateRoom(plan, "eg", DIELE.id, { name: "Flur" }, T1))).toBe(false);
        expect(sameContent(plan, moveRoom(plan, "eg", DIELE.id, 25, 0, T1))).toBe(false);
        expect(sameContent(plan, removeRoom(plan, "eg", DIELE.id, T1))).toBe(false);
    });

    it("undoing a move of „Diele“ on the ground floor focuses that floor and room", () => {
        const after = setActiveFloor(withRooms(), "og");
        const before = setActiveFloor(moveRoom(after, "eg", DIELE.id, 25, 0, T1), "og");
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: DIELE.id, openingId: null });
    });

    it("redoing a delete focuses the floor without a room", () => {
        const before = withRooms();
        const after = removeRoom(before, "eg", DIELE.id, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: null, openingId: null });
    });

    it("undoing a move of a room with exactly one shape inside focuses the room, not the shape (Verschieben mit Möbel rückgängig)", () => {
        const after = addShape(withRooms(), "eg", rect(5, { x: 420, y: 80, locked: true }), T0);
        const before = moveRoom(after, "eg", DIELE.id, -30, 0, T1);
        expect(before.shapesByFloor.eg.at(-1)).toMatchObject({ x: 390, y: 80 });
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: DIELE.id, openingId: null });
        expect(resolveHistoryFocus(after, before)).toEqual({ floorId: "eg", shapeId: null, roomId: DIELE.id, openingId: null });
    });

    it("undoing a move of a room with several shapes inside focuses the room", () => {
        const after = withRooms();
        const before = moveRoom(after, "eg", room(10).id, 10, 0, T1);
        expect(before.shapesByFloor.eg.map((s) => s.x)).toEqual([110, 110, 110]);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: room(10).id, openingId: null });
    });

    it("a change of only one shape still focuses the shape", () => {
        const before = withRooms();
        const after = updateShape(before, "eg", uuid(1), { x: 5 }, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: uuid(1), roomId: null, openingId: null });
    });
});

describe("openings", () => {
    const WOHNEN = room(10, "Wohnen", rectPoints(0, 0, 500, 400));
    const DOOR: Opening = { id: uuid(20), kind: "door", edgeIndex: 0, offsetCm: 160, widthCm: 80, swing: { hinge: "start", side: "inside" }, beforeFullEdge: null };
    const WINDOW: Opening = { id: uuid(21), kind: "window", edgeIndex: 2, offsetCm: 100, widthCm: 120, swing: null, beforeFullEdge: null };
    const withOpenings = () => {
        const plan = addRoom(basePlan(), "eg", WOHNEN, T0);
        return addOpening(addOpening(plan, "eg", WOHNEN.id, DOOR, T0), "eg", WOHNEN.id, WINDOW, T0);
    };

    it("sees a moved opening as a content change", () => {
        const plan = withOpenings();
        expect(sameContent(plan, updateOpening(plan, "eg", DOOR.id, { offsetCm: 180 }, T1))).toBe(false);
    });

    it("undoing a door move on the ground floor while upstairs focuses that floor and the door", () => {
        const after = setActiveFloor(withOpenings(), "og");
        const before = setActiveFloor(updateOpening(after, "eg", DOOR.id, { offsetCm: 195 }, T1), "og");
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: null, openingId: DOOR.id });
    });

    it("redoing an added window focuses it", () => {
        const before = addRoom(basePlan(), "eg", WOHNEN, T0);
        const after = addOpening(before, "eg", WOHNEN.id, WINDOW, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: null, openingId: WINDOW.id });
    });

    it("undoing a set window selects nothing – not even the room", () => {
        const after = addRoom(basePlan(), "eg", WOHNEN, T0);
        const before = addOpening(after, "eg", WOHNEN.id, WINDOW, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: null, openingId: null });
        expect((resolveHistoryFocus(withOpenings(), removeOpening(withOpenings(), "eg", DOOR.id, T1)) as HistoryFocus).openingId).toBeNull();
    });

    it("undoing an edge change of the room focuses the room, also when an opening was re-anchored", () => {
        const after = withOpenings();
        const result = setEdgeLength(WOHNEN.pointsCm, 0, 520);
        if (!result.ok) throw new Error("setEdgeLength failed");
        const before = updateRoom(after, "eg", WOHNEN.id, { pointsCm: result.points }, T1);
        expect(before.roomsByFloor.eg[0].openings[1].offsetCm).toBe(120);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: WOHNEN.id, openingId: null });
    });

    it("undoing a wall thickness change focuses the room, also when it has openings", () => {
        const after = setActiveFloor(withOpenings(), "og");
        const before = updateRoom(after, "eg", WOHNEN.id, { wallThicknessCm: [36.5, 15, 15, 15] }, T1);
        expect(before.roomsByFloor.eg[0].openings).toEqual(after.roomsByFloor.eg[0].openings);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: WOHNEN.id, openingId: null });
        expect(resolveHistoryFocus(after, before)).toEqual({ floorId: "eg", shapeId: null, roomId: WOHNEN.id, openingId: null });
    });

    it("undoing a pure color change focuses the room", () => {
        const after = setActiveFloor(withOpenings(), "og");
        const before = updateRoom(after, "eg", WOHNEN.id, { color: "#BBF7D0" }, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: WOHNEN.id, openingId: null });
        expect(resolveHistoryFocus(after, before)).toEqual({ floorId: "eg", shapeId: null, roomId: WOHNEN.id, openingId: null });
    });

    it("a pure opening change still focuses the opening, not the room", () => {
        const before = withOpenings();
        const after = updateOpening(before, "eg", WINDOW.id, { offsetCm: 50 }, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "eg", shapeId: null, roomId: null, openingId: WINDOW.id });
    });
});

describe("resolveHistoryName", () => {
    it("keeps the current name within the same plan", () => {
        const after = basePlan();
        const before = renamePlan(updateShape(after, "eg", uuid(1), { x: 150 }, T1), "Umzug", T1);
        expect(resolveHistoryName(before, after)).toBe("Umzug");
    });

    it("takes the restored name when undo crosses an import", () => {
        const after = renamePlan(basePlan(), "Altbau", T0);
        const before = { ...createEmptyPlan(T1, () => uuid(500)), name: "Umzug Musterhaus" };
        expect(resolveHistoryName(before, after)).toBe("Altbau");
    });
});

describe("settings (Einstellungen als Schritte)", () => {
    it("keeps floor and selection when only the settings changed", () => {
        const after = basePlan();
        const before = updateSettings(after, { snapStepCm: 2.5 }, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ keep: true });
        expect(resolveHistoryFocus(after, before)).toEqual({ keep: true });
        expect(resolveHistoryFocus(before, resetSettings(before, T1))).toEqual({ keep: true });
    });

    it("uses the usual rule when a floor changed together with the settings (import)", () => {
        const after = basePlan();
        const before = updateShape(updateSettings(after, { snapStepCm: 2.5 }, T1), "og", uuid(4), { x: 1 }, T1);
        expect(resolveHistoryFocus(before, after)).toEqual({ floorId: "og", shapeId: uuid(4), roomId: null, openingId: null });
    });
});
