import { ChevronDown, ChevronUp, Plus, Trash2, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { TextField } from "@/components/properties/TextField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { canMoveFloor, canRemoveFloor, floorHasContent, floorRemovalContent, type FloorMoveDirection } from "@/lib/plan";
import { MAX_FLOOR_NAME_LENGTH, MAX_FLOORS, type Floor, type FloorId, type Plan } from "@/lib/plan-schema";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const EMPTY_NAME_HINT = "Bitte einen Namen eingeben";
const TOO_LONG_HINT = `Höchstens ${MAX_FLOOR_NAME_LENGTH} Zeichen`;

interface FloorsDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * „Etagen“: rename, sort, delete and add floors. Every change takes effect in
 * the plan at once and is one undo step; undo works after closing.
 */
export function FloorsDialog({ open, onClose }: FloorsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent showCloseButton={false} className="gap-0 p-0 text-[13px] sm:max-w-[440px]">
                <FloorsForm />

            </DialogContent>
        </Dialog>
    );
}

/** Content of the dialog; the popup unmounts it after closing, so a pending confirmation never survives. */
function FloorsForm() {
    const plan = useAppStore((s) => s.plan);
    const addFloor = useAppStore((s) => s.addFloor);
    const removeFloor = useAppStore((s) => s.removeFloor);
    const baseId = useId();
    const [confirmingId, setConfirmingId] = useState<FloorId | null>(null);
    /** Element to focus after the next render (a moved row's button, the trash button after „Abbrechen“). */
    const pendingFocus = useRef<string | null>(null);

    useEffect(() => {
        if (pendingFocus.current === null) return;
        document.getElementById(pendingFocus.current)?.focus();
        pendingFocus.current = null;
    });

    const buttonId = (floorId: FloorId, action: string) => `${baseId}-${floorId}-${action}`;
    const addButtonId = `${baseId}-add`;
    const canAdd = plan.floors.length < MAX_FLOORS;

    const requestRemove = (floor: Floor) => {
        if (floorHasContent(plan, floor.id)) {
            setConfirmingId(floor.id);
        } else if (removeFloor(floor.id)) {
            pendingFocus.current = addButtonId;
        }
    };

    const confirmRemove = (floorId: FloorId) => {
        setConfirmingId(null);
        if (removeFloor(floorId)) pendingFocus.current = addButtonId;
    };

    const cancelRemove = (floorId: FloorId) => {
        setConfirmingId(null);
        pendingFocus.current = buttonId(floorId, "remove");
    };

    return (
        <>
            <div className="px-5 pt-5 pb-3">
                <DialogTitle className="text-base font-semibold">Etagen</DialogTitle>
            </div>
            <ul aria-label="Etagen" className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto px-5 pb-2">
                {plan.floors.map((floor, index) =>
                    confirmingId === floor.id ? (
                        <ConfirmRemoveRow
                            key={floor.id}
                            plan={plan}
                            floor={floor}
                            onConfirm={() => confirmRemove(floor.id)}
                            onCancel={() => cancelRemove(floor.id)}
                        />
                    ) : (
                        <FloorRow
                            key={floor.id}
                            plan={plan}
                            floor={floor}
                            index={index}
                            buttonId={(action) => buttonId(floor.id, action)}
                            onMoved={(direction) => (pendingFocus.current = buttonId(floor.id, direction))}
                            onRemove={() => requestRemove(floor)}
                        />
                    ),
                )}
            </ul>
            <DialogFooter className="flex-row items-center justify-between border-t px-5 py-4 sm:justify-between">
                <Button
                    id={addButtonId}
                    variant="outline"
                    aria-disabled={!canAdd || undefined}
                    title={canAdd ? undefined : `Höchstens ${MAX_FLOORS} Etagen`}
                    onClick={canAdd ? () => addFloor() : undefined}
                    // Deliberately no `disabled`: Firefox shows no tooltip on disabled buttons.
                    className={cn("text-[13px]", !canAdd && "cursor-not-allowed opacity-50 hover:bg-background")}
                >
                    <Plus aria-hidden="true" />
                    Etage hinzufügen
                </Button>
                <DialogClose render={<Button className="text-[13px]" />}>Fertig</DialogClose>
            </DialogFooter>
        </>
    );
}

interface FloorRowProps {
    plan: Plan;
    floor: Floor;
    index: number;
    buttonId: (action: string) => string;
    onMoved: (direction: FloorMoveDirection) => void;
    onRemove: () => void;
}

function FloorRow({ plan, floor, index, buttonId, onMoved, onRemove }: FloorRowProps) {
    const renameFloor = useAppStore((s) => s.renameFloor);
    const moveFloor = useAppStore((s) => s.moveFloor);
    const active = plan.activeFloorId === floor.id;
    /** Esc in a field with typed text only resets the field; the next Esc closes the dialog. */
    const escapeResetsField = useRef(false);

    const commitName = (text: string): string | null => {
        const name = text.trim();
        if (name === "") return EMPTY_NAME_HINT;
        if (name.length > MAX_FLOOR_NAME_LENGTH) return TOO_LONG_HINT;
        renameFloor(floor.id, name);
        return null;
    };

    const move = (direction: FloorMoveDirection) => {
        if (moveFloor(floor.id, direction)) onMoved(direction);
    };

    const canRemove = canRemoveFloor(plan, floor.id);

    return (
        <li className="flex items-start gap-2 py-1">
            <span className="flex h-8 w-3 shrink-0 items-center justify-center">
                {active && (
                    <>
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-selection" />
                        <span className="sr-only">Aktive Etage</span>
                    </>
                )}
            </span>
            <div
                className="min-w-0 flex-1"
                onKeyDownCapture={(e: KeyboardEvent) => {
                    const target = e.target as HTMLElement;
                    escapeResetsField.current = e.key === "Escape" && target.dataset.commitField === "dirty";
                }}
                onKeyDown={(e: KeyboardEvent) => {
                    if (escapeResetsField.current) e.stopPropagation();
                }}
            >
                <TextField label={`Name der ${index + 1}. Etage`} hideLabel value={floor.name} onCommit={commitName} />
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
                <RowButton
                    id={buttonId("up")}
                    label="Nach oben"
                    Icon={ChevronUp}
                    enabled={canMoveFloor(plan, floor.id, "up")}
                    onClick={() => move("up")}
                />
                <RowButton
                    id={buttonId("down")}
                    label="Nach unten"
                    Icon={ChevronDown}
                    enabled={canMoveFloor(plan, floor.id, "down")}
                    onClick={() => move("down")}
                />
                <RowButton
                    id={buttonId("remove")}
                    label="Löschen"
                    lockedTitle="Mindestens eine Etage muss bleiben"
                    Icon={Trash2}
                    enabled={canRemove}
                    onClick={onRemove}
                />
            </div>
        </li>
    );
}

interface RowButtonProps {
    id: string;
    label: string;
    /** Tooltip while locked; defaults to `label`. */
    lockedTitle?: string;
    Icon: LucideIcon;
    enabled: boolean;
    onClick: () => void;
}

/** Icon button; locked via `aria-disabled` so the tooltip stays (see `ToolBar`). */
function RowButton({ id, label, lockedTitle, Icon, enabled, onClick }: RowButtonProps) {
    return (
        <button
            id={id}
            type="button"
            aria-label={label}
            aria-disabled={!enabled || undefined}
            title={enabled ? label : (lockedTitle ?? label)}
            onClick={enabled ? onClick : undefined}
            className={cn(
                "inline-flex size-8 items-center justify-center rounded-md text-zinc-700 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                !enabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
            )}
        >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
    );
}

interface ConfirmRemoveRowProps {
    plan: Plan;
    floor: Floor;
    onConfirm: () => void;
    onCancel: () => void;
}

/** Inline confirmation instead of a second dialog. */
function ConfirmRemoveRow({ plan, floor, onConfirm, onCancel }: ConfirmRemoveRowProps) {
    // „mit 2 Formen und 3 Räumen“; only an underlay: „mit Vorlage“.
    const what = floorRemovalContent(plan, floor.id);

    return (
        <li
            role="group"
            aria-label={`Etage „${floor.name}“ löschen`}
            className="flex flex-col gap-2 rounded-md bg-destructive/10 px-3 py-2.5"
        >
            <p className="leading-normal text-destructive">
                Etage „{floor.name}“ mit {what} löschen?
            </p>
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="text-[13px]" autoFocus onClick={onCancel}>
                    Abbrechen
                </Button>
                <Button variant="destructive" size="sm" className="text-[13px]" onClick={onConfirm}>
                    Löschen
                </Button>
            </div>
        </li>
    );
}
