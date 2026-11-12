/**
 * Reading and checking the number fields of the dialog „Einstellungen“. The
 * limits come from `plan-settings.ts`; `updateSettings` stays the final check.
 */

import { formatCm } from "@/lib/format";
import {
    MAX_DEFAULT_OPENING_WIDTH_CM,
    MAX_GRID_STEP_CM,
    MAX_SNAP_STEP_CM,
    MIN_GRID_STEP_CM,
    MIN_SNAP_STEP_CM,
    type PlanSettings,
    type SettingKey,
    type SettingsPatch,
} from "@/lib/plan-settings";
import { MAX_WALL_THICKNESS_CM } from "@/lib/room-geometry";
import { NOT_A_NUMBER, parseDecimal } from "@/lib/shape-fields";

/** Settings shown as a number field in cm. */
export type SettingNumberKey = Exclude<SettingKey, "wallColor" | "defaultRoomColor">;

export type SettingsFieldResult = { ok: true; patch: SettingsPatch } | { ok: false; error: string };

const fail = (error: string): SettingsFieldResult => ({ ok: false, error });

/** Hint for a value outside `min … max`, or `null` if it lies inside. */
function rangeError(value: number, min: number, max: number): string | null {
    return value < min || value > max ? `Muss zwischen ${formatCm(min)} und ${formatCm(max)} liegen` : null;
}

/** Hint for a value of 0 or less, or above `max`, or `null`. */
function positiveError(value: number, max: number): string | null {
    if (value <= 0) return `Muss größer als ${formatCm(0)} sein`;
    if (value > max) return `Darf höchstens ${formatCm(max)} sein`;
    return null;
}

/** The violated limit of `value` for `key`, or `null`; the snap steps are checked against each other. */
function limitError(settings: PlanSettings, key: SettingNumberKey, value: number): string | null {
    switch (key) {
        case "defaultWallThicknessCm":
            return positiveError(value, MAX_WALL_THICKNESS_CM);
        case "gridStepCm":
            return rangeError(value, MIN_GRID_STEP_CM, MAX_GRID_STEP_CM);
        case "snapStepCm":
            return (
                rangeError(value, MIN_SNAP_STEP_CM, MAX_SNAP_STEP_CM) ??
                (value < settings.fineSnapStepCm
                    ? `Muss mindestens ${formatCm(settings.fineSnapStepCm)} sein (feiner Fangschritt)`
                    : null)
            );
        case "fineSnapStepCm":
            if (value < MIN_SNAP_STEP_CM) return `Muss mindestens ${formatCm(MIN_SNAP_STEP_CM)} sein`;
            if (value > settings.snapStepCm) return `Darf höchstens ${formatCm(settings.snapStepCm)} sein`;
            return null;
        case "doorWidthCm":
        case "windowWidthCm":
        case "passageWidthCm":
            return positiveError(value, MAX_DEFAULT_OPENING_WIDTH_CM);
    }
}

/**
 * Turns the text of a number field into a patch (comma or point, rounded to
 * 0.1 cm), or an error naming the violated limit. Same value → empty patch.
 */
export function applySettingsNumberField(settings: PlanSettings, key: SettingNumberKey, text: string): SettingsFieldResult {
    const value = parseDecimal(text);
    if (value === null) return fail(NOT_A_NUMBER);
    const error = limitError(settings, key, value);
    if (error !== null) return fail(error);
    return { ok: true, patch: value === settings[key] ? {} : { [key]: value } };
}
