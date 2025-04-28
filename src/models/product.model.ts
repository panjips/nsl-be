import type { Product } from "@prisma/client";

export type CreateProduct = Omit<Product, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateProduct = Partial<CreateProduct & { id: number }>;
