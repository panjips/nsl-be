import { z } from "zod";

export const CreateCateringPackageDTO = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.number().positive("Price must be positive"),
    free_cup: z.number().int().optional(),
    size_unit: z.string().min(1, "Size unit is required"),
    size_volume: z.number().int().positive("Size volume must be positive"),
    quantity_cup: z.number().int().positive("Quantity cup must be positive"),
});

export const UpdateCateringPackageDTO = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().min(1, "Description is required").optional(),
    price: z.number().positive("Price must be positive").optional(),
    free_cup: z.number().int().nullish(),
    size_unit: z.string().min(1, "Size unit is required").optional(),
    size_volume: z.number().int().positive("Size volume must be positive").optional(),
    quantity_cup: z.number().int().positive("Quantity cup must be positive").optional(),
    is_active: z.boolean().optional()
});

export type CreateCateringPackageDTOType = z.infer<typeof CreateCateringPackageDTO>;
export type UpdateCateringPackageDTOType = z.infer<typeof UpdateCateringPackageDTO>;