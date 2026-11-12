import { describe, expect, it } from "vitest";
import { FACTORY_SETTINGS, type PlanSettings } from "@/lib/plan-settings";
import { applySettingsNumberField } from "@/lib/settings-fields";
import { NOT_A_NUMBER } from "@/lib/shape-fields";

const factory: PlanSettings = { ...FACTORY_SETTINGS };

describe("applySettingsNumberField (Einstellung ändern)", () => {
    it("rejects a grid of 5 cm with the range (Rasterabstand zu klein)", () => {
        expect(applySettingsNumberField(factory, "gridStepCm", "5")).toEqual({
            ok: false,
            error: "Muss zwischen 10 cm und 1\u00a0000 cm liegen",
        });
        expect(applySettingsNumberField(factory, "gridStepCm", "1001")).toMatchObject({ ok: false });
    });

    it("rejects a fine step of 10 cm with a snap step of 5 cm (Feiner Fangschritt zu groß)", () => {
        expect(applySettingsNumberField(factory, "fineSnapStepCm", "10")).toEqual({ ok: false, error: "Darf höchstens 5 cm sein" });
    });

    it("rejects a fine step below 0,1 cm", () => {
        expect(applySettingsNumberField(factory, "fineSnapStepCm", "0")).toEqual({ ok: false, error: "Muss mindestens 0,1 cm sein" });
    });

    it("rejects a snap step of 0,5 cm below the fine step of 1 cm", () => {
        expect(applySettingsNumberField(factory, "snapStepCm", "0,5")).toEqual({
            ok: false,
            error: "Muss mindestens 1 cm sein (feiner Fangschritt)",
        });
    });

    it("rejects a snap step outside 0,1 … 100 cm with the range", () => {
        expect(applySettingsNumberField(factory, "snapStepCm", "150")).toEqual({
            ok: false,
            error: "Muss zwischen 0,1 cm und 100 cm liegen",
        });
    });

    it("accepts a snap step of 2,5 cm and a fine step equal to the snap step", () => {
        expect(applySettingsNumberField(factory, "snapStepCm", "2,5")).toEqual({ ok: true, patch: { snapStepCm: 2.5 } });
        expect(applySettingsNumberField(factory, "fineSnapStepCm", "5")).toEqual({ ok: true, patch: { fineSnapStepCm: 5 } });
    });

    it("accepts a wall thickness of 11,5 cm", () => {
        expect(applySettingsNumberField(factory, "defaultWallThicknessCm", "11,5")).toEqual({
            ok: true,
            patch: { defaultWallThicknessCm: 11.5 },
        });
    });

    it("rejects a wall thickness of 0 cm and of 101 cm", () => {
        expect(applySettingsNumberField(factory, "defaultWallThicknessCm", "0")).toEqual({ ok: false, error: "Muss größer als 0 cm sein" });
        expect(applySettingsNumberField(factory, "defaultWallThicknessCm", "101")).toEqual({
            ok: false,
            error: "Darf höchstens 100 cm sein",
        });
    });

    it("rejects an opening width above 1 000 cm", () => {
        expect(applySettingsNumberField(factory, "doorWidthCm", "1200")).toEqual({ ok: false, error: "Darf höchstens 1\u00a0000 cm sein" });
        expect(applySettingsNumberField(factory, "passageWidthCm", "-1")).toEqual({ ok: false, error: "Muss größer als 0 cm sein" });
    });

    it("reads comma and point and rounds to 0,1 cm", () => {
        expect(applySettingsNumberField(factory, "doorWidthCm", "88,5")).toEqual({ ok: true, patch: { doorWidthCm: 88.5 } });
        expect(applySettingsNumberField(factory, "doorWidthCm", "88.5")).toEqual({ ok: true, patch: { doorWidthCm: 88.5 } });
        expect(applySettingsNumberField(factory, "windowWidthCm", "100,96")).toEqual({ ok: true, patch: { windowWidthCm: 101 } });
    });

    it("rejects text that is no number", () => {
        expect(applySettingsNumberField(factory, "gridStepCm", "abc")).toEqual({ ok: false, error: NOT_A_NUMBER });
        expect(applySettingsNumberField(factory, "gridStepCm", "")).toEqual({ ok: false, error: NOT_A_NUMBER });
    });

    it("gives an empty patch for the value shown unchanged", () => {
        expect(applySettingsNumberField(factory, "gridStepCm", "100")).toEqual({ ok: true, patch: {} });
    });
});
