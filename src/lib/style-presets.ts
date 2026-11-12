/** The furniture presets of the style guide: fill and stroke set together. */

import type { ShapeStyle } from "@/lib/plan-schema";

export interface StylePreset {
    id: string;
    name: string;
    /** `null` = outline only. */
    fill: string | null;
    stroke: string;
}

export const STYLE_PRESETS: readonly StylePreset[] = [
    { id: "gray", name: "Grau", fill: "#E4E4E7", stroke: "#52525B" },
    { id: "blue", name: "Blau", fill: "#DBEAFE", stroke: "#1E40AF" },
    { id: "violet", name: "Violett", fill: "#E9D5FF", stroke: "#6B21A8" },
    { id: "yellow", name: "Gelb", fill: "#FDE68A", stroke: "#92400E" },
    { id: "teal", name: "Türkis", fill: "#CCFBF1", stroke: "#115E59" },
    { id: "orange", name: "Orange", fill: "#FED7AA", stroke: "#9A3412" },
    { id: "green", name: "Grün", fill: "#D9F99D", stroke: "#3F6212" },
    { id: "outline", name: "Nur Rand", fill: null, stroke: "#27272A" },
];

const sameColor = (a: string | null, b: string | null) =>
    a === null || b === null ? a === b : a.toLowerCase() === b.toLowerCase();

/** The preset whose fill and stroke match (ignoring case, `<input type="color">` gives lower case), or `null`. */
export function findActivePreset(style: Pick<ShapeStyle, "fill" | "stroke">): StylePreset | null {
    return STYLE_PRESETS.find((p) => sameColor(p.fill, style.fill) && sameColor(p.stroke, style.stroke)) ?? null;
}
