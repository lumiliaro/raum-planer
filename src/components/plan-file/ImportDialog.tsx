import type { ReactNode } from "react";
import { Check, FileBraces, Minus, TriangleAlert } from "lucide-react";
import { useLastValue } from "@/components/plan-file/useLastValue";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { formatOpeningCount, formatPxPerCm, formatRoomCount, formatShapeCount } from "@/lib/format";
import { planHasContent } from "@/lib/plan";
import { COLOR_ISSUE_REASON, SETTINGS_ISSUE_REASON, WALL_ISSUE_REASON, type FilledMetadata, type ImportSuccess, type UnderlayIssue } from "@/lib/plan-import";
import type { Floor, Plan, Underlay } from "@/lib/plan-schema";

const FILLED_LABELS: Record<FilledMetadata, string> = {
    name: "Name",
    timestamps: "Zeitpunkte",
    activeFloor: "aktive Etage",
};

const TITLES: Record<ImportSuccess["relation"], string> = {
    same: "Plan importieren",
    older: "Datei aus einer älteren Version",
    newer: "Datei aus einer neueren Version",
};

type RowTone = "ok" | "warn" | "neutral";

const ROW_ICONS: Record<RowTone, ReactNode> = {
    ok: <Check className="mt-px size-4 text-success" strokeWidth={1.75} aria-hidden="true" />,
    warn: <TriangleAlert className="mt-px size-4 text-warning" strokeWidth={1.75} aria-hidden="true" />,
    neutral: <Minus className="mt-px size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />,
};

function ResultRow({ tone, title, details }: { tone: RowTone; title: string; details: string[] }) {
    return (
        <li className="flex items-start gap-2.5 border-t px-3 py-2.5">
            {ROW_ICONS[tone]}
            <div className="min-w-0">
                <div className="font-medium">{title}</div>
                {details.map((detail, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                        {detail}
                    </div>
                ))}
            </div>
        </li>
    );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Name of a floor taken over from the file, else the quoted id. */
function floorLabel(floors: readonly Floor[], floorId: string): string {
    return floors.find((f) => f.id === floorId)?.name ?? `„${floorId}“`;
}

function underlayIssueEntry(floors: readonly Floor[], { floorId, reason }: UnderlayIssue): string {
    if (floorId === null) return `Vorlagen: ${reason}`;
    return `${floorLabel(floors, floorId)}: ${reason}`;
}

/** „Bild, 0,9986 px/cm“, „ohne Bild, nicht kalibriert“, „ohne Vorlage“. */
function underlaySummary(underlay: Underlay | undefined): string {
    if (!underlay) return "ohne Vorlage";
    const image = underlay.imageId ? "Bild" : "ohne Bild";
    const scale = underlay.calibration ? `${formatPxPerCm(underlay.calibration.pxPerCm)} px/cm` : "nicht kalibriert";
    return `${image}, ${scale}`;
}

/** What of an unknown floor is not taken over: its shapes, then its rooms. */
function unknownFloorDetails(names: readonly string[], roomNames: readonly string[]): string[] {
    const details: string[] = [];
    if (names.length > 0) details.push(`Werden nicht übernommen: ${names.join(", ")}`);
    if (roomNames.length > 0) details.push(`Räume werden nicht übernommen: ${roomNames.join(", ")}`);
    return details.length > 0 ? details : ["Enthält keine Formen."];
}

function ResultRows({ analysis }: { analysis: ImportSuccess }) {
    const {
        plan,
        floors,
        countsByFloor,
        roomCountsByFloor,
        invalidFloors,
        unknownFloors,
        invalidShapes,
        invalidRooms,
        invalidOpenings,
        wallIssues,
        colorIssues,
        settingsIssues,
        openingCounts,
        underlayIssues,
        reassignedIds,
        reassignedRoomIds,
        reassignedOpeningIds,
        filledMetadata,
    } = analysis;
    const total = floors.reduce((sum, f) => sum + (countsByFloor[f.id] ?? 0), 0);
    const roomTotal = floors.reduce((sum, f) => sum + (roomCountsByFloor[f.id] ?? 0), 0);
    const withUnderlay = floors.filter((f) => plan.underlayByFloor[f.id]);

    return (
        <>
            <ResultRow
                tone="ok"
                title={`${formatShapeCount(total)} ${total === 1 ? "wird" : "werden"} übernommen`}
                details={[floors.map((f) => `${f.name} ${countsByFloor[f.id] ?? 0}`).join(" · ")]}
            />
            {roomTotal > 0 && (
                <ResultRow
                    tone="ok"
                    title={`${formatRoomCount(roomTotal)} ${roomTotal === 1 ? "wird" : "werden"} übernommen`}
                    details={[floors.map((f) => `${f.name} ${roomCountsByFloor[f.id] ?? 0}`).join(" · ")]}
                />
            )}
            {roomTotal > 0 && (
                <ResultRow
                    tone="ok"
                    title={`${formatOpeningCount(openingCounts.doors, openingCounts.windows, openingCounts.passages)} ${
                        openingCounts.doors + openingCounts.windows + openingCounts.passages === 1 ? "wird" : "werden"
                    } übernommen`}
                    details={[]}
                />
            )}
            {withUnderlay.length > 0 ? (
                <ResultRow
                    tone="ok"
                    title={`Vorlage für ${withUnderlay.length} von ${floors.length} ${floors.length === 1 ? "Etage" : "Etagen"}`}
                    details={[floors.map((f) => `${f.name} ${underlaySummary(plan.underlayByFloor[f.id])}`).join(" · ")]}
                />
            ) : (
                <ResultRow
                    tone="neutral"
                    title="Keine Vorlage"
                    details={["Alle Etagen haben nach dem Import keine Vorlage."]}
                />
            )}
            {invalidFloors.length > 0 && (
                <ResultRow
                    tone="warn"
                    title="Nicht übernommene Etagen"
                    details={invalidFloors.map(({ label, reason }) => `„${label}“: ${reason}`)}
                />
            )}
            {unknownFloors.map(({ floorId, names, roomNames }) => (
                <ResultRow
                    key={floorId}
                    tone="warn"
                    title={`Unbekannte Etage „${floorId}“ – ${formatShapeCount(names.length)}${
                        roomNames.length > 0 ? `, ${formatRoomCount(roomNames.length)}` : ""
                    }`}
                    details={unknownFloorDetails(names, roomNames)}
                />
            ))}
            {invalidShapes.length > 0 && (
                <ResultRow
                    tone="warn"
                    title={`${formatShapeCount(invalidShapes.length)} ungültig`}
                    details={invalidShapes.map(({ name, floorId, reason }) => `„${name}“ (${floorLabel(floors, floorId)}): ${reason}`)}
                />
            )}
            {invalidRooms.length > 0 && (
                <ResultRow
                    tone="warn"
                    title={`${formatRoomCount(invalidRooms.length)} ungültig`}
                    details={invalidRooms.map(({ name, floorId, reason }) => `„${name}“ (${floorLabel(floors, floorId)}): ${reason}`)}
                />
            )}
            {invalidOpenings.length > 0 && (
                <ResultRow
                    tone="warn"
                    title="Nicht übernommene Türen und Fenster"
                    details={invalidOpenings.map(
                        ({ label, roomName, floorId, reason }) => `${label} in „${roomName}“ (${floorLabel(floors, floorId)}): ${reason}`,
                    )}
                />
            )}
            {wallIssues.length > 0 && (
                <ResultRow
                    tone="warn"
                    title="Wanddicken ersetzt"
                    details={wallIssues.map(
                        ({ roomName, floorId }) => `„${roomName}“ (${floorLabel(floors, floorId)}): ${WALL_ISSUE_REASON}`,
                    )}
                />
            )}
            {colorIssues.length > 0 && (
                <ResultRow
                    tone="warn"
                    title="Raumfarben ersetzt"
                    details={colorIssues.map(
                        ({ roomName, floorId }) => `„${roomName}“ (${floorLabel(floors, floorId)}): ${COLOR_ISSUE_REASON}`,
                    )}
                />
            )}
            {settingsIssues.length > 0 && (
                <ResultRow
                    tone="warn"
                    title="Einstellungen ersetzt"
                    details={settingsIssues.map(({ label }) => `Einstellung „${label}“: ${SETTINGS_ISSUE_REASON}`)}
                />
            )}
            {underlayIssues.length > 0 && (
                <ResultRow
                    tone="warn"
                    title="Vorlagen nicht oder nur teilweise übernommen"
                    details={underlayIssues.map((entry) => underlayIssueEntry(floors, entry))}
                />
            )}
            {reassignedIds > 0 && (
                <ResultRow
                    tone="warn"
                    title={`${formatShapeCount(reassignedIds)} ${reassignedIds === 1 ? "bekommt" : "bekommen"} eine neue ID`}
                    details={[
                        reassignedIds === 1
                            ? "Die ID kam in der Datei mehrfach vor."
                            : "Ihre IDs kamen in der Datei mehrfach vor.",
                    ]}
                />
            )}
            {reassignedRoomIds > 0 && (
                <ResultRow
                    tone="warn"
                    title={`${formatRoomCount(reassignedRoomIds)} ${reassignedRoomIds === 1 ? "bekommt" : "bekommen"} eine neue ID`}
                    details={[
                        reassignedRoomIds === 1
                            ? "Die ID kam in der Datei mehrfach vor."
                            : "Ihre IDs kamen in der Datei mehrfach vor.",
                    ]}
                />
            )}
            {reassignedOpeningIds > 0 && (
                <ResultRow
                    tone="warn"
                    title={`${reassignedOpeningIds} ${
                        reassignedOpeningIds === 1 ? "Tür oder Fenster bekommt" : "Türen oder Fenster bekommen"
                    } eine neue ID`}
                    details={[
                        reassignedOpeningIds === 1
                            ? "Die ID kam in der Datei mehrfach vor."
                            : "Ihre IDs kamen in der Datei mehrfach vor.",
                    ]}
                />
            )}
            {filledMetadata.length > 0 && (
                <ResultRow
                    tone="warn"
                    title="Plan-Angaben ergänzt"
                    details={[capitalize(filledMetadata.map((m) => FILLED_LABELS[m]).join(", "))]}
                />
            )}
        </>
    );
}

function Intro({ analysis }: { analysis: ImportSuccess }) {
    const { relation, fileName, fileVersion, appVersion, plan } = analysis;
    if (relation === "same") return <>„{fileName}“ enthält die Planung „{plan.name}“.</>;
    return (
        <>
            „{fileName}“ verwendet Datenformat <strong className="font-semibold text-foreground">Version {fileVersion}</strong>,
            diese App <strong className="font-semibold text-foreground">Version {appVersion}</strong>.{" "}
            {relation === "older"
                ? "Beim Import wird die Datei automatisch umgewandelt."
                : "Angaben, die diese Version nicht kennt, gehen beim Import verloren."}
        </>
    );
}

interface ImportDialogProps {
    analysis: ImportSuccess | null;
    currentPlan: Plan;
    onConfirm: () => void;
    onExportCurrent: () => void;
    onCancel: () => void;
}

/** Result of the check before the current plan is replaced (artboard „Import“). */
export function ImportDialog({ analysis, currentPlan, onConfirm, onExportCurrent, onCancel }: ImportDialogProps) {
    const shown = useLastValue(analysis);
    const warnReplace = planHasContent(currentPlan);

    return (
        <Dialog open={analysis !== null} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent showCloseButton={false} className="gap-0 p-0 text-[13px] sm:max-w-[520px]">
                {shown && (
                    <>
                        <div className="flex gap-3.5 px-5 pt-5 pb-4">
                            {shown.hasWarnings ? (
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                                    <TriangleAlert className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                                </div>
                            ) : (
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                                    <FileBraces className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
                                </div>
                            )}
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <DialogTitle className="text-base font-semibold">{TITLES[shown.relation]}</DialogTitle>
                                <DialogDescription className="text-[13px] leading-relaxed break-words text-[#3F3F46]">
                                    <Intro analysis={shown} />
                                </DialogDescription>
                            </div>
                        </div>

                        <section
                            aria-label="Ergebnis der Prüfung"
                            className="mx-5 max-h-[40vh] overflow-y-auto rounded-lg border"
                        >
                            <div className="bg-[#FAFAFA] px-3 py-2.5 text-xs font-semibold text-[#3F3F46]">
                                Ergebnis der Prüfung
                            </div>
                            <ul>
                                <ResultRows analysis={shown} />
                            </ul>
                        </section>

                        {warnReplace && (
                            <p className="mx-5 mt-3.5 rounded-md bg-destructive/10 px-3 py-2.5 leading-normal text-destructive">
                                Dein aktueller Plan „{currentPlan.name}“ wird dabei mit allen Formen, Räumen und
                                Vorlagen ersetzt. Exportiere ihn vorher, wenn du ihn behalten willst.
                            </p>
                        )}

                        <DialogFooter className="flex-row flex-wrap px-5 pt-4 pb-5">
                            {warnReplace && (
                                <Button variant="outline" className="mr-auto text-[13px]" onClick={onExportCurrent}>
                                    Aktuellen Plan exportieren
                                </Button>
                            )}
                            <DialogClose render={<Button variant="outline" className="text-[13px]" />}>
                                Abbrechen
                            </DialogClose>
                            <Button variant="default" className="text-[13px]" onClick={onConfirm}>
                                {shown.hasWarnings ? "Trotzdem importieren" : "Importieren"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
