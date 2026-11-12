import { describe, expect, it } from "vitest";
import { TUTORIAL_STEPS } from "@/components/tutorial/tutorial-steps";

describe("TUTORIAL_STEPS", () => {
    it("has the eleven steps in the order of the spec", () => {
        expect(TUTORIAL_STEPS.map((s) => s.title)).toEqual([
            "Willkommen",
            "Etagen",
            "Vorlage hochladen",
            "Vorlage kalibrieren",
            "Raum zeichnen",
            "Türen, Fenster und Durchgänge",
            "Möbel platzieren",
            "Eigenschaften",
            "Automatisch gespeichert",
            "Exportieren, Importieren und PDF",
            "Hilfe",
        ]);
    });

    it("has unique ids", () => {
        expect(new Set(TUTORIAL_STEPS.map((s) => s.id)).size).toBe(TUTORIAL_STEPS.length);
    });

    it("points every step but „Willkommen“ at a target, each target at most once", () => {
        expect(TUTORIAL_STEPS.filter((s) => s.target === null).map((s) => s.title)).toEqual(["Willkommen"]);
        const targets = TUTORIAL_STEPS.flatMap((s) => (s.target ? [s.target] : []));
        expect(new Set(targets).size).toBe(targets.length);
    });

    it("has no empty text", () => {
        for (const step of TUTORIAL_STEPS) {
            expect(step.text.length).toBeGreaterThan(0);
            for (const paragraph of step.text) expect(paragraph.trim()).not.toBe("");
        }
    });
});
