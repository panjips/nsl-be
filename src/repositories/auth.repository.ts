import { CreateUser } from "models";
import { inject, injectable } from "inversify";
import { TYPES } from "constants/types";
import { PrismaClient } from "@prisma/client";
import { Role } from "constants/role";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@injectable()
export class AuthRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient
  ) {}

  public async register(data: CreateUser): Promise<any> {
    try {
      const user = await this.prisma.user.create({
        data: {
          ...data,
          role_id: Number(Role.PELANGGAN),
        },
        include: {
          role: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
    }
  }
}
