import type { ReactNode } from "react";

/** One section of the properties form: heading 11/600 in capitals, 16 px padding, line below. */
export function PropertySection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section aria-label={title} className="flex flex-col gap-3 border-b p-4">
            <h3 className="text-[11px] font-semibold tracking-[.05em] text-muted-foreground uppercase">{title}</h3>
            {children}
        </section>
    );
}

/** Two-column grid for fields. */
export function FieldGrid({ children }: { children: ReactNode }) {
    return <div className="grid grid-cols-2 gap-x-2 gap-y-3">{children}</div>;
}

/** Commit handler for a number field: returns a hint when rejected, otherwise `null`. */
export type CommitText = (text: string) => string | null;
