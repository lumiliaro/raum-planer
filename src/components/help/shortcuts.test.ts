import { describe, expect, it } from "vitest";
import { SHORTCUT_GROUPS } from "@/components/help/shortcuts";
import { TOOLS } from "@/components/layout/tools";

const group = (title: string) => {
    const found = SHORTCUT_GROUPS.find((g) => g.title === title);
    if (!found) throw new Error(`no group ${title}`);
    return found;
};

describe("SHORTCUT_GROUPS", () => {
    it("has the groups in the order of the spec", () => {
        expect(SHORTCUT_GROUPS.map((g) => g.title)).toEqual([
            "Allgemein",
            "Werkzeuge",
            "Auswahl",
            "Ansicht",
            "Beim Ziehen",
            "Raum zeichnen",
        ]);
    });

    it("lists every tool of the tool bar with its key and name under „Werkzeuge“", () => {
        expect(group("Werkzeuge").entries).toEqual(TOOLS.map((t) => ({ keys: [t.key], description: t.name })));
        expect(group("Werkzeuge").entries).toContainEqual({ keys: ["G"], description: "Raum" });
    });

    it("lists „?“ under „Allgemein“", () => {
        expect(group("Allgemein").entries).toContainEqual({ keys: ["?"], description: "Hilfe öffnen" });
    });

    it("starts „Auswahl“ with copy, cut, paste and duplicate", () => {
        expect(group("Auswahl").entries.slice(0, 4)).toEqual([
            { keys: ["Strg+C"], description: "Kopieren" },
            { keys: ["Strg+X"], description: "Ausschneiden" },
            { keys: ["Strg+V"], description: "Einfügen" },
            { keys: ["Strg+D"], description: "Duplizieren" },
        ]);
    });

    it("lists the keys while drawing a room", () => {
        expect(group("Raum zeichnen").entries).toEqual([
            { keys: ["Ziffern"], description: "Länge in cm eingeben" },
            { keys: ["Enter"], description: "Eckpunkt setzen, bei leerem Feld Umriss schließen" },
            { keys: ["Rücktaste"], description: "Zeichen bzw. letzten Eckpunkt löschen" },
            { keys: ["Umschalt"], description: "Kante ohne Einrasten auf 0°/90°/180°/270°" },
            { keys: ["Strg"], description: "Ohne Hilfslinien" },
            { keys: ["Esc"], description: "Umriss verwerfen" },
        ]);
    });

    it("shows redo with both alternatives", () => {
        expect(group("Allgemein").entries).toContainEqual({ keys: ["Strg+Umschalt+Z", "Strg+Y"], description: "Wiederholen" });
    });

    it("uses German key names", () => {
        const keys = SHORTCUT_GROUPS.flatMap((g) => g.entries.flatMap((e) => e.keys));
        for (const english of ["Ctrl", "Shift", "Del", "Delete", "Backspace", "PageUp", "PageDown", "Escape"]) {
            expect(keys.some((k) => k.split("+").includes(english))).toBe(false);
        }
        expect(keys).toEqual(expect.arrayContaining(["Entf", "Rücktaste", "Bild↑", "Bild↓", "Esc", "Umschalt"]));
    });

    it("has no key twice within a group", () => {
        for (const g of SHORTCUT_GROUPS) {
            const keys = g.entries.flatMap((e) => e.keys.map((k) => k.toLowerCase()));
            expect(new Set(keys).size, g.title).toBe(keys.length);
        }
    });

    it("has a description and at least one key for every entry", () => {
        for (const g of SHORTCUT_GROUPS) {
            for (const e of g.entries) {
                expect(e.keys.length).toBeGreaterThan(0);
                expect(e.description).not.toBe("");
            }
        }
    });
});
