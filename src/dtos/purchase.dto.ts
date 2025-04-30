import { z } from "zod";

export const CreatePurchaseDTO = z.object({
    inventory_id: z.number().int().positive("Inventory ID is required"),
    quantity: z.number().int().positive("Quantity must be greater than 0"),
    total: z.number().nonnegative("Total must be a non-negative number").optional(),
    purchase_date: z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : new Date())),
});

export const UpdatePurchaseDTO = z.object({
    inventory_id: z.number().int().positive().optional(),
    quantity: z.number().int().positive("Quantity must be greater than 0").optional(),
    total: z.number().nonnegative("Total must be a non-negative number").optional(),
    purchase_date: z.preprocess((arg) => (typeof arg === "string" ? new Date(arg) : arg), z.date().optional()),
    is_active: z.boolean().optional(),
});

export type CreatePurchaseDTOType = z.infer<typeof CreatePurchaseDTO>;
export type UpdatePurchaseDTOType = z.infer<typeof UpdatePurchaseDTO>;
