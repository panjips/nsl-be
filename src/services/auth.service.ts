import { TYPES } from "constants/types";
import { RegisterDTOType } from "dtos";
import { inject, injectable } from "inversify";
import { AuthRepository } from "repositories/auth.repository";
import bcrypt from "bcrypt";
import { CreateUser } from "models";

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.AuthRepository)
    private readonly authRepository: AuthRepository
  ) {}

  public async register(data: RegisterDTOType): Promise<any> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user: CreateUser = {
      ...data,
      password: hashedPassword,
    };
    const userData = await this.authRepository.register(user);

    return userData;
  }
}
