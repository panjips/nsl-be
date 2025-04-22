import "../controllers";
import { PrismaClient } from "@prisma/client";
import { Container } from "inversify";
import { TYPES } from "constant";
import { AuthRepository, AuthTokenRepository, RoleRepository, UserRepository } from "repositories";
import { AuthService } from "services";
import { ILogger, LoggerService, prisma, JwtService } from "utils";

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();
container.bind<JwtService>(TYPES.JwtService).to(JwtService).inSingletonScope();

container.bind<AuthRepository>(TYPES.AuthRepository).to(AuthRepository);
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<RoleRepository>(TYPES.RoleRepository).to(RoleRepository);
container.bind<AuthTokenRepository>(TYPES.AuthTokenRepository).to(AuthTokenRepository);

container.bind<AuthService>(TYPES.AuthService).to(AuthService);
// container.bind<UserService>(TYPES.UserService).to(UserService);

export { container };
