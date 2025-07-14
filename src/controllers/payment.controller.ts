import { HttpStatus, TYPES } from "constant";
import { inject } from "inversify";
import {
    controller,
    httpPost,
    request,
    response,
    next,
    BaseHttpController,
    requestParam,
    httpGet,
} from "inversify-express-utils";
import type { NextFunction, Request, Response } from "express";
import { ApiResponse, ILogger } from "utils";
import { PaymentService } from "services";
import { ZodValidation } from "middleware";
import { MidtransNotificationSchema } from "dtos";

@controller("/payment")
export class PaymentController extends BaseHttpController {
    constructor(
        @inject(TYPES.PaymentService) private readonly paymentService: PaymentService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpPost("/notification-handler", ZodValidation(MidtransNotificationSchema))
    public async handleNotification(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const notificationData = req.body;
            await this.paymentService.updateMidtransPayment(notificationData);
            return res.status(HttpStatus.OK).json(ApiResponse.success("OK"));
        } catch (error) {
            this.logger.error(`Error handling notification: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpGet("/:id/repayment")
    public async createPaymentToken(
        @requestParam("id") id: string,
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const token = await this.paymentService.getPaymentToken(Number(id));
            return res.status(HttpStatus.OK).json(ApiResponse.success("Payment token created", token));
        } catch (error) {
            this.logger.error(
                `Error creating payment token: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }
}
