import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { NumberField } from "@/components/properties/NumberField";
import { FieldGrid, PropertySection, type CommitText } from "@/components/properties/PropertySection";
import type { Shape, ShapeStyle } from "@/lib/plan-schema";
import { DEFAULT_SHAPE_STYLE } from "@/lib/shape-factory";
import { findActivePreset, STYLE_PRESETS } from "@/lib/style-presets";
import { cn } from "@/lib/utils";

/** Fill of "Nur Rand" off, when the shape showed no fill this session. */
const FALLBACK_FILL = DEFAULT_SHAPE_STYLE.fill ?? "#E4E4E7";

/** Last fill shown per shape id, to restore it when "Nur Rand" is turned off. Session only, not in the plan. */
const lastFills = new Map<string, string>();

const MIN_OPACITY_PERCENT = 10;
const OPACITY_STEP_PERCENT = 5;

interface StyleSectionProps {
    shape: Shape;
    /** Replaces the style as a whole; `false` when rejected. */
    onStyleChange: (style: ShapeStyle) => boolean;
    commitStrokeWidth: CommitText;
}

/** "Darstellung": presets, fill with "Nur Rand", stroke color and width, opacity. */
export function StyleSection({ shape, onStyleChange, commitStrokeWidth }: StyleSectionProps) {
    const { style } = shape;
    const active = findActivePreset(style);
    const outlineOnlyId = useId();

    useEffect(() => {
        if (style.fill) lastFills.set(shape.id, style.fill);
    }, [shape.id, style.fill]);

    const change = (next: Partial<ShapeStyle>) => onStyleChange({ ...style, ...next });

    return (
        <PropertySection title="Darstellung">
            <div role="group" aria-label="Voreinstellungen" className="flex flex-wrap gap-1.5">
                {STYLE_PRESETS.map((preset) => {
                    const pressed = preset === active;
                    return (
                        <button
                            key={preset.id}
                            type="button"
                            title={preset.name}
                            aria-label={preset.name}
                            aria-pressed={pressed}
                            onClick={() => change({ fill: preset.fill, stroke: preset.stroke })}
                            className={cn(
                                "size-6 rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                pressed && "ring-2 ring-selection ring-offset-1",
                            )}
                            style={{
                                backgroundColor: preset.fill ?? "#FFFFFF",
                                boxShadow: `inset 0 0 0 1.5px ${preset.stroke}`,
                            }}
                        />
                    );
                })}
            </div>

            <FieldGrid>
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Füllung</span>
                    <div className="flex h-8 items-center gap-2">
                        <ColorField
                            ariaLabel="Füllfarbe ändern"
                            value={style.fill ?? lastFills.get(shape.id) ?? FALLBACK_FILL}
                            disabled={style.fill === null}
                            onCommit={(fill) => change({ fill })}
                        />
                        <label htmlFor={outlineOnlyId} className="flex items-center gap-1.5 text-[13px]">
                            <input
                                id={outlineOnlyId}
                                type="checkbox"
                                checked={style.fill === null}
                                onChange={(e) =>
                                    change({ fill: e.target.checked ? null : (lastFills.get(shape.id) ?? FALLBACK_FILL) })
                                }
                                className="size-4 accent-zinc-900"
                            />
                            Nur Rand
                        </label>
                    </div>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Rand</span>
                    <div className="flex h-8 items-center">
                        <ColorField
                            ariaLabel="Randfarbe ändern"
                            value={style.stroke}
                            onCommit={(stroke) => change({ stroke })}
                        />
                    </div>
                </div>
                <NumberField label="Randstärke" unit="px" value={style.strokeWidth} onCommit={commitStrokeWidth} />
            </FieldGrid>

            <OpacitySlider opacity={style.opacity} onCommit={(opacity) => change({ opacity })} />
        </PropertySection>
    );
}

/** Calls `handler` on the element's native event; React maps `change` of color and range inputs to `input`. */
function useNativeEvent(ref: RefObject<HTMLInputElement | null>, type: string, handler: (el: HTMLInputElement) => void) {
    const handlerRef = useRef(handler);
    useEffect(() => {
        handlerRef.current = handler;
    });
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const listener = () => handlerRef.current(el);
        el.addEventListener(type, listener);
        return () => el.removeEventListener(type, listener);
    }, [ref, type]);
}

interface ColorFieldProps {
    ariaLabel: string;
    value: string;
    disabled?: boolean;
    onCommit: (hex: string) => void;
}

/** 32 × 32 px swatch opening the browser's color picker; commits once the choice is confirmed (native `change`). */
export function ColorField({ ariaLabel, value, disabled = false, onCommit }: ColorFieldProps) {
    const ref = useRef<HTMLInputElement>(null);

    // Uncontrolled: the picker's live value must not be overwritten while it is open.
    useEffect(() => {
        if (ref.current) ref.current.value = value.toLowerCase();
    }, [value]);

    useNativeEvent(ref, "change", (el) => {
        if (el.value.toLowerCase() !== value.toLowerCase()) onCommit(el.value);
    });

    return (
        <input
            ref={ref}
            type="color"
            aria-label={ariaLabel}
            title={ariaLabel}
            defaultValue={value.toLowerCase()}
            disabled={disabled}
            className="size-8 shrink-0 cursor-pointer rounded-md border border-input bg-background p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 [&::-moz-color-swatch]:rounded-[4px] [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-[4px] [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0"
        />
    );
}

/**
 * Opacity 10–100 % in 5-% steps. The shown value follows the slider at once;
 * the shape changes on release (native `change`, also per arrow key). Values
 * below 10 % from older plans stay until the slider is moved. Also used for the underlay.
 */
export function OpacitySlider({ opacity, onCommit }: { opacity: number; onCommit: (opacity: number) => void }) {
    const id = useId();
    const ref = useRef<HTMLInputElement>(null);
    const storedPercent = Math.round(opacity * 100);
    const [dragPercent, setDragPercent] = useState<number | null>(null);
    const percent = dragPercent ?? storedPercent;

    useNativeEvent(ref, "change", (el) => {
        const next = Number(el.value);
        setDragPercent(null);
        if (next !== storedPercent) onCommit(next / 100);
    });

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
                    Deckkraft
                </label>
                <span className="text-[13px] tabular-nums">{percent} %</span>
            </div>
            <input
                ref={ref}
                id={id}
                type="range"
                min={MIN_OPACITY_PERCENT}
                max={100}
                step={OPACITY_STEP_PERCENT}
                value={Math.max(MIN_OPACITY_PERCENT, percent)}
                onChange={(e) => {
                    const next = Number(e.target.value);
                    setDragPercent(next === storedPercent ? null : next);
                }}
                aria-valuetext={`${percent} %`}
                className="w-full accent-zinc-900"
            />
        </div>
    );
}
