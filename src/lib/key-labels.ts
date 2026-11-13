import { IS_APPLE } from "@/lib/platform";

/** Apple symbols of the German modifier names, in Apple's order (⌥ ⇧ ⌘). */
const APPLE_MODIFIERS: readonly (readonly [name: string, symbol: string])[] = [
    ["Alt", "⌥"],
    ["Umschalt", "⇧"],
    ["Strg", "⌘"],
];

/**
 * A key or key combination written the Windows way with German names
 * („Strg+Umschalt+Z“), as shown on this device. On Apple devices Strg, Umschalt
 * and Alt become ⌘, ⇧ and ⌥, in the order ⌥ ⇧ ⌘ directly before the key
 * without „+“ („⇧⌘Z“); every other name stays. Elsewhere the text is unchanged.
 * The key „+“ itself is no separator.
 */
export function formatKeys(combo: string, apple: boolean = IS_APPLE): string {
    if (!apple) return combo;
    const parts = combo.split("+");
    // „+“ alone or a „+“ at either end is the plus key, not a separator.
    if (parts.some((part) => part === "")) return combo;
    const modifiers = APPLE_MODIFIERS.filter(([name]) => parts.includes(name)).map(([, symbol]) => symbol);
    const keys = parts.filter((part) => !APPLE_MODIFIERS.some(([name]) => name === part));
    return modifiers.join("") + keys.join("+");
}

/** An `aria-keyshortcuts` value for this device: `Control` becomes `Meta` on Apple devices. */
export function formatAriaShortcuts(value: string, apple: boolean = IS_APPLE): string {
    return apple ? value.replace(/\bControl\b/g, "Meta") : value;
}
