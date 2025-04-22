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

type RegisterDTOType = z.infer<typeof RegisterDTO>;
type LoginDTOType = z.infer<typeof LoginDTO>;
type ForgotPasswordDTOType = z.infer<typeof ForgotPasswordDTO>;

export { RegisterDTO, RegisterDTOType, LoginDTO, LoginDTOType, ForgotPasswordDTO, ForgotPasswordDTOType };
