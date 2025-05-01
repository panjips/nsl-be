import type { Addon } from "@prisma/client";

export type CreateAddon = Omit<Addon, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateAddon = Partial<CreateAddon>;