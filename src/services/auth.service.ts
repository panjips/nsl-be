import { TYPES } from "constant/types";
import { RegisterDTOType } from "dtos";
import { inject, injectable } from "inversify";
import { RoleRepository, UserRepository, AuthRepository, AuthTokenRepository } from "repositories";
import bcrypt from "bcrypt";
import { CreateUser } from "models";
import { Role } from "constant";
import { BaseService } from "./base.service";

@injectable()
export class AuthService extends BaseService {
  constructor(
    @inject(TYPES.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TYPES.RoleRepository)
    private readonly roleRepository: RoleRepository,
    @inject(TYPES.AuthRepository)
    private readonly authRepository: AuthRepository,
    @inject(TYPES.AuthTokenRepository)
    private readonly authTokenRepository: AuthTokenRepository,
  ) {
    super();
  }

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

  public async login(password: string, identifier: string): Promise<any> {
    try {
      const user = await this.authRepository.login(password, identifier);

      return this.excludeMetaFields(user, ["password"]);
    } catch (error) {
      throw error;
    }
  }

  public async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.authTokenRepository.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new Error("Invalid refresh token");
    }
    const user = tokenRecord.user;

    return {
      id: user.id,
      roleId: user.role_id,
      username: user.username,
      email: user.email,
    };
  }

  public async logout(refreshToken: string): Promise<void> {
    await this.authTokenRepository.invalidate(refreshToken);
  }

  public async logoutAll(userId: number): Promise<void> {
    await this.authTokenRepository.invalidateAllUserTokens(userId);
  }

  public async storeRefreshToken(userId: number, token: string): Promise<void> {
    await this.authTokenRepository.store(userId, token);
  }
}
