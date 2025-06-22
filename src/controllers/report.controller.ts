import { HttpStatus, TYPES } from "constant";
import { inject } from "inversify";
import { controller, response, next, BaseHttpController, queryParam, httpGet } from "inversify-express-utils";
import type { NextFunction, Response } from "express";
import { ApiResponse, ILogger } from "utils";
import { ReportService } from "services";
import { ReportType } from "models";
import { OrderType, PaymentType } from "@prisma/client";

@controller("/report", TYPES.AuthMiddleware)
export class ReportController extends BaseHttpController {
    constructor(
        @inject(TYPES.ReportService) private readonly reportService: ReportService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/product-sales")
    public async handleProductSales(
        @queryParam("type") type: ReportType,
        @queryParam("orderType") orderType: OrderType | undefined,
        @queryParam("paymentType") paymentType: PaymentType | undefined,
        @queryParam("startDate") startDate: string | undefined,
        @queryParam("endDate") endDate: string | undefined,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const data = await this.reportService.getProductSalesReport(
                type,
                paymentType,
                orderType,
                startDate,
                endDate,
            );
            return res.status(HttpStatus.OK).json(ApiResponse.success("Sales report retrieved successfully", data));
        } catch (error) {
            this.logger.error(`Error handling notification: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpGet("/inventory-usage")
    public async handleInventoryUsage(
        @queryParam("type") type: ReportType,
        @queryParam("startDate") startDate: string | undefined,
        @queryParam("endDate") endDate: string | undefined,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const data = await this.reportService.getInventoryUsageReport(type, startDate, endDate);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Inventory usage report retrieved successfully", data));
        } catch (error) {
            this.logger.error(`Error handling notification: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpGet("/inventory-purchase")
    public async handleInventoryPurchase(
        @queryParam("type") type: ReportType,
        @queryParam("startDate") startDate: string | undefined,
        @queryParam("endDate") endDate: string | undefined,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const data = await this.reportService.getInventoryPurchaseReport(type, startDate, endDate);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Inventory purchase report retrieved successfully", data));
        } catch (error) {
            this.logger.error(`Error handling notification: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpGet("/reservation-catering")
    public async handleReservationCatering(
        @queryParam("type") type: ReportType,
        @queryParam("startDate") startDate: string | undefined,
        @queryParam("endDate") endDate: string | undefined,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const data = await this.reportService.getReservationCateringReport(type, startDate, endDate);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Inventory purchase report retrieved successfully", data));
        } catch (error) {
            this.logger.error(`Error handling notification: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpGet("/revenue")
    public async handleRevenue(
        @queryParam("type") type: ReportType,
        @queryParam("startDate") startDate: string | undefined,
        @queryParam("endDate") endDate: string | undefined,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const data = await this.reportService.getRevenueReport(type, startDate, endDate);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Revenue report retrieved successfully", data));
        } catch (error) {
            this.logger.error(`Error handling notification: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }
}
