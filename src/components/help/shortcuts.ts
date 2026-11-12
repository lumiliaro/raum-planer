import { TOOLS } from "@/components/layout/tools";

export interface ShortcutEntry {
    /** Alternatives with German key names, e.g. `["Strg+Umschalt+Z", "Strg+Y"]`; shown with „oder“ between them. */
    keys: string[];
    description: string;
}

export interface ShortcutGroup {
    title: string;
    entries: ShortcutEntry[];
}

/**
 * Every keyboard shortcut of the app, as shown in „Hilfe → Tastenkürzel“.
 * This is a description, not generated from the key handlers
 * (`useShapeShortcuts`, `FloorCanvas`, `RoomDraftLayer`, the drag modifiers):
 * a new key there must be added here too. Only „Werkzeuge“ comes from `TOOLS`.
 */
export const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
    {
        title: "Allgemein",
        entries: [
            { keys: ["?"], description: "Hilfe öffnen" },
            { keys: ["Strg+Z"], description: "Rückgängig" },
            { keys: ["Strg+Umschalt+Z", "Strg+Y"], description: "Wiederholen" },
            { keys: ["Esc"], description: "Werkzeug abbrechen bzw. Auswahl aufheben" },
        ],
    },
    {
        title: "Werkzeuge",
        entries: TOOLS.map((tool) => ({ keys: [tool.key], description: tool.name })),
    },
    {
        title: "Auswahl",
        entries: [
            { keys: ["Strg+C"], description: "Kopieren" },
            { keys: ["Strg+X"], description: "Ausschneiden" },
            { keys: ["Strg+V"], description: "Einfügen" },
            { keys: ["Strg+D"], description: "Duplizieren" },
            { keys: ["Entf", "Rücktaste"], description: "Löschen" },
            { keys: ["Bild↑"], description: "Eine Ebene nach vorne" },
            { keys: ["Bild↓"], description: "Eine Ebene nach hinten" },
            { keys: ["Umschalt+Bild↑"], description: "Ganz nach vorne" },
            { keys: ["Umschalt+Bild↓"], description: "Ganz nach hinten" },
        ],
    },
    {
        title: "Ansicht",
        entries: [
            { keys: ["+"], description: "Vergrößern" },
            { keys: ["−"], description: "Verkleinern" },
            { keys: ["0"], description: "Einpassen" },
            { keys: ["Mausrad"], description: "Zoomen" },
            { keys: ["Ziehen auf freier Fläche"], description: "Ansicht verschieben" },
            { keys: ["M"], description: "Maße ein-/ausblenden" },
            { keys: ["B"], description: "Vorlage ein-/ausblenden" },
        ],
    },
    {
        title: "Beim Ziehen",
        entries: [
            { keys: ["Alt"], description: "Schritte von 1 cm statt 5 cm" },
            { keys: ["Strg"], description: "Ohne Einrasten an Formen und ohne Haften an Wänden" },
            { keys: ["Umschalt"], description: "Tür, Fenster oder Durchgang ohne Einrasten an Rastpunkten, auch beim Ziehen der Breite" },
        ],
    },
    {
        title: "Raum zeichnen",
        entries: [
            { keys: ["Ziffern"], description: "Länge in cm eingeben" },
            { keys: ["Enter"], description: "Eckpunkt setzen, bei leerem Feld Umriss schließen" },
            { keys: ["Rücktaste"], description: "Zeichen bzw. letzten Eckpunkt löschen" },
            { keys: ["Umschalt"], description: "Kante ohne Einrasten auf 0°/90°/180°/270°" },
            { keys: ["Strg"], description: "Ohne Hilfslinien" },
            { keys: ["Esc"], description: "Umriss verwerfen" },
        ],
    },
];
