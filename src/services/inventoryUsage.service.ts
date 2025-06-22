import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import {
    InventoryUsageRepository,
    InventoryRepository,
    ProductRecipeRepository,
    AddonRecipeRepository,
} from "repositories";
import { CreateInventoryUsage, OrderMapping } from "models";
import { BaseService } from "./base.service";
import { Decimal } from "@prisma/client/runtime/library";

@injectable()
export class InventoryUsageService extends BaseService {
    constructor(
        @inject(TYPES.InventoryUsageRepository) private readonly inventoryUsageRepository: InventoryUsageRepository,
        @inject(TYPES.InventoryRepository) private readonly inventoryRepository: InventoryRepository,
        @inject(TYPES.ProductRecipeRepository) private readonly productRecipeRepository: ProductRecipeRepository,
        @inject(TYPES.AddonRecipeRepository) private readonly addonRecipeRepository: AddonRecipeRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllInventoryUsages() {
        try {
            const usages = await this.inventoryUsageRepository.findAll();
            return this.excludeMetaFields(usages);
        } catch (error) {
            this.logger.error(
                `Error getting all inventory usages: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve inventory usages", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createManyInventoryUsages(order_id: number, items: OrderMapping) {
        try {
            if (!items.length) {
                throw new CustomError("No inventory usage items provided", HttpStatus.BAD_REQUEST);
            }

            const inventoryUsages = await this.calculateInventoryUsage(order_id, items);

            if (inventoryUsages.length === 0) {
                this.logger.warn("No inventory usages calculated for the provided items");
                return { count: 0, success: true };
            }

            for (const usage of inventoryUsages) {
                const inventory = await this.inventoryRepository.findById(usage.inventory_id);
                if (!inventory) {
                    this.logger.warn(`Inventory with ID ${usage.inventory_id} not found`);
                    continue;
                }
                if (inventory.quantity < usage.quantity_used) {
                    this.logger.warn(
                        `Insufficient inventory for ID ${usage.inventory_id}. Required: ${usage.quantity_used}, Available: ${inventory.quantity}`,
                    );
                    throw new CustomError(
                        `Insufficient inventory for ID ${usage.inventory_id}`,
                        HttpStatus.BAD_REQUEST,
                    );
                }
                const updatedInventory = await this.inventoryRepository.update(usage.inventory_id, {
                    quantity: new Decimal(inventory.quantity).minus(usage.quantity_used),
                });
                if (!updatedInventory) {
                    this.logger.warn(`Failed to update inventory for ID ${usage.inventory_id}`);
                    throw new CustomError(
                        `Failed to update inventory for ID ${usage.inventory_id}`,
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }
                this.logger.info(
                    `Inventory for ID ${usage.inventory_id} updated successfully. New quantity: ${updatedInventory.quantity}`,
                );
            }

            const createdUsages = await this.inventoryUsageRepository.createMany(inventoryUsages);

            return {
                count: createdUsages,
                success: true,
            };
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error creating inventory usages: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to create inventory usages", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async calculateInventoryUsage(orderId: number, items: OrderMapping): Promise<CreateInventoryUsage[]> {
        try {
            if (!items || items.length === 0) {
                return [];
            }

            const inventoryUsageMap = new Map<number, number>();

            for (const item of items) {
                const productWithRecipe = await this.productRecipeRepository.findByProductId(item.product_id as number);
                if (!productWithRecipe || !productWithRecipe.recipes || productWithRecipe.recipes.length === 0) {
                    this.logger.warn(`No recipes found for product ID ${item.product_id}`);
                    continue;
                }

                for (const recipe of productWithRecipe.recipes) {
                    if (!recipe.is_active) continue;

                    const inventoryId = recipe.inventory_id;
                    const quantityPerUnit = Number(recipe.quantity_used);
                    const totalQuantity = quantityPerUnit * (item.quantity ?? 0);

                    inventoryUsageMap.set(inventoryId, (inventoryUsageMap.get(inventoryId) || 0) + totalQuantity);
                }

                if (item.addons && item.addons.length > 0) {
                    for (const addon of item.addons) {
                        const addonWithRecipe = await this.addonRecipeRepository.findByAddonId(
                            addon.addon_id as number,
                        );
                        if (!addonWithRecipe || !addonWithRecipe.recipes || addonWithRecipe.recipes.length === 0) {
                            this.logger.warn(`No recipes found for addon ID ${addon.addon_id}`);
                            continue;
                        }

                        for (const recipe of addonWithRecipe.recipes) {
                            if (!recipe.is_active) continue;

                            const inventoryId = recipe.inventory_id;
                            const quantityPerUnit = Number(recipe.quantity_used);
                            const totalQuantity = quantityPerUnit * (addon.quantity ?? 0) * (item.quantity ?? 0);

                            inventoryUsageMap.set(
                                inventoryId,
                                (inventoryUsageMap.get(inventoryId) || 0) + totalQuantity,
                            );
                        }
                    }
                }
            }

            const inventoryUsage: CreateInventoryUsage[] = [];

            inventoryUsageMap.forEach((quantityUsed, inventoryId) => {
                inventoryUsage.push({
                    order_id: orderId,
                    inventory_id: inventoryId,
                    quantity_used: quantityUsed,
                });
            });

            return inventoryUsage;
        } catch (error) {
            this.logger.error(
                `Error calculating inventory usage: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to calculate inventory usage", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
