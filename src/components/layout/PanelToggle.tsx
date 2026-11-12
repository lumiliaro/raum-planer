import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store/app-store";

/**
 * Handle on the right edge of the canvas area, i.e. on the panel's left edge
 * while the panel is open; it stays in the same place in both states.
 */
export function PanelToggle() {
    const open = useAppStore((s) => s.propertiesPanelOpen);
    const toggle = useAppStore((s) => s.togglePropertiesPanel);
    const label = open ? "Eigenschaften ausblenden" : "Eigenschaften einblenden";
    const Icon = open ? ChevronRight : ChevronLeft;

    return (
        <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label={label}
            title={label}
            className="absolute top-1/2 right-0 z-10 flex h-14 w-[18px] -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 bg-background p-0 text-muted-foreground shadow-[-1px_0_3px_rgba(0,0,0,.05)] outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
            <Icon className="size-3.5" aria-hidden="true" />
        </button>
    );
}
