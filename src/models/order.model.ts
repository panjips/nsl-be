import type { Order, OrderStatus, OrderType, PaymentType } from "@prisma/client";
import { CreateOrderProductItem } from "./orderProduct.model";
import { CreateOrderAddonItem } from "./orderAddon.model";

export type CreateOrder = Omit<Order, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UpdateOrder = Partial<Omit<CreateOrder, "order_trx_id">>;

export type OrderStatusUpdate = {
    order_status: OrderStatus;
};

export type OrderMapping = Partial<
    CreateOrderProductItem & {
        addons: Partial<CreateOrderAddonItem>[];
    }
>[];

export type MidtransItems = { id: string; name: string; price: number; quantity: number };

export type FilterReportStatus = {
    startDate: Date;
    endDate: Date;
    paymentType?: PaymentType;
    orderType?: OrderType;
};

export type ReportType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";

export interface RevenueReport {
    totalRevenue: number;
    orders: {
        total: number;
        count: number;
    };
    reservations: {
        total: number;
        count: number;
    };
}
