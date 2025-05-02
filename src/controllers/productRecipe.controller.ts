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
import { ProductRecipeService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { CreateProductRecipeDTO, UpdateProductRecipeDTO } from "dtos";

@controller("/product-recipe", TYPES.AuthMiddleware)
export class ProductRecipeController extends BaseHttpController {
    constructor(
        @inject(TYPES.ProductRecipeService) private readonly productRecipeService: ProductRecipeService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAllProductRecipes(@response() res: Response, @next() next: NextFunction) {
        try {
            const productRecipes = await this.productRecipeService.getAllProductRecipes();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Product recipes retrieved successfully", productRecipes));
        } catch (error) {
            this.logger.error("Error retrieving product recipes");
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getProductRecipeById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid product recipe ID", HttpStatus.BAD_REQUEST);
            }

            const productRecipe = await this.productRecipeService.getProductRecipeById(id);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Product recipe retrieved successfully", productRecipe));
        } catch (error) {
            this.logger.error(`Error retrieving product recipe with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpGet("/product/:productId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getProductRecipesByProductId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const productId = Number(req.params.productId);

            if (isNaN(productId)) {
                throw new CustomError("Invalid product ID", HttpStatus.BAD_REQUEST);
            }

            const productRecipes = await this.productRecipeService.getProductRecipesByProductId(productId);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success(`Recipes for product ${productId} retrieved successfully`, productRecipes));
        } catch (error) {
            this.logger.error(`Error retrieving recipes for product ID ${req.params.productId}`);
            next(error);
        }
    }

    @httpGet("/inventory/:inventoryId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getProductRecipesByInventoryId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const inventoryId = Number(req.params.inventoryId);

            if (isNaN(inventoryId)) {
                throw new CustomError("Invalid inventory ID", HttpStatus.BAD_REQUEST);
            }

            const productRecipes = await this.productRecipeService.getProductRecipesByInventoryId(inventoryId);
            return res
                .status(HttpStatus.OK)
                .json(
                    ApiResponse.success(
                        `Product recipes using inventory ${inventoryId} retrieved successfully`,
                        productRecipes,
                    ),
                );
        } catch (error) {
            this.logger.error(`Error retrieving product recipes for inventory ID ${req.params.inventoryId}`);
            next(error);
        }
    }

    @httpPost("/", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(CreateProductRecipeDTO))
    public async createProductRecipe(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const productRecipe = await this.productRecipeService.createProductRecipe(req.body);
            return res
                .status(HttpStatus.CREATED)
                .json(ApiResponse.success("Product recipe created successfully", productRecipe));
        } catch (error) {
            this.logger.error(
                `Error creating product recipe: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(UpdateProductRecipeDTO))
    public async updateProductRecipe(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid product recipe ID", HttpStatus.BAD_REQUEST);
            }

            const productRecipe = await this.productRecipeService.updateProductRecipe(id, req.body);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Product recipe updated successfully", productRecipe));
        } catch (error) {
            this.logger.error(`Error updating product recipe with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteProductRecipe(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid product recipe ID", HttpStatus.BAD_REQUEST);
            }

            await this.productRecipeService.deleteProductRecipe(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Product recipe deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting product recipe with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/product/:productId", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteProductRecipesByProductId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const productId = Number(req.params.productId);

            if (isNaN(productId)) {
                throw new CustomError("Invalid product ID", HttpStatus.BAD_REQUEST);
            }

            const result = await this.productRecipeService.deleteProductRecipesByProductId(productId);
            return res
                .status(HttpStatus.OK)
                .json(
                    ApiResponse.success(
                        `${result.count} product recipes deleted successfully for product ID ${productId}`,
                    ),
                );
        } catch (error) {
            this.logger.error(`Error deleting product recipes for product ID ${req.params.productId}`);
            next(error);
        }
    }
}
