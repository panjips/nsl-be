import { BaseMiddleware } from "inversify-express-utils";
import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import type { Response, NextFunction, Request } from "express";
import { CustomError, JwtService } from "utils";

@injectable()
export class AuthMiddleware extends BaseMiddleware {
    constructor(@inject(TYPES.JwtService) private jwtService: JwtService) {
        super();
    }

    handler(req: Request, _res: Response, next: NextFunction): void {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new CustomError("Token missing", HttpStatus.UNAUTHORIZED);
        }

        const token = authHeader.split(" ")[1];

        try {
            const payload = this.jwtService.verifyAccessToken(token);
            req.user = payload;
            next();
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                throw new CustomError("Token expired", HttpStatus.UNAUTHORIZED);
            }
            throw new CustomError("Invalid token", HttpStatus.UNAUTHORIZED);
        }
    }
}
