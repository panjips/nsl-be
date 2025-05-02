import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { ProductRecipe, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateProductRecipe, UpdateProductRecipe } from "models";

@injectable()
export class ProductRecipeRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<ProductRecipe[]> {
        return await this.prisma.productRecipe.findMany({
            where: {
                is_active: true,
            },
            include: {
                product: true,
                inventory: true,
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

    async findByProductId(productId: number): Promise<ProductRecipe[]> {
        return await this.prisma.productRecipe.findMany({
            where: {
                product_id: productId,
                is_active: true,
            },
            include: {
                product: true,
                inventory: true,
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
}
