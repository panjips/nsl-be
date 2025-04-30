import type { Inventory } from "@prisma/client";

export type CreateInventory = Omit<Inventory, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateInventory = Partial<CreateInventory>;