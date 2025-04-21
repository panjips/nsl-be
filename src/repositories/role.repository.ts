import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ILogger } from "utils";
import { RoleResponse } from "models";

@injectable()
export class RoleRepository {
  constructor(
    @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
    @inject(TYPES.Logger) private readonly logger: ILogger,
  ) {}

  async getAllRoles() {
    try {
      const roles = await this.prisma.role.findMany();

      this.logger.info("Fetched all roles successfully");
      return roles;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
      throw new Error("Unknown database error");
    }
  }

  async getRoleById(role: string): Promise<RoleResponse> {
    try {
      const roleData = await this.prisma.role.findFirstOrThrow({
        where: {
          name: role,
        },
      });

      this.logger.info(`Fetched role with ID ${roleData.id} successfully`);
      return roleData;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
      throw new Error("Unknown database error");
    }
  }

  async createRole(role: string) {
    try {
      const newRole = await this.prisma.role.create({
        data: {
          name: role,
        },
      });

      this.logger.info(`Created new role with ID ${newRole.id} successfully`);
      return newRole;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
      throw new Error("Unknown database error");
    }
  }

  async updateRole(roleId: number, role: string) {
    try {
      const updatedRole = await this.prisma.role.update({
        where: {
          id: roleId,
        },
        data: {
          name: role,
        },
      });

      this.logger.info(`Updated role with ID ${updatedRole.id} successfully`);
      return updatedRole;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new Error("Database error: " + error.message);
      } else if (error instanceof Error) {
        throw new Error("Database error: " + error.message);
      }
      throw new Error("Unknown database error");
    }
  }

  async deleteRole(roleId: number) {
    try {
      const deletedRole = await this.prisma.role.delete({
        where: {
          id: roleId,
        },
      });

      this.logger.info(`Deleted role with ID ${deletedRole.id} successfully`);
      return deletedRole;
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
