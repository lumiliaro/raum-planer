import { CalibrationBanner } from "@/components/calibration/CalibrationBanner";
import { CalibrationPanel } from "@/components/calibration/CalibrationPanel";
import { FloorCanvas } from "@/components/canvas/FloorCanvas";
import { HelpDialog } from "@/components/help/HelpDialog";
import { HeaderBar } from "@/components/layout/HeaderBar";
import { PanelToggle } from "@/components/layout/PanelToggle";
import { PlanRecoveryBanner } from "@/components/layout/PlanRecoveryBanner";
import { PropertiesPanel } from "@/components/layout/PropertiesPanel";
import { StatusBar } from "@/components/layout/StatusBar";
import { ToolBar } from "@/components/layout/ToolBar";
import { TutorialCoach } from "@/components/tutorial/TutorialCoach";
import { useShapeShortcuts } from "@/hooks/useShapeShortcuts";
import { useAppStore } from "@/store/app-store";

export function AppShell() {
    const panelOpen = useAppStore((s) => s.propertiesPanelOpen);
    const calibrating = useAppStore((s) => s.calibrationDraft !== null);
    useShapeShortcuts();

    return (
        <div className="flex h-svh flex-col overflow-hidden bg-background text-[13px] text-foreground">
            <HeaderBar />
            <PlanRecoveryBanner />
            {calibrating && <CalibrationBanner />}
            <div className="flex min-h-0 flex-1">
                <ToolBar />
                <main className="relative min-w-0 flex-1 overflow-hidden bg-canvas">
                    <FloorCanvas />
                    {!calibrating && <PanelToggle />}
                </main>
                {calibrating ? <CalibrationPanel /> : panelOpen && <PropertiesPanel />}
            </div>
            <StatusBar />
            {/* Before the dialogs and with a lower z-index, so open dialogs cover it. */}
            <TutorialCoach />
            <HelpDialog />
        </div>
    );
}
