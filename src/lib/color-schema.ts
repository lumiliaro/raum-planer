import { z } from "zod";

/** `#RRGGBB`, as produced by `<input type="color">`. */
export const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
