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
import { PurchaseService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { CreatePurchaseDTO, UpdatePurchaseDTO } from "dtos";

@controller("/purchase", TYPES.AuthMiddleware)
export class PurchaseController extends BaseHttpController {
    constructor(
        @inject(TYPES.PurchaseService) private readonly purchaseService: PurchaseService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.STAF]))
    public async getAllPurchases(@response() res: Response, @next() next: NextFunction) {
        try {
            const purchases = await this.purchaseService.getAllPurchases();
            return res.status(HttpStatus.OK).json(ApiResponse.success("Purchases retrieved successfully", purchases));
        } catch (error) {
            this.logger.error("Error retrieving purchases");
            next(error);
        }
    }
    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.STAF]))
    public async getPurchaseById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid purchase ID", HttpStatus.BAD_REQUEST);
            }

            const purchase = await this.purchaseService.getPurchaseById(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Purchase retrieved successfully", purchase));
        } catch (error) {
            this.logger.error(`Error retrieving purchase with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpGet("/invetory/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.STAF]))
    public async getPurchaseByInventoryId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                throw new CustomError("Invalid inventory ID", HttpStatus.BAD_REQUEST);
            }
            const purchase = await this.purchaseService.getPurchasesByInventoryId(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Purchase retrieved successfully", purchase));
        } catch (error) {
            this.logger.error(`Error retrieving purchase with inventory ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPost("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.STAF]), ZodValidation(CreatePurchaseDTO))
    public async createPurchase(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const purchase = await this.purchaseService.createPurchase(req.body);
            return res.status(HttpStatus.CREATED).json(ApiResponse.success("Purchase created successfully", purchase));
        } catch (error) {
            this.logger.error("Error creating purchase");
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.STAF]), ZodValidation(UpdatePurchaseDTO))
    public async updatePurchase(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid purchase ID", HttpStatus.BAD_REQUEST);
            }

            const purchase = await this.purchaseService.updatePurchase(id, req.body);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Purchase updated successfully", purchase));
        } catch (error) {
            this.logger.error(`Error updating purchase with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.STAF]))
    public async deletePurchase(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid purchase ID", HttpStatus.BAD_REQUEST);
            }

            await this.purchaseService.deletePurchase(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Purchase deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting purchase with ID ${req.params.id}`);
            next(error);
        }
    }
}
