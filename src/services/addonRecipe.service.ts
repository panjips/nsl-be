import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { AddonRecipeRepository, AddonRepository, InventoryRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreateAddonRecipe, UpdateAddonRecipe } from "models";

@injectable()
export class AddonRecipeService extends BaseService {
    constructor(
        @inject(TYPES.AddonRecipeRepository) private readonly addonRecipeRepository: AddonRecipeRepository,
        @inject(TYPES.AddonRepository) private readonly addonRepository: AddonRepository,
        @inject(TYPES.InventoryRepository) private readonly inventoryRepository: InventoryRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllAddonRecipes() {
        try {
            const addonRecipes = await this.addonRecipeRepository.findAll();
            return this.excludeMetaFields(addonRecipes);
        } catch (error) {
            this.logger.error(
                `Error getting all addon recipes: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve addon recipes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAddonRecipeById(id: number) {
        try {
            const addonRecipe = await this.addonRecipeRepository.findById(id);

            if (!addonRecipe) {
                throw new CustomError("Addon recipe not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(addonRecipe);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting addon recipe by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve addon recipe", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAddonRecipesByAddonId(addonId: number) {
        try {
            const addon = await this.addonRepository.findById(addonId);
            if (!addon) {
                throw new CustomError("Addon not found", HttpStatus.NOT_FOUND);
            }

            const addonRecipes = await this.addonRecipeRepository.findByAddonId(addonId);
            return this.excludeMetaFields(addonRecipes);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting addon recipes by addon ID ${addonId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve addon recipes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAddonRecipesByInventoryId(inventoryId: number) {
        try {
            const inventory = await this.inventoryRepository.findById(inventoryId);
            if (!inventory) {
                throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
            }

            const addonRecipes = await this.addonRecipeRepository.findByInventoryId(inventoryId);
            return this.excludeMetaFields(addonRecipes);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting addon recipes by inventory ID ${inventoryId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve addon recipes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createAddonRecipe(data: CreateAddonRecipe) {
        try {
            const addon = await this.addonRepository.findById(data.addon_id);
            if (!addon) {
                throw new CustomError("Addon not found", HttpStatus.NOT_FOUND);
            }

            const inventory = await this.inventoryRepository.findById(data.inventory_id);
            if (!inventory) {
                throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
            }

            const addonRecipe = await this.addonRecipeRepository.create(data);
            return this.excludeMetaFields(addonRecipe);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(`Error creating addon recipe: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create addon recipe", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateAddonRecipe(id: number, data: UpdateAddonRecipe) {
        try {
            const existingRecipe = await this.addonRecipeRepository.findById(id);
            if (!existingRecipe) {
                throw new CustomError("Addon recipe not found", HttpStatus.NOT_FOUND);
            }

            if (data.addon_id) {
                const addon = await this.addonRepository.findById(data.addon_id);
                if (!addon) {
                    throw new CustomError("Addon not found", HttpStatus.NOT_FOUND);
                }
            }

            if (data.inventory_id) {
                const inventory = await this.inventoryRepository.findById(data.inventory_id);
                if (!inventory) {
                    throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
                }
            }

            const addonRecipe = await this.addonRecipeRepository.update(id, data);
            return this.excludeMetaFields(addonRecipe);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating addon recipe ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update addon recipe", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteAddonRecipe(id: number) {
        try {
            const result = await this.addonRecipeRepository.delete(id);

            if (!result) {
                throw new CustomError("Failed to delete addon recipe or recipe not found", HttpStatus.NOT_FOUND);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting addon recipe ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete addon recipe", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteAddonRecipesByAddonId(addonId: number) {
        try {
            const addon = await this.addonRepository.findById(addonId);
            if (!addon) {
                throw new CustomError("Addon not found", HttpStatus.NOT_FOUND);
            }

            const count = await this.addonRecipeRepository.deleteByAddonId(addonId);
            return { success: true, count };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting addon recipes for addon ${addonId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete addon recipes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
