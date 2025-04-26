import { TYPES } from "constant";
import { RegisterDTOType } from "dtos";
import { inject, injectable } from "inversify";
import { RoleRepository, UserRepository, AuthRepository } from "repositories";
import bcrypt from "bcrypt";
import { CreateUser } from "models";
import { HttpStatus, Role } from "constant";
import { BaseService } from "./base.service";
import { CustomError, ILogger, MailService, JwtService } from "utils";
import { config } from "config";

@injectable()
export class AuthService extends BaseService {
    constructor(
        @inject(TYPES.UserRepository)
        private readonly userRepository: UserRepository,
        @inject(TYPES.RoleRepository)
        private readonly roleRepository: RoleRepository,
        @inject(TYPES.AuthRepository)
        private readonly authRepository: AuthRepository,
        @inject(TYPES.Logger)
        private readonly logger: ILogger,
        @inject(TYPES.MailService) private readonly mailService: MailService,
        @inject(TYPES.JwtService) private readonly jwtService: JwtService,
    ) {
        super();
    }

    public async register(data: RegisterDTOType) {
        const { id } = await this.roleRepository.getRoleById(Role.PELANGGAN);
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user: CreateUser = {
            ...data,
            password: hashedPassword,
            role_id: id,
        };
        const userData = await this.userRepository.createUser(user);
        return userData;
    }

    public async login(password: string, identifier: string): Promise<any> {
        const user = await this.authRepository.login(identifier);

        if (!user) {
            throw new CustomError("Invalid credentials", HttpStatus.BAD_REQUEST);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new CustomError("Invalid credentials", HttpStatus.BAD_REQUEST);
        }

        if (!user.is_active) {
            this.logger.warn(`Login attempt on inactive account: ${identifier}`);
            throw new CustomError("Account is inactive");
        }

        return this.excludeMetaFields(user, ["password"]);
    }

    public async requestPasswordReset(email: string): Promise<void> {
        const user = await this.userRepository.getUserByEmail(email);
        if (!user) {
            throw new CustomError("User not found", HttpStatus.NOT_FOUND);
        }

        const resetToken = this.jwtService.signResetToken({
            id: user.id,
        });

        await this.authRepository.storePasswordResetToken(user.id, resetToken);
        this.mailService.notify(
            email,
            "Password Reset Request",
            `Click the link to reset your password: ${config.app.feUrl}/reset-password?token=${resetToken}`,
        );
        this.logger.info(`Password reset email sent to ${email}`);
    }

    public async resetPassword(token: string, newPassword: string): Promise<void> {
        const decode = this.jwtService.decodeResetToken(token);
        if (!decode) {
            throw new CustomError("Invalid token", HttpStatus.UNAUTHORIZED);
        }

        const tokenData = await this.authRepository.findByPasswordResetToken(token);
        if (!tokenData) {
            throw new CustomError("Invalid token", HttpStatus.UNAUTHORIZED);
        }

        if (tokenData.expires_at < new Date()) {
            throw new CustomError("Token expired", HttpStatus.UNAUTHORIZED);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepository.updateUser(decode.id, {
            password: hashedPassword,
        });
    }

    public async refreshTokens(refreshToken: string) {
        const tokenRecord = await this.authRepository.findByRefreshToken(refreshToken);
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
        await this.authRepository.invalidate(refreshToken);
    }

    public async logoutAll(userId: number): Promise<void> {
        await this.authRepository.invalidateAllUserTokens(userId);
    }

    public async storeRefreshToken(userId: number, token: string): Promise<void> {
        await this.authRepository.storeRefreshToken(userId, token);
    }
}
