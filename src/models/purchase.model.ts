import type { Purchase } from "@prisma/client";

export type CreatePurchase = Omit<Purchase, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdatePurchase = Partial<CreatePurchase>;
