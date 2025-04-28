import { z } from "zod";

export const CreateProductDTO = z.object({
    name: z.string().min(1, "Product name is required"),
    category_id: z.number().optional().nullable(),
    description: z.string().optional(),
    cost: z.number().positive("Cost must be positive"),
    price: z.number().positive("Price must be positive"),
});

export const UpdateProductDTO = z.object({
    name: z.string().optional(),
    category_id: z.number().optional().nullable(),
    description: z.string().optional(),
    cost: z.number().positive("Cost must be positive").optional(),
    price: z.number().positive("Price must be positive").optional(),
    is_active: z.boolean().optional(),
});

export type CreateProductDTOType = z.infer<typeof CreateProductDTO>;
export type UpdateProductDTOType = z.infer<typeof UpdateProductDTO>;
