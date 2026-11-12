import { Pencil } from "lucide-react";
import { useState } from "react";
import { FloorsDialog } from "@/components/floors/FloorsDialog";
import { cn } from "@/lib/utils";
import { selectFloors, useAppStore } from "@/store/app-store";

/** The plan's floors in their order, plus „Etagen bearbeiten“ (hidden in calibration mode). */
export function FloorSwitcher() {
    const floors = useAppStore(selectFloors);
    const activeFloorId = useAppStore((s) => s.plan.activeFloorId);
    const setActiveFloor = useAppStore((s) => s.setActiveFloor);
    const calibrating = useAppStore((s) => s.calibrationDraft !== null);
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="flex min-w-0 items-center gap-1.5">
            <nav aria-label="Etage" className="min-w-0">
                <div className="inline-flex max-w-full gap-0.5 rounded-[7px] bg-muted p-[3px]">
                    {floors.map((floor) => {
                        const active = floor.id === activeFloorId;
                        return (
                            <button
                                key={floor.id}
                                type="button"
                                aria-pressed={active}
                                title={floor.name}
                                onClick={() => setActiveFloor(floor.id)}
                                className={cn(
                                    "h-7 max-w-[160px] min-w-0 truncate rounded-[5px] px-3 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                                    active
                                        ? "bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,.08),0_0_0_1px_var(--border)]"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {floor.name}
                            </button>
                        );
                    })}
                </div>
            </nav>
            {!calibrating && (
                <button
                    type="button"
                    aria-label="Etagen bearbeiten"
                    title="Etagen bearbeiten"
                    onClick={() => setDialogOpen(true)}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-700 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <Pencil className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </button>
            )}
            <FloorsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
        </div>
    );
}
