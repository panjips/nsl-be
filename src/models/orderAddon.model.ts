import type { OrderAddonItem } from "@prisma/client";

export type CreateOrderAddonItem = Omit<OrderAddonItem, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateOrderAddonItem = Partial<CreateOrderAddonItem>;

export interface OrderAddonItemWithDetails extends OrderAddonItem {
    addon: {
        id: number;
        name: string;
        price: number;
    };
}