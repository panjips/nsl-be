import { Decimal } from "@prisma/client/runtime/library";

export type CreateInventoryUsage = {
    order_id: number;
    inventory_id: number;
    quantity_used: Decimal | number;
};

export type UpdateInventoryUsage = Partial<CreateInventoryUsage>;

export interface InventoryUsageWithRelations {
    id: number;
    order_id: number;
    inventory_id: number;
    quantity_used: Decimal;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;

    inventory: {
        id: number;
        name: string;
        unit: string;
        quantity: Decimal;
    };

    order: {
        id: number;
        order_date: Date;
        order_type: string;
        order_status: string;
    };
}

export interface InventoryUsageReport {
    id: number;
    name: string;
    unit: string;
    total_quantity_used: number;
    current_stock: number;
}