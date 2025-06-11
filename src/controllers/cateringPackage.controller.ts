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
    queryParam,
    BaseHttpController,
} from "inversify-express-utils";
import type { NextFunction, Request, Response } from "express";
import { ApiResponse, CustomError, ILogger } from "utils";
import { CateringPackageService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { CreateCateringPackageDTO, UpdateCateringPackageDTO } from "dtos";

@controller("/catering-package", TYPES.AuthMiddleware)
export class CateringPackageController extends BaseHttpController {
    constructor(
        @inject(TYPES.CateringPackageService) private readonly cateringPackageService: CateringPackageService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/")
    public async getAllCateringPackages(
        @queryParam("minPrice") minPrice: string,
        @queryParam("maxPrice") maxPrice: string,
        @response() res: Response, 
        @next() next: NextFunction
    ) {
        try {
            if (minPrice && maxPrice) {
                const min = Number(minPrice);
                const max = Number(maxPrice);
                
                if (isNaN(min) || isNaN(max)) {
                    throw new CustomError("Invalid price range values", HttpStatus.BAD_REQUEST);
                }
                
                const packages = await this.cateringPackageService.getCateringPackagesByPriceRange(min, max);
                return res
                    .status(HttpStatus.OK)
                    .json(ApiResponse.success("Catering packages retrieved successfully", packages));
            }
            
            const packages = await this.cateringPackageService.getAllCateringPackages();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Catering packages retrieved successfully", packages));
        } catch (error) {
            this.logger.error("Error retrieving catering packages");
            next(error);
        }
    }

    @httpGet("/:id")
    public async getCateringPackageById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);
            
            if (isNaN(id)) {
                throw new CustomError("Invalid catering package ID", HttpStatus.BAD_REQUEST);
            }

            const pkg = await this.cateringPackageService.getCateringPackageById(id);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Catering package retrieved successfully", pkg));
        } catch (error) {
            this.logger.error(`Error retrieving catering package with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPost("/", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(CreateCateringPackageDTO))
    public async createCateringPackage(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const pkg = await this.cateringPackageService.createCateringPackage(req.body);
            return res
                .status(HttpStatus.CREATED)
                .json(ApiResponse.success("Catering package created successfully", pkg));
        } catch (error) {
            this.logger.error(`Error creating catering package: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(UpdateCateringPackageDTO))
    public async updateCateringPackage(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);
            
            if (isNaN(id)) {
                throw new CustomError("Invalid catering package ID", HttpStatus.BAD_REQUEST);
            }

            const pkg = await this.cateringPackageService.updateCateringPackage(id, req.body);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Catering package updated successfully", pkg));
        } catch (error) {
            this.logger.error(`Error updating catering package with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteCateringPackage(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);
            
            if (isNaN(id)) {
                throw new CustomError("Invalid catering package ID", HttpStatus.BAD_REQUEST);
            }

            await this.cateringPackageService.deleteCateringPackage(id);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Catering package deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting catering package with ID ${req.params.id}`);
            next(error);
        }
    }
}