/**
 * Browser-side UI preferences. Kept apart from the plan: view settings do not
 * belong in export files. The storage is passed in so tests run without a browser.
 */

export const PROPERTIES_PANEL_OPEN_KEY = "raumplaner.ui.propertiesPanelOpen";

/** `window.localStorage`, or `undefined` when unavailable or blocked. */
export function getBrowserStorage(): Storage | undefined {
    try {
        return typeof window === "undefined" ? undefined : window.localStorage;
    } catch {
        return undefined;
    }
}

export function readBoolean(storage: Storage | undefined, key: string, fallback: boolean): boolean {
    try {
        const raw = storage?.getItem(key);
        if (raw === "true") return true;
        if (raw === "false") return false;
        return fallback;
    } catch {
        return fallback;
    }
}

export function writeBoolean(storage: Storage | undefined, key: string, value: boolean): void {
    try {
        storage?.setItem(key, String(value));
    } catch {
        // Storage full or blocked: the preference is simply not remembered.
    }
}
