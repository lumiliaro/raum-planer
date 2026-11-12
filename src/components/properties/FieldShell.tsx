import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const INPUT_CLASS =
    "h-8 w-full min-w-0 rounded-md border border-input bg-background pl-2 text-[13px] tabular-nums outline-none focus-visible:border-selection focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive read-only:bg-muted read-only:text-muted-foreground";

interface FieldShellProps {
    id: string;
    hintId: string;
    label: string;
    error: string | null;
    /** Label for screen readers only. */
    hideLabel?: boolean;
    className?: string;
    children: ReactNode;
}

/** Label above, the input, and the hint below (12 px, destructive color). */
export function FieldShell({ id, hintId, label, error, hideLabel = false, className, children }: FieldShellProps) {
    return (
        <div className={cn("flex min-w-0 flex-col gap-1", className)}>
            <label htmlFor={id} className={cn("text-xs font-medium text-muted-foreground", hideLabel && "sr-only")}>
                {label}
            </label>
            {children}
            {error && (
                <p id={hintId} className="text-xs text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
