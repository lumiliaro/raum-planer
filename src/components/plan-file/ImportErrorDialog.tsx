import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import type { ImportFailure } from "@/lib/plan-import";
import { FileX } from "lucide-react";
import { useLastValue } from "@/components/plan-file/useLastValue";

function message({ fileName, error, fromVersion, toVersion }: ImportFailure): string {
    switch (error) {
        case "too-large":
            return `„${fileName}“ ist größer als 50 MB und keine Raumplaner-Datei.`;
        case "not-json":
            return `„${fileName}“ konnte nicht gelesen werden – die Datei ist kein gültiges JSON.`;
        case "not-a-plan":
            return `„${fileName}“ ist keine Raumplaner-Datei.`;
        case "migration-failed":
            return `„${fileName}“ verwendet Datenformat Version ${fromVersion} und konnte nicht in Version ${toVersion} umgewandelt werden.`;
    }
}

interface ImportErrorDialogProps {
    failure: ImportFailure | null;
    onClose: () => void;
}

/** The file cannot be imported; the current plan stays unchanged. */
export function ImportErrorDialog({ failure, onClose }: ImportErrorDialogProps) {
    const shown = useLastValue(failure);
    return (
        <Dialog open={failure !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-[520px]">
                {shown && (
                    <>
                        <div className="flex gap-3.5 px-5 pt-5 pb-4">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                <FileX className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <DialogTitle className="text-base font-semibold">Datei kann nicht importiert werden</DialogTitle>
                                <DialogDescription className="text-[13px] leading-relaxed text-[#3F3F46]">
                                    {message(shown)}
                                </DialogDescription>
                            </div>
                        </div>
                        <DialogFooter className="px-5 pt-0 pb-5">
                            <Button variant="default" className="text-[13px]" onClick={onClose}>
                                Schließen
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
