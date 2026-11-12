import { describe, expect, it } from "vitest";
import { TOOLS, toolForKey, toolTooltip } from "@/components/layout/tools";

const tool = (id: string) => {
    const entry = TOOLS.find((t) => t.id === id);
    if (!entry) throw new Error(`no tool ${id}`);
    return entry;
};

describe("TOOLS", () => {
    it("lists only L-Form, U-Form and Ecke below Ellipse, then „Raum“, „Tür“, „Fenster“ and „Durchgang“", () => {
        expect(TOOLS.map((t) => t.name)).toEqual([
            "Auswählen",
            "Rechteck",
            "Ellipse",
            "L-Form",
            "U-Form",
            "Ecke",
            "Raum",
            "Tür",
            "Fenster",
            "Durchgang",
        ]);
        expect(TOOLS.map((t) => t.id)).not.toContain("door-swing");
        expect(TOOLS.filter((t) => t.requires === "room").map((t) => t.id)).toEqual(["door-opening", "window", "passage"]);
        expect(TOOLS.filter((t) => t.divider).map((t) => t.id)).toEqual(["rect", "room"]);
    });

    it("shows German tooltips with the shortcut, never a hint about calibration", () => {
        expect(toolTooltip(tool("l-shape"))).toBe("L-Form – Ecksofa, Eckküche (L)");
        expect(toolTooltip(tool("u-shape"))).toBe("U-Form – U-Küche (U)");
        expect(toolTooltip(tool("corner"))).toBe("Ecke – Eckdusche, Eckregal (C)");
        expect(toolTooltip(tool("door-opening"))).toBe("Tür – in der Raumwand (T)");
        expect(toolTooltip(tool("window"))).toBe("Fenster (F)");
        expect(toolTooltip(tool("passage"))).toBe("Durchgang – offene Wand (D)");
        expect(toolTooltip(tool("rect"))).toBe("Rechteck – Schrank, Bett, Tisch (R)");
        expect(toolTooltip(tool("select"))).toBe("Auswählen (V)");
        expect(toolTooltip(tool("room"))).toBe("Raum – Innenmaße nachzeichnen (G)");
    });

    it("finds tools by key, ignoring case", () => {
        expect(toolForKey("U")?.id).toBe("u-shape");
        expect(toolForKey("l")?.id).toBe("l-shape");
        expect(toolForKey("c")?.id).toBe("corner");
        expect(toolForKey("t")?.id).toBe("door-opening");
        expect(toolForKey("F")?.id).toBe("window");
        expect(toolForKey("d")?.id).toBe("passage");
        expect(toolForKey("D")?.id).toBe("passage");
        expect(toolForKey("g")?.id).toBe("room");
        expect(toolForKey("G")?.id).toBe("room");
        expect(toolForKey("x")).toBeUndefined();
    });

    it("names the missing room in the tooltip of „Tür“, „Fenster“ and „Durchgang“ only", () => {
        expect(toolTooltip(tool("door-opening"), { hasRoom: false })).toBe("Tür – zuerst einen Raum zeichnen");
        expect(toolTooltip(tool("window"), { hasRoom: false })).toBe("Fenster – zuerst einen Raum zeichnen");
        expect(toolTooltip(tool("passage"), { hasRoom: false })).toBe("Durchgang – zuerst einen Raum zeichnen");
        expect(toolTooltip(tool("rect"), { hasRoom: false })).toBe("Rechteck – Schrank, Bett, Tisch (R)");
        expect(toolTooltip(tool("window"), { hasRoom: true })).toBe("Fenster (F)");
    });
});
