import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { ProductRecipe, PrismaClient, SugarType } from "@prisma/client";
import { ILogger } from "utils";
import { CreateProductRecipe, ProductWithRecipe, UpdateProductRecipe } from "models";

@injectable()
export class ProductRecipeRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<ProductWithRecipe[]> {
        return await this.prisma.product.findMany({
            where: {
                is_active: true,
                recipes: {
                    some: {
                        is_active: true,
                    },
                },
            },
            include: {
                recipes: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        inventory: true,
                    },
                },
            },
        });
    }

    async findAllWithInventoryAndProduct() {
        return await this.prisma.productRecipe.findMany({
            where: {
                is_active: true,
            },
            include: {
                product: true,
                inventory: true,
            },
            orderBy: {
                created_at: "asc",
            },
        });
    }

    async findById(id: number): Promise<ProductRecipe | null> {
        return await this.prisma.productRecipe.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                product: true,
                inventory: true,
            },
        });
    }

    async findByProductId(productId: number): Promise<ProductWithRecipe | null> {
        return await this.prisma.product.findFirst({
            where: {
                id: productId,
                is_active: true,
                recipes: {
                    some: {
                        is_active: true,
                    },
                },
            },
            include: {
                recipes: {
                    where: {
                        is_active: true,
                    },
                },
            },
        });
    }

    async findByProductIdAndSugarType(productId: number, sugarType: SugarType): Promise<ProductWithRecipe | null> {
        return await this.prisma.product.findFirst({
            where: {
                id: productId,
                is_active: true,
                recipes: {
                    some: {
                        is_active: true,
                        product_id: productId,
                        sugar_type: sugarType,
                    },
                },
            },
            include: {
                recipes: {
                    where: {
                        is_active: true,
                        sugar_type: sugarType,
                    },
                },
            },
        });
    }

    async findByInventoryId(inventoryId: number): Promise<ProductRecipe[]> {
        return await this.prisma.productRecipe.findMany({
            where: {
                inventory_id: inventoryId,
                is_active: true,
            },
            include: {
                product: true,
                inventory: true,
            },
        });
    }

    async create(productRecipe: CreateProductRecipe): Promise<ProductRecipe> {
        const data = await this.prisma.productRecipe.create({
            data: {
                ...productRecipe,
            },
            include: {
                product: true,
                inventory: true,
            },
        });

        this.logger.info(
            `ProductRecipe created with ID ${data.id} for product ${productRecipe.product_id} and inventory ${productRecipe.inventory_id}`,
        );
        return data;
    }

    async createMany(
        productId: number,
        sugar_type: string,
        recipes: { inventory_id: number; quantity_used: number }[],
    ): Promise<number> {
        const createdRecipes = await this.prisma.productRecipe.createMany({
            data: recipes.map((recipe) => ({
                product_id: productId,
                inventory_id: recipe.inventory_id,
                quantity_used: recipe.quantity_used,
                sugar_type: sugar_type as SugarType,
            })),
        });

        this.logger.info(`Created ${createdRecipes.count} recipes for product ${productId}`);
        return createdRecipes.count;
    }

    async update(id: number, productRecipe: UpdateProductRecipe): Promise<ProductRecipe | null> {
        const data = await this.prisma.productRecipe.update({
            where: {
                id,
            },
            data: {
                ...productRecipe,
                updated_at: new Date(),
            },
            include: {
                product: true,
                inventory: true,
            },
        });

        this.logger.info(`ProductRecipe with ID ${id} updated successfully`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.productRecipe.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`ProductRecipe with ID ${id} soft deleted from the database`);
            return true;
        }

        this.logger.error(`Failed to delete ProductRecipe with ID ${id}`);
        return false;
    }

    async deleteByProductId(productId: number): Promise<number> {
        const result = await this.prisma.productRecipe.updateMany({
            where: {
                product_id: productId,
                is_active: true,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(`${result.count} ProductRecipes for product ID ${productId} soft deleted`);
        return result.count;
    }

    async deleteByProductIdAndSugarType(productId: number, sugarType: SugarType): Promise<number> {
        const result = await this.prisma.productRecipe.updateMany({
            where: {
                product_id: productId,
                sugar_type: sugarType,
                is_active: true,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(
            `${result.count} ProductRecipes for product ID ${productId} with sugar type ${sugarType} soft deleted`,
        );
        return result.count;
    }
}
