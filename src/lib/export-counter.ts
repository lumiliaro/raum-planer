/**
 * Version of an export, the `<n>` in `YYYY-MM-DD-<name>_<n>.json`. Starts at 1
 * per day and name and counts up with each export. It describes downloads of
 * this browser, not the plan, so it lives in the browser storage and never in
 * the plan or the export file. A copy in memory keeps counting for the session
 * when the storage is blocked or full.
 */

import { exportFileBase, localDateKey } from "@/lib/plan-export";

export const EXPORT_COUNTER_KEY = "raumplaner.ui.exportCounter";

/** Exports of one day, keyed by `exportFileBase(name)`. */
interface CounterState {
    date: string;
    counts: Record<string, number>;
}

function isCounterState(value: unknown): value is CounterState {
    if (typeof value !== "object" || value === null) return false;
    const { date, counts } = value as Record<string, unknown>;
    return (
        typeof date === "string" &&
        typeof counts === "object" &&
        counts !== null &&
        !Array.isArray(counts) &&
        Object.values(counts).every((n) => Number.isInteger(n) && (n as number) >= 0)
    );
}

function readState(storage: Storage | undefined): CounterState | null {
    try {
        const raw = storage?.getItem(EXPORT_COUNTER_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isCounterState(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function writeState(storage: Storage | undefined, state: CounterState): void {
    try {
        storage?.setItem(EXPORT_COUNTER_KEY, JSON.stringify(state));
    } catch {
        // Storage full or blocked: the session copy keeps counting.
    }
}

/** The newer of two states; on the same day the larger count per name. */
function newer(a: CounterState | null, b: CounterState | null): CounterState | null {
    if (!a || !b) return a ?? b;
    if (a.date !== b.date) return a.date > b.date ? a : b;
    const counts = { ...a.counts };
    for (const [base, n] of Object.entries(b.counts)) counts[base] = Math.max(counts[base] ?? 0, n);
    return { date: a.date, counts };
}

export interface ExportCounter {
    /** The version the next export of `planName` on `date` gets, without counting. */
    peek: (planName: string, date: Date) => number;
    /** Counts the export and returns its version. */
    take: (planName: string, date: Date) => number;
}

export function createExportCounter(storage: Storage | undefined): ExportCounter {
    let session: CounterState | null = null;

    const countsOf = (date: string): Record<string, number> => {
        const state = newer(readState(storage), session);
        return state?.date === date ? state.counts : {};
    };

    const peek = (planName: string, date: Date) => {
        const key = localDateKey(date);
        return (countsOf(key)[exportFileBase(planName)] ?? 0) + 1;
    };

    return {
        peek,
        take: (planName, date) => {
            const key = localDateKey(date);
            const base = exportFileBase(planName);
            const counts = countsOf(key);
            const version = (counts[base] ?? 0) + 1;
            session = { date: key, counts: { ...counts, [base]: version } };
            writeState(storage, session);
            return version;
        },
    };
}
