import { Popover } from "@base-ui/react/popover";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TUTORIAL_STEPS, type TutorialTarget } from "@/components/tutorial/tutorial-steps";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

/** Gap between the target and the highlight ring, in px. */
const RING_GAP = 4;

interface TargetBox {
    target: TutorialTarget;
    element: Element;
    rect: DOMRect;
}

const sameRect = (a: DOMRect, b: DOMRect) =>
    a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;

/**
 * The element marked `data-tutorial="<target>"` and its position, or `null`
 * when it is not on the page or has no area. Re-checked when the DOM, the
 * element's size or the window size changes.
 */
function useTargetBox(target: TutorialTarget | null): TargetBox | null {
    const [box, setBox] = useState<TargetBox | null>(null);

    useLayoutEffect(() => {
        if (!target) return;
        let observed: Element | null = null;
        const update = () => {
            const element = document.querySelector(`[data-tutorial="${target}"]`);
            if (element !== observed) {
                if (observed) resizeObserver.unobserve(observed);
                if (element) resizeObserver.observe(element);
                observed = element;
            }
            const rect = element?.getBoundingClientRect();
            const next = element && rect && rect.width > 0 && rect.height > 0 ? { target, element, rect } : null;
            setBox((prev) =>
                prev && next && prev.element === next.element && sameRect(prev.rect, next.rect) ? prev : next,
            );
        };
        const resizeObserver = new ResizeObserver(update);
        // Panels, sections and buttons come and go (selection, panel toggle, calibration mode).
        const mutationObserver = new MutationObserver(update);
        mutationObserver.observe(document.body, { childList: true, subtree: true });
        window.addEventListener("resize", update);
        update();
        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            window.removeEventListener("resize", update);
        };
    }, [target]);

    // A box left over from the previous step's target does not count.
    return box && box.target === target ? box : null;
}

/**
 * Side of the bubble: below header targets, above the status bar, right of
 * the tool bar, otherwise left (properties panel).
 */
function sideFor(rect: DOMRect): "top" | "bottom" | "left" | "right" {
    if (rect.bottom < 120) return "bottom";
    if (rect.top > window.innerHeight - 80) return "top";
    if (rect.right < 120) return "right";
    return "left";
}

/** Zero-size anchor at the center of the canvas (`<main>`), or of the window as a last resort. */
const canvasCenter = {
    getBoundingClientRect: () => {
        const area = document.querySelector("main")?.getBoundingClientRect();
        const x = area ? area.left + area.width / 2 : window.innerWidth / 2;
        const y = area ? area.top + area.height / 2 : window.innerHeight / 2;
        return DOMRect.fromRect({ x, y, width: 0, height: 0 });
    },
};

/**
 * The tutorial: a ring around the current step's target and a speech bubble
 * next to it (centered over the canvas without a target). It only explains –
 * it neither blocks the page nor changes the plan. Rendered once by `AppShell`,
 * below the dialogs.
 */
export function TutorialCoach() {
    const stepIndex = useAppStore((s) => s.tutorialStep);
    const next = useAppStore((s) => s.nextTutorialStep);
    const prev = useAppStore((s) => s.prevTutorialStep);
    const end = useAppStore((s) => s.endTutorial);
    const step = stepIndex === null ? null : TUTORIAL_STEPS[stepIndex];
    const box = useTargetBox(step?.target ?? null);
    const popupRef = useRef<HTMLDivElement>(null);
    const primaryRef = useRef<HTMLButtonElement>(null);

    // Focus „Weiter“/„Fertig“ on every step, so Enter and Esc work right away.
    useEffect(() => {
        if (stepIndex === null) return;
        // After the positioner has placed the popup; focusing earlier would scroll to its initial spot.
        const frame = requestAnimationFrame(() => primaryRef.current?.focus({ preventScroll: true }));
        return () => cancelAnimationFrame(frame);
    }, [stepIndex]);

    if (stepIndex === null || !step) return null;

    const first = stepIndex === 0;
    const last = stepIndex === TUTORIAL_STEPS.length - 1;

    return (
        <>
            {box && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed z-40 rounded-lg ring-2 ring-selection ring-offset-0 transition-[left,top,width,height] duration-150"
                    style={{
                        left: box.rect.left - RING_GAP,
                        top: box.rect.top - RING_GAP,
                        width: box.rect.width + 2 * RING_GAP,
                        height: box.rect.height + 2 * RING_GAP,
                    }}
                />
            )}
            <Popover.Root
                open
                modal={false}
                onOpenChange={(open, details) => {
                    // Clicks elsewhere and focus leaving the bubble keep the tutorial open; only Esc in the bubble ends it.
                    if (
                        !open &&
                        details.reason === "escape-key" &&
                        popupRef.current?.contains(document.activeElement)
                    ) {
                        end();
                    }
                }}
            >
                <Popover.Portal>
                    <Popover.Positioner
                        anchor={box?.element ?? canvasCenter}
                        side={box ? sideFor(box.rect) : "bottom"}
                        align="center"
                        // Without a target: move up by half the bubble's height, so it sits centered.
                        sideOffset={box ? RING_GAP + 10 : ({ positioner }) => -positioner.height / 2}
                        collisionPadding={12}
                        className="z-40"
                    >
                        <Popover.Popup
                            ref={popupRef}
                            initialFocus={primaryRef}
                            finalFocus={false}
                            className="flex w-[340px] flex-col gap-3 rounded-xl bg-popover p-4 text-[13px] text-popover-foreground shadow-lg ring-1 ring-foreground/10 outline-none"
                        >
                            <Popover.Title className="text-sm font-semibold">{step.title}</Popover.Title>
                            <Popover.Description render={<div />} className="flex flex-col gap-2 leading-relaxed">
                                {step.text.map((paragraph) => (
                                    <p key={paragraph}>{paragraph}</p>
                                ))}
                            </Popover.Description>
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    Schritt {stepIndex + 1} von {TUTORIAL_STEPS.length}
                                </span>
                                <div className="ml-auto flex items-center gap-1.5">
                                    {!last && (
                                        <Button variant="ghost" size="sm" className="text-[13px]" onClick={end}>
                                            Überspringen
                                        </Button>
                                    )}
                                    {!first && (
                                        <Button variant="outline" size="sm" className="text-[13px]" onClick={prev}>
                                            Zurück
                                        </Button>
                                    )}
                                    <Button
                                        ref={primaryRef}
                                        size="sm"
                                        className="text-[13px]"
                                        onClick={last ? end : next}
                                    >
                                        {last ? "Fertig" : "Weiter"}
                                    </Button>
                                </div>
                            </div>
                        </Popover.Popup>
                    </Popover.Positioner>
                </Popover.Portal>
            </Popover.Root>
        </>
    );
}
