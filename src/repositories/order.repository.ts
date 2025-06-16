import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { Order, OrderStatus, OrderType, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateOrder, UpdateOrder } from "models";

@injectable()
export class OrderRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<Order[]> {
        return await this.prisma.order.findMany({
            where: {
                is_active: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                items: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        product: true,
                        addons: {
                            where: {
                                is_active: true,
                            },
                            include: {
                                addon: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                order_date: "desc",
            },
        });
    }

    async findAllWithFilter(status?: string, type?: string, startDate?: Date, endDate?: Date): Promise<Order[]> {
        const whereClause: any = {
            is_active: true,
        };

        if (status) {
            whereClause.order_status = status;
        }

        if (type) {
            whereClause.order_type = type;
        }

        if (startDate && endDate) {
            whereClause.order_date = {
                gte: startDate,
                lte: endDate,
            };
        } else if (startDate) {
            whereClause.order_date = {
                gte: startDate,
            };
        } else if (endDate) {
            whereClause.order_date = {
                lte: endDate,
            };
        }

        return await this.prisma.order.findMany({
            where: whereClause,
            include: {
                payment: {
                    where: {
                        is_active: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                items: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        product: true,
                        addons: {
                            where: {
                                is_active: true,
                            },
                            include: {
                                addon: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                order_date: "desc",
            },
        });
    }

    async findById(id: number) {
        return await this.prisma.order.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                items: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        product: true,
                        addons: {
                            where: {
                                is_active: true,
                            },
                            include: {
                                addon: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findByUserId(userId: number): Promise<Order[]> {
        return await this.prisma.order.findMany({
            where: {
                user_id: userId,
                is_active: true,
            },
            include: {
                payment: {
                    where: {
                        is_active: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                items: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        product: true,
                        addons: {
                            where: {
                                is_active: true,
                            },
                            include: {
                                addon: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                order_date: "desc",
            },
        });
    }

    async findByStatus(status: OrderStatus): Promise<Order[]> {
        return await this.prisma.order.findMany({
            where: {
                order_status: status,
                is_active: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                items: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        product: true,
                        addons: {
                            where: {
                                is_active: true,
                            },
                            include: {
                                addon: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                order_date: "desc",
            },
        });
    }

    async findByType(type: OrderType): Promise<Order[]> {
        return await this.prisma.order.findMany({
            where: {
                order_type: type,
                is_active: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                items: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        product: true,
                        addons: {
                            where: {
                                is_active: true,
                            },
                            include: {
                                addon: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                order_date: "desc",
            },
        });
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
        return await this.prisma.order.findMany({
            where: {
                order_date: {
                    gte: startDate,
                    lte: endDate,
                },
                is_active: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                items: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        product: true,
                        addons: {
                            where: {
                                is_active: true,
                            },
                            include: {
                                addon: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                order_date: "desc",
            },
        });
    }

    async create(order: CreateOrder): Promise<Order> {
        const data = await this.prisma.order.create({
            data: {
                ...order,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
            },
        });

        return data;
    }

    async update(id: number, order: UpdateOrder): Promise<Order | null> {
        const data = await this.prisma.order.update({
            where: {
                id,
            },
            data: {
                ...order,
                updated_at: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                items: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        product: true,
                        addons: {
                            where: {
                                is_active: true,
                            },
                            include: {
                                addon: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.info(`Order with ID ${id} updated successfully`);
        return data;
    }

    async updateStatus(id: number, status: OrderStatus): Promise<Order | null> {
        const data = await this.prisma.order.update({
            where: {
                id,
            },
            data: {
                order_status: status,
                updated_at: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                items: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        product: true,
                        addons: {
                            where: {
                                is_active: true,
                            },
                            include: {
                                addon: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.info(`Order with ID ${id} status updated to ${status}`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.order.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`Order with ID ${id} soft deleted from the database`);
            return true;
        }

        this.logger.error(`Failed to delete order with ID ${id}`);
        return false;
    }

    async countByStatus(): Promise<{ status: OrderStatus; count: number }[]> {
        const counts = await this.prisma.$queryRaw<{ status: OrderStatus; count: string }[]>`
            SELECT order_status as status, COUNT(*)::text as count
            FROM "Order"
            WHERE is_active = true
            GROUP BY order_status
        `;

        return counts.map((item) => ({
            status: item.status,
            count: Number(item.count),
        }));
    }

    async getTotalRevenueByDateRange(startDate: Date, endDate: Date): Promise<number> {
        const result = await this.prisma.order.aggregate({
            _sum: {
                total_amount: true,
            },
            where: {
                order_date: {
                    gte: startDate,
                    lte: endDate,
                },
                order_status: "COMPLETED",
                is_active: true,
            },
        });

        return result._sum.total_amount?.toNumber() || 0;
    }
}
