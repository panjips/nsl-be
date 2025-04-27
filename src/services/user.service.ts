import { TYPES } from "constant";
import { inject, injectable } from "inversify";
import { RoleRepository, UserRepository } from "repositories";
import { CreateUser } from "models";
import { HttpStatus, RedisKey } from "constant";
import { BaseService } from "./base.service";
import { CustomError, RedisService } from "utils";
import { CreateUserDTOType, UpdateUserDTOType } from "dtos";
import bcrypt from "bcrypt";

@injectable()
export class UserService extends BaseService {
    constructor(
        @inject(TYPES.UserRepository)
        private readonly userRepository: UserRepository,
        @inject(TYPES.RoleRepository)
        private readonly roleRepository: RoleRepository,
        @inject(TYPES.RedisService) private readonly redisService: RedisService,
    ) {
        super();
    }

    public async getAllUsers() {
        const cachedUsers = await this.redisService.get(RedisKey.USER_ALL);
        if (cachedUsers) {
            return JSON.parse(cachedUsers as string);
        }

        const users = await this.userRepository.getAllUsers();
        const data = this.excludeMetaFields(users, ["password"]);
        await this.redisService.set(RedisKey.USER_ALL, JSON.stringify(data));

        return data;
    }

    public async getUserById(id: number) {
        const user = await this.userRepository.getUserById(id);
        if (!user) {
            throw new CustomError("User not found", HttpStatus.NOT_FOUND);
        }
        const data = this.excludeMetaFields(user, ["password"]);

        return data;
    }

    public async createUser(data: CreateUserDTOType) {
        const { id } = await this.roleRepository.getRoleById(data.role);
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const { role, ...rest } = data;
        const user: CreateUser = {
            ...rest,
            password: hashedPassword,
            role_id: id,
        };
        const userData = await this.userRepository.createUser(user);
        await this.redisService.delete(RedisKey.USER_ALL);

        return this.excludeMetaFields(userData, ["password"]);
    }

    public async updateUser(id: number, data: UpdateUserDTOType) {
        if (data.role) {
            const { id } = await this.roleRepository.getRoleById(data.role);
            data.role_id = id;
        }

        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            data.password = hashedPassword;
        }

        const { role, ...rest } = data;
        const result = await this.userRepository.updateUser(id, rest);
        if (!result) {
            throw new CustomError("User not found", HttpStatus.NOT_FOUND);
        }
        await this.redisService.delete(RedisKey.USER_ALL);

        return this.excludeMetaFields(result, ["password"]);
    }

    public async deleteUser(id: number) {
        const result = await this.userRepository.deleteUser(id);
        if (!result) {
            throw new CustomError("User not found", HttpStatus.NOT_FOUND);
        }
        await this.redisService.delete(RedisKey.USER_ALL);

        return result;
    }
}
