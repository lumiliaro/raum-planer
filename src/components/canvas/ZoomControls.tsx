import { Minus, Plus, Scan } from "lucide-react";
import type { ReactNode } from "react";
import { formatZoomPercent } from "@/lib/format";

interface ZoomControlsProps {
    scale: number | null;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onFit: () => void;
}

export function ZoomControls({ scale, onZoomOut, onZoomIn, onFit }: ZoomControlsProps) {
    const disabled = scale === null;
    return (
        <div className="absolute right-7 bottom-4 z-10 flex items-center gap-0.5 rounded-lg bg-background p-[3px] shadow-[0_1px_3px_rgba(0,0,0,.1),0_0_0_1px_var(--border)]">
            <ZoomButton label="Verkleinern" shortcut="-" onClick={onZoomOut} disabled={disabled}>
                <Minus />
            </ZoomButton>
            <span className="min-w-12 text-center text-xs text-zinc-700 tabular-nums" aria-live="polite">
                {scale === null ? "–" : formatZoomPercent(scale)}
            </span>
            <ZoomButton label="Vergrößern" shortcut="+" onClick={onZoomIn} disabled={disabled}>
                <Plus />
            </ZoomButton>
            <div className="mx-0.5 h-[18px] w-px bg-border" />
            <ZoomButton label="Einpassen" title="Grundriss einpassen (0)" onClick={onFit} disabled={disabled}>
                <Scan />
            </ZoomButton>
        </div>
    );
}

interface ZoomButtonProps {
    label: string;
    shortcut?: string;
    title?: string;
    disabled: boolean;
    onClick: () => void;
    children: ReactNode;
}

function ZoomButton({ label, shortcut, title, disabled, onClick, children }: ZoomButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            title={title ?? `${label} (${shortcut})`}
            disabled={disabled}
            onClick={onClick}
            className="inline-flex size-8 items-center justify-center rounded-md text-zinc-700 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:stroke-[1.75]"
        >
            {children}
        </button>
    );
}
