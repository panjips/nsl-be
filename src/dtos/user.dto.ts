import { Role } from "constant";
import { z } from "zod";

const CreateUserDTO = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    username: z.string().min(1),
    password: z.string().min(8),
    role: z.enum([Role.KASIR, Role.PELANGGAN, Role.STAF]),
    phone_number: z.string().min(10),
});

const UpdateUserDTO = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    username: z.string().optional(),
    role: z.enum([Role.KASIR, Role.PELANGGAN, Role.STAF]).optional(),
    phone_number: z.string().min(10).optional(),
    is_active: z.boolean().optional(),
});

type CreateUserDTOType = z.infer<typeof CreateUserDTO>;
type UpdateUserDTOType = z.infer<typeof UpdateUserDTO> & { role_id: number };

export { CreateUserDTO, UpdateUserDTO };
export type { CreateUserDTOType, UpdateUserDTOType };
