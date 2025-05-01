import type { AddonRecipe } from "@prisma/client";

export type CreateAddonRecipe = Omit<AddonRecipe, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateAddonRecipe = Partial<CreateAddonRecipe>;