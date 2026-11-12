import { useRef, useState, type ChangeEvent } from "react";
import { Download, Upload } from "lucide-react";
import { exportPlan } from "@/components/plan-file/download";
import { ExportDialog } from "@/components/plan-file/ExportDialog";
import { ImportDialog } from "@/components/plan-file/ImportDialog";
import { ImportErrorDialog } from "@/components/plan-file/ImportErrorDialog";
import { Button } from "@/components/ui/button";
import { decodeImageSize } from "@/components/underlay/read-image";
import { imageIdFor } from "@/lib/image-data";
import {
    analyzePlanFile,
    applyImageCheck,
    failure,
    MAX_IMPORT_BYTES,
    type ImageCheckResult,
    type ImportFailure,
    type ImportSuccess,
    type PendingImage,
} from "@/lib/plan-import";
import type { ImageId } from "@/lib/plan-schema";
import { storeImage } from "@/storage/image-cache";
import { useAppStore } from "@/store/app-store";

const toBlob = ({ type, bytes }: PendingImage) => new Blob([bytes as Uint8Array<ArrayBuffer>], { type });

/** Decodes (pixel size) and hashes (id) each image of the file in the browser; see `applyImageCheck`. */
async function checkImages(analysis: ImportSuccess): Promise<ImportSuccess> {
    const results = new Map<ImageId, ImageCheckResult>();
    for (const [id, image] of analysis.pendingImages) {
        const size = await decodeImageSize(toBlob(image));
        results.set(id, size ? { ok: true, id: await imageIdFor(image.bytes), ...size } : { ok: false });
    }
    return applyImageCheck(analysis, results);
}

/** „Importieren“ and „Exportieren“ in the header, with the file picker, the export dialog and both import dialogs. */
export function PlanFileActions() {
    const plan = useAppStore((s) => s.plan);
    const replacePlan = useAppStore((s) => s.replacePlan);
    const renamePlan = useAppStore((s) => s.renamePlan);
    const inputRef = useRef<HTMLInputElement>(null);
    const [analysis, setAnalysis] = useState<ImportSuccess | null>(null);
    const [importError, setImportError] = useState<ImportFailure | null>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportSession, setExportSession] = useState(0);

    const openExport = () => {
        setExportSession((n) => n + 1);
        setExportOpen(true);
    };

    const confirmExport = (name: string) => {
        renamePlan(name);
        setExportOpen(false);
        void exportPlan(useAppStore.getState().plan);
    };

    /** „Aktuellen Plan exportieren“ in the import dialog: under the current name, without asking. */
    const exportCurrent = () => void exportPlan(useAppStore.getState().plan);

    const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        // Reset so choosing the same file again fires `change` again. A cancelled picker fires nothing.
        input.value = "";
        if (!file) return;

        if (file.size > MAX_IMPORT_BYTES) {
            setImportError(failure(file.name, "too-large"));
            return;
        }
        let text: string;
        try {
            text = await file.text();
        } catch {
            setImportError(failure(file.name, "not-json"));
            return;
        }
        const result = analyzePlanFile(text, file.name, { now: new Date(), newId: () => crypto.randomUUID() });
        if (result.ok) setAnalysis(await checkImages(result));
        else setImportError(result);
    };

    /** Stores the file's images first (a failure only shows „Nicht gespeichert“), then replaces the plan. */
    const confirmImport = async () => {
        if (!analysis) return;
        setAnalysis(null);
        const { setImageAvailability } = useAppStore.getState();
        await Promise.all(
            [...analysis.pendingImages].map(async ([id, image]) => {
                await storeImage(id, toBlob(image));
                // Decoded during the check; also clears a „missing“ of the same image from earlier in the session.
                setImageAvailability(id, "ready");
            }),
        );
        if (!replacePlan(analysis.plan)) setImportError(failure(analysis.fileName, "not-a-plan"));
    };

    return (
        <>
            <Button variant="outline" size="sm" className="text-[13px]" onClick={() => inputRef.current?.click()}>
                <Upload strokeWidth={1.75} aria-hidden="true" />
                Importieren
            </Button>
            <Button variant="outline" size="sm" className="text-[13px]" onClick={openExport}>
                <Download strokeWidth={1.75} aria-hidden="true" />
                Exportieren
            </Button>
            <input
                ref={inputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={onFileChosen}
            />
            <ImportDialog
                analysis={analysis}
                currentPlan={plan}
                onConfirm={() => void confirmImport()}
                onExportCurrent={exportCurrent}
                onCancel={() => setAnalysis(null)}
            />
            <ExportDialog
                open={exportOpen}
                session={exportSession}
                planName={plan.name}
                onExport={confirmExport}
                onCancel={() => setExportOpen(false)}
            />
            <ImportErrorDialog failure={importError} onClose={() => setImportError(null)} />
        </>
    );
}
