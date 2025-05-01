import { z } from "zod";
import { OrderType, OrderStatus } from "@prisma/client";
import { CreateOrderProductItemDTO } from "./orderProduct.dto";

export const CreateOrderDTO = z.object({
    user_id: z.number().int().positive("User ID is required"),
    order_type: z.nativeEnum(OrderType).default("OFFLINE"),
    notes: z.string().optional(),
    items: z.array(CreateOrderProductItemDTO).nonempty("At least one product item is required"),
});

export const UpdateOrderDTO = z.object({
    order_status: z.nativeEnum(OrderStatus).optional(),
    notes: z.string().optional(),
    is_active: z.boolean().optional(),
});

export const UpdateOrderStatusDTO = z.object({
    order_status: z.nativeEnum(OrderStatus),
});

export type CreateOrderDTOType = z.infer<typeof CreateOrderDTO>;
export type UpdateOrderDTOType = z.infer<typeof UpdateOrderDTO>;
export type UpdateOrderStatusDTOType = z.infer<typeof UpdateOrderStatusDTO>;
