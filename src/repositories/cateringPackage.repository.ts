import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { CateringPackage, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateCateringPackage, UpdateCateringPackage } from "models";

@injectable()
export class CateringPackageRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<CateringPackage[]> {
        return await this.prisma.cateringPackage.findMany({
            where: {
                is_active: true,
            },
            orderBy: {
                name: "asc",
            },
        });
    }

    async findById(id: number): Promise<CateringPackage | null> {
        return await this.prisma.cateringPackage.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                orderCaterings: true,
            },
        });
    }

    async create(cateringPackage: CreateCateringPackage): Promise<CateringPackage> {
        const data = await this.prisma.cateringPackage.create({
            data: {
                ...cateringPackage,
            },
        });

        this.logger.info(`CateringPackage created with ID ${data.id}`);
        return data;
    }

    async update(id: number, cateringPackage: UpdateCateringPackage): Promise<CateringPackage | null> {
        const data = await this.prisma.cateringPackage.update({
            where: {
                id,
            },
            data: {
                ...cateringPackage,
            },
        });

        this.logger.info(`CateringPackage with ID ${id} updated`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.cateringPackage.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`CateringPackage with ID ${id} soft deleted`);
            return true;
        }

        this.logger.error(`Failed to delete cateringPackage with ID ${id}`);
        return false;
    }

    async findByPriceRange(minPrice: number, maxPrice: number): Promise<CateringPackage[]> {
        return await this.prisma.cateringPackage.findMany({
            where: {
                is_active: true,
                price: {
                    gte: minPrice,
                    lte: maxPrice,
                },
            },
            orderBy: {
                price: "asc",
            },
        });
    }
}
