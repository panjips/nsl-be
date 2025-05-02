import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { OrderAddonItem, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateOrderAddonItem, UpdateOrderAddonItem } from "models";

@injectable()
export class OrderAddonItemRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<OrderAddonItem[]> {
        return await this.prisma.orderAddonItem.findMany({
            where: {
                is_active: true,
            },
            include: {
                addon: true,
                order_product_item: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    async findById(id: number): Promise<OrderAddonItem | null> {
        return await this.prisma.orderAddonItem.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                addon: true,
                order_product_item: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    async findByOrderProductItemId(orderProductItemId: number): Promise<OrderAddonItem[]> {
        return await this.prisma.orderAddonItem.findMany({
            where: {
                order_product_item_id: orderProductItemId,
                is_active: true,
            },
            include: {
                addon: true,
            },
        });
    }

    async findByAddonId(addonId: number): Promise<OrderAddonItem[]> {
        return await this.prisma.orderAddonItem.findMany({
            where: {
                addon_id: addonId,
                is_active: true,
            },
            include: {
                addon: true,
                order_product_item: {
                    include: {
                        order: true,
                        product: true,
                    },
                },
            },
        });
    }

    async create(orderAddonItem: CreateOrderAddonItem): Promise<OrderAddonItem> {
        const data = await this.prisma.orderAddonItem.create({
            data: {
                ...orderAddonItem,
            },
            include: {
                addon: true,
            },
        });

        this.logger.info(
            `Order addon item created with ID ${data.id} for order product item ${orderAddonItem.order_product_item_id}`,
        );
        return data;
    }

    async createMany(orderAddonItems: CreateOrderAddonItem[]): Promise<number> {
        const result = await this.prisma.orderAddonItem.createMany({
            data: orderAddonItems,
        });

        this.logger.info(`Created ${result.count} order addon items`);
        return result.count;
    }

    async update(id: number, orderAddonItem: UpdateOrderAddonItem): Promise<OrderAddonItem | null> {
        const data = await this.prisma.orderAddonItem.update({
            where: {
                id,
            },
            data: {
                ...orderAddonItem,
                updated_at: new Date(),
            },
            include: {
                addon: true,
            },
        });

        this.logger.info(`Order addon item with ID ${id} updated successfully`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.orderAddonItem.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`Order addon item with ID ${id} soft deleted from the database`);
            return true;
        }

        this.logger.error(`Failed to delete order addon item with ID ${id}`);
        return false;
    }

    async deleteByOrderProductItemId(orderProductItemId: number): Promise<number> {
        const result = await this.prisma.orderAddonItem.updateMany({
            where: {
                order_product_item_id: orderProductItemId,
                is_active: true,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(
            `${result.count} order addon items for order product item ID ${orderProductItemId} soft deleted`,
        );
        return result.count;
    }

    async getTopSellingAddons(limit: number = 10): Promise<{ addon_id: number; addon_name: string; count: number }[]> {
        const topAddons = await this.prisma.$queryRaw<{ addon_id: number; addon_name: string; count: string }[]>`
            SELECT 
                oai.addon_id as addon_id,
                a.name as addon_name,
                COUNT(*)::text as count
            FROM "OrderAddonItem" oai
            JOIN "Addon" a ON oai.addon_id = a.id
            JOIN "OrderProductItem" opi ON oai.order_product_item_id = opi.id
            JOIN "Order" o ON opi.order_id = o.id
            WHERE oai.is_active = true
            AND o.order_status = 'COMPLETED'
            GROUP BY oai.addon_id, a.name
            ORDER BY COUNT(*) DESC
            LIMIT ${limit}
        `;

        return topAddons.map((item) => ({
            addon_id: item.addon_id,
            addon_name: item.addon_name,
            count: Number(item.count),
        }));
    }
}
