import { Ruler } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { TOOLS, toolTooltip } from "@/components/layout/tools";
import { cn } from "@/lib/utils";
import { canCalibrate, isToolEnabled, useAppStore } from "@/store/app-store";

/** Vertical tool bar left of the canvas: tools at the top, calibration at the bottom. */
export function ToolBar() {
    const calibrating = useAppStore((s) => s.calibrationDraft !== null);
    const toggleCalibration = useAppStore((s) => s.toggleCalibration);
    const activeTool = useAppStore((s) => s.activeTool);
    const setActiveTool = useAppStore((s) => s.setActiveTool);
    const enabledFlags = useAppStore(useShallow((s) => TOOLS.map((t) => isToolEnabled(s, t.id))));
    const hasRoom = useAppStore((s) => (s.plan.roomsByFloor[s.plan.activeFloorId]?.length ?? 0) > 0);
    // In calibration mode the button ends the mode, so it stays usable.
    const calibratable = useAppStore((s) => s.calibrationDraft !== null || canCalibrate(s));

    return (
        <nav
            aria-label="Werkzeuge"
            className="flex w-[52px] shrink-0 flex-col items-center gap-1 border-r bg-background py-2"
        >
            {TOOLS.map((tool, i) => {
                const Icon = tool.icon;
                return (
                    <Fragment key={tool.id}>
                        {tool.divider && <div aria-hidden="true" className="my-1 h-px w-6 bg-border" />}
                        <ToolButton
                            label={tool.name}
                            title={toolTooltip(tool, { hasRoom })}
                            shortcut={tool.key}
                            pressed={!calibrating && activeTool === tool.id}
                            disabled={!enabledFlags[i]}
                            onClick={() => setActiveTool(tool.id)}
                        >
                            <Icon />
                        </ToolButton>
                    </Fragment>
                );
            })}
            <div className="mt-auto">
                <ToolButton
                    label="Vorlage kalibrieren"
                    title={calibratable ? undefined : "Vorlage kalibrieren – zuerst ein Bild hochladen"}
                    pressed={calibrating}
                    disabled={!calibratable}
                    onClick={toggleCalibration}
                >
                    <Ruler />
                </ToolButton>
            </div>
        </nav>
    );
}

interface ToolButtonProps {
    label: string;
    /** Tooltip; defaults to `label`. */
    title?: string;
    shortcut?: string;
    pressed: boolean;
    /**
     * Locked: `aria-disabled`, half opacity, clicks do nothing. Deliberately no
     * `disabled` attribute – Firefox shows no tooltip on disabled buttons.
     */
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
}

function ToolButton({ label, title, shortcut, pressed, disabled = false, onClick, children }: ToolButtonProps) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            aria-disabled={disabled || undefined}
            aria-keyshortcuts={shortcut}
            title={title ?? label}
            onClick={disabled ? undefined : onClick}
            className={cn(
                "inline-flex size-9 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-[18px] [&_svg]:stroke-[1.75]",
                pressed
                    ? "bg-selection-bg text-selection shadow-[inset_0_0_0_1px_#BFDBFE]"
                    : "text-zinc-700 hover:bg-muted",
                disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
            )}
        >
            {children}
        </button>
    );
}
