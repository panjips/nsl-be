import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { InventoryUsage, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateInventoryUsage, UpdateInventoryUsage } from "models";
import { Decimal } from "@prisma/client/runtime/library";

@injectable()
export class InventoryUsageRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  async findAll(): Promise<InventoryUsage[]> {
    return this.prisma.inventoryUsage.findMany({
      where: {
        is_active: true,
      },
      include: {
        inventory: true,
        order: true,
      },
    });
  }

  async findById(id: number): Promise<InventoryUsage | null> {
    return this.prisma.inventoryUsage.findFirst({
      where: {
        id,
        is_active: true,
      },
      include: {
        inventory: true,
        order: true,
      },
    });
  }

  async findByOrderId(orderId: number): Promise<InventoryUsage[]> {
    return this.prisma.inventoryUsage.findMany({
      where: {
        order_id: orderId,
        is_active: true,
      },
      include: {
        inventory: true,
      },
    });
  }

  async findByInventoryId(inventoryId: number): Promise<InventoryUsage[]> {
    return this.prisma.inventoryUsage.findMany({
      where: {
        inventory_id: inventoryId,
        is_active: true,
      },
      include: {
        order: true,
      },
    });
  }

  async create(data: CreateInventoryUsage): Promise<InventoryUsage> {
    const result = await this.prisma.inventoryUsage.create({
      data: {
        order_id: data.order_id,
        inventory_id: data.inventory_id,
        quantity_used: new Decimal(data.quantity_used),
      },
      include: {
        inventory: true,
        order: true,
      },
    });

    this.logger.info(
      `Created inventory usage with ID ${result.id} for inventory ${result.inventory_id} in order ${result.order_id}`
    );
    return result;
  }

  async update(id: number, data: UpdateInventoryUsage): Promise<InventoryUsage> {
    const updateData: any = {};

    if (data.order_id !== undefined) {
      updateData.order_id = data.order_id;
    }

    if (data.inventory_id !== undefined) {
      updateData.inventory_id = data.inventory_id;
    }

    if (data.quantity_used !== undefined) {
      updateData.quantity_used = new Decimal(data.quantity_used);
    }

    const result = await this.prisma.inventoryUsage.update({
      where: { id },
      data: updateData,
      include: {
        inventory: true,
        order: true,
      },
    });

    this.logger.info(`Updated inventory usage with ID ${id}`);
    return result;
  }

  async delete(id: number): Promise<boolean> {
    await this.prisma.inventoryUsage.update({
      where: { id },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    this.logger.info(`Soft deleted inventory usage with ID ${id}`);
    return true;
  }

  async createMany(data: CreateInventoryUsage[]): Promise<number> {
    const result = await this.prisma.inventoryUsage.createMany({
      data: data.map(item => ({
        order_id: item.order_id,
        inventory_id: item.inventory_id,
        quantity_used: new Decimal(item.quantity_used),
      })),
    });

    this.logger.info(`Created ${result.count} inventory usage records`);
    return result.count;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<InventoryUsage[]> {
    return this.prisma.inventoryUsage.findMany({
      where: {
        is_active: true,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        inventory: true,
        order: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}