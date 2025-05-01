import { HttpStatus } from "constant";
import { Request, Response, NextFunction } from "express";
import { CustomError } from "utils";

export const RoleMiddlewareFactory = (roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new CustomError("Not authenticated", HttpStatus.UNAUTHORIZED);
        }

        if (!req.user.role || !roles.includes(req.user.role)) {
            throw new CustomError("You don't have permission to access this resource", HttpStatus.FORBIDDEN);
        }

        next();
    };
};
