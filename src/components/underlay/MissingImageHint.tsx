import { ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnderlayUpload } from "@/components/underlay/useUnderlayUpload";
import type { FloorId } from "@/lib/plan-schema";

/**
 * Card in the middle of the canvas when the underlay's image is not there.
 * „Bild laden“ works like „Bild ersetzen“; around the card the canvas stays usable.
 */
export function MissingImageHint({ floorId }: { floorId: FloorId }) {
    const { pick, elements } = useUnderlayUpload(floorId);
    return (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div
                role="status"
                className="pointer-events-auto flex max-w-sm flex-col items-center gap-3 rounded-lg border bg-background px-5 py-4 text-center shadow-sm"
            >
                <ImageOff className="size-5 text-warning" strokeWidth={1.75} aria-hidden="true" />
                <p className="font-medium">Vorlage fehlt – Bild laden</p>
                <p className="text-xs leading-normal text-muted-foreground">
                    Das Bild der Vorlage ist in diesem Browser nicht vorhanden. Kalibrierung und Möbel bleiben erhalten.
                </p>
                <Button size="sm" className="text-[13px]" onClick={pick}>
                    Bild laden
                </Button>
                {elements}
            </div>
        </div>
    );
}
