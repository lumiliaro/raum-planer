import { useId } from "react";
import { FieldShell, INPUT_CLASS } from "@/components/properties/FieldShell";
import { useCommitField } from "@/components/properties/useCommitField";
import { cn } from "@/lib/utils";

interface TextFieldProps {
    label: string;
    value: string;
    /** Receives the typed text; returns a hint when the value is rejected, otherwise `null`. */
    onCommit: (text: string) => string | null;
    readOnly?: boolean;
    placeholder?: string;
    /** Label for screen readers only. */
    hideLabel?: boolean;
    className?: string;
}

/** Single-line text; commits on Enter or blur, Esc resets (see `useCommitField`). */
export function TextField({
    label,
    value,
    onCommit,
    readOnly = false,
    placeholder,
    hideLabel = false,
    className,
}: TextFieldProps) {
    const id = useId();
    const hintId = useId();
    const { error, inputProps } = useCommitField(value, onCommit, readOnly);

    return (
        <FieldShell id={id} hintId={hintId} label={label} error={error} hideLabel={hideLabel} className={className}>
            <input
                id={id}
                type="text"
                autoComplete="off"
                placeholder={placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? hintId : undefined}
                className={cn(INPUT_CLASS, "pr-2 placeholder:text-muted-foreground")}
                {...inputProps}
            />
        </FieldShell>
    );
}
