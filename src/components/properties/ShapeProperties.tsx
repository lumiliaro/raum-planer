import { Circle, Shapes, Square, Trash2 } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { CornerIcon, DoorIcon, LShapeIcon, UShapeIcon } from "@/components/icons/shape-icons";
import { ArrangeSection } from "@/components/properties/ArrangeSection";
import { DimensionsSection } from "@/components/properties/DimensionsSection";
import { LockToggle } from "@/components/properties/LockToggle";
import { PositionSection } from "@/components/properties/PositionSection";
import type { CommitText } from "@/components/properties/PropertySection";
import { StyleSection } from "@/components/properties/StyleSection";
import { TextField } from "@/components/properties/TextField";
import type { Shape, ShapeKind, ShapePatch } from "@/lib/plan-schema";
import { applyLabelField, applyNumberField, type NumberFieldKey } from "@/lib/shape-fields";
import { SHAPE_KIND_LABELS } from "@/lib/shape-kinds";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

/** Icons per kind, as in the tool bar; kinds without an entry show the generic shapes icon. */
const KIND_ICONS: Partial<Record<ShapeKind, ComponentType<SVGProps<SVGSVGElement>>>> = {
    rect: Square,
    ellipse: Circle,
    "l-shape": LShapeIcon,
    "u-shape": UShapeIcon,
    corner: CornerIcon,
    "door-swing": DoorIcon,
};

/** Fallback hint when the plan rejects a value the field checks let through. */
const REJECTED = "Wert nicht möglich";

/**
 * Properties form of the selected shape: head with kind, lock and "Löschen", the label,
 * then "Maße", "Lage", "Darstellung" and "Anordnung". A locked shape shows
 * "Maße" and "Lage" read-only. Every commit is one `updateSelectedShape`
 * call. Mount with `key={shape.id}` so open input and hints belong to one shape.
 */
export function ShapeProperties({ shape }: { shape: Shape }) {
    const updateSelectedShape = useAppStore((s) => s.updateSelectedShape);
    const deleteSelectedShape = useAppStore((s) => s.deleteSelectedShape);
    const Icon = KIND_ICONS[shape.kind] ?? Shapes;
    // A lock fixes size and position; label, style and order stay editable.
    const locked = shape.locked === true;

    const update = (patch: ShapePatch): string | null => (updateSelectedShape(patch) ? null : REJECTED);

    const commitNumber =
        (field: NumberFieldKey): CommitText =>
        (text) => {
            const result = applyNumberField(shape, field, text);
            return result.ok ? update(result.patch) : result.error;
        };

    const commitLabel: CommitText = (text) => {
        const patch = applyLabelField(text);
        return patch.label === shape.label ? null : update(patch);
    };

    return (
        <div className="flex flex-col">
            <section className="flex flex-col gap-3 border-b p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        <span className="text-xs font-medium">{SHAPE_KIND_LABELS[shape.kind]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <LockToggle locked={locked} onToggle={() => update({ locked: !locked })} />
                        {/* Locked via `aria-disabled`, not `disabled`, so Firefox still shows the tooltip. */}
                        <button
                            type="button"
                            aria-label="Löschen"
                            aria-disabled={locked || undefined}
                            title={locked ? "Gesperrt – zuerst entsperren" : "Löschen (Entf)"}
                            onClick={locked ? undefined : deleteSelectedShape}
                            className={cn(
                                "-my-1 inline-flex size-[30px] items-center justify-center rounded-md text-destructive outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                                locked && "cursor-not-allowed opacity-50 hover:bg-transparent",
                            )}
                        >
                            <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        </button>
                    </div>
                </div>
                <TextField
                    label="Beschriftung"
                    value={shape.label ?? ""}
                    onCommit={commitLabel}
                />
            </section>
            <DimensionsSection shape={shape} commit={commitNumber} readOnly={locked} />
            <PositionSection
                shape={shape}
                commit={commitNumber}
                onToggleMirrored={() => update({ mirrored: !shape.mirrored })}
                readOnly={locked}
            />
            <StyleSection
                shape={shape}
                onStyleChange={(style) => updateSelectedShape({ style })}
                commitStrokeWidth={commitNumber("strokeWidth")}
            />
            <ArrangeSection shape={shape} />
        </div>
    );
}
