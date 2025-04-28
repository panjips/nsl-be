import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { Category, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateCategory, UpdateCategory } from "models";

@injectable()
export class CategoryRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<Category[]> {
        return await this.prisma.category.findMany({
            where: {
                is_active: true,
            },
        });
    }

    async findById(id: number): Promise<Category | null> {
        return await this.prisma.category.findFirst({
            where: {
                id,
                is_active: true,
            },
        });
    }

    async create(category: CreateCategory): Promise<Category> {
        const data = await this.prisma.category.create({
            data: {
                ...category,
            },
        });

        this.logger.info(`Category ${category.name} inserted to the database`);
        return data;
    }

    async update(id: number, category: UpdateCategory): Promise<Category | null> {
        const data = await this.prisma.category.update({
            where: {
                id,
            },
            data: {
                ...category,
                updated_at: new Date(),
            },
        });

        this.logger.info(`Category ${category.name} updated in the database`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.category.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`Category with ID ${id} deleted from the database`);
            return true;
        }

        this.logger.error(`Failed to delete category with ID ${id}`);
        return false;
    }
}
