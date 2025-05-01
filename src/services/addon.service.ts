import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { AddonRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreateAddon, UpdateAddon } from "models";

@injectable()
export class AddonService extends BaseService {
    constructor(
        @inject(TYPES.AddonRepository) private readonly addonRepository: AddonRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllAddons() {
        try {
            const addons = await this.addonRepository.findAll();
            return this.excludeMetaFields(addons);
        } catch (error) {
            this.logger.error(
                `Error getting all addons: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve addons", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getAddonById(id: number) {
        try {
            const addon = await this.addonRepository.findById(id);

            if (!addon) {
                throw new CustomError("Addon not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(addon);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting addon by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve addon", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createAddon(data: CreateAddon) {
        try {
            const addon = await this.addonRepository.create(data);
            return this.excludeMetaFields(addon);
        } catch (error) {
            this.logger.error(`Error creating addon: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create addon", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateAddon(id: number, data: UpdateAddon) {
        try {
            const addon = await this.addonRepository.update(id, data);

            if (!addon) {
                throw new CustomError("Addon not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(addon);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating addon ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update addon", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteAddon(id: number) {
        try {
            const result = await this.addonRepository.delete(id);

            if (!result) {
                throw new CustomError("Failed to delete addon or addon not found", HttpStatus.NOT_FOUND);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting addon ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete addon", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}