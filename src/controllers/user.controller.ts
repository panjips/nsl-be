import { HttpStatus, TYPES } from "constant";
import { inject } from "inversify";
import { controller, cookies, httpPost, request, response, next, BaseHttpController } from "inversify-express-utils";
import type { NextFunction, Request, Response } from "express";
import {} from "dtos";
import { type ILogger, ApiResponse, type JwtService, CustomError } from "utils";
import { validateZod } from "middleware";

@controller("/user")
export class UserController extends BaseHttpController {
    constructor(
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.JwtService) private readonly jwtService: JwtService,
    ) {
        super();
    }
}
