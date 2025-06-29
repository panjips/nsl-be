import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { ProductRecipeRepository, ProductRepository, InventoryRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreateProductRecipe, UpdateProductRecipe } from "models";
import { SugarType } from "@prisma/client";

@injectable()
export class ProductRecipeService extends BaseService {
    constructor(
        @inject(TYPES.ProductRecipeRepository) private readonly productRecipeRepository: ProductRecipeRepository,
        @inject(TYPES.ProductRepository) private readonly productRepository: ProductRepository,
        @inject(TYPES.InventoryRepository) private readonly inventoryRepository: InventoryRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllProductRecipes() {
        try {
            const productRecipes = await this.productRecipeRepository.findAllWithInventoryAndProduct();
            return this.transformProductRecipes(productRecipes);
        } catch (error) {
            this.logger.error(
                `Error getting all product recipes: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve product recipes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async transformProductRecipes(productRecipes: any[]) {
        const transformedRecipes: any[] = [];

        for (const recipe of productRecipes) {
            const existingProduct = transformedRecipes.find((r) => {
                return r.id === recipe.product.id && this.checkIsHaveSameSugarType(r.recipes, recipe.sugar_type);
            });

            if (existingProduct) {
                const recipeWithInventory = {
                    id: recipe.id,
                    product_id: recipe.product_id,
                    inventory_id: recipe.inventory_id,
                    quantity_used: recipe.quantity_used,
                    sugar_type: recipe.sugar_type,
                    is_active: recipe.is_active,
                    inventory: {
                        id: recipe.inventory.id,
                        name: recipe.inventory.name,
                        quantity: recipe.inventory.quantity,
                        unit: recipe.inventory.unit,
                        min_quantity: recipe.inventory.min_quantity,
                        is_active: recipe.inventory.is_active,
                    },
                };

                existingProduct.recipes.push(recipeWithInventory);
            } else {
                transformedRecipes.push({
                    ...recipe.product,
                    recipes: [
                        {
                            id: recipe.id,
                            product_id: recipe.product_id,
                            inventory_id: recipe.inventory_id,
                            quantity_used: recipe.quantity_used,
                            sugar_type: recipe.sugar_type,
                            is_active: recipe.is_active,
                            inventory: {
                                id: recipe.inventory.id,
                                name: recipe.inventory.name,
                                quantity: recipe.inventory.quantity,
                                unit: recipe.inventory.unit,
                                min_quantity: recipe.inventory.min_quantity,
                                is_active: recipe.inventory.is_active,
                            },
                        },
                    ],
                });
            }
        }

        return transformedRecipes;
    }

    checkIsHaveSameSugarType(data: any[], sugarType: string) {
        return data.every((item) => item.sugar_type === sugarType);
    }

    async getProductRecipeById(id: number) {
        try {
            const productRecipe = await this.productRecipeRepository.findById(id);

            if (!productRecipe) {
                throw new CustomError("Product recipe not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(productRecipe);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting product recipe by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve product recipe", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getProductRecipesByProductId(productId: number, sugarType: string | undefined) {
        try {
            const product = await this.productRepository.findById(productId);
            if (!product) {
                throw new CustomError("Product not found", HttpStatus.NOT_FOUND);
            }

            const productRecipes = await this.productRecipeRepository.findByProductId(productId);

            if (!productRecipes) {
                throw new CustomError("Product recipes not found", HttpStatus.NOT_FOUND);
            }

            if (sugarType) {
                const filteredRecipes = productRecipes.recipes.filter((recipe) => recipe.sugar_type === sugarType);

                productRecipes.recipes = filteredRecipes;
                productRecipes.sugar_type = sugarType as SugarType;

                return this.excludeMetaFields(productRecipes);
            }

            return this.excludeMetaFields(productRecipes);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting product recipes by product ID ${productId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve product recipes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getProductRecipesByInventoryId(inventoryId: number) {
        try {
            const inventory = await this.inventoryRepository.findById(inventoryId);
            if (!inventory) {
                throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
            }

            const productRecipes = await this.productRecipeRepository.findByInventoryId(inventoryId);
            return this.excludeMetaFields(productRecipes);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting product recipes by inventory ID ${inventoryId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve product recipes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createProductRecipe(data: CreateProductRecipe) {
        try {
            const product = await this.productRepository.findById(data.product_id);
            if (!product) {
                throw new CustomError("Product not found", HttpStatus.NOT_FOUND);
            }

            const inventory = await this.inventoryRepository.findById(data.inventory_id);
            if (!inventory) {
                throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
            }

            const productRecipe = await this.productRecipeRepository.create(data);
            return this.excludeMetaFields(productRecipe);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error creating product recipe: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to create product recipe", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async bulkCreateProductRecipes(data: {
        product_id: number;
        sugar_type: string;
        recipes: { inventory_id: number; quantity_used: number }[];
    }) {
        try {
            const product = await this.productRepository.findById(data.product_id);
            if (!product) {
                throw new CustomError("Product not found", HttpStatus.NOT_FOUND);
            }

            const inventoryIds = new Set(data.recipes.map((recipe) => recipe.inventory_id));
            for (const inventoryId of inventoryIds) {
                const inventory = await this.inventoryRepository.findById(inventoryId);
                if (!inventory) {
                    throw new CustomError(`Inventory item with ID ${inventoryId} not found`, HttpStatus.NOT_FOUND);
                }
            }

            await this.productRecipeRepository.deleteByProductIdAndSugarType(
                data.product_id,
                data.sugar_type as SugarType,
            );

            await this.productRecipeRepository.createMany(data.product_id, data.sugar_type as SugarType, data.recipes);

            const productWithRecipes = await this.productRecipeRepository.findByProductIdAndSugarType(
                data.product_id,
                data.sugar_type as SugarType,
            );
            if (!productWithRecipes) {
                throw new CustomError("No recipes found for the product", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(productWithRecipes);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error bulk creating product recipes: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to create product recipes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateProductRecipe(id: number, data: UpdateProductRecipe) {
        try {
            const existingRecipe = await this.productRecipeRepository.findById(id);
            if (!existingRecipe) {
                throw new CustomError("Product recipe not found", HttpStatus.NOT_FOUND);
            }

            if (data.product_id) {
                const product = await this.productRepository.findById(data.product_id);
                if (!product) {
                    throw new CustomError("Product not found", HttpStatus.NOT_FOUND);
                }
            }

            if (data.inventory_id) {
                const inventory = await this.inventoryRepository.findById(data.inventory_id);
                if (!inventory) {
                    throw new CustomError("Inventory item not found", HttpStatus.NOT_FOUND);
                }
            }

            const productRecipe = await this.productRecipeRepository.update(id, data);
            return this.excludeMetaFields(productRecipe);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating product recipe ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update product recipe", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteProductRecipe(id: number) {
        try {
            const result = await this.productRecipeRepository.delete(id);

            if (!result) {
                throw new CustomError("Failed to delete product recipe or recipe not found", HttpStatus.NOT_FOUND);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting product recipe ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete product recipe", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteProductRecipesByProductId(productId: number) {
        try {
            const product = await this.productRepository.findById(productId);
            if (!product) {
                throw new CustomError("Product not found", HttpStatus.NOT_FOUND);
            }

            const count = await this.productRecipeRepository.deleteByProductId(productId);
            return { success: true, count };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting product recipes for product ${productId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete product recipes", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
