import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { PrismaClient } from "@prisma/client";
import { ILogger } from "utils";

@injectable()
export class AuthRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    public async login(identifier: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [{ username: identifier }, { phone_number: identifier }, { email: identifier }],
            },
            include: {
                role: true,
            },
        });

        this.logger.info(`User ${identifier} logged in successfully`);
        return user;
    }

    async storePasswordResetToken(userId: number, token: string): Promise<void> {
        await this.prisma.passwordResetToken.create({
            data: {
                user_id: userId,
                token,
                expires_at: new Date(Date.now() + 3600000),
            },
        });
        this.logger.info(`Password reset token stored for user ${userId}`);
    }

    async findByPasswordResetToken(token: string) {
        return await this.prisma.passwordResetToken.findFirstOrThrow({
            where: {
                token,
                is_active: true,
                expires_at: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });
    }

    async storeRefreshToken(userId: number, token: string): Promise<void> {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await this.prisma.refreshToken.create({
            data: {
                user_id: userId,
                token: token,
                expires_at: expiresAt,
            },
        });
        this.logger.info(`Refresh token stored for user ${userId}`);
    }

    async findByRefreshToken(token: string) {
        try {
            return await this.prisma.refreshToken.findFirst({
                where: {
                    token,
                    is_active: true,
                    expires_at: {
                        gt: new Date(),
                    },
                },
                include: {
                    user: true,
                },
            });
        } catch (error) {
            this.logger.error(
                `Failed to find refresh token: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error("Failed to find refresh token");
        }
    }

    async invalidate(token: string): Promise<void> {
        try {
            await this.prisma.refreshToken.updateMany({
                where: {
                    token,
                },
                data: {
                    is_active: false,
                },
            });

            this.logger.info("Refresh token invalidated");
        } catch (error) {
            this.logger.error(
                `Failed to invalidate refresh token: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error("Failed to invalidate refresh token");
        }
    }

    async invalidateAllUserTokens(userId: number): Promise<void> {
        try {
            await this.prisma.refreshToken.updateMany({
                where: {
                    user_id: userId,
                    is_active: true,
                },
                data: {
                    is_active: false,
                },
            });

            this.logger.info(`All refresh tokens invalidated for user ${userId}`);
        } catch (error) {
            this.logger.error(
                `Failed to invalidate user tokens: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error("Failed to invalidate user tokens");
        }
    }
}
