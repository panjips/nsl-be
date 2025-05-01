import { HttpStatus, Role, TYPES } from "constant";
import { inject } from "inversify";
import {
    controller,
    httpPut,
    httpGet,
    httpDelete,
    request,
    response,
    next,
    BaseHttpController,
} from "inversify-express-utils";
import type { NextFunction, Request, Response } from "express";
import { ApiResponse, CustomError, ILogger } from "utils";
import { OrderAddonItemService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { UpdateOrderAddonItemDTO } from "dtos";

@controller("/order-addon", TYPES.AuthMiddleware)
export class OrderAddonItemController extends BaseHttpController {
    constructor(
        @inject(TYPES.OrderAddonItemService) private readonly orderAddonItemService: OrderAddonItemService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAllOrderAddonItems(@response() res: Response, @next() next: NextFunction) {
        try {
            const items = await this.orderAddonItemService.getAllOrderAddonItems();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Order addon items retrieved successfully", items));
        } catch (error) {
            this.logger.error("Error retrieving order addon items");
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getOrderAddonItemById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order addon item ID", HttpStatus.BAD_REQUEST);
            }

            const item = await this.orderAddonItemService.getOrderAddonItemById(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order addon item retrieved successfully", item));
        } catch (error) {
            this.logger.error(`Error retrieving order addon item with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpGet("/product-item/:productItemId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getOrderAddonItemsByProductItemId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const productItemId = Number(req.params.productItemId);

            if (isNaN(productItemId)) {
                throw new CustomError("Invalid order product item ID", HttpStatus.BAD_REQUEST);
            }

            const items = await this.orderAddonItemService.getOrderAddonItemsByProductItemId(productItemId);
            return res
                .status(HttpStatus.OK)
                .json(
                    ApiResponse.success(
                        `Order addon items for product item ${productItemId} retrieved successfully`,
                        items,
                    ),
                );
        } catch (error) {
            this.logger.error(`Error retrieving order addon items for product item ID ${req.params.productItemId}`);
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]), ZodValidation(UpdateOrderAddonItemDTO))
    public async updateOrderAddonItem(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order addon item ID", HttpStatus.BAD_REQUEST);
            }

            const item = await this.orderAddonItemService.updateOrderAddonItem(id, req.body);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order addon item updated successfully", item));
        } catch (error) {
            this.logger.error(`Error updating order addon item with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async deleteOrderAddonItem(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order addon item ID", HttpStatus.BAD_REQUEST);
            }

            await this.orderAddonItemService.deleteOrderAddonItem(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order addon item deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting order addon item with ID ${req.params.id}`);
            next(error);
        }
    }
}
