/** Input types that take typed text; keys there belong to the field, not to the shortcuts. */
const TEXT_INPUT_TYPES = new Set(["", "text", "search", "number", "email", "tel", "url", "password"]);

export interface TextEntryProbe {
    tagName: string;
    /** `type` of an `<input>`; missing or empty means "text". */
    type?: string | null;
    isContentEditable: boolean;
    /**
     * `data-commit-field` of a properties field (see `useCommitField`):
     * "clean" without uncommitted text, "dirty" while typing; otherwise missing.
     */
    commitField?: string | null;
}

/**
 * True for elements that take typed text: text-like inputs, text areas, selects
 * and editable content. Checkboxes, color fields, sliders and buttons are not,
 * so shortcuts still work while they have the focus. Pure, so it is testable without a DOM.
 */
export function isTextEntry({ tagName, type, isContentEditable }: TextEntryProbe): boolean {
    if (isContentEditable) return true;
    switch (tagName.toUpperCase()) {
        case "TEXTAREA":
        case "SELECT":
            return true;
        case "INPUT":
            return TEXT_INPUT_TYPES.has((type ?? "").toLowerCase());
        default:
            return false;
    }
}

/** True for text entries (see `isTextEntry`); keyboard shortcuts ignore them. */
export function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return isTextEntry({
        tagName: target.tagName,
        type: target instanceof HTMLInputElement ? target.type : null,
        isContentEditable: target.isContentEditable,
    });
}

/**
 * True if Ctrl+Z/Ctrl+Shift+Z/Ctrl+Y belong to the element itself (the
 * browser's undo of the typed text): every text entry, except a properties
 * field without uncommitted text – there the keys undo plan changes, like the buttons.
 */
export function ownsUndo(probe: TextEntryProbe): boolean {
    return isTextEntry(probe) && probe.commitField !== "clean";
}

/** `ownsUndo` for an event target. */
export function targetOwnsUndo(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return ownsUndo({
        tagName: target.tagName,
        type: target instanceof HTMLInputElement ? target.type : null,
        isContentEditable: target.isContentEditable,
        commitField: target.dataset.commitField,
    });
}

/**
 * True for elements inside an open dialog. The global shortcuts ignore them,
 * so keys pressed in a dialog never change the plan behind it.
 */
export function isInDialog(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest('[role="dialog"], [role="alertdialog"]') !== null;
}
