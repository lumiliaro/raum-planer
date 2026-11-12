import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, type RecoveryNotice } from "@/store/app-store";

const MESSAGES: Record<NonNullable<RecoveryNotice>, string> = {
    "backed-up":
        "Der gespeicherte Plan konnte nicht gelesen werden. Es wurde ein leerer Plan begonnen; die alten Daten sind im Browser gesichert.",
    "backup-failed":
        "Der gespeicherte Plan konnte nicht gelesen und nicht gesichert werden. Damit nichts verloren geht, werden Änderungen in dieser Sitzung nicht gespeichert.",
};

/** Shown under the header while the stored plan had to be replaced at start. */
export function PlanRecoveryBanner() {
    const notice = useAppStore((s) => s.recoveryNotice);
    const dismiss = useAppStore((s) => s.dismissRecoveryNotice);

    if (!notice) return null;

    return (
        <div
            role="alert"
            className="flex shrink-0 items-center gap-2.5 border-b border-[#FDE68A] bg-[#FFFBEB] px-4 py-1.5 text-warning"
        >
            <TriangleAlert className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="flex-1 leading-normal">{MESSAGES[notice]}</span>
            <Button
                variant="ghost"
                size="sm"
                className="text-[13px] text-warning hover:bg-[#FEF3C7] hover:text-warning"
                onClick={dismiss}
            >
                Schließen
            </Button>
        </div>
    );
}
