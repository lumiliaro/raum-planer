/**
 * Room colors: the presets of the room panel and the half-transparent fill of
 * a room's area. Kept apart from the furniture presets (`style-presets.ts`):
 * the tones are stronger because the area lies half-transparent over the underlay.
 */

export interface RoomColorPreset {
    id: string;
    name: string;
    /** `null` = „Standard“ (no room color, half-transparent white). */
    color: string | null;
}

export const ROOM_COLOR_PRESETS: readonly RoomColorPreset[] = [
    { id: "standard", name: "Standard", color: null },
    { id: "gray", name: "Grau", color: "#D4D4D8" },
    { id: "blue", name: "Blau", color: "#BFDBFE" },
    { id: "green", name: "Grün", color: "#BBF7D0" },
    { id: "yellow", name: "Gelb", color: "#FEF08A" },
    { id: "orange", name: "Orange", color: "#FED7AA" },
    { id: "pink", name: "Rosa", color: "#FBCFE8" },
    { id: "violet", name: "Violett", color: "#DDD6FE" },
];

/** Opacity of every room's area, so the underlay stays visible. */
const AREA_ALPHA = 0.5;

/**
 * The preset of the room color (ignoring case, `<input type="color">` gives
 * lower case; `null` ↔ „Standard“), or `null` if none matches.
 */
export function findRoomColorPreset(color: string | null): RoomColorPreset | null {
    return (
        ROOM_COLOR_PRESETS.find((p) =>
            p.color === null || color === null ? p.color === color : p.color.toLowerCase() === color.toLowerCase(),
        ) ?? null
    );
}

/** Canvas fill of a room's area: the room color (white without one) at 50 % opacity. */
export function roomAreaFill(color: string | null): string {
    if (color === null) return `rgba(255,255,255,${AREA_ALPHA})`;
    const value = Number.parseInt(color.slice(1), 16);
    return `rgba(${(value >> 16) & 0xff},${(value >> 8) & 0xff},${value & 0xff},${AREA_ALPHA})`;
}
