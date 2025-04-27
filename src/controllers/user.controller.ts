import { HttpStatus, Role, TYPES } from "constant";
import { inject } from "inversify";
import {
    controller,
    httpPost,
    request,
    response,
    next,
    BaseHttpController,
    httpGet,
    httpPut,
    httpDelete,
} from "inversify-express-utils";
import type { NextFunction, Request, Response } from "express";
import {} from "dtos";
import { type ILogger, ApiResponse, CustomError } from "utils";
import { ZodValidation, RoleMiddlewareFactory } from "middleware";
import { UserService } from "services";
import { CreateUserDTO } from "dtos/user/user.dto";

@controller("/user", TYPES.AuthMiddleware)
export class UserController extends BaseHttpController {
    constructor(
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.UserService) private readonly userService: UserService,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK]))
    public async getUser(@response() res: Response, @next() next: NextFunction) {
        try {
            const user = await this.userService.getAllUsers();
            return res.status(HttpStatus.OK).json(ApiResponse.success("User fetched successfully", user));
        } catch (error) {
            this.logger.error("Error fetching user");
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.PELANGGAN, Role.KASIR]))
    public async getUserById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            if (isNaN(Number(req.params.id))) {
                throw new CustomError("User ID must be a number", HttpStatus.BAD_REQUEST);
            }

            if (!req.params.id) {
                throw new CustomError("User ID is required", HttpStatus.BAD_REQUEST);
            }

            if (req.user?.id !== Number(req.params.id) && req.user?.role !== Role.PEMILIK) {
                throw new CustomError("You are not authorized to access this user", HttpStatus.FORBIDDEN);
            }

            const user = await this.userService.getUserById(Number(req.params.id));
            return res.status(HttpStatus.OK).json(ApiResponse.success("User fetched successfully", user));
        } catch (error) {
            this.logger.error("Error fetching user");
            next(error);
        }
    }

    @httpPost("/", RoleMiddlewareFactory([Role.PEMILIK]), ZodValidation(CreateUserDTO))
    public async createUser(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            await this.userService.createUser(req.body);
            return res.status(HttpStatus.CREATED).json(ApiResponse.created("User created successfully"));
        } catch (error) {
            this.logger.error("Error creating user");
            next(error);
        }
    }

    @httpPut("/:id", RoleMiddlewareFactory([Role.PEMILIK]))
    public async updateUser(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            if (isNaN(Number(req.params.id))) {
                throw new CustomError("User ID must be a number", HttpStatus.BAD_REQUEST);
            }

            if (!req.params.id) {
                throw new CustomError("User ID is required", HttpStatus.BAD_REQUEST);
            }

            if (req.user?.id !== Number(req.params.id) && req.user?.role !== Role.PEMILIK) {
                throw new CustomError("You are not authorized to access this user", HttpStatus.FORBIDDEN);
            }

            const user = await this.userService.updateUser(Number(req.params.id), req.body);
            return res.status(HttpStatus.OK).json(ApiResponse.success("User updated successfully", user));
        } catch (error) {
            this.logger.error("Error updating user");
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK]))
    public async deleteUser(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            if (isNaN(Number(req.params.id))) {
                throw new CustomError("User ID must be a number", HttpStatus.BAD_REQUEST);
            }

            if (!req.params.id) {
                throw new CustomError("User ID is required", HttpStatus.BAD_REQUEST);
            }

            if (req.user?.id !== Number(req.params.id) && req.user?.role !== Role.PEMILIK) {
                throw new CustomError("You are not authorized to access this user", HttpStatus.FORBIDDEN);
            }

            await this.userService.deleteUser(Number(req.params.id));
            return res.status(HttpStatus.OK).json(ApiResponse.success("User deleted successfully"));
        } catch (error) {
            this.logger.error("Error deleting user");
            next(error);
        }
    }
}
