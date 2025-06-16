import { HttpStatus, Role, TYPES } from "constant";
import { inject } from "inversify";
import {
    controller,
    httpPost,
    httpGet,
    httpPut,
    httpDelete,
    request,
    response,
    next,
    BaseHttpController,
} from "inversify-express-utils";
import type { NextFunction, Request, Response } from "express";
import { ApiResponse, CustomError, ILogger } from "utils";
import { CategoryService } from "services";
import { ZodValidation, RoleMiddlewareFactory } from "middleware";
import { CreateCategoryDTO, UpdateCategoryDTO } from "dtos";

@controller("/category")
export class CategoryController extends BaseHttpController {
    constructor(
        @inject(TYPES.CategoryService) private readonly categoryService: CategoryService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/")
    public async getAllCategories(@response() res: Response, @next() next: NextFunction) {
        try {
            const categories = await this.categoryService.getAllCategories();
            return res.status(HttpStatus.OK).json(ApiResponse.success("Categories retrieved successfully", categories));
        } catch (error) {
            this.logger.error("Error retrieving categories");
            next(error);
        }
    }

    @httpGet("/:id")
    public async getCategoryById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid category ID", HttpStatus.BAD_REQUEST);
            }

            const category = await this.categoryService.getCategoryById(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Category retrieved successfully", category));
        } catch (error) {
            this.logger.error(`Error retrieving category with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPost("/", TYPES.AuthMiddleware, RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(CreateCategoryDTO))
    public async createCategory(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const category = await this.categoryService.createCategory(req.body);
            return res.status(HttpStatus.CREATED).json(ApiResponse.success("Category created successfully", category));
        } catch (error) {
            this.logger.error("Error creating category");
            next(error);
        }
    }

    @httpPut("/:id", TYPES.AuthMiddleware, RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(UpdateCategoryDTO))
    public async updateCategory(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid category ID", HttpStatus.BAD_REQUEST);
            }

            const category = await this.categoryService.updateCategory(id, req.body);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Category updated successfully", category));
        } catch (error) {
            this.logger.error(`Error updating category with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", TYPES.AuthMiddleware, RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteCategory(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid category ID", HttpStatus.BAD_REQUEST);
            }

            await this.categoryService.deleteCategory(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Category deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting category with ID ${req.params.id}`);
            next(error);
        }
    }
}
