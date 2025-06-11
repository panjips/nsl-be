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
import { ProductRecipeService, AddonRecipeService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import {
    CreateProductRecipeDTO,
    UpdateProductRecipeDTO,
    CreateAddonRecipeDTO,
    UpdateAddonRecipeDTO,
    BulkCreateProductRecipeDTO,
    BulkCreateAddonRecipeDTO,
} from "dtos";

@controller("/recipe", TYPES.AuthMiddleware)
export class RecipeController extends BaseHttpController {
    constructor(
        @inject(TYPES.ProductRecipeService) private readonly productRecipeService: ProductRecipeService,
        @inject(TYPES.AddonRecipeService) private readonly addonRecipeService: AddonRecipeService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    // ================ PRODUCT RECIPES ================

    @httpGet("/product", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
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

    @httpGet("/product/inventory/:inventoryId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
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

    @httpPost("/product", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(CreateProductRecipeDTO))
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

    @httpPost("/product/bulk", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(BulkCreateProductRecipeDTO))
    public async bulkCreateProductRecipes(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            await this.productRecipeService.bulkCreateProductRecipes(req.body);
            return res.status(HttpStatus.CREATED).json(ApiResponse.success("Successfully created product recipes"));
        } catch (error) {
            this.logger.error(
                `Error bulk creating product recipes: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }

    @httpPut("/product/:id", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(UpdateProductRecipeDTO))
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

    @httpPut("/product/:id/bulk", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(BulkCreateProductRecipeDTO))
    public async bulkUpdateProductRecipes(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const productId = Number(req.params.id);

            if (isNaN(productId)) {
                throw new CustomError("Invalid product ID", HttpStatus.BAD_REQUEST);
            }

            const data = {
                product_id: productId,
                recipes: req.body.recipes,
            };

            await this.productRecipeService.bulkCreateProductRecipes(data);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Successfully updated recipes for product"));
        } catch (error) {
            this.logger.error(
                `Error bulk updating product recipes for product ID ${req.params.id}: ${error instanceof Error ? error.message : String(error)}`,
            );
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

    // ================ ADDON RECIPES ================

    @httpGet("/addon", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAllAddonRecipes(@response() res: Response, @next() next: NextFunction) {
        try {
            const addonRecipes = await this.addonRecipeService.getAllAddonRecipes();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Addon recipes retrieved successfully", addonRecipes));
        } catch (error) {
            this.logger.error("Error retrieving addon recipes");
            next(error);
        }
    }

    @httpGet("/addon/:addonId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAddonRecipesByAddonId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const addonId = Number(req.params.addonId);

            if (isNaN(addonId)) {
                throw new CustomError("Invalid addon ID", HttpStatus.BAD_REQUEST);
            }

            const addonRecipes = await this.addonRecipeService.getAddonRecipesByAddonId(addonId);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success(`Recipes for addon ${addonId} retrieved successfully`, addonRecipes));
        } catch (error) {
            this.logger.error(`Error retrieving recipes for addon ID ${req.params.addonId}`);
            next(error);
        }
    }

    @httpGet("/addon/inventory/:inventoryId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAddonRecipesByInventoryId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const inventoryId = Number(req.params.inventoryId);

            if (isNaN(inventoryId)) {
                throw new CustomError("Invalid inventory ID", HttpStatus.BAD_REQUEST);
            }

            const addonRecipes = await this.addonRecipeService.getAddonRecipesByInventoryId(inventoryId);
            return res
                .status(HttpStatus.OK)
                .json(
                    ApiResponse.success(
                        `Addon recipes using inventory ${inventoryId} retrieved successfully`,
                        addonRecipes,
                    ),
                );
        } catch (error) {
            this.logger.error(`Error retrieving addon recipes for inventory ID ${req.params.inventoryId}`);
            next(error);
        }
    }

    @httpPost("/addon", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(CreateAddonRecipeDTO))
    public async createAddonRecipe(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const addonRecipe = await this.addonRecipeService.createAddonRecipe(req.body);
            return res
                .status(HttpStatus.CREATED)
                .json(ApiResponse.success("Addon recipe created successfully", addonRecipe));
        } catch (error) {
            this.logger.error(`Error creating addon recipe: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpPost("/addon/bulk", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(BulkCreateAddonRecipeDTO))
    public async bulkCreateAddonRecipes(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            await this.addonRecipeService.bulkCreateAddonRecipes(req.body);
            return res.status(HttpStatus.CREATED).json(ApiResponse.success("Successfully created addon recipes"));
        } catch (error) {
            this.logger.error(
                `Error bulk creating addon recipes: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }

    @httpPut("/addon/:id", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(UpdateAddonRecipeDTO))
    public async updateAddonRecipe(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid addon recipe ID", HttpStatus.BAD_REQUEST);
            }

            const addonRecipe = await this.addonRecipeService.updateAddonRecipe(id, req.body);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Addon recipe updated successfully", addonRecipe));
        } catch (error) {
            this.logger.error(`Error updating addon recipe with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPut("/addon/:id/bulk", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(BulkCreateAddonRecipeDTO))
    public async bulkUpdateAddonRecipes(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const addonId = Number(req.params.id);

            if (isNaN(addonId)) {
                throw new CustomError("Invalid addon ID", HttpStatus.BAD_REQUEST);
            }

            const data = {
                addon_id: addonId,
                recipes: req.body.recipes,
            };

            await this.addonRecipeService.bulkCreateAddonRecipes(data);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Successfully updated recipes for addon"));
        } catch (error) {
            this.logger.error(
                `Error bulk updating addon recipes for addon ID ${req.params.id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }

    @httpDelete("/addon/:addonId", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteAddonRecipesByAddonId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const addonId = Number(req.params.addonId);

            if (isNaN(addonId)) {
                throw new CustomError("Invalid addon ID", HttpStatus.BAD_REQUEST);
            }

            const result = await this.addonRecipeService.deleteAddonRecipesByAddonId(addonId);
            return res
                .status(HttpStatus.OK)
                .json(
                    ApiResponse.success(`${result.count} addon recipes deleted successfully for addon ID ${addonId}`),
                );
        } catch (error) {
            this.logger.error(`Error deleting addon recipes for addon ID ${req.params.addonId}`);
            next(error);
        }
    }
}
