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
import { AddonService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { CreateAddonDTO, UpdateAddonDTO } from "dtos";

@controller("/addon", TYPES.AuthMiddleware)
export class AddonController extends BaseHttpController {
    constructor(
        @inject(TYPES.AddonService) private readonly addonService: AddonService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAllAddons(@response() res: Response, @next() next: NextFunction) {
        try {
            const addons = await this.addonService.getAllAddons();
            return res.status(HttpStatus.OK).json(ApiResponse.success("Addons retrieved successfully", addons));
        } catch (error) {
            this.logger.error("Error retrieving addons");
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAddonById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid addon ID", HttpStatus.BAD_REQUEST);
            }

            const addon = await this.addonService.getAddonById(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Addon retrieved successfully", addon));
        } catch (error) {
            this.logger.error(`Error retrieving addon with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPost("/", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(CreateAddonDTO))
    public async createAddon(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const addon = await this.addonService.createAddon(req.body);
            return res.status(HttpStatus.CREATED).json(ApiResponse.success("Addon created successfully", addon));
        } catch (error) {
            this.logger.error(`Error creating addon: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(UpdateAddonDTO))
    public async updateAddon(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid addon ID", HttpStatus.BAD_REQUEST);
            }

            const addon = await this.addonService.updateAddon(id, req.body);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Addon updated successfully", addon));
        } catch (error) {
            this.logger.error(`Error updating addon with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteAddon(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid addon ID", HttpStatus.BAD_REQUEST);
            }

            await this.addonService.deleteAddon(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Addon deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting addon with ID ${req.params.id}`);
            next(error);
        }
    }
}
