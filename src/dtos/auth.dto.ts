import { z } from "zod";

const RegisterDTO = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    username: z.string().min(1),
    password: z.string().min(8),
    phone_number: z.string().min(10),
});

const LoginDTO = z.object({
    identifier: z.string(),
    password: z.string().min(8),
});

const ForgotPasswordDTO = z.object({
    email: z.string().email(),
});

const ResetPasswordDTO = z
    .object({
        token: z.string(),
        newPassword: z.string().min(8),
        confirmNewPassword: z.string().min(8),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        path: ["confirmNewPassword"],
        message: "Passwords do not match",
    });

type RegisterDTOType = z.infer<typeof RegisterDTO>;
type LoginDTOType = z.infer<typeof LoginDTO>;
type ForgotPasswordDTOType = z.infer<typeof ForgotPasswordDTO>;
type ResetPasswordDTOType = z.infer<typeof ResetPasswordDTO>;

export { RegisterDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO };
export type { RegisterDTOType, LoginDTOType, ForgotPasswordDTOType, ResetPasswordDTOType };
