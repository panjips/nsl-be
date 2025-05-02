import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { Addon, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateAddon, UpdateAddon } from "models";

@injectable()
export class AddonRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<Addon[]> {
        return await this.prisma.addon.findMany({
            where: {
                is_active: true,
            },
            include: {
                recipes: true,
            },
        });
    }

    async findById(id: number): Promise<Addon | null> {
        return await this.prisma.addon.findFirst({
            where: {
                id,
                is_active: true,
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

    async create(addon: CreateAddon): Promise<Addon> {
        const data = await this.prisma.addon.create({
            data: {
                ...addon,
            },
        });

        this.logger.info(`Addon ${addon.name} created with ID ${data.id}`);
        return data;
    }

    async update(id: number, addon: UpdateAddon): Promise<Addon | null> {
        const data = await this.prisma.addon.update({
            where: {
                id,
            },
            data: {
                ...addon,
                updated_at: new Date(),
            },
        });

        this.logger.info(`Addon ${id} updated successfully`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.addon.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(`Addon ${id} soft deleted`);
        return !!data;
    }
}
