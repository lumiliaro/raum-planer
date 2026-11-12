import { Ruler } from "lucide-react";

export function CalibrationBanner() {
    return (
        <div
            role="status"
            className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-[#BFDBFE] bg-selection-bg px-4 py-2 text-[#1E3A8A]"
        >
            <Ruler className="size-4" strokeWidth={1.75} aria-hidden="true" />
            <span className="font-medium">Kalibrier-Modus</span>
            <span className="text-[#1E40AF]">
                Klicke zwei Punkte auf einer Strecke mit bekannter Länge. Möbel sind ausgeblendet.
            </span>
        </div>
    );
}
