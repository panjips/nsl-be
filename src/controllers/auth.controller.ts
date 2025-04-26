import { HttpStatus, TYPES } from "constant";
import { inject } from "inversify";
import { controller, cookies, httpPost, request, response, next } from "inversify-express-utils";
import type { AuthService } from "services";
import type { NextFunction, Request, Response } from "express";
import { LoginDTO, RegisterDTO } from "dtos";
import { type ILogger, ApiResponse, type JwtService, CustomError } from "utils";
import validateZod from "middleware/zod.middleware";

@controller("/auth")
export class AuthController {
    constructor(
        @inject(TYPES.AuthService)
        private readonly authService: AuthService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.JwtService) private readonly jwtService: JwtService,
    ) {}

    @httpPost("/register", validateZod(RegisterDTO))
    public async register(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            await this.authService.register(req.body);
            this.logger.info("User registered successfully");
            return res
                .status(HttpStatus.CREATED)
                .json(ApiResponse.created("User registered successfully"));
        } catch (error) {
            this.logger.error("User registration error");
            next(error);
        }
    }

    @httpPost("/login", validateZod(LoginDTO))
    public async login(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const { password, identifier } = req.body;
            const data = await this.authService.login(password, identifier);

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
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("User logged in successfully", { token: accessToken }));
        } catch (error) {
            this.logger.error("User login error");
            next(error);
        }
    }

    @httpPost("/refresh")
    public async refreshToken(
        @cookies() refreshToken: string,
        @response() res: Response,
        next: NextFunction,
    ) {
        try {
            if (!refreshToken) {
                throw new CustomError("Refresh token not found", HttpStatus.UNAUTHORIZED);
            }

            const tokenData = await this.authService.refreshTokens(refreshToken);
            const accessToken = this.jwtService.signAccessToken({
                id: tokenData.id,
                roleId: tokenData.roleId,
                username: tokenData.username,
                email: tokenData.email,
            });

            this.logger.info("Token refreshed successfully");
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Token refreshed successfully", { token: accessToken }));
        } catch (error) {
            this.logger.error("Token refresh error");
            return next(error);
        }
    }

    public async forgetPassword(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const { email } = req.body;
            await this.authService.forgetPassword(email);
            this.logger.info("Password reset link sent successfully");
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Password reset link sent successfully"));
        } catch (error) {
            this.logger.error("Error sending password reset link");
            next(error);
        }
    }
}
