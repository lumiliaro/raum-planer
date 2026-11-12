import { Check, Save } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { computeCalibration, gridPxPerMeter, parseLengthCm } from "@/lib/calibration";
import type { CalibrationAlign, ImagePoint } from "@/lib/calibration-schema";
import { formatDegrees, formatImageCoord, formatPxPerCm } from "@/lib/format";
import { underlayRotationDeg } from "@/lib/underlay";
import { cn } from "@/lib/utils";
import { selectFloorName, useAppStore } from "@/store/app-store";

export function CalibrationPanel() {
    const floorName = useAppStore((s) => selectFloorName(s, s.plan.activeFloorId));
    const draft = useAppStore((s) => s.calibrationDraft);
    const resetPoints = useAppStore((s) => s.resetCalibrationPoints);
    const setLength = useAppStore((s) => s.setCalibrationLength);
    const setAlign = useAppStore((s) => s.setCalibrationAlign);
    const save = useAppStore((s) => s.saveCalibration);
    const lengthId = useId();
    const lengthHintId = useId();

    if (!draft) return null;

    const { p1, p2, lengthText, align } = draft;
    const lengthCm = parseLengthCm(lengthText);
    const lengthInvalid = lengthText.trim() !== "" && lengthCm === null;
    const result = p1 && p2 && lengthCm !== null ? computeCalibration(p1, p2, lengthCm, align) : null;
    // The rotation needs only the points; the length does not matter for it.
    const rotationDeg =
        p1 && p2 ? underlayRotationDeg({ p1, p2, realLengthCm: 1, pxPerCm: 1, ...(align ? { align } : {}) }) : null;
    const pointsCoincide = !!p1 && !!p2 && p1.x === p2.x && p1.y === p2.y;

    return (
        <aside aria-label="Kalibrierung" className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-l bg-background">
            <Section>
                <h2 className="text-sm font-semibold">{floorName} kalibrieren</h2>
                <p className="leading-normal text-muted-foreground">
                    Wähle eine möglichst lange Strecke, deren Länge du sicher kennst – z. B. eine Außenwand aus dem
                    Bauplan.
                </p>
            </Section>

            <Section>
                <PointStep number={1} point={p1} current={!p1} />
                <PointStep number={2} point={p2} current={!!p1 && !p2} />
                <div className="flex items-start gap-2.5">
                    <StepDot number={3} state={p1 && p2 ? "current" : "pending"} />
                    <div className="flex flex-1 flex-col gap-1.5">
                        <label htmlFor={lengthId} className="font-medium">
                            Reale Länge der Strecke
                        </label>
                        <div className="relative">
                            <input
                                id={lengthId}
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                value={lengthText}
                                onChange={(e) => setLength(e.target.value)}
                                aria-invalid={lengthInvalid || undefined}
                                aria-describedby={lengthInvalid ? lengthHintId : undefined}
                                className="h-8 w-full rounded-md border border-input bg-background pr-8 pl-2 text-[13px] tabular-nums outline-none focus-visible:border-selection focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
                            />
                            <span className="pointer-events-none absolute top-2 right-2 text-xs text-zinc-500">cm</span>
                        </div>
                        {lengthInvalid && (
                            <p id={lengthHintId} className="text-xs text-destructive">
                                Bitte eine Länge größer als 0 cm eingeben.
                            </p>
                        )}
                    </div>
                </div>
                <AlignGroup align={align} rotationDeg={rotationDeg} onChange={setAlign} />
                <Button
                    variant="outline"
                    size="sm"
                    className="self-start text-[13px]"
                    disabled={!p1 && !p2}
                    onClick={resetPoints}
                >
                    Punkte neu setzen
                </Button>
            </Section>

            <Section last>
                <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Ergebnis</h3>
                {result ? (
                    <>
                        <ResultRow label="pxPerCm">
                            <span className="font-semibold">{formatPxPerCm(result.pxPerCm)}</span>
                        </ResultRow>
                        <ResultRow label="Raster 1 m entspricht">
                            {formatImageCoord(gridPxPerMeter(result))} px
                        </ResultRow>
                    </>
                ) : (
                    <p className="leading-normal text-muted-foreground">
                        {pointsCoincide
                            ? "Punkt 1 und Punkt 2 liegen aufeinander – bitte einen Punkt verschieben."
                            : "Setze zwei Punkte und gib die reale Länge ein."}
                    </p>
                )}
                <Button size="sm" className="mt-1 text-[13px]" disabled={!result} onClick={save}>
                    <Save aria-hidden="true" />
                    Kalibrierung speichern
                </Button>
                <p className="text-xs leading-normal text-muted-foreground">
                    Die Kalibrierung wird im Browser gespeichert. Möbel bleiben in cm – ein neuer Maßstab oder eine
                    Ausrichtung verändert nur die Lage der Vorlage darunter.
                </p>
            </Section>
        </aside>
    );
}

function Section({ last = false, children }: { last?: boolean; children: ReactNode }) {
    return <div className={cn("flex flex-col gap-3 p-4", !last && "border-b")}>{children}</div>;
}

type StepState = "done" | "current" | "pending";

function StepDot({ number, state }: { number: number; state: StepState }) {
    return (
        <span
            className={cn(
                "inline-flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                state === "done" && "bg-[#DCFCE7] text-[#166534]",
                state === "current" && "bg-selection text-white",
                state === "pending" && "bg-muted text-muted-foreground",
            )}
        >
            {state === "done" ? (
                <>
                    <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />
                    <span className="sr-only">erledigt</span>
                </>
            ) : (
                number
            )}
        </span>
    );
}

function PointStep({ number, point, current }: { number: number; point: ImagePoint | null; current: boolean }) {
    return (
        <div className="flex items-start gap-2.5">
            <StepDot number={number} state={point ? "done" : current ? "current" : "pending"} />
            <div>
                <div className="font-medium">{point ? `Punkt ${number} gesetzt` : `Punkt ${number} setzen`}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                    {point
                        ? `x ${formatImageCoord(point.x)} · y ${formatImageCoord(point.y)} px`
                        : "Auf die Vorlage klicken"}
                </div>
            </div>
        </div>
    );
}

const ALIGN_OPTIONS: { value: CalibrationAlign | null; label: string }[] = [
    { value: null, label: "Keine" },
    { value: "horizontal", label: "Strecke ist waagerecht" },
    { value: "vertical", label: "Strecke ist senkrecht" },
];

interface AlignGroupProps {
    align: CalibrationAlign | null;
    /** Resulting rotation of the underlay; `null` until both points are set. */
    rotationDeg: number | null;
    onChange: (align: CalibrationAlign | null) => void;
}

/** „Ausrichtung“: turns the underlay around its center so the line lies horizontal or vertical. */
function AlignGroup({ align, rotationDeg, onChange }: AlignGroupProps) {
    const name = useId();
    return (
        <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 font-medium">Ausrichtung</legend>
            {ALIGN_OPTIONS.map((option) => (
                <label key={option.label} className="flex items-center gap-2">
                    <input
                        type="radio"
                        name={name}
                        checked={align === option.value}
                        onChange={() => onChange(option.value)}
                        className="size-4 accent-zinc-900"
                    />
                    {option.label}
                </label>
            ))}
            {rotationDeg !== null && (
                <p className="text-xs text-muted-foreground tabular-nums">Drehung {formatDegrees(rotationDeg)}</p>
            )}
        </fieldset>
    );
}

function ResultRow({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="tabular-nums">{children}</span>
        </div>
    );
}
