import { HttpStatus, TYPES } from "constant";
import { inject } from "inversify";
import { controller, cookies, httpPost, request, response, next, BaseHttpController } from "inversify-express-utils";
import type { AuthService } from "services";
import type { NextFunction, Request, Response } from "express";
import { ForgotPasswordDTO, LoginDTO, RegisterDTO, ResetPasswordDTO } from "dtos";
import { type ILogger, ApiResponse, type JwtService, CustomError } from "utils";
import { ZodValidation } from "middleware";

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

    @httpPost("/register", ZodValidation(RegisterDTO))
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

    @httpPost("/login", ZodValidation(LoginDTO))
    public async login(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const { password, identifier } = req.body;
            const data = await this.authService.login(password, identifier);

            const userData = {
                id: data.id,
                name: data.name,
                role: data.role.name,
                username: data.username,
                email: data.email,
                phone_number: data.phone_number,
            };
            const accessToken = this.jwtService.signAccessToken(userData);

            const refreshToken = this.jwtService.signRefreshToken({
                id: data.id,
            });
            await this.authService.storeRefreshToken(data.id, refreshToken);

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
            });

            this.logger.info("User logged in successfully");
            return res.status(HttpStatus.OK).json(
                ApiResponse.success("User logged in successfully", {
                    user: userData,
                    token: accessToken,
                }),
            );
        } catch (error) {
            this.logger.error("User login error");
            next(error);
        }
    }

    @httpPost("/refresh")
    public async refreshToken(
        @cookies() cookies: { refreshToken: string },
        @response() res: Response,
        next: NextFunction,
    ) {
        try {
            if (!cookies.refreshToken) {
                throw new CustomError("Refresh token not found", HttpStatus.UNAUTHORIZED);
            }

            const tokenData = await this.authService.refreshTokens(cookies.refreshToken);
            const accessToken = this.jwtService.signAccessToken({
                id: tokenData.id,
                role: tokenData.role,
                username: tokenData.username,
                email: tokenData.email,
                phone_number: tokenData.phone_number,
            });

            this.logger.info("Token refreshed successfully");
            return res.status(HttpStatus.OK).json(
                ApiResponse.success("Token refreshed successfully", {
                    token: accessToken,
                }),
            );
        } catch (error) {
            this.logger.error("Token refresh error");
            return next(error);
        }
    }

    @httpPost("/forgot-password", ZodValidation(ForgotPasswordDTO))
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

    @httpPost("/reset-password", ZodValidation(ResetPasswordDTO))
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

    @httpPost("/reset-password-profile", TYPES.AuthMiddleware)
    public async resetPasswordProfile(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const { newPassword } = req.body;
            const userId = Number(req.user?.id);
            await this.authService.resetPasswordProfile(userId, newPassword);
            this.logger.info("Profile password reset successfully");
            return res.status(HttpStatus.OK).json(ApiResponse.success("Profile password reset successfully"));
        } catch (error) {
            this.logger.error("Error resetting profile password");
            next(error);
        }
    }

    @httpPost("/logout", TYPES.AuthMiddleware)
    public async logout(@cookies() cookies: { refreshToken: string }, @response() res: Response, next: NextFunction) {
        try {
            if (!cookies.refreshToken) {
                throw new CustomError("Refresh token not found", HttpStatus.UNAUTHORIZED);
            }

            await this.authService.logout(cookies.refreshToken);
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                path: "/auth",
            });

            this.logger.info("User logged out successfully");
            return res.status(HttpStatus.OK).json(ApiResponse.success("User logged out successfully"));
        } catch (error) {
            this.logger.error("User logout error cause by: ", error);
            next(error);
        }
    }
}
