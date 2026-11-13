import { useEffect, useRef, type RefObject } from "react";
import { snapOffHeld } from "@/lib/platform";

type ModifierState = Pick<KeyboardEvent, "altKey" | "shiftKey" | "ctrlKey" | "metaKey">;

const readAlt = (e: ModifierState) => e.altKey;
const readShift = (e: ModifierState) => e.shiftKey;
const readSnapOff = (e: ModifierState) => snapOffHeld(e);

/**
 * Whether a modifier key is currently held, kept in a ref for Konva callbacks
 * that get no event (`dragBoundFunc`, `boundBoxFunc`). `read` must be a stable function.
 */
function useModifierKeyRef(read: (e: ModifierState) => boolean): RefObject<boolean> {
    const ref = useRef(false);
    useEffect(() => {
        const update = (e: KeyboardEvent | PointerEvent) => {
            ref.current = read(e);
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
    }, [read]);
    return ref;
}

/** Alt held: the fine 1-cm grid. */
export function useAltKeyRef(): RefObject<boolean> {
    return useModifierKeyRef(readAlt);
}

/** Shift held: no snap points for openings. */
export function useShiftKeyRef(): RefObject<boolean> {
    return useModifierKeyRef(readShift);
}

/**
 * Strg, on Apple devices ⌘ held (`snapOffHeld`): no snapping to snap lines,
 * a dragged room does not stick to walls, a dragged wall end ignores guides.
 */
export function useSnapOffKeyRef(): RefObject<boolean> {
    return useModifierKeyRef(readSnapOff);
}
