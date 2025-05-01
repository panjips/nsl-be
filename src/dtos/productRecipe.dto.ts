import { z } from "zod";

export const CreateProductRecipeDTO = z.object({
    product_id: z.number().int().positive("Product ID is required"),
    inventory_id: z.number().int().positive("Inventory ID is required"),
    quantity_used: z.number().positive("Quantity used must be positive"),
});

export const UpdateProductRecipeDTO = z.object({
    product_id: z.number().int().positive().optional(),
    inventory_id: z.number().int().positive().optional(),
    quantity_used: z.number().positive("Quantity used must be positive").optional(),
    is_active: z.boolean().optional(),
});

export type CreateProductRecipeDTOType = z.infer<typeof CreateProductRecipeDTO>;
export type UpdateProductRecipeDTOType = z.infer<typeof UpdateProductRecipeDTO>;