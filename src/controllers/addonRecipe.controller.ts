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
import { AddonRecipeService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { CreateAddonRecipeDTO, UpdateAddonRecipeDTO } from "dtos";

@controller("/addon-recipe", TYPES.AuthMiddleware)
export class AddonRecipeController extends BaseHttpController {
    constructor(
        @inject(TYPES.AddonRecipeService) private readonly addonRecipeService: AddonRecipeService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAllAddonRecipes(@response() res: Response, @next() next: NextFunction) {
        try {
            const addonRecipes = await this.addonRecipeService.getAllAddonRecipes();
            return res.status(HttpStatus.OK).json(ApiResponse.success("Addon recipes retrieved successfully", addonRecipes));
        } catch (error) {
            this.logger.error("Error retrieving addon recipes");
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAddonRecipeById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid addon recipe ID", HttpStatus.BAD_REQUEST);
            }

            const addonRecipe = await this.addonRecipeService.getAddonRecipeById(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Addon recipe retrieved successfully", addonRecipe));
        } catch (error) {
            this.logger.error(`Error retrieving addon recipe with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpGet("/addon/:addonId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAddonRecipesByAddonId(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const addonId = Number(req.params.addonId);

            if (isNaN(addonId)) {
                throw new CustomError("Invalid addon ID", HttpStatus.BAD_REQUEST);
            }

            const addonRecipes = await this.addonRecipeService.getAddonRecipesByAddonId(addonId);
            return res.status(HttpStatus.OK).json(
                ApiResponse.success(`Recipes for addon ${addonId} retrieved successfully`, addonRecipes)
            );
        } catch (error) {
            this.logger.error(`Error retrieving recipes for addon ID ${req.params.addonId}`);
            next(error);
        }
    }

    @httpGet("/inventory/:inventoryId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAddonRecipesByInventoryId(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const inventoryId = Number(req.params.inventoryId);

            if (isNaN(inventoryId)) {
                throw new CustomError("Invalid inventory ID", HttpStatus.BAD_REQUEST);
            }

            const addonRecipes = await this.addonRecipeService.getAddonRecipesByInventoryId(inventoryId);
            return res.status(HttpStatus.OK).json(
                ApiResponse.success(`Addon recipes using inventory ${inventoryId} retrieved successfully`, addonRecipes)
            );
        } catch (error) {
            this.logger.error(`Error retrieving addon recipes for inventory ID ${req.params.inventoryId}`);
            next(error);
        }
    }

    @httpPost("/", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(CreateAddonRecipeDTO))
    public async createAddonRecipe(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const addonRecipe = await this.addonRecipeService.createAddonRecipe(req.body);
            return res.status(HttpStatus.CREATED).json(ApiResponse.success("Addon recipe created successfully", addonRecipe));
        } catch (error) {
            this.logger.error(`Error creating addon recipe: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(UpdateAddonRecipeDTO))
    public async updateAddonRecipe(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid addon recipe ID", HttpStatus.BAD_REQUEST);
            }

            const addonRecipe = await this.addonRecipeService.updateAddonRecipe(id, req.body);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Addon recipe updated successfully", addonRecipe));
        } catch (error) {
            this.logger.error(`Error updating addon recipe with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteAddonRecipe(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid addon recipe ID", HttpStatus.BAD_REQUEST);
            }

            await this.addonRecipeService.deleteAddonRecipe(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Addon recipe deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting addon recipe with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/addon/:addonId", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteAddonRecipesByAddonId(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const addonId = Number(req.params.addonId);

            if (isNaN(addonId)) {
                throw new CustomError("Invalid addon ID", HttpStatus.BAD_REQUEST);
            }

            const result = await this.addonRecipeService.deleteAddonRecipesByAddonId(addonId);
            return res.status(HttpStatus.OK).json(
                ApiResponse.success(`${result.count} addon recipes deleted successfully for addon ID ${addonId}`)
            );
        } catch (error) {
            this.logger.error(`Error deleting addon recipes for addon ID ${req.params.addonId}`);
            next(error);
        }
    }
}