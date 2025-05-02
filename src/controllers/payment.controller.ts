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
import { PaymentService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { CreatePaymentDTO, UpdatePaymentDTO } from "dtos";

@controller("/payment", TYPES.AuthMiddleware)
export class PaymentController extends BaseHttpController {
    constructor(
        @inject(TYPES.PaymentService) private readonly paymentService: PaymentService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAllPayments(@response() res: Response, @next() next: NextFunction) {
        try {
            const payments = await this.paymentService.getAllPayments();
            return res.status(HttpStatus.OK).json(ApiResponse.success("Payments retrieved successfully", payments));
        } catch (error) {
            this.logger.error("Error retrieving payments");
            next(error);
        }
    }

    @httpGet("/statistics", RoleMiddlewareFactory([Role.PEMILIK]))
    public async getPaymentStatistics(@response() res: Response, @next() next: NextFunction) {
        try {
            const statistics = await this.paymentService.getPaymentStatistics();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Payment statistics retrieved successfully", statistics));
        } catch (error) {
            this.logger.error("Error retrieving payment statistics");
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getPaymentById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid payment ID", HttpStatus.BAD_REQUEST);
            }

            const payment = await this.paymentService.getPaymentById(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Payment retrieved successfully", payment));
        } catch (error) {
            this.logger.error(`Error retrieving payment with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpGet("/order/:orderId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getPaymentsByOrderId(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const orderId = Number(req.params.orderId);

            if (isNaN(orderId)) {
                throw new CustomError("Invalid order ID", HttpStatus.BAD_REQUEST);
            }

            const payments = await this.paymentService.getPaymentsByOrderId(orderId);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success(`Payments for order ${orderId} retrieved successfully`, payments));
        } catch (error) {
            this.logger.error(`Error retrieving payments for order ID ${req.params.orderId}`);
            next(error);
        }
    }

    @httpPost("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]), ZodValidation(CreatePaymentDTO))
    public async createPayment(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const payment = await this.paymentService.createPayment(req.body);
            return res.status(HttpStatus.CREATED).json(ApiResponse.success("Payment created successfully", payment));
        } catch (error) {
            this.logger.error(`Error creating payment: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]), ZodValidation(UpdatePaymentDTO))
    public async updatePayment(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid payment ID", HttpStatus.BAD_REQUEST);
            }

            const payment = await this.paymentService.updatePayment(id, req.body);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Payment updated successfully", payment));
        } catch (error) {
            this.logger.error(`Error updating payment with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async deletePayment(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid payment ID", HttpStatus.BAD_REQUEST);
            }

            await this.paymentService.deletePayment(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Payment deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting payment with ID ${req.params.id}`);
            next(error);
        }
    }
}
