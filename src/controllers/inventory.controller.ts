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
import { InventoryService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { CreateInventoryDTO, UpdateInventoryDTO } from "dtos";

@controller("/inventory", TYPES.AuthMiddleware)
export class InventoryController extends BaseHttpController {
    constructor(
        @inject(TYPES.InventoryService) private readonly inventoryService: InventoryService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.STAF]))
    public async getAllInventory(@response() res: Response, @next() next: NextFunction) {
        try {
            const inventory = await this.inventoryService.getAllInventory();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Inventory items retrieved successfully", inventory));
        } catch (error) {
            this.logger.error("Error retrieving inventory items");
            next(error);
        }
    }
    @httpGet("/low-stock", RoleMiddlewareFactory([Role.PEMILIK, Role.STAF]))
    public async getLowStockInventory(@response() res: Response, @next() next: NextFunction) {
        try {
            const inventory = await this.inventoryService.getLowStockInventory();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Low stock inventory items retrieved successfully", inventory));
        } catch (error) {
            this.logger.error("Error retrieving low stock inventory items");
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.STAF]))
    public async getInventoryById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid inventory ID", HttpStatus.BAD_REQUEST);
            }

            const inventory = await this.inventoryService.getInventoryById(id);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Inventory item retrieved successfully", inventory));
        } catch (error) {
            this.logger.error(`Error retrieving inventory item with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPost("/", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(CreateInventoryDTO))
    public async createInventory(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const inventory = await this.inventoryService.createInventory(req.body);
            return res
                .status(HttpStatus.CREATED)
                .json(ApiResponse.success("Inventory item created successfully", inventory));
        } catch (error) {
            this.logger.error(
                `Error creating inventory item: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.STAF]), ZodValidation(UpdateInventoryDTO))
    public async updateInventory(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid inventory ID", HttpStatus.BAD_REQUEST);
            }

            const inventory = await this.inventoryService.updateInventory(id, req.body);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Inventory item updated successfully", inventory));
        } catch (error) {
            this.logger.error(
                `Error updating inventory item: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteInventory(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid inventory ID", HttpStatus.BAD_REQUEST);
            }

            await this.inventoryService.deleteInventory(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Inventory item deleted successfully"));
        } catch (error) {
            this.logger.error(
                `Error deleting inventory item: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }
}
