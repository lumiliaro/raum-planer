/**
 * Settings of a plan: default values for new rooms and openings, grid, snap
 * steps and wall color. They belong to the plan (stored, exported, imported
 * with it); the factory settings are what a new plan starts with.
 */

import { z } from "zod";
import { HexColorSchema } from "@/lib/color-schema";
import { DEFAULT_WALL_THICKNESS_CM, MAX_WALL_THICKNESS_CM } from "@/lib/room-geometry";

export const MIN_GRID_STEP_CM = 10;
export const MAX_GRID_STEP_CM = 1000;
export const MIN_SNAP_STEP_CM = 0.1;
export const MAX_SNAP_STEP_CM = 100;
/** Upper limit of a default opening width in cm. */
export const MAX_DEFAULT_OPENING_WIDTH_CM = 1000;

/** One schema per key, so the import can check every value on its own. */
export const SETTING_SCHEMAS = {
    defaultWallThicknessCm: z.number().positive().max(MAX_WALL_THICKNESS_CM),
    wallColor: HexColorSchema,
    /** `null` = „Standard“ (no room color). */
    defaultRoomColor: HexColorSchema.nullable(),
    gridStepCm: z.number().min(MIN_GRID_STEP_CM).max(MAX_GRID_STEP_CM),
    snapStepCm: z.number().min(MIN_SNAP_STEP_CM).max(MAX_SNAP_STEP_CM),
    /** At most `snapStepCm`, checked by `PlanSettingsSchema`. */
    fineSnapStepCm: z.number().min(MIN_SNAP_STEP_CM),
    doorWidthCm: z.number().positive().max(MAX_DEFAULT_OPENING_WIDTH_CM),
    windowWidthCm: z.number().positive().max(MAX_DEFAULT_OPENING_WIDTH_CM),
    passageWidthCm: z.number().positive().max(MAX_DEFAULT_OPENING_WIDTH_CM),
};

export const PlanSettingsSchema = z
    .object(SETTING_SCHEMAS)
    .refine((s) => s.fineSnapStepCm <= s.snapStepCm, {
        message: "The fine snap step must not exceed the snap step",
        path: ["fineSnapStepCm"],
    });

export type PlanSettings = z.infer<typeof PlanSettingsSchema>;
export type SettingKey = keyof PlanSettings;
/** Changeable fields of the settings; the runtime check in `updateSettings` is authoritative. */
export type SettingsPatch = Partial<PlanSettings>;

/** The settings of a new plan. Frozen; copy before handing them to a plan. */
export const FACTORY_SETTINGS: Readonly<PlanSettings> = Object.freeze({
    defaultWallThicknessCm: DEFAULT_WALL_THICKNESS_CM,
    wallColor: "#3F3F46",
    defaultRoomColor: null,
    gridStepCm: 100,
    snapStepCm: 5,
    fineSnapStepCm: 1,
    doorWidthCm: 80,
    windowWidthCm: 120,
    passageWidthCm: 100,
});

/** Order of the keys as in the dialog. */
export const SETTING_KEYS = Object.keys(SETTING_SCHEMAS) as SettingKey[];

/** German names of the settings, used by the dialog and the import report. */
export const SETTING_LABELS: Readonly<Record<SettingKey, string>> = {
    defaultWallThicknessCm: "Wanddicke neuer Räume",
    wallColor: "Wandfarbe",
    defaultRoomColor: "Farbe neuer Räume",
    gridStepCm: "Rasterabstand",
    snapStepCm: "Fangschritt",
    fineSnapStepCm: "Feiner Fangschritt (Alt)",
    doorWidthCm: "Tür",
    windowWidthCm: "Fenster",
    passageWidthCm: "Durchgang",
};

/** Same value; colors ignoring case (`<input type="color">` gives lower case). */
export function sameSettingValue(a: PlanSettings[SettingKey], b: PlanSettings[SettingKey]): boolean {
    if (typeof a === "string" && typeof b === "string") return a.toLowerCase() === b.toLowerCase();
    return a === b;
}

/** All values equal. */
export function sameSettings(a: PlanSettings, b: PlanSettings): boolean {
    return SETTING_KEYS.every((key) => sameSettingValue(a[key], b[key]));
}

/** Every setting has its factory value (locks „Auf Werkseinstellungen zurücksetzen“). */
export function settingsAreFactory(settings: PlanSettings): boolean {
    return sameSettings(settings, FACTORY_SETTINGS);
}
