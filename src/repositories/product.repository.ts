import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { Product, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateProduct, UpdateProduct } from "models";

@injectable()
export class ProductRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<Product[]> {
        return await this.prisma.product.findMany({
            where: {
                is_active: true,
            },
            include: {
                category: true,
            },
            orderBy: {
                id: "asc",
            },
        });
    }

    async findById(id: number): Promise<Product | null> {
        return await this.prisma.product.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                category: true,
            },
        });
    }

    async findByCategory(categoryId: number): Promise<Product[]> {
        return await this.prisma.product.findMany({
            where: {
                category_id: categoryId,
                is_active: true,
            },
            include: {
                category: true,
            },
        });
    }

    async create(product: CreateProduct): Promise<Product> {
        const data = await this.prisma.product.create({
            data: {
                ...product,
            },
            include: {
                category: true,
            },
        });

        this.logger.info(`Product ${product.name} created with ID ${data.id}`);
        return data;
    }

    async update(id: number, product: UpdateProduct): Promise<Product | null> {
        const data = await this.prisma.product.update({
            where: {
                id,
            },
            data: {
                ...product,
                updated_at: new Date(),
            },
            include: {
                category: true,
            },
        });

        this.logger.info(`Product ${id} updated successfully`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.product.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(`Product ${id} soft deleted`);
        return !!data;
    }

    async getProductSugarType(productId: number) {
        return await this.prisma.product.findMany({
            select: {
                recipes: {
                    distinct: ["sugar_type"],
                    select: {
                        sugar_type: true,
                    },
                    
                },
            },
            where: {
                id: productId,
                is_active: true,
            },
        });
    }
}
