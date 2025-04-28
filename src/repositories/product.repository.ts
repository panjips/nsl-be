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
        });
    }

    async findById(id: number): Promise<Product | null> {
        return await this.prisma.product.findFirst({
            where: {
                id,
                is_active: true,
            },
        });
    }

    async create(product: CreateProduct): Promise<Product> {
        const data = await this.prisma.product.create({
            data: {
                ...product,
            },
        });

        this.logger.info(`Product ${product.name} inserted to the database`);
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
        });

        this.logger.info(`Product ${product.name} updated in the database`);
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

        this.logger.info(`Product with ID ${id} deleted from the database`);
        return !!data;
    }
}
