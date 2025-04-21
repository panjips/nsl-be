import { CreateUser, UserWithRole } from "models";
import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ILogger } from "utils";

@injectable()
export class AuthRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  public async register(data: CreateUser): Promise<UserWithRole> {
    try {
      const user = await this.prisma.user.create({
        data: {
          ...data,
          role_id: 4,
        },
        include: {
          role: true,
        },
      });

      this.logger.info("User created successfully");
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
      throw new Error("Unknown database error");
    }
  }
}
