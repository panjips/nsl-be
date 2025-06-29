import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { AddonRecipeRepository, AddonRepository, InventoryRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreateAddon, UpdateAddon } from "models";

@injectable()
export class AddonService extends BaseService {
    constructor(
        @inject(TYPES.AddonRepository) private readonly addonRepository: AddonRepository,
        @inject(TYPES.AddonRecipeRepository) private readonly addonRecipeRepository: AddonRecipeRepository,
        @inject(TYPES.InventoryRepository) private readonly inventoryRepository: InventoryRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllAddons() {
        try {
            const addons = await this.addonRepository.findAll();
            return this.excludeMetaFields(addons);
        } catch (error) {
            this.logger.error(`Error getting all addons: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to retrieve addons", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAllAddonsAvailableStock() {
        try {
            const addons = await this.addonRepository.findAll();
            const result = [];

            for (const addon of addons) {
                try {
                    const stock = await this.getAddonAvailableStock(addon.id);
                    result.push(stock);
                } catch (error) {
                    this.logger.warn(
                        `Error getting available stock for addon ${addon.id}: ${error instanceof Error ? error.message : String(error)}`,
                    );
                    result.push(
                        this.excludeMetaFields({
                            ...addon,
                            available_stock: 0,
                        }),
                    );
                }
            }

            return result;
        } catch (error) {
            this.logger.error(
                `Error getting all addons available stock: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve addons available stock", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAddonAvailableStock(addonId: number) {
        try {
            const addon = await this.addonRepository.findById(addonId);

            if (!addon) {
                throw new CustomError("Addon not found", HttpStatus.NOT_FOUND);
            }

            const addonWithRecipes = await this.addonRecipeRepository.findByAddonId(addonId);

            if (!addonWithRecipes || addonWithRecipes.recipes.length === 0) {
                return {
                    ...this.excludeMetaFields(addon),
                    possible_quantity: 0,
                    message: "No recipes found for this product",
                };
            }

            let maxPossibleQuantity: number | null = null;
            let limitingIngredients: any[] = [];

            for (const recipe of addonWithRecipes.recipes) {
                const inventory = await this.inventoryRepository.findById(recipe.inventory_id);
                if (!inventory) {
                    throw new CustomError(
                        `Inventory item with ID ${recipe.inventory_id} not found`,
                        HttpStatus.NOT_FOUND,
                    );
                }

                const quantityNeeded = Number(recipe.quantity_used);
                const inventoryAvailable = Number(inventory.quantity);
                const possibleQuantity = Math.floor(inventoryAvailable / quantityNeeded);

                const ingredientInfo = {
                    inventory_id: inventory.id,
                    name: inventory.name,
                    available: inventoryAvailable,
                    unit: inventory.unit,
                    neededPerUnit: quantityNeeded,
                    possibleQuantity: possibleQuantity,
                };

                if (maxPossibleQuantity === null || possibleQuantity < maxPossibleQuantity) {
                    maxPossibleQuantity = possibleQuantity;
                    limitingIngredients = [ingredientInfo];
                } else if (possibleQuantity === maxPossibleQuantity) {
                    limitingIngredients.push(ingredientInfo);
                }
            }

            return this.excludeMetaFields({ ...addon, possible_qty: maxPossibleQuantity });
        } catch (error) {
            this.logger.error(
                `Error getting available stock for addon ${addonId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve addon stock", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAddonById(id: number) {
        try {
            const addon = await this.addonRepository.findById(id);

            if (!addon) {
                throw new CustomError("Addon not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(addon);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting addon by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve addon", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createAddon(data: CreateAddon) {
        try {
            const addon = await this.addonRepository.create(data);
            return this.excludeMetaFields(addon);
        } catch (error) {
            this.logger.error(`Error creating addon: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create addon", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateAddon(id: number, data: UpdateAddon) {
        try {
            const addon = await this.addonRepository.update(id, data);

            if (!addon) {
                throw new CustomError("Addon not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(addon);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(`Error updating addon ${id}: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to update addon", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteAddon(id: number) {
        try {
            const result = await this.addonRepository.delete(id);

            if (!result) {
                throw new CustomError("Failed to delete addon or addon not found", HttpStatus.NOT_FOUND);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(`Error deleting addon ${id}: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to delete addon", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
