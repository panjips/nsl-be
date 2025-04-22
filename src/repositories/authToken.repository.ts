import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import { PrismaClient } from "@prisma/client";
import { ILogger } from "utils";

@injectable()
export class AuthTokenRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  async store(userId: number, token: string): Promise<void> {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to store refresh token: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error("Failed to store refresh token");
    }
  }

  async findByToken(token: string) {
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
      this.logger.error(`Failed to find refresh token: ${error instanceof Error ? error.message : String(error)}`);
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
      this.logger.error(`Failed to invalidate user tokens: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error("Failed to invalidate user tokens");
    }
  }
}
