import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { Inventory, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateInventory, CreateInventoryOpname, UpdateInventory } from "models";

@injectable()
export class InventoryRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<Inventory[]> {
        return await this.prisma.inventory.findMany({
            where: {
                is_active: true,
            },
        });
    }

    async findById(id: number): Promise<Inventory | null> {
        return await this.prisma.inventory.findFirst({
            where: {
                id,
                is_active: true,
            },
        });
    }

    async findLowStock(): Promise<Inventory[]> {
        return await this.prisma.inventory.findMany({
            where: {
                is_active: true,
                quantity: {
                    lt: this.prisma.inventory.fields.min_quantity,
                },
            },
        });
    }

    async create(inventory: CreateInventory): Promise<Inventory> {
        const data = await this.prisma.inventory.create({
            data: {
                ...inventory,
            },
        });

        this.logger.info(`Inventory item ${inventory.name} inserted to the database with ID ${data.id}`);
        return data;
    }

    async update(id: number, inventory: UpdateInventory): Promise<Inventory | null> {
        const data = await this.prisma.inventory.update({
            where: {
                id,
            },
            data: {
                ...inventory,
                updated_at: new Date(),
            },
        });

        this.logger.info(`Inventory item with ID ${id} updated in the database`);
        return data;
    }

    async createOpname(data: CreateInventoryOpname) {
        const inventory = await this.prisma.inventoryOpname.create({
            data: {
                ...data,
            },
        });

        this.logger.info(`Inventory opname created with ID ${inventory.id}`);
        return inventory;
    }

    async findAllOpnames() {
        return await this.prisma.inventoryOpname.findMany({
            where: {
                is_active: true,
            },
            include: {
                inventory: true,
            },
        });
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.inventory.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`Inventory item with ID ${id} soft deleted from the database`);
            return true;
        }

        this.logger.error(`Failed to delete inventory item with ID ${id}`);
        return false;
    }

    async inventoryLowStockCount(id: number): Promise<boolean> {
        const inventory = await this.prisma.inventory.findFirst({
            where: {
                id,
                is_active: true,
            },
        });

        if (!inventory) {
            this.logger.warn(`Inventory item with ID ${id} not found`);
            return false;
        }

        if (inventory.quantity.lte(inventory.min_quantity)) {
            this.logger.warn(
                `Inventory item with ID ${id} is low on stock: ${inventory.quantity} < ${inventory.min_quantity}`,
            );
            return true;
        } else {
            this.logger.info(
                `Inventory item with ID ${id} has sufficient stock: ${inventory.quantity} >= ${inventory.min_quantity}`,
            );
            return false;
        }
    }
}
