import { TYPES } from "constant/types";
import { RegisterDTOType } from "dtos";
import { inject, injectable } from "inversify";
import { RoleRepository, UserRepository } from "repositories";
import bcrypt from "bcrypt";
import { CreateUser } from "models";
import { Role } from "constant";

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.RoleRepository)
    private readonly roleRepository: RoleRepository,
  ) {}

  public async register(data: RegisterDTOType): Promise<any> {
    try {
      const { id } = await this.roleRepository.getRoleById(Role.PELANGGAN);

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user: CreateUser = {
        ...data,
        password: hashedPassword,
        role_id: id,
      };

      const userData = await this.userRepository.createUser(user);

      return userData;
    } catch (error) {
      throw error;
    }
  }
}
