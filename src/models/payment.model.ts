import type { Payment } from "@prisma/client";

export type CreatePayment = Omit<Payment, "id" | "create_at" | "update_at" | "delete_at" | "is_active">;

export type UpdatePayment = Partial<CreatePayment>;

export type PaymentStatusUpdate = {
    trx_status: string;
    trx_time?: Date;
};
