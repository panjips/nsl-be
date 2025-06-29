import { z } from "zod";
import { CreateOrderAddonItemDTO } from "./orderAddon.dto";

export const CreateOrderProductItemDTO = z.object({
    product_id: z.number().int().positive("Product ID is required"),
    quantity: z.number().int().positive("Quantity must be positive").default(1),
    sugar_type: z.string().optional(),
    addons: z.array(CreateOrderAddonItemDTO).optional(),
});

export const UpdateOrderProductItemDTO = z.object({
    subtotal: z.number().positive("Subtotal must be positive").optional(),
    is_active: z.boolean().optional(),
});

export type CreateOrderProductItemDTOType = z.infer<typeof CreateOrderProductItemDTO>;
export type UpdateOrderProductItemDTOType = z.infer<typeof UpdateOrderProductItemDTO>;
