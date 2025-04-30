import { z } from "zod";

export const CreateInventoryDTO = z.object({
    name: z.string().min(1, "Inventory name is required"),
    quantity: z.number().int().default(0),
    unit: z.string().min(1, "Unit is required"),
    min_quantity: z.number().int().min(0, "Minimum quantity must be at least 0")
});

export const UpdateInventoryDTO = z.object({
    name: z.string().optional(),
    quantity: z.number().int().optional(),
    unit: z.string().optional(),
    min_quantity: z.number().int().min(0, "Minimum quantity must be at least 0").optional(),
    is_active: z.boolean().optional()
});

export type CreateInventoryDTOType = z.infer<typeof CreateInventoryDTO>;
export type UpdateInventoryDTOType = z.infer<typeof UpdateInventoryDTO>;