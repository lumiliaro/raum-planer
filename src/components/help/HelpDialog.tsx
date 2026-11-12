import { Tabs } from "@base-ui/react/tabs";
import { Fragment } from "react";
import { SHORTCUT_GROUPS, type ShortcutEntry } from "@/components/help/shortcuts";
import { useLastValue } from "@/components/plan-file/useLastValue";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { useAppStore, type HelpTab } from "@/store/app-store";

const TAB_CLASS =
    "-mb-px border-b-2 border-transparent px-1 pb-2 text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring data-active:border-foreground data-active:text-foreground";

/**
 * „Hilfe“ with the tabs „Tastenkürzel“ and „Datenschutz“. Open state and tab
 * live in the store (`helpTab`), so the header, the status bar and the `?` key
 * can open it on a fixed tab. Rendered once by `AppShell`.
 */
export function HelpDialog() {
    const helpTab = useAppStore((s) => s.helpTab);
    const openHelp = useAppStore((s) => s.openHelp);
    const closeHelp = useAppStore((s) => s.closeHelp);
    // Keeps the tab while the dialog animates out.
    const tab = useLastValue(helpTab) ?? "shortcuts";

    return (
        <Dialog open={helpTab !== null} onOpenChange={(next) => !next && closeHelp()}>
            <DialogContent showCloseButton={false} className="gap-0 p-0 text-[13px] sm:max-w-[520px]">
                <Tabs.Root value={tab} onValueChange={(value) => openHelp(value as HelpTab)}>
                    <div className="border-b px-5 pt-5">
                        <DialogTitle className="text-base font-semibold">Hilfe</DialogTitle>
                        <Tabs.List className="mt-4 flex gap-5">
                            <Tabs.Tab value="shortcuts" className={TAB_CLASS}>
                                Tastenkürzel
                            </Tabs.Tab>
                            <Tabs.Tab value="privacy" className={TAB_CLASS}>
                                Datenschutz
                            </Tabs.Tab>
                        </Tabs.List>
                    </div>
                    <div className="h-[60vh] max-h-[520px] overflow-y-auto">
                        <Tabs.Panel value="shortcuts" className="outline-none">
                            <ShortcutsPanel />
                        </Tabs.Panel>
                        <Tabs.Panel value="privacy" className="outline-none">
                            <PrivacyPanel />
                        </Tabs.Panel>
                    </div>
                </Tabs.Root>
                <DialogFooter className="border-t px-5 py-4">
                    <DialogClose render={<Button className="text-[13px]" />}>Schließen</DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ShortcutsPanel() {
    return (
        <div className="flex flex-col gap-5 px-5 py-4">
            {SHORTCUT_GROUPS.map((group) => (
                <section key={group.title}>
                    <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {group.title}
                    </h3>
                    <table className="w-full border-collapse">
                        <tbody>
                            {group.entries.map((entry) => (
                                <tr key={entry.keys.join("|")} className="border-b border-border/60 last:border-b-0">
                                    <td className="w-[45%] py-1.5 pr-3 align-top">
                                        <Keys entry={entry} />
                                    </td>
                                    <td className="py-1.5 align-top">{entry.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}
        </div>
    );
}

/** The key alternatives of an entry as `<kbd>`, with „oder“ between them. */
function Keys({ entry }: { entry: ShortcutEntry }) {
    return (
        <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {entry.keys.map((key, i) => (
                <Fragment key={key}>
                    {i > 0 && <span className="text-xs text-muted-foreground">oder</span>}
                    <kbd className="rounded border border-b-2 bg-muted px-1.5 py-0.5 font-sans text-xs font-medium whitespace-nowrap">
                        {key}
                    </kbd>
                </Fragment>
            ))}
        </span>
    );
}

function PrivacyPanel() {
    return (
        <div className="flex flex-col gap-3 px-5 py-4 leading-relaxed">
            <p>
                Der Raumplaner läuft vollständig in deinem Browser. Es gibt kein Konto und keinen Server, an den
                deine Daten gehen.
            </p>
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
                <li>
                    Dein Plan und deine Vorlagenbilder werden nur im Speicher dieses Browsers abgelegt. Sie werden
                    nicht an einen Server geschickt und nirgendwohin übertragen.
                </li>
                <li>
                    Jeder Browser und jedes Gerät hat einen eigenen Stand. Ein anderer Browser oder ein anderes Gerät
                    kennt deinen Plan nicht.
                </li>
                <li>
                    Der Browser kann seinen Speicher leeren, zum Beispiel beim Löschen der Browserdaten. Erstelle
                    deshalb mit „Exportieren“ regelmäßig eine Sicherungsdatei. Mit „Importieren“ holst du den Plan
                    zurück oder überträgst ihn in einen anderen Browser.
                </li>
            </ul>
        </div>
    );
}
