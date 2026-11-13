import { describe, expect, it } from "vitest";
import { formatAriaShortcuts, formatKeys } from "@/lib/key-labels";

describe("formatKeys", () => {
    it.each([
        ["Strg+Z", "⌘Z"],
        ["Strg+Umschalt+Z", "⇧⌘Z"],
        ["Strg+Y", "⌘Y"],
        ["Strg", "⌘"],
        ["Alt", "⌥"],
        ["Umschalt", "⇧"],
        ["Umschalt+Bild↑", "⇧Bild↑"],
        ["Strg+Alt+Umschalt+K", "⌥⇧⌘K"],
    ])("writes %s as %s on Apple devices", (combo, label) => {
        expect(formatKeys(combo, true)).toBe(label);
    });

    it.each(["+", "−", "0", "Bild↓", "Entf", "Rücktaste", "Esc", "Ziehen auf freier Fläche", "Mausrad"])(
        "keeps %s on Apple devices",
        (combo) => {
            expect(formatKeys(combo, true)).toBe(combo);
        },
    );

    it.each(["Strg+Z", "Strg+Umschalt+Z", "Alt", "Umschalt+Bild↑", "+"])("keeps %s elsewhere", (combo) => {
        expect(formatKeys(combo, false)).toBe(combo);
    });
});

describe("formatAriaShortcuts", () => {
    it("uses Meta instead of Control on Apple devices", () => {
        expect(formatAriaShortcuts("Control+Shift+Z Control+Y", true)).toBe("Meta+Shift+Z Meta+Y");
        expect(formatAriaShortcuts("Control+Z", true)).toBe("Meta+Z");
    });

    it("keeps values without Control and every value elsewhere", () => {
        expect(formatAriaShortcuts("Shift+PageUp", true)).toBe("Shift+PageUp");
        expect(formatAriaShortcuts("Control+Shift+Z Control+Y", false)).toBe("Control+Shift+Z Control+Y");
    });
});
