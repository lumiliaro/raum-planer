import { Lock, LockOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface LockToggleProps {
    locked: boolean;
    onToggle: () => void;
}

/** Lock button in the panel head: open lock „Sperren“, pressed closed lock „Entsperren“. */
export function LockToggle({ locked, onToggle }: LockToggleProps) {
    const label = locked ? "Entsperren" : "Sperren";
    const Icon = locked ? Lock : LockOpen;
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={locked}
            title={label}
            onClick={onToggle}
            className={cn(
                "-my-1 inline-flex size-[30px] items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                locked
                    ? "bg-selection-bg text-selection shadow-[inset_0_0_0_1px_#BFDBFE]"
                    : "text-zinc-700 hover:bg-muted",
            )}
        >
            <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
    );
}
