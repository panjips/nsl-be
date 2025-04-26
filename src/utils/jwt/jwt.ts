import jwt from "jsonwebtoken";
import { injectable, inject } from "inversify";
import { TYPES } from "constant";
import { AccessTokenPayload, ILogger, RefreshTokenPayload } from "utils";
import { config } from "config";

@injectable()
export class JwtService {
    constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {}

    signAccessToken(payload: AccessTokenPayload): string {
        try {
            return jwt.sign(payload, config.jwt.accessTokenSecret, {
                expiresIn: "6h",
            });
        } catch (error) {
            this.logger.error(
                `Error signing access token: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error("Failed to generate access token");
        }
    }

    signRefreshToken(payload: RefreshTokenPayload): string {
        try {
            return jwt.sign(payload, config.jwt.refreshTokenSecret, {
                expiresIn: "7d",
            });
        } catch (error) {
            this.logger.error(
                `Error signing refresh token: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error("Failed to generate refresh token");
        }
    }

    verifyAccessToken(token: string): AccessTokenPayload {
        try {
            return jwt.verify(token, config.jwt.accessTokenSecret) as AccessTokenPayload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error("Access token expired");
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("Invalid access token");
            }
            throw new Error("Failed to verify access token");
        }
    }

    verifyRefreshToken(token: string): RefreshTokenPayload {
        try {
            return jwt.verify(token, config.jwt.refreshTokenSecret) as RefreshTokenPayload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error("Refresh token expired");
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error("Invalid refresh token");
            }
            throw new Error("Failed to verify refresh token");
        }
    }

    extractToken(authorizationHeader?: string): string {
        if (!authorizationHeader) {
            throw new Error("Authorization header is missing");
        }

        const parts = authorizationHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            throw new Error("Invalid authorization header format");
        }

        return parts[1];
    }
}
