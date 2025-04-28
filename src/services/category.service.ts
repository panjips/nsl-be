import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { CategoryRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreateCategory, UpdateCategory } from "models";

@injectable()
export class CategoryService extends BaseService {
    constructor(
        @inject(TYPES.CategoryRepository) private readonly categoryRepository: CategoryRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllCategories() {
        try {
            const categories = await this.categoryRepository.findAll();
            return this.excludeMetaFields(categories);
        } catch (error) {
            this.logger.error(
                `Error getting all categories: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve categories", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getCategoryById(id: number) {
        try {
            const category = await this.categoryRepository.findById(id);

            if (!category) {
                throw new CustomError("Category not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(category);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting category by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve category", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createCategory(data: CreateCategory) {
        try {
            const category = await this.categoryRepository.create(data);
            return this.excludeMetaFields(category);
        } catch (error) {
            this.logger.error(`Error creating category: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create category", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateCategory(id: number, data: UpdateCategory) {
        try {
            const category = await this.categoryRepository.update(id, data);

            if (!category) {
                throw new CustomError("Category not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(category);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating category ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update category", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteCategory(id: number) {
        try {
            const result = await this.categoryRepository.delete(id);

            if (!result) {
                throw new CustomError("Failed to delete category or category not found", HttpStatus.NOT_FOUND);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting category ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete category", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
