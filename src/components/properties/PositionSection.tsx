import { FlipHorizontal2 } from "lucide-react";
import { useId } from "react";
import { NumberField } from "@/components/properties/NumberField";
import { FieldGrid, PropertySection, type CommitText } from "@/components/properties/PropertySection";
import type { Shape } from "@/lib/plan-schema";
import type { NumberFieldKey } from "@/lib/shape-fields";
import { cn } from "@/lib/utils";

interface PositionSectionProps {
    shape: Shape;
    commit: (field: NumberFieldKey) => CommitText;
    onToggleMirrored: () => void;
    readOnly?: boolean;
}

/** "Lage": center X/Y in cm, rotation in degrees and the toggle "Spiegeln – Horizontal". */
export function PositionSection({ shape, commit, onToggleMirrored, readOnly = false }: PositionSectionProps) {
    const mirrorLabelId = useId();

    return (
        <PropertySection title="Lage">
            <FieldGrid>
                <NumberField label="X" unit="cm" value={shape.x} onCommit={commit("x")} readOnly={readOnly} />
                <NumberField label="Y" unit="cm" value={shape.y} onCommit={commit("y")} readOnly={readOnly} />
                <NumberField
                    label="Drehung"
                    unit="°"
                    value={shape.rotationDeg}
                    onCommit={commit("rotationDeg")}
                    readOnly={readOnly}
                />
                <div className="flex min-w-0 flex-col gap-1">
                    <span id={mirrorLabelId} className="text-xs font-medium text-muted-foreground">
                        Spiegeln
                    </span>
                    <button
                        type="button"
                        aria-pressed={shape.mirrored}
                        aria-labelledby={`${mirrorLabelId} ${mirrorLabelId}-value`}
                        disabled={readOnly}
                        onClick={onToggleMirrored}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                            shape.mirrored
                                ? "border-[#BFDBFE] bg-selection-bg text-selection"
                                : "border-input bg-background text-foreground hover:bg-muted",
                        )}
                    >
                        <FlipHorizontal2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        <span id={`${mirrorLabelId}-value`}>Horizontal</span>
                    </button>
                </div>
            </FieldGrid>
        </PropertySection>
    );
}
