import { type User } from "@prisma/client";

export type CreateUser = Omit<
  User,
  "id" | "created_at" | "updated_at" | "deleted_at" | "is_active" | "role_id"
>;
