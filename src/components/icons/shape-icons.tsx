import type { SVGProps } from "react";

/**
 * Tool icons of the further shape kinds, paths from the style guide
 * ("Stilvorlage", Werkzeug-Icons). Same props and look as the lucide icons:
 * 24 × 24, stroke in the current color, round ends; the stroke width comes
 * from `strokeWidth` or the surrounding CSS.
 */
export type ShapeIconProps = SVGProps<SVGSVGElement>;

function ShapeIcon({ children, strokeWidth = 2, ...props }: ShapeIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            {children}
        </svg>
    );
}

export function LShapeIcon(props: ShapeIconProps) {
    return (
        <ShapeIcon {...props}>
            <path d="M4 4h6v10h10v6H4z" />
        </ShapeIcon>
    );
}

export function UShapeIcon(props: ShapeIconProps) {
    return (
        <ShapeIcon {...props}>
            <path d="M4 4h5v11h6V4h5v16H4z" />
        </ShapeIcon>
    );
}

export function CornerIcon(props: ShapeIconProps) {
    return (
        <ShapeIcon {...props}>
            <path d="M4 20V4a16 16 0 0 1 16 16z" />
        </ShapeIcon>
    );
}

export function DoorIcon(props: ShapeIconProps) {
    return (
        <ShapeIcon {...props}>
            <path d="M3 20h18" />
            <path d="M5 20V5" />
            <path d="M5 5a15 15 0 0 1 15 15" strokeDasharray="2 2.5" />
        </ShapeIcon>
    );
}

export function WindowIcon(props: ShapeIconProps) {
    return (
        <ShapeIcon {...props}>
            <path d="M3 20h18" />
            <rect x="5" y="9" width="14" height="6" rx="0.5" />
            <path d="M5 12h14" />
        </ShapeIcon>
    );
}

/** Two wall pieces with an open gap between them. */
export function PassageIcon(props: ShapeIconProps) {
    return (
        <ShapeIcon {...props}>
            <rect x="2" y="9" width="7" height="6" rx="0.5" />
            <rect x="15" y="9" width="7" height="6" rx="0.5" />
        </ShapeIcon>
    );
}

/** A single straight wall piece, drawn at a slant. */
export function WallIcon(props: ShapeIconProps) {
    return (
        <ShapeIcon {...props}>
            <path d="M3 17 17 3l4 4L7 21z" />
        </ShapeIcon>
    );
}
