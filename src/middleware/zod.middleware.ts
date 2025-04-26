import type { ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "constant";
import { ApiResponse } from "utils";

function validateZod<T>(schema: ZodSchema<T>, property: "body" | "query" | "params" = "body") {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[property]);
        if (!result.success) {
            const errors = result.error.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            }));
            return res
                .status(HttpStatus.BAD_REQUEST)
                .json(ApiResponse.error("Validation required", HttpStatus.BAD_REQUEST, errors));
        }
        req.body = result.data;
        next();
    };
}

export { validateZod };
