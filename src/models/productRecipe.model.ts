import type { ProductRecipe, Product, SugarType } from "@prisma/client";

export type CreateProductRecipe = Omit<ProductRecipe, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateProductRecipe = Partial<CreateProductRecipe>;

export interface ProductWithRecipe extends Product {
    sugar_type?: SugarType | undefined;
    recipes: ProductRecipe[];
}
