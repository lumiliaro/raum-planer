/**
 * Resizing an opening by dragging one of its ends along the edge: grid,
 * edge ends, minimum width and snap points for the dragged end. All values in
 * cm along the edge (from its start point), no React or Konva dependencies.
 */

import type { EdgeNeighbor } from "@/lib/opening-snap";
import { snapDelta } from "@/lib/snap";

/** An opening never gets narrower than this by dragging an end. */
export const MIN_OPENING_WIDTH_CM = 10;

const FIT_EPS_CM = 1e-6;

/** The dragged end: `"start"` lies at `offsetCm`, `"end"` at `offsetCm + widthCm`. */
export type ResizeSide = "start" | "end";

export type ResizeTargetKind = "corner" | "center" | "centered" | "neighbor" | "default-width";

/** A place the dragged end can snap to. */
export interface ResizeTarget {
    /** Position of the dragged end when snapped (cm from the edge's start). */
    endCm: number;
    kind: ResizeTargetKind;
    /** Where on the edge the mark is drawn (cm from the edge's start). */
    markAtCm: number;
}

/** Snap points for a resize drag: the targets (computed once at drag start) and the tolerance in cm. */
export interface ResizeSnap {
    targets: readonly ResizeTarget[];
    toleranceCm: number;
}

/** Placement after a resize drag together with the snap point it snapped to (`null` = grid). */
export interface ResizedOpening {
    offsetCm: number;
    widthCm: number;
    snap: ResizeTarget | null;
}

const KIND_ORDER: Record<ResizeTargetKind, number> = {
    corner: 0,
    center: 1,
    centered: 2,
    neighbor: 3,
    "default-width": 4,
};

/** Range the dragged end may lie in: on the edge and at least the minimum width from the fixed end. */
function endRange(lengthCm: number, fixedEndCm: number, side: ResizeSide): [number, number] {
    return side === "end" ? [fixedEndCm + MIN_OPENING_WIDTH_CM, lengthCm] : [0, fixedEndCm - MIN_OPENING_WIDTH_CM];
}

/**
 * Snap targets for the dragged end (`side`) of an opening whose other end
 * stays at `fixedEndCm`, on an edge of length `lengthCm`, next to `others`
 * (the other openings of that edge). Candidates: the edge's corner on that
 * side, both ends of every neighbor, the edge's center, the end that centers
 * the opening on the edge (`L − fixedEnd`) and the end that gives the kind's
 * default width. Only targets on the edge that keep at least
 * `MIN_OPENING_WIDTH_CM`.
 */
export function resizeTargets(
    lengthCm: number,
    fixedEndCm: number,
    side: ResizeSide,
    others: readonly EdgeNeighbor[],
    defaultWidthCm: number,
): ResizeTarget[] {
    const sign = side === "end" ? 1 : -1;
    const candidates: Array<Omit<ResizeTarget, "markAtCm">> = [
        { endCm: side === "end" ? lengthCm : 0, kind: "corner" },
        { endCm: lengthCm / 2, kind: "center" },
        { endCm: lengthCm - fixedEndCm, kind: "centered" },
    ];
    for (const o of others) {
        candidates.push({ endCm: o.offsetCm, kind: "neighbor" });
        candidates.push({ endCm: o.offsetCm + o.widthCm, kind: "neighbor" });
    }
    candidates.push({ endCm: fixedEndCm + sign * defaultWidthCm, kind: "default-width" });
    const [min, max] = endRange(lengthCm, fixedEndCm, side);
    return candidates
        .filter((t) => t.endCm >= min - FIT_EPS_CM && t.endCm <= max + FIT_EPS_CM)
        .map((t) => ({ ...t, markAtCm: t.endCm }));
}

/** The target nearest to `rawEndCm` within `toleranceCm`, or `null`; ties follow corner, center, centered, neighbor, default width. */
function nearestTarget(rawEndCm: number, targets: readonly ResizeTarget[], toleranceCm: number): ResizeTarget | null {
    let best: ResizeTarget | null = null;
    let bestDistance = Infinity;
    for (const target of targets) {
        const distance = Math.abs(rawEndCm - target.endCm);
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

/**
 * Placement after dragging the `side` end of an opening (placed at `start`)
 * by `alongDeltaCm` in edge direction. The end moves in multiples of `step`
 * relative to its start position, stops at the edge's ends and keeps the
 * opening at least `MIN_OPENING_WIDTH_CM` wide; the other end stays. With
 * `snap`, a target within its tolerance of the unrounded end wins over the
 * grid. If the minimum width does not fit, the opening stays as it was.
 */
export function resizeOpening(
    start: { offsetCm: number; widthCm: number },
    side: ResizeSide,
    alongDeltaCm: number,
    step: number,
    lengthCm: number,
    snap: ResizeSnap | null,
): ResizedOpening {
    const startEnd = side === "end" ? start.offsetCm + start.widthCm : start.offsetCm;
    const fixedEnd = side === "end" ? start.offsetCm : start.offsetCm + start.widthCm;
    const [min, max] = endRange(lengthCm, fixedEnd, side);
    if (min > max) return { offsetCm: start.offsetCm, widthCm: start.widthCm, snap: null };

    const target = snap && nearestTarget(startEnd + alongDeltaCm, snap.targets, snap.toleranceCm);
    const endCm = target
        ? Math.min(Math.max(target.endCm, min), max)
        : Math.min(Math.max(startEnd + snapDelta(alongDeltaCm, step), min), max);
    return side === "end"
        ? { offsetCm: fixedEnd, widthCm: endCm - fixedEnd, snap: target }
        : { offsetCm: endCm, widthCm: fixedEnd - endCm, snap: target };
}
