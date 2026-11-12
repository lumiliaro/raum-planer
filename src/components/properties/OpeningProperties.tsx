import { Trash2 } from "lucide-react";
import { useId, type ComponentType } from "react";
import { DoorIcon, PassageIcon, WindowIcon, type ShapeIconProps } from "@/components/icons/shape-icons";
import { NumberField } from "@/components/properties/NumberField";
import { PropertySection } from "@/components/properties/PropertySection";
import { openingKindName } from "@/lib/format";
import { applyOpeningLeftDistance, applyOpeningWidth, isFullEdge, toggleFullEdge } from "@/lib/opening-fields";
import { edgeFrame, hingeFromSide, leftDistanceCm, sideFromHinge, type Hand } from "@/lib/opening-geometry";
import type { Opening, OpeningKind, Room, Swing } from "@/lib/plan-schema";
import { cn } from "@/lib/utils";
import { selectSettings, useAppStore } from "@/store/app-store";

/** Fallback hint when the plan rejects a value the field checks let through. */
const REJECTED = "Wert nicht möglich";

const KIND_ICONS: Readonly<Record<OpeningKind, ComponentType<ShapeIconProps>>> = {
    door: DoorIcon,
    window: WindowIcon,
    passage: PassageIcon,
};

const SIDE_OPTIONS: readonly { value: Swing["side"]; label: string }[] = [
    { value: "inside", label: "Nach innen" },
    { value: "outside", label: "Nach außen" },
];

const HAND_OPTIONS: readonly { value: Hand; label: string }[] = [
    { value: "left", label: "Links" },
    { value: "right", label: "Rechts" },
];

/**
 * Properties of the selected door, window or passage: head with icon,
 * „Tür“/„Fenster“/„Durchgang“, the room name and „Löschen“; „Breite“ and
 * „Abstand zur linken Ecke“ (seen from inside); for doors „Aufschlag“ and
 * „Anschlag“, for windows and passages the checkbox „Ganze Kante“ (ticked
 * while the opening covers its whole edge; checking remembers width and
 * offset, unchecking restores them or falls back, see `toggleFullEdge`).
 * Every commit or choice is one undo step. Mount with `key={opening.id}` so
 * open input and hints belong to one opening.
 */
export function OpeningProperties({ room, opening }: { room: Room; opening: Opening }) {
    const floorId = useAppStore((s) => s.plan.activeFloorId);
    const updateOpening = useAppStore((s) => s.updateOpening);
    const deleteSelectedOpening = useAppStore((s) => s.deleteSelectedOpening);
    const settings = useAppStore(selectSettings);
    const fullEdgeId = useId();
    const frame = edgeFrame(room.pointsCm, opening.edgeIndex);
    const Icon = KIND_ICONS[opening.kind];

    const commit =
        (apply: typeof applyOpeningWidth) =>
        (text: string): string | null => {
            const result = apply(frame, opening, text);
            if (!result.ok) return result.error;
            if (Object.keys(result.patch).length === 0) return null;
            return updateOpening(floorId, opening.id, result.patch) ? null : REJECTED;
        };

    const setFullEdge = (checked: boolean) => {
        const patch = toggleFullEdge(frame, opening, checked, settings);
        if (patch) updateOpening(floorId, opening.id, patch);
    };

    const setSwing = (next: Swing) => {
        const { swing } = opening;
        if (swing && swing.hinge === next.hinge && swing.side === next.side) return;
        updateOpening(floorId, opening.id, { swing: next });
    };

    return (
        <div className="flex flex-col">
            <section className="flex items-center justify-between gap-2 border-b p-4">
                <div className="flex min-w-0 items-center gap-2">
                    <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                    <div className="flex min-w-0 flex-col">
                        <span className="text-[13px] font-semibold">{openingKindName(opening.kind)}</span>
                        <span className="truncate text-xs text-muted-foreground">{room.name}</span>
                    </div>
                </div>
                <button
                    type="button"
                    aria-label="Löschen"
                    title="Löschen (Entf)"
                    onClick={deleteSelectedOpening}
                    className="-my-1 inline-flex size-[30px] shrink-0 items-center justify-center rounded-md text-destructive outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </button>
            </section>
            <PropertySection title="Maße">
                <NumberField label="Breite" unit="cm" value={opening.widthCm} onCommit={commit(applyOpeningWidth)} />
                <NumberField
                    label="Abstand zur linken Ecke"
                    unit="cm"
                    value={leftDistanceCm(frame, opening)}
                    onCommit={commit(applyOpeningLeftDistance)}
                />
                <p className="text-xs text-muted-foreground">Links und rechts von innen auf die Wand gesehen.</p>
                {opening.kind !== "door" && (
                    <label
                        htmlFor={fullEdgeId}
                        className="flex items-center gap-2 self-start text-[13px]"
                        title="So breit wie die Kante, Abstand 0 cm; abhaken stellt die Maße von vorher wieder her"
                    >
                        <input
                            id={fullEdgeId}
                            type="checkbox"
                            checked={isFullEdge(frame, opening)}
                            onChange={(e) => setFullEdge(e.target.checked)}
                            className="size-4 accent-zinc-900"
                        />
                        Ganze Kante
                    </label>
                )}
            </PropertySection>
            {opening.swing && (
                <PropertySection title="Türblatt">
                    <SegmentGroup
                        label="Aufschlag"
                        options={SIDE_OPTIONS}
                        value={opening.swing.side}
                        onChange={(side) => opening.swing && setSwing({ ...opening.swing, side })}
                    />
                    <SegmentGroup
                        label="Anschlag"
                        options={HAND_OPTIONS}
                        value={sideFromHinge(opening.swing.hinge, frame)}
                        onChange={(hand) => opening.swing && setSwing({ ...opening.swing, hinge: hingeFromSide(hand, frame) })}
                    />
                </PropertySection>
            )}
        </div>
    );
}

interface SegmentGroupProps<T extends string> {
    label: string;
    options: readonly { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
}

/** Labeled row of two or more buttons; the current choice is pressed (marked). */
function SegmentGroup<T extends string>({ label, options, value, onChange }: SegmentGroupProps<T>) {
    const labelId = useId();
    return (
        <div className="flex min-w-0 flex-col gap-1">
            <span id={labelId} className="text-xs font-medium text-muted-foreground">
                {label}
            </span>
            <div role="group" aria-labelledby={labelId} className="grid grid-cols-2 gap-1.5">
                {options.map((option) => {
                    const pressed = option.value === value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={pressed}
                            onClick={() => onChange(option.value)}
                            className={cn(
                                "inline-flex h-8 items-center justify-center rounded-md border px-2 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                                pressed
                                    ? "border-[#BFDBFE] bg-selection-bg text-selection"
                                    : "border-input bg-background text-foreground hover:bg-muted",
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
