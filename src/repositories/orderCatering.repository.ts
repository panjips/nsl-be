import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { OrderCatering, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateOrderCatering } from "models";

@injectable()
export class OrderCateringRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findByReservationId(reservationId: number): Promise<OrderCatering[]> {
        return this.prisma.orderCatering.findMany({
            where: {
                reservation_id: reservationId,
                is_active: true,
            },
            include: {
                cateringPackage: true,
            },
        });
    }

    async create(data: {
        reservation_id: number;
        catering_package_id: number;
        price: number;
        free_cup?: number | null;
        size_unit: string;
        size_volume: number;
        quantity_cup: number;
    }): Promise<OrderCatering> {
        const orderCatering = await this.prisma.orderCatering.create({
            data,
            include: {
                cateringPackage: true,
            },
        });

        this.logger.info(`Created order catering with ID ${orderCatering.id}`);
        return orderCatering;
    }

    async createMany(items: CreateOrderCatering[]): Promise<{ count: number }> {
        const result = await this.prisma.orderCatering.createMany({
            data: items,
        });

        this.logger.info(`Created ${result.count} order catering items`);
        return result;
    }

    async delete(id: number): Promise<boolean> {
        await this.prisma.orderCatering.update({
            where: { id },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(`Soft deleted order catering with ID ${id}`);
        return true;
    }

    async deleteByReservationId(reservationId: number): Promise<number> {
        const items = await this.prisma.orderCatering.findMany({
            where: {
                reservation_id: reservationId,
                is_active: true,
            },
        });

        for (const item of items) {
            await this.prisma.orderCatering.update({
                where: { id: item.id },
                data: {
                    is_active: false,
                    deleted_at: new Date(),
                },
            });
        }

        this.logger.info(`Deleted ${items.length} order catering items for reservation ${reservationId}`);
        return items.length;
    }

    async permanentlyDeleteByReservationId(reservationId: number): Promise<boolean> {
        const items = await this.prisma.orderCatering.findMany({
            where: {
                reservation_id: reservationId,
            },
        });

        for (const item of items) {
            await this.prisma.orderCatering.delete({
                where: { id: item.id },
            });
        }

        this.logger.info(`Deleted ${items.length} order catering items for reservation ${reservationId}`);
        return true;
    }
}
