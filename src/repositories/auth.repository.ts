import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import type { PrismaClient } from "@prisma/client";

@injectable()
export class AuthRepository {
  constructor(@inject(TYPES.PrismaClient) private readonly prisma: PrismaClient) {}

  public async login(identifier: string) {
    return await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { phone_number: identifier }, { email: identifier }],
      },
      include: {
        role: true,
      },
    });
  }
}
