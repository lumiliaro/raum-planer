import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { NumberField } from "@/components/properties/NumberField";
import { RoomColorPicker } from "@/components/properties/RoomColorPicker";
import { ColorField } from "@/components/properties/StyleSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { SETTING_LABELS, settingsAreFactory, type PlanSettings } from "@/lib/plan-settings";
import { applySettingsNumberField, type SettingNumberKey } from "@/lib/settings-fields";
import { cn } from "@/lib/utils";
import { selectSettings, useAppStore } from "@/store/app-store";

/** Fallback hint when the plan rejects a value the field check let through. */
const REJECTED = "Wert nicht möglich";

interface SettingsDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * „Einstellungen“: default values for new rooms and openings, grid, snap
 * steps and wall color. Every change takes effect in the plan at once and is
 * one undo step; undo works after closing.
 */
export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            <DialogContent showCloseButton={false} className="gap-0 p-0 text-[13px] sm:max-w-[440px]">
                <SettingsForm />
            </DialogContent>
        </Dialog>
    );
}

function SettingsForm() {
    const settings = useAppStore(selectSettings);
    const updateSettings = useAppStore((s) => s.updateSettings);
    const resetSettings = useAppStore((s) => s.resetSettings);
    /** Esc in a field with typed text only resets the field; the next Esc closes the dialog. */
    const escapeResetsField = useRef(false);
    const isFactory = settingsAreFactory(settings);

    const commitNumber =
        (key: SettingNumberKey) =>
        (text: string): string | null => {
            const result = applySettingsNumberField(useAppStore.getState().plan.settings, key, text);
            if (!result.ok) return result.error;
            if (Object.keys(result.patch).length === 0) return null;
            return updateSettings(result.patch) ? null : REJECTED;
        };

    const numberField = (key: SettingNumberKey) => (
        <NumberField label={SETTING_LABELS[key]} unit="cm" value={settings[key]} onCommit={commitNumber(key)} />
    );

    return (
        <>
            <div className="px-5 pt-5 pb-1">
                <DialogTitle className="text-base font-semibold">Einstellungen</DialogTitle>
            </div>
            <div
                className="max-h-[70vh] overflow-y-auto"
                onKeyDownCapture={(e: KeyboardEvent) => {
                    const target = e.target as HTMLElement;
                    escapeResetsField.current = e.key === "Escape" && target.dataset.commitField === "dirty";
                }}
                onKeyDown={(e: KeyboardEvent) => {
                    if (escapeResetsField.current) e.stopPropagation();
                }}
            >
                <SettingsSection title="Wände">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                        {numberField("defaultWallThicknessCm")}
                        <WallColorField settings={settings} onChoose={(wallColor) => updateSettings({ wallColor })} />
                    </div>
                </SettingsSection>
                <SettingsSection title="Räume">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">{SETTING_LABELS.defaultRoomColor}</span>
                        <RoomColorPicker
                            value={settings.defaultRoomColor}
                            onChoose={(defaultRoomColor) => updateSettings({ defaultRoomColor })}
                            pickerLabel="Eigene Farbe neuer Räume wählen"
                        />
                    </div>
                </SettingsSection>
                <SettingsSection title="Raster und Fangen">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                        {numberField("gridStepCm")}
                        <div aria-hidden="true" />
                        {numberField("snapStepCm")}
                        {numberField("fineSnapStepCm")}
                    </div>
                </SettingsSection>
                <SettingsSection title="Öffnungen" last>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-3">
                        {numberField("doorWidthCm")}
                        {numberField("windowWidthCm")}
                        {numberField("passageWidthCm")}
                    </div>
                </SettingsSection>
            </div>
            <DialogFooter className="flex-row items-center justify-between border-t px-5 py-4 sm:justify-between">
                <Button
                    variant="outline"
                    aria-disabled={isFactory || undefined}
                    title={isFactory ? "Alle Einstellungen sind Werkseinstellungen" : undefined}
                    onClick={isFactory ? undefined : () => resetSettings()}
                    // Deliberately no `disabled`: Firefox shows no tooltip on disabled buttons.
                    className={cn("text-[13px]", isFactory && "cursor-not-allowed opacity-50 hover:bg-background")}
                >
                    Auf Werkseinstellungen zurücksetzen
                </Button>
                <DialogClose render={<Button className="text-[13px]" />}>Schließen</DialogClose>
            </DialogFooter>
        </>
    );
}

/** One section of the dialog: heading 11/600 in capitals, line below (not after the last one). */
function SettingsSection({ title, last = false, children }: { title: string; last?: boolean; children: ReactNode }) {
    return (
        <section aria-label={title} className={cn("flex flex-col gap-3 px-5 py-4", !last && "border-b")}>
            <h3 className="text-[11px] font-semibold tracking-[.05em] text-muted-foreground uppercase">{title}</h3>
            {children}
        </section>
    );
}

/** „Wandfarbe“: label above, the color picker with the color's hex value beside it. */
function WallColorField({ settings, onChoose }: { settings: PlanSettings; onChoose: (color: string) => void }) {
    return (
        <div className="flex min-w-0 flex-col gap-1">
            <span aria-hidden="true" className="text-xs font-medium text-muted-foreground">
                {SETTING_LABELS.wallColor}
            </span>
            <div className="flex items-center gap-2">
                <ColorField
                    ariaLabel={SETTING_LABELS.wallColor}
                    value={settings.wallColor}
                    onCommit={(hex) => onChoose(hex.toUpperCase())}
                />
                <span className="text-[13px] text-muted-foreground tabular-nums">{settings.wallColor.toUpperCase()}</span>
            </div>
        </div>
    );
}
