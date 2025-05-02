import { z } from "zod";

export const CreateOrderAddonItemDTO = z.object({
    addon_id: z.number().int().positive("Addon ID is required"),
    quantity: z.number().int().positive("Quantity must be positive").default(1),
});

export const UpdateOrderAddonItemDTO = z.object({
    quantity: z.number().int().positive("Quantity must be positive").optional(),
    price: z.number().positive("Price must be positive").optional(),
    is_active: z.boolean().optional(),
});

export type CreateOrderAddonItemDTOType = z.infer<typeof CreateOrderAddonItemDTO>;
export type UpdateOrderAddonItemDTOType = z.infer<typeof UpdateOrderAddonItemDTO>;
