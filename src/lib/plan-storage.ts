/**
 * The plan in the browser storage: plain plan JSON (the export format) under
 * its own key, apart from the `raumplaner.ui.*` view preferences.
 * Unreadable data is never discarded silently: the raw text is backed up first.
 * A plan of an older format version is converted like an imported file, after
 * its raw text was saved under `PLAN_PRE_MIGRATION_KEY`.
 * The storage is passed in so tests run without a browser.
 */

import { createEmptyPlan } from "@/lib/plan";
import { migratePlanData } from "@/lib/plan-migration";
import { PLAN_SCHEMA_VERSION, PlanSchema, type Plan } from "@/lib/plan-schema";

export const PLAN_STORAGE_KEY = "raumplaner.plan";
export const PLAN_BACKUP_KEY = "raumplaner.plan.backup";
/** Raw text before the last conversion to a newer format version; overwritten by the next one. */
export const PLAN_PRE_MIGRATION_KEY = "raumplaner.plan.pre-migration";

/**
 * - `unavailable`: storage missing or blocked → empty plan
 * - `empty`: nothing stored → empty plan
 * - `restored`: valid plan restored
 * - `migrated`: plan of an older version converted, raw text saved under
 *   `PLAN_PRE_MIGRATION_KEY` → the converted plan; it should be saved right away
 * - `backed-up`: unreadable plan, raw text saved under `PLAN_BACKUP_KEY` → empty plan
 * - `backup-failed`: unreadable plan, or an older one, that could not be backed
 *   up → empty plan, saving must stay off
 */
export type LoadOutcome = "unavailable" | "empty" | "restored" | "migrated" | "backed-up" | "backup-failed";

/**
 * Stored underlay images may be cleaned up only after a cleanly loaded plan.
 * After a backup the saved original may still refer to images, and without
 * storage nothing is known.
 */
export function mayCleanUpImages(outcome: LoadOutcome): boolean {
    return outcome === "restored" || outcome === "migrated" || outcome === "empty";
}

export interface LoadResult {
    plan: Plan;
    outcome: LoadOutcome;
}

export function loadPlan(storage: Storage | undefined, now: Date, newId: () => string = () => crypto.randomUUID()): LoadResult {
    const emptyPlan = () => createEmptyPlan(now, newId);
    let raw: string | null;
    try {
        if (!storage) return { plan: emptyPlan(), outcome: "unavailable" };
        raw = storage.getItem(PLAN_STORAGE_KEY);
    } catch {
        return { plan: emptyPlan(), outcome: "unavailable" };
    }

    if (raw === null) return { plan: emptyPlan(), outcome: "empty" };

    const json = parseJson(raw);
    const version = isRecord(json) ? json.schemaVersion : undefined;
    const older = typeof version === "number" && Number.isInteger(version) && version >= 1 && version < PLAN_SCHEMA_VERSION;

    if (older && isRecord(json)) {
        // Without a copy of the original, old data is never overwritten.
        if (!trySetItem(storage, PLAN_PRE_MIGRATION_KEY, raw)) return { plan: emptyPlan(), outcome: "backup-failed" };
        const migrated = migrate(json, version as number);
        if (migrated) return { plan: migrated, outcome: "migrated" };
    } else {
        const parsed = PlanSchema.safeParse(json);
        if (parsed.success) return { plan: parsed.data, outcome: "restored" };
    }

    if (!trySetItem(storage, PLAN_BACKUP_KEY, raw)) return { plan: emptyPlan(), outcome: "backup-failed" };
    return { plan: emptyPlan(), outcome: "backed-up" };
}

/** Writes the plan. `false` if the storage is missing, blocked or full. */
export function savePlan(storage: Storage | undefined, plan: Plan): boolean {
    if (!storage) return false;
    return trySetItem(storage, PLAN_STORAGE_KEY, JSON.stringify(plan));
}

/** Converts to the current version, adds missing shape and room lists of the floors and checks the result. */
function migrate(data: Record<string, unknown>, fromVersion: number): Plan | null {
    let migrated: Record<string, unknown>;
    try {
        migrated = migratePlanData(data, fromVersion, PLAN_SCHEMA_VERSION);
    } catch {
        return null;
    }
    const { floors } = migrated;
    if (Array.isArray(floors)) {
        for (const key of ["shapesByFloor", "roomsByFloor"]) {
            const byFloor = migrated[key];
            if (!isRecord(byFloor)) continue;
            const filled = { ...byFloor };
            for (const floor of floors) {
                const id = isRecord(floor) ? floor.id : undefined;
                if (typeof id === "string" && !Object.hasOwn(filled, id)) filled[id] = [];
            }
            migrated = { ...migrated, [key]: filled };
        }
    }
    const parsed = PlanSchema.safeParse(migrated);
    return parsed.success ? parsed.data : null;
}

function trySetItem(storage: Storage, key: string, value: string): boolean {
    try {
        storage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}
