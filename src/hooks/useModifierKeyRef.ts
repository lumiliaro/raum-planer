import { useEffect, useRef, type RefObject } from "react";

type ModifierKey = "altKey" | "shiftKey" | "ctrlKey";

/**
 * Whether a modifier key is currently held, kept in a ref for Konva callbacks
 * that get no event (`dragBoundFunc`, `boundBoxFunc`).
 */
function useModifierKeyRef(key: ModifierKey): RefObject<boolean> {
    const ref = useRef(false);
    useEffect(() => {
        const update = (e: KeyboardEvent | PointerEvent) => {
            ref.current = e[key];
        };
        const reset = () => {
            ref.current = false;
        };
        window.addEventListener("keydown", update);
        window.addEventListener("keyup", update);
        window.addEventListener("pointermove", update);
        window.addEventListener("blur", reset);
        return () => {
            window.removeEventListener("keydown", update);
            window.removeEventListener("keyup", update);
            window.removeEventListener("pointermove", update);
            window.removeEventListener("blur", reset);
        };
    }, [key]);
    return ref;
}

/** Alt held: the fine 1-cm grid. */
export function useAltKeyRef(): RefObject<boolean> {
    return useModifierKeyRef("altKey");
}

/** Shift held: no snap points for openings. */
export function useShiftKeyRef(): RefObject<boolean> {
    return useModifierKeyRef("shiftKey");
}

/** Ctrl held: a dragged room does not stick to walls. */
export function useCtrlKeyRef(): RefObject<boolean> {
    return useModifierKeyRef("ctrlKey");
}
