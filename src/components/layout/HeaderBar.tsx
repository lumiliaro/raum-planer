import { House, Settings } from "lucide-react";
import { useState } from "react";
import { FloorSwitcher } from "@/components/layout/FloorSwitcher";
import { HistoryButtons } from "@/components/layout/HistoryButtons";
import { PlanFileActions } from "@/components/plan-file/PlanFileActions";
import { PdfAction } from "@/components/plan-pdf/PdfAction";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

export function HeaderBar() {
    const calibrating = useAppStore((s) => s.calibrationDraft !== null);
    const endCalibration = useAppStore((s) => s.endCalibration);
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <header className="grid h-[52px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-4">
            <div className="flex items-center gap-2.5">
                <House className="size-5" strokeWidth={1.75} aria-hidden="true" />
                <span className="text-sm font-semibold">Raumplaner</span>
            </div>
            <FloorSwitcher />
            <div className="flex items-center justify-end gap-2">
                {calibrating ? (
                    <Button variant="outline" size="sm" className="text-[13px]" onClick={endCalibration}>
                        Kalibrierung beenden
                    </Button>
                ) : (
                    <>
                        <HistoryButtons />
                        <div aria-hidden="true" className="mx-2 h-5 w-px bg-border" />
                        <PlanFileActions />
                        <PdfAction />
                        <button
                            type="button"
                            aria-label="Einstellungen"
                            title="Einstellungen"
                            onClick={() => setSettingsOpen(true)}
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-700 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Settings className="size-4" strokeWidth={1.75} aria-hidden="true" />
                        </button>
                    </>
                )}
            </div>
            <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </header>
    );
}
