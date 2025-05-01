import type { OrderProductItem, OrderAddonItem } from "@prisma/client";

export type CreateOrderProductItem = Omit<
    OrderProductItem,
    "id" | "created_at" | "updated_at" | "deleted_at" | "is_active"
>;

export type UpdateOrderProductItem = Partial<CreateOrderProductItem>;

export interface OrderProductItemWithAddons extends OrderProductItem {
    addons: OrderAddonItem[];
    product: {
        id: number;
        name: string;
        price: number;
        image_url?: string;
    };
}
