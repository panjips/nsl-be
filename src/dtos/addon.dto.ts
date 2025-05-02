import { z } from "zod";

export const CreateAddonDTO = z.object({
    name: z.string().min(1, "Addon name is required"),
    description: z.string().optional(),
    cost: z.number().positive("Cost must be positive"),
    price: z.number().positive("Price must be positive"),
});

export const UpdateAddonDTO = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    cost: z.number().positive("Cost must be positive").optional(),
    price: z.number().positive("Price must be positive").optional(),
    is_active: z.boolean().optional(),
});

export type CreateAddonDTOType = z.infer<typeof CreateAddonDTO>;
export type UpdateAddonDTOType = z.infer<typeof UpdateAddonDTO>;
