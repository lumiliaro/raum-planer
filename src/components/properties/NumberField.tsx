import { useId } from "react";
import { FieldShell, INPUT_CLASS } from "@/components/properties/FieldShell";
import { useCommitField } from "@/components/properties/useCommitField";
import { formatInputNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
    label: string;
    /** Name for screen readers if it should say more than the visible `label`. */
    accessibleLabel?: string;
    /** Shown at the right inside the field, e.g. "cm", "°", "px". */
    unit: string;
    value: number;
    /** Receives the typed text; returns a hint when the value is rejected, otherwise `null`. */
    onCommit: (text: string) => string | null;
    readOnly?: boolean;
    className?: string;
}

/** Number with unit; commits on Enter or blur, Esc resets (see `useCommitField`). */
export function NumberField({ label, accessibleLabel, unit, value, onCommit, readOnly = false, className }: NumberFieldProps) {
    const id = useId();
    const hintId = useId();
    const { error, inputProps } = useCommitField(formatInputNumber(value), onCommit, readOnly);

    return (
        <FieldShell id={id} hintId={hintId} label={label} error={error} className={className}>
            <div className="relative">
                <input
                    id={id}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label={accessibleLabel}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? hintId : undefined}
                    className={cn(INPUT_CLASS, "pr-8")}
                    {...inputProps}
                />
                <span className="pointer-events-none absolute top-2 right-2 text-xs text-zinc-500">{unit}</span>
            </div>
        </FieldShell>
    );
}
