import { HttpStatus, TYPES } from "constant";
import { inject } from "inversify";
import { controller, response, next, BaseHttpController, httpGet, request } from "inversify-express-utils";
import type { NextFunction, Response, Request } from "express";
import { ApiResponse, ILogger } from "utils";
import { ReportService } from "services";

@controller("/dashboard", TYPES.AuthMiddleware)
export class DashboardController extends BaseHttpController {
    constructor(
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.ReportService) private readonly reportService: ReportService,
    ) {
        super();
    }

    @httpGet("/statistics")
    public async getDashboardStatistics(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const statistics = await this.reportService.getDashboardStatistics(req.user);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Dashboard statistics retrieved successfully", statistics));
        } catch (error) {
            this.logger.error(
                `Error retrieving dashboard statistics: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }

    @httpGet("/top-products")
    public async getTopProducts(@response() res: Response, @next() next: NextFunction) {
        try {
            const topProducts = await this.reportService.getTopProducts();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Top products retrieved successfully", topProducts));
        } catch (error) {
            this.logger.error(
                `Error retrieving top products: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }
}
