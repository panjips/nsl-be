import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { AddonRecipe, PrismaClient } from "@prisma/client";
import { ILogger } from "utils";
import { CreateAddonRecipe, UpdateAddonRecipe } from "models";

@injectable()
export class AddonRecipeRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(): Promise<AddonRecipe[]> {
        return await this.prisma.addonRecipe.findMany({
            where: {
                is_active: true,
            },
            include: {
                addon: true,
                inventory: true,
            },
        });
    }

    async findById(id: number): Promise<AddonRecipe | null> {
        return await this.prisma.addonRecipe.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                addon: true,
                inventory: true,
            },
        });
    }

    async findByAddonId(addonId: number): Promise<AddonRecipe[]> {
        return await this.prisma.addonRecipe.findMany({
            where: {
                addon_id: addonId,
                is_active: true,
            },
            include: {
                addon: true,
                inventory: true,
            },
        });
    }

    async findByInventoryId(inventoryId: number): Promise<AddonRecipe[]> {
        return await this.prisma.addonRecipe.findMany({
            where: {
                inventory_id: inventoryId,
                is_active: true,
            },
            include: {
                addon: true,
                inventory: true,
            },
        });
    }

    async create(addonRecipe: CreateAddonRecipe): Promise<AddonRecipe> {
        const data = await this.prisma.addonRecipe.create({
            data: {
                ...addonRecipe,
            },
            include: {
                addon: true,
                inventory: true,
            },
        });

        this.logger.info(`AddonRecipe created with ID ${data.id} for addon ${addonRecipe.addon_id} and inventory ${addonRecipe.inventory_id}`);
        return data;
    }

    async update(id: number, addonRecipe: UpdateAddonRecipe): Promise<AddonRecipe | null> {
        const data = await this.prisma.addonRecipe.update({
            where: {
                id,
            },
            data: {
                ...addonRecipe,
                updated_at: new Date(),
            },
            include: {
                addon: true,
                inventory: true,
            },
        });

        this.logger.info(`AddonRecipe with ID ${id} updated successfully`);
        return data;
    }

    async delete(id: number): Promise<boolean> {
        const data = await this.prisma.addonRecipe.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        if (data) {
            this.logger.info(`AddonRecipe with ID ${id} soft deleted from the database`);
            return true;
        }

        this.logger.error(`Failed to delete AddonRecipe with ID ${id}`);
        return false;
    }

    async deleteByAddonId(addonId: number): Promise<number> {
        const result = await this.prisma.addonRecipe.updateMany({
            where: {
                addon_id: addonId,
                is_active: true,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(`${result.count} AddonRecipes for addon ID ${addonId} soft deleted`);
        return result.count;
    }
}