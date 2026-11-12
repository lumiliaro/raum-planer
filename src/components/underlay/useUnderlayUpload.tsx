import { ImageOff, TriangleAlert } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useLastValue } from "@/components/plan-file/useLastValue";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { READ_IMAGE_MESSAGES, readImageFile, type ReadImageError } from "@/components/underlay/read-image";
import type { FloorId } from "@/lib/plan-schema";
import { needsCalibrationReset, type UnderlayImage } from "@/lib/underlay";
import { storeImage } from "@/storage/image-cache";
import { useAppStore } from "@/store/app-store";

const ACCEPT = "image/png,image/jpeg,image/webp";

interface PendingReset {
    image: UnderlayImage;
    blob: Blob;
    oldSize: string;
}

const pixelSize = (width: number | null, height: number | null) => `${width ?? "?"} × ${height ?? "?"} px`;

/**
 * Upload or replace the underlay image of a floor: file picker, check
 * (`readImageFile`), the question „Kalibrierung zurücksetzen?“ for other pixel
 * sizes and the hint for a rejected file. `elements` (hidden input and
 * dialogs) must be rendered by the caller. Panel and canvas hint share it.
 */
export function useUnderlayUpload(floorId: FloorId): { pick: () => void; elements: ReactNode } {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<ReadImageError | null>(null);
    const [pending, setPending] = useState<PendingReset | null>(null);
    const shownError = useLastValue(error);
    const shownPending = useLastValue(pending);

    const apply = (image: UnderlayImage, blob: Blob, resetCalibration: boolean) => {
        // Into the session cache first (synchronously inside `storeImage`), so the canvas finds it at once.
        void storeImage(image.id, blob);
        useAppStore.getState().applyUnderlayImage(floorId, image, { resetCalibration });
    };

    const onFile = async (file: File) => {
        const result = await readImageFile(file);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        const { blob, ok: _ok, ...image } = result;
        const { plan, imageAvailability } = useAppStore.getState();
        const current = plan.underlayByFloor[floorId];
        const imageMissing = !!current?.imageId && imageAvailability[current.imageId] === "missing";
        if (current && needsCalibrationReset(current, image, { imageMissing })) {
            setPending({ image, blob, oldSize: pixelSize(current.imageWidthPx, current.imageHeightPx) });
        } else {
            apply(image, blob, false);
        }
    };

    const elements = (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                hidden
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    // Allow choosing the same file again.
                    e.target.value = "";
                    if (file) void onFile(file);
                }}
            />
            <Dialog open={error !== null} onOpenChange={(open) => !open && setError(null)}>
                <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-[440px]">
                    {shownError && (
                        <>
                            <div className="flex gap-3.5 px-5 pt-5 pb-4">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                    <ImageOff className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <DialogTitle className="text-base font-semibold">Bild nicht übernommen</DialogTitle>
                                    <DialogDescription className="text-[13px] leading-relaxed text-[#3F3F46]">
                                        {READ_IMAGE_MESSAGES[shownError]}
                                    </DialogDescription>
                                </div>
                            </div>
                            <DialogFooter className="px-5 pt-0 pb-5">
                                <Button className="text-[13px]" onClick={() => setError(null)}>
                                    Schließen
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
                <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-[440px]">
                    {shownPending && (
                        <>
                            <div className="flex gap-3.5 px-5 pt-5 pb-4">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                                    <TriangleAlert className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <DialogTitle className="text-base font-semibold">Kalibrierung zurücksetzen?</DialogTitle>
                                    <DialogDescription className="text-[13px] leading-relaxed text-[#3F3F46]">
                                        Das neue Bild hat {pixelSize(shownPending.image.widthPx, shownPending.image.heightPx)},
                                        das bisherige {shownPending.oldSize}. Die Kalibrierung passt dann nicht mehr und
                                        wird zurückgesetzt; danach startet der Kalibrier-Modus.
                                    </DialogDescription>
                                </div>
                            </div>
                            <DialogFooter className="px-5 pt-0 pb-5">
                                <DialogClose render={<Button variant="outline" className="text-[13px]" />}>
                                    Abbrechen
                                </DialogClose>
                                <Button
                                    className="text-[13px]"
                                    onClick={() => {
                                        if (pending) apply(pending.image, pending.blob, true);
                                        setPending(null);
                                    }}
                                >
                                    Zurücksetzen und ersetzen
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );

    return { pick: () => inputRef.current?.click(), elements };
}
