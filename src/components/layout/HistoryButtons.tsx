import { Redo2, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { formatAriaShortcuts, formatKeys } from "@/lib/key-labels";
import { cn } from "@/lib/utils";
import { useAppStore, useCanRedo, useCanUndo } from "@/store/app-store";

/** „Rückgängig“ and „Wiederholen“ in the header; locked while there is no step. Keys in this device's notation. */
export function HistoryButtons() {
    const undo = useAppStore((s) => s.undo);
    const redo = useAppStore((s) => s.redo);
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();

    return (
        <div className="flex items-center gap-1">
            <HistoryButton
                label="Rückgängig"
                title={`Rückgängig (${formatKeys("Strg+Z")})`}
                shortcut={formatAriaShortcuts("Control+Z")}
                enabled={canUndo}
                onClick={undo}
            >
                <Undo2 aria-hidden="true" />
            </HistoryButton>
            <HistoryButton
                label="Wiederholen"
                title={`Wiederholen (${formatKeys("Strg+Umschalt+Z")})`}
                shortcut={formatAriaShortcuts("Control+Shift+Z Control+Y")}
                enabled={canRedo}
                onClick={redo}
            >
                <Redo2 aria-hidden="true" />
            </HistoryButton>
        </div>
    );
}

interface HistoryButtonProps {
    label: string;
    title: string;
    shortcut: string;
    enabled: boolean;
    onClick: () => void;
    children: ReactNode;
}

/** 36 px icon button. Locked via `aria-disabled`, not `disabled`, so Firefox still shows the tooltip. */
function HistoryButton({ label, title, shortcut, enabled, onClick, children }: HistoryButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-disabled={!enabled || undefined}
            aria-keyshortcuts={shortcut}
            title={title}
            onClick={enabled ? onClick : undefined}
            className={cn(
                "inline-flex size-9 items-center justify-center rounded-md text-zinc-700 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-[18px] [&_svg]:stroke-[1.75]",
                !enabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
            )}
        >
            {children}
        </button>
    );
}
