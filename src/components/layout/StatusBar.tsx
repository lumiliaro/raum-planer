import { Check } from "lucide-react";
import { formatPxPerCm } from "@/lib/format";
import { underlayStatus } from "@/lib/underlay";
import { useAppStore, type SaveStatus } from "@/store/app-store";

const NOT_SAVED_REASON: Record<Exclude<SaveStatus, "saved">, string> = {
    failed: "Der Browser-Speicher ist voll oder blockiert.",
    suspended:
        "Der gespeicherte Plan konnte nicht gesichert werden. Änderungen werden in dieser Sitzung nicht gespeichert.",
};

const IMAGES_NOT_SAVED_REASON = "Vorlagenbilder können in diesem Browser nicht gespeichert werden.";

/** Underlay status of the active floor: none, missing, not calibrated or the scale. */
function UnderlayStatusText() {
    const underlay = useAppStore((s) => s.plan.underlayByFloor[s.plan.activeFloorId]);
    const availability = useAppStore((s) => (underlay?.imageId ? s.imageAvailability[underlay.imageId] : undefined));
    switch (underlayStatus(underlay, availability)) {
        case "none":
            return <span>Keine Vorlage</span>;
        case "missing":
            return <span className="text-warning">Vorlage fehlt</span>;
        case "uncalibrated":
            return <span className="text-warning">Vorlage nicht kalibriert</span>;
        case "calibrated":
            return <span>Maßstab: {formatPxPerCm(underlay!.calibration!.pxPerCm)} px/cm</span>;
    }
}

export function StatusBar() {
    const planStatus = useAppStore((s) => s.saveStatus);
    const imagesFailed = useAppStore((s) => s.imageStoreStatus === "failed");
    const reason = planStatus !== "saved" ? NOT_SAVED_REASON[planStatus] : imagesFailed ? IMAGES_NOT_SAVED_REASON : null;

    return (
        <footer className="flex h-7 shrink-0 items-center gap-5 border-t bg-muted/50 px-4 text-xs text-muted-foreground tabular-nums">
            <UnderlayStatusText />
            {reason === null ? (
                <span className="ml-auto inline-flex items-center gap-1 text-success">
                    <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    Lokal gespeichert
                </span>
            ) : (
                <span className="ml-auto text-warning" title={reason}>
                    Nicht gespeichert
                </span>
            )}
        </footer>
    );
}
