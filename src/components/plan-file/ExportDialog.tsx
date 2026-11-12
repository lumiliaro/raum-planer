import { useId, useState, type FormEvent } from "react";
import { previewExportFileName } from "@/components/plan-file/download";
import { FieldShell, INPUT_CLASS } from "@/components/properties/FieldShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_PLAN_NAME } from "@/lib/plan";
import { cn } from "@/lib/utils";

const EMPTY_NAME_HINT = "Bitte einen Namen eingeben";

interface ExportDialogProps {
    open: boolean;
    /** Changes with each opening; the form starts again from `planName`. */
    session: number;
    planName: string;
    /** Called with the trimmed, non-empty name. */
    onExport: (name: string) => void;
    onCancel: () => void;
}

/** Asks for the plan name before each export; prefilled, empty while the plan still has the default name. */
export function ExportDialog({ open, session, planName, onExport, onCancel }: ExportDialogProps) {
    const inputId = useId();

    /** Focus the name field and select its text, so typing replaces the name. */
    const focusName = () => {
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        input?.select();
        return input;
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
            <DialogContent
                showCloseButton={false}
                initialFocus={focusName}
                className="gap-0 p-0 text-[13px] sm:max-w-[520px]"
            >
                <ExportForm key={session} inputId={inputId} planName={planName} onExport={onExport} />
            </DialogContent>
        </Dialog>
    );
}

interface ExportFormProps {
    inputId: string;
    planName: string;
    onExport: (name: string) => void;
}

function ExportForm({ inputId, planName, onExport }: ExportFormProps) {
    const hintId = useId();
    const [name, setName] = useState(planName === DEFAULT_PLAN_NAME ? "" : planName);
    const [error, setError] = useState<string | null>(null);
    const trimmed = name.trim();

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (trimmed === "") {
            setError(EMPTY_NAME_HINT);
            return;
        }
        onExport(trimmed);
    };

    return (
        <form onSubmit={submit} noValidate>
            <div className="flex flex-col gap-4 px-5 pt-5 pb-4">
                <DialogTitle className="text-base font-semibold">Plan exportieren</DialogTitle>
                <div className="flex flex-col gap-1.5">
                    <FieldShell id={inputId} hintId={hintId} label="Name des Plans" error={error}>
                        <input
                            id={inputId}
                            type="text"
                            autoComplete="off"
                            placeholder="z. B. Umzug"
                            value={name}
                            onChange={(e) => {
                                setName(e.currentTarget.value);
                                if (error) setError(null);
                            }}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? hintId : undefined}
                            className={cn(INPUT_CLASS, "pr-2 placeholder:text-muted-foreground")}
                        />
                    </FieldShell>
                    <p className="text-xs break-all text-muted-foreground">
                        Dateiname: {previewExportFileName(trimmed)}
                    </p>
                </div>
            </div>
            <DialogFooter className="flex-row px-5 pt-0 pb-5">
                <DialogClose render={<Button type="button" variant="outline" className="text-[13px]" />}>
                    Abbrechen
                </DialogClose>
                <Button type="submit" variant="default" className="text-[13px]">
                    Exportieren
                </Button>
            </DialogFooter>
        </form>
    );
}
