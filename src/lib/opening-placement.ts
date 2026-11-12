/**
 * Placing openings: which room edge a click hits, a new opening with default
 * sizes at the click, and moving an opening along its edge. All values in cm.
 */

import { edgeFrame, type EdgeFrame } from "@/lib/opening-geometry";
import { openingSnapTargets, snapOpeningOffset, type EdgeNeighbor, type SnapTarget } from "@/lib/opening-snap";
import type { Opening, OpeningKind, PointCm, Room } from "@/lib/plan-schema";
import { FACTORY_SETTINGS, type PlanSettings } from "@/lib/plan-settings";
import { snapDelta } from "@/lib/snap";

/** Factory default widths; the plan's settings decide (see `OpeningWidths`). */
export const DEFAULT_DOOR_WIDTH_CM = FACTORY_SETTINGS.doorWidthCm;
export const DEFAULT_WINDOW_WIDTH_CM = FACTORY_SETTINGS.windowWidthCm;
export const DEFAULT_PASSAGE_WIDTH_CM = FACTORY_SETTINGS.passageWidthCm;

/** The default widths of new openings, from the plan's settings. */
export type OpeningWidths = Pick<PlanSettings, "doorWidthCm" | "windowWidthCm" | "passageWidthCm">;
/** How close beside an edge a click still counts, in screen px; the canvas converts it to cm. */
export const EDGE_HIT_TOLERANCE_PX = 10;

/** The edge a click hit: room, edge and the click projected onto the edge (cm from its start). */
export interface EdgeHit {
    roomId: string;
    edgeIndex: number;
    tCm: number;
}

/**
 * The room edge nearest to `point`, or `null`. A click counts if it lies in an
 * edge's wall band (0 to the edge's wall thickness outside, within the edge's length)
 * or closer than `toleranceCm` to the edge on either side. The smallest distance
 * wins; `tCm` is clamped to the edge.
 */
export function nearestRoomEdge(rooms: readonly Room[], point: PointCm, toleranceCm: number): EdgeHit | null {
    let best: (EdgeHit & { distance: number }) | null = null;
    for (const room of rooms) {
        for (let edgeIndex = 0; edgeIndex < room.pointsCm.length; edgeIndex++) {
            const frame = edgeFrame(room.pointsCm, edgeIndex);
            const rx = point.x - frame.start.x;
            const ry = point.y - frame.start.y;
            const along = rx * frame.dir.x + ry * frame.dir.y;
            const depth = rx * frame.outward.x + ry * frame.outward.y;
            const tCm = Math.min(Math.max(along, 0), frame.lengthCm);
            const distance = Math.hypot(point.x - (frame.start.x + frame.dir.x * tCm), point.y - (frame.start.y + frame.dir.y * tCm));
            const inBand =
                along >= 0 && along <= frame.lengthCm && depth >= 0 && depth <= room.wallThicknessCm[edgeIndex];
            if (!inBand && !(distance < toleranceCm)) continue;
            if (!best || distance < best.distance) best = { roomId: room.id, edgeIndex, tCm, distance };
        }
    }
    return best && { roomId: best.roomId, edgeIndex: best.edgeIndex, tCm: best.tCm };
}

/** The default width of a new opening of `kind` from `widths` (the plan's settings). */
export function defaultOpeningWidthCm(kind: OpeningKind, widths: OpeningWidths): number {
    switch (kind) {
        case "door":
            return widths.doorWidthCm;
        case "window":
            return widths.windowWidthCm;
        case "passage":
            return widths.passageWidthCm;
    }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Width of a new opening of `kind` on an edge of `lengthCm`: the default, at most the edge's length. */
export function newOpeningWidthCm(kind: OpeningKind, lengthCm: number, widths: OpeningWidths): number {
    return Math.min(defaultOpeningWidthCm(kind, widths), lengthCm);
}

/**
 * The snap point a new opening of `kind`, centered at `tCm` on the edge with
 * frame `frame`, snaps to, or `null`. `others` are the openings already on
 * that edge. Compares the unrounded, unclamped offset `tCm − w/2`.
 */
export function newOpeningSnap(
    kind: OpeningKind,
    frame: EdgeFrame,
    tCm: number,
    others: readonly EdgeNeighbor[],
    toleranceCm: number,
    widths: OpeningWidths,
): SnapTarget | null {
    const widthCm = newOpeningWidthCm(kind, frame.lengthCm, widths);
    return snapOpeningOffset(tCm - widthCm / 2, openingSnapTargets(frame.lengthCm, widthCm, others), toleranceCm);
}

/**
 * A new opening on edge `edgeIndex` (with frame `frame`), centered at `tCm`
 * rounded to whole cm, pushed onto the edge, with the default width from
 * `widths` but at most as wide as the edge.
 * With a `snap` target (from `newOpeningSnap`) it lies exactly there instead.
 * A door hinges on the left (seen from inside) and opens inwards; windows
 * and passages have no swing.
 */
export function createOpening(
    kind: OpeningKind,
    edgeIndex: number,
    frame: EdgeFrame,
    tCm: number,
    id: string,
    widths: OpeningWidths,
    snap: SnapTarget | null = null,
): Opening {
    const widthCm = newOpeningWidthCm(kind, frame.lengthCm, widths);
    const offsetCm = snap ? snap.offsetCm : clamp(Math.round(tCm) - widthCm / 2, 0, frame.lengthCm - widthCm);
    return {
        id,
        kind,
        edgeIndex,
        offsetCm,
        widthCm,
        swing: kind === "door" ? { hinge: frame.leftEnd, side: "inside" } : null,
        beforeFullEdge: null,
    };
}

/** Snap points for a drag: the targets (computed once at drag start) and the tolerance in cm. */
export interface DragSnap {
    targets: readonly SnapTarget[];
    toleranceCm: number;
}

/** Offset after a drag together with the snap point it snapped to (`null` = grid). */
export interface SnappedOffset {
    offsetCm: number;
    snap: SnapTarget | null;
}

/**
 * Offset after dragging by `alongDeltaCm` in edge direction: the move snaps to
 * multiples of `step` relative to `startOffset` and stops at the edge's ends.
 * With `snap`, a snap point within its tolerance of `startOffset + alongDeltaCm`
 * wins over the grid; the result then also names the target.
 */
export function dragOffset(startOffset: number, alongDeltaCm: number, step: number, lengthCm: number, widthCm: number): number;
export function dragOffset(
    startOffset: number,
    alongDeltaCm: number,
    step: number,
    lengthCm: number,
    widthCm: number,
    snap: DragSnap | null,
): SnappedOffset;
export function dragOffset(
    startOffset: number,
    alongDeltaCm: number,
    step: number,
    lengthCm: number,
    widthCm: number,
    snap?: DragSnap | null,
): number | SnappedOffset {
    const gridOffset = clamp(startOffset + snapDelta(alongDeltaCm, step), 0, Math.max(0, lengthCm - widthCm));
    if (snap === undefined) return gridOffset;
    const target = snap && snapOpeningOffset(startOffset + alongDeltaCm, snap.targets, snap.toleranceCm);
    return target ? { offsetCm: target.offsetCm, snap: target } : { offsetCm: gridOffset, snap: null };
}
