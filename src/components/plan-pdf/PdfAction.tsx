import { FileDown } from "lucide-react";
import { useState } from "react";
import { PdfDialog } from "@/components/plan-pdf/PdfDialog";
import { Button } from "@/components/ui/button";

/** „PDF“ in the header with the dialog „Grundriss als PDF“; each opening starts from the defaults. */
export function PdfAction() {
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState(0);

    const openDialog = () => {
        setSession((n) => n + 1);
        setOpen(true);
    };

    return (
        <>
            <Button variant="outline" size="sm" className="text-[13px]" onClick={openDialog}>
                <FileDown strokeWidth={1.75} aria-hidden="true" />
                PDF
            </Button>
            <PdfDialog open={open} session={session} onClose={() => setOpen(false)} />
        </>
    );
}
