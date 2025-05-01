import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { OrderProductItem, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateOrderProductItem, UpdateOrderProductItem } from "models";

@injectable()
export class OrderProductItemRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<OrderProductItem[]> {
        return await this.prisma.orderProductItem.findMany({
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
        });
    }

    async findById(id: number): Promise<OrderProductItem | null> {
        return await this.prisma.orderProductItem.findFirst({
            where: {
                id,
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
        });
    }

    async findByOrderId(orderId: number): Promise<OrderProductItem[]> {
        return await this.prisma.orderProductItem.findMany({
            where: {
                order_id: orderId,
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
        });
    }

    async findByProductId(productId: number): Promise<OrderProductItem[]> {
        return await this.prisma.orderProductItem.findMany({
            where: {
                product_id: productId,
                is_active: true,
            },
            include: {
                order: true,
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
        });
    }

    async create(orderProductItem: CreateOrderProductItem): Promise<OrderProductItem> {
        const data = await this.prisma.orderProductItem.create({
            data: {
                ...orderProductItem,
            },
            include: {
                product: true,
            },
        });

        this.logger.info(`Order product item created with ID ${data.id} for order ${orderProductItem.order_id}`);
        return data;
    }

    async update(id: number, orderProductItem: UpdateOrderProductItem): Promise<OrderProductItem | null> {
        const data = await this.prisma.orderProductItem.update({
            where: {
                id,
            },
            data: {
                ...orderProductItem,
                updated_at: new Date(),
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
        });

        this.logger.info(`Order product item with ID ${id} updated successfully`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.orderProductItem.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`Order product item with ID ${id} soft deleted from the database`);
            return true;
        }

        this.logger.error(`Failed to delete order product item with ID ${id}`);
        return false;
    }

    async deleteByOrderId(orderId: number): Promise<number> {
        const result = await this.prisma.orderProductItem.updateMany({
            where: {
                order_id: orderId,
                is_active: true,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(`${result.count} order product items for order ID ${orderId} soft deleted`);
        return result.count;
    }

    async getTopSellingProducts(
        limit: number = 10,
    ): Promise<{ product_id: number; product_name: string; count: number }[]> {
        const topProducts = await this.prisma.$queryRaw<{ product_id: number; product_name: string; count: string }[]>`
            SELECT 
                opi.product_id as product_id,
                p.name as product_name,
                COUNT(*)::text as count
            FROM "OrderProductItem" opi
            JOIN "Product" p ON opi.product_id = p.id
            JOIN "Order" o ON opi.order_id = o.id
            WHERE opi.is_active = true
            AND o.order_status = 'COMPLETED'
            GROUP BY opi.product_id, p.name
            ORDER BY COUNT(*) DESC
            LIMIT ${limit}
        `;

        return topProducts.map((item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            count: Number(item.count),
        }));
    }
}
