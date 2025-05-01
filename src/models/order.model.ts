import type { Order, OrderStatus } from "@prisma/client";

export type CreateOrder = Omit<Order, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateOrder = Partial<Omit<CreateOrder, "order_trx_id">>;

export type OrderStatusUpdate = {
    order_status: OrderStatus;
};
