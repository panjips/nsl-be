import "../controllers";
import { PrismaClient } from "@prisma/client";
import { Container } from "inversify";
import { TYPES } from "constant";
import {
    AuthRepository,
    CategoryRepository,
    InventoryRepository,
    ProductRepository,
    PurchaseRepository,
    RoleRepository,
    UserRepository,
} from "repositories";
import { AuthService, CategoryService, ProductService, UserService, InventoryService, PurchaseService } from "services";
import { ILogger, LoggerService, prisma, JwtService, MailService, RedisService, R2Service, QueueService } from "utils";
import { AuthMiddleware } from "middleware";

const container = new Container();

container.bind<PrismaClient>(TYPES.PrismaClient).toConstantValue(prisma);
container.bind<ILogger>(TYPES.Logger).to(LoggerService).inSingletonScope();
container.bind<JwtService>(TYPES.JwtService).to(JwtService).inSingletonScope();
container.bind<MailService>(TYPES.MailService).to(MailService).inSingletonScope();
container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware).inSingletonScope();
container.bind<RedisService>(TYPES.RedisService).to(RedisService).inSingletonScope();
container.bind<R2Service>(TYPES.R2Service).to(R2Service).inSingletonScope();
container.bind<QueueService>(TYPES.QueueService).to(QueueService).inSingletonScope();

container.bind<AuthRepository>(TYPES.AuthRepository).to(AuthRepository);
container.bind<UserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<RoleRepository>(TYPES.RoleRepository).to(RoleRepository);
container.bind<CategoryRepository>(TYPES.CategoryRepository).to(CategoryRepository);
container.bind<ProductRepository>(TYPES.ProductRepository).to(ProductRepository);
container.bind<InventoryRepository>(TYPES.InventoryRepository).to(InventoryRepository);
container.bind<PurchaseRepository>(TYPES.PurchaseRepository).to(PurchaseRepository);

container.bind<AuthService>(TYPES.AuthService).to(AuthService);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<CategoryService>(TYPES.CategoryService).to(CategoryService);
container.bind<ProductService>(TYPES.ProductService).to(ProductService);
container.bind<InventoryService>(TYPES.InventoryService).to(InventoryService);
container.bind<PurchaseService>(TYPES.PurchaseService).to(PurchaseService);

export { container };
