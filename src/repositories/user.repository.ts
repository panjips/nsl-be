import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ILogger } from "utils";
import { CreateUser, UserWithRole } from "models";

@injectable()
export class UserRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          is_active: true,
        },
        include: {
          role: true,
        },
      });

      this.logger.info("Fetched all users successfully");
      return users;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
      throw new Error("Unknown database error");
    }
  }

  async getUserById(id: number) {
    try {
      const user = await this.prisma.user.findFirstOrThrow({
        where: {
          id,
        },
        include: {
          role: true,
        },
      });

      this.logger.info(`Fetched user with ID ${user.id} successfully`);
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

  public async createUser(data: CreateUser): Promise<UserWithRole> {
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
      } else if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
      throw new Error("Unknown database error");
    }
  }

  async updateUser(id: number, data: any) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: {
          id,
        },
        data,
        include: {
          role: true,
        },
      });

      this.logger.info(`Updated user with ID ${updatedUser.id} successfully`);
      return updatedUser;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
      throw new Error("Unknown database error");
    }
  }

  async deleteUser(id: number) {
    try {
      const deletedUser = await this.prisma.user.update({
        where: {
          id,
        },
        data: {
          is_active: false,
        },
      });

      this.logger.info(`Deleted user with ID ${deletedUser.id} successfully`);
      return deletedUser;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
      throw new Error("Unknown database error");
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await this.prisma.user.findFirstOrThrow({
        where: {
          email,
        },
        include: {
          role: true,
        },
      });

      this.logger.info(`Fetched user with email ${user.email} successfully`);
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

  async getUserByPhone(phone_number: string) {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: {
          phone_number,
        },
        include: {
          role: true,
        },
      });

      this.logger.info(
        `Fetched user with phone ${user.phone_number} successfully`
      );
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

  async getUserByRole(role: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          role: {
            name: role,
          },
        },
        include: {
          role: true,
        },
      });

      this.logger.info(`Fetched users with role ${role} successfully`);
      return users;
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
