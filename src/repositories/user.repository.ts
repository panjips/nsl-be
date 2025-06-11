import { inject, injectable } from "inversify";
import { Role, TYPES } from "constant";
import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ILogger } from "utils";
import { CreateUser, UserResponse } from "models";

@injectable()
export class UserRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async getAllUsers(type?: string) {
        try {
            const whereClause: any = {
                is_active: true,
            };

            if (type === 'employee') {
                whereClause.role = {
                    name: {
                        not: Role.PELANGGAN
                    }
                };
            } else if (type === 'customer') {
                whereClause.role = {
                    name: Role.PELANGGAN
                };
            }

            const users = await this.prisma.user.findMany({
                where: whereClause,
                include: {
                    role: true,
                },
                orderBy: {
                    id: 'asc',
                },
            });

            this.logger.info(`Fetched all users successfully with type filter: ${type || 'none'}`);
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
        const user = await this.prisma.user.findFirst({
            where: {
                id,
            },
            include: {
                role: true,
            },
        });

        this.logger.info(`Fetched user with ID ${user?.id} successfully`);
        return user;
    }

    public async createUser(data: CreateUser): Promise<UserResponse> {
        const user = await this.prisma.user.create({
            data: {
                ...data,
            },
            include: {
                role: true,
            },
        });

        this.logger.info("User inserted to the database");
        return user;
    }

    async updateUser(id: number, data: any) {
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
    }

    async deleteUser(id: number) {
        const deletedUser = await this.prisma.user.update({
            where: {
                id,
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(`Deleted user with ID ${deletedUser.id} successfully`);
        return deletedUser;
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

            this.logger.info(`Fetched user with phone ${user.phone_number} successfully`);
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
