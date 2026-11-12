/**
 * Colors and dashes shared by the editor's canvas layers and the PDF
 * printout, so both look the same. Konva cannot read CSS variables, hence
 * the literal values.
 */

/** Room names. */
export const ROOM_LABEL_COLOR = "#52525B";
/** Door leaf and swing, window rectangle and center line. */
export const OPENING_SYMBOL_COLOR = "#27272A";
/** `--selection`. */
export const SELECTION_COLOR = "#2563EB";
/** Dash of a door's swing (openings and the furniture door), in screen px in the editor. */
export const SWING_DASH = [6, 4];
/** `fill: null` („nur Rand“): transparent, so the inside still reacts to clicks. */
export const NO_FILL = "rgba(0,0,0,0)";
/** `--grid` and `--grid-axis`. */
export const GRID_COLOR = "#E4E4E7";
export const GRID_AXIS_COLOR = "#D4D4D8";
/** Thin frame around the underlay image. */
export const UNDERLAY_FRAME_COLOR = "#E4E4E7";
