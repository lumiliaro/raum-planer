/**
 * Undo and redo of plan changes with the follow-up the history needs: switch
 * to the affected floor, select the one affected shape, room or opening (a
 * step that only changed the settings keeps floor, selection and tool), keep the plan name
 * (it is not part of the history, see `resolveHistoryName`) and set
 * `updatedAt`. The follow-up runs with tracking paused, so it is no step of its own.
 */

import type { StoreApi } from "zustand";
import type { TemporalState } from "zundo";
import { resolveHistoryFocus, resolveHistoryName } from "@/lib/plan-diff";
import type { Plan } from "@/lib/plan-schema";

/** What the history records: the plan only. */
export interface HistoryEntry {
    plan: Plan;
}

export type PlanHistory = StoreApi<TemporalState<HistoryEntry>>;

/** The parts of the app store the history needs. */
interface HistoryState {
    plan: Plan;
    calibrationDraft: unknown;
    selectedShapeId: string | null;
    selectedRoomId: string | null;
    selectedOpeningId: string | null;
    selectedWallId: string | null;
    activeTool: string;
}

export interface HistoryHost<S extends HistoryState> {
    getState: () => S;
    setState: (partial: Partial<S>) => void;
    temporal: PlanHistory;
}

function step<S extends HistoryState>(store: HistoryHost<S>, now: Date, direction: "undo" | "redo"): boolean {
    const history = store.temporal.getState();
    const states = direction === "undo" ? history.pastStates : history.futureStates;
    if (store.getState().calibrationDraft || states.length === 0) return false;

    const before = store.getState().plan;
    history[direction]();
    const after = store.getState().plan;
    const focus = resolveHistoryFocus(before, after);
    const name = resolveHistoryName(before, after);
    const updatedAt = now.toISOString();

    history.pause();
    try {
        if ("keep" in focus) {
            store.setState({ plan: { ...after, name, activeFloorId: before.activeFloorId, updatedAt } } as Partial<S>);
            return true;
        }
        const { floorId, shapeId, roomId, openingId } = focus;
        store.setState({
            plan: { ...after, name, activeFloorId: floorId, updatedAt },
            selectedShapeId: shapeId,
            selectedRoomId: shapeId ? null : roomId,
            selectedOpeningId: shapeId || roomId ? null : openingId,
            selectedWallId: null,
            activeTool: "select",
        } as Partial<S>);
    } finally {
        history.resume();
    }
    return true;
}

/** Takes back the last plan change. `false` without a step or in calibration mode. */
export function undo<S extends HistoryState>(store: HistoryHost<S>, now: Date): boolean {
    return step(store, now, "undo");
}

/** Restores the last undone change. `false` without a step or in calibration mode. */
export function redo<S extends HistoryState>(store: HistoryHost<S>, now: Date): boolean {
    return step(store, now, "redo");
}
