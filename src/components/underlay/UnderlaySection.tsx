import { ImageUp, Ruler, Trash2 } from "lucide-react";
import { useId } from "react";
import { PropertySection } from "@/components/properties/PropertySection";
import { OpacitySlider } from "@/components/properties/StyleSection";
import { Button } from "@/components/ui/button";
import { useUnderlayUpload } from "@/components/underlay/useUnderlayUpload";
import type { CalibrationAlign } from "@/lib/calibration-schema";
import { formatPxPerCm } from "@/lib/format";
import { underlayStatus } from "@/lib/underlay";
import { canCalibrate, useAppStore } from "@/store/app-store";

const ALIGN_LABELS: Record<CalibrationAlign, string> = { horizontal: "waagerecht", vertical: "senkrecht" };

const CALIBRATE_LOCKED_HINT = "Vorlage kalibrieren – zuerst ein Bild hochladen";

function InfoRow({ label, children, warn = false }: { label: string; children: string; warn?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className={warn ? "text-warning tabular-nums" : "tabular-nums"}>{children}</span>
        </div>
    );
}

/**
 * „Vorlage“ of the active floor, shown in the properties panel while no shape
 * is selected: upload, replace or remove the image, visibility (key B),
 * opacity, scale and alignment, and „Vorlage kalibrieren“.
 */
export function UnderlaySection() {
    const floorId = useAppStore((s) => s.plan.activeFloorId);
    const underlay = useAppStore((s) => s.plan.underlayByFloor[floorId]);
    const availability = useAppStore((s) =>
        underlay?.imageId ? s.imageAvailability[underlay.imageId] : undefined,
    );
    const calibratable = useAppStore(canCalibrate);
    const removeUnderlay = useAppStore((s) => s.removeUnderlay);
    const setVisible = useAppStore((s) => s.setUnderlayVisible);
    const setOpacity = useAppStore((s) => s.setUnderlayOpacity);
    const toggleCalibration = useAppStore((s) => s.toggleCalibration);
    const { pick, elements } = useUnderlayUpload(floorId);
    const visibleId = useId();

    if (!underlay) {
        return (
            <PropertySection title="Vorlage">
                <Button variant="outline" size="sm" className="self-start text-[13px]" onClick={pick}>
                    <ImageUp aria-hidden="true" />
                    Bild hochladen
                </Button>
                {elements}
            </PropertySection>
        );
    }

    const status = underlayStatus(underlay, availability);
    const { calibration } = underlay;

    return (
        <PropertySection title="Vorlage">
            <InfoRow label="Bild" warn={status === "missing"}>
                {status === "missing"
                    ? "Bild fehlt"
                    : `${underlay.imageWidthPx ?? "?"} × ${underlay.imageHeightPx ?? "?"} px`}
            </InfoRow>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-[13px]" onClick={pick}>
                    <ImageUp aria-hidden="true" />
                    Bild ersetzen
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-[13px] text-destructive hover:text-destructive"
                    onClick={() => removeUnderlay(floorId)}
                >
                    <Trash2 aria-hidden="true" />
                    Vorlage entfernen
                </Button>
            </div>
            <label htmlFor={visibleId} className="flex items-center gap-2 text-[13px]">
                <input
                    id={visibleId}
                    type="checkbox"
                    checked={underlay.visible}
                    onChange={(e) => setVisible(floorId, e.target.checked)}
                    aria-keyshortcuts="B"
                    className="size-4 accent-zinc-900"
                />
                Sichtbar <span className="text-muted-foreground">(B)</span>
            </label>
            <OpacitySlider opacity={underlay.opacity} onCommit={(opacity) => setOpacity(floorId, opacity)} />
            <InfoRow label="Maßstab" warn={!calibration}>
                {calibration ? `${formatPxPerCm(calibration.pxPerCm)} px/cm` : "nicht kalibriert"}
            </InfoRow>
            <InfoRow label="Ausrichtung">{calibration?.align ? ALIGN_LABELS[calibration.align] : "keine"}</InfoRow>
            {/* The wrapper carries the tooltip: disabled buttons show none in Firefox. */}
            <span className="self-start" title={calibratable ? undefined : CALIBRATE_LOCKED_HINT}>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-[13px]"
                    disabled={!calibratable}
                    onClick={toggleCalibration}
                >
                    <Ruler aria-hidden="true" />
                    Vorlage kalibrieren
                </Button>
            </span>
            {elements}
        </PropertySection>
    );
}
