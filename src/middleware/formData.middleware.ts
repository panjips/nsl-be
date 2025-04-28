import type { ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";
import { HttpStatus } from "constant";
import { ApiResponse, upload } from "utils";

function FormDataZodValidation<T>(schema: ZodSchema<T>, fileField: string = "image") {
    return (req: Request, res: Response, next: NextFunction) => {
        const uploadMiddleware = upload.single(fileField);

        uploadMiddleware(req, res, (err) => {
            if (err) {
                return res
                    .status(HttpStatus.BAD_REQUEST)
                    .json(ApiResponse.error(`File upload error: ${err.message}`, HttpStatus.BAD_REQUEST));
            }
            const formData: Record<string, any> = {};
            Object.keys(req.body).forEach((key) => {
                const value = req.body[key];
                if (value === undefined || value === "") {
                    return;
                }
                formData[key] = value;
            });

            const result = schema.safeParse(formData);
            if (!result.success) {
                const errors = result.error.errors.map((e) => ({
                    field: e.path.join("."),
                    message: e.message,
                }));
                return res
                    .status(HttpStatus.BAD_REQUEST)
                    .json(ApiResponse.error("Validation failed", HttpStatus.BAD_REQUEST, errors));
            }

            req.body = result.data;
            next();
        });
    };
}

export { FormDataZodValidation };
