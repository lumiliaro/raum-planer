import { SquareDashed, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { LockToggle } from "@/components/properties/LockToggle";
import { NumberField } from "@/components/properties/NumberField";
import { FieldGrid, PropertySection } from "@/components/properties/PropertySection";
import { RoomColorPicker } from "@/components/properties/RoomColorPicker";
import { TextField } from "@/components/properties/TextField";
import type { Room } from "@/lib/plan-schema";
import { applyEdgeLengthField, applyRoomNameField, applyWallThicknessField } from "@/lib/room-fields";
import { edgeLengthsCm } from "@/lib/room-geometry";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

/** Fallback hint when the plan rejects a value the field checks let through. */
const REJECTED = "Wert nicht möglich";

/**
 * Properties of the selected room: head with „Raum“, lock and „Löschen“, the
 * name, „Farbe“ and „Kanten“ with one length and one wall thickness per edge.
 * A locked room shows „Kanten“ read-only and cannot be deleted; name and color
 * stay editable. Every commit is one undo step.
 * Mount with `key={room.id}` so open input and hints belong to one room.
 */
export function RoomProperties({ room }: { room: Room }) {
    const floorId = useAppStore((s) => s.plan.activeFloorId);
    const updateRoom = useAppStore((s) => s.updateRoom);
    const deleteSelectedRoom = useAppStore((s) => s.deleteSelectedRoom);

    const commitName = (text: string): string | null => {
        const result = applyRoomNameField(room, text);
        if (!result.ok) return result.error;
        if (result.value === null) return null;
        return updateRoom(floorId, room.id, { name: result.value }) ? null : REJECTED;
    };

    return (
        <div className="flex flex-col">
            <section className="flex flex-col gap-3 border-b p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <SquareDashed className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        <span className="text-xs font-medium">Raum</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <LockToggle locked={room.locked} onToggle={() => updateRoom(floorId, room.id, { locked: !room.locked })} />
                        {/* Locked via `aria-disabled`, not `disabled`, so Firefox still shows the tooltip. */}
                        <button
                            type="button"
                            aria-label="Löschen"
                            aria-disabled={room.locked || undefined}
                            title={room.locked ? "Gesperrt – zuerst entsperren" : "Löschen (Entf)"}
                            onClick={room.locked ? undefined : deleteSelectedRoom}
                            className={cn(
                                "-my-1 inline-flex size-[30px] items-center justify-center rounded-md text-destructive outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                                room.locked && "cursor-not-allowed opacity-50 hover:bg-transparent",
                            )}
                        >
                            <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        </button>
                    </div>
                </div>
                <TextField label="Name" value={room.name} onCommit={commitName} />
            </section>
            <RoomColorSection room={room} />
            <EdgesSection room={room} />
        </div>
    );
}

/**
 * „Farbe“: the room color presets and a color picker (see `RoomColorPicker`).
 * Every choice is one undo step; choosing the current color changes nothing.
 */
function RoomColorSection({ room }: { room: Room }) {
    const floorId = useAppStore((s) => s.plan.activeFloorId);
    const updateRoom = useAppStore((s) => s.updateRoom);

    return (
        <PropertySection title="Farbe">
            <RoomColorPicker
                value={room.color}
                onChoose={(color) => updateRoom(floorId, room.id, { color })}
                pickerLabel="Eigene Raumfarbe wählen"
            />
        </PropertySection>
    );
}

/**
 * „Kanten“: one row per edge with its length („Kante n“) and its wall
 * thickness („Wand“, for screen readers „Wand an Kante n“). While either field
 * of a row has the focus, its edge is highlighted on the canvas – also when the
 * room is locked and both fields are read-only.
 */
function EdgesSection({ room }: { room: Room }) {
    const floorId = useAppStore((s) => s.plan.activeFloorId);
    const updateRoom = useAppStore((s) => s.updateRoom);
    const setHighlightedEdge = useAppStore((s) => s.setHighlightedEdge);
    const lengths = edgeLengthsCm(room.pointsCm);

    // No highlight once the panel shows something else.
    useEffect(() => () => setHighlightedEdge(null), [setHighlightedEdge]);

    const commitEdge =
        (index: number) =>
        (text: string): string | null => {
            const result = applyEdgeLengthField(room, index, text);
            if (!result.ok) return result.error;
            if (result.value === null) return null;
            return updateRoom(floorId, room.id, { pointsCm: result.value }) ? null : REJECTED;
        };

    const commitWall =
        (index: number) =>
        (text: string): string | null => {
            const result = applyWallThicknessField(room, index, text);
            if (!result.ok) return result.error;
            if (result.value === null) return null;
            return updateRoom(floorId, room.id, { wallThicknessCm: result.value }) ? null : REJECTED;
        };

    return (
        <PropertySection title="Kanten">
            <FieldGrid>
                {lengths.map((length, index) => (
                    <div
                        key={index}
                        className="contents"
                        onFocus={() => setHighlightedEdge(index)}
                        onBlur={() => setHighlightedEdge(null)}
                    >
                        <NumberField
                            label={`Kante ${index + 1}`}
                            unit="cm"
                            value={length}
                            onCommit={commitEdge(index)}
                            readOnly={room.locked}
                        />
                        <NumberField
                            label="Wand"
                            accessibleLabel={`Wand an Kante ${index + 1}`}
                            unit="cm"
                            value={room.wallThicknessCm[index]}
                            onCommit={commitWall(index)}
                            readOnly={room.locked}
                        />
                    </div>
                ))}
            </FieldGrid>
        </PropertySection>
    );
}
