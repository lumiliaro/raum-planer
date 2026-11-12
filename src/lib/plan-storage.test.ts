import { describe, expect, it } from "vitest";
import planV1Text from "@/lib/__fixtures__/plan-v1.json?raw";
import planV2Text from "@/lib/__fixtures__/plan-v2.json?raw";
import planV3Text from "@/lib/__fixtures__/plan-v3.json?raw";
import planV4Text from "@/lib/__fixtures__/plan-v4.json?raw";
import planV10Text from "@/lib/__fixtures__/plan-v10.json?raw";
import { addFloor, addShape, createEmptyPlan, moveFloor, setActiveFloor, setUnderlay } from "@/lib/plan";
import { loadPlan, mayCleanUpImages, PLAN_BACKUP_KEY, PLAN_PRE_MIGRATION_KEY, PLAN_STORAGE_KEY, savePlan } from "@/lib/plan-storage";
import { PROPERTIES_PANEL_OPEN_KEY } from "@/lib/ui-prefs";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import { CAL_EG, legacyPlan, rect, underlay, underlayWithoutImage, uuid } from "@/test/plan-fixtures";
import { failingWrites, memoryStorage, throwingStorage } from "@/test/memory-storage";

const CREATED = new Date("2026-11-01T10:00:00.000Z");
const NOW = new Date("2026-11-11T18:30:00.000Z");

const FLOOR_ID = uuid(900);
const newId = () => FLOOR_ID;
const emptyPlan = (now: Date) => createEmptyPlan(now, newId);

/** Plan with two shapes on the ground floor, a bed upstairs, a hidden calibrated underlay and the upper floor active. */
function samplePlan() {
    let plan = legacyPlan(CREATED);
    plan = addShape(plan, "eg", rect(1), CREATED);
    plan = addShape(plan, "eg", rect(2, { cornerRadiusCm: 10 }), CREATED);
    plan = addShape(plan, "og", rect(3, { widthCm: 180, depthCm: 200, label: "Bett" }), CREATED);
    plan = setUnderlay(plan, "eg", underlay(CAL_EG, { visible: false, opacity: 0.4 }), CREATED);
    return setActiveFloor(plan, "og");
}

describe("savePlan / loadPlan", () => {
    it("restores a saved plan completely, including active floor and order", () => {
        const storage = memoryStorage();
        const plan = samplePlan();
        expect(savePlan(storage, plan)).toBe(true);

        const result = loadPlan(storage, NOW, newId);
        expect(result.outcome).toBe("restored");
        expect(result.plan).toEqual(plan);
        expect(result.plan.activeFloorId).toBe("og");
        expect(result.plan.shapesByFloor.eg.map((s) => s.id)).toEqual(plan.shapesByFloor.eg.map((s) => s.id));
        expect(result.plan.underlayByFloor.eg?.calibration?.pxPerCm).toBe(0.9986);
        expect(result.plan.underlayByFloor.eg).toMatchObject({ visible: false, opacity: 0.4 });
    });

    it("restores a self-made floor at the first place", () => {
        const storage = memoryStorage();
        let plan = addFloor(legacyPlan(CREATED), uuid(100), "Keller", CREATED);
        for (let i = 0; i < 3; i++) plan = moveFloor(plan, uuid(100), "up", CREATED);
        savePlan(storage, plan);
        expect(loadPlan(storage, NOW, newId).plan.floors[0]).toEqual({ id: uuid(100), name: "Keller" });
    });

    it("returns an empty plan with one floor for a missing key, without touching the old calibration key", () => {
        const accessed: string[] = [];
        const inner = memoryStorage({ "raumplaner.calibration": "{}" });
        const storage: Storage = {
            ...inner,
            get length() {
                return inner.length;
            },
            getItem: (key) => (accessed.push(key), inner.getItem(key)),
            setItem: (key, value) => (accessed.push(key), inner.setItem(key, value)),
            removeItem: (key) => (accessed.push(key), inner.removeItem(key)),
        };
        const result = loadPlan(storage, NOW, newId);
        expect(result).toEqual({ plan: emptyPlan(NOW), outcome: "empty" });
        expect(result.plan.floors).toEqual([{ id: FLOOR_ID, name: "Erdgeschoss" }]);
        expect(accessed).toEqual([PLAN_STORAGE_KEY]);
        expect(inner.getItem("raumplaner.calibration")).toBe("{}");
    });

    it.each([
        ["broken JSON", "kaputt"],
        ["an invalid schema", JSON.stringify({ ...legacyPlan(CREATED), shapesByFloor: { eg: [] } })],
        ["schemaVersion 12", JSON.stringify({ ...legacyPlan(CREATED), schemaVersion: 12 })],
        ["a version-9 plan without settings", JSON.stringify({ ...legacyPlan(CREATED), settings: undefined })],
        ["schemaVersion 0", JSON.stringify({ ...legacyPlan(CREATED), schemaVersion: 0 })],
    ])("backs up %s unchanged and starts with an empty plan", (_, raw) => {
        const storage = memoryStorage({ [PLAN_STORAGE_KEY]: raw });
        expect(loadPlan(storage, NOW, newId)).toEqual({ plan: emptyPlan(NOW), outcome: "backed-up" });
        expect(storage.getItem(PLAN_BACKUP_KEY)).toBe(raw);
        expect(storage.getItem(PLAN_STORAGE_KEY)).toBe(raw);
    });

    it("reports backup-failed and keeps the original when the backup cannot be written", () => {
        const storage = failingWrites(memoryStorage({ [PLAN_STORAGE_KEY]: "kaputt" }), (key) => key === PLAN_BACKUP_KEY);
        expect(loadPlan(storage, NOW, newId)).toEqual({ plan: emptyPlan(NOW), outcome: "backup-failed" });
        expect(storage.getItem(PLAN_STORAGE_KEY)).toBe("kaputt");
        expect(storage.getItem(PLAN_BACKUP_KEY)).toBeNull();
    });

    it("reports unavailable for a blocked or missing storage", () => {
        expect(loadPlan(throwingStorage(), NOW, newId)).toEqual({ plan: emptyPlan(NOW), outcome: "unavailable" });
        expect(loadPlan(undefined, NOW, newId)).toEqual({ plan: emptyPlan(NOW), outcome: "unavailable" });
    });

    it("savePlan returns false when setItem throws", () => {
        expect(savePlan(throwingStorage(), samplePlan())).toBe(false);
        expect(savePlan(failingWrites(memoryStorage()), samplePlan())).toBe(false);
        expect(savePlan(undefined, samplePlan())).toBe(false);
    });

    it("stores only the plan, no raumplaner.ui.* values", () => {
        const storage = memoryStorage({ [PROPERTIES_PANEL_OPEN_KEY]: "false" });
        savePlan(storage, samplePlan());
        const stored = JSON.parse(storage.getItem(PLAN_STORAGE_KEY)!);
        expect(Object.keys(stored).sort()).toEqual([
            "activeFloorId",
            "createdAt",
            "floors",
            "name",
            "roomsByFloor",
            "schemaVersion",
            "settings",
            "shapesByFloor",
            "underlayByFloor",
            "updatedAt",
        ]);
        expect(storage.getItem(PLAN_STORAGE_KEY)).not.toContain("propertiesPanel");
        expect(storage.getItem(PROPERTIES_PANEL_OPEN_KEY)).toBe("false");
    });
});

describe("stored plan of version 1", () => {
    const v1 = JSON.parse(planV1Text);

    it("is migrated: floors eg/og/dg, shapes and calibrations unchanged, raw text backed up", () => {
        const storage = memoryStorage({ [PLAN_STORAGE_KEY]: planV1Text });
        const result = loadPlan(storage, NOW, newId);
        expect(result.outcome).toBe("migrated");
        expect(result.plan.schemaVersion).toBe(11);
        expect(result.plan.floors.map((f) => [f.id, f.name])).toEqual([
            ["eg", "Erdgeschoss"],
            ["og", "Obergeschoss"],
            ["dg", "Dachgeschoss"],
        ]);
        expect(result.plan.shapesByFloor).toEqual(v1.shapesByFloor);
        expect(result.plan.underlayByFloor.eg?.calibration).toEqual(v1.calibrationByFloor.eg);
        expect(result.plan.underlayByFloor.og?.calibration).toEqual(v1.calibrationByFloor.og);
        expect(result.plan.activeFloorId).toBe(v1.activeFloorId);
        expect(storage.getItem(PLAN_PRE_MIGRATION_KEY)).toBe(planV1Text);
        // Saving the converted plan is left to the store.
        expect(storage.getItem(PLAN_STORAGE_KEY)).toBe(planV1Text);
        expect(storage.getItem(PLAN_BACKUP_KEY)).toBeNull();
    });

    it("adds a missing shape list of a floor", () => {
        const { dg: _dg, ...shapesByFloor } = v1.shapesByFloor;
        const raw = JSON.stringify({ ...v1, shapesByFloor });
        const result = loadPlan(memoryStorage({ [PLAN_STORAGE_KEY]: raw }), NOW, newId);
        expect(result.outcome).toBe("migrated");
        expect(result.plan.shapesByFloor.dg).toEqual([]);
    });

    it("reports backup-failed and keeps the original when the backup cannot be written", () => {
        const storage = failingWrites(memoryStorage({ [PLAN_STORAGE_KEY]: planV1Text }));
        expect(loadPlan(storage, NOW, newId)).toEqual({ plan: emptyPlan(NOW), outcome: "backup-failed" });
        expect(storage.getItem(PLAN_STORAGE_KEY)).toBe(planV1Text);
        expect(storage.getItem(PLAN_PRE_MIGRATION_KEY)).toBeNull();
    });

    it("is backed up like an unreadable plan when the migration yields an invalid plan", () => {
        const raw = JSON.stringify({ ...v1, shapesByFloor: { ...v1.shapesByFloor, kg: [] } });
        const storage = memoryStorage({ [PLAN_STORAGE_KEY]: raw });
        expect(loadPlan(storage, NOW, newId)).toEqual({ plan: emptyPlan(NOW), outcome: "backed-up" });
        expect(storage.getItem(PLAN_BACKUP_KEY)).toBe(raw);
        expect(storage.getItem(PLAN_PRE_MIGRATION_KEY)).toBe(raw);
        expect(storage.getItem(PLAN_STORAGE_KEY)).toBe(raw);
    });
});

describe("stored plan of version 2", () => {
    const v2 = JSON.parse(planV2Text);

    it("is migrated to version 11: underlays without image for eg/og/dg, shapes unchanged, raw text backed up", () => {
        const storage = memoryStorage({ [PLAN_STORAGE_KEY]: planV2Text });
        const result = loadPlan(storage, NOW, newId);
        expect(result.outcome).toBe("migrated");
        expect(result.plan.schemaVersion).toBe(11);
        expect(result.plan.floors).toEqual(v2.floors);
        expect(result.plan.underlayByFloor).toEqual({
            eg: underlayWithoutImage(v2.calibrationByFloor.eg),
            og: underlayWithoutImage(v2.calibrationByFloor.og),
            dg: underlayWithoutImage(),
        });
        expect(result.plan.shapesByFloor).toEqual(v2.shapesByFloor);
        expect(storage.getItem(PLAN_PRE_MIGRATION_KEY)).toBe(planV2Text);
    });
});

describe("stored plan of version 3", () => {
    const v3 = JSON.parse(planV3Text);

    it("is migrated to version 11: an empty room list per floor, the factory settings, everything else unchanged, raw text backed up", () => {
        const storage = memoryStorage({ [PLAN_STORAGE_KEY]: planV3Text });
        const result = loadPlan(storage, NOW, newId);
        expect(result.outcome).toBe("migrated");
        const { schemaVersion, roomsByFloor, settings, ...rest } = result.plan;
        expect(schemaVersion).toBe(11);
        expect(settings).toEqual(FACTORY_SETTINGS);
        expect(roomsByFloor).toEqual(Object.fromEntries(v3.floors.map((f: { id: string }) => [f.id, []])));
        const { schemaVersion: _v, ...v3Rest } = v3;
        expect(rest).toEqual(v3Rest);
        expect(storage.getItem(PLAN_PRE_MIGRATION_KEY)).toBe(planV3Text);
    });
});

describe("stored plan of version 4", () => {
    it("is migrated to version 11: every room gets an empty list of openings and 15 cm walls, no color and no lock, raw text backed up", () => {
        const v4 = JSON.parse(planV4Text);
        const storage = memoryStorage({ [PLAN_STORAGE_KEY]: planV4Text });
        const result = loadPlan(storage, NOW, newId);
        expect(result.outcome).toBe("migrated");
        expect(result.plan.schemaVersion).toBe(11);
        for (const floor of v4.floors as { id: string }[]) {
            expect(result.plan.roomsByFloor[floor.id]).toEqual(
                v4.roomsByFloor[floor.id].map((r: { pointsCm: unknown[] }) => ({
                    ...r,
                    openings: [],
                    wallThicknessCm: r.pointsCm.map(() => 15),
                    color: null,
                    locked: false,
                })),
            );
        }
        expect(result.plan.shapesByFloor).toEqual(v4.shapesByFloor);
        expect(storage.getItem(PLAN_PRE_MIGRATION_KEY)).toBe(planV4Text);
    });
});

describe("stored plan of version 10 (Gespeicherter Plan der Version 10)", () => {
    it("is migrated to version 11: every room unchanged and not locked, raw text backed up", () => {
        const v10 = JSON.parse(planV10Text);
        const storage = memoryStorage({ [PLAN_STORAGE_KEY]: planV10Text });
        const result = loadPlan(storage, NOW, newId);
        expect(result.outcome).toBe("migrated");
        expect(result.plan.schemaVersion).toBe(11);
        for (const floor of v10.floors as { id: string }[]) {
            expect(result.plan.roomsByFloor[floor.id]).toEqual(
                v10.roomsByFloor[floor.id].map((r: object) => ({ ...r, locked: false })),
            );
        }
        expect(result.plan.settings).toEqual(v10.settings);
        expect(storage.getItem(PLAN_PRE_MIGRATION_KEY)).toBe(planV10Text);
    });
});

describe("mayCleanUpImages", () => {
    it("allows cleaning up after a restored, migrated or empty start only", () => {
        expect(mayCleanUpImages("restored")).toBe(true);
        expect(mayCleanUpImages("migrated")).toBe(true);
        expect(mayCleanUpImages("empty")).toBe(true);
        expect(mayCleanUpImages("backed-up")).toBe(false);
        expect(mayCleanUpImages("backup-failed")).toBe(false);
        expect(mayCleanUpImages("unavailable")).toBe(false);
    });
});
