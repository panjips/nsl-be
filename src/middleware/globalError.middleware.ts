import type { Response, Request, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { HttpStatus } from "constant";
import { ApiResponse, CustomError } from "utils";

function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            const target = err.meta?.target;
            res.status(HttpStatus.CONFLICT).json(ApiResponse.error(`${target} already exists`, HttpStatus.CONFLICT));
        }

        if (err.code === "P2025") {
            res.status(HttpStatus.NOT_FOUND).json(ApiResponse.error("Record not found", HttpStatus.NOT_FOUND));
        }
    }

    if (err instanceof CustomError) {
        res.status(err.statusCode).json(ApiResponse.error(err.message, err.statusCode, err.errors));
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    );
}

export { errorHandler };
