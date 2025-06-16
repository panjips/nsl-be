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
    queryParam,
} from "inversify-express-utils";
import type { NextFunction, Request, Response } from "express";
import { ApiResponse, CustomError, ILogger } from "utils";
import { OrderService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { CreateOrderDTO, UpdateOrderDTO, UpdateOrderStatusDTO } from "dtos";

@controller("/order", TYPES.AuthMiddleware)
export class OrderController extends BaseHttpController {
    constructor(
        @inject(TYPES.OrderService) private readonly orderService: OrderService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAllOrders(
        @queryParam("status") status: string,
        @queryParam("type") type: string,
        @queryParam("startDate") startDate: string,
        @queryParam("endDate") endDate: string,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            // let orders;
            // if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
            //     orders = await this.orderService.getOrdersByStatus(status as OrderStatus);
            // } else if (type && Object.values(OrderType).includes(type as OrderType)) {
            //     orders = await this.orderService.getOrdersByType(type as OrderType);
            // } else {
            //     orders = await this.orderService.getAllOrders();
            // }

            let orders = await this.orderService.getAllOrders(status, type, startDate, endDate);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Orders retrieved successfully", orders));
        } catch (error) {
            this.logger.error("Error retrieving orders");
            next(error);
        }
    }

    @httpGet("/statistics", RoleMiddlewareFactory([Role.PEMILIK]))
    public async getOrderStatistics(@response() res: Response, @next() next: NextFunction) {
        try {
            const statistics = await this.orderService.getOrderStatistics();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Order statistics retrieved successfully", statistics));
        } catch (error) {
            this.logger.error("Error retrieving order statistics");
            next(error);
        }
    }

    @httpGet("/user")
    public async getOrdersByUserId(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const userId = Number(req.user?.id);

            if (isNaN(userId)) {
                throw new CustomError("Invalid user ID", HttpStatus.BAD_REQUEST);
            }

            const orders = await this.orderService.getOrdersByUserId(userId);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success(`Orders for user ${userId} retrieved successfully`, orders));
        } catch (error) {
            this.logger.error(`Error retrieving orders for user ID ${req.params.userId}`);
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getOrderById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order ID", HttpStatus.BAD_REQUEST);
            }

            const order = await this.orderService.getOrderById(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order retrieved successfully", order));
        } catch (error) {
            this.logger.error(`Error retrieving order with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPost("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.PELANGGAN]), ZodValidation(CreateOrderDTO))
    public async createOrder(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const order = await this.orderService.createOrder(req.body);
            return res.status(HttpStatus.CREATED).json(ApiResponse.success("Order created successfully", order));
        } catch (error) {
            this.logger.error(`Error creating order: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpPut("/status/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]), ZodValidation(UpdateOrderStatusDTO))
    public async updateOrderStatus(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order ID", HttpStatus.BAD_REQUEST);
            }

            const order = await this.orderService.updateOrderStatus(id, req.body.order_status);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order status updated successfully", order));
        } catch (error) {
            this.logger.error(`Error updating order status for ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]), ZodValidation(UpdateOrderDTO))
    public async updateOrder(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order ID", HttpStatus.BAD_REQUEST);
            }

            const order = await this.orderService.updateOrder(id, req.body);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order updated successfully", order));
        } catch (error) {
            this.logger.error(`Error updating order with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPut("/cancel/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async cancelOrder(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order ID", HttpStatus.BAD_REQUEST);
            }

            const result = await this.orderService.cancelOrder(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order cancelled successfully", result));
        } catch (error) {
            this.logger.error(`Error cancelling order with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteOrder(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid order ID", HttpStatus.BAD_REQUEST);
            }

            await this.orderService.deleteOrder(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Order deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting order with ID ${req.params.id}`);
            next(error);
        }
    }
}
