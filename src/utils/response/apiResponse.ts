import { Response } from "express";
import { ZodError } from "zod";
import { ApiResponse as ApiSuccessResponse, ApiErrorResponse } from "./response.inteface";

export class ApiResponse {
  static success<T>(res: Response, data: T, message: string = "Success", statusCode: number = 200): Response {
    const response: ApiSuccessResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, message: string = "Error", statusCode: number = 500, errors?: any): Response {
    const response: ApiErrorResponse = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message: string = "Created successfully"): Response {
    return this.success(res, data, message, 201);
  }

  static validationError(res: Response, error: ZodError): Response {
    const errors = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return this.error(res, "Validation failed", 400, errors);
  }
}
