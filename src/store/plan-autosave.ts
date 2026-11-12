/**
 * Saves the plan to the browser storage shortly after each change. Reacts only
 * to a new `plan` reference, so UI state (panel, viewports, calibration draft)
 * never triggers a save. Never writes while `saveStatus` is "suspended".
 */

import type { StoreApi } from "zustand";
import { savePlan } from "@/lib/plan-storage";
import type { AppState } from "@/store/app-store";

export const AUTOSAVE_DELAY_MS = 300;

export interface PlanAutosave {
    /** Saves a pending change immediately (e.g. when the page is hidden or closed). */
    flush: () => void;
    /** Ends the subscription and drops a pending save. */
    stop: () => void;
}

export function startPlanAutosave(
    store: Pick<StoreApi<AppState>, "getState" | "subscribe">,
    storage: Storage | undefined,
    { delayMs = AUTOSAVE_DELAY_MS }: { delayMs?: number } = {},
): PlanAutosave {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const save = () => {
        clearTimeout(timer);
        timer = undefined;
        const { plan, saveStatus, setSaveStatus } = store.getState();
        if (saveStatus === "suspended") return;
        const status = savePlan(storage, plan) ? "saved" : "failed";
        if (status !== saveStatus) setSaveStatus(status);
    };

    const unsubscribe = store.subscribe((state, prev) => {
        if (state.plan === prev.plan || state.saveStatus === "suspended") return;
        clearTimeout(timer);
        timer = setTimeout(save, delayMs);
    });

    return {
        flush: () => {
            if (timer !== undefined) save();
        },
        stop: () => {
            unsubscribe();
            clearTimeout(timer);
            timer = undefined;
        },
    };
}
