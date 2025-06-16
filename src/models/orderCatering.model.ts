import { OrderCatering } from "@prisma/client";

export type CreateOrderCatering = Omit<OrderCatering, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;
