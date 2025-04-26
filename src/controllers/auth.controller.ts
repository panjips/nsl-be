import { HttpStatus, TYPES } from "constant";
import { inject } from "inversify";
import { controller, cookies, httpPost, request, response, next, BaseHttpController } from "inversify-express-utils";
import type { AuthService } from "services";
import type { NextFunction, Request, Response } from "express";
import { ForgotPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO } from "dtos";
import { type ILogger, ApiResponse, type JwtService, CustomError } from "utils";
import validateZod from "middleware/zod.middleware";

@controller("/auth")
export class AuthController extends BaseHttpController {
    constructor(
        @inject(TYPES.AuthService)
        private readonly authService: AuthService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.JwtService) private readonly jwtService: JwtService,
    ) {
        super();
    }

    @httpPost("/register", validateZod(RegisterDTO))
    public async register(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            await this.authService.register(req.body);
            this.logger.info("User registered successfully");
            return res.status(HttpStatus.CREATED).json(ApiResponse.created("User registered successfully"));
        } catch (error) {
            this.logger.error("User registration error");
            next(error);
        }
    }

    @httpPost("/login", validateZod(LoginDTO))
    public async login(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const { password, identifier } = req.body;
            const data = await this.authService.login(password, identifier);

            const accessToken = this.jwtService.signAccessToken({
                id: data.id,
                role: data.role.name,
                username: data.username,
                email: data.email,
                phone_number: data.phone_number,
            });

            const refreshToken = this.jwtService.signRefreshToken({
                id: data.id,
            });
            await this.authService.storeRefreshToken(data.id, refreshToken);

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
    public async refreshToken(@cookies() refreshToken: string, @response() res: Response, next: NextFunction) {
        try {
            if (!refreshToken) {
                throw new CustomError("Refresh token not found", HttpStatus.UNAUTHORIZED);
            }

            const tokenData = await this.authService.refreshTokens(refreshToken);
            const accessToken = this.jwtService.signAccessToken({
                id: tokenData.id,
                role: tokenData.role,
                username: tokenData.username,
                email: tokenData.email,
                phone_number: tokenData.phone_number,
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

    @httpPost("/forgot-password", validateZod(ForgotPasswordDTO))
    public async requestPasswordReset(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const { email } = req.body;
            await this.authService.requestPasswordReset(email);
            this.logger.info("Password reset link sent successfully");
            return res.status(HttpStatus.OK).json(ApiResponse.success("Password reset link sent successfully"));
        } catch (error) {
            this.logger.error("Error sending password reset link");
            next(error);
        }
    }

    @httpPost("/reset-password", validateZod(ResetPasswordDTO))
    public async resetPassword(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const { token, newPassword } = req.body;
            await this.authService.resetPassword(token, newPassword);
            this.logger.info("Password reset successfully");
            return res.status(HttpStatus.OK).json(ApiResponse.success("Password reset successfully"));
        } catch (error) {
            this.logger.error("Error resetting password");
            next(error);
        }
    }
}
