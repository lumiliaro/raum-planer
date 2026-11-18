/** Size of the editor's dimension texts (`DimensionText`) in screen px. */

import Konva from "konva";

/** Fixed screen size of a dimension: Inter 11 px, line 14 px high, 4 px from the edge or wall. */
export const DIMENSION_FONT_SIZE_PX = 11;
export const DIMENSION_FONT_FAMILY = "Inter Variable, sans-serif";
export const DIMENSION_HEIGHT_PX = 14;
export const DIMENSION_GAP_PX = 4;

let measurer: Konva.Text | null = null;

/** A function giving the width of a dimension text in screen px, measured once per text. */
function createMeasure(): (text: string) => number {
    const widths = new Map<string, number>();
    return (text) => {
        let width = widths.get(text);
        if (width === undefined) {
            measurer ??= new Konva.Text({ fontFamily: DIMENSION_FONT_FAMILY, fontSize: DIMENSION_FONT_SIZE_PX });
            width = measurer.measureSize(text).width;
            widths.set(text, width);
        }
        return width;
    };
}

let measure = createMeasure();
const listeners = new Set<() => void>();

/** Forgets all measured widths (they may stem from a fallback font) and tells the subscribers. */
function remeasure() {
    measure = createMeasure();
    for (const listener of listeners) listener();
}

if (typeof document !== "undefined" && document.fonts) {
    void document.fonts.ready.then(remeasure);
    document.fonts.addEventListener("loadingdone", remeasure);
}

/**
 * Calls `listener` whenever fonts have finished loading and the widths are
 * measured anew; returns the unsubscribe function. For `useSyncExternalStore`
 * with `dimensionMeasure`.
 */
export function subscribeDimensionFont(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * The current width measurement of dimension texts in screen px. It is
 * replaced by a new one (with fresh widths) once fonts have loaded.
 */
export function dimensionMeasure(): (text: string) => number {
    return measure;
}
