import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import { TransactionStatus, type Payment, type PrismaClient } from "@prisma/client";
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
                created_at: "desc",
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
                        order_status: true,
                        total_amount: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
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
                updated_at: new Date(),
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
                deleted_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`Payment with ID ${id} soft deleted from the database`);
            return true;
        }

        this.logger.error(`Failed to delete payment with ID ${id}`);
        return false;
    }

    async findPendingPaymentsOlderThan(minutes: number) {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    return await this.prisma.payment.findMany({
        where: {
            trx_status: TransactionStatus.PENDING,
            created_at: {
                lt: cutoffTime
            },
            is_active: true
        },
        include: {
            order: {
                select: {
                    id: true,
                    order_status: true
                }
            }
        }
    });
}
}
