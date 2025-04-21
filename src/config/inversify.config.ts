import "../controllers";
import { PrismaClient } from "@prisma/client";
import { Container } from "inversify";
import { TYPES } from "constant/types";
import { AuthRepository } from "repositories/auth.repository";
import { AuthService } from "services/auth.service";
import { ILogger, LoggerService, prisma } from "utils";

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind<AuthRepository>(TYPES.AuthRepository).to(AuthRepository);
container.bind<AuthService>(TYPES.AuthService).to(AuthService);
container.bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();

export { container };
