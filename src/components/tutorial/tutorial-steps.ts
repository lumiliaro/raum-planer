/**
 * Steps of the tutorial as plain data. Each target is found on the page by its
 * `data-tutorial` attribute; a missing or hidden target centers the bubble.
 */

export type TutorialTarget =
    | "floors"
    | "underlay"
    | "calibrate"
    | "tool-room"
    | "tool-door"
    | "tool-rect"
    | "properties"
    | "save-status"
    | "export"
    | "help";

export interface TutorialStep {
    id: string;
    title: string;
    /** One paragraph per entry. */
    text: readonly string[];
    /** `null` = centered over the canvas, nothing highlighted. */
    target: TutorialTarget | null;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
    {
        id: "welcome",
        title: "Willkommen",
        text: [
            "Mit dem Raumplaner zeichnest du deine Räume mit ihren Innenmaßen nach und stellst Möbel in echten Maßen hinein. Dieser kurze Rundgang zeigt dir die Grundfunktionen; du kannst ihn jederzeit überspringen.",
            "Die App läuft komplett in deinem Browser, ein Konto gibt es nicht. Alle Daten werden nur in diesem Browser gespeichert und nicht an einen Server geschickt. Einzelheiten findest du unter „Hilfe → Datenschutz“.",
        ],
        target: null,
    },
    {
        id: "floors",
        title: "Etagen",
        text: [
            "Hier wechselst du zwischen den Etagen. Mit dem Stift legst du Etagen an, benennst sie um, sortierst oder löschst sie.",
        ],
        target: "floors",
    },
    {
        id: "underlay",
        title: "Vorlage hochladen",
        text: [
            "Hast du einen Grundriss als Bild, lade ihn hier als Vorlage hoch. Er liegt dann unter deiner Zeichnung und lässt sich ausblenden.",
        ],
        target: "underlay",
    },
    {
        id: "calibrate",
        title: "Vorlage kalibrieren",
        text: [
            "Damit die Vorlage maßstabsgetreu liegt, klickst du zwei Punkte auf dem Bild an und gibst ihren echten Abstand in cm ein.",
        ],
        target: "calibrate",
    },
    {
        id: "room",
        title: "Raum zeichnen",
        text: [
            "Mit dem Werkzeug „Raum“ klickst du die Ecken des Raums nacheinander an. Statt zu klicken, kannst du auch eine Länge in cm eintippen und mit Enter bestätigen. Ein Klick auf den Startpunkt schließt den Umriss.",
        ],
        target: "tool-room",
    },
    {
        id: "openings",
        title: "Türen, Fenster und Durchgänge",
        text: [
            "Mit „Tür“, „Fenster“ und „Durchgang“ klickst du auf eine Raumwand, um dort eine Öffnung zu setzen. Dafür braucht die Etage mindestens einen Raum. Ein ausgewähltes Fenster oder einen Durchgang machst du an den Griffen an seinen Enden breiter oder schmaler.",
        ],
        target: "tool-door",
    },
    {
        id: "furniture",
        title: "Möbel platzieren",
        text: [
            "Wähle eine Form wie „Rechteck“ und klicke auf die Zeichenfläche, um ein Möbelstück zu setzen. Verschieben, drehen und skalieren kannst du es direkt mit der Maus.",
        ],
        target: "tool-rect",
    },
    {
        id: "properties",
        title: "Eigenschaften",
        text: [
            "Im Eigenschaften-Panel stellst du Maße, Position, Name und Farbe des ausgewählten Objekts genau ein.",
        ],
        target: "properties",
    },
    {
        id: "autosave",
        title: "Automatisch gespeichert",
        text: [
            "Jede Änderung wird automatisch in diesem Browser gespeichert. Mit „Exportieren“ erstellst du zusätzlich eine Sicherungsdatei.",
        ],
        target: "save-status",
    },
    {
        id: "file",
        title: "Exportieren, Importieren und PDF",
        text: [
            "Exportiere deinen Plan als Datei, um ihn zu sichern oder in einen anderen Browser zu übertragen, und hole ihn mit „Importieren“ zurück. Als PDF kannst du ihn drucken.",
        ],
        target: "export",
    },
    {
        id: "help",
        title: "Hilfe",
        text: [
            "Unter „Hilfe“ findest du alle Tastenkürzel und die Hinweise zum Datenschutz. Das Tutorial startest du jederzeit unter „Einstellungen“ neu.",
        ],
        target: "help",
    },
];
