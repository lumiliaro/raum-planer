import { ArrowDownToLine, ArrowUpToLine, BringToFront, SendToBack, type LucideIcon } from "lucide-react";
import { PropertySection } from "@/components/properties/PropertySection";
import { formatKeys } from "@/lib/key-labels";
import { canReorder, type ReorderDirection } from "@/lib/plan";
import type { Shape } from "@/lib/plan-schema";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const BUTTONS: { direction: ReorderDirection; label: string; key: string; shortcut: string; Icon: LucideIcon }[] = [
    { direction: "forward", label: "Nach vorne", key: "Bild↑", shortcut: "PageUp", Icon: BringToFront },
    { direction: "backward", label: "Nach hinten", key: "Bild↓", shortcut: "PageDown", Icon: SendToBack },
    { direction: "front", label: "Ganz nach vorne", key: "Umschalt+Bild↑", shortcut: "Shift+PageUp", Icon: ArrowUpToLine },
    { direction: "back", label: "Ganz nach hinten", key: "Umschalt+Bild↓", shortcut: "Shift+PageDown", Icon: ArrowDownToLine },
];

/**
 * „Anordnung“: moves the shape in its floor's drawing order. A button is locked
 * (`aria-disabled`, tooltip stays) when the shape already is at its target.
 * Allowed for locked shapes, too.
 */
export function ArrangeSection({ shape }: { shape: Shape }) {
    const plan = useAppStore((s) => s.plan);
    const reorderShape = useAppStore((s) => s.reorderShape);
    const floorId = plan.activeFloorId;

    return (
        <PropertySection title="Anordnung">
            <div className="grid grid-cols-2 gap-2">
                {BUTTONS.map(({ direction, label, key, shortcut, Icon }) => {
                    const enabled = canReorder(plan, floorId, shape.id, direction);
                    return (
                        <button
                            key={direction}
                            type="button"
                            aria-disabled={!enabled || undefined}
                            aria-keyshortcuts={shortcut}
                            title={`${label} (${formatKeys(key)})`}
                            onClick={enabled ? () => reorderShape(floorId, shape.id, direction) : undefined}
                            className={cn(
                                "inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2 text-[13px] font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                                !enabled && "cursor-not-allowed opacity-50 hover:bg-background",
                            )}
                        >
                            <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                            <span className="truncate">{label}</span>
                        </button>
                    );
                })}
            </div>
        </PropertySection>
    );
}
