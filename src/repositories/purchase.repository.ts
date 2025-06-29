import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { Purchase, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreatePurchase, UpdatePurchase } from "models";

@injectable()
export class PurchaseRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  async findAll(): Promise<Purchase[]> {
    return await this.prisma.purchase.findMany({
      where: {
        is_active: true,
      },
      include: {
        inventory: true,
      },
      orderBy: {
        purchase_date: "desc",
      },
    });
  }

  async findById(id: number): Promise<Purchase | null> {
    return await this.prisma.purchase.findFirst({
      where: {
        id,
        is_active: true,
      },
      include: {
        inventory: true,
      },
    });
  }

  async findByInventoryId(inventoryId: number): Promise<Purchase[]> {
    return await this.prisma.purchase.findMany({
      where: {
        inventory_id: inventoryId,
        is_active: true,
      },
      include: {
        inventory: true,
      },
      orderBy: {
        purchase_date: "desc",
      },
    });
  }

  async create(purchase: CreatePurchase): Promise<Purchase> {
    const data = await this.prisma.purchase.create({
      data: {
        ...purchase,
      },
      include: {
        inventory: true,
      },
    });

    this.logger.info(
      `Purchase for inventory ID ${purchase.inventory_id} inserted to the database with ID ${data.id}`
    );
    return data;
  }

  async update(id: number, purchase: UpdatePurchase): Promise<Purchase | null> {
    const data = await this.prisma.purchase.update({
      where: {
        id,
      },
      data: {
        ...purchase,
        updated_at: new Date(),
      },
      include: {
        inventory: true,
      },
    });

    this.logger.info(`Purchase with ID ${id} updated in the database`);
    return data;
  }

  async delete(id: number): Promise<boolean> {
    const data = await this.prisma.purchase.update({
      where: {
        id,
      },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    });

    if (data) {
      this.logger.info(`Purchase with ID ${id} soft deleted from the database`);
      return true;
    }

    this.logger.error(`Failed to delete purchase with ID ${id}`);
    return false;
  }

  async getInventoryPurchaseReport(startDate: Date, endDate: Date) {
    return this.prisma.inventory.findMany({
      where: {
        is_active: true,
      },
      include: {
        purchases: {
          where: {
            is_active: true,
            purchase_date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });
  }

  async getPurchaseReportByRangeDate(startDate: Date, endDate: Date) {
    return this.prisma.purchase.findMany({
      where: {
        is_active: true,
        purchase_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        inventory: true,
      },
      orderBy: {
        purchase_date: "asc",
      },
    });
  }
}
