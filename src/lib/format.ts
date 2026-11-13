import type { OpeningKind } from "@/lib/plan-schema";

const percentFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });

const pxPerCmFormat = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
});

const imageCoordFormat = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

/** Non-breaking space, used as thousands separator ("1 000 cm"). */
const NBSP = " ";

/** `0.87` → `"87 %"` */
export function formatZoomPercent(scale: number): string {
    return `${percentFormat.format(Math.round(scale * 100))} %`;
}

/** `0.9986` → `"0,9986"` */
export function formatPxPerCm(value: number): string {
    return pxPerCmFormat.format(value);
}

/** Image pixels with one decimal: `1118.6` → `"1 118,6"` (non-breaking space). */
export function formatImageCoord(value: number): string {
    return imageCoordFormat
        .formatToParts(value)
        .map((part) => (part.type === "group" ? NBSP : part.value))
        .join("");
}

const oneDecimalFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

/** At most one decimal, German comma, non-breaking space for thousands, never "-0". */
function formatOneDecimal(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return oneDecimalFormat
        .formatToParts(rounded === 0 ? 0 : rounded)
        .map((part) => (part.type === "group" ? NBSP : part.value))
        .join("");
}

/** `424.5` → `"424,5 cm"`, `100` → `"100 cm"`, `1000` → `"1 000 cm"` (non-breaking space). */
export function formatCm(value: number): string {
    return `${formatOneDecimal(value)} cm`;
}

const areaFormat = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Area with two decimals: `12.5` → `"12,50 m²"`, `1234.5` → `"1 234,50 m²"` (non-breaking space). */
export function formatAreaM2(value: number): string {
    const text = areaFormat
        .formatToParts(value)
        .map((part) => (part.type === "group" ? NBSP : part.value))
        .join("");
    return `${text} m²`;
}

/** `90` → `"90°"` */
export function formatDeg(value: number): string {
    return `${formatOneDecimal(value)}°`;
}

/**
 * Rotation of an underlay, always one decimal, with a real minus sign:
 * `-1.146` → `"−1,1°"`, `0` → `"0,0°"`; never "−0,0°".
 */
export function formatDegrees(value: number): string {
    const rounded = Math.round(value * 10) / 10 || 0;
    return `${rounded < 0 ? "\u2212" : ""}${imageCoordFormat.format(Math.abs(rounded))}°`;
}

/** `1.5` → `"1,5 px"` */
export function formatPx(value: number): string {
    return `${formatOneDecimal(value)} px`;
}

const inputNumberFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1, useGrouping: false });

/** Value of an input field: at most one decimal, German comma, no thousands separator, never "-0". `1000` → `"1000"`. */
export function formatInputNumber(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return inputNumberFormat.format(rounded === 0 ? 0 : rounded);
}

/** `0` → `"0 Formen"`, `1` → `"1 Form"`, `23` → `"23 Formen"` */
export function formatShapeCount(count: number): string {
    return `${count} ${count === 1 ? "Form" : "Formen"}`;
}

/**
 * `1` → `"1 Raum"`, `8` → `"8 Räume"`; with `dative` (after „mit“) `3` → `"3 Räumen"`.
 */
export function formatRoomCount(count: number, { dative = false }: { dative?: boolean } = {}): string {
    if (count === 1) return "1 Raum";
    return `${count} ${dative ? "Räumen" : "Räume"}`;
}

/**
 * `1` → `"1 Wand"`, `4` → `"4 Wände"`; with `dative` (after „mit“) `2` → `"2 Wänden"`.
 */
export function formatWallCount(count: number, { dative = false }: { dative?: boolean } = {}): string {
    if (count === 1) return "1 Wand";
    return `${count} ${dative ? "Wänden" : "Wände"}`;
}

/** German name of an opening kind, e.g. in the panel header and in hints. */
export function openingKindName(kind: OpeningKind): string {
    switch (kind) {
        case "door":
            return "Tür";
        case "window":
            return "Fenster";
        case "passage":
            return "Durchgang";
    }
}

/**
 * `7, 4` → `"7 Türen und 4 Fenster"`, `1, 1` → `"1 Tür und 1 Fenster"`; with
 * passages `7, 4, 1` → `"7 Türen, 4 Fenster und 1 Durchgang"`,
 * `0, 0, 2` → `"0 Türen, 0 Fenster und 2 Durchgänge"`. Without passages the
 * text stays as before.
 */
export function formatOpeningCount(doors: number, windows: number, passages = 0): string {
    const doorText = `${doors} ${doors === 1 ? "Tür" : "Türen"}`;
    if (passages === 0) return `${doorText} und ${windows} Fenster`;
    return `${doorText}, ${windows} Fenster und ${passages} ${passages === 1 ? "Durchgang" : "Durchgänge"}`;
}
