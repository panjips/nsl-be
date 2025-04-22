import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import { PrismaClient, User } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ILogger } from "utils";
import bcrypt from "bcrypt";

@injectable()
export class AuthRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  public async login(password: string, identifier: string): Promise<User> {
    try {
      const user = await this.prisma.user.findFirstOrThrow({
        where: {
          OR: [{ username: identifier }, { phone_number: identifier }, { email: identifier }],
        },
        include: {
          role: true,
        },
      });

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }

      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
        this.logger.error(`User with identifier ${identifier} not found: ${error.message}`);
        throw new Error("User not found");
      } else if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error("Unknown database error");
    }
  }
}
