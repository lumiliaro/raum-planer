/**
 * Turns the first Zod issue of a rejected shape, calibration or underlay (for
 * a room or an opening: the most telling one) into a short German reason for
 * the import report, e.g. „Breite fehlt“ or „Maßstab ungültig“.
 */

import type { z } from "zod";

/** Display names of the checked fields, keyed by the dotted path without array indices. */
const FIELD_LABELS: Record<string, string> = {
    widthCm: "Breite",
    depthCm: "Tiefe",
    cornerRadiusCm: "Eckradius",
    legAWidthCm: "Schenkel A",
    legBWidthCm: "Schenkel B",
    baseWidthCm: "Basis",
    sideWidthCm: "Seiten",
    pointsCm: "Punkte",
    x: "X-Position",
    y: "Y-Position",
    rotationDeg: "Drehung",
    mirrored: "Spiegelung",
    "style.fill": "Füllfarbe",
    "style.stroke": "Randfarbe",
    "style.strokeWidth": "Randstärke",
    "style.opacity": "Deckkraft",
    label: "Beschriftung",
    locked: "Sperre",
    id: "ID",
    p1: "Punkt 1",
    p2: "Punkt 2",
    realLengthCm: "Reale Länge",
    pxPerCm: "Maßstab",
};

/** Display names of the fields of an underlay (`calibration.*` is described by `CALIBRATION_LABELS`). */
const UNDERLAY_LABELS: Record<string, string> = {
    imageId: "Bild-Kennung",
    imageWidthPx: "Bildbreite",
    imageHeightPx: "Bildhöhe",
    calibration: "Kalibrierung",
    visible: "Sichtbar",
    opacity: "Deckkraft",
};

export const GENERIC_REASON = "Angaben ungültig";

type IssuePath = readonly PropertyKey[];

function valueAt(raw: unknown, path: IssuePath): unknown {
    let value = raw;
    for (const key of path) {
        if (typeof value !== "object" || value === null) return undefined;
        value = (value as Record<PropertyKey, unknown>)[key];
    }
    return value;
}

/**
 * Finds the longest prefix of `path` that names a known field, so
 * `["pointsCm", 0, "y"]` → Punkte and `["p2", "x"]` → Punkt 2.
 */
function findField(path: IssuePath, labels: Record<string, string>): { label: string; path: IssuePath } | null {
    for (let length = path.length; length > 0; length--) {
        const prefix = path.slice(0, length);
        const key = prefix.filter((part) => typeof part === "string").join(".");
        if (prefix.every((part) => typeof part !== "symbol") && Object.hasOwn(labels, key)) {
            return { label: labels[key], path: prefix };
        }
    }
    return null;
}

function describeFieldIssue(
    issue: z.core.$ZodIssue | undefined,
    raw: unknown,
    labels: Record<string, string> = FIELD_LABELS,
): string {
    const field = issue && findField(issue.path, labels);
    if (!field) return GENERIC_REASON;
    return `${field.label} ${valueAt(raw, field.path) === undefined ? "fehlt" : "ungültig"}`;
}

/** Reason for a shape rejected by `ShapeSchema`; `rawShape` is the shape as read from the file. */
export function describeShapeIssue(error: z.ZodError, rawShape: unknown): string {
    const issue = error.issues[0];
    if (issue?.code === "invalid_union" && issue.path.length === 1 && issue.path[0] === "kind") {
        const kind = valueAt(rawShape, ["kind"]);
        return kind === undefined ? "Formtyp fehlt" : `Formtyp „${String(kind)}“ unbekannt`;
    }
    return describeFieldIssue(issue, rawShape);
}

/** Reason for a calibration rejected by `CalibrationSchema`; `rawCalibration` as read from the file. */
export function describeCalibrationIssue(error: z.ZodError, rawCalibration: unknown): string {
    return describeFieldIssue(error.issues[0], rawCalibration);
}

/**
 * Reason for an underlay rejected by `UnderlaySchema`, e.g. „Deckkraft ungültig“;
 * `rawUnderlay` as read from the file. A missing image size is reported at the width.
 */
export function describeUnderlayIssue(error: z.ZodError, rawUnderlay: unknown): string {
    return describeFieldIssue(error.issues[0], rawUnderlay, UNDERLAY_LABELS);
}

/** Messages of the outline checks in `RoomSchema`. */
const ROOM_OUTLINE_REASONS: Record<string, string> = {
    "Edge of 0 cm": "Kante mit 0 cm",
    "Outline intersects itself": "Umriss überschneidet sich",
};

/**
 * Reason for a room rejected by `RoomSchema`; `rawRoom` as read from the file.
 * The name comes first, then the number of corners, a broken corner, and only
 * then the outline checks (which may also fail as a consequence).
 */
export function describeRoomIssue(error: z.ZodError, rawRoom: unknown): string {
    const issues = error.issues;
    const at = (key: string) => issues.filter((issue) => issue.path[0] === key);
    if (at("name").length > 0) return valueAt(rawRoom, ["name"]) === undefined ? "Name fehlt" : "Name ungültig";
    const points = at("pointsCm");
    const rawPoints = valueAt(rawRoom, ["pointsCm"]);
    const tooFew = points.some(
        (issue) => issue.path.length === 1 && (issue.code === "too_small" || rawPoints === undefined),
    );
    if (tooFew) return "Weniger als 3 Eckpunkte";
    if (points.some((issue) => issue.path.length > 1)) return "Eckpunkt ungültig";
    for (const issue of points) {
        if (issue.code === "custom" && Object.hasOwn(ROOM_OUTLINE_REASONS, issue.message)) {
            return ROOM_OUTLINE_REASONS[issue.message];
        }
    }
    return GENERIC_REASON;
}

/** Messages of the fit checks of openings in `RoomSchema`. */
const OPENING_FIT_REASONS: Record<string, string> = {
    "Unknown edge": "Kante unbekannt",
    "Does not fit on the edge": "passt nicht auf die Kante",
};

/**
 * Reason for an opening rejected by `OpeningSchema`, or by `RoomSchema` for a
 * room with only this opening (then the issue paths start with
 * `openings, 0`); `rawOpening` as read from the file. Checked in this order:
 * kind, edge, width, offset, swing, fit on the edge.
 */
export function describeOpeningIssue(error: z.ZodError, rawOpening: unknown): string {
    const issues = error.issues.map((issue) =>
        issue.path[0] === "openings" ? { ...issue, path: issue.path.slice(2) } : issue,
    );
    if (typeof rawOpening !== "object" || rawOpening === null || Array.isArray(rawOpening)) return GENERIC_REASON;
    const at = (key: string) => issues.filter((issue) => issue.path[0] === key);
    if (at("kind").length > 0) return "Art unbekannt";
    if (at("edgeIndex").length > 0) return "Kante unbekannt";
    if (at("widthCm").length > 0) return "Breite ungültig";
    const offset = at("offsetCm");
    if (offset.some((issue) => issue.code !== "custom")) return "Abstand ungültig";
    if (at("swing").length > 0) {
        const kind = valueAt(rawOpening, ["kind"]);
        const swing = valueAt(rawOpening, ["swing"]);
        // A door without swing lacks one; any swing of a window or passage (no door) is invalid.
        return kind === "door" && (swing === undefined || swing === null) ? "Aufschlag fehlt" : "Aufschlag ungültig";
    }
    for (const issue of offset) {
        if (Object.hasOwn(OPENING_FIT_REASONS, issue.message)) return OPENING_FIT_REASONS[issue.message];
    }
    return GENERIC_REASON;
}
