import type { Category } from "@prisma/client";

export type CreateCategory = Omit<Category, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateCategory = Partial<CreateCategory & { id: number }>;
