import { PrismaClient } from "@prisma/client";
import { Container } from "inversify";
import { TYPES } from "constants/types";
import { prisma } from "utils/prisma";
import { AuthRepository } from "repositories/auth.repository";
import { AuthService } from "services/auth.service";
import "../controllers";

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind<AuthRepository>(TYPES.AuthRepository).to(AuthRepository);
container.bind<AuthService>(TYPES.AuthService).to(AuthService);

export { container };
