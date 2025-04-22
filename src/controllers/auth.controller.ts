import { TYPES } from "constant";
import { inject } from "inversify";
import { controller, cookies, httpPost, request, response } from "inversify-express-utils";
import { AuthService } from "services";
import { Request, Response } from "express";
import { LoginDTO, RegisterDTO } from "dtos";
import { ILogger, ApiResponse, JwtService, UniqueError } from "utils";

@controller("/auth")
export class AuthController {
  constructor(
    @inject(TYPES.AuthService)
    private readonly authService: AuthService,
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @inject(TYPES.JwtService) private readonly jwtService: JwtService,
  ) {}

  @httpPost("/register")
  public async register(@request() req: Request, @response() res: Response): Promise<Response> {
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

  @httpPost("/login")
  public async login(@request() req: Request, @response() res: Response): Promise<Response> {
    try {
      const validate = LoginDTO.safeParse(req.body);
      if (!validate.success) {
        this.logger.error("Login validation failed");
        return ApiResponse.validationError(res, validate.error);
      }

      const { password, identifier } = validate.data;

      const data = await this.authService.login(password, identifier);

      if (!data) {
        this.logger.error("User login failed");
        return ApiResponse.error(res, "User login failed", 401);
      }

      const accessToken = this.jwtService.signAccessToken({
        id: data.id,
        roleId: data.role_id,
        username: data.username,
        email: data.email,
      });

      const refreshToken = this.jwtService.signRefreshToken({
        id: data.id,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/auth/refresh",
      });

      this.logger.info("User logged in successfully");
      return ApiResponse.success(res, { ...data, token: accessToken }, "User logged in successfully");
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error("Login error: " + error.message);
        return ApiResponse.error(res, error.message, 500);
      } else {
        this.logger.error("Unknown error during login");
        return ApiResponse.error(res, "Unknown error", 500);
      }
    }
  }

  @httpPost("/refresh")
  public async refreshToken(@cookies() refreshToken: string, @response() res: Response): Promise<Response> {
    try {
      if (!refreshToken) {
        return ApiResponse.error(res, "Refresh token not found", 401);
      }

      const tokenData = await this.authService.refreshTokens(refreshToken);

      return ApiResponse.success(
        res,
        {
          token: this.jwtService.signAccessToken({
            id: tokenData.id,
            roleId: tokenData.roleId,
            username: tokenData.username,
            email: tokenData.email,
          }),
        },
        "Tokens refreshed",
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error("Token refresh error: " + error.message);
        return ApiResponse.error(res, error.message, 500);
      } else {
        this.logger.error("Unknown error during token refresh");
        return ApiResponse.error(res, "Unknown error", 500);
      }
    }
  }
}
