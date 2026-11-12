/**
 * Snap points for openings on their edge: centered on the edge, flush with
 * either corner, or flush beside another opening of the same edge. Setting,
 * dragging and the hover mark all use these functions. All values in cm
 * along the edge (from its start point), no React or Konva dependencies.
 */

/** How close (in screen px) an opening must come to a snap point to snap; the canvas converts it to cm. */
export const SNAP_POINT_TOLERANCE_PX = 8;

const FIT_EPS_CM = 1e-6;

export type SnapKind = "center" | "corner" | "neighbor";

/** A place an opening can snap to. */
export interface SnapTarget {
    /** Offset of the opening (from the edge's start) when snapped. */
    offsetCm: number;
    kind: SnapKind;
    /** Where on the edge the mark is drawn (cm from the edge's start). */
    markAtCm: number;
}

/** Another opening on the same edge. */
export interface EdgeNeighbor {
    offsetCm: number;
    widthCm: number;
}

const KIND_ORDER: Record<SnapKind, number> = { center: 0, corner: 1, neighbor: 2 };

/**
 * Snap targets for an opening of width `widthCm` on an edge of length
 * `lengthCm`, next to `others` (the other openings of that edge, not the
 * opening itself). Only targets where the opening fits on the edge
 * (0 ≤ offset ≤ L − w). Ordered center, corners, neighbors.
 */
export function openingSnapTargets(lengthCm: number, widthCm: number, others: readonly EdgeNeighbor[]): SnapTarget[] {
    const max = lengthCm - widthCm;
    const candidates: SnapTarget[] = [
        { offsetCm: max / 2, kind: "center", markAtCm: lengthCm / 2 },
        { offsetCm: 0, kind: "corner", markAtCm: 0 },
        { offsetCm: max, kind: "corner", markAtCm: lengthCm },
    ];
    for (const o of others) {
        const after = o.offsetCm + o.widthCm;
        candidates.push({ offsetCm: after, kind: "neighbor", markAtCm: after });
        candidates.push({ offsetCm: o.offsetCm - widthCm, kind: "neighbor", markAtCm: o.offsetCm });
    }
    return candidates
        .filter((t) => t.offsetCm >= -FIT_EPS_CM && t.offsetCm <= max + FIT_EPS_CM)
        .map((t) => ({ ...t, offsetCm: Math.min(Math.max(t.offsetCm, 0), Math.max(0, max)) }));
}

/**
 * The target nearest to `rawOffsetCm` within `toleranceCm`, or `null`. On a
 * tie, center wins over corner, corner over neighbor.
 */
export function snapOpeningOffset(rawOffsetCm: number, targets: readonly SnapTarget[], toleranceCm: number): SnapTarget | null {
    let best: SnapTarget | null = null;
    let bestDistance = Infinity;
    for (const target of targets) {
        const distance = Math.abs(rawOffsetCm - target.offsetCm);
        if (distance > toleranceCm) continue;
        if (
            !best ||
            distance < bestDistance ||
            (distance === bestDistance && KIND_ORDER[target.kind] < KIND_ORDER[best.kind])
        ) {
            best = target;
            bestDistance = distance;
        }
    }
    return best;
}
