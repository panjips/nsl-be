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

    public async openStore(isOpen: boolean) {
        try {
            return await this.prisma.settings.update({
                where: {
                    id: 1,
                },
                data: {
                    isOpen: isOpen,
                },
            });
        } catch (error) {
            this.logger.error(
                `Failed to update store status: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error("Failed to update store status");
        }
    }

    public getStoreStatus() {
        return this.prisma.settings.findFirstOrThrow({
            where: {
                id: 1,
            },
        });
    }

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
                is_used: false,
                expires_at: {
                    gt: new Date(),
                },
            },
            include: {
                user: true,
            },
        });
    }

    async deactivatePasswordResetToken(id: number) {
        await this.prisma.passwordResetToken.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                is_used: true,
            },
        });
    }

    async storeRefreshToken(userId: number, token: string, expiresAt: Date): Promise<any> {
        const tokenData = await this.prisma.refreshToken.create({
            data: {
                user_id: userId,
                token,
                expires_at: expiresAt,
            },
        });
        this.logger.info(`Refresh token stored for user ${userId}`);
        return tokenData;
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
                    user: {
                        include: {
                            role: true,
                        },
                    },
                },
            });
        } catch (error) {
            this.logger.error(
                `Failed to find refresh token: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error("Failed to find refresh token");
        }
    }

    async invalidateRefreshToken(token: string) {
        const tokenData = await this.prisma.refreshToken.updateMany({
            where: {
                AND: [{ token }, { is_active: true }],
            },
            data: {
                is_active: false,
            },
        });

        return tokenData;
    }

    async invalidateAllUserRefreshTokens(userId: number): Promise<void> {
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
