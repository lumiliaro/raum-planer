import { describe, expect, it } from "vitest";
import {
    FACTORY_SETTINGS,
    PlanSettingsSchema,
    SETTING_KEYS,
    SETTING_LABELS,
    settingsAreFactory,
    type PlanSettings,
} from "@/lib/plan-settings";

const valid = (settings: unknown) => PlanSettingsSchema.safeParse(settings).success;

describe("FACTORY_SETTINGS (Werkseinstellungen)", () => {
    it("are valid", () => {
        expect(valid(FACTORY_SETTINGS)).toBe(true);
    });

    it("have the values of the spec", () => {
        expect(FACTORY_SETTINGS).toEqual({
            defaultWallThicknessCm: 15,
            wallColor: "#3F3F46",
            defaultRoomColor: null,
            gridStepCm: 100,
            snapStepCm: 5,
            fineSnapStepCm: 1,
            doorWidthCm: 80,
            windowWidthCm: 120,
            passageWidthCm: 100,
        });
    });

    it("are frozen", () => {
        expect(Object.isFrozen(FACTORY_SETTINGS)).toBe(true);
    });
});

describe("PlanSettingsSchema (Gültige Einstellungen)", () => {
    const VALID_VALUES: PlanSettings = {
        defaultWallThicknessCm: 11.5,
        wallColor: "#3F3F46",
        defaultRoomColor: null,
        gridStepCm: 50,
        snapStepCm: 2.5,
        fineSnapStepCm: 0.5,
        doorWidthCm: 88.5,
        windowWidthCm: 101,
        passageWidthCm: 90,
    };

    it("accepts the values of „Gültige Werte“", () => {
        expect(valid(VALID_VALUES)).toBe(true);
    });

    it("rejects a fine step of 10 cm with a snap step of 5 cm (Feiner Schritt zu groß)", () => {
        expect(valid({ ...FACTORY_SETTINGS, snapStepCm: 5, fineSnapStepCm: 10 })).toBe(false);
    });

    it("accepts a fine step equal to the snap step", () => {
        expect(valid({ ...FACTORY_SETTINGS, snapStepCm: 2, fineSnapStepCm: 2 })).toBe(true);
    });

    it.each([
        ["grid 5 cm", { gridStepCm: 5 }],
        ["grid 1 001 cm", { gridStepCm: 1001 }],
        ["wall thickness 0 cm", { defaultWallThicknessCm: 0 }],
        ["wall thickness 101 cm", { defaultWallThicknessCm: 101 }],
        ["snap step 0,05 cm", { snapStepCm: 0.05, fineSnapStepCm: 0.05 }],
        ["snap step 101 cm", { snapStepCm: 101 }],
        ["fine step 0 cm", { fineSnapStepCm: 0 }],
        ["door 0 cm", { doorWidthCm: 0 }],
        ["window 1 001 cm", { windowWidthCm: 1001 }],
        ["wall color „grau“", { wallColor: "grau" }],
        ["wall color null", { wallColor: null }],
        ["room color „grün“", { defaultRoomColor: "grün" }],
    ])("rejects %s", (_name, patch) => {
        expect(valid({ ...FACTORY_SETTINGS, ...patch })).toBe(false);
    });

    it.each([
        ["grid 10 cm", { gridStepCm: 10 }],
        ["grid 1 000 cm", { gridStepCm: 1000 }],
        ["wall thickness 100 cm", { defaultWallThicknessCm: 100 }],
        ["snap step 0,1 cm", { snapStepCm: 0.1, fineSnapStepCm: 0.1 }],
        ["snap step 100 cm", { snapStepCm: 100 }],
        ["passage 1 000 cm", { passageWidthCm: 1000 }],
        ["room color green", { defaultRoomColor: "#bbf7d0" }],
    ])("accepts %s", (_name, patch) => {
        expect(valid({ ...FACTORY_SETTINGS, ...patch })).toBe(true);
    });

    it("rejects missing values", () => {
        const { gridStepCm: _g, ...rest } = FACTORY_SETTINGS;
        expect(valid(rest)).toBe(false);
    });
});

describe("SETTING_LABELS", () => {
    it("names every setting", () => {
        expect(Object.keys(SETTING_LABELS).sort()).toEqual([...SETTING_KEYS].sort());
        expect(SETTING_LABELS.gridStepCm).toBe("Rasterabstand");
    });
});

describe("settingsAreFactory", () => {
    it("is true for the factory settings", () => {
        expect(settingsAreFactory({ ...FACTORY_SETTINGS })).toBe(true);
    });

    it("ignores the case of colors", () => {
        expect(settingsAreFactory({ ...FACTORY_SETTINGS, wallColor: "#3f3f46" })).toBe(true);
    });

    it("is false as soon as one value differs", () => {
        expect(settingsAreFactory({ ...FACTORY_SETTINGS, snapStepCm: 2.5 })).toBe(false);
        expect(settingsAreFactory({ ...FACTORY_SETTINGS, defaultRoomColor: "#BBF7D0" })).toBe(false);
    });
});
