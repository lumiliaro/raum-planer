import { Circle, MousePointer2, Square, SquareDashed } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { CornerIcon, DoorIcon, LShapeIcon, PassageIcon, UShapeIcon, WindowIcon } from "@/components/icons/shape-icons";
import type { ActiveTool } from "@/store/app-store";

export interface ToolEntry {
    id: ActiveTool;
    /** Short name, also the accessible name. */
    name: string;
    /** Examples shown in the tooltip after the name. */
    hint?: string;
    /** Tooltip text before the key, instead of "name – hint". */
    tooltip?: string;
    /** Keyboard shortcut (case-insensitive). */
    key: string;
    /** A lucide icon or one of `shape-icons`. */
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    /** The tool bar draws a divider line above this tool. */
    divider?: true;
    /** The tool needs a room on the active floor (see `isToolEnabled`). */
    requires?: "room";
}

/** Tool registry, top of the tool bar. A new shape kind adds one entry. */
export const TOOLS: readonly ToolEntry[] = [
    { id: "select", name: "Auswählen", key: "V", icon: MousePointer2 },
    { id: "rect", name: "Rechteck", hint: "Schrank, Bett, Tisch", key: "R", icon: Square, divider: true },
    { id: "ellipse", name: "Ellipse", hint: "runder Tisch", key: "E", icon: Circle },
    { id: "l-shape", name: "L-Form", hint: "Ecksofa, Eckküche", key: "L", icon: LShapeIcon },
    { id: "u-shape", name: "U-Form", hint: "U-Küche", key: "U", icon: UShapeIcon },
    { id: "corner", name: "Ecke", hint: "Eckdusche, Eckregal", key: "C", icon: CornerIcon },
    { id: "room", name: "Raum", hint: "Innenmaße nachzeichnen", key: "G", icon: SquareDashed, divider: true },
    { id: "door-opening", name: "Tür", hint: "in der Raumwand", key: "T", icon: DoorIcon, requires: "room" },
    { id: "window", name: "Fenster", key: "F", icon: WindowIcon, requires: "room" },
    { id: "passage", name: "Durchgang", hint: "offene Wand", key: "D", icon: PassageIcon, requires: "room" },
];

/** The tool for a pressed key (case-insensitive), or `undefined`. */
export function toolForKey(key: string): ToolEntry | undefined {
    return TOOLS.find((t) => t.key.toLowerCase() === key.toLowerCase());
}

/**
 * Tooltip, e.g. "Rechteck – Schrank, Bett, Tisch (R)". A tool that needs a
 * room, while the active floor has none: "Tür – zuerst einen Raum zeichnen".
 */
export function toolTooltip(tool: ToolEntry, { hasRoom = true }: { hasRoom?: boolean } = {}): string {
    if (tool.requires === "room" && !hasRoom) return `${tool.name} – zuerst einen Raum zeichnen`;
    const text = tool.tooltip ?? (tool.hint ? `${tool.name} – ${tool.hint}` : tool.name);
    return `${text} (${tool.key})`;
}
