import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { PurchaseRepository, InventoryRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreatePurchase, UpdatePurchase } from "models";

@injectable()
export class PurchaseService extends BaseService {
    constructor(
        @inject(TYPES.PurchaseRepository) private readonly purchaseRepository: PurchaseRepository,
        @inject(TYPES.InventoryRepository) private readonly inventoryRepository: InventoryRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllPurchases() {
        try {
            const purchases = await this.purchaseRepository.findAll();
            return this.excludeMetaFields(purchases);
        } catch (error) {
            this.logger.error(
                `Error getting all purchases: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve purchases", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getPurchaseById(id: number) {
        try {
            const purchase = await this.purchaseRepository.findById(id);

            if (!purchase) {
                throw new CustomError("Purchase not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(purchase);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting purchase by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve purchase", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getPurchasesByInventoryId(inventoryId: number) {
        try {
            const inventory = await this.inventoryRepository.findById(inventoryId);
            if (!inventory) {
                throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
            }
            
            const purchases = await this.purchaseRepository.findByInventoryId(inventoryId);
            return this.excludeMetaFields(purchases);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            
            this.logger.error(
                `Error getting purchases for inventory ID ${inventoryId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve purchases", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createPurchase(data: CreatePurchase) {
        try {
            // First check if the inventory exists
            const inventory = await this.inventoryRepository.findById(data.inventory_id);
            if (!inventory) {
                throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
            }
            
            // Create the purchase
            const purchase = await this.purchaseRepository.create(data);
            
            // Update the inventory quantity
            await this.inventoryRepository.update(data.inventory_id, {
                quantity: inventory.quantity + data.quantity
            });
            
            this.logger.info(`Updated inventory ${data.inventory_id} quantity to ${inventory.quantity + data.quantity}`);
            
            return this.excludeMetaFields(purchase);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            
            this.logger.error(`Error creating purchase: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create purchase", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updatePurchase(id: number, data: UpdatePurchase) {
        try {
            // Get the current purchase to calculate inventory adjustment
            const currentPurchase = await this.purchaseRepository.findById(id);
            if (!currentPurchase) {
                throw new CustomError("Purchase not found", HttpStatus.NOT_FOUND);
            }
            
            // Check if quantity is being updated
            if (data.quantity !== undefined && data.quantity !== currentPurchase.quantity) {
                const inventory = await this.inventoryRepository.findById(currentPurchase.inventory_id);
                if (!inventory) {
                    throw new CustomError("Associated inventory item not found", HttpStatus.NOT_FOUND);
                }
                
                // Calculate the difference and update the inventory
                const quantityDifference = data.quantity - currentPurchase.quantity;
                await this.inventoryRepository.update(currentPurchase.inventory_id, {
                    quantity: inventory.quantity + quantityDifference
                });
                
                this.logger.info(`Updated inventory ${currentPurchase.inventory_id} quantity by ${quantityDifference}`);
            }
            
            // Update the purchase
            const purchase = await this.purchaseRepository.update(id, data);
            return this.excludeMetaFields(purchase);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating purchase ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update purchase", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deletePurchase(id: number) {
        try {
            // Get the purchase to adjust inventory on deletion
            const purchase = await this.purchaseRepository.findById(id);
            if (!purchase) {
                throw new CustomError("Purchase not found", HttpStatus.NOT_FOUND);
            }
            
            // Get the inventory to adjust quantity
            const inventory = await this.inventoryRepository.findById(purchase.inventory_id);
            if (inventory) {
                // Reduce the inventory quantity
                const newQuantity = Math.max(0, inventory.quantity - purchase.quantity);
                await this.inventoryRepository.update(purchase.inventory_id, {
                    quantity: newQuantity
                });
                
                this.logger.info(`Adjusted inventory ${purchase.inventory_id} quantity to ${newQuantity} after purchase deletion`);
            }
            
            // Soft delete the purchase
            const deleted = await this.purchaseRepository.delete(id);
            if (!deleted) {
                throw new CustomError("Failed to delete purchase", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting purchase ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete purchase", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}