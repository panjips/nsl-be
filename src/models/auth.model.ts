import { type User } from "@prisma/client";
import { RoleResponse } from "./role.model";

export type CreateUser = Omit<User, "id" | "created_at" | "updated_at" | "deleted_at" | "is_active">;

export type UserResponse = Omit<User, "created_at" | "updated_at" | "deleted_at">;

export type UserWithRole = UserResponse & RoleResponse;
