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
import { OrderProductItemService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { UpdateOrderProductItemDTO } from "dtos";

@controller("/order-product", TYPES.AuthMiddleware)
export class OrderProductItemController extends BaseHttpController {
    constructor(
        @inject(TYPES.OrderProductItemService) private readonly orderProductItemService: OrderProductItemService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAllOrderProductItems(@response() res: Response, @next() next: NextFunction) {
        try {
            const items = await this.orderProductItemService.getAllOrderProductItems();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Order product items retrieved successfully", items));
        } catch (error) {
            this.logger.error("Error retrieving order product items");
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getOrderProductItemById(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order product item ID", HttpStatus.BAD_REQUEST);
            }

            const item = await this.orderProductItemService.getOrderProductItemById(id);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Order product item retrieved successfully", item));
        } catch (error) {
            this.logger.error(`Error retrieving order product item with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpGet("/order/:orderId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getOrderProductItemsByOrderId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const orderId = Number(req.params.orderId);

            if (isNaN(orderId)) {
                throw new CustomError("Invalid order ID", HttpStatus.BAD_REQUEST);
            }

            const items = await this.orderProductItemService.getOrderProductItemsByOrderId(orderId);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success(`Order product items for order ${orderId} retrieved successfully`, items));
        } catch (error) {
            this.logger.error(`Error retrieving order product items for order ID ${req.params.orderId}`);
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]), ZodValidation(UpdateOrderProductItemDTO))
    public async updateOrderProductItem(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order product item ID", HttpStatus.BAD_REQUEST);
            }

            const item = await this.orderProductItemService.updateOrderProductItem(id, req.body);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order product item updated successfully", item));
        } catch (error) {
            this.logger.error(`Error updating order product item with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async deleteOrderProductItem(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order product item ID", HttpStatus.BAD_REQUEST);
            }

            await this.orderProductItemService.deleteOrderProductItem(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order product item deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting order product item with ID ${req.params.id}`);
            next(error);
        }
    }
}
