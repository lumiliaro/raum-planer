import { describe, expect, it } from "vitest";
import {
    addFloor,
    addOpening,
    addRoom,
    addShape,
    canMoveFloor,
    canRemoveFloor,
    canReorder,
    createEmptyPlan,
    findOpening,
    moveFloor,
    moveRoom,
    nextFloorName,
    nextRoomName,
    planHasContent,
    removeFloor,
    removeOpening,
    renameFloor,
    renamePlan,
    removeRoom,
    removeShape,
    reorderShape,
    setActiveFloor,
    setCalibration,
    setUnderlay,
    updateOpening,
    updateRoom,
    updateShape,
    resetSettings,
    updateSettings,
    updateUnderlay,
    type ReorderDirection,
} from "@/lib/plan";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import { PlanSchema, type FloorId, type Opening, type Plan, type Shape } from "@/lib/plan-schema";
import { setEdgeLength } from "@/lib/room-geometry";
import { CAL_EG, CAL_EG_OLD, CAL_OG, imageId, legacyPlan, rect, rectPoints, room, underlay, uuid } from "@/test/plan-fixtures";

const FLOOR_IDS = ["eg", "og", "dg"];

const CREATED = new Date("2026-11-01T10:00:00.000Z");
const NOW = new Date("2026-11-11T18:30:00.000Z");

const A = rect(1);
const B = rect(2);
const C = rect(3);

/** Plan created at CREATED with the given ground-floor shapes (built via `addShape`). */
function planWith(eg: Shape[], og: Shape[] = []): Plan {
    let plan = legacyPlan(CREATED);
    for (const s of eg) plan = addShape(plan, "eg", s, CREATED);
    for (const s of og) plan = addShape(plan, "og", s, CREATED);
    return plan;
}

const ids = (shapes: Shape[]) => shapes.map((s) => s.id);

describe("createEmptyPlan", () => {
    it("creates version 11 with one active floor „Erdgeschoss“ without shapes, rooms and underlay and with the factory settings (Leerer Plan)", () => {
        const id = crypto.randomUUID();
        const plan = createEmptyPlan(CREATED, () => id);
        expect(plan).toEqual({
            schemaVersion: 11,
            name: "Meine Planung",
            createdAt: "2026-11-01T10:00:00.000Z",
            updatedAt: "2026-11-01T10:00:00.000Z",
            floors: [{ id, name: "Erdgeschoss" }],
            activeFloorId: id,
            underlayByFloor: {},
            shapesByFloor: { [id]: [] },
            roomsByFloor: { [id]: [] },
            settings: FACTORY_SETTINGS,
        });
        expect(plan.settings.defaultWallThicknessCm).toBe(15);
        expect(plan.settings).not.toBe(FACTORY_SETTINGS);
        expect(PlanSchema.safeParse(plan).success).toBe(true);
    });

    it("uses a UUID as floor id, not „eg“", () => {
        const plan = createEmptyPlan(CREATED, () => crypto.randomUUID());
        expect(plan.floors[0].id).toMatch(/^[0-9a-f-]{36}$/);
    });
});

describe("addShape", () => {
    it("appends the shape at the end (on top) and sets updatedAt", () => {
        const plan = addShape(planWith([A, B]), "eg", C, NOW);
        expect(ids(plan.shapesByFloor.eg)).toEqual([A.id, B.id, C.id]);
        expect(plan.updatedAt).toBe(NOW.toISOString());
    });

    it("keeps other floors unchanged", () => {
        const before = planWith([A], [B]);
        const after = addShape(before, "eg", C, NOW);
        expect(after.shapesByFloor.og).toBe(before.shapesByFloor.og);
        expect(after.shapesByFloor.dg).toEqual([]);
    });

    it("rejects an id used on another floor (same object)", () => {
        const before = planWith([], [rect(7)]);
        expect(addShape(before, "eg", rect(7, { widthCm: 50 }), NOW)).toBe(before);
    });

    it("rejects an invalid shape (same object)", () => {
        const before = planWith([A]);
        expect(addShape(before, "eg", rect(9, { widthCm: 0 }), NOW)).toBe(before);
        expect(before.updatedAt).toBe(CREATED.toISOString());
    });
});

describe("updateShape", () => {
    it("changes the width and keeps depth, order, id and kind", () => {
        const before = planWith([A, B, C]);
        const after = updateShape(before, "eg", B.id, { widthCm: 180 }, NOW);
        const shape = after.shapesByFloor.eg[1];
        expect(ids(after.shapesByFloor.eg)).toEqual([A.id, B.id, C.id]);
        expect(shape).toMatchObject({ id: B.id, kind: "rect", widthCm: 180, depthCm: 90 });
        expect(after.updatedAt).toBe(NOW.toISOString());
    });

    it("ignores id and kind in the patch", () => {
        const after = updateShape(planWith([A]), "eg", A.id, { id: uuid(99), kind: "ellipse" } as never, NOW);
        expect(after.shapesByFloor.eg[0]).toMatchObject({ id: A.id, kind: "rect" });
    });

    it("rejects a change that makes the shape invalid (same object)", () => {
        const before = planWith([rect(1, { widthCm: 200, depthCm: 90, cornerRadiusCm: 40 })]);
        const after = updateShape(before, "eg", uuid(1), { depthCm: 60 }, NOW);
        expect(after).toBe(before);
        expect(after.shapesByFloor.eg[0]).toMatchObject({ depthCm: 90 });
    });

    it("returns the same object for an unknown id or wrong floor", () => {
        const before = planWith([A]);
        expect(updateShape(before, "eg", uuid(42), { widthCm: 10 }, NOW)).toBe(before);
        expect(updateShape(before, "og", A.id, { widthCm: 10 }, NOW)).toBe(before);
    });
});

describe("removeShape", () => {
    it("removes B from A, B, C keeping the order", () => {
        const after = removeShape(planWith([A, B, C]), "eg", B.id, NOW);
        expect(ids(after.shapesByFloor.eg)).toEqual([A.id, C.id]);
        expect(after.updatedAt).toBe(NOW.toISOString());
    });

    it("returns the same object for an unknown id", () => {
        const before = planWith([A]);
        expect(removeShape(before, "eg", B.id, NOW)).toBe(before);
    });
});

describe("reorderShape", () => {
    const cases: [string, Shape, ReorderDirection, Shape[]][] = [
        ["A one step forward", A, "forward", [B, A, C]],
        ["C one step backward", C, "backward", [A, C, B]],
        ["A to the front", A, "front", [B, C, A]],
        ["C to the back", C, "back", [C, A, B]],
    ];

    it.each(cases)("moves %s", (_, shape, direction, expected) => {
        const after = reorderShape(planWith([A, B, C]), "eg", shape.id, direction, NOW);
        expect(ids(after.shapesByFloor.eg)).toEqual(ids(expected));
        expect(after.updatedAt).toBe(NOW.toISOString());
    });

    const atTarget: [string, Shape, ReorderDirection][] = [
        ["C forward", C, "forward"],
        ["C to the front", C, "front"],
        ["A backward", A, "backward"],
        ["A to the back", A, "back"],
    ];

    it.each(atTarget)("returns the same object when already at the target: %s", (_, shape, direction) => {
        const before = planWith([A, B, C]);
        expect(reorderShape(before, "eg", shape.id, direction, NOW)).toBe(before);
    });

    it("returns the same object for an unknown id", () => {
        const before = planWith([A, B]);
        expect(reorderShape(before, "eg", C.id, "front", NOW)).toBe(before);
    });
});

describe("setActiveFloor", () => {
    it("returns the same object for an unknown floor", () => {
        const before = planWith([A]);
        expect(setActiveFloor(before, "keller")).toBe(before);
    });

    it("changes the active floor without touching updatedAt", () => {
        const before = planWith([A]);
        const after = setActiveFloor(before, "og");
        expect(after.activeFloorId).toBe("og");
        expect(after.updatedAt).toBe(CREATED.toISOString());
        expect(after.shapesByFloor).toBe(before.shapesByFloor);
    });

    it("returns the same object for the current floor", () => {
        const before = legacyPlan(CREATED);
        expect(setActiveFloor(before, "eg")).toBe(before);
    });
});

describe("setUnderlay", () => {
    const withUnderlays = () => {
        let plan = planWith([A], [B]);
        plan = setUnderlay(plan, "eg", underlay(CAL_EG), CREATED);
        return setUnderlay(plan, "og", underlay(CAL_OG, { imageId: imageId(2) }), CREATED);
    };

    it("sets an underlay, keeps the other floors and shapes and sets updatedAt", () => {
        const before = planWith([A], [B]);
        const after = setUnderlay(before, "dg", underlay(), NOW);
        expect(after.underlayByFloor.dg).toEqual(underlay());
        expect(after.shapesByFloor).toBe(before.shapesByFloor);
        expect(after.updatedAt).toBe(NOW.toISOString());
        expect(PlanSchema.safeParse(after).success).toBe(true);
    });

    it("changes an underlay; the other floor's underlay stays the same object", () => {
        const before = withUnderlays();
        const after = setUnderlay(before, "eg", underlay(CAL_EG, { opacity: 0.4 }), NOW);
        expect(after.underlayByFloor.eg?.opacity).toBe(0.4);
        expect(after.underlayByFloor.og).toBe(before.underlayByFloor.og);
    });

    it("removes the ground floor's underlay; the upper floor's and all shapes stay", () => {
        const before = withUnderlays();
        const after = setUnderlay(before, "eg", null, NOW);
        expect(after.underlayByFloor).not.toHaveProperty("eg");
        expect(after.underlayByFloor.og).toBe(before.underlayByFloor.og);
        expect(after.shapesByFloor).toBe(before.shapesByFloor);
        expect(after.updatedAt).toBe(NOW.toISOString());
        expect(PlanSchema.safeParse(after).success).toBe(true);
    });

    it("rejects an unknown floor „keller“ (same object)", () => {
        const before = withUnderlays();
        expect(setUnderlay(before, "keller", underlay(), NOW)).toBe(before);
        expect(setUnderlay(before, "keller", null, NOW)).toBe(before);
    });

    it("rejects an invalid underlay and removing a missing one (same object)", () => {
        const before = withUnderlays();
        expect(setUnderlay(before, "eg", underlay(CAL_EG, { opacity: 0.05 }), NOW)).toBe(before);
        expect(setUnderlay(before, "eg", underlay(null, { imageWidthPx: null, imageHeightPx: null }), NOW)).toBe(before);
        expect(setUnderlay(before, "dg", null, NOW)).toBe(before);
    });
});

describe("updateUnderlay", () => {
    const withUnderlay = () => setUnderlay(planWith([A]), "eg", underlay(CAL_EG), CREATED);

    it("hides the underlay and sets updatedAt; image and calibration stay", () => {
        const before = withUnderlay();
        const after = updateUnderlay(before, "eg", { visible: false }, NOW);
        expect(after.underlayByFloor.eg).toEqual(underlay(CAL_EG, { visible: false }));
        expect(after.updatedAt).toBe(NOW.toISOString());
        expect(after.shapesByFloor).toBe(before.shapesByFloor);
    });

    it("sets the opacity", () => {
        expect(updateUnderlay(withUnderlay(), "eg", { opacity: 0.4 }, NOW).underlayByFloor.eg?.opacity).toBe(0.4);
    });

    it("rejects a floor without underlay, an invalid and an unchanged value (same object)", () => {
        const before = withUnderlay();
        expect(updateUnderlay(before, "og", { visible: false }, NOW)).toBe(before);
        expect(updateUnderlay(before, "eg", { opacity: 0 }, NOW)).toBe(before);
        expect(updateUnderlay(before, "eg", { visible: true, opacity: 1 }, NOW)).toBe(before);
        expect(updateUnderlay(before, "eg", {}, NOW)).toBe(before);
    });
});

describe("setCalibration", () => {
    const calibrated = () => {
        let plan = planWith([A], [B]);
        plan = setUnderlay(plan, "eg", underlay(CAL_EG_OLD, { visible: false, opacity: 0.4 }), CREATED);
        return setUnderlay(plan, "og", underlay(CAL_OG), CREATED);
    };

    it("replaces the ground floor's calibration and keeps the rest", () => {
        const before = calibrated();
        expect(before.underlayByFloor.eg?.calibration?.pxPerCm).toBe(0.748);
        const after = setCalibration(before, "eg", CAL_EG, NOW);
        expect(after.underlayByFloor.eg?.calibration?.pxPerCm).toBe(0.9986);
        expect(after.underlayByFloor.og).toBe(before.underlayByFloor.og);
        expect(after.shapesByFloor).toBe(before.shapesByFloor);
        expect(after.updatedAt).toBe(NOW.toISOString());
        expect(PlanSchema.safeParse(after).success).toBe(true);
    });

    it("keeps image, visibility and opacity of the underlay", () => {
        const after = setCalibration(calibrated(), "eg", { ...CAL_EG, align: "horizontal" }, NOW);
        expect(after.underlayByFloor.eg).toEqual(
            underlay({ ...CAL_EG, align: "horizontal" }, { visible: false, opacity: 0.4 }),
        );
    });

    it("rejects an unknown floor and a floor without underlay (same object)", () => {
        const before = calibrated();
        expect(setCalibration(before, "keller", CAL_EG, NOW)).toBe(before);
        expect(setCalibration(before, "dg", CAL_EG, NOW)).toBe(before);
    });

    it("rejects a real length of 0 cm (same object)", () => {
        const before = calibrated();
        expect(setCalibration(before, "eg", { ...CAL_EG, realLengthCm: 0 }, NOW)).toBe(before);
    });
});

describe("planHasContent", () => {
    const NOW = new Date("2026-11-11T10:00:00.000Z");

    it("is false for a plan without shapes and underlays", () => {
        expect(planHasContent(legacyPlan(NOW))).toBe(false);
    });

    it("is true for a plan with one shape", () => {
        expect(planHasContent(addShape(legacyPlan(NOW), "dg", rect(1), NOW))).toBe(true);
    });

    it("is true for a plan with only an underlay", () => {
        expect(planHasContent(setUnderlay(legacyPlan(NOW), "eg", underlay(), NOW))).toBe(true);
    });

    it("is true for a plan with only a room", () => {
        expect(planHasContent(addRoom(legacyPlan(NOW), "og", room(1), NOW))).toBe(true);
    });
});

describe("renamePlan", () => {
    const CREATED_AT = new Date("2026-11-01T10:00:00.000Z");
    const NOW = new Date("2026-11-11T10:00:00.000Z");
    const plan = () =>
        setUnderlay(addShape(legacyPlan(CREATED_AT), "eg", rect(1), CREATED_AT), "eg", underlay(CAL_EG), CREATED_AT);

    it("sets the trimmed name and updatedAt, keeping shapes and underlays", () => {
        const before = plan();
        const after = renamePlan(before, "  Umzug  ", NOW);
        expect(after.name).toBe("Umzug");
        expect(after.updatedAt).toBe(NOW.toISOString());
        expect(after.shapesByFloor).toBe(before.shapesByFloor);
        expect(after.underlayByFloor).toBe(before.underlayByFloor);
        expect(PlanSchema.safeParse(after).success).toBe(true);
    });

    it.each(["", "   ", "Meine Planung", " Meine Planung "])("rejects %j", (name) => {
        const before = plan();
        expect(renamePlan(before, name, NOW)).toBe(before);
    });
});

describe("canReorder", () => {
    const NOW = new Date("2026-11-11T10:00:00.000Z");
    const three = () => [1, 2, 3].reduce((p, n) => addShape(p, "eg", rect(n), NOW), legacyPlan(NOW));

    it("the top shape can only go backward", () => {
        const plan = three();
        expect(canReorder(plan, "eg", uuid(3), "forward")).toBe(false);
        expect(canReorder(plan, "eg", uuid(3), "front")).toBe(false);
        expect(canReorder(plan, "eg", uuid(3), "backward")).toBe(true);
        expect(canReorder(plan, "eg", uuid(3), "back")).toBe(true);
    });

    it("the bottom shape can only go forward; a middle one both ways", () => {
        const plan = three();
        expect(canReorder(plan, "eg", uuid(1), "back")).toBe(false);
        expect(canReorder(plan, "eg", uuid(1), "front")).toBe(true);
        for (const d of ["forward", "backward", "front", "back"] as const) expect(canReorder(plan, "eg", uuid(2), d)).toBe(true);
    });

    it("the only shape cannot move", () => {
        const plan = addShape(legacyPlan(NOW), "eg", rect(1), NOW);
        for (const d of ["forward", "backward", "front", "back"] as const) expect(canReorder(plan, "eg", uuid(1), d)).toBe(false);
    });

    it("an unknown id cannot move", () => {
        expect(canReorder(three(), "eg", uuid(9), "forward")).toBe(false);
        expect(canReorder(three(), "og", uuid(1), "forward")).toBe(false);
    });
});

describe("plan operations keep unchanged floors by reference", () => {
    const NOW = new Date("2026-11-11T10:00:00.000Z");
    const plan = () => {
        let p = legacyPlan(NOW);
        p = addShape(p, "eg", rect(1), NOW);
        p = addShape(p, "eg", rect(2), NOW);
        p = addShape(p, "og", rect(3), NOW);
        p = setUnderlay(p, "eg", underlay(CAL_EG), NOW);
        return setUnderlay(p, "og", underlay(CAL_OG), NOW);
    };

    it.each<[string, (p: Plan) => Plan, FloorId[], FloorId[]]>([
        ["addShape", (p) => addShape(p, "eg", rect(4), NOW), ["eg"], []],
        ["updateShape", (p) => updateShape(p, "eg", uuid(1), { x: 5 }, NOW), ["eg"], []],
        ["removeShape", (p) => removeShape(p, "eg", uuid(1), NOW), ["eg"], []],
        ["reorderShape", (p) => reorderShape(p, "eg", uuid(1), "front", NOW), ["eg"], []],
        ["setActiveFloor", (p) => setActiveFloor(p, "og"), [], []],
        ["renamePlan", (p) => renamePlan(p, "Umzug", NOW), [], []],
        ["setCalibration", (p) => setCalibration(p, "og", CAL_EG_OLD, NOW), [], ["og"]],
        ["setUnderlay", (p) => setUnderlay(p, "dg", underlay(), NOW), [], ["dg"]],
        ["updateUnderlay", (p) => updateUnderlay(p, "eg", { visible: false }, NOW), [], ["eg"]],
    ])("%s", (_, op, changedShapes, changedUnderlays) => {
        const before = plan();
        const after = op(before);
        for (const id of FLOOR_IDS) {
            if (!changedShapes.includes(id)) expect(after.shapesByFloor[id]).toBe(before.shapesByFloor[id]);
            if (!changedUnderlays.includes(id)) expect(after.underlayByFloor[id]).toBe(before.underlayByFloor[id]);
        }
        // Unchanged shapes on a changed floor stay the same objects, too.
        const touched = new Set([uuid(1), uuid(4)]);
        for (const id of changedShapes) {
            const previous = new Map(before.shapesByFloor[id].map((s) => [s.id, s]));
            for (const shape of after.shapesByFloor[id]) {
                if (!touched.has(shape.id)) expect(shape).toBe(previous.get(shape.id));
            }
        }
    });
});

const KELLER = uuid(100);

/** Plan with Erdgeschoss, Obergeschoss, Keller (created at CREATED), Obergeschoss active. */
function planWithKeller(): Plan {
    return setActiveFloor(addFloor(legacyPlan(CREATED), KELLER, "Keller", CREATED), "og");
}

const floorNames = (plan: Plan) => plan.floors.map((f) => f.name);

describe("nextFloorName", () => {
    const floors = (...names: string[]) => names.map((name, i) => ({ id: `f${i}`, name }));

    it("is „Neue Etage“ if no floor has that name", () => {
        expect(nextFloorName(floors("Erdgeschoss"))).toBe("Neue Etage");
        expect(nextFloorName(floors("Neue Etage 2"))).toBe("Neue Etage");
    });

    it("is „Neue Etage 2“ if „Neue Etage“ exists", () => {
        expect(nextFloorName(floors("Erdgeschoss", "Neue Etage"))).toBe("Neue Etage 2");
    });

    it("fills a gap", () => {
        expect(nextFloorName(floors("Neue Etage", "Neue Etage 3"))).toBe("Neue Etage 2");
        expect(nextFloorName(floors("Neue Etage", "Neue Etage 2", "Neue Etage 3"))).toBe("Neue Etage 4");
    });
});

describe("addFloor", () => {
    it("appends the floor, makes it active with an empty shape list and sets updatedAt", () => {
        const before = planWith([A]);
        const after = addFloor(before, KELLER, "Keller", NOW);
        expect(after.floors.at(-1)).toEqual({ id: KELLER, name: "Keller" });
        expect(after.activeFloorId).toBe(KELLER);
        expect(after.shapesByFloor[KELLER]).toEqual([]);
        expect(after.roomsByFloor[KELLER]).toEqual([]);
        expect(after.underlayByFloor[KELLER]).toBeUndefined();
        expect(after.updatedAt).toBe(NOW.toISOString());
        expect(after.shapesByFloor.eg).toBe(before.shapesByFloor.eg);
        expect(PlanSchema.safeParse(after).success).toBe(true);
    });

    it("trims the name", () => {
        expect(addFloor(planWith([]), KELLER, "  Keller ", NOW).floors.at(-1)?.name).toBe("Keller");
    });

    it("rejects a 9th floor", () => {
        let plan = legacyPlan(CREATED);
        for (let n = 1; n <= 5; n++) plan = addFloor(plan, uuid(200 + n), `Etage ${n}`, CREATED);
        expect(plan.floors).toHaveLength(8);
        expect(addFloor(plan, KELLER, "Keller", NOW)).toBe(plan);
    });

    it("rejects an id in use and an empty name", () => {
        const before = planWith([A]);
        expect(addFloor(before, "og", "Keller", NOW)).toBe(before);
        expect(addFloor(before, KELLER, "   ", NOW)).toBe(before);
        expect(addFloor(before, KELLER, "x".repeat(41), NOW)).toBe(before);
    });
});

describe("renameFloor", () => {
    it("sets the trimmed name and updatedAt", () => {
        const after = renameFloor(planWithKeller(), "dg", "  Studio ", NOW);
        expect(after.floors.find((f) => f.id === "dg")?.name).toBe("Studio");
        expect(after.updatedAt).toBe(NOW.toISOString());
    });

    it.each(["", "   ", "x".repeat(41), "Dachgeschoss", " Dachgeschoss "])("rejects %j (same object)", (name) => {
        const before = planWithKeller();
        const after = renameFloor(before, "dg", name, NOW);
        expect(after).toBe(before);
        expect(after.updatedAt).toBe(CREATED.toISOString());
    });

    it("rejects an unknown id", () => {
        const before = planWithKeller();
        expect(renameFloor(before, "kg", "Keller", NOW)).toBe(before);
    });
});

describe("moveFloor", () => {
    it("moves „Keller“ to the front in two steps; the active floor stays", () => {
        const withoutDg = removeFloor(legacyPlan(CREATED), "dg", CREATED);
        const plan = setActiveFloor(addFloor(withoutDg, KELLER, "Keller", CREATED), "og");
        expect(floorNames(plan)).toEqual(["Erdgeschoss", "Obergeschoss", "Keller"]);
        const once = moveFloor(plan, KELLER, "up", NOW);
        const twice = moveFloor(once, KELLER, "up", NOW);
        expect(floorNames(once)).toEqual(["Erdgeschoss", "Keller", "Obergeschoss"]);
        expect(floorNames(twice)).toEqual(["Keller", "Erdgeschoss", "Obergeschoss"]);
        expect(twice.activeFloorId).toBe("og");
        expect(twice.updatedAt).toBe(NOW.toISOString());
        expect(twice.shapesByFloor).toBe(plan.shapesByFloor);
        expect(moveFloor(twice, KELLER, "up", NOW)).toBe(twice);
    });

    it("moves down", () => {
        expect(floorNames(moveFloor(legacyPlan(CREATED), "eg", "down", NOW))).toEqual([
            "Obergeschoss",
            "Erdgeschoss",
            "Dachgeschoss",
        ]);
    });

    it("rejects at the edges and for an unknown id", () => {
        const plan = legacyPlan(CREATED);
        expect(moveFloor(plan, "eg", "up", NOW)).toBe(plan);
        expect(moveFloor(plan, "dg", "down", NOW)).toBe(plan);
        expect(moveFloor(plan, "kg", "up", NOW)).toBe(plan);
        expect(canMoveFloor(plan, "eg", "up")).toBe(false);
        expect(canMoveFloor(plan, "eg", "down")).toBe(true);
        expect(canMoveFloor(plan, "dg", "down")).toBe(false);
        expect(canMoveFloor(plan, "og", "up")).toBe(true);
    });
});

describe("removeFloor", () => {
    const full = () => {
        let plan = planWith([A], [B, C]);
        plan = addShape(plan, "dg", rect(4), CREATED);
        plan = setUnderlay(plan, "og", underlay(CAL_OG), CREATED);
        return setUnderlay(plan, "eg", underlay(CAL_EG), CREATED);
    };

    it("removes shapes, rooms and underlay; other floors keep their references", () => {
        const before = addRoom(addRoom(full(), "og", room(20), CREATED), "eg", room(21), CREATED);
        const after = removeFloor(before, "og", NOW);
        expect(floorNames(after)).toEqual(["Erdgeschoss", "Dachgeschoss"]);
        expect(after.shapesByFloor).not.toHaveProperty("og");
        expect(after.roomsByFloor).not.toHaveProperty("og");
        expect(after.roomsByFloor.eg).toBe(before.roomsByFloor.eg);
        expect(after.underlayByFloor).not.toHaveProperty("og");
        expect(after.shapesByFloor.eg).toBe(before.shapesByFloor.eg);
        expect(after.shapesByFloor.dg).toBe(before.shapesByFloor.dg);
        expect(after.underlayByFloor.eg).toBe(before.underlayByFloor.eg);
        expect(after.updatedAt).toBe(NOW.toISOString());
        expect(PlanSchema.safeParse(after).success).toBe(true);
    });

    it("makes the following floor active when the active one is removed", () => {
        const before = setActiveFloor(full(), "og");
        expect(removeFloor(before, "og", NOW).activeFloorId).toBe("dg");
    });

    it("makes the previous floor active when the active last floor is removed", () => {
        const before = setActiveFloor(full(), "dg");
        expect(removeFloor(before, "dg", NOW).activeFloorId).toBe("og");
    });

    it("keeps an inactive active floor", () => {
        expect(removeFloor(full(), "dg", NOW).activeFloorId).toBe("eg");
    });

    it("rejects the only floor and an unknown id", () => {
        const single = createEmptyPlan(CREATED, () => KELLER);
        expect(removeFloor(single, KELLER, NOW)).toBe(single);
        expect(canRemoveFloor(single, KELLER)).toBe(false);
        const plan = full();
        expect(removeFloor(plan, "kg", NOW)).toBe(plan);
        expect(canRemoveFloor(plan, "og")).toBe(true);
    });
});

describe("rooms", () => {
    const WOHNEN = room(10);
    const DIELE = room(11, "Diele", rectPoints(349, 0, 150, 200));
    const withRooms = () => addRoom(addRoom(legacyPlan(CREATED), "eg", WOHNEN, CREATED), "eg", DIELE, CREATED);

    describe("addRoom", () => {
        it("appends the room on top of the floor's list and sets updatedAt", () => {
            const plan = addRoom(withRooms(), "eg", room(12, "Bad", rectPoints(0, 600, 200, 200)), NOW);
            expect(plan.roomsByFloor.eg.map((r) => r.name)).toEqual(["Wohnen", "Diele", "Bad"]);
            expect(plan.updatedAt).toBe(NOW.toISOString());
            expect(PlanSchema.safeParse(plan).success).toBe(true);
        });

        it("keeps the other floors' rooms and the shapes", () => {
            const before = addShape(withRooms(), "eg", A, CREATED);
            const after = addRoom(before, "og", room(12), NOW);
            expect(after.roomsByFloor.eg).toBe(before.roomsByFloor.eg);
            expect(after.shapesByFloor).toBe(before.shapesByFloor);
        });

        it("rejects an id in use on any floor, an invalid room and an unknown floor (same object)", () => {
            const plan = withRooms();
            expect(addRoom(plan, "og", { ...room(12), id: WOHNEN.id }, NOW)).toBe(plan);
            expect(addRoom(plan, "eg", room(12, "Flur", rectPoints(0, 0, 100, 100).slice(0, 2)), NOW)).toBe(plan);
            expect(addRoom(plan, "eg", room(12, "  "), NOW)).toBe(plan);
            expect(addRoom(plan, "kg", room(12), NOW)).toBe(plan);
        });
    });

    describe("updateRoom", () => {
        it("renames with a trimmed name, keeping id, corners and place", () => {
            const plan = updateRoom(withRooms(), "eg", WOHNEN.id, { name: "  Küche " }, NOW);
            expect(plan.roomsByFloor.eg[0]).toEqual({ ...WOHNEN, name: "Küche" });
            expect(plan.updatedAt).toBe(NOW.toISOString());
        });

        it("sets the update time to 11.11.2026, 18:30 when renaming", () => {
            expect(updateRoom(withRooms(), "eg", WOHNEN.id, { name: "Küche" }, NOW).updatedAt).toBe("2026-11-11T18:30:00.000Z");
        });

        it("replaces the corners", () => {
            const pointsCm = rectPoints(0, 0, 350, 560);
            expect(updateRoom(withRooms(), "eg", WOHNEN.id, { pointsCm }, NOW).roomsByFloor.eg[0].pointsCm).toEqual(pointsCm);
        });

        it.each([
            ["an empty name", { name: "" }],
            ["a blank name", { name: "   " }],
            ["two corners", { pointsCm: rectPoints(0, 0, 100, 100).slice(0, 2) }],
            ["an unchanged name", { name: "Wohnen" }],
            ["unchanged corners", { pointsCm: rectPoints(0, 0, 337.5, 560) }],
        ])("rejects %s (same object)", (_name, patch) => {
            const plan = withRooms();
            expect(updateRoom(plan, "eg", WOHNEN.id, patch, NOW)).toBe(plan);
        });

        it("rejects an unknown room or floor", () => {
            const plan = withRooms();
            expect(updateRoom(plan, "og", WOHNEN.id, { name: "Küche" }, NOW)).toBe(plan);
            expect(updateRoom(plan, "eg", uuid(99), { name: "Küche" }, NOW)).toBe(plan);
        });
    });

    describe("moveRoom", () => {
        it("moves all corners and leaves shapes outside the room alone", () => {
            const before = addShape(withRooms(), "eg", A, CREATED);
            const after = moveRoom(before, "eg", DIELE.id, 25, 0, NOW);
            expect(after.roomsByFloor.eg[1].pointsCm).toEqual(rectPoints(374, 0, 150, 200));
            expect(after.roomsByFloor.eg[0]).toBe(before.roomsByFloor.eg[0]);
            expect(after.shapesByFloor).toBe(before.shapesByFloor);
            expect(after.updatedAt).toBe(NOW.toISOString());
        });

        it("rejects a move by 0 and an unknown room", () => {
            const plan = withRooms();
            expect(moveRoom(plan, "eg", DIELE.id, 0, 0, NOW)).toBe(plan);
            expect(moveRoom(plan, "eg", uuid(99), 5, 0, NOW)).toBe(plan);
        });

        describe("takes the shapes inside along", () => {
            const LIVING = room(20, "Wohnen", rectPoints(0, 0, 400, 500));
            const SOFA = rect(1, { x: 200, y: 100, rotationDeg: 90, mirrored: true, label: "Sofa" });
            const TABLE = rect(2, { x: 600, y: 100 });
            const TUB = rect(3, { x: 120, y: 80, locked: true });
            const OTHER_FLOOR = rect(4, { x: 200, y: 100 });
            const living = (eg: Shape[], og: Shape[] = []) => addRoom(planWith(eg, og), "eg", LIVING, CREATED);

            it("moves a shape inside by the same offset and keeps everything else (Möbel im Raum wandern mit)", () => {
                const after = moveRoom(living([SOFA]), "eg", LIVING.id, 50, 20, NOW);
                expect(after.shapesByFloor.eg).toEqual([{ ...SOFA, x: 250, y: 120 }]);
                expect(after.roomsByFloor.eg[0].pointsCm).toEqual(rectPoints(50, 20, 400, 500));
            });

            it("leaves a shape outside where it is (Möbel außerhalb bleiben liegen)", () => {
                const before = living([SOFA, TABLE]);
                const after = moveRoom(before, "eg", LIVING.id, 50, 0, NOW);
                expect(after.shapesByFloor.eg[1]).toBe(before.shapesByFloor.eg[1]);
                expect(after.shapesByFloor.eg[1]).toMatchObject({ x: 600, y: 100 });
            });

            it("moves a locked shape and keeps it locked (Gesperrte Form wandert mit)", () => {
                const after = moveRoom(living([TUB]), "eg", LIVING.id, -30, 0, NOW);
                expect(after.shapesByFloor.eg[0]).toEqual({ ...TUB, x: 90, y: 80 });
            });

            it("keeps the drawing order and the shapes of other floors", () => {
                const before = living([TABLE, SOFA, TUB], [OTHER_FLOOR]);
                const after = moveRoom(before, "eg", LIVING.id, 10, 10, NOW);
                expect(ids(after.shapesByFloor.eg)).toEqual([TABLE.id, SOFA.id, TUB.id]);
                expect(after.shapesByFloor.og).toBe(before.shapesByFloor.og);
            });

            it("rounds the new position to 0.1 cm", () => {
                const after = moveRoom(living([rect(5, { x: 200.1, y: 100 })]), "eg", LIVING.id, 0.05, 0, NOW);
                expect(after.shapesByFloor.eg[0]).toMatchObject({ x: 200.2, y: 100 });
            });

            it("changes nothing when the move is rejected", () => {
                const plan = living([SOFA]);
                expect(moveRoom(plan, "eg", LIVING.id, 0, 0, NOW)).toBe(plan);
                expect(moveRoom(plan, "eg", uuid(99), 5, 0, NOW)).toBe(plan);
            });
        });
    });

    describe("removeRoom", () => {
        it("removes the room, keeps the shapes and sets updatedAt", () => {
            const before = addShape(withRooms(), "eg", A, CREATED);
            const after = removeRoom(before, "eg", DIELE.id, NOW);
            expect(after.roomsByFloor.eg).toEqual([WOHNEN]);
            expect(after.shapesByFloor).toBe(before.shapesByFloor);
            expect(after.updatedAt).toBe(NOW.toISOString());
        });

        it("rejects an unknown room", () => {
            const plan = withRooms();
            expect(removeRoom(plan, "og", DIELE.id, NOW)).toBe(plan);
        });
    });

    describe("nextRoomName", () => {
        it("is „Raum 1“ without rooms", () => {
            expect(nextRoomName([])).toBe("Raum 1");
        });

        it("is „Raum 2“ with „Raum 1“ and „Raum 3“ present", () => {
            expect(nextRoomName([room(1, "Raum 1"), room(3, "Raum 3"), room(4, "Wohnen")])).toBe("Raum 2");
        });
    });
});

describe("openings", () => {
    /** „Wohnen“ (0|0)–(500|400) on the ground floor, „Bad“ upstairs. */
    const WOHNEN = room(10, "Wohnen", rectPoints(0, 0, 500, 400));
    const BAD = room(11, "Bad", rectPoints(0, 0, 300, 200));
    /** Door on the top edge from x = 160 to x = 240 cm. */
    const DOOR: Opening = {
        id: uuid(20),
        kind: "door",
        edgeIndex: 0,
        offsetCm: 160,
        widthCm: 80,
        swing: { hinge: "start", side: "inside" },
        beforeFullEdge: null,
    };
    /** Window on the bottom edge from x = 400 to x = 280 cm. */
    const WINDOW: Opening = { id: uuid(21), kind: "window", edgeIndex: 2, offsetCm: 100, widthCm: 120, swing: null, beforeFullEdge: null };
    const base = () => addRoom(addRoom(legacyPlan(CREATED), "eg", WOHNEN, CREATED), "og", BAD, CREATED);
    const withOpenings = () => addOpening(addOpening(base(), "eg", WOHNEN.id, DOOR, CREATED), "eg", WOHNEN.id, WINDOW, CREATED);
    const wohnen = (plan: Plan) => plan.roomsByFloor.eg[0];

    describe("addOpening", () => {
        it("appends the opening to the room and sets updatedAt", () => {
            const plan = addOpening(base(), "eg", WOHNEN.id, DOOR, NOW);
            expect(wohnen(plan).openings).toEqual([DOOR]);
            expect(plan.updatedAt).toBe(NOW.toISOString());
            expect(PlanSchema.safeParse(plan).success).toBe(true);
        });

        it("rejects an opening that does not fit, an id in use on any floor and an unknown room (same object)", () => {
            const plan = withOpenings();
            expect(addOpening(plan, "eg", WOHNEN.id, { ...DOOR, id: uuid(22), offsetCm: 450 }, NOW)).toBe(plan);
            expect(addOpening(plan, "eg", WOHNEN.id, { ...DOOR, id: uuid(22), edgeIndex: 4 }, NOW)).toBe(plan);
            expect(addOpening(plan, "eg", WOHNEN.id, { ...WINDOW, id: uuid(22), swing: DOOR.swing }, NOW)).toBe(plan);
            expect(addOpening(plan, "og", BAD.id, { ...WINDOW, offsetCm: 0 }, NOW)).toBe(plan);
            expect(addOpening(plan, "og", WOHNEN.id, { ...DOOR, id: uuid(22) }, NOW)).toBe(plan);
        });

        it("keeps other floors and rooms by reference", () => {
            const before = base();
            const after = addOpening(before, "eg", WOHNEN.id, DOOR, NOW);
            expect(after.roomsByFloor.og).toBe(before.roomsByFloor.og);
            expect(after.shapesByFloor).toBe(before.shapesByFloor);
        });
    });

    describe("updateOpening", () => {
        it("moves the door by 20 cm, keeps the order and sets the update time to 11.11.2026, 18:30", () => {
            const plan = updateOpening(withOpenings(), "eg", DOOR.id, { offsetCm: 180 }, NOW);
            expect(wohnen(plan).openings).toEqual([{ ...DOOR, offsetCm: 180 }, WINDOW]);
            expect(plan.updatedAt).toBe("2026-11-11T18:30:00.000Z");
        });

        it("replaces the swing and keeps id and kind", () => {
            const swing = { hinge: "end", side: "outside" } as const;
            const plan = updateOpening(withOpenings(), "eg", DOOR.id, { swing, ...({ id: uuid(99), kind: "window" } as object) }, NOW);
            expect(wohnen(plan).openings[0]).toEqual({ ...DOOR, swing });
        });

        it.each([
            ["a width that sticks out", { widthCm: 400 }],
            ["a door without swing", { swing: null }],
            ["an unknown edge", { edgeIndex: 9 }],
            ["nothing new", { offsetCm: 160 }],
        ])("rejects %s (same object)", (_name, patch) => {
            const plan = withOpenings();
            expect(updateOpening(plan, "eg", DOOR.id, patch, NOW)).toBe(plan);
        });

        it("rejects an unknown opening or floor", () => {
            const plan = withOpenings();
            expect(updateOpening(plan, "og", DOOR.id, { offsetCm: 0 }, NOW)).toBe(plan);
            expect(updateOpening(plan, "eg", uuid(99), { offsetCm: 0 }, NOW)).toBe(plan);
        });

        describe("remembered sizes for „Ganze Kante“", () => {
            /** The window over the whole 500 cm bottom edge, remembering 120 cm at 100 cm. */
            const REMEMBERED = { offsetCm: 100, widthCm: 120 };
            const fullWindow = () => updateOpening(withOpenings(), "eg", WINDOW.id, { offsetCm: 0, widthCm: 500, beforeFullEdge: REMEMBERED }, CREATED);
            const window = (plan: Plan) => wohnen(plan).openings[1];

            it("keeps the value a patch from toggleFullEdge sets", () => {
                expect(window(fullWindow())).toEqual({ ...WINDOW, offsetCm: 0, widthCm: 500, beforeFullEdge: REMEMBERED });
                const back = updateOpening(fullWindow(), "eg", WINDOW.id, { ...REMEMBERED, beforeFullEdge: null }, NOW);
                expect(window(back)).toEqual(WINDOW);
            });

            it("forgets them when the width changes (field)", () => {
                const plan = updateOpening(fullWindow(), "eg", WINDOW.id, { widthCm: 300, offsetCm: 200 }, NOW);
                expect(window(plan)).toMatchObject({ widthCm: 300, offsetCm: 200, beforeFullEdge: null });
            });

            it("forgets them on a patch { offsetCm } (dragging)", () => {
                const narrow = updateOpening(withOpenings(), "eg", WINDOW.id, { beforeFullEdge: REMEMBERED }, CREATED);
                expect(window(narrow).beforeFullEdge).toEqual(REMEMBERED);
                const plan = updateOpening(narrow, "eg", WINDOW.id, { offsetCm: 150 }, NOW);
                expect(window(plan)).toMatchObject({ offsetCm: 150, beforeFullEdge: null });
            });

            it("keeps them on a patch that sets width and offset unchanged (same object)", () => {
                const plan = fullWindow();
                expect(updateOpening(plan, "eg", WINDOW.id, { offsetCm: 0, widthCm: 500 }, NOW)).toBe(plan);
            });

            it("leaves them unchanged on a patch with only swing", () => {
                const narrow = updateOpening(withOpenings(), "eg", WINDOW.id, { beforeFullEdge: REMEMBERED }, CREATED);
                const plan = updateOpening(narrow, "eg", WINDOW.id, { swing: null }, NOW);
                expect(plan).toBe(narrow);
                expect(window(plan).beforeFullEdge).toEqual(REMEMBERED);
            });

            it("sees a patch that only changes the remembered sizes as a change", () => {
                const plan = updateOpening(withOpenings(), "eg", WINDOW.id, { beforeFullEdge: REMEMBERED }, NOW);
                expect(plan).not.toBe(withOpenings());
                expect(plan.updatedAt).toBe(NOW.toISOString());
            });

            it("rejects remembered sizes for a door (same object)", () => {
                const plan = withOpenings();
                expect(updateOpening(plan, "eg", DOOR.id, { beforeFullEdge: REMEMBERED }, NOW)).toBe(plan);
            });
        });
    });

    describe("removeOpening", () => {
        it("removes only this opening and sets updatedAt", () => {
            const plan = removeOpening(withOpenings(), "eg", DOOR.id, NOW);
            expect(wohnen(plan).openings).toEqual([WINDOW]);
            expect(plan.updatedAt).toBe(NOW.toISOString());
        });

        it("rejects an unknown opening (same object)", () => {
            const plan = withOpenings();
            expect(removeOpening(plan, "eg", uuid(99), NOW)).toBe(plan);
            expect(removeOpening(plan, "og", DOOR.id, NOW)).toBe(plan);
        });
    });

    describe("findOpening", () => {
        it("finds the opening with its room on the floor only", () => {
            const plan = withOpenings();
            expect(findOpening(plan, "eg", WINDOW.id)).toMatchObject({ roomIndex: 0, index: 1, opening: WINDOW });
            expect(findOpening(plan, "og", WINDOW.id)).toBeNull();
        });
    });

    describe("changes of the room", () => {
        const setEdge = (index: number, length: number) => {
            const result = setEdgeLength(WOHNEN.pointsCm, index, length);
            if (!result.ok) throw new Error("setEdgeLength failed");
            return result.points;
        };

        it("re-anchors a fitting window when edge 1 becomes 520 cm", () => {
            const plan = updateRoom(withOpenings(), "eg", WOHNEN.id, { pointsCm: setEdge(0, 520) }, NOW);
            expect(wohnen(plan).openings).toEqual([DOOR, { ...WINDOW, offsetCm: 120 }]);
        });

        it("rejects edge 1 of 200 cm with the door reaching to 240 cm (same object)", () => {
            const plan = withOpenings();
            expect(updateRoom(plan, "eg", WOHNEN.id, { pointsCm: setEdge(0, 200) }, NOW)).toBe(plan);
        });

        it("moves the openings with the room, keeping their offsets", () => {
            const plan = moveRoom(withOpenings(), "eg", WOHNEN.id, 100, 0, NOW);
            expect(wohnen(plan).openings).toEqual([DOOR, WINDOW]);
            expect(wohnen(plan).pointsCm[0]).toEqual({ x: 100, y: 0 });
        });

        it("keeps the openings when renaming", () => {
            expect(wohnen(updateRoom(withOpenings(), "eg", WOHNEN.id, { name: "Küche" }, NOW)).openings).toEqual([DOOR, WINDOW]);
        });

        it("removes the openings with the room", () => {
            const plan = removeRoom(withOpenings(), "eg", WOHNEN.id, NOW);
            expect(findOpening(plan, "eg", DOOR.id)).toBeNull();
            // The id is free again.
            const again = addRoom(plan, "eg", { ...WOHNEN, id: uuid(12) }, NOW);
            expect(wohnen(addOpening(again, "eg", uuid(12), DOOR, NOW)).openings).toEqual([DOOR]);
        });
    });
});

describe("updateRoom wall thicknesses (Wanddicken im Plan)", () => {
    const LAST_CHANGE = new Date("2026-11-01T10:00:00.000Z");
    /** „Wohnen“ (0|0)–(500|400) with 15 cm at every edge and a door on the top edge. */
    const DOOR: Opening = {
        id: uuid(20),
        kind: "door",
        edgeIndex: 0,
        offsetCm: 160,
        widthCm: 80,
        swing: { hinge: "start", side: "inside" },
        beforeFullEdge: null,
    };
    const WOHNEN = room(10, "Wohnen", rectPoints(0, 0, 500, 400), [DOOR]);
    const base = () => addRoom(legacyPlan(CREATED), "eg", WOHNEN, LAST_CHANGE);

    it("sets edge 1 from 15 cm to 24 cm and the update time to 11.11.2026, 18:30", () => {
        const plan = updateRoom(base(), "eg", WOHNEN.id, { wallThicknessCm: [24, 15, 15, 15] }, NOW);
        expect(plan.roomsByFloor.eg[0].wallThicknessCm).toEqual([24, 15, 15, 15]);
        expect(plan.updatedAt).toBe("2026-11-11T18:30:00.000Z");
        expect(PlanSchema.safeParse(plan).success).toBe(true);
    });

    it("keeps corners and openings", () => {
        const plan = updateRoom(base(), "eg", WOHNEN.id, { wallThicknessCm: [36.5, 15, 15, 36.5] }, NOW);
        expect(plan.roomsByFloor.eg[0]).toEqual({ ...WOHNEN, wallThicknessCm: [36.5, 15, 15, 36.5] });
    });

    it("keeps the wall thicknesses when the corners change", () => {
        const thick = updateRoom(base(), "eg", WOHNEN.id, { wallThicknessCm: [36.5, 15, 15, 15] }, NOW);
        const plan = updateRoom(thick, "eg", WOHNEN.id, { pointsCm: rectPoints(0, 0, 520, 400) }, NOW);
        expect(plan.roomsByFloor.eg[0].wallThicknessCm).toEqual([36.5, 15, 15, 15]);
    });

    it.each([
        ["0 cm", [0, 15, 15, 15]],
        ["more than 100 cm", [120, 15, 15, 15]],
        ["three values for four edges", [15, 15, 15]],
        ["five values for four edges", [15, 15, 15, 15, 15]],
        ["unchanged values", [15, 15, 15, 15]],
    ])("rejects %s (same object)", (_name, wallThicknessCm) => {
        const plan = base();
        expect(updateRoom(plan, "eg", WOHNEN.id, { wallThicknessCm }, NOW)).toBe(plan);
    });
});

describe("updateRoom color (Raumfarbe im Plan)", () => {
    const LAST_CHANGE = new Date("2026-11-01T10:00:00.000Z");
    const DOOR: Opening = {
        id: uuid(20),
        kind: "door",
        edgeIndex: 0,
        offsetCm: 160,
        widthCm: 80,
        swing: { hinge: "start", side: "inside" },
        beforeFullEdge: null,
    };
    const BAD = room(10, "Bad", rectPoints(0, 0, 500, 400), [DOOR], [36.5, 15, 15, 15]);
    const base = () => addRoom(legacyPlan(CREATED), "eg", BAD, LAST_CHANGE);

    it("colors „Bad“ blue and sets the update time to 11.11.2026, 18:30", () => {
        const plan = updateRoom(base(), "eg", BAD.id, { color: "#BFDBFE" }, NOW);
        expect(plan.roomsByFloor.eg[0].color).toBe("#BFDBFE");
        expect(plan.updatedAt).toBe("2026-11-11T18:30:00.000Z");
        expect(PlanSchema.safeParse(plan).success).toBe(true);
    });

    it("keeps corners, wall thicknesses and openings", () => {
        const plan = updateRoom(base(), "eg", BAD.id, { color: "#BBF7D0" }, NOW);
        expect(plan.roomsByFloor.eg[0]).toEqual({ ...BAD, color: "#BBF7D0" });
    });

    it("removes the color again with null", () => {
        const green = updateRoom(base(), "eg", BAD.id, { color: "#BBF7D0" }, NOW);
        expect(updateRoom(green, "eg", BAD.id, { color: null }, NOW).roomsByFloor.eg[0].color).toBeNull();
    });

    it.each([
        ["„grün“", "grün"],
        ["#FFF", "#FFF"],
        ["the same color (none)", null],
    ])("rejects %s (same object)", (_name, color) => {
        const plan = base();
        expect(updateRoom(plan, "eg", BAD.id, { color }, NOW)).toBe(plan);
    });

    it("rejects the same color again (same object)", () => {
        const green = updateRoom(base(), "eg", BAD.id, { color: "#BBF7D0" }, NOW);
        expect(updateRoom(green, "eg", BAD.id, { color: "#BBF7D0" }, NOW)).toBe(green);
    });
});

describe("updateRoom locked (Sperre eines Raums im Plan)", () => {
    const LAST_CHANGE = new Date("2026-11-01T10:00:00.000Z");
    const DOOR: Opening = {
        id: uuid(20),
        kind: "door",
        edgeIndex: 0,
        offsetCm: 160,
        widthCm: 80,
        swing: { hinge: "start", side: "inside" },
        beforeFullEdge: null,
    };
    const BAD = room(10, "Bad", rectPoints(0, 0, 500, 400), [DOOR], [36.5, 15, 15, 15], "#BFDBFE");
    const base = () => addRoom(legacyPlan(CREATED), "eg", BAD, LAST_CHANGE);

    it("locks „Bad“ and sets the update time (Änderungszeitpunkt), keeping corners, openings and color", () => {
        const plan = updateRoom(base(), "eg", BAD.id, { locked: true }, NOW);
        expect(plan.roomsByFloor.eg[0]).toEqual({ ...BAD, locked: true });
        expect(plan.updatedAt).toBe("2026-11-11T18:30:00.000Z");
        expect(PlanSchema.safeParse(plan).success).toBe(true);
    });

    it("unlocks it again", () => {
        const locked = updateRoom(base(), "eg", BAD.id, { locked: true }, NOW);
        expect(updateRoom(locked, "eg", BAD.id, { locked: false }, NOW).roomsByFloor.eg[0].locked).toBe(false);
    });

    it("rejects locking an already locked room (same object)", () => {
        const locked = updateRoom(base(), "eg", BAD.id, { locked: true }, NOW);
        expect(updateRoom(locked, "eg", BAD.id, { locked: true }, NOW)).toBe(locked);
    });
});

describe("updateSettings / resetSettings (Einstellungen im Plan)", () => {
    const base = () => addRoom(legacyPlan(CREATED), "eg", room(1, "Wohnen", rectPoints(0, 0, 400, 300), [door(2)]), CREATED);
    function door(n: number): Opening {
        return { id: uuid(n), kind: "door", edgeIndex: 0, offsetCm: 50, widthCm: 80, swing: { hinge: "start", side: "inside" }, beforeFullEdge: null };
    }

    it("sets a value and the time of change (Änderungszeitpunkt)", () => {
        const plan = base();
        const next = updateSettings(plan, { snapStepCm: 2.5 }, NOW);
        expect(next.settings).toEqual({ ...FACTORY_SETTINGS, snapStepCm: 2.5 });
        expect(next.updatedAt).toBe("2026-11-11T18:30:00.000Z");
        expect(plan.settings.snapStepCm).toBe(5);
        expect(PlanSchema.safeParse(next).success).toBe(true);
    });

    it.each([
        ["grid 5 cm", { gridStepCm: 5 }],
        ["wall thickness 0 cm", { defaultWallThicknessCm: 0 }],
        ["fine step above snap step", { fineSnapStepCm: 10 }],
        ["wall color „grau“", { wallColor: "grau" }],
    ])("returns the same plan for an invalid value: %s", (_name, patch) => {
        const plan = base();
        expect(updateSettings(plan, patch, NOW)).toBe(plan);
    });

    it("returns the same plan for an unchanged value, also a color in other case", () => {
        const plan = base();
        expect(updateSettings(plan, { snapStepCm: 5 }, NOW)).toBe(plan);
        expect(updateSettings(plan, { wallColor: "#3f3f46" }, NOW)).toBe(plan);
        expect(updateSettings(plan, {}, NOW)).toBe(plan);
    });

    it("ignores unknown keys", () => {
        const plan = base();
        const next = updateSettings(plan, { gridStepCm: 50, zoom: 2 } as never, NOW);
        expect(next.settings).toEqual({ ...FACTORY_SETTINGS, gridStepCm: 50 });
    });

    it("leaves rooms and openings unchanged", () => {
        const plan = base();
        const next = updateSettings(plan, { defaultWallThicknessCm: 11.5, doorWidthCm: 88.5, defaultRoomColor: "#BBF7D0" }, NOW);
        expect(next.roomsByFloor).toBe(plan.roomsByFloor);
        expect(next.shapesByFloor).toBe(plan.shapesByFloor);
    });

    it("resets all settings to the factory settings in one step (Zurücksetzen)", () => {
        let plan = base();
        plan = updateSettings(plan, { defaultWallThicknessCm: 11.5 }, CREATED);
        plan = updateSettings(plan, { snapStepCm: 2.5, fineSnapStepCm: 0.5 }, CREATED);
        const reset = resetSettings(plan, NOW);
        expect(reset.settings).toEqual(FACTORY_SETTINGS);
        expect(reset.settings).not.toBe(FACTORY_SETTINGS);
        expect(reset.updatedAt).toBe("2026-11-11T18:30:00.000Z");
        expect(resetSettings(reset, NOW)).toBe(reset);
    });
});
