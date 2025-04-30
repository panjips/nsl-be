import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { InventoryRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreateInventory, UpdateInventory } from "models";

@injectable()
export class InventoryService extends BaseService {
    constructor(
        @inject(TYPES.InventoryRepository) private readonly inventoryRepository: InventoryRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllInventory() {
        try {
            const inventory = await this.inventoryRepository.findAll();
            return this.excludeMetaFields(inventory);
        } catch (error) {
            this.logger.error(
                `Error getting all inventory items: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve inventory items", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getLowStockInventory() {
        try {
            const inventory = await this.inventoryRepository.findLowStock();
            return this.excludeMetaFields(inventory);
        } catch (error) {
            this.logger.error(
                `Error getting low stock inventory items: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve low stock inventory items", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getInventoryById(id: number) {
        try {
            const inventory = await this.inventoryRepository.findById(id);

            if (!inventory) {
                throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(inventory);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting inventory item by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve inventory item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createInventory(data: CreateInventory) {
        try {
            const inventory = await this.inventoryRepository.create(data);
            return this.excludeMetaFields(inventory);
        } catch (error) {
            this.logger.error(`Error creating inventory item: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create inventory item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateInventory(id: number, data: UpdateInventory) {
        try {
            const inventory = await this.inventoryRepository.update(id, data);

            if (!inventory) {
                throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(inventory);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating inventory item ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update inventory item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteInventory(id: number) {
        try {
            const deleted = await this.inventoryRepository.delete(id);

            if (!deleted) {
                throw new CustomError("Failed to delete inventory item or item not found", HttpStatus.NOT_FOUND);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting inventory item ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete inventory item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}