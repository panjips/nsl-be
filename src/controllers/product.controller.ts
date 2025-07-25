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
import { ProductService } from "services";
import { RoleMiddlewareFactory, FormDataZodValidation } from "middleware";
import { CreateProductDTO, UpdateProductDTO } from "dtos";

@controller("/product")
export class ProductController extends BaseHttpController {
    constructor(
        @inject(TYPES.ProductService)
        private readonly productService: ProductService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/")
    public async getAllProducts(
        @queryParam("category_id") categoryId: string,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            let products;
            if (categoryId && !isNaN(Number(categoryId))) {
                products = await this.productService.getProductsByCategory(Number(categoryId));
            } else {
                products = await this.productService.getAllProductsAvailableStock();
            }

            return res.status(HttpStatus.OK).json(ApiResponse.success("Products retrieved successfully", products));
        } catch (error) {
            this.logger.error("Error retrieving products");
            next(error);
        }
    }

    @httpGet("/:id")
    public async getProductById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid product ID", HttpStatus.BAD_REQUEST);
            }

            const product = await this.productService.getProductById(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Product retrieved successfully", product));
        } catch (error) {
            this.logger.error(`Error retrieving product with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPost(
        "/",
        TYPES.AuthMiddleware,
        RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.STAF]),
        FormDataZodValidation(CreateProductDTO, "image"),
    )
    public async createProduct(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const product = await this.productService.createProduct(req.body, req.file);
            return res.status(HttpStatus.CREATED).json(ApiResponse.success("Product created successfully", product));
        } catch (error) {
            this.logger.error(`Error creating product: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpPut(
        "/:id",
        TYPES.AuthMiddleware,
        RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.STAF]),
        FormDataZodValidation(UpdateProductDTO, "image"),
    )
    public async updateProduct(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                throw new CustomError("Invalid product ID", HttpStatus.BAD_REQUEST);
            }

            const product = await this.productService.updateProduct(id, req.body, req.file);

            return res.status(HttpStatus.OK).json(ApiResponse.success("Product updated successfully", product));
        } catch (error) {
            this.logger.error(`Error updating product: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpDelete("/:id", TYPES.AuthMiddleware, RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.STAF]))
    public async deleteProduct(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                throw new CustomError("Invalid product ID", HttpStatus.BAD_REQUEST);
            }

            await this.productService.deleteProduct(id);

            return res.status(HttpStatus.OK).json(ApiResponse.success("Product deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting product: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }
}
