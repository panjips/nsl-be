import { TYPES } from "constant";
import { inject } from "inversify";
import { controller, httpPost } from "inversify-express-utils";
import { AuthService } from "services";
import { Request, Response } from "express";
import { RegisterDTO } from "dtos";
import { ILogger, ApiResponse } from "utils";
import { UniqueError } from "utils/error/db.error";

@controller("/auth")
export class AuthController {
  constructor(
    @inject(TYPES.AuthService)
    private readonly authService: AuthService,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  @httpPost("/register")
  public async register(req: Request, res: Response): Promise<Response> {
    try {
      const validate = RegisterDTO.safeParse(req.body);
      if (!validate.success) {
        this.logger.error("Registration validation failed");
        return ApiResponse.validationError(res, validate.error);
      }

      const data = await this.authService.register(validate.data);

      if (!data) {
        this.logger.error("User registration failed");
        return ApiResponse.error(res, "User registration failed", 500);
      }
      this.logger.info("User registered successfully");
      return ApiResponse.created(res, "User created successfully");
    } catch (error) {
      if (error instanceof UniqueError) {
        this.logger.error("Unique constraint error: " + error.errors?.field);
        return ApiResponse.error(res, error.message, 409, error.errors);
      } else if (error instanceof Error) {
        this.logger.error("Registration error: " + error.message);
        return ApiResponse.error(res, error.message, 500);
      } else {
        this.logger.error("Unknown error during registration");
        return ApiResponse.error(res, "Unknown error", 500);
      }
    }
  }
}
