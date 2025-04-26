import { TYPES } from "constant";
import {  } from "dtos";
import { inject, injectable } from "inversify";
import { RoleRepository, UserRepository } from "repositories";
import {  } from "models";
import { HttpStatus, Role } from "constant";
import { BaseService } from "./base.service";
import { CustomError, ILogger, MailService, JwtService } from "utils";
import { config } from "config";

@injectable()
export class UserService extends BaseService {
    constructor(
        @inject(TYPES.UserRepository)
        private readonly userRepository: UserRepository,
        @inject(TYPES.RoleRepository)
        private readonly roleRepository: RoleRepository,
        @inject(TYPES.Logger)
        private readonly logger: ILogger,
        @inject(TYPES.MailService) private readonly mailService: MailService,
        @inject(TYPES.JwtService) private readonly jwtService: JwtService,
    ) {
        super();
    }

    public async getUserById(id: number) {
        const user = await this.userRepository.getUserById(id);
        if (!user) {
            throw new CustomError("User not found", HttpStatus.NOT_FOUND);
        }
        return user;
    }

    public async updateUser(id: number, data: any) {
        const user = await this.userRepository.updateUser(id, data);
        if (!user) {
            throw new CustomError("User not found", HttpStatus.NOT_FOUND);
        }
        return user;
    }
}
