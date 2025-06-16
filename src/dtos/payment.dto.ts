import { z } from "zod";
import { PaymentType } from "@prisma/client";

export const CreatePaymentDTO = z.object({
    order_id: z.number().int().positive("Order ID is required"),
    payment_trx_id: z.string().optional(),
    payment_type: z.nativeEnum(PaymentType),
    trx_status: z.string().optional(),
    trx_time: z.preprocess((arg) => (typeof arg === "string" ? new Date(arg) : arg), z.date().optional()),
    paid_amount: z.number().positive("Paid amount must be greater than 0"),
});

export const UpdatePaymentDTO = z.object({
    payment_trx_id: z.string().optional(),
    payment_type: z.nativeEnum(PaymentType).optional(),
    trx_status: z.string().optional(),
    trx_time: z.preprocess((arg) => (typeof arg === "string" ? new Date(arg) : arg), z.date().optional()),
    paid_amount: z.number().positive("Paid amount must be greater than 0").optional(),
    is_active: z.boolean().optional(),
});

export const UpdatePaymentStatusDTO = z.object({
    trx_status: z.string(),
    trx_time: z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : new Date())),
});

export const MidtransNotificationSchema = z.object({
    order_id: z.string({
        required_error: "order_id is required",
    }),
    status_code: z.string({
        required_error: "status code is required",
    }),
    transaction_status: z.string({
        required_error: "transaction status is required",
    }),
    gross_amount: z.string({
        required_error: "grossAmount is required",
    }),
    fraud_status: z.string().optional(),
    payment_type: z.string().optional(),
    signature_key: z.string({
        required_error: "signature_key is required",
    }),
});

export type MidtransNotificationType = z.infer<typeof MidtransNotificationSchema>;

export type CreatePaymentDTOType = z.infer<typeof CreatePaymentDTO>;
export type UpdatePaymentDTOType = z.infer<typeof UpdatePaymentDTO>;
export type UpdatePaymentStatusDTOType = z.infer<typeof UpdatePaymentStatusDTO>;
