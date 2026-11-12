import { z } from "zod";

/** A point in original pixels of the underlay image. */
export const ImagePointSchema = z.object({
    x: z.number().min(0),
    y: z.number().min(0),
});

/** Which way the measured line runs in the cm world; turns the underlay around its center. */
export const CalibrationAlignSchema = z.enum(["horizontal", "vertical"]);

/** Scale of an underlay: two image points, the real length between them and the result. */
export const CalibrationSchema = z.object({
    p1: ImagePointSchema,
    p2: ImagePointSchema,
    realLengthCm: z.number().positive(),
    /** Image pixels per cm. */
    pxPerCm: z.number().positive(),
    /** Missing = no rotation. The rotation is derived from p1, p2 and this, never stored. */
    align: CalibrationAlignSchema.optional(),
});

export type ImagePoint = z.infer<typeof ImagePointSchema>;
export type Calibration = z.infer<typeof CalibrationSchema>;
export type CalibrationAlign = z.infer<typeof CalibrationAlignSchema>;
