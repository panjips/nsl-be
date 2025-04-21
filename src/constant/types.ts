export const TYPES = {
  Logger: Symbol.for("Logger"),
  PrismaClient: Symbol.for("PrismaClient"),
  UserService: Symbol.for("UserService"),
  UserRepository: Symbol.for("UserRepository"),
  AuthService: Symbol.for("AuthService"),
  AuthRepository: Symbol.for("AuthRepository"),
  RoleService: Symbol.for("RoleService"),
  RoleRepository: Symbol.for("RoleRepository"),
  AuthMiddleware: Symbol.for("AuthMiddleware"),
  AuthTokenService: Symbol.for("AuthTokenService"),
  AuthTokenRepository: Symbol.for("AuthTokenRepository"),
  AuthTokenMiddleware: Symbol.for("AuthTokenMiddleware"),
};
