import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { Payment, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreatePayment, UpdatePayment } from "models";

@injectable()
export class PaymentRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<Payment[]> {
        return await this.prisma.payment.findMany({
            where: {
                is_active: true,
            },
            include: {
                order: {
                    select: {
                        id: true,
                        order_trx_id: true,
                        order_status: true,
                        total_amount: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                create_at: "desc",
            },
        });
    }

    async findById(id: number): Promise<Payment | null> {
        return await this.prisma.payment.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                order: {
                    select: {
                        id: true,
                        order_trx_id: true,
                        order_status: true,
                        total_amount: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findByOrderId(orderId: number): Promise<Payment[]> {
        return await this.prisma.payment.findMany({
            where: {
                order_id: orderId,
                is_active: true,
            },
            include: {
                order: {
                    select: {
                        id: true,
                        order_trx_id: true,
                        order_status: true,
                        total_amount: true,
                    },
                },
            },
            orderBy: {
                create_at: "desc",
            },
        });
    }

    async findByTransactionId(paymentTrxId: string): Promise<Payment | null> {
        return await this.prisma.payment.findFirst({
            where: {
                payment_trx_id: paymentTrxId,
                is_active: true,
            },
            include: {
                order: {
                    select: {
                        id: true,
                        order_trx_id: true,
                        order_status: true,
                        total_amount: true,
                    },
                },
            },
        });
    }

    async create(payment: CreatePayment): Promise<Payment> {
        const data = await this.prisma.payment.create({
            data: {
                ...payment,
            },
            include: {
                order: true,
            },
        });

        this.logger.info(`Payment created with ID ${data.id} for order ${payment.order_id}`);
        return data;
    }

    async update(id: number, payment: UpdatePayment): Promise<Payment | null> {
        const data = await this.prisma.payment.update({
            where: {
                id,
            },
            data: {
                ...payment,
                update_at: new Date(),
            },
            include: {
                order: true,
            },
        });

        this.logger.info(`Payment with ID ${id} updated successfully`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.payment.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                delete_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`Payment with ID ${id} soft deleted from the database`);
            return true;
        }

        this.logger.error(`Failed to delete payment with ID ${id}`);
        return false;
    }

    async getTotalPaymentsByDateRange(startDate: Date, endDate: Date): Promise<number> {
        const result = await this.prisma.payment.aggregate({
            _sum: {
                paid_amount: true,
            },
            where: {
                trx_time: {
                    gte: startDate,
                    lte: endDate,
                },
                is_active: true,
            },
        });

        return result._sum.paid_amount?.toNumber() || 0;
    }

    async getPaymentSummaryByType(): Promise<{ payment_type: string; count: number; total_amount: number }[]> {
        const summary = await this.prisma.$queryRaw<{ payment_type: string; count: string; total_amount: string }[]>`
            SELECT 
                payment_type::text as payment_type, 
                COUNT(*)::text as count,
                SUM(paid_amount)::text as total_amount
            FROM "Payment"
            WHERE is_active = true
            GROUP BY payment_type
            ORDER BY total_amount DESC
        `;

        return summary.map((item) => ({
            payment_type: item.payment_type,
            count: Number(item.count),
            total_amount: Number(item.total_amount),
        }));
    }
}
