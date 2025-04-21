import { TYPES } from "constant/types";
import { RegisterDTOType } from "dtos";
import { inject, injectable } from "inversify";
import { UserRepository } from "repositories";
import bcrypt from "bcrypt";
import { CreateUser } from "models";
import { Role } from "constant";

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.AuthRepository)
    private readonly userRepository: UserRepository
  ) {}

  public async register(data: RegisterDTOType): Promise<any> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user: CreateUser = {
        ...data,
        password: hashedPassword,
        role_id: Number(Role.PELANGGAN),
      };
      const userData = await this.userRepository.createUser(user);

      return userData;
    } catch (error) {}
  }
}
