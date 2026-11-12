import { Loader2 } from "lucide-react";
import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { downloadBlob } from "@/components/plan-file/download";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import {
    defaultPdfOptions,
    pdfFileName,
    pdfIssues,
    type PdfOptions,
    type PdfOrientation,
    type PdfScaleChoice,
} from "@/lib/pdf-layout";
import type { ImageId, Plan } from "@/lib/plan-schema";
import { referencedImageIds } from "@/lib/underlay";
import { loadImage } from "@/storage/image-cache";
import { useAppStore } from "@/store/app-store";

const NO_FLOOR_HINT = "Bitte mindestens eine Etage auswählen";
const FAILED_HINT = "PDF konnte nicht erstellt werden";

const ORIENTATIONS: { value: PdfOrientation; label: string }[] = [
    { value: "portrait", label: "Hochformat" },
    { value: "landscape", label: "Querformat" },
];

const SCALES: { value: PdfScaleChoice; label: string }[] = [
    { value: 50, label: "1:50" },
    { value: 100, label: "1:100" },
    { value: "fit", label: "Auf Seite einpassen" },
];

const CONTENT: { key: "furniture" | "roomLabels" | "dimensions" | "underlay" | "grid"; label: string }[] = [
    { key: "furniture", label: "Möbel" },
    { key: "roomLabels", label: "Raumnamen und Fläche" },
    { key: "dimensions", label: "Maße" },
    { key: "underlay", label: "Vorlage" },
    { key: "grid", label: "Raster" },
];

const CONTROL_CLASS = "size-4 accent-zinc-900";

interface PdfDialogProps {
    open: boolean;
    /** Changes with each opening; the form starts again from the defaults. */
    session: number;
    onClose: () => void;
}

/**
 * „Grundriss als PDF“: floors, format, scale and content; „PDF erstellen“
 * downloads the file and closes the dialog. Reads the plan, writes nothing
 * (no undo step). Cannot be closed while the PDF is being created.
 */
export function PdfDialog({ open, session, onClose }: PdfDialogProps) {
    const [creating, setCreating] = useState(false);
    return (
        <Dialog open={open} onOpenChange={(next) => !next && !creating && onClose()}>
            <DialogContent showCloseButton={false} className="gap-0 p-0 text-[13px] sm:max-w-[520px]">
                <PdfForm key={session} creating={creating} setCreating={setCreating} onDone={onClose} />
            </DialogContent>
        </Dialog>
    );
}

/** Underlay images of the plan that are in this browser; empty until checked. */
function useAvailableImages(plan: Plan): ReadonlySet<ImageId> {
    const [available, setAvailable] = useState<ReadonlySet<ImageId>>(() => new Set());
    // Checked once per opening (the form remounts with each session).
    const [ids] = useState(() => referencedImageIds(plan));
    useEffect(() => {
        let cancelled = false;
        void Promise.all(ids.map(async (id) => ((await loadImage(id)) ? id : null))).then((found) => {
            if (!cancelled) setAvailable(new Set(found.filter((id): id is ImageId => id !== null)));
        });
        return () => {
            cancelled = true;
        };
    }, [ids]);
    return available;
}

interface PdfFormProps {
    creating: boolean;
    setCreating: (creating: boolean) => void;
    onDone: () => void;
}

function PdfForm({ creating, setCreating, onDone }: PdfFormProps) {
    const plan = useAppStore((s) => s.plan);
    const [options, setOptions] = useState<PdfOptions>(() => defaultPdfOptions(plan));
    const [failed, setFailed] = useState(false);
    const availableImages = useAvailableImages(plan);
    const issues = useMemo(() => pdfIssues(plan, options, availableImages), [plan, options, availableImages]);
    const blocked = issues.noFloor || issues.tooLarge.length > 0;
    const hintId = useId();

    const change = (patch: Partial<PdfOptions>) => {
        setOptions((current) => ({ ...current, ...patch }));
        setFailed(false);
    };

    const toggleFloor = (id: string, checked: boolean) =>
        change({
            floorIds: checked ? [...options.floorIds, id] : options.floorIds.filter((f) => f !== id),
        });

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (blocked || creating) return;
        setCreating(true);
        setFailed(false);
        try {
            const now = new Date();
            // Loaded on demand: `jspdf` stays out of the main bundle.
            const { createPdf } = await import("@/components/plan-pdf/create-pdf");
            const blob = await createPdf(plan, options, availableImages, now);
            downloadBlob(pdfFileName(plan.name, now), blob);
            setCreating(false);
            onDone();
        } catch (error) {
            console.error(error);
            setCreating(false);
            setFailed(true);
        }
    };

    const hint = issues.noFloor
        ? NO_FLOOR_HINT
        : issues.tooLarge.length > 0
          ? `Passt nicht auf die Seite: ${issues.tooLarge.join(", ")}`
          : failed
            ? FAILED_HINT
            : null;

    return (
        <form onSubmit={(e) => void submit(e)} noValidate>
            <div className="flex flex-col gap-4 px-5 pt-5 pb-4">
                <DialogTitle className="text-base font-semibold">Grundriss als PDF</DialogTitle>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <Group legend="Etagen">
                        {plan.floors.map((floor) => (
                            <Choice key={floor.id} label={floor.name}>
                                <input
                                    type="checkbox"
                                    checked={options.floorIds.includes(floor.id)}
                                    onChange={(e) => toggleFloor(floor.id, e.currentTarget.checked)}
                                    disabled={creating}
                                    className={CONTROL_CLASS}
                                />
                            </Choice>
                        ))}
                    </Group>
                    <Group legend="Inhalt">
                        {CONTENT.map(({ key, label }) => (
                            <Choice key={key} label={label}>
                                <input
                                    type="checkbox"
                                    checked={options[key]}
                                    onChange={(e) => change({ [key]: e.currentTarget.checked })}
                                    disabled={creating}
                                    className={CONTROL_CLASS}
                                />
                            </Choice>
                        ))}
                    </Group>
                    <RadioGroup
                        legend="Format"
                        options={ORIENTATIONS}
                        value={options.orientation}
                        disabled={creating}
                        onChange={(orientation) => change({ orientation })}
                    />
                    <RadioGroup
                        legend="Maßstab"
                        options={SCALES}
                        value={options.scale}
                        disabled={creating}
                        onChange={(scale) => change({ scale })}
                    />
                </div>
                <p className="text-xs text-muted-foreground">Papier: DIN A4, eine Seite je Etage.</p>
                {hint && (
                    <p id={hintId} role="status" className="text-xs text-destructive">
                        {hint}
                    </p>
                )}
            </div>
            <DialogFooter className="flex-row px-5 pt-0 pb-5">
                <DialogClose
                    disabled={creating}
                    render={<Button type="button" variant="outline" className="text-[13px]" />}
                >
                    Abbrechen
                </DialogClose>
                <Button
                    type="submit"
                    variant="default"
                    className="text-[13px]"
                    disabled={blocked || creating}
                    aria-describedby={hint ? hintId : undefined}
                >
                    {creating && <Loader2 className="animate-spin" strokeWidth={1.75} aria-hidden="true" />}
                    {creating ? "Wird erstellt …" : "PDF erstellen"}
                </Button>
            </DialogFooter>
        </form>
    );
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
    return (
        <fieldset className="flex min-w-0 flex-col gap-1.5">
            <legend className="mb-1.5 font-medium">{legend}</legend>
            {children}
        </fieldset>
    );
}

function Choice({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="flex min-w-0 items-center gap-2">
            {children}
            <span className="truncate">{label}</span>
        </label>
    );
}

interface RadioGroupProps<T> {
    legend: string;
    options: { value: T; label: string }[];
    value: T;
    disabled: boolean;
    onChange: (value: T) => void;
}

function RadioGroup<T>({ legend, options, value, disabled, onChange }: RadioGroupProps<T>) {
    const name = useId();
    return (
        <Group legend={legend}>
            {options.map((option) => (
                <Choice key={option.label} label={option.label}>
                    <input
                        type="radio"
                        name={name}
                        checked={value === option.value}
                        onChange={() => onChange(option.value)}
                        disabled={disabled}
                        className={CONTROL_CLASS}
                    />
                </Choice>
            ))}
        </Group>
    );
}
