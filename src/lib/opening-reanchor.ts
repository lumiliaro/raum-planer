/**
 * Keeps openings in place on the floor plan when a room's corners change
 * without changing their number (edge length, moving the room).
 */

import { edgeLengthCm, OPENING_FIT_EPS_CM, openingMisfit } from "@/lib/opening-geometry";
import type { Opening, OpeningKind, PointCm } from "@/lib/plan-schema";

export type ReanchorResult = { ok: true; openings: Opening[] } | { ok: false; edgeIndex: number; kind: OpeningKind };

const EPS = 1e-6;

const sameMove = (a: PointCm, b: PointCm) => Math.abs(a.x - b.x) <= EPS && Math.abs(a.y - b.y) <= EPS;
const isZero = (v: PointCm) => Math.abs(v.x) <= EPS && Math.abs(v.y) <= EPS;
const minus = (a: PointCm, b: PointCm): PointCm => ({ x: a.x - b.x, y: a.y - b.y });

/**
 * Openings of a room after its corners changed from `before` to `after`. On an
 * edge whose start moved while its end stayed, an opening keeps its distance to
 * the end; otherwise (both ends moved alike, only the end moved, nothing moved)
 * it keeps its distance to the start. Fails for the lowest edge on which an
 * opening no longer fits, naming that opening's kind. Unchanged openings stay
 * the same objects. A changed number of corners leaves the openings as they are.
 */
export function reanchorOpenings(before: readonly PointCm[], after: readonly PointCm[], openings: readonly Opening[]): ReanchorResult {
    if (before.length !== after.length) return { ok: true, openings: [...openings] };
    const n = after.length;
    const next = openings.map((opening) => {
        const i = opening.edgeIndex;
        if (i < 0 || i >= n) return opening;
        const ds = minus(after[i], before[i]);
        const de = minus(after[(i + 1) % n], before[(i + 1) % n]);
        if (sameMove(ds, de) || !isZero(de) || isZero(ds)) return opening;
        const lengthBefore = edgeLengthCm(before, i)!;
        const lengthAfter = edgeLengthCm(after, i)!;
        let offsetCm = lengthAfter - (lengthBefore - opening.offsetCm);
        if (offsetCm < 0 && offsetCm >= -OPENING_FIT_EPS_CM) offsetCm = 0;
        return offsetCm === opening.offsetCm ? opening : { ...opening, offsetCm };
    });
    const misfits = next.filter((o) => openingMisfit(after, o) !== null);
    if (misfits.length > 0) {
        const first = misfits.reduce((a, b) => (b.edgeIndex < a.edgeIndex ? b : a));
        return { ok: false, edgeIndex: first.edgeIndex, kind: first.kind };
    }
    return { ok: true, openings: next };
}
