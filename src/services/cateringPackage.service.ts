import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { CateringPackageRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreateCateringPackage, UpdateCateringPackage } from "models";

@injectable()
export class CateringPackageService extends BaseService {
    constructor(
        @inject(TYPES.CateringPackageRepository) private readonly cateringPackageRepository: CateringPackageRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllCateringPackages() {
        try {
            const packages = await this.cateringPackageRepository.findAll();
            return this.excludeMetaFields(packages);
        } catch (error) {
            this.logger.error(
                `Error getting all catering packages: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve catering packages", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getCateringPackageById(id: number) {
        try {
            const pkg = await this.cateringPackageRepository.findById(id);

            if (!pkg) {
                throw new CustomError("Catering package not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(pkg);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting catering package by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve catering package", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createCateringPackage(data: CreateCateringPackage) {
        try {
            const pkg = await this.cateringPackageRepository.create(data);
            return this.excludeMetaFields(pkg);
        } catch (error) {
            this.logger.error(
                `Error creating catering package: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to create catering package", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateCateringPackage(id: number, data: UpdateCateringPackage) {
        try {
            const existing = await this.cateringPackageRepository.findById(id);
            if (!existing) {
                throw new CustomError("Catering package not found", HttpStatus.NOT_FOUND);
            }

            const pkg = await this.cateringPackageRepository.update(id, data);
            return this.excludeMetaFields(pkg);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating catering package ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update catering package", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteCateringPackage(id: number) {
        try {
            const existing = await this.cateringPackageRepository.findById(id);
            if (!existing) {
                throw new CustomError("Catering package not found", HttpStatus.NOT_FOUND);
            }

            const result = await this.cateringPackageRepository.delete(id);
            if (!result) {
                throw new CustomError("Failed to delete catering package", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting catering package ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete catering package", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getCateringPackagesByPriceRange(minPrice: number, maxPrice: number) {
        try {
            const packages = await this.cateringPackageRepository.findByPriceRange(minPrice, maxPrice);
            return this.excludeMetaFields(packages);
        } catch (error) {
            this.logger.error(
                `Error getting catering packages by price range: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve catering packages", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
