import { type Role } from "@prisma/client";

export type CreateRole = Omit<Role, "id" | "created_at" | "updated_at" | "deleted_at">;

export type UpdateRole = Partial<CreateRole>;

export type RoleResponse = Omit<Role, "created_at" | "updated_at" | "deleted_at">;
