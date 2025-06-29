import { JOB_KEY, QUEUE_KEY, TYPES } from "constant";
import { RegisterDTOType } from "dtos";
import { inject, injectable } from "inversify";
import { RoleRepository, UserRepository, AuthRepository } from "repositories";
import bcrypt from "bcrypt";
import { CreateUser } from "models";
import { HttpStatus, Role } from "constant";
import { BaseService } from "./base.service";
import { CustomError, ILogger, MailService, JwtService, QueueService } from "utils";
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
        @inject(TYPES.QueueService) private readonly queueService: QueueService,
        @inject(TYPES.Logger)
        private readonly logger: ILogger,
        @inject(TYPES.MailService) private readonly mailService: MailService,
        @inject(TYPES.JwtService) private readonly jwtService: JwtService,
    ) {
        super();
        this.initializeQueue();
    }

    private initializeQueue(): void {
        this.queueService.createQueue(QUEUE_KEY.TOKEN_QUEUE);
        this.queueService.registerProcessor(JOB_KEY.REMOVE_REFRESH_TOKEN_JOB, async (job) =>
            this.processRemoveRefreshToken(job),
        );
        this.logger.info("Token management queue initialized");
    }

    public async openStore(isOpen: boolean): Promise<void> {
        try {
            await this.authRepository.openStore(isOpen);
            this.logger.info(`Store status updated to ${isOpen ? "open" : "closed"}`);
        } catch (error) {
            this.logger.error(
                `Failed to update store status: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update store status", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public async getStoreStatus(): Promise<boolean> {
        try {
            const storeStatus = await this.authRepository.getStoreStatus();
            return storeStatus.isOpen;
        } catch (error) {
            this.logger.error(
                `Failed to retrieve store status: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve store status", HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
            console.log("Invalid token");
            throw new CustomError("Invalid token", HttpStatus.UNAUTHORIZED);
        }

        const tokenData = await this.authRepository.findByPasswordResetToken(token);
        if (!tokenData) {
            this.logger.warn(`Invalid password reset token: ${token}`);
            throw new CustomError("Invalid token", HttpStatus.UNAUTHORIZED);
        }

        if (tokenData.expires_at < new Date()) {
            throw new CustomError("Token expired", HttpStatus.UNAUTHORIZED);
        }

        await this.authRepository.deactivatePasswordResetToken(tokenData.id);

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

        this.jwtService.verifyRefreshToken(refreshToken);
        if (tokenRecord.expires_at < new Date()) {
            throw new CustomError("Refresh token expired", HttpStatus.UNAUTHORIZED);
        }

        const user = tokenRecord.user;

        return {
            id: user.id,
            role: user.role.name,
            username: user.username,
            email: user.email,
            phone_number: user.phone_number,
        };
    }

    public async logout(refreshToken: string): Promise<void> {
        const token = await this.authRepository.invalidateRefreshToken(refreshToken);
        if (!token) {
            throw new CustomError("Invalid token", HttpStatus.UNAUTHORIZED);
        }
    }

    public async logoutAll(userId: number): Promise<void> {
        await this.authRepository.invalidateAllUserRefreshTokens(userId);
    }

    public async resetPasswordProfile(userId: number, newPassword: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const user = await this.userRepository.updateUser(userId, {
            password: hashedPassword,
        });
        if (!user) {
            throw new CustomError("User not found", HttpStatus.NOT_FOUND);
        }
        this.logger.info(`Password reset successfully for user ID: ${userId}`);
        await this.mailService.notify(
            user.email,
            "Password Reset Confirmation",
            "Your password has been reset successfully. If you did not request this change, please contact support immediately.",
        );
        this.logger.info(`Password reset confirmation email sent to ${user.email}`);
    }

    public async storeRefreshToken(userId: number, token: string): Promise<void> {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const tokenData = await this.authRepository.storeRefreshToken(userId, token, expiresAt);

        const expirationDelay = expiresAt.getTime() - Date.now();
        await this.queueService.addJob(
            QUEUE_KEY.TOKEN_QUEUE,
            JOB_KEY.REMOVE_REFRESH_TOKEN_JOB,
            { tokenId: tokenData.id, token },
            { delay: expirationDelay },
        );
    }

    private async processRemoveRefreshToken(job: any): Promise<void> {
        const { tokenId, token } = job.data;
        await this.authRepository.invalidateRefreshToken(token);

        this.logger.info(`Successfully removed expired refresh token: ${tokenId}`);
    }
}
