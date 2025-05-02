import { z } from "zod";

export const CreateAddonRecipeDTO = z.object({
    addon_id: z.number().int().positive("Addon ID is required"),
    inventory_id: z.number().int().positive("Inventory ID is required"),
    quantity_used: z.number().positive("Quantity used must be positive"),
});

export const UpdateAddonRecipeDTO = z.object({
    addon_id: z.number().int().positive().optional(),
    inventory_id: z.number().int().positive().optional(),
    quantity_used: z.number().positive("Quantity used must be positive").optional(),
    is_active: z.boolean().optional(),
});

export type CreateAddonRecipeDTOType = z.infer<typeof CreateAddonRecipeDTO>;
export type UpdateAddonRecipeDTOType = z.infer<typeof UpdateAddonRecipeDTO>;
