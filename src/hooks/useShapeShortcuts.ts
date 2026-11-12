import Konva from "konva";
import { useEffect } from "react";
import { toolForKey } from "@/components/layout/tools";
import { isEditableTarget, isInDialog, targetOwnsUndo } from "@/hooks/isEditableTarget";
import { selectSelectedOpening, selectSelectedRoom, selectSelectedShape, useAppStore } from "@/store/app-store";

/**
 * Tool and shape shortcuts: ? opens „Hilfe“, the keys of `TOOLS` (V, R, E, L, U, C, G, T, F) choose a
 * tool, Esc cancels a tool or clears the selection, Delete/Backspace
 * remove the selected shape, room or opening, PageUp/PageDown move it in the drawing order (with
 * Shift to the top/bottom), B shows or hides the active floor's underlay, M shows or hides the
 * dimensions. Ctrl/⌘+Z undoes, Ctrl/⌘+Shift+Z and Ctrl/⌘+Y redo
 * everywhere like the header buttons – except in a text field with uncommitted
 * text (`targetOwnsUndo`) and while a shape is dragged or transformed. The
 * other keys are ignored in text fields (not on checkboxes, sliders, color
 * fields or buttons) and with Ctrl/Meta/Alt. The store decides what is allowed
 * (calibration mode, locked shape, floor without underlay, undo while a room
 * is drawn). Keys pressed inside a dialog belong to the dialog. While a room
 * is drawn, its own keys come first (`RoomDraftLayer`).
 * New keys must also be added to `components/help/shortcuts.ts`.
 */
export function useShapeShortcuts() {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // Alt is the fine-snap modifier; stop Firefox from opening the menu bar on release.
            if (e.key === "Alt") {
                e.preventDefault();
                return;
            }
            if (isInDialog(e.target)) return;
            const state = useAppStore.getState();

            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                const key = e.key.toLowerCase();
                // While typing in a field, the browser's own undo of the text stays in charge.
                if ((key !== "z" && key !== "y") || targetOwnsUndo(e.target)) return;
                e.preventDefault();
                // Replacing the plan under a shape in mid-drag would let the release write a stale shape back.
                if (Konva.isDragging() || Konva.isTransforming()) return;
                if (key === "y" || e.shiftKey) state.redo();
                else state.undo();
                return;
            }
            if (e.ctrlKey || e.metaKey || e.altKey || isEditableTarget(e.target)) return;

            // By `e.key`: Shift+ß on German, Shift+/ on US keyboards. Also while calibrating or drawing a room.
            if (e.key === "?") {
                e.preventDefault();
                state.openHelp("shortcuts");
                return;
            }

            if (e.key === "PageUp" || e.key === "PageDown") {
                const shape = selectSelectedShape(state);
                if (!shape) return;
                e.preventDefault();
                const direction = e.key === "PageUp" ? (e.shiftKey ? "front" : "forward") : e.shiftKey ? "back" : "backward";
                state.reorderShape(state.plan.activeFloorId, shape.id, direction);
                return;
            }
            if (e.key.toLowerCase() === "b") {
                const floorId = state.plan.activeFloorId;
                const underlay = state.plan.underlayByFloor[floorId];
                // In calibration mode the underlay is always shown.
                if (!underlay || state.calibrationDraft) return;
                e.preventDefault();
                state.setUnderlayVisible(floorId, !underlay.visible);
                return;
            }
            if (e.key.toLowerCase() === "m") {
                e.preventDefault();
                state.toggleDimensions();
                return;
            }
            const tool = toolForKey(e.key);
            if (tool) {
                e.preventDefault();
                state.setActiveTool(tool.id);
            } else if (e.key === "Escape") {
                if (state.activeTool !== "select") state.setActiveTool("select");
                else state.selectShape(null);
            } else if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                if (selectSelectedOpening(state)) state.deleteSelectedOpening();
                else if (selectSelectedRoom(state)) state.deleteSelectedRoom();
                else state.deleteSelectedShape();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
}
