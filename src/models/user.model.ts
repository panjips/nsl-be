import { User } from "@prisma/client";

export type UpdateUser = Omit<User, "created_at" | "updated_at" | "deleted_at">;
