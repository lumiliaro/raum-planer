import { describe, expect, it, vi } from "vitest";
import { toolForKey } from "@/components/layout/tools";
import { TUTORIAL_STEPS } from "@/components/tutorial/tutorial-steps";
import { addOpening, addRoom, addShape, addWall, createEmptyPlan, setActiveFloor, setCalibration } from "@/lib/plan";
import planV1Text from "@/lib/__fixtures__/plan-v1.json?raw";
import planV2Text from "@/lib/__fixtures__/plan-v2.json?raw";
import { PLAN_BACKUP_KEY, PLAN_PRE_MIGRATION_KEY, PLAN_STORAGE_KEY } from "@/lib/plan-storage";
import { isFullEdge, toggleFullEdge } from "@/lib/opening-fields";
import { edgeFrame } from "@/lib/opening-geometry";
import { EDGE_HIT_TOLERANCE_PX } from "@/lib/opening-placement";
import { SNAP_POINT_TOLERANCE_PX } from "@/lib/opening-snap";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import {
    canCalibrate,
    createAppStore as createBareStore,
    HISTORY_LIMIT,
    selectFloorName,
    selectFloors,
    isToolEnabled,
    selectSelectedOpening,
    selectSelectedRoom,
    selectSelectedShape,
    selectSelectedWall,
    selectSettings,
} from "@/store/app-store";
import { startPlanAutosave } from "@/store/plan-autosave";
import { failingWrites, memoryStorage, throwingStorage } from "@/test/memory-storage";
import type { Opening, Plan } from "@/lib/plan-schema";
import {
    CAL_EG,
    CAL_EG_OLD,
    CAL_OG,
    imageId,
    legacyPlan,
    rect,
    rectPoints,
    room,
    underlay,
    underlayWithoutImage,
    uuid,
    wall,
} from "@/test/plan-fixtures";

const PANEL_KEY = "raumplaner.ui.propertiesPanelOpen";
const DIMENSIONS_KEY = "raumplaner.ui.showDimensions";
const SNAPPING_KEY = "raumplaner.ui.shapeSnapping";
const TUTORIAL_KEY = "raumplaner.ui.tutorialSeen";
const CREATED = new Date("2026-11-01T10:00:00.000Z");
const NOW = new Date("2026-11-11T18:30:00.000Z");
const now = () => NOW;

const FLOOR_ID = uuid(900);
const newId = () => FLOOR_ID;

/** Plan with eg, og, dg, each with an uncalibrated underlay showing the image `imageId(1)`. */
function migratedPlan(at: Date): Plan {
    const plan = legacyPlan(at);
    const scan = underlay();
    return { ...plan, underlayByFloor: { eg: scan, og: scan, dg: scan } };
}

/** A store in which the image `imageId(1)` has been loaded, as the canvas reports it. */
function createAppStore(...args: Parameters<typeof createBareStore>) {
    const store = createBareStore(...args);
    store.getState().setImageAvailability(imageId(1), "ready");
    return store;
}

/** Storage holding a valid plan built from `fn(plan with eg, og, dg)`. */
const storedPlan = (fn = (p: Plan) => p) =>
    memoryStorage({ [PLAN_STORAGE_KEY]: JSON.stringify(fn(migratedPlan(CREATED))) });

/** The calibrations of the floors' underlays; floors without one are left out. */
function calibrations(plan: Plan) {
    return Object.fromEntries(
        Object.entries(plan.underlayByFloor).flatMap(([id, u]) => (u?.calibration ? [[id, u.calibration]] : [])),
    );
}

describe("app store", () => {
    it("starts on the ground floor without stored viewports", () => {
        const store = createAppStore(storedPlan());
        expect(store.getState().plan.activeFloorId).toBe("eg");
        expect(store.getState().viewports).toEqual({});
    });

    it("keeps each floor's viewport across floor switches", () => {
        const store = createAppStore(storedPlan());
        const egView = { scale: 2, x: -300, y: -120 };
        store.getState().setViewport("eg", egView);
        store.getState().setActiveFloor("og");
        store.getState().setViewport("og", { scale: 0.5, x: 10, y: 20 });
        store.getState().setActiveFloor("eg");
        expect(store.getState().plan.activeFloorId).toBe("eg");
        expect(store.getState().viewports.eg).toEqual(egView);
        expect(store.getState().viewports.og).toEqual({ scale: 0.5, x: 10, y: 20 });
    });

    it("opens the properties panel by default", () => {
        expect(createAppStore(storedPlan()).getState().propertiesPanelOpen).toBe(true);
        expect(createAppStore(throwingStorage()).getState().propertiesPanelOpen).toBe(true);
        expect(createAppStore(undefined).getState().propertiesPanelOpen).toBe(true);
    });

    it("restores the stored panel state", () => {
        const store = createAppStore(memoryStorage({ [PANEL_KEY]: "false" }));
        expect(store.getState().propertiesPanelOpen).toBe(false);
    });

    it("toggling the panel changes the state and writes the preference", () => {
        const storage = storedPlan();
        const store = createAppStore(storage);
        store.getState().togglePropertiesPanel();
        expect(store.getState().propertiesPanelOpen).toBe(false);
        expect(storage.getItem(PANEL_KEY)).toBe("false");
        store.getState().togglePropertiesPanel();
        expect(store.getState().propertiesPanelOpen).toBe(true);
        expect(storage.getItem(PANEL_KEY)).toBe("true");
    });

    it("toggling still works when the storage throws", () => {
        const store = createAppStore(throwingStorage());
        expect(() => store.getState().togglePropertiesPanel()).not.toThrow();
        expect(store.getState().propertiesPanelOpen).toBe(false);
    });

    describe("dimensions", () => {
        it("are hidden without a stored value, shown with „true“, hidden with an invalid value", () => {
            expect(createAppStore(storedPlan()).getState().showDimensions).toBe(false);
            expect(createAppStore(memoryStorage({ [DIMENSIONS_KEY]: "true" })).getState().showDimensions).toBe(true);
            expect(createAppStore(memoryStorage({ [DIMENSIONS_KEY]: "ja" })).getState().showDimensions).toBe(false);
            expect(createAppStore(throwingStorage()).getState().showDimensions).toBe(false);
        });

        it("toggling changes the state and writes the preference", () => {
            const storage = storedPlan();
            const store = createAppStore(storage);
            store.getState().toggleDimensions();
            expect(store.getState().showDimensions).toBe(true);
            expect(storage.getItem(DIMENSIONS_KEY)).toBe("true");
            store.getState().toggleDimensions();
            expect(store.getState().showDimensions).toBe(false);
            expect(storage.getItem(DIMENSIONS_KEY)).toBe("false");
        });

        it("toggling still works when the storage throws", () => {
            const store = createAppStore(throwingStorage());
            expect(() => store.getState().toggleDimensions()).not.toThrow();
            expect(store.getState().showDimensions).toBe(true);
        });

        it("toggling changes neither the plan nor updatedAt and adds no undo step", () => {
            const clock = { now: new Date("2026-11-11T09:00:00.000Z") };
            const store = createAppStore(storedPlan((p) => addShape(p, "eg", rect(1), CREATED)), { now: () => clock.now });
            store.getState().updateShape("eg", uuid(1), { x: 250 });
            const plan = store.getState().plan;
            const steps = store.temporal.getState().pastStates.length;
            clock.now = new Date("2026-11-11T10:00:00.000Z");
            store.getState().toggleDimensions();
            expect(store.getState().plan).toBe(plan);
            expect(store.temporal.getState().pastStates.length).toBe(steps);
            // Undo takes back the move of the shape, the dimensions stay on.
            store.getState().undo();
            expect(store.getState().plan.shapesByFloor.eg[0].x).toBe(100);
            expect(store.getState().showDimensions).toBe(true);
        });
    });

    describe("shape snapping", () => {
        it("is on without a stored value, off with „false“, on with an invalid value or a throwing storage", () => {
            expect(createAppStore(storedPlan()).getState().shapeSnapping).toBe(true);
            expect(createAppStore(memoryStorage({ [SNAPPING_KEY]: "false" })).getState().shapeSnapping).toBe(false);
            expect(createAppStore(memoryStorage({ [SNAPPING_KEY]: "nein" })).getState().shapeSnapping).toBe(true);
            expect(createAppStore(throwingStorage()).getState().shapeSnapping).toBe(true);
        });

        it("toggling changes the state and writes the preference", () => {
            const storage = storedPlan();
            const store = createAppStore(storage);
            store.getState().toggleShapeSnapping();
            expect(store.getState().shapeSnapping).toBe(false);
            expect(storage.getItem(SNAPPING_KEY)).toBe("false");
            store.getState().toggleShapeSnapping();
            expect(store.getState().shapeSnapping).toBe(true);
            expect(storage.getItem(SNAPPING_KEY)).toBe("true");
        });

        it("toggling still works when the storage throws", () => {
            const store = createAppStore(throwingStorage());
            expect(() => store.getState().toggleShapeSnapping()).not.toThrow();
            expect(store.getState().shapeSnapping).toBe(false);
        });

        it("toggling changes neither the plan nor updatedAt and adds no undo step", () => {
            const clock = { now: new Date("2026-11-11T09:00:00.000Z") };
            const store = createAppStore(storedPlan((p) => addShape(p, "eg", rect(1), CREATED)), { now: () => clock.now });
            store.getState().updateShape("eg", uuid(1), { x: 250 });
            const plan = store.getState().plan;
            const steps = store.temporal.getState().pastStates.length;
            clock.now = new Date("2026-11-11T10:00:00.000Z");
            store.getState().toggleShapeSnapping();
            expect(store.getState().plan).toBe(plan);
            expect(store.temporal.getState().pastStates.length).toBe(steps);
            // Undo takes back the move of the shape, snapping stays off.
            store.getState().undo();
            expect(store.getState().plan.shapesByFloor.eg[0].x).toBe(100);
            expect(store.getState().shapeSnapping).toBe(false);
        });
    });

    describe("help dialog", () => {
        it("starts closed, opens on the given tab, switches tabs and closes", () => {
            const store = createAppStore(storedPlan());
            expect(store.getState().helpTab).toBeNull();
            store.getState().openHelp("privacy");
            expect(store.getState().helpTab).toBe("privacy");
            store.getState().openHelp("shortcuts");
            expect(store.getState().helpTab).toBe("shortcuts");
            store.getState().closeHelp();
            expect(store.getState().helpTab).toBeNull();
        });

        it("is not stored in the browser", () => {
            const storage = storedPlan();
            const store = createAppStore(storage);
            const before = storage.getItem(PLAN_STORAGE_KEY);
            store.getState().openHelp("privacy");
            expect(storage.getItem(PLAN_STORAGE_KEY)).toBe(before);
            expect(createAppStore(storage).getState().helpTab).toBeNull();
        });

        it("opening and closing change neither the plan nor the history", () => {
            const clock = { now: new Date("2026-11-11T09:00:00.000Z") };
            const store = createAppStore(storedPlan((p) => addShape(p, "eg", rect(1), CREATED)), { now: () => clock.now });
            store.getState().updateShape("eg", uuid(1), { widthCm: 250 });
            const plan = store.getState().plan;
            const steps = store.temporal.getState().pastStates.length;
            store.getState().openHelp("shortcuts");
            store.getState().openHelp("privacy");
            store.getState().closeHelp();
            expect(store.getState().plan).toBe(plan);
            expect(store.temporal.getState().pastStates.length).toBe(steps);
            // Undo takes back the width change.
            store.getState().undo();
            expect(store.getState().plan.shapesByFloor.eg[0]).toMatchObject({ widthCm: 200 });
        });
    });

    describe("tutorial", () => {
        const LAST = TUTORIAL_STEPS.length - 1;

        it("starts on its own only when nothing was stored and it was never seen", () => {
            expect(createAppStore(memoryStorage(), { now, newId }).getState().tutorialStep).toBe(0);
            expect(createAppStore(memoryStorage({ [TUTORIAL_KEY]: "true" }), { now, newId }).getState().tutorialStep).toBeNull();
            expect(createAppStore(storedPlan()).getState().tutorialStep).toBeNull();
            expect(createAppStore(throwingStorage(), { newId }).getState().tutorialStep).toBeNull();
            expect(createAppStore(undefined, { newId }).getState().tutorialStep).toBeNull();
        });

        it("next and prev stay within the steps", () => {
            const store = createAppStore(memoryStorage(), { now, newId });
            store.getState().prevTutorialStep();
            expect(store.getState().tutorialStep).toBe(0);
            store.getState().nextTutorialStep();
            store.getState().nextTutorialStep();
            store.getState().nextTutorialStep();
            store.getState().prevTutorialStep();
            store.getState().prevTutorialStep();
            expect(store.getState().tutorialStep).toBe(1);
            for (let i = 0; i < TUTORIAL_STEPS.length + 2; i++) store.getState().nextTutorialStep();
            expect(store.getState().tutorialStep).toBe(LAST);
        });

        it("next and prev do nothing while the tutorial is off", () => {
            const store = createAppStore(storedPlan());
            store.getState().nextTutorialStep();
            store.getState().prevTutorialStep();
            expect(store.getState().tutorialStep).toBeNull();
        });

        it("ending writes the key, so a new store does not start it again", () => {
            const storage = memoryStorage();
            const store = createAppStore(storage, { now, newId });
            store.getState().nextTutorialStep();
            store.getState().endTutorial();
            expect(store.getState().tutorialStep).toBeNull();
            expect(storage.getItem(TUTORIAL_KEY)).toBe("true");
            expect(createAppStore(storage, { now, newId }).getState().tutorialStep).toBeNull();
        });

        it("starts at step 1 again after it was ended", () => {
            const store = createAppStore(memoryStorage({ [TUTORIAL_KEY]: "true" }), { now, newId });
            store.getState().startTutorial();
            expect(store.getState().tutorialStep).toBe(0);
        });

        it("ending still works when the storage throws", () => {
            const store = createAppStore(throwingStorage(), { newId });
            store.getState().startTutorial();
            expect(() => store.getState().endTutorial()).not.toThrow();
            expect(store.getState().tutorialStep).toBeNull();
        });

        it("start, next and end change neither the plan nor the history", () => {
            const store = createAppStore(storedPlan((p) => addShape(p, "eg", rect(1), CREATED)), { now });
            store.getState().updateShape("eg", uuid(1), { widthCm: 120 });
            const plan = store.getState().plan;
            const steps = store.temporal.getState().pastStates.length;
            store.getState().startTutorial();
            store.getState().nextTutorialStep();
            store.getState().nextTutorialStep();
            store.getState().prevTutorialStep();
            store.getState().endTutorial();
            expect(store.getState().plan).toBe(plan);
            expect(store.temporal.getState().pastStates.length).toBe(steps);
            // Undo takes back the width change.
            store.getState().undo();
            expect(store.getState().plan.shapesByFloor.eg[0]).toMatchObject({ widthCm: 200 });
        });
    });

    describe("plan", () => {
        it("starts with an empty plan with the only floor „Erdgeschoss“, without notice, when nothing is stored", () => {
            const store = createAppStore(memoryStorage(), { now, newId });
            expect(store.getState().plan).toEqual(createEmptyPlan(NOW, newId));
            expect(store.getState().plan.floors).toEqual([{ id: FLOOR_ID, name: "Erdgeschoss" }]);
            expect(store.getState().plan.activeFloorId).toBe(FLOOR_ID);
            expect(store.getState().recoveryNotice).toBeNull();
            expect(store.getState().saveStatus).toBe("saved");
        });

        it("starts on the attic floor when the stored plan was left there", () => {
            const store = createAppStore(storedPlan((p) => setActiveFloor(p, "dg")));
            expect(store.getState().plan.activeFloorId).toBe("dg");
            expect(store.getState().recoveryNotice).toBeNull();
        });

        it("reports a backed-up plan until the notice is dismissed", () => {
            const storage = memoryStorage({ [PLAN_STORAGE_KEY]: "kaputt" });
            const store = createAppStore(storage, { now, newId });
            expect(store.getState().recoveryNotice).toBe("backed-up");
            expect(store.getState().saveStatus).toBe("saved");
            expect(store.getState().plan).toEqual(createEmptyPlan(NOW, newId));
            expect(storage.getItem(PLAN_BACKUP_KEY)).toBe("kaputt");
            store.getState().dismissRecoveryNotice();
            expect(store.getState().recoveryNotice).toBeNull();
        });

        it("saves a stored version-1 plan as version 12 right at the start, without notice", () => {
            const storage = memoryStorage({ [PLAN_STORAGE_KEY]: planV1Text });
            const store = createAppStore(storage, { now });
            const saved = JSON.parse(storage.getItem(PLAN_STORAGE_KEY)!);
            expect(saved.schemaVersion).toBe(12);
            expect(saved).toEqual(store.getState().plan);
            expect(saved.floors.map((f: { name: string }) => f.name)).toEqual(["Erdgeschoss", "Obergeschoss", "Dachgeschoss"]);
            expect(storage.getItem(PLAN_PRE_MIGRATION_KEY)).toBe(planV1Text);
            expect(store.getState().recoveryNotice).toBeNull();
            expect(store.getState().saveStatus).toBe("saved");
        });

        it("converts a stored version-2 plan to version 12 at the start: eg/og/dg keep their calibration", () => {
            const v2 = JSON.parse(planV2Text);
            const storage = memoryStorage({ [PLAN_STORAGE_KEY]: planV2Text });
            const store = createAppStore(storage, { now });
            const saved = JSON.parse(storage.getItem(PLAN_STORAGE_KEY)!);
            expect(saved.schemaVersion).toBe(12);
            expect(saved).toEqual(store.getState().plan);
            expect(calibrations(store.getState().plan)).toEqual(v2.calibrationByFloor);
            expect(Object.keys(store.getState().plan.underlayByFloor)).toEqual(["eg", "og", "dg"]);
            expect(store.getState().plan.shapesByFloor).toEqual(v2.shapesByFloor);
            expect(storage.getItem(PLAN_PRE_MIGRATION_KEY)).toBe(planV2Text);
            expect(store.getState().saveStatus).toBe("saved");
        });

        it("reports a failed save when the migrated plan cannot be written", () => {
            const storage = failingWrites(memoryStorage({ [PLAN_STORAGE_KEY]: planV1Text }), (key) => key === PLAN_STORAGE_KEY);
            const store = createAppStore(storage, { now });
            expect(store.getState().plan.schemaVersion).toBe(12);
            expect(store.getState().saveStatus).toBe("failed");
            expect(storage.getItem(PLAN_STORAGE_KEY)).toBe(planV1Text);
        });

        it("suspends saving when the backup fails", () => {
            const storage = failingWrites(memoryStorage({ [PLAN_STORAGE_KEY]: "kaputt" }));
            const store = createAppStore(storage);
            expect(store.getState().recoveryNotice).toBe("backup-failed");
            expect(store.getState().saveStatus).toBe("suspended");
        });

        it("starts with an empty plan when the storage is blocked", () => {
            const store = createAppStore(throwingStorage(), { newId });
            expect(store.getState().plan.activeFloorId).toBe(FLOOR_ID);
            expect(store.getState().recoveryNotice).toBeNull();
        });

        it("shape actions return true and replace the plan on success", () => {
            const store = createAppStore(storedPlan(), { now: () => CREATED });
            const s = store.getState;
            expect(s().addShape("eg", rect(1))).toBe(true);
            expect(s().addShape("eg", rect(2))).toBe(true);
            expect(s().updateShape("eg", uuid(1), { widthCm: 180 })).toBe(true);
            expect(s().reorderShape("eg", uuid(1), "front")).toBe(true);
            expect(s().plan.shapesByFloor.eg.map((x) => x.id)).toEqual([uuid(2), uuid(1)]);
            expect(s().plan.shapesByFloor.eg[1]).toMatchObject({ widthCm: 180 });
            expect(s().removeShape("eg", uuid(2))).toBe(true);
            expect(s().plan.shapesByFloor.eg.map((x) => x.id)).toEqual([uuid(1)]);
        });

        it("shape actions return false and keep the plan object when rejected", () => {
            const store = createAppStore(storedPlan());
            store.getState().addShape("eg", rect(1));
            const before = store.getState().plan;
            expect(store.getState().addShape("og", rect(1))).toBe(false);
            expect(store.getState().addShape("eg", rect(2, { widthCm: 0 }))).toBe(false);
            expect(store.getState().updateShape("eg", uuid(1), { cornerRadiusCm: 99 })).toBe(false);
            expect(store.getState().reorderShape("eg", uuid(1), "front")).toBe(false);
            expect(store.getState().removeShape("eg", uuid(9))).toBe(false);
            expect(store.getState().plan).toBe(before);
        });

        it("uses the injected clock for updatedAt", () => {
            const store = createAppStore(storedPlan(), { now: () => CREATED });
            const later = createAppStore(storedPlan(), { now });
            later.getState().addShape("eg", rect(1));
            expect(store.getState().plan.updatedAt).toBe(CREATED.toISOString());
            expect(later.getState().plan.updatedAt).toBe(NOW.toISOString());
        });
    });

    describe("calibration", () => {
        const EG = { p1: { x: 120, y: 160.4 }, p2: { x: 1118.6, y: 160.4 }, realLengthCm: 412.5, pxPerCm: 2.4208 };
        const EMPTY_DRAFT = { p1: null, p2: null, lengthText: "", align: null };

        /** Storage holding a plan with the given calibrations. */
        const calibratedStorage = (byFloor: { eg?: typeof EG; og?: typeof CAL_OG }) =>
            storedPlan((p) => {
                let plan = p;
                if (byFloor.eg) plan = setCalibration(plan, "eg", byFloor.eg, CREATED);
                if (byFloor.og) plan = setCalibration(plan, "og", byFloor.og, CREATED);
                return plan;
            });

        /** Store in calibration mode with P1, P2 and 1 000 cm (spec example). */
        const withSpecDraft = (storage: Storage = storedPlan()) => {
            const store = createAppStore(storage, { now });
            store.getState().toggleCalibration();
            store.getState().addCalibrationPoint({ x: 120, y: 160.4 });
            store.getState().addCalibrationPoint({ x: 1118.6, y: 160.4 });
            store.getState().setCalibrationLength("1000");
            return store;
        };

        it("reads calibrations from the stored plan", () => {
            const store = createAppStore(calibratedStorage({ eg: EG }));
            expect(calibrations(store.getState().plan)).toEqual({ eg: EG });
            expect(calibrations(createAppStore(storedPlan()).getState().plan)).toEqual({});
            expect(calibrations(createAppStore(throwingStorage()).getState().plan)).toEqual({});
        });

        it("is off initially and starts with an empty draft on an uncalibrated floor", () => {
            const store = createAppStore(storedPlan());
            expect(store.getState().calibrationDraft).toBeNull();
            store.getState().toggleCalibration();
            expect(store.getState().calibrationDraft).toEqual(EMPTY_DRAFT);
        });

        it("prefills the draft from the underlay's calibration", () => {
            const store = createAppStore(calibratedStorage({ eg: EG }));
            store.getState().toggleCalibration();
            expect(store.getState().calibrationDraft).toEqual({ p1: EG.p1, p2: EG.p2, lengthText: "412,5", align: null });
        });

        it("sets P1, then P2 (rounded), and ignores a third point", () => {
            const store = createAppStore(storedPlan());
            store.getState().toggleCalibration();
            store.getState().addCalibrationPoint({ x: 120.04, y: 160.36 });
            expect(store.getState().calibrationDraft).toMatchObject({ p1: { x: 120, y: 160.4 }, p2: null });
            store.getState().addCalibrationPoint({ x: 1118.61, y: 160.4 });
            store.getState().addCalibrationPoint({ x: 5, y: 5 });
            expect(store.getState().calibrationDraft).toMatchObject({
                p1: { x: 120, y: 160.4 },
                p2: { x: 1118.6, y: 160.4 },
            });
        });

        it("ignores draft actions while the mode is off", () => {
            const store = createAppStore(storedPlan());
            store.getState().addCalibrationPoint({ x: 1, y: 2 });
            store.getState().setCalibrationLength("100");
            expect(store.getState().calibrationDraft).toBeNull();
            expect(store.getState().saveCalibration()).toBe(false);
        });

        it("moving changes only the chosen point (rounded)", () => {
            const store = createAppStore(storedPlan());
            store.getState().toggleCalibration();
            store.getState().addCalibrationPoint({ x: 10, y: 20 });
            store.getState().addCalibrationPoint({ x: 30, y: 40 });
            store.getState().moveCalibrationPoint("p2", { x: 55.55, y: 66.64 });
            expect(store.getState().calibrationDraft).toMatchObject({ p1: { x: 10, y: 20 }, p2: { x: 55.6, y: 66.6 } });
        });

        it("resetting the points keeps the length", () => {
            const store = withSpecDraft();
            store.getState().resetCalibrationPoints();
            expect(store.getState().calibrationDraft).toEqual({ ...EMPTY_DRAFT, lengthText: "1000" });
            store.getState().addCalibrationPoint({ x: 7, y: 8 });
            expect(store.getState().calibrationDraft?.p1).toEqual({ x: 7, y: 8 });
        });

        it("ending discards the draft and keeps the plan's calibration", () => {
            for (const end of ["endCalibration", "toggleCalibration"] as const) {
                const store = createAppStore(calibratedStorage({ eg: EG }));
                const before = store.getState().plan;
                store.getState().toggleCalibration();
                store.getState().moveCalibrationPoint("p2", { x: 500, y: 500 });
                store.getState().setCalibrationLength("500");
                store.getState()[end]();
                expect(store.getState().calibrationDraft).toBeNull();
                expect(store.getState().plan).toBe(before);
                store.getState().toggleCalibration();
                expect(store.getState().calibrationDraft).toMatchObject({ p2: EG.p2, lengthText: "412,5" });
            }
        });

        it("saving without a result has no effect", () => {
            const store = createAppStore(storedPlan());
            const before = store.getState().plan;
            store.getState().toggleCalibration();
            store.getState().addCalibrationPoint({ x: 10, y: 20 });
            store.getState().setCalibrationLength("1000");
            expect(store.getState().saveCalibration()).toBe(false);
            expect(store.getState().plan).toBe(before);
            expect(store.getState().calibrationDraft).not.toBeNull();

            store.getState().addCalibrationPoint({ x: 10, y: 20 }); // same spot as P1
            expect(store.getState().saveCalibration()).toBe(false);
            expect(store.getState().plan).toBe(before);
        });

        it("saving sets the active floor's calibration in the plan, sets updatedAt and ends the mode", () => {
            const storage = calibratedStorage({ og: CAL_OG });
            const store = withSpecDraft(storage);
            const stored = storage.getItem(PLAN_STORAGE_KEY);
            expect(store.getState().saveCalibration()).toBe(true);

            const expected = { p1: { x: 120, y: 160.4 }, p2: { x: 1118.6, y: 160.4 }, realLengthCm: 1000, pxPerCm: 0.9986 };
            expect(calibrations(store.getState().plan)).toEqual({ og: CAL_OG, eg: expected });
            expect(store.getState().plan.updatedAt).toBe(NOW.toISOString());
            expect(store.getState().calibrationDraft).toBeNull();
            // Writing is left to the autosave.
            expect(storage.getItem(PLAN_STORAGE_KEY)).toBe(stored);
        });

        it("switching floors prefills the new floor's draft and keeps the mode on", () => {
            const store = createAppStore(calibratedStorage({ og: CAL_OG }));
            store.getState().toggleCalibration();
            store.getState().addCalibrationPoint({ x: 10, y: 20 });
            store.getState().setActiveFloor("og");
            expect(store.getState().plan.activeFloorId).toBe("og");
            expect(store.getState().calibrationDraft).toEqual({
                p1: CAL_OG.p1,
                p2: CAL_OG.p2,
                lengthText: "737",
                align: null,
            });
            store.getState().setActiveFloor("dg");
            expect(store.getState().calibrationDraft).toEqual(EMPTY_DRAFT);
        });

        it("saves the alignment and prefills it when the mode starts again", () => {
            const store = withSpecDraft();
            store.getState().setCalibrationAlign("horizontal");
            expect(store.getState().saveCalibration()).toBe(true);
            expect(calibrations(store.getState().plan).eg).toMatchObject({ pxPerCm: 0.9986, align: "horizontal" });
            store.getState().toggleCalibration();
            expect(store.getState().calibrationDraft?.align).toBe("horizontal");
            store.getState().setCalibrationAlign(null);
            expect(store.getState().saveCalibration()).toBe(true);
            expect(calibrations(store.getState().plan).eg).not.toHaveProperty("align");
        });

        it("ending without saving discards the alignment", () => {
            const store = withSpecDraft();
            store.getState().setCalibrationAlign("vertical");
            store.getState().endCalibration();
            expect(calibrations(store.getState().plan)).toEqual({});
            store.getState().toggleCalibration();
            expect(store.getState().calibrationDraft?.align).toBeNull();
        });

        it("saving drops the floor's viewport and keeps the shapes in cm", () => {
            const storage = storedPlan((p) => addShape(setCalibration(p, "eg", CAL_EG_OLD, CREATED), "eg", rect(1, { x: 300, y: 200 }), CREATED));
            const store = withSpecDraft(storage);
            store.getState().setViewport("eg", { scale: 2, x: 5, y: 5 });
            store.getState().setViewport("og", { scale: 3, x: 5, y: 5 });
            const shapes = store.getState().plan.shapesByFloor;
            store.getState().setCalibrationAlign("horizontal");
            expect(store.getState().saveCalibration()).toBe(true);
            expect(store.getState().viewports).not.toHaveProperty("eg");
            expect(store.getState().viewports.og).toEqual({ scale: 3, x: 5, y: 5 });
            expect(store.getState().plan.shapesByFloor).toBe(shapes);
            expect(store.getState().plan.shapesByFloor.eg[0]).toMatchObject({ x: 300, y: 200 });
        });

        it("switching floors outside the mode leaves it off", () => {
            const store = createAppStore(storedPlan());
            store.getState().setActiveFloor("og");
            expect(store.getState().calibrationDraft).toBeNull();
        });

        it("does not touch the properties panel state or its stored key", () => {
            const storage = memoryStorage({ [PANEL_KEY]: "false" });
            const store = createAppStore(storage);
            store.getState().toggleCalibration();
            expect(store.getState().propertiesPanelOpen).toBe(false);
            store.getState().endCalibration();
            expect(store.getState().propertiesPanelOpen).toBe(false);
            expect(storage.getItem(PANEL_KEY)).toBe("false");
            expect(storage.length).toBe(1);
        });
    });

    describe("shape tools and selection", () => {
        /** Store whose stored plan has a calibrated ground floor and the given shapes there. */
        const calibratedStore = (shapeNs: number[] = []) => {
            const storage = storedPlan((p) => {
                let plan = setCalibration(p, "eg", CAL_EG, CREATED);
                for (const n of shapeNs) plan = addShape(plan, "eg", rect(n), CREATED);
                return plan;
            });
            return { storage, store: createAppStore(storage, { now }) };
        };
        const ids = (store: ReturnType<typeof createAppStore>) =>
            store.getState().plan.shapesByFloor.eg.map((s) => s.id);

        it("starts with 'select' and nothing selected", () => {
            const { store } = calibratedStore([1]);
            expect(store.getState().activeTool).toBe("select");
            expect(store.getState().selectedShapeId).toBeNull();
            expect(selectSelectedShape(store.getState())).toBeNull();
        });

        it("switches tools on a calibrated floor", () => {
            const { store } = calibratedStore();
            store.getState().setActiveTool("ellipse");
            expect(store.getState().activeTool).toBe("ellipse");
            store.getState().setActiveTool("select");
            expect(store.getState().activeTool).toBe("select");
        });

        it("key U chooses the U-shape tool", () => {
            const { store } = calibratedStore();
            const tool = toolForKey("U");
            if (tool) store.getState().setActiveTool(tool.id);
            expect(store.getState().activeTool).toBe("u-shape");
        });

        it("locks all tools in calibration mode, also „Tür“ by key T", () => {
            const { store } = calibratedStore();
            store.getState().toggleCalibration();
            for (const kind of ["rect", "ellipse", "l-shape", "u-shape", "corner"] as const) {
                store.getState().setActiveTool(kind);
                expect(store.getState().activeTool).toBe("select");
                expect(store.getState().insertShape(kind, { x: 10, y: 10 })).toBe(false);
            }
            const door = toolForKey("t");
            if (door) store.getState().setActiveTool(door.id);
            expect(store.getState().activeTool).toBe("select");
            expect(ids(store)).toEqual([]);
        });

        it("key T chooses „Tür“ for room walls; on a floor without room it stays „Auswählen“ and inserts no furniture door", () => {
            const { store } = calibratedStore();
            const door = toolForKey("t");
            expect(door?.id).toBe("door-opening");
            if (door) store.getState().setActiveTool(door.id);
            expect(store.getState().activeTool).toBe("select");
            expect(ids(store)).toEqual([]);
        });

        it("a furniture door from an older plan can be selected and made 90 cm wide", () => {
            const { rotationDeg, mirrored, style, x, y, id } = rect(7);
            const furnitureDoor = { id, kind: "door-swing" as const, x, y, rotationDeg, mirrored, style, widthCm: 80 };
            const store = createAppStore(storedPlan((p) => addShape(p, "eg", furnitureDoor, CREATED)), { now });
            store.getState().selectShape(id);
            expect(selectSelectedShape(store.getState())).toEqual(furnitureDoor);
            expect(store.getState().updateShape("eg", id, { widthCm: 90 })).toBe(true);
            expect(selectSelectedShape(store.getState())).toMatchObject({ kind: "door-swing", widthCm: 90 });
        });

        it("offers all tools and insertion on a floor without underlay", () => {
            const store = createAppStore(memoryStorage(), { now, newId });
            expect(store.getState().plan.underlayByFloor).toEqual({});
            for (const kind of ["rect", "ellipse", "l-shape", "u-shape", "corner"] as const) {
                store.getState().setActiveTool(kind);
                expect(store.getState().activeTool).toBe(kind);
                expect(store.getState().insertShape(kind, { x: 120, y: 80 })).toBe(true);
            }
            const shapes = store.getState().plan.shapesByFloor[FLOOR_ID];
            expect(shapes).toHaveLength(5);
            expect(shapes[0]).toMatchObject({ kind: "rect", x: 120, y: 80, widthCm: 100, depthCm: 60 });
        });

        it("offers all tools on an uncalibrated underlay", () => {
            const { store } = calibratedStore();
            store.getState().setActiveFloor("dg");
            store.getState().setActiveTool("l-shape");
            expect(store.getState().activeTool).toBe("l-shape");
            expect(store.getState().insertShape("l-shape", { x: 10, y: 10 })).toBe(true);
            expect(store.getState().plan.shapesByFloor.dg).toHaveLength(1);
        });

        it("ignores all tools and insertion in calibration mode", () => {
            const { store } = calibratedStore();
            store.getState().toggleCalibration();
            store.getState().setActiveTool("rect");
            expect(store.getState().activeTool).toBe("select");
            expect(store.getState().insertShape("ellipse", { x: 10, y: 10 })).toBe(false);
            expect(ids(store)).toEqual([]);
        });

        it("insertShape adds the shape on top of the active floor, selects it and switches to 'select'", () => {
            const { store } = calibratedStore([1, 2]);
            store.getState().setActiveTool("rect");
            expect(store.getState().insertShape("rect", { x: 412.4, y: 188.6 })).toBe(true);
            const shapes = store.getState().plan.shapesByFloor.eg;
            expect(shapes).toHaveLength(3);
            expect(shapes.slice(0, 2).map((s) => s.id)).toEqual([uuid(1), uuid(2)]);
            const inserted = shapes[2];
            expect(inserted).toMatchObject({ kind: "rect", x: 412, y: 189, widthCm: 100, depthCm: 60 });
            expect(store.getState().selectedShapeId).toBe(inserted.id);
            expect(selectSelectedShape(store.getState())).toEqual(inserted);
            expect(store.getState().activeTool).toBe("select");
            expect(store.getState().plan.shapesByFloor.og).toEqual([]);
        });

        it("selects and deselects", () => {
            const { store } = calibratedStore([1, 2]);
            store.getState().selectShape(uuid(1));
            expect(selectSelectedShape(store.getState())?.id).toBe(uuid(1));
            store.getState().selectShape(uuid(2));
            expect(store.getState().selectedShapeId).toBe(uuid(2));
            store.getState().selectShape(null);
            expect(selectSelectedShape(store.getState())).toBeNull();
        });

        it("deleting removes the selected shape, keeps the order and clears the selection", () => {
            const { store } = calibratedStore([1, 2, 3]);
            store.getState().selectShape(uuid(2));
            expect(store.getState().deleteSelectedShape()).toBe(true);
            expect(ids(store)).toEqual([uuid(1), uuid(3)]);
            expect(store.getState().selectedShapeId).toBeNull();
        });

        it("deleting without a selection changes nothing", () => {
            const { store } = calibratedStore([1, 2]);
            const before = store.getState().plan;
            expect(store.getState().deleteSelectedShape()).toBe(false);
            expect(store.getState().plan).toBe(before);
        });

        it("updateSelectedShape changes the selected shape on the active floor", () => {
            const { store } = calibratedStore([1, 2]);
            store.getState().selectShape(uuid(2));
            expect(store.getState().updateSelectedShape({ widthCm: 238.5, label: "Sofa" })).toBe(true);
            const [first, second] = store.getState().plan.shapesByFloor.eg;
            expect(first).toEqual(rect(1));
            expect(second).toMatchObject({ id: uuid(2), widthCm: 238.5, label: "Sofa" });
            expect(store.getState().plan.updatedAt).toBe(NOW.toISOString());
        });

        it("updateSelectedShape without a selection returns false and keeps the plan", () => {
            const { store } = calibratedStore([1]);
            const before = store.getState().plan;
            expect(store.getState().updateSelectedShape({ widthCm: 50 })).toBe(false);
            expect(store.getState().updateSelectedShape({})).toBe(false);
            expect(store.getState().plan).toBe(before);
        });

        it("updateSelectedShape with an empty patch returns true and keeps the same plan", () => {
            const { store } = calibratedStore([1]);
            store.getState().selectShape(uuid(1));
            const before = store.getState().plan;
            expect(store.getState().updateSelectedShape({})).toBe(true);
            expect(store.getState().plan).toBe(before);
            expect(store.getState().plan.updatedAt).toBe(CREATED.toISOString());
        });

        it("updateSelectedShape rejects an invalid patch", () => {
            const { store } = calibratedStore([1]);
            store.getState().selectShape(uuid(1));
            const before = store.getState().plan;
            expect(store.getState().updateSelectedShape({ widthCm: 0 })).toBe(false);
            expect(store.getState().updateSelectedShape({ cornerRadiusCm: 46 })).toBe(false);
            expect(store.getState().plan).toBe(before);
        });

        it("updateSelectedShape removes the label with `label: undefined`", () => {
            const { store } = calibratedStore([1]);
            store.getState().selectShape(uuid(1));
            store.getState().updateSelectedShape({ label: "Sofa" });
            expect(store.getState().updateSelectedShape({ label: undefined })).toBe(true);
            const shape = store.getState().plan.shapesByFloor.eg[0];
            expect(shape.label).toBeUndefined();
            expect(JSON.stringify(shape)).not.toContain("label");
        });

        it("switching floors clears the selection and resets the tool", () => {
            const { store } = calibratedStore([1]);
            store.getState().selectShape(uuid(1));
            store.getState().setActiveTool("rect");
            store.getState().setActiveFloor("og");
            expect(store.getState().activeTool).toBe("select");
            store.getState().setActiveFloor("eg");
            expect(store.getState().selectedShapeId).toBeNull();
        });

        it("selecting the current floor again keeps the selection", () => {
            const { store } = calibratedStore([1]);
            store.getState().selectShape(uuid(1));
            store.getState().setActiveFloor("eg");
            expect(store.getState().selectedShapeId).toBe(uuid(1));
        });

        it("starting calibration clears the selection and resets the tool; ending leaves 'select'", () => {
            const { store } = calibratedStore([1]);
            store.getState().selectShape(uuid(1));
            store.getState().toggleCalibration();
            expect(store.getState().selectedShapeId).toBeNull();
            expect(store.getState().activeTool).toBe("select");
            store.getState().endCalibration();
            expect(store.getState().activeTool).toBe("select");
            expect(ids(store)).toEqual([uuid(1)]);

            store.getState().setActiveTool("ellipse");
            store.getState().toggleCalibration();
            expect(store.getState().activeTool).toBe("select");
        });

        it("a selection whose shape is gone counts as nothing selected", () => {
            const { store } = calibratedStore([1]);
            store.getState().selectShape(uuid(1));
            store.getState().removeShape("eg", uuid(1));
            expect(selectSelectedShape(store.getState())).toBeNull();
        });

        it("does not store the tool or the selection in the saved plan", () => {
            const { store, storage } = calibratedStore([1]);
            const autosave = startPlanAutosave(store, storage, { delayMs: 0 });
            store.getState().setActiveTool("rect");
            store.getState().insertShape("rect", { x: 50, y: 50 });
            autosave.flush();
            autosave.stop();
            const saved = storage.getItem(PLAN_STORAGE_KEY) ?? "";
            expect(JSON.parse(saved).shapesByFloor.eg).toHaveLength(2);
            expect(saved).not.toContain("activeTool");
            expect(saved).not.toContain("selectedShapeId");
        });
    });

    describe("underlays", () => {
        const SCAN = { id: imageId(2), widthPx: 1240, heightPx: 1754 };
        const LARGER = { id: imageId(3), widthPx: 2480, heightPx: 3508 };
        const steps = (store: ReturnType<typeof createAppStore>) => store.temporal.getState().pastStates.length;
        /** Fresh plan with one floor without underlay, as on the first start. */
        const freshStore = () => createAppStore(memoryStorage(), { now, newId });

        it("the first upload creates an uncalibrated underlay, starts calibration mode and drops the viewport", () => {
            const store = freshStore();
            store.getState().setViewport(FLOOR_ID, { scale: 2, x: 0, y: 0 });
            store.getState().selectShape(uuid(1));
            expect(store.getState().applyUnderlayImage(FLOOR_ID, SCAN)).toBe(true);
            expect(store.getState().plan.underlayByFloor[FLOOR_ID]).toEqual({
                imageId: imageId(2),
                imageWidthPx: 1240,
                imageHeightPx: 1754,
                calibration: null,
                visible: true,
                opacity: 1,
            });
            expect(store.getState().calibrationDraft).toEqual({ p1: null, p2: null, lengthText: "", align: null });
            expect(store.getState().viewports).not.toHaveProperty(FLOOR_ID);
            expect(store.getState().selectedShapeId).toBeNull();
            expect(store.getState().imageAvailability[imageId(2)]).toBe("ready");
            expect(canCalibrate(store.getState())).toBe(true);
            expect(steps(store)).toBe(1);
        });

        it("replacing with a kept calibration starts no calibration mode and keeps the viewport", () => {
            const store = createAppStore(storedPlan((p) => setCalibration(p, "eg", CAL_EG, CREATED)), { now });
            store.getState().setViewport("eg", { scale: 2, x: 0, y: 0 });
            expect(store.getState().applyUnderlayImage("eg", SCAN)).toBe(true);
            expect(store.getState().calibrationDraft).toBeNull();
            expect(store.getState().viewports.eg).toEqual({ scale: 2, x: 0, y: 0 });
            expect(store.getState().plan.underlayByFloor.eg).toEqual(underlay(CAL_EG, { imageId: imageId(2) }));
        });

        it("loading the image of an underlay without image keeps its calibration", () => {
            const store = createAppStore(
                storedPlan((p) => ({ ...p, underlayByFloor: { eg: underlayWithoutImage(CAL_EG) } })),
                { now },
            );
            expect(store.getState().applyUnderlayImage("eg", LARGER)).toBe(true);
            expect(store.getState().plan.underlayByFloor.eg?.calibration).toEqual(CAL_EG);
            expect(store.getState().calibrationDraft).toBeNull();
        });

        it("keeps the calibration when the current image is missing in the browser", () => {
            const store = createAppStore(storedPlan((p) => setCalibration(p, "eg", CAL_EG, CREATED)), { now });
            store.getState().setImageAvailability(imageId(1), "missing");
            store.getState().applyUnderlayImage("eg", LARGER);
            expect(store.getState().plan.underlayByFloor.eg?.calibration).toEqual(CAL_EG);
        });

        it("resets the calibration on request and then starts calibration mode", () => {
            const store = createAppStore(storedPlan((p) => setCalibration(p, "eg", CAL_EG, CREATED)), { now });
            store.getState().applyUnderlayImage("eg", LARGER, { resetCalibration: true });
            expect(store.getState().plan.underlayByFloor.eg?.calibration).toBeNull();
            expect(store.getState().calibrationDraft).not.toBeNull();
        });

        it("each action is one step; undo restores image id and calibration", () => {
            const store = createAppStore(storedPlan((p) => setCalibration(p, "eg", CAL_EG, CREATED)), { now });
            const before = store.getState().plan.underlayByFloor.eg;
            store.getState().applyUnderlayImage("eg", LARGER, { resetCalibration: true });
            store.getState().endCalibration();
            expect(steps(store)).toBe(1);
            store.getState().undo();
            expect(store.getState().plan.underlayByFloor.eg).toEqual(before);

            expect(store.getState().setUnderlayVisible("eg", false)).toBe(true);
            expect(store.getState().setUnderlayOpacity("eg", 0.4)).toBe(true);
            expect(store.getState().removeUnderlay("eg")).toBe(true);
            expect(steps(store)).toBe(3);
            expect(store.getState().plan.underlayByFloor).not.toHaveProperty("eg");
            store.getState().undo();
            expect(store.getState().plan.underlayByFloor.eg).toEqual(underlay(CAL_EG, { visible: false, opacity: 0.4 }));
            store.getState().undo();
            store.getState().undo();
            expect(store.getState().plan.underlayByFloor.eg).toEqual(before);
        });

        it("hiding on another floor is undone on that floor", () => {
            const store = createAppStore(storedPlan(), { now });
            store.getState().setUnderlayVisible("eg", false);
            store.getState().setActiveFloor("og");
            store.getState().undo();
            expect(store.getState().plan.activeFloorId).toBe("eg");
            expect(store.getState().plan.underlayByFloor.eg?.visible).toBe(true);
        });

        it("rejects unchanged values, a floor without underlay and an invalid opacity (no step)", () => {
            const store = freshStore();
            expect(store.getState().setUnderlayVisible(FLOOR_ID, false)).toBe(false);
            expect(store.getState().removeUnderlay(FLOOR_ID)).toBe(false);
            const other = createAppStore(storedPlan(), { now });
            expect(other.getState().setUnderlayVisible("eg", true)).toBe(false);
            expect(other.getState().setUnderlayOpacity("eg", 0.05)).toBe(false);
            expect(steps(store) + steps(other)).toBe(0);
        });

        it("canCalibrate is false without underlay, while loading and when the image is missing", () => {
            expect(canCalibrate(freshStore().getState())).toBe(false);
            const loading = createBareStore(storedPlan(), { now });
            expect(canCalibrate(loading.getState())).toBe(false);
            loading.getState().toggleCalibration();
            expect(loading.getState().calibrationDraft).toBeNull();
            const store = createAppStore(storedPlan(), { now });
            expect(canCalibrate(store.getState())).toBe(true);
            store.getState().setImageAvailability(imageId(1), "missing");
            expect(canCalibrate(store.getState())).toBe(false);
            const withoutImage = createAppStore(
                storedPlan((p) => ({ ...p, underlayByFloor: { eg: underlayWithoutImage(CAL_EG) } })),
                { now },
            );
            expect(canCalibrate(withoutImage.getState())).toBe(false);
        });

        it("switching floors in calibration mode to a floor without image ends the mode", () => {
            const store = createAppStore(
                storedPlan((p) => ({ ...p, underlayByFloor: { eg: underlay(), og: underlayWithoutImage(CAL_OG) } })),
                { now },
            );
            store.getState().toggleCalibration();
            store.getState().setActiveFloor("og");
            expect(store.getState().calibrationDraft).toBeNull();
            store.getState().setActiveFloor("eg");
            store.getState().toggleCalibration();
            store.getState().setActiveFloor("dg");
            expect(store.getState().calibrationDraft).toBeNull();
        });

        it("ends calibration mode when the active floor's image turns out to be missing", () => {
            const store = createAppStore(storedPlan(), { now });
            store.getState().toggleCalibration();
            store.getState().setImageAvailability(imageId(9), "missing");
            expect(store.getState().calibrationDraft).not.toBeNull();
            store.getState().setImageAvailability(imageId(1), "missing");
            expect(store.getState().calibrationDraft).toBeNull();
        });

        it("starts with a working image store", () => {
            const store = freshStore();
            expect(store.getState().imageStoreStatus).toBe("ok");
            store.getState().setImageStoreStatus("failed");
            expect(store.getState().imageStoreStatus).toBe("failed");
        });
    });

    describe("replacePlan", () => {
        const IMPORTED_AT = new Date("2026-10-20T08:00:00.000Z");
        /** Plan as it comes from an import: own timestamps, OG active, only OG calibrated. */
        const imported = () => {
            let plan = migratedPlan(IMPORTED_AT);
            plan = addShape(plan, "og", rect(7, { label: "Bett" }), IMPORTED_AT);
            plan = setCalibration(plan, "og", CAL_OG, IMPORTED_AT);
            return setActiveFloor({ ...plan, name: "Umzug" }, "og");
        };

        it("replaces the plan with active floor and updatedAt from the new plan", () => {
            const store = createAppStore(storedPlan(), { now });
            store.getState().addShape("eg", rect(1));
            const next = imported();
            expect(store.getState().replacePlan(next)).toBe(true);
            const { plan } = store.getState();
            expect(plan).toEqual(next);
            expect(plan.activeFloorId).toBe("og");
            expect(plan.updatedAt).toBe(IMPORTED_AT.toISOString());
        });

        it("rejects an invalid plan and keeps the old one", () => {
            const store = createAppStore(storedPlan(), { now });
            store.getState().addShape("eg", rect(1));
            const before = store.getState().plan;
            const invalid = { ...imported(), activeFloorId: "kg" } as unknown as ReturnType<typeof imported>;
            expect(store.getState().replacePlan(invalid)).toBe(false);
            expect(store.getState().plan).toBe(before);
        });

        it("takes the calibration from the new plan only", () => {
            const store = createAppStore(storedPlan((p) => setCalibration(p, "eg", CAL_EG, CREATED)), { now });
            expect(calibrations(store.getState().plan).eg).toEqual(CAL_EG);
            store.getState().replacePlan(imported());
            expect(calibrations(store.getState().plan)).toEqual({ og: CAL_OG });
        });

        it("keeps the viewports and clears selection and tool", () => {
            const store = createAppStore(storedPlan((p) => setCalibration(p, "eg", CAL_EG, CREATED)), { now });
            const egView = { scale: 2, x: -300, y: -120 };
            store.getState().setViewport("eg", egView);
            store.getState().insertShape("rect", { x: 100, y: 100 });
            store.getState().setActiveTool("ellipse");
            expect(store.getState().selectedShapeId).not.toBeNull();
            expect(store.getState().activeTool).toBe("ellipse");

            store.getState().replacePlan(imported());
            expect(store.getState().viewports.eg).toEqual(egView);
            expect(store.getState().selectedShapeId).toBeNull();
            expect(store.getState().activeTool).toBe("select");
        });

        it("is saved by the autosave", () => {
            vi.useFakeTimers();
            try {
                const storage = storedPlan();
                const store = createAppStore(storage, { now });
                startPlanAutosave(store, storage);
                const next = imported();
                store.getState().replacePlan(next);
                vi.advanceTimersByTime(1000);
                expect(JSON.parse(storage.getItem(PLAN_STORAGE_KEY)!)).toEqual(next);
                expect(store.getState().saveStatus).toBe("saved");
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe("renamePlan", () => {
        it("renames the plan; empty and unchanged names are rejected", () => {
            const store = createAppStore(storedPlan(), { now });
            expect(store.getState().renamePlan("  ")).toBe(false);
            expect(store.getState().renamePlan("Meine Planung")).toBe(false);
            expect(store.getState().renamePlan(" Umzug ")).toBe(true);
            expect(store.getState().plan.name).toBe("Umzug");
            expect(store.getState().plan.updatedAt).toBe(NOW.toISOString());
        });

        it("is saved by the autosave", () => {
            vi.useFakeTimers();
            try {
                const storage = storedPlan();
                const store = createAppStore(storage, { now });
                startPlanAutosave(store, storage);
                store.getState().renamePlan("Umzug");
                vi.advanceTimersByTime(1000);
                expect(JSON.parse(storage.getItem(PLAN_STORAGE_KEY)!).name).toBe("Umzug");
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe("undo and redo", () => {
        /** Calibrated ground floor with A, B, C (uuid 1–3), a clock that can be moved forward. */
        function setup(calibration = CAL_EG) {
            const clock = { now: new Date("2026-11-11T09:00:00.000Z") };
            const storage = storedPlan((p) => {
                let plan = setCalibration(p, "eg", calibration, CREATED);
                for (const n of [1, 2, 3]) plan = addShape(plan, "eg", rect(n, { label: "ABC"[n - 1] }), CREATED);
                return plan;
            });
            const store = createAppStore(storage, { now: () => clock.now });
            const tick = (iso: string) => (clock.now = new Date(iso));
            const steps = () => store.temporal.getState().pastStates.length;
            const shape = (id: string, floor: "eg" | "og" | "dg" = "eg") =>
                store.getState().plan.shapesByFloor[floor].find((s) => s.id === id);
            return { store, storage, tick, steps, shape };
        }

        it("starts without steps", () => {
            const { store, steps } = setup();
            expect(steps()).toBe(0);
            expect(store.getState().undo()).toBe(false);
            expect(store.getState().redo()).toBe(false);
        });

        it("undoes an insert without selection and redoes it with selection", () => {
            const { store } = setup();
            store.getState().insertShape("rect", { x: 300, y: 300 });
            const id = store.getState().selectedShapeId!;
            expect(store.getState().undo()).toBe(true);
            expect(store.getState().plan.shapesByFloor.eg.map((s) => s.label)).toEqual(["A", "B", "C"]);
            expect(store.getState().selectedShapeId).toBeNull();
            expect(store.getState().redo()).toBe(true);
            expect(store.getState().plan.shapesByFloor.eg.at(-1)?.id).toBe(id);
            expect(store.getState().selectedShapeId).toBe(id);
        });

        it("brings back a deleted shape with its id at its place", () => {
            const { store, shape } = setup();
            const b = shape(uuid(2));
            store.getState().removeShape("eg", uuid(2));
            store.getState().undo();
            expect(store.getState().plan.shapesByFloor.eg.map((s) => s.id)).toEqual([uuid(1), uuid(2), uuid(3)]);
            expect(shape(uuid(2))).toEqual(b);
            expect(store.getState().selectedShapeId).toBe(uuid(2));
        });

        it("switches back to the floor of the change, selects the shape and sets updatedAt", () => {
            const { store, tick, shape } = setup();
            store.getState().updateShape("eg", uuid(1), { x: 250 });
            store.getState().setActiveFloor("og");
            store.getState().setActiveTool("select");
            tick("2026-11-11T10:00:00.000Z");
            store.getState().undo();
            expect(store.getState().plan.activeFloorId).toBe("eg");
            expect(store.getState().selectedShapeId).toBe(uuid(1));
            expect(shape(uuid(1))?.x).toBe(100);
            expect(store.getState().plan.updatedAt).toBe("2026-11-11T10:00:00.000Z");
        });

        it("a floor switch alone is no step and undo keeps the zoom", () => {
            const { store, steps } = setup();
            store.getState().updateShape("eg", uuid(1), { rotationDeg: 90 });
            store.getState().setActiveFloor("og");
            store.getState().setActiveFloor("eg");
            store.getState().setViewport("eg", { scale: 2, x: 5, y: 6 });
            expect(steps()).toBe(1);
            store.getState().undo();
            expect(store.getState().plan.shapesByFloor.eg[0].rotationDeg).toBe(0);
            expect(store.getState().viewports.eg).toEqual({ scale: 2, x: 5, y: 6 });
        });

        /** Saves CAL_EG (0,9986 px/cm) on the ground floor through the calibration mode. */
        const calibrateGroundFloor = (store: ReturnType<typeof setup>["store"]) => {
            if (store.getState().plan.activeFloorId !== "eg") store.getState().setActiveFloor("eg");
            store.getState().toggleCalibration();
            store.getState().resetCalibrationPoints();
            store.getState().addCalibrationPoint(CAL_EG.p1);
            store.getState().addCalibrationPoint(CAL_EG.p2);
            store.getState().setCalibrationLength("1000");
            expect(store.getState().saveCalibration()).toBe(true);
        };

        it("saving a calibration is a step; undo restores the old scale on its floor", () => {
            const { store, steps } = setup(CAL_EG_OLD);
            calibrateGroundFloor(store);
            expect(calibrations(store.getState().plan).eg?.pxPerCm).toBe(0.9986);
            expect(steps()).toBe(1);
            store.getState().setActiveFloor("og");
            store.getState().undo();
            expect(store.getState().plan.activeFloorId).toBe("eg");
            expect(calibrations(store.getState().plan).eg?.pxPerCm).toBe(0.748);
        });

        it("undoing a later move keeps the newer calibration", () => {
            const { store, shape } = setup(CAL_EG_OLD);
            calibrateGroundFloor(store);
            store.getState().updateShape("eg", uuid(1), { x: 150 });
            store.getState().undo();
            expect(shape(uuid(1))?.x).toBe(100);
            expect(calibrations(store.getState().plan).eg?.pxPerCm).toBe(0.9986);
        });

        it("a rejected change is no step", () => {
            const { store, steps } = setup();
            expect(store.getState().updateShape("eg", uuid(1), { widthCm: 0 })).toBe(false);
            expect(store.getState().removeShape("eg", uuid(9))).toBe(false);
            expect(steps()).toBe(0);
        });

        it("a new change after undo drops redo", () => {
            const { store } = setup();
            store.getState().updateShape("eg", uuid(1), { widthCm: 150 });
            store.getState().undo();
            expect(store.temporal.getState().futureStates).toHaveLength(1);
            store.getState().updateShape("eg", uuid(2), { x: 300 });
            expect(store.temporal.getState().futureStates).toHaveLength(0);
            expect(store.getState().redo()).toBe(false);
        });

        it("keeps the last 100 of 101 steps", () => {
            const { store, shape } = setup();
            for (let i = 1; i <= 101; i++) store.getState().updateShape("eg", uuid(1), { x: 100 + 5 * i });
            let undone = 0;
            while (store.getState().undo()) undone++;
            expect(undone).toBe(HISTORY_LIMIT);
            expect(shape(uuid(1))?.x).toBe(105);
        });

        it("does nothing in calibration mode", () => {
            const { store, shape } = setup();
            store.getState().updateShape("eg", uuid(1), { x: 150 });
            store.getState().toggleCalibration();
            expect(store.getState().undo()).toBe(false);
            expect(shape(uuid(1))?.x).toBe(150);
        });

        it("an import is one step; undo restores the whole previous plan with name and calibration", () => {
            const { store } = setup();
            store.getState().renamePlan("Altbau");
            const previous = store.getState().plan;
            const imported = { ...addShape(migratedPlan(new Date("2026-10-01T00:00:00.000Z")), "og", rect(7), NOW), name: "Umzug Musterhaus" };
            store.getState().replacePlan(imported);
            expect(store.getState().undo()).toBe(true);
            const { plan } = store.getState();
            expect(plan.shapesByFloor).toEqual(previous.shapesByFloor);
            expect(calibrations(plan)).toEqual({ eg: CAL_EG });
            expect(plan.name).toBe("Altbau");
            store.getState().redo();
            expect(store.getState().plan.name).toBe("Umzug Musterhaus");
        });

        it("renaming is no step and undo keeps the new name", () => {
            const { store, steps, shape } = setup();
            store.getState().updateShape("eg", uuid(1), { x: 150 });
            store.getState().renamePlan("Umzug");
            expect(steps()).toBe(1);
            store.getState().undo();
            expect(shape(uuid(1))?.x).toBe(100);
            expect(store.getState().plan.name).toBe("Umzug");
        });

        it("the autosave stores the plan after undo", () => {
            vi.useFakeTimers();
            try {
                const { store, storage } = setup();
                startPlanAutosave(store, storage);
                store.getState().removeShape("eg", uuid(2));
                vi.advanceTimersByTime(1000);
                store.getState().undo();
                vi.advanceTimersByTime(1000);
                const saved = JSON.parse(storage.getItem(PLAN_STORAGE_KEY)!);
                expect(saved.shapesByFloor.eg.map((s: { id: string }) => s.id)).toEqual([uuid(1), uuid(2), uuid(3)]);
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe("locked shapes", () => {
        function setup() {
            const store = createAppStore(
                storedPlan((p) => {
                    let plan = setCalibration(p, "eg", CAL_EG, CREATED);
                    for (const n of [1, 2]) plan = addShape(plan, "eg", rect(n), CREATED);
                    return plan;
                }),
                { now },
            );
            const steps = () => store.temporal.getState().pastStates.length;
            const shape = (id: string) => store.getState().plan.shapesByFloor.eg.find((s) => s.id === id)!;
            expect(store.getState().updateShape("eg", uuid(1), { locked: true })).toBe(true);
            return { store, steps, shape };
        }

        it("rejects moving, resizing and deleting without a step", () => {
            const { store, steps } = setup();
            const before = store.getState().plan;
            expect(store.getState().updateShape("eg", uuid(1), { x: 300 })).toBe(false);
            expect(store.getState().updateShape("eg", uuid(1), { widthCm: 300 })).toBe(false);
            expect(store.getState().updateShape("eg", uuid(1), { mirrored: true })).toBe(false);
            expect(store.getState().removeShape("eg", uuid(1))).toBe(false);
            expect(store.getState().plan).toBe(before);
            expect(steps()).toBe(1);
        });

        it("rejects the selected-shape actions, too; the shape stays selected", () => {
            const { store, shape } = setup();
            store.getState().selectShape(uuid(1));
            expect(store.getState().updateSelectedShape({ rotationDeg: 90 })).toBe(false);
            expect(store.getState().deleteSelectedShape()).toBe(false);
            expect(shape(uuid(1)).rotationDeg).toBe(0);
            expect(store.getState().selectedShapeId).toBe(uuid(1));
        });

        it("allows fill color, label, reordering and unlocking", () => {
            const { store, shape } = setup();
            expect(store.getState().updateShape("eg", uuid(1), { style: { ...shape(uuid(1)).style, fill: "#000000" } })).toBe(true);
            expect(store.getState().updateShape("eg", uuid(1), { label: "Schrank" })).toBe(true);
            expect(store.getState().reorderShape("eg", uuid(1), "front")).toBe(true);
            expect(store.getState().plan.shapesByFloor.eg.at(-1)?.id).toBe(uuid(1));
            expect(shape(uuid(1))).toMatchObject({ label: "Schrank", locked: true });
            expect(store.getState().updateShape("eg", uuid(1), { locked: false })).toBe(true);
            expect(store.getState().updateShape("eg", uuid(1), { x: 300 })).toBe(true);
        });

        it("move, lock, undo twice → unlocked at the old position", () => {
            const store = createAppStore(
                storedPlan((p) => addShape(setCalibration(p, "eg", CAL_EG, CREATED), "eg", rect(1), CREATED)),
                { now },
            );
            store.getState().updateShape("eg", uuid(1), { x: 250 });
            store.getState().updateShape("eg", uuid(1), { locked: true });
            store.getState().undo();
            store.getState().undo();
            const shape = store.getState().plan.shapesByFloor.eg[0];
            expect(shape.x).toBe(100);
            expect(shape.locked).toBeFalsy();
        });
    });

    describe("floors", () => {
        const KELLER = uuid(800);
        /** EG calibrated with shape 1 selected, DG with shapes 2–5 and a calibration; EG active. */
        function setup() {
            const clock = { now: new Date("2026-11-11T09:00:00.000Z") };
            const storage = storedPlan((p) => {
                let plan = setCalibration(p, "eg", CAL_EG, CREATED);
                plan = addShape(plan, "eg", rect(1), CREATED);
                for (const n of [2, 3, 4, 5]) plan = addShape(plan, "dg", rect(n), CREATED);
                return setCalibration(plan, "dg", CAL_OG, CREATED);
            });
            const store = createAppStore(storage, { now: () => clock.now, newId: () => KELLER });
            const steps = () => store.temporal.getState().pastStates.length;
            const names = () => selectFloors(store.getState()).map((f) => f.name);
            return { store, steps, names };
        }

        it("addFloor appends „Neue Etage“, makes it active, resets selection and tool and is one step", () => {
            const { store, steps, names } = setup();
            store.getState().selectShape(uuid(1));
            store.getState().setActiveTool("rect");
            expect(store.getState().addFloor()).toBe(true);
            expect(names()).toEqual(["Erdgeschoss", "Obergeschoss", "Dachgeschoss", "Neue Etage"]);
            expect(store.getState().plan.activeFloorId).toBe(KELLER);
            expect(store.getState().plan.shapesByFloor[KELLER]).toEqual([]);
            expect(store.getState().selectedShapeId).toBeNull();
            expect(store.getState().activeTool).toBe("select");
            expect(steps()).toBe(1);
        });

        it("removing the active floor makes the following one active and drops its viewport", () => {
            const { store, names } = setup();
            store.getState().setActiveFloor("og");
            store.getState().setViewport("og", { scale: 2, x: 0, y: 0 });
            store.getState().setViewport("dg", { scale: 3, x: 0, y: 0 });
            expect(store.getState().removeFloor("og")).toBe(true);
            expect(names()).toEqual(["Erdgeschoss", "Dachgeschoss"]);
            expect(store.getState().plan.activeFloorId).toBe("dg");
            expect(store.getState().viewports).not.toHaveProperty("og");
            expect(store.getState().viewports.dg).toEqual({ scale: 3, x: 0, y: 0 });
        });

        it("undo after removing restores the floor at its place with shapes and calibration, and makes it active", () => {
            const { store, names } = setup();
            const before = store.getState().plan;
            store.getState().setActiveFloor("dg");
            expect(store.getState().removeFloor("dg")).toBe(true);
            expect(store.getState().plan.activeFloorId).toBe("og");
            store.getState().setActiveFloor("eg");
            expect(store.getState().undo()).toBe(true);
            expect(names()).toEqual(["Erdgeschoss", "Obergeschoss", "Dachgeschoss"]);
            expect(store.getState().plan.shapesByFloor.dg).toEqual(before.shapesByFloor.dg);
            expect(calibrations(store.getState().plan).dg).toEqual(CAL_OG);
            expect(store.getState().plan.activeFloorId).toBe("dg");
        });

        it("undo after adding, while the new floor is active, makes the previous floor active", () => {
            const { store, names } = setup();
            store.getState().setActiveFloor("og");
            store.getState().addFloor();
            expect(store.getState().plan.activeFloorId).toBe(KELLER);
            expect(store.getState().undo()).toBe(true);
            expect(names()).toEqual(["Erdgeschoss", "Obergeschoss", "Dachgeschoss"]);
            expect(store.getState().plan.activeFloorId).toBe("og");
            expect(store.getState().redo()).toBe(true);
            expect(store.getState().plan.activeFloorId).toBe(KELLER);
        });

        it("undo after renaming brings back the old name", () => {
            const { store, steps } = setup();
            expect(store.getState().renameFloor("dg", "Studio")).toBe(true);
            expect(selectFloorName(store.getState(), "dg")).toBe("Studio");
            expect(store.getState().renameFloor("dg", "Studio")).toBe(false);
            expect(steps()).toBe(1);
            store.getState().undo();
            expect(selectFloorName(store.getState(), "dg")).toBe("Dachgeschoss");
            expect(store.getState().plan.activeFloorId).toBe("dg");
        });

        it("moving is one step and keeps the active floor", () => {
            const { store, steps, names } = setup();
            expect(store.getState().moveFloor("dg", "up")).toBe(true);
            expect(store.getState().moveFloor("eg", "up")).toBe(false);
            expect(names()).toEqual(["Erdgeschoss", "Dachgeschoss", "Obergeschoss"]);
            expect(store.getState().plan.activeFloorId).toBe("eg");
            expect(steps()).toBe(1);
        });

        it("switching from calibration mode to „Keller“ without floor plan ends the mode", () => {
            const { store } = setup();
            store.getState().addFloor();
            store.getState().renameFloor(KELLER, "Keller");
            store.getState().setActiveFloor("eg");
            store.getState().toggleCalibration();
            store.getState().addCalibrationPoint({ x: 10, y: 10 });
            store.getState().setActiveFloor(KELLER);
            expect(store.getState().plan.activeFloorId).toBe(KELLER);
            expect(store.getState().calibrationDraft).toBeNull();
            expect(calibrations(store.getState().plan).eg).toEqual(CAL_EG);
        });

        it("calibration mode does not start on a floor without floor plan", () => {
            const { store } = setup();
            store.getState().addFloor();
            store.getState().toggleCalibration();
            expect(store.getState().calibrationDraft).toBeNull();
        });

        it("rejects floor list changes in calibration mode", () => {
            const { store, steps } = setup();
            store.getState().toggleCalibration();
            expect(store.getState().addFloor()).toBe(false);
            expect(store.getState().renameFloor("dg", "Studio")).toBe(false);
            expect(store.getState().moveFloor("dg", "up")).toBe(false);
            expect(store.getState().removeFloor("dg")).toBe(false);
            expect(steps()).toBe(0);
        });

        it("selectFloorName returns the name, or an empty text for an unknown id", () => {
            const { store } = setup();
            expect(selectFloorName(store.getState(), "og")).toBe("Obergeschoss");
            expect(selectFloorName(store.getState(), "kg")).toBe("");
        });
    });
    describe("rooms", () => {
        const DIELE = room(11, "Diele", rectPoints(349, 0, 150, 200));
        /** Ground floor with „Raum 1“ (uuid 10), „Diele“ (uuid 11) and shape A (uuid 1). */
        function setup() {
            const storage = storedPlan((p) => {
                let plan = addRoom(p, "eg", room(10, "Raum 1"), CREATED);
                plan = addRoom(plan, "eg", DIELE, CREATED);
                return addShape(plan, "eg", rect(1), CREATED);
            });
            const store = createAppStore(storage, { now });
            const steps = () => store.temporal.getState().pastStates.length;
            const rooms = (floor: "eg" | "og" | "dg" = "eg") => store.getState().plan.roomsByFloor[floor];
            return { store, steps, rooms };
        }

        /** Draws the corners with the tool „Raum“. */
        function draw(store: ReturnType<typeof createAppStore>, points: { x: number; y: number }[]) {
            store.getState().setActiveTool("room");
            for (const p of points) expect(store.getState().addDraftPoint(p)).toBe(true);
        }

        it("closing a drawn rectangle adds „Raum 2“ (not locked, Neuer Raum) in one undo step, selected, tool back to 'select'", () => {
            const { store, steps, rooms } = setup();
            store.getState().selectShape(uuid(1));
            draw(store, rectPoints(0, 600, 337.5, 560));
            expect(steps()).toBe(0);
            expect(store.getState().closeDraft()).toBe(true);
            const added = rooms().at(-1)!;
            expect(added).toMatchObject({ name: "Raum 2", pointsCm: rectPoints(0, 600, 337.5, 560) });
            expect(added.wallThicknessCm).toEqual([15, 15, 15, 15]);
            expect(added.color).toBeNull();
            expect(added.locked).toBe(false);
            expect(store.getState().selectedRoomId).toBe(added.id);
            expect(store.getState().selectedShapeId).toBeNull();
            expect(selectSelectedRoom(store.getState())).toEqual(added);
            expect(store.getState().activeTool).toBe("select");
            expect(store.getState().roomDraft).toBeNull();
            expect(steps()).toBe(1);
            expect(store.getState().undo()).toBe(true);
            expect(rooms().map((r) => r.name)).toEqual(["Raum 1", "Diele"]);
        });

        it("undo of a wall thickness of „Wohnen“ after selecting „Flur“ restores 15 cm and selects „Wohnen“", () => {
            const { store, steps, rooms } = setup();
            store.getState().updateRoom("eg", DIELE.id, { name: "Flur" });
            store.getState().updateRoom("eg", uuid(10), { name: "Wohnen" });
            const before = steps();
            expect(store.getState().updateRoom("eg", uuid(10), { wallThicknessCm: [36.5, 15, 15, 15] })).toBe(true);
            expect(steps()).toBe(before + 1);
            expect(rooms()[0].wallThicknessCm).toEqual([36.5, 15, 15, 15]);
            store.getState().selectRoom(DIELE.id);
            expect(store.getState().undo()).toBe(true);
            expect(rooms()[0].wallThicknessCm).toEqual([15, 15, 15, 15]);
            expect(store.getState().selectedRoomId).toBe(uuid(10));
        });

        it("undo of coloring „Kind 1“ green removes the color and selects „Kind 1“ (Farbe rückgängig)", () => {
            const { store, steps, rooms } = setup();
            store.getState().updateRoom("eg", uuid(10), { name: "Kind 1" });
            const before = steps();
            expect(store.getState().updateRoom("eg", uuid(10), { color: "#BBF7D0" })).toBe(true);
            expect(steps()).toBe(before + 1);
            expect(store.getState().updateRoom("eg", uuid(10), { color: "#BBF7D0" })).toBe(false);
            expect(steps()).toBe(before + 1);
            store.getState().selectRoom(DIELE.id);
            expect(store.getState().undo()).toBe(true);
            expect(rooms()[0].color).toBeNull();
            expect(store.getState().selectedRoomId).toBe(uuid(10));
        });

        it("draft corners are no undo steps and undo has no effect while drawing", () => {
            const { store, steps } = setup();
            store.getState().updateRoom("eg", DIELE.id, { name: "Flur" });
            draw(store, [{ x: 0, y: 600 }, { x: 100, y: 600 }]);
            expect(steps()).toBe(1);
            expect(store.getState().undo()).toBe(false);
            expect(store.getState().roomDraft?.points).toHaveLength(2);
            expect(store.getState().plan.roomsByFloor.eg[1].name).toBe("Flur");
        });

        it("rounds corners to 0,1 cm and rejects a crossing or 0-cm edge", () => {
            const { store } = setup();
            draw(store, [{ x: 0.04, y: 600.06 }, { x: 300, y: 600 }, { x: 300, y: 900 }]);
            expect(store.getState().roomDraft?.points[0]).toEqual({ x: 0, y: 600.1 });
            expect(store.getState().addDraftPoint({ x: 150, y: 500 })).toBe(false);
            expect(store.getState().addDraftPoint({ x: 300, y: 900 })).toBe(false);
            expect(store.getState().roomDraft?.points).toHaveLength(3);
        });

        it("sets corners from a typed length „337,5“ and „560“", () => {
            const { store } = setup();
            draw(store, [{ x: 0, y: 600 }]);
            store.getState().setDraftLength("337,5");
            expect(store.getState().commitDraftLength({ x: 1, y: 0 })).toBe(true);
            store.getState().setDraftLength("560");
            expect(store.getState().commitDraftLength({ x: 0, y: 1 })).toBe(true);
            expect(store.getState().roomDraft).toEqual({
                points: [
                    { x: 0, y: 600 },
                    { x: 337.5, y: 600 },
                    { x: 337.5, y: 1160 },
                ],
                lengthText: "",
                hint: null,
                wallAnchor: null,
            });
        });

        it("rejects the length „0“ with a hint and keeps the field", () => {
            const { store } = setup();
            draw(store, [{ x: 0, y: 600 }]);
            store.getState().setDraftLength("0");
            expect(store.getState().commitDraftLength({ x: 1, y: 0 })).toBe(false);
            expect(store.getState().roomDraft).toMatchObject({ points: [{ x: 0, y: 600 }], lengthText: "0", hint: "length" });
            store.getState().setDraftLength("");
            expect(store.getState().roomDraft?.hint).toBeNull();
        });

        it("does not close with 2 corners, and closes no crossing outline (with hint)", () => {
            const { store, rooms } = setup();
            draw(store, [{ x: 0, y: 600 }, { x: 300, y: 600 }]);
            expect(store.getState().closeDraft()).toBe(false);
            expect(store.getState().roomDraft?.points).toHaveLength(2);
            for (const p of [{ x: 300, y: 700 }, { x: -100, y: 700 }, { x: -100, y: 800 }, { x: 0, y: 900 }]) {
                store.getState().addDraftPoint(p);
            }
            expect(store.getState().closeDraft()).toBe(false);
            expect(store.getState().roomDraft?.hint).toBe("close");
            expect(rooms()).toHaveLength(2);
        });

        it("removes the last corner, and the draft with the first one", () => {
            const { store } = setup();
            draw(store, [{ x: 0, y: 600 }, { x: 300, y: 600 }, { x: 300, y: 900 }]);
            store.getState().removeLastDraftPoint();
            expect(store.getState().roomDraft?.points).toHaveLength(2);
            store.getState().removeLastDraftPoint();
            store.getState().removeLastDraftPoint();
            expect(store.getState().roomDraft).toBeNull();
            expect(store.getState().activeTool).toBe("room");
        });

        it("cancelDraft, switching tools or floors discard the draft", () => {
            const { store } = setup();
            draw(store, [{ x: 0, y: 600 }, { x: 300, y: 600 }]);
            store.getState().cancelDraft();
            expect(store.getState().roomDraft).toBeNull();
            expect(store.getState().activeTool).toBe("room");
            draw(store, [{ x: 0, y: 600 }]);
            store.getState().setActiveTool("rect");
            expect(store.getState().roomDraft).toBeNull();
            draw(store, [{ x: 0, y: 600 }]);
            store.getState().setActiveFloor("og");
            expect(store.getState().roomDraft).toBeNull();
            expect(store.getState().activeTool).toBe("select");
        });

        it("sets no corner without the tool „Raum“ and in calibration mode", () => {
            const { store } = setup();
            expect(store.getState().addDraftPoint({ x: 0, y: 0 })).toBe(false);
            store.getState().setActiveTool("room");
            store.getState().toggleCalibration();
            expect(store.getState().activeTool).toBe("select");
            store.getState().setActiveTool("room");
            expect(store.getState().activeTool).toBe("select");
            expect(store.getState().addDraftPoint({ x: 0, y: 0 })).toBe(false);
        });

        describe("distance on a wall before the first corner", () => {
            /** Top edge of „Raum 1“ (337,5 cm), outer side at y = −15 cm, measured from the left end. */
            const anchor = { source: { kind: "room", roomId: uuid(10), edgeIndex: 0, face: "outer" }, fromEnd: "start" } as const;

            function typeOffset(text: string) {
                const ctx = setup();
                ctx.store.getState().setActiveTool("room");
                expect(ctx.store.getState().startWallOffset(anchor, text)).toBe(true);
                return ctx;
            }

            it("opens the field without a corner and sets the first corner at the typed distance", () => {
                const { store } = typeOffset("2");
                expect(store.getState().roomDraft).toEqual({ points: [], lengthText: "2", hint: null, wallAnchor: anchor });
                store.getState().setDraftLength("260");
                expect(store.getState().commitWallOffset()).toBe(true);
                expect(store.getState().roomDraft).toEqual({
                    points: [{ x: 260, y: -15 }],
                    lengthText: "",
                    hint: null,
                    wallAnchor: null,
                });
            });

            it("measures from the other end after toggling", () => {
                const { store } = typeOffset("260");
                store.getState().toggleWallOffsetEnd();
                expect(store.getState().roomDraft?.wallAnchor?.fromEnd).toBe("end");
                expect(store.getState().commitWallOffset()).toBe(true);
                expect(store.getState().roomDraft?.points).toEqual([{ x: 77.5, y: -15 }]);
            });

            it("puts 0 cm on the reference end", () => {
                const { store } = typeOffset("0");
                expect(store.getState().commitWallOffset()).toBe(true);
                expect(store.getState().roomDraft?.points).toEqual([{ x: 0, y: -15 }]);
            });

            it("rejects a distance over the edge's length with a hint and keeps the field", () => {
                const { store } = typeOffset("340");
                expect(store.getState().commitWallOffset()).toBe(false);
                expect(store.getState().roomDraft).toMatchObject({ points: [], lengthText: "340", hint: "wallTooLong" });
                store.getState().setDraftLength("337,5");
                expect(store.getState().roomDraft?.hint).toBeNull();
                expect(store.getState().commitWallOffset()).toBe(true);
                expect(store.getState().roomDraft?.points).toEqual([{ x: 337.5, y: -15 }]);
            });

            it("closes the field when its text becomes empty", () => {
                const { store } = typeOffset("2");
                store.getState().setDraftLength("");
                expect(store.getState().roomDraft).toBeNull();
                expect(store.getState().activeTool).toBe("room");
            });

            it("discards the draft when the wall line is gone", () => {
                const { store } = typeOffset("2");
                store.getState().startWallOffset(anchor, "5");
                store.setState({ roomDraft: { ...store.getState().roomDraft!, wallAnchor: { ...anchor, source: { ...anchor.source, edgeIndex: 9 } } } });
                expect(store.getState().commitWallOffset()).toBe(false);
                expect(store.getState().roomDraft).toBeNull();
            });

            it("needs the tool „Raum“ and no draft yet", () => {
                const { store } = setup();
                expect(store.getState().startWallOffset(anchor, "2")).toBe(false);
                draw(store, [{ x: 0, y: 600 }]);
                expect(store.getState().startWallOffset(anchor, "2")).toBe(false);
                expect(store.getState().roomDraft?.points).toHaveLength(1);
            });

            it("blocks undo, is discarded on a floor change, and Esc goes field → tool", () => {
                const { store, steps } = typeOffset("260");
                store.getState().updateRoom("eg", DIELE.id, { name: "Flur" });
                expect(steps()).toBe(1);
                expect(store.getState().undo()).toBe(false);
                expect(store.getState().plan.roomsByFloor.eg[1].name).toBe("Flur");
                // First Esc (handled by the drawing keys): the field closes, „Raum“ stays.
                store.getState().cancelDraft();
                expect(store.getState().roomDraft).toBeNull();
                expect(store.getState().activeTool).toBe("room");
                expect(store.getState().undo()).toBe(true);
                store.getState().startWallOffset(anchor, "2");
                store.getState().setActiveFloor("og");
                expect(store.getState().roomDraft).toBeNull();
                expect(store.getState().activeTool).toBe("select");
            });

            it("has no corner to add a length to", () => {
                const { store } = typeOffset("260");
                expect(store.getState().commitDraftLength({ x: 1, y: 0 })).toBe(false);
                expect(store.getState().roomDraft?.points).toEqual([]);
            });
        });

        it("selectShape clears selectedRoomId and selectRoom clears selectedShapeId", () => {
            const { store } = setup();
            store.getState().selectShape(uuid(1));
            store.getState().selectRoom(DIELE.id);
            expect(store.getState().selectedShapeId).toBeNull();
            expect(store.getState().selectedRoomId).toBe(DIELE.id);
            store.getState().selectShape(uuid(1));
            expect(store.getState().selectedRoomId).toBeNull();
            expect(store.getState().selectedShapeId).toBe(uuid(1));
            store.getState().selectRoom(DIELE.id);
            store.getState().selectShape(null);
            expect(store.getState().selectedRoomId).toBeNull();
        });

        it("switching floors, calibration mode and import clear the room selection", () => {
            const { store } = setup();
            store.getState().selectRoom(DIELE.id);
            store.getState().setActiveFloor("og");
            expect(store.getState().selectedRoomId).toBeNull();
            store.getState().setActiveFloor("eg");
            store.getState().selectRoom(DIELE.id);
            store.getState().toggleCalibration();
            expect(store.getState().selectedRoomId).toBeNull();
            store.getState().endCalibration();
            store.getState().selectRoom(DIELE.id);
            store.getState().replacePlan(createEmptyPlan(NOW, newId));
            expect(store.getState().selectedRoomId).toBeNull();
        });

        it("updates, moves and deletes rooms, one step each, shapes untouched", () => {
            const { store, steps, rooms } = setup();
            const shapes = store.getState().plan.shapesByFloor;
            expect(store.getState().updateRoom("eg", DIELE.id, { name: "Flur" })).toBe(true);
            expect(store.getState().moveRoom("eg", DIELE.id, 25, 0)).toBe(true);
            expect(rooms()[1].pointsCm[0]).toEqual({ x: 374, y: 0 });
            store.getState().selectRoom(DIELE.id);
            expect(store.getState().deleteSelectedRoom()).toBe(true);
            expect(rooms().map((r) => r.name)).toEqual(["Raum 1"]);
            expect(store.getState().selectedRoomId).toBeNull();
            expect(store.getState().plan.shapesByFloor).toBe(shapes);
            expect(steps()).toBe(3);
            expect(store.getState().updateRoom("eg", uuid(10), { name: "" })).toBe(false);
            expect(store.getState().deleteSelectedRoom()).toBe(false);
        });

        it("undoing a move on another floor activates the ground floor and selects „Diele“, no shape", () => {
            const { store } = setup();
            store.getState().moveRoom("eg", DIELE.id, 25, 0);
            store.getState().setActiveFloor("og");
            store.getState().selectShape(uuid(1));
            expect(store.getState().undo()).toBe(true);
            expect(store.getState().plan.activeFloorId).toBe("eg");
            expect(store.getState().plan.roomsByFloor.eg[1]).toEqual(DIELE);
            expect(store.getState().selectedRoomId).toBe(DIELE.id);
            expect(store.getState().selectedShapeId).toBeNull();
        });

        it("redoing a delete leaves nothing selected", () => {
            const { store } = setup();
            store.getState().selectRoom(DIELE.id);
            store.getState().deleteSelectedRoom();
            store.getState().undo();
            expect(store.getState().selectedRoomId).toBe(DIELE.id);
            store.getState().redo();
            expect(store.getState().plan.roomsByFloor.eg.map((r) => r.id)).toEqual([uuid(10)]);
            expect(store.getState().selectedRoomId).toBeNull();
            expect(store.getState().selectedShapeId).toBeNull();
        });
    });

    describe("room drag and shapes moving with their room", () => {
        /** „Bad“ (0|0)–(300|200) with a locked tub at (120|80), a table outside at (600|100); „Diele“ (locked) with a shelf inside. */
        const BAD = room(12, "Bad", rectPoints(0, 0, 300, 200));
        const DIELE = room(11, "Diele", rectPoints(349, 0, 150, 200), [], undefined, null, true);
        const TUB = rect(1, { x: 120, y: 80, locked: true });
        const TABLE = rect(2, { x: 600, y: 100 });
        const SHELF = rect(3, { x: 400, y: 100 });

        function setup() {
            const storage = storedPlan((p) => {
                let plan = addRoom(addRoom(p, "eg", BAD, CREATED), "eg", DIELE, CREATED);
                for (const shape of [TUB, TABLE, SHELF]) plan = addShape(plan, "eg", shape, CREATED);
                return plan;
            });
            const store = createAppStore(storage, { now });
            const steps = () => store.temporal.getState().pastStates.length;
            const shapes = () => store.getState().plan.shapesByFloor.eg;
            return { store, steps, shapes };
        }

        const DRAG = { floorId: "eg", id: BAD.id, dx: -30, dy: 0, stuckEdges: [{ roomId: DIELE.id, edgeIndex: 3 }] };

        it("keeps the room drag out of the history and clears it on floor switch and import", () => {
            const { store, steps } = setup();
            const plan = store.getState().plan;
            store.getState().setRoomDrag(DRAG);
            expect(store.getState().roomDrag).toEqual(DRAG);
            expect(store.getState().plan).toBe(plan);
            store.getState().setRoomDrag(null);
            expect(store.getState().roomDrag).toBeNull();
            expect(steps()).toBe(0);
            store.getState().setRoomDrag(DRAG);
            store.getState().setActiveFloor("og");
            expect(store.getState().roomDrag).toBeNull();
            store.getState().setRoomDrag(DRAG);
            store.getState().replacePlan(createEmptyPlan(NOW, newId));
            expect(store.getState().roomDrag).toBeNull();
        });

        it("moves „Bad“ with its locked tub in one step; one undo restores both and selects „Bad“ (Verschieben mit Möbel rückgängig)", () => {
            const { store, steps, shapes } = setup();
            store.getState().selectRoom(BAD.id);
            expect(store.getState().moveRoom("eg", BAD.id, -30, 0)).toBe(true);
            expect(steps()).toBe(1);
            expect(store.getState().plan.roomsByFloor.eg[0].pointsCm).toEqual(rectPoints(-30, 0, 300, 200));
            expect(shapes()).toEqual([{ ...TUB, x: 90, y: 80 }, TABLE, SHELF]);
            store.getState().selectShape(uuid(1));
            expect(store.getState().undo()).toBe(true);
            expect(store.getState().plan.roomsByFloor.eg[0]).toEqual(BAD);
            expect(shapes()).toEqual([TUB, TABLE, SHELF]);
            expect(store.getState().selectedRoomId).toBe(BAD.id);
            expect(store.getState().selectedShapeId).toBeNull();
        });

        it("moving a locked room changes neither the room nor its shapes (Gesperrter Raum nimmt nichts mit)", () => {
            const { store, steps } = setup();
            const plan = store.getState().plan;
            expect(store.getState().moveRoom("eg", DIELE.id, 50, 0)).toBe(false);
            expect(store.getState().plan).toBe(plan);
            expect(steps()).toBe(0);
        });
    });

    describe("room lock", () => {
        /** „Wohnen“ (0|0)–(500|400) with a window on the bottom edge, „Diele“ (locked) on the ground floor, „Bad“ (locked) upstairs. */
        const WOHNEN = room(10, "Wohnen", rectPoints(0, 0, 500, 400));
        const DIELE = room(11, "Diele", rectPoints(549, 0, 150, 200), [], undefined, null, true);
        const BAD = room(12, "Bad", rectPoints(0, 0, 300, 200), [], undefined, "#BFDBFE", true);
        const WINDOW: Opening = { id: uuid(30), kind: "window", edgeIndex: 2, offsetCm: 100, widthCm: 120, swing: null, beforeFullEdge: null };

        function setup() {
            const storage = storedPlan((p) => {
                let plan = addOpening(addRoom(p, "eg", { ...WOHNEN, locked: true }, CREATED), "eg", WOHNEN.id, WINDOW, CREATED);
                plan = addRoom(plan, "eg", DIELE, CREATED);
                return addRoom(plan, "og", BAD, CREATED);
            });
            const store = createAppStore(storage, { now });
            const steps = () => store.temporal.getState().pastStates.length;
            const rooms = (floor: "eg" | "og" = "eg") => store.getState().plan.roomsByFloor[floor];
            return { store, steps, rooms };
        }

        it("rejects moving, changing an edge length or a wall thickness of a locked room, without undo step", () => {
            const { store, steps } = setup();
            const plan = store.getState().plan;
            expect(store.getState().moveRoom("eg", DIELE.id, 50, 0)).toBe(false);
            expect(store.getState().updateRoom("eg", DIELE.id, { pointsCm: rectPoints(549, 0, 200, 200) })).toBe(false);
            expect(store.getState().updateRoom("eg", DIELE.id, { wallThicknessCm: [24, 15, 15, 15] })).toBe(false);
            expect(store.getState().updateRoom("eg", DIELE.id, { name: "Flur", pointsCm: rectPoints(549, 0, 200, 200) })).toBe(false);
            expect(store.getState().removeRoom("eg", DIELE.id)).toBe(false);
            expect(store.getState().plan).toBe(plan);
            expect(steps()).toBe(0);
        });

        it("renames and colors a locked room, which stays locked (Gesperrten Raum umbenennen / einfärben)", () => {
            const { store, rooms } = setup();
            expect(store.getState().updateRoom("eg", WOHNEN.id, { name: "Wohnzimmer" })).toBe(true);
            expect(store.getState().updateRoom("og", BAD.id, { color: "#BBF7D0" })).toBe(true);
            expect(rooms()[0]).toMatchObject({ name: "Wohnzimmer", locked: true, pointsCm: WOHNEN.pointsCm });
            expect(rooms("og")[0]).toMatchObject({ color: "#BBF7D0", locked: true });
        });

        it("keeps a locked, selected room on deleteSelectedRoom and keeps it selected (Entf bei gesperrtem Raum)", () => {
            const { store, steps, rooms } = setup();
            store.getState().selectRoom(DIELE.id);
            store.getState().setHighlightedEdge(1);
            expect(store.getState().deleteSelectedRoom()).toBe(false);
            expect(rooms().map((r) => r.name)).toEqual(["Wohnen", "Diele"]);
            expect(store.getState().selectedRoomId).toBe(DIELE.id);
            expect(store.getState().highlightedEdge).toBe(1);
            expect(steps()).toBe(0);
        });

        it("clears a stale room selection on deleteSelectedRoom", () => {
            const { store } = setup();
            store.setState({ selectedRoomId: uuid(99) });
            expect(store.getState().deleteSelectedRoom()).toBe(false);
            expect(store.getState().selectedRoomId).toBeNull();
        });

        it("locks and unlocks in one undo step each; moved, then locked, undone twice → unlocked at the start (Rückgängig über die Sperre hinweg)", () => {
            const { store, steps, rooms } = setup();
            expect(store.getState().updateRoom("eg", DIELE.id, { locked: false })).toBe(true);
            expect(store.getState().moveRoom("eg", DIELE.id, 20, 0)).toBe(true);
            expect(store.getState().updateRoom("eg", DIELE.id, { locked: true })).toBe(true);
            expect(steps()).toBe(3);
            expect(rooms()[1]).toMatchObject({ locked: true, pointsCm: rectPoints(569, 0, 150, 200) });
            expect(store.getState().moveRoom("eg", DIELE.id, 20, 0)).toBe(false);
            store.getState().undo();
            expect(rooms()[1]).toMatchObject({ locked: false, pointsCm: rectPoints(569, 0, 150, 200) });
            store.getState().undo();
            expect(rooms()[1]).toEqual({ ...DIELE, locked: false });
            store.getState().redo();
            store.getState().redo();
            expect(rooms()[1].locked).toBe(true);
        });

        it("sets, changes and deletes openings of a locked room; the room stays unchanged and locked (Öffnungen in gesperrten Räumen)", () => {
            const { store, rooms } = setup();
            const corners = rooms()[0].pointsCm;
            store.getState().setActiveTool("door-opening");
            expect(store.getState().insertOpening("door", { x: 200, y: -7 }, 10)).toBe(true);
            expect(rooms()[0].openings.at(-1)).toMatchObject({ kind: "door", edgeIndex: 0 });
            expect(store.getState().updateOpening("eg", WINDOW.id, { offsetCm: 150 })).toBe(true);
            expect(rooms()[0].openings.find((o) => o.id === WINDOW.id)?.offsetCm).toBe(150);
            store.getState().selectOpening(WINDOW.id);
            expect(store.getState().deleteSelectedOpening()).toBe(true);
            expect(rooms()[0].openings.map((o) => o.kind)).toEqual(["door"]);
            expect(rooms()[0].pointsCm).toEqual(corners);
            expect(rooms()[0].locked).toBe(true);
        });

        it("removes a floor together with its locked room (Etage mit gesperrtem Raum löschen)", () => {
            const { store } = setup();
            expect(store.getState().removeFloor("og")).toBe(true);
            expect(store.getState().plan.floors.map((f) => f.id)).not.toContain("og");
            expect(store.getState().plan.roomsByFloor).not.toHaveProperty("og");
        });
    });

    describe("openings", () => {
        /** „Wohnen“ (0|0)–(500|400) on the ground floor with a window on the bottom edge; shape A; no room upstairs. */
        const WOHNEN = room(10, "Wohnen", rectPoints(0, 0, 500, 400));
        const WINDOW: Opening = { id: uuid(30), kind: "window", edgeIndex: 2, offsetCm: 100, widthCm: 120, swing: null, beforeFullEdge: null };
        const TOLERANCE = 10;

        function setup() {
            const storage = storedPlan((p) => {
                const plan = addOpening(addRoom(p, "eg", WOHNEN, CREATED), "eg", WOHNEN.id, WINDOW, CREATED);
                return addShape(plan, "eg", rect(1, { x: 1000, y: 1000 }), CREATED);
            });
            const store = createAppStore(storage, { now });
            const steps = () => store.temporal.getState().pastStates.length;
            const openings = () => store.getState().plan.roomsByFloor.eg[0].openings;
            return { store, storage, steps, openings };
        }

        it("setting a door on the top band at x = 200 cm selects it and switches to „Auswählen“, one step", () => {
            const { store, steps, openings } = setup();
            store.getState().setActiveTool("door-opening");
            expect(store.getState().activeTool).toBe("door-opening");
            expect(store.getState().insertOpening("door", { x: 200, y: -7 }, TOLERANCE)).toBe(true);
            const door = openings().at(-1)!;
            expect(door).toMatchObject({ kind: "door", edgeIndex: 0, offsetCm: 160, widthCm: 80, swing: { hinge: "start", side: "inside" } });
            expect(store.getState().selectedOpeningId).toBe(door.id);
            expect(selectSelectedOpening(store.getState())).toEqual({ room: store.getState().plan.roomsByFloor.eg[0], opening: door });
            expect(store.getState().activeTool).toBe("select");
            expect(store.getState().plan.updatedAt).toBe(NOW.toISOString());
            expect(steps()).toBe(1);
        });

        it("a click without an edge sets nothing and the tool stays", () => {
            const { store, steps, openings } = setup();
            store.getState().setActiveTool("window");
            expect(store.getState().insertOpening("window", { x: 250, y: 200 }, TOLERANCE)).toBe(false);
            expect(openings()).toEqual([WINDOW]);
            expect(store.getState().activeTool).toBe("window");
            expect(steps()).toBe(0);
        });

        it("locks both tools on a floor without room and in calibration mode", () => {
            const { store } = setup();
            expect(isToolEnabled(store.getState(), "door-opening")).toBe(true);
            store.getState().setActiveFloor("og");
            for (const tool of ["door-opening", "window", "passage"] as const) {
                expect(isToolEnabled(store.getState(), tool)).toBe(false);
                store.getState().setActiveTool(tool);
                expect(store.getState().activeTool).toBe("select");
            }
            expect(store.getState().insertOpening("door", { x: 200, y: -7 }, TOLERANCE)).toBe(false);
            expect(isToolEnabled(store.getState(), "rect")).toBe(true);
            store.getState().setActiveFloor("eg");
            store.getState().toggleCalibration();
            expect(isToolEnabled(store.getState(), "window")).toBe(false);
            expect(store.getState().insertOpening("window", { x: 200, y: -7 }, TOLERANCE)).toBe(false);
        });

        it("selecting a shape or room clears the opening selection and the other way round", () => {
            const { store } = setup();
            store.getState().selectOpening(WINDOW.id);
            expect(store.getState().selectedOpeningId).toBe(WINDOW.id);
            store.getState().selectShape(uuid(1));
            expect(store.getState().selectedOpeningId).toBeNull();
            store.getState().selectOpening(WINDOW.id);
            expect(store.getState().selectedShapeId).toBeNull();
            store.getState().selectRoom(WOHNEN.id);
            expect(store.getState().selectedOpeningId).toBeNull();
            store.getState().selectOpening(WINDOW.id);
            expect(store.getState().selectedRoomId).toBeNull();
            store.getState().selectShape(null);
            expect(store.getState().selectedOpeningId).toBeNull();
        });

        it("switching floors clears the opening selection; another floor's opening is not selected", () => {
            const { store } = setup();
            store.getState().selectOpening(WINDOW.id);
            store.getState().setActiveFloor("og");
            expect(store.getState().selectedOpeningId).toBeNull();
            store.setState({ selectedOpeningId: WINDOW.id });
            expect(selectSelectedOpening(store.getState())).toBeNull();
        });

        it("updates and deletes the selected opening, one step each; deleting clears the selection", () => {
            const { store, steps, openings } = setup();
            expect(store.getState().updateOpening("eg", WINDOW.id, { widthCm: 90 })).toBe(true);
            expect(store.getState().updateOpening("eg", WINDOW.id, { widthCm: 900 })).toBe(false);
            store.getState().selectOpening(WINDOW.id);
            expect(store.getState().deleteSelectedOpening()).toBe(true);
            expect(openings()).toEqual([]);
            expect(store.getState().selectedOpeningId).toBeNull();
            expect(steps()).toBe(2);
            expect(store.getState().deleteSelectedOpening()).toBe(false);
        });

        it("undo of a door move after switching upstairs activates the ground floor and selects the door", () => {
            const { store, openings } = setup();
            store.getState().setActiveTool("door-opening");
            store.getState().insertOpening("door", { x: 200, y: -7 }, TOLERANCE);
            const door = openings().at(-1)!;
            store.getState().updateOpening("eg", door.id, { offsetCm: 195 });
            store.getState().setActiveFloor("og");
            expect(store.getState().undo()).toBe(true);
            expect(store.getState().plan.activeFloorId).toBe("eg");
            expect(openings().at(-1)).toEqual(door);
            expect(store.getState().selectedOpeningId).toBe(door.id);
            expect(store.getState().selectedRoomId).toBeNull();
            expect(store.getState().selectedShapeId).toBeNull();
        });

        it("snaps a window clicked at x = 245 cm at zoom 100 % to the center: 190–310 cm (Fenster mittig setzen)", () => {
            const { store, steps, openings } = setup();
            store.getState().setActiveTool("window");
            const snap = { snap: true, snapToleranceCm: SNAP_POINT_TOLERANCE_PX / 1 };
            expect(store.getState().insertOpening("window", { x: 245, y: -5 }, TOLERANCE, snap)).toBe(true);
            expect(openings().at(-1)).toMatchObject({ kind: "window", edgeIndex: 0, offsetCm: 190, widthCm: 120 });
            expect(steps()).toBe(1);
        });

        it("sets exactly one window at 185 cm with Shift held (Ohne Rastpunkte)", () => {
            const { store, openings } = setup();
            store.getState().setActiveTool("window");
            const snap = { snap: false, snapToleranceCm: SNAP_POINT_TOLERANCE_PX / 1 };
            expect(store.getState().insertOpening("window", { x: 245, y: -5 }, TOLERANCE, snap)).toBe(true);
            expect(openings()).toHaveLength(2);
            expect(openings().at(-1)).toMatchObject({ edgeIndex: 0, offsetCm: 185 });
        });

        it("snaps a click at x = 236 cm to the center at zoom 50 % (Toleranz hängt vom Zoom ab)", () => {
            const { store, openings } = setup();
            store.getState().setActiveTool("window");
            const scale = 0.5;
            const snap = { snap: true, snapToleranceCm: SNAP_POINT_TOLERANCE_PX / scale };
            expect(store.getState().insertOpening("window", { x: 236, y: -5 }, EDGE_HIT_TOLERANCE_PX / scale, snap)).toBe(true);
            expect(openings().at(-1)).toMatchObject({ edgeIndex: 0, offsetCm: 190 });
        });

        it("snaps beside an opening of the same edge only", () => {
            const { store, openings } = setup();
            store.getState().setActiveTool("window");
            // The window on the bottom edge (offset 100–220 cm) gives a neighbor target at offset 220 cm there, not on top.
            const snap = { snap: true, snapToleranceCm: SNAP_POINT_TOLERANCE_PX };
            expect(store.getState().insertOpening("window", { x: 282, y: -5 }, TOLERANCE, snap)).toBe(true);
            expect(openings().at(-1)).toMatchObject({ edgeIndex: 0, offsetCm: 222 });
            store.getState().setActiveTool("window");
            // Bottom edge runs from x = 500 cm leftwards: x = 217 cm is t = 283 cm, raw offset 223 cm.
            expect(store.getState().insertOpening("window", { x: 217, y: 405 }, TOLERANCE, snap)).toBe(true);
            expect(openings().at(-1)).toMatchObject({ edgeIndex: 2, offsetCm: 220 });
        });

        it("undo of setting a window removes it and selects nothing", () => {
            const { store, openings } = setup();
            store.getState().setActiveTool("window");
            store.getState().insertOpening("window", { x: 250, y: -5 }, TOLERANCE);
            expect(store.getState().selectedOpeningId).not.toBeNull();
            expect(store.getState().undo()).toBe(true);
            expect(openings()).toEqual([WINDOW]);
            expect(store.getState().selectedOpeningId).toBeNull();
            expect(store.getState().selectedRoomId).toBeNull();
            expect(store.getState().selectedShapeId).toBeNull();
        });

        it("undo of an edge change selects the room, not the re-anchored window", () => {
            const { store, openings } = setup();
            const points = [{ x: 0, y: 0 }, { x: 520, y: 0 }, { x: 520, y: 400 }, { x: 0, y: 400 }];
            expect(store.getState().updateRoom("eg", WOHNEN.id, { pointsCm: points })).toBe(true);
            expect(openings()[0].offsetCm).toBe(120);
            store.getState().selectOpening(WINDOW.id);
            expect(store.getState().undo()).toBe(true);
            expect(openings()).toEqual([WINDOW]);
            expect(store.getState().selectedRoomId).toBe(WOHNEN.id);
            expect(store.getState().selectedOpeningId).toBeNull();
        });

        it("key D chooses „Durchgang“; a click sets a 100 cm passage without swing, selects it and switches to „Auswählen“, one step", () => {
            const { store, steps, openings } = setup();
            store.getState().setActiveTool(toolForKey("d")!.id);
            expect(store.getState().activeTool).toBe("passage");
            expect(store.getState().insertOpening("passage", { x: 250, y: -7 }, TOLERANCE)).toBe(true);
            const passage = openings().at(-1)!;
            expect(passage).toMatchObject({ kind: "passage", edgeIndex: 0, offsetCm: 200, widthCm: 100, swing: null });
            expect(store.getState().selectedOpeningId).toBe(passage.id);
            expect(store.getState().activeTool).toBe("select");
            expect(steps()).toBe(1);
        });

        it("locks the passage tool and key D on a floor without room", () => {
            const { store } = setup();
            expect(isToolEnabled(store.getState(), "passage")).toBe(true);
            store.getState().setActiveFloor("og");
            expect(isToolEnabled(store.getState(), "passage")).toBe(false);
            store.getState().setActiveTool(toolForKey("D")!.id);
            expect(store.getState().activeTool).toBe("select");
            expect(store.getState().insertOpening("passage", { x: 250, y: -7 }, TOLERANCE)).toBe(false);
        });

        describe("„Ganze Kante“ (Ganze Kante öffnen)", () => {
            /** Inserts a passage (100 cm at 200 cm) or window (120 cm at 190 cm) on the 500 cm top edge of „Wohnen“. */
            function insert(kind: "passage" | "window") {
                const ctx = setup();
                ctx.store.getState().setActiveTool(kind);
                const snap = { snap: true, snapToleranceCm: SNAP_POINT_TOLERANCE_PX / 1 };
                expect(ctx.store.getState().insertOpening(kind, { x: 250, y: -7 }, TOLERANCE, snap)).toBe(true);
                return { ...ctx, opening: ctx.openings().at(-1)! };
            }
            const toggle = (ctx: ReturnType<typeof insert>, checked: boolean) => {
                const state = ctx.store.getState();
                const current = ctx.openings().at(-1)!;
                const patch = toggleFullEdge(edgeFrame(WOHNEN.pointsCm, 0), current, checked, state.plan.settings);
                expect(patch).not.toBeNull();
                expect(state.updateOpening("eg", current.id, patch!)).toBe(true);
            };

            it.each([
                ["passage", 200, 100],
                ["window", 190, 120],
            ] as const)("checking a %s is one step; undo after selecting the room restores sizes and selection (Rückgängig)", (kind, offsetCm, widthCm) => {
                const ctx = insert(kind);
                expect(ctx.opening).toMatchObject({ offsetCm, widthCm, beforeFullEdge: null });
                toggle(ctx, true);
                expect(ctx.openings().at(-1)).toMatchObject({ offsetCm: 0, widthCm: 500, beforeFullEdge: { offsetCm, widthCm } });
                expect(ctx.steps()).toBe(2);
                ctx.store.getState().selectRoom(WOHNEN.id);
                expect(ctx.store.getState().undo()).toBe(true);
                expect(ctx.openings().at(-1)).toEqual(ctx.opening);
                expect(ctx.store.getState().selectedOpeningId).toBe(ctx.opening.id);
                expect(ctx.store.getState().selectedRoomId).toBeNull();
            });

            it.each(["passage", "window"] as const)("unchecking a %s restores its sizes in one step; undo makes it whole again (Abhaken ist ein Schritt)", (kind) => {
                const ctx = insert(kind);
                toggle(ctx, true);
                const full = ctx.openings().at(-1)!;
                toggle(ctx, false);
                expect(ctx.openings().at(-1)).toEqual(ctx.opening);
                expect(ctx.steps()).toBe(3);
                expect(ctx.store.getState().undo()).toBe(true);
                expect(ctx.openings().at(-1)).toEqual(full);
                expect(ctx.store.getState().selectedOpeningId).toBe(ctx.opening.id);
                expect(ctx.store.getState().redo()).toBe(true);
                expect(ctx.openings().at(-1)).toEqual(ctx.opening);
            });
        });

        describe("resizing at the handles", () => {
            it("one patch with width and offset is one step; undo restores the width and the selection (Ein Rückgängig-Schritt)", () => {
                const { store, steps, openings } = setup();
                store.getState().selectOpening(WINDOW.id);
                expect(store.getState().updateOpening("eg", WINDOW.id, { offsetCm: 100, widthCm: 155 })).toBe(true);
                expect(openings()[0]).toMatchObject({ offsetCm: 100, widthCm: 155 });
                expect(steps()).toBe(1);
                store.getState().selectRoom(WOHNEN.id);
                expect(store.getState().undo()).toBe(true);
                expect(openings()[0]).toEqual(WINDOW);
                expect(store.getState().selectedOpeningId).toBe(WINDOW.id);
            });

            it("forgets the remembered sizes; dragged to both corners „Ganze Kante“ is checked (Ganze Kante gezogen)", () => {
                const { store, openings } = setup();
                const remembered = { offsetCm: 100, widthCm: 120 };
                expect(store.getState().updateOpening("eg", WINDOW.id, { offsetCm: 0, widthCm: 500, beforeFullEdge: remembered })).toBe(true);
                // Drag the left handle to the left corner (unchanged), then the right one to the right corner.
                expect(store.getState().updateOpening("eg", WINDOW.id, { offsetCm: 0, widthCm: 300 })).toBe(true);
                expect(openings()[0].beforeFullEdge).toBeNull();
                expect(store.getState().updateOpening("eg", WINDOW.id, { offsetCm: 0, widthCm: 500 })).toBe(true);
                expect(openings()[0]).toMatchObject({ offsetCm: 0, widthCm: 500, beforeFullEdge: null });
                expect(isFullEdge(edgeFrame(WOHNEN.pointsCm, WINDOW.edgeIndex), openings()[0])).toBe(true);
            });

            it("works in a locked room (Gesperrter Raum)", () => {
                const { store, openings } = setup();
                expect(store.getState().updateRoom("eg", WOHNEN.id, { locked: true })).toBe(true);
                expect(store.getState().updateOpening("eg", WINDOW.id, { offsetCm: 100, widthCm: 155 })).toBe(true);
                expect(openings()[0]).toMatchObject({ offsetCm: 100, widthCm: 155 });
            });
        });

        it("the autosave stores the openings", () => {
            vi.useFakeTimers();
            try {
                const { store, storage } = setup();
                startPlanAutosave(store, storage);
                store.getState().setActiveTool("door-opening");
                store.getState().insertOpening("door", { x: 200, y: -7 }, TOLERANCE);
                vi.advanceTimersByTime(1000);
                const saved = JSON.parse(storage.getItem(PLAN_STORAGE_KEY)!) as Plan;
                expect(saved.roomsByFloor.eg[0].openings).toEqual(store.getState().plan.roomsByFloor.eg[0].openings);
                expect(saved.roomsByFloor.eg[0].openings).toHaveLength(2);
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe("settings", () => {
        /** Ground floor with „Wohnen“ (0|0)–(500|400, uuid 10, 15 cm walls) and a sofa (uuid 1); the first-floor is empty. */
        function setup() {
            const clock = { now: new Date("2026-11-11T18:30:00.000Z") };
            const storage = storedPlan((p) => {
                const plan = addRoom(p, "eg", room(10, "Wohnen", rectPoints(0, 0, 500, 400)), CREATED);
                return addShape(plan, "eg", rect(1, { label: "Sofa", x: 1000, y: 1000 }), CREATED);
            });
            const store = createAppStore(storage, { now: () => clock.now });
            const steps = () => store.temporal.getState().pastStates.length;
            return { store, steps, clock };
        }

        it("starts with the factory settings and changes a value in one step", () => {
            const { store, steps } = setup();
            expect(selectSettings(store.getState())).toEqual(FACTORY_SETTINGS);
            expect(store.getState().updateSettings({ snapStepCm: 2.5 })).toBe(true);
            expect(selectSettings(store.getState()).snapStepCm).toBe(2.5);
            expect(store.getState().plan.updatedAt).toBe(NOW.toISOString());
            expect(steps()).toBe(1);
        });

        it("rejects an invalid or unchanged value without a step", () => {
            const { store, steps } = setup();
            expect(store.getState().updateSettings({ gridStepCm: 5 })).toBe(false);
            expect(store.getState().updateSettings({ gridStepCm: 100 })).toBe(false);
            expect(selectSettings(store.getState()).gridStepCm).toBe(100);
            expect(steps()).toBe(0);
        });

        it("resets all values in one step and is rejected when they already are factory settings (Zurücksetzen)", () => {
            const { store, steps } = setup();
            store.getState().updateSettings({ defaultWallThicknessCm: 11.5 });
            store.getState().updateSettings({ snapStepCm: 2.5 });
            expect(store.getState().resetSettings()).toBe(true);
            expect(selectSettings(store.getState())).toEqual(FACTORY_SETTINGS);
            expect(store.getState().resetSettings()).toBe(false);
            expect(steps()).toBe(3);
            expect(store.getState().undo()).toBe(true);
            expect(selectSettings(store.getState())).toMatchObject({ defaultWallThicknessCm: 11.5, snapStepCm: 2.5 });
        });

        it("draws a new room with 11,5 cm at every edge, „Wohnen“ keeps 15 cm (Innenwände)", () => {
            const { store } = setup();
            store.getState().updateSettings({ defaultWallThicknessCm: 11.5 });
            store.getState().setActiveTool("room");
            for (const p of rectPoints(0, 600, 300, 200)) store.getState().addDraftPoint(p);
            expect(store.getState().closeDraft()).toBe(true);
            const [wohnen, added] = store.getState().plan.roomsByFloor.eg;
            expect(added.wallThicknessCm).toEqual([11.5, 11.5, 11.5, 11.5]);
            expect(wohnen.wallThicknessCm).toEqual([15, 15, 15, 15]);
        });

        it("gives a new room the color for new rooms (Farbe neuer Räume)", () => {
            const { store } = setup();
            store.getState().updateSettings({ defaultRoomColor: "#BBF7D0" });
            store.getState().setActiveTool("room");
            for (const p of rectPoints(0, 600, 300, 200)) store.getState().addDraftPoint(p);
            store.getState().closeDraft();
            const [wohnen, added] = store.getState().plan.roomsByFloor.eg;
            expect(added.color).toBe("#BBF7D0");
            expect(wohnen.color).toBeNull();
        });

        it("sets a door 88,5 cm wide with the door width set to 88,5 cm (Anforderung mit festem Wert)", () => {
            const { store } = setup();
            store.getState().updateSettings({ doorWidthCm: 88.5, windowWidthCm: 101 });
            store.getState().setActiveTool("door-opening");
            expect(store.getState().insertOpening("door", { x: 200, y: -7 }, 10)).toBe(true);
            store.getState().setActiveTool("window");
            expect(store.getState().insertOpening("window", { x: 250, y: 407 }, 10)).toBe(true);
            const openings = store.getState().plan.roomsByFloor.eg[0].openings;
            expect(openings.map((o) => [o.kind, o.widthCm])).toEqual([
                ["door", 88.5],
                ["window", 101],
            ]);
        });

        it("undoes a snap step change, the sofa stays selected and the floor unchanged (Fangschritt rückgängig)", () => {
            const { store } = setup();
            store.getState().updateSettings({ snapStepCm: 2.5 });
            store.getState().selectShape(uuid(1));
            expect(store.getState().undo()).toBe(true);
            expect(selectSettings(store.getState()).snapStepCm).toBe(5);
            expect(store.getState().selectedShapeId).toBe(uuid(1));
            expect(store.getState().plan.activeFloorId).toBe("eg");
            expect(store.getState().redo()).toBe(true);
            expect(selectSettings(store.getState()).snapStepCm).toBe(2.5);
            expect(store.getState().selectedShapeId).toBe(uuid(1));
        });

        it("keeps the floor shown when undoing a settings change made on another floor", () => {
            const { store } = setup();
            store.getState().updateSettings({ gridStepCm: 50 });
            store.getState().setActiveFloor("og");
            store.getState().setActiveTool("rect");
            expect(store.getState().undo()).toBe(true);
            expect(selectSettings(store.getState()).gridStepCm).toBe(100);
            expect(store.getState().plan.activeFloorId).toBe("og");
            expect(store.getState().activeTool).toBe("rect");
        });
    });

    describe("clipboard", () => {
        const DOOR: Opening = {
            id: uuid(40),
            kind: "door",
            edgeIndex: 2,
            offsetCm: 100,
            widthCm: 80,
            swing: { hinge: "start", side: "inside" },
            beforeFullEdge: null,
        };
        const WINDOWS: Opening[] = [
            { id: uuid(41), kind: "window", edgeIndex: 0, offsetCm: 50, widthCm: 100, swing: null, beforeFullEdge: null },
            { id: uuid(42), kind: "window", edgeIndex: 0, offsetCm: 200, widthCm: 100, swing: null, beforeFullEdge: null },
        ];
        /** „Bad“ (0|0)–(400|300) with a door and two windows, 11,5 cm walls, blue. */
        const BAD = room(10, "Bad", rectPoints(0, 0, 400, 300), [DOOR, ...WINDOWS], [11.5, 11.5, 11.5, 11.5], "#BFDBFE");
        const KUECHE = room(11, "Küche", rectPoints(600, 0, 300, 300), [], undefined, null, true);

        /** EG: rectangle 1 at (300|200), a tub (rect 2) inside „Bad“, locked rect 3, „Bad“ and locked „Küche“. */
        function setup() {
            const store = createAppStore(
                storedPlan((p) => {
                    let plan = addShape(p, "eg", rect(1, { x: 300, y: 200 }), CREATED);
                    plan = addShape(plan, "eg", rect(2, { x: 100, y: 100, widthCm: 170, depthCm: 75, label: "Wanne" }), CREATED);
                    plan = addShape(plan, "eg", rect(3, { x: 1000, y: 1000, rotationDeg: 90, locked: true }), CREATED);
                    plan = addRoom(plan, "eg", BAD, CREATED);
                    return addRoom(plan, "eg", KUECHE, CREATED);
                }),
                { now },
            );
            const steps = () => store.temporal.getState().pastStates.length;
            const shapes = (floor = "eg") => store.getState().plan.shapesByFloor[floor];
            const rooms = (floor = "eg") => store.getState().plan.roomsByFloor[floor];
            const selected = () => selectSelectedShape(store.getState()) ?? selectSelectedRoom(store.getState());
            return { store, steps, shapes, rooms, selected };
        }

        it("starts empty; copying changes neither the plan nor the history", () => {
            const { store, steps } = setup();
            expect(store.getState().clipboard).toBeNull();
            const plan = store.getState().plan;
            store.getState().selectShape(uuid(1));
            expect(store.getState().copySelection()).toBe(true);
            expect(store.getState().plan).toBe(plan);
            expect(steps()).toBe(0);
            expect(store.getState().clipboard?.item).toEqual({ kind: "shape", shape: rect(1, { x: 300, y: 200 }) });
        });

        it("copying without a selection or with an opening selected returns false and keeps the clipboard", () => {
            const { store } = setup();
            store.getState().selectRoom(BAD.id);
            store.getState().copySelection();
            const clip = store.getState().clipboard;
            store.getState().selectShape(null);
            expect(store.getState().copySelection()).toBe(false);
            store.getState().selectOpening(DOOR.id);
            expect(store.getState().copySelection()).toBe(false);
            expect(store.getState().cutSelection()).toBe(false);
            expect(store.getState().duplicateSelection()).toBe(false);
            expect(store.getState().clipboard).toBe(clip);
        });

        it("pastes twice on the same floor at +50 cm and +100 cm, selected, one undo step each (Versetzt auf derselben Etage)", () => {
            const { store, steps, shapes, selected } = setup();
            store.getState().selectShape(uuid(1));
            store.getState().copySelection();
            store.getState().setActiveTool("rect");
            expect(store.getState().pasteClipboard()).toBe(true);
            expect(selected()).toMatchObject({ x: 350, y: 250 });
            expect(store.getState().activeTool).toBe("select");
            expect(store.getState().pasteClipboard()).toBe(true);
            expect(selected()).toMatchObject({ x: 400, y: 300 });
            expect(shapes().at(-1)).toBe(selected());
            expect(shapes()).toHaveLength(5);
            expect(steps()).toBe(2);
            store.getState().undo();
            expect(shapes()).toHaveLength(4);
        });

        it("pastes on another floor first at the same place, then +50 cm; a new copy starts over", () => {
            const { store, rooms, selected } = setup();
            store.getState().selectRoom(BAD.id);
            store.getState().copySelection();
            store.getState().setActiveFloor("og");
            store.getState().pasteClipboard();
            expect(rooms("og")[0].pointsCm).toEqual(rectPoints(0, 0, 400, 300));
            store.getState().pasteClipboard();
            expect(rooms("og")[1].pointsCm).toEqual(rectPoints(50, 50, 400, 300));
            expect(selected()?.id).toBe(rooms("og")[1].id);

            store.getState().setActiveFloor("eg");
            store.getState().selectRoom(BAD.id);
            store.getState().copySelection();
            store.getState().pasteClipboard();
            expect(rooms("eg").at(-1)?.pointsCm).toEqual(rectPoints(50, 50, 400, 300));
            store.getState().setActiveFloor("og");
            store.getState().pasteClipboard();
            expect(rooms("og").at(-1)?.pointsCm).toEqual(rectPoints(0, 0, 400, 300));
        });

        it("a room copy takes over walls, color and openings with new ids, not the tub inside (Raum mit Tür, Möbel im Raum)", () => {
            const { store, rooms, shapes } = setup();
            store.getState().selectRoom(BAD.id);
            store.getState().copySelection();
            store.getState().pasteClipboard();
            const copy = rooms().at(-1)!;
            expect(copy).toMatchObject({ name: "Bad (Kopie)", wallThicknessCm: [11.5, 11.5, 11.5, 11.5], color: "#BFDBFE", locked: false });
            expect(copy.openings.map(({ id: _id, ...o }) => o)).toEqual(BAD.openings.map(({ id: _id, ...o }) => o));
            const allOpeningIds = rooms().flatMap((r) => r.openings.map((o) => o.id));
            expect(new Set(allOpeningIds).size).toBe(allOpeningIds.length);
            expect(shapes().filter((s) => s.label === "Wanne")).toHaveLength(1);
        });

        it("undoing a pasted room removes it with its windows; pasting again works", () => {
            const { store, rooms } = setup();
            store.getState().selectRoom(BAD.id);
            store.getState().copySelection();
            store.getState().pasteClipboard();
            expect(rooms()).toHaveLength(3);
            store.getState().undo();
            expect(rooms()).toHaveLength(2);
            expect(store.getState().pasteClipboard()).toBe(true);
            expect(rooms()).toHaveLength(3);
        });

        it("a paste keeps the measures at the time of copying (Original nach dem Kopieren geändert)", () => {
            const { store, selected } = setup();
            store.getState().selectShape(uuid(1));
            store.getState().copySelection();
            store.getState().updateSelectedShape({ widthCm: 120 });
            store.getState().pasteClipboard();
            expect(selected()).toMatchObject({ widthCm: 200 });
        });

        it("cuts: original gone, nothing selected, one step; first paste in place with the old name, then +50 cm with „ (Kopie)“", () => {
            const { store, steps, rooms, selected } = setup();
            store.getState().selectRoom(BAD.id);
            expect(store.getState().cutSelection()).toBe(true);
            expect(rooms().some((r) => r.id === BAD.id)).toBe(false);
            expect(selected()).toBeNull();
            expect(steps()).toBe(1);
            store.getState().pasteClipboard();
            expect(selected()).toMatchObject({ name: "Bad", pointsCm: BAD.pointsCm });
            store.getState().pasteClipboard();
            expect(selected()).toMatchObject({ name: "Bad (Kopie)", pointsCm: rectPoints(50, 50, 400, 300) });
        });

        it("cut and paste upstairs moves a room there, keeping its name (In andere Etage verschieben)", () => {
            const { store, rooms } = setup();
            store.getState().selectRoom(BAD.id);
            store.getState().cutSelection();
            store.getState().setActiveFloor("og");
            store.getState().pasteClipboard();
            expect(rooms("og")[0]).toMatchObject({ name: "Bad", pointsCm: BAD.pointsCm });
            store.getState().pasteClipboard();
            expect(rooms("og")[1]).toMatchObject({ name: "Bad (Kopie)", pointsCm: rectPoints(50, 50, 400, 300) });
        });

        it("undoing a cut restores the original and keeps the clipboard", () => {
            const { store, shapes } = setup();
            store.getState().selectShape(uuid(1));
            store.getState().cutSelection();
            const clip = store.getState().clipboard;
            store.getState().undo();
            expect(shapes().find((s) => s.id === uuid(1))).toMatchObject({ x: 300, y: 200 });
            expect(store.getState().clipboard).toBe(clip);
        });

        it("cutting a locked room only copies it; the paste is offset, unlocked and „ (Kopie)“ (Gesperrt ausschneiden)", () => {
            const { store, steps, rooms, selected } = setup();
            store.getState().selectRoom(KUECHE.id);
            expect(store.getState().cutSelection()).toBe(true);
            expect(rooms().some((r) => r.id === KUECHE.id)).toBe(true);
            expect(selected()?.id).toBe(KUECHE.id);
            expect(steps()).toBe(0);
            store.getState().pasteClipboard();
            expect(selected()).toMatchObject({ name: "Küche (Kopie)", locked: false, pointsCm: rectPoints(650, 50, 300, 300) });
        });

        it("a copy of a locked shape is not locked (Gesperrtes Original)", () => {
            const { store, selected } = setup();
            store.getState().selectShape(uuid(3));
            store.getState().copySelection();
            store.getState().pasteClipboard();
            const copy = selected()!;
            expect(copy).toMatchObject({ rotationDeg: 90, widthCm: 200, depthCm: 90 });
            expect(copy.locked).toBeFalsy();
            expect(store.getState().updateShape("eg", copy.id, { x: 0 })).toBe(true);
        });

        it("duplicates twice at +50 cm each, the last one selected, the clipboard unchanged (Wiederholt duplizieren)", () => {
            const { store, steps, shapes, selected } = setup();
            store.getState().selectRoom(BAD.id);
            store.getState().copySelection();
            const clip = store.getState().clipboard;
            store.getState().selectShape(uuid(2));
            expect(store.getState().duplicateSelection()).toBe(true);
            expect(store.getState().duplicateSelection()).toBe(true);
            expect(shapes().slice(-2).map((s) => [s.x, s.y])).toEqual([
                [150, 150],
                [200, 200],
            ]);
            expect(selected()).toMatchObject({ x: 200, y: 200 });
            expect(steps()).toBe(2);
            expect(store.getState().clipboard).toBe(clip);
            store.getState().pasteClipboard();
            expect(selected()).toMatchObject({ name: "Bad (Kopie)" });
        });

        it("paste and duplicate do nothing with an empty clipboard, in calibration mode or while a room is drawn", () => {
            const { store, rooms } = setup();
            expect(store.getState().pasteClipboard()).toBe(false);
            store.getState().selectShape(uuid(1));
            store.getState().copySelection();
            const plan = store.getState().plan;

            store.getState().setActiveTool("room");
            store.getState().addDraftPoint({ x: 0, y: 0 });
            store.getState().addDraftPoint({ x: 100, y: 0 });
            expect(store.getState().pasteClipboard()).toBe(false);
            expect(store.getState().roomDraft?.points).toHaveLength(2);
            store.getState().cancelDraft();

            store.getState().toggleCalibration();
            expect(store.getState().calibrationDraft).not.toBeNull();
            expect(store.getState().pasteClipboard()).toBe(false);
            store.getState().toggleCalibration();

            store.getState().selectRoom(BAD.id);
            store.getState().setRoomDrag({ floorId: "eg", id: BAD.id, dx: 10, dy: 0, stuckEdges: [] });
            expect(store.getState().duplicateSelection()).toBe(false);
            expect(store.getState().cutSelection()).toBe(false);
            expect(store.getState().pasteClipboard()).toBe(false);
            expect(store.getState().plan).toBe(plan);
            expect(rooms()).toHaveLength(2);
        });

        it("undo and redo leave the clipboard alone", () => {
            const { store } = setup();
            store.getState().selectShape(uuid(1));
            store.getState().copySelection();
            store.getState().pasteClipboard();
            const clip = store.getState().clipboard;
            store.getState().undo();
            expect(store.getState().clipboard).toBe(clip);
            store.getState().redo();
            expect(store.getState().clipboard).toBe(clip);
        });

        it("is not saved with the plan", () => {
            const storage = storedPlan((p) => addShape(p, "eg", rect(1), CREATED));
            const store = createAppStore(storage, { now });
            const autosave = startPlanAutosave(store, storage, { delayMs: 0 });
            store.getState().selectShape(uuid(1));
            store.getState().copySelection();
            store.getState().pasteClipboard();
            autosave.flush();
            autosave.stop();
            const saved = storage.getItem(PLAN_STORAGE_KEY) ?? "";
            expect(JSON.parse(saved).shapesByFloor.eg).toHaveLength(2);
            expect(saved).not.toContain("clipboard");
            expect(createAppStore(storage, { now }).getState().clipboard).toBeNull();
        });
    });
    describe("free walls", () => {
        /** Ground floor with „Wohnen“ (0|0)–(500|400), 15 cm walls (uuid 10), wall A (100|200)→(400|200), 10 cm (uuid 20), shape (uuid 1). */
        const A = wall(20, { x: 100, y: 200 }, { x: 400, y: 200 }, 10);
        function setup(fn = (p: Plan) => p) {
            const storage = storedPlan((p) => {
                let plan = addRoom(p, "eg", room(10, "Wohnen", rectPoints(0, 0, 500, 400)), CREATED);
                plan = addWall(plan, "eg", A, CREATED);
                return fn(addShape(plan, "eg", rect(1), CREATED));
            });
            const store = createAppStore(storage, { now });
            const steps = () => store.temporal.getState().pastStates.length;
            const walls = (floor: "eg" | "og" | "dg" = "eg") => store.getState().plan.wallsByFloor[floor];
            return { store, steps, walls };
        }

        describe("drawing (Wand zeichnen)", () => {
            it("adds a wall from the start to the end with the default thickness, selected, tool back to 'select', one undo step", () => {
                const { store, steps, walls } = setup((p) => ({ ...p, settings: { ...p.settings, defaultWallThicknessCm: 11.5 } }));
                store.getState().selectShape(uuid(1));
                store.getState().setActiveTool("wall");
                expect(store.getState().addDraftPoint({ x: 0, y: 0 })).toBe(true);
                expect(store.getState().roomDraft?.points).toEqual([{ x: 0, y: 0 }]);
                expect(steps()).toBe(0);
                expect(store.getState().addDraftPoint({ x: 0, y: 250 })).toBe(true);
                const added = walls().at(-1)!;
                expect(added).toMatchObject({ startCm: { x: 0, y: 0 }, endCm: { x: 0, y: 250 }, thicknessCm: 11.5 });
                expect(selectSelectedWall(store.getState())).toEqual(added);
                expect(store.getState().selectedShapeId).toBeNull();
                expect(store.getState().activeTool).toBe("select");
                expect(store.getState().roomDraft).toBeNull();
                expect(steps()).toBe(1);
                expect(store.getState().undo()).toBe(true);
                expect(walls()).toEqual([A]);
                expect(store.getState().redo()).toBe(true);
                expect(walls()).toHaveLength(2);
            });

            it("sets the end at a typed length „237,5“ (Wand mit Maß vom Scan)", () => {
                const { store, walls } = setup();
                store.getState().setActiveTool("wall");
                store.getState().addDraftPoint({ x: 0, y: 0 });
                store.getState().setDraftLength("237,5");
                expect(store.getState().commitDraftLength({ x: 0, y: 1 })).toBe(true);
                expect(walls().at(-1)).toMatchObject({ startCm: { x: 0, y: 0 }, endCm: { x: 0, y: 237.5 } });
            });

            it("rejects a length of 0 with a hint and adds no wall (Ungültige Länge)", () => {
                const { store, walls, steps } = setup();
                store.getState().setActiveTool("wall");
                store.getState().addDraftPoint({ x: 0, y: 0 });
                store.getState().setDraftLength("0");
                expect(store.getState().commitDraftLength({ x: 1, y: 0 })).toBe(false);
                expect(store.getState().roomDraft?.hint).toBe("length");
                expect(walls()).toEqual([A]);
                expect(steps()).toBe(0);
            });

            it("adds no wall for an end on the start (Klick auf den Startpunkt)", () => {
                const { store, walls } = setup();
                store.getState().setActiveTool("wall");
                store.getState().addDraftPoint({ x: 100, y: 100 });
                expect(store.getState().addDraftPoint({ x: 100, y: 100 })).toBe(false);
                expect(store.getState().roomDraft?.points).toEqual([{ x: 100, y: 100 }]);
                expect(walls()).toEqual([A]);
            });

            it("removes the start with Backspace and discards it with Esc and on a floor switch (Wandzeichnen korrigieren und abbrechen)", () => {
                const { store } = setup();
                store.getState().setActiveTool("wall");
                store.getState().addDraftPoint({ x: 100, y: 100 });
                store.getState().removeLastDraftPoint();
                expect(store.getState().roomDraft).toBeNull();
                expect(store.getState().activeTool).toBe("wall");
                store.getState().addDraftPoint({ x: 100, y: 100 });
                store.getState().cancelDraft();
                expect(store.getState().roomDraft).toBeNull();
                store.getState().addDraftPoint({ x: 100, y: 100 });
                store.getState().setActiveFloor("og");
                expect(store.getState().roomDraft).toBeNull();
            });

            it("does not close: Enter with an empty field adds nothing", () => {
                const { store, walls } = setup();
                store.getState().setActiveTool("wall");
                store.getState().addDraftPoint({ x: 100, y: 100 });
                expect(store.getState().closeDraft()).toBe(false);
                expect(walls()).toEqual([A]);
            });

            it("blocks undo while the start point is set", () => {
                const { store } = setup();
                store.getState().updateWall("eg", A.id, { thicknessCm: 24 });
                store.getState().setActiveTool("wall");
                store.getState().addDraftPoint({ x: 100, y: 100 });
                expect(store.getState().undo()).toBe(false);
            });

            it("is locked in calibration mode", () => {
                const { store } = setup();
                store.getState().toggleCalibration();
                expect(isToolEnabled(store.getState(), "wall")).toBe(false);
                store.getState().setActiveTool("wall");
                expect(store.getState().activeTool).toBe("select");
            });

            it("needs no room: usable on an empty floor (Leere Etage)", () => {
                const { store } = setup();
                store.getState().setActiveFloor("dg");
                expect(isToolEnabled(store.getState(), "wall")).toBe(true);
            });
        });

        describe("distance on a wall (Startpunkt einer Wand auf einer Wandlinie)", () => {
            const roomAnchor = { source: { kind: "room", roomId: uuid(10), edgeIndex: 0, face: "outer" }, fromEnd: "start" } as const;
            const wallAnchor = { source: { kind: "wall", wallId: A.id, side: "left" }, fromEnd: "start" } as const;

            it("sets the start at 260 cm on the outer side of „Wohnen“ (Abstand eintippen)", () => {
                const { store } = setup();
                store.getState().setActiveTool("wall");
                expect(store.getState().startWallOffset(roomAnchor, "260")).toBe(true);
                expect(store.getState().commitWallOffset()).toBe(true);
                expect(store.getState().roomDraft?.points).toEqual([{ x: 260, y: -15 }]);
            });

            it("measures on a side of another wall, from the other end after Tab", () => {
                const { store } = setup();
                store.getState().setActiveTool("wall");
                store.getState().startWallOffset(wallAnchor, "130");
                store.getState().toggleWallOffsetEnd();
                expect(store.getState().commitWallOffset()).toBe(true);
                expect(store.getState().roomDraft?.points).toEqual([{ x: 270, y: 205 }]);
            });

            it("rejects a distance over the length of the wall side", () => {
                const { store } = setup();
                store.getState().setActiveTool("wall");
                store.getState().startWallOffset(wallAnchor, "320");
                expect(store.getState().commitWallOffset()).toBe(false);
                expect(store.getState().roomDraft?.hint).toBe("wallTooLong");
            });

            it("does not use the sides of free walls with the tool „Raum“", () => {
                const { store } = setup();
                store.getState().setActiveTool("room");
                store.getState().startWallOffset(wallAnchor, "130");
                expect(store.getState().commitWallOffset()).toBe(false);
                expect(store.getState().roomDraft).toBeNull();
            });
        });

        describe("selection and editing", () => {
            it("selecting a wall deselects shape, room and opening and vice versa (Wand anklicken)", () => {
                const { store } = setup();
                store.getState().selectRoom(uuid(10));
                store.getState().selectWall(A.id);
                expect(store.getState().selectedRoomId).toBeNull();
                expect(selectSelectedWall(store.getState())).toEqual(A);
                store.getState().selectShape(uuid(1));
                expect(store.getState().selectedWallId).toBeNull();
                store.getState().selectWall(A.id);
                store.getState().selectShape(null);
                expect(store.getState().selectedWallId).toBeNull();
            });

            it("moving, length, thickness and deleting are one undo step each; a rejected input none", () => {
                const { store, steps, walls } = setup();
                expect(store.getState().moveWall("eg", A.id, 50, 20)).toBe(true);
                expect(walls()[0]).toMatchObject({ startCm: { x: 150, y: 220 }, endCm: { x: 450, y: 220 } });
                expect(store.getState().updateWall("eg", A.id, { endCm: { x: 400, y: 220 } })).toBe(true);
                expect(store.getState().updateWall("eg", A.id, { thicknessCm: 24 })).toBe(true);
                expect(store.getState().updateWall("eg", A.id, { thicknessCm: 150 })).toBe(false);
                expect(steps()).toBe(3);
                store.getState().selectWall(A.id);
                expect(store.getState().deleteSelectedWall()).toBe(true);
                expect(walls()).toEqual([]);
                expect(store.getState().selectedWallId).toBeNull();
                expect(steps()).toBe(4);
                expect(store.getState().plan.roomsByFloor.eg).toHaveLength(1);
                expect(store.getState().plan.shapesByFloor.eg).toHaveLength(1);
            });

            it("undo after switching floors activates the wall's floor (Ende ziehen rückgängig)", () => {
                const { store, walls } = setup();
                store.getState().updateWall("eg", A.id, { endCm: { x: 490, y: 200 } });
                store.getState().setActiveFloor("og");
                expect(store.getState().undo()).toBe(true);
                expect(store.getState().plan.activeFloorId).toBe("eg");
                expect(walls()[0].endCm).toEqual({ x: 400, y: 200 });
            });

            it("copy, cut and duplicate do nothing with a wall selected", () => {
                const { store, walls } = setup();
                store.getState().selectWall(A.id);
                expect(store.getState().copySelection()).toBe(false);
                expect(store.getState().cutSelection()).toBe(false);
                expect(store.getState().duplicateSelection()).toBe(false);
                expect(store.getState().clipboard).toBeNull();
                expect(walls()).toEqual([A]);
            });

            it("deleteSelectedWall is false without a selection", () => {
                const { store } = setup();
                expect(store.getState().deleteSelectedWall()).toBe(false);
            });
        });
    });
});
