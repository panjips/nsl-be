import { type Role } from "@prisma/client";

export type CreateRole = Omit<Role, "id" | "created_at" | "updated_at">;
export type UpdateRole = Partial<CreateRole>;

// export class RoleModel {
//   private role: Role;

//   constructor(role: Role) {
//     this.role = role;
//   }

//   public fromEntity() {
//     return {
//       id: this.role.id,
//       name: this.role.name,
//     };
//   }
// }
