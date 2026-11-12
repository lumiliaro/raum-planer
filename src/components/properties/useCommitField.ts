import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

/**
 * Text state of a form field that commits on Enter or blur and resets on Esc.
 * Without a draft (not typing) and without a hint, the field shows `value`,
 * so it follows changes made on the canvas.
 *
 * `onCommit` returns a hint text when the value is rejected, otherwise `null`.
 * Committing the unchanged text does not call it.
 */
export function useCommitField(value: string, onCommit: (text: string) => string | null, readOnly: boolean) {
    const [draft, setDraftState] = useState<string | null>(null);
    // Mirrors `draft` for the blur caused by Esc, which runs before the state update.
    const draftRef = useRef<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const setDraft = (text: string | null) => {
        draftRef.current = text;
        setDraftState(text);
    };

    const reset = () => {
        setDraft(null);
        setError(null);
    };

    const commit = () => {
        const text = draftRef.current;
        if (readOnly || text === null) return;
        if (text === value) {
            reset();
            return;
        }
        const hint = onCommit(text);
        setError(hint);
        if (hint === null) setDraft(null);
    };

    return {
        error,
        inputProps: {
            value: draft ?? value,
            readOnly,
            // Read by the undo shortcut: with uncommitted text Ctrl+Z belongs to the field, otherwise to the plan.
            "data-commit-field": draft === null ? "clean" : "dirty",
            onChange: (e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value),
            onBlur: commit,
            onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    commit();
                } else if (e.key === "Escape") {
                    // Leave the field so a second Esc clears the selection as usual.
                    reset();
                    e.currentTarget.blur();
                }
            },
        },
    };
}
