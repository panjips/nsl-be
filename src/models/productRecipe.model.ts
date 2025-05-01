import type { ProductRecipe } from "@prisma/client";

export type CreateProductRecipe = Omit<ProductRecipe, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateProductRecipe = Partial<CreateProductRecipe>;