import { MidtransItems } from "./order.model";
import { CreateOrderAddonItem, CreateOrderProductItem } from ".";
import { Decimal } from "@prisma/client/runtime/library";

export type OrderItemData = {
    product_id: number;
    quantity: number;
    addons?: {
        addon_id: number;
        quantity: number;
    }[];
};

export type ValidatedOrderItems = {
    validatedItems: Partial<CreateOrderProductItem & { addons: Partial<CreateOrderAddonItem>[] }>[];
    totalAmount: Decimal;
    midtransItems: MidtransItems[];
};
