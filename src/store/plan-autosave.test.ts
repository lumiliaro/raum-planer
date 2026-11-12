import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLAN_STORAGE_KEY } from "@/lib/plan-storage";
import { createAppStore } from "@/store/app-store";
import { startPlanAutosave } from "@/store/plan-autosave";
import { failingWrites, memoryStorage } from "@/test/memory-storage";
import { imageId, legacyPlan, rect, underlay, uuid } from "@/test/plan-fixtures";

/** Holds an empty plan with the floors eg, og, dg; the attic has an uncalibrated underlay with image. */
const LEGACY_STORAGE = {
    [PLAN_STORAGE_KEY]: JSON.stringify({
        ...legacyPlan(new Date("2026-11-01T10:00:00.000Z")),
        underlayByFloor: { dg: underlay() },
    }),
};

/** Counts plan writes; `failing.value = true` makes `setItem` throw. */
function spyStorage(initial: Record<string, string> = LEGACY_STORAGE) {
    const failing = { value: false };
    const storage = failingWrites(memoryStorage(initial), () => failing.value);
    const setItem = vi.spyOn(storage, "setItem");
    const planWrites = () => setItem.mock.calls.filter(([key]) => key === PLAN_STORAGE_KEY).length;
    return { storage, failing, planWrites };
}

const storedPlan = (storage: Storage) => JSON.parse(storage.getItem(PLAN_STORAGE_KEY)!);

describe("plan autosave", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("saves quick successive changes once, 300 ms after the last one", () => {
        const { storage, planWrites } = spyStorage();
        const store = createAppStore(storage);
        startPlanAutosave(store, storage);

        store.getState().addShape("eg", rect(1));
        vi.advanceTimersByTime(200);
        store.getState().updateShape("eg", uuid(1), { widthCm: 180 });
        vi.advanceTimersByTime(299);
        expect(planWrites()).toBe(0);
        vi.advanceTimersByTime(1);
        expect(planWrites()).toBe(1);
        expect(storedPlan(storage).shapesByFloor.eg[0].widthCm).toBe(180);
        expect(store.getState().saveStatus).toBe("saved");
    });

    it("flush() saves a pending change immediately and only once", () => {
        const { storage, planWrites } = spyStorage();
        const store = createAppStore(storage);
        const autosave = startPlanAutosave(store, storage);

        autosave.flush();
        expect(planWrites()).toBe(0);
        store.getState().addShape("eg", rect(1));
        autosave.flush();
        expect(planWrites()).toBe(1);
        vi.advanceTimersByTime(1000);
        expect(planWrites()).toBe(1);
    });

    it("does not save when only UI state changes", () => {
        const { storage, planWrites } = spyStorage();
        const store = createAppStore(storage);
        startPlanAutosave(store, storage);

        store.getState().togglePropertiesPanel();
        store.getState().setViewport("eg", { scale: 2, x: 0, y: 0 });
        store.getState().toggleCalibration();
        store.getState().addShape("eg", rect(1, { widthCm: 0 })); // rejected
        vi.advanceTimersByTime(1000);
        expect(planWrites()).toBe(0);
    });

    it("saves a floor switch and a saved calibration", () => {
        const { storage } = spyStorage();
        const store = createAppStore(storage);
        startPlanAutosave(store, storage);

        store.getState().setActiveFloor("dg");
        vi.advanceTimersByTime(300);
        expect(storedPlan(storage).activeFloorId).toBe("dg");

        store.getState().setImageAvailability(imageId(1), "ready");
        store.getState().toggleCalibration();
        store.getState().addCalibrationPoint({ x: 120, y: 160.4 });
        store.getState().addCalibrationPoint({ x: 1118.6, y: 160.4 });
        store.getState().setCalibrationLength("1000");
        store.getState().saveCalibration();
        vi.advanceTimersByTime(300);
        expect(storedPlan(storage).underlayByFloor.dg.calibration.pxPerCm).toBe(0.9986);
    });

    it("reports failed when writing throws and saved after a later success", () => {
        const { storage, failing } = spyStorage();
        const store = createAppStore(storage);
        startPlanAutosave(store, storage);

        failing.value = true;
        store.getState().setActiveFloor("og");
        vi.advanceTimersByTime(300);
        expect(store.getState().saveStatus).toBe("failed");

        failing.value = false;
        store.getState().setActiveFloor("eg");
        vi.advanceTimersByTime(300);
        expect(store.getState().saveStatus).toBe("saved");
        expect(storedPlan(storage).activeFloorId).toBe("eg");
    });

    it("never writes while saving is suspended", () => {
        const { storage, failing, planWrites } = spyStorage({ [PLAN_STORAGE_KEY]: "kaputt" });
        failing.value = true; // backup fails at load → suspended
        const store = createAppStore(storage);
        failing.value = false;
        expect(store.getState().saveStatus).toBe("suspended");
        const autosave = startPlanAutosave(store, storage);

        store.getState().addShape("eg", rect(1, { widthCm: 100 }));
        vi.advanceTimersByTime(1000);
        autosave.flush();
        expect(planWrites()).toBe(0);
        expect(storage.getItem(PLAN_STORAGE_KEY)).toBe("kaputt");
        expect(store.getState().saveStatus).toBe("suspended");
    });

    it("stop() ends the subscription and drops a pending save", () => {
        const { storage, planWrites } = spyStorage();
        const store = createAppStore(storage);
        const autosave = startPlanAutosave(store, storage);

        store.getState().addShape("eg", rect(1));
        autosave.stop();
        vi.advanceTimersByTime(1000);
        store.getState().addShape("eg", rect(2));
        vi.advanceTimersByTime(1000);
        autosave.flush();
        expect(planWrites()).toBe(0);
    });
});
