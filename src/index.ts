import "reflect-metadata";
import { InversifyExpressServer } from "inversify-express-utils";
import express from "express";
import { container, config } from "config";
import cookieParser from "cookie-parser";
import { errorHandler } from "middleware";
import { Server as HttpServer } from "node:http";
import { ILogger, SocketService } from "utils";
import { TYPES } from "constant";
import { swagger } from "docs";
import cors from "cors";

const server = new InversifyExpressServer(container, null, {
    rootPath: "/api",
});

server.setConfig((app) => {
    app.use(
        cors({
            origin: ["http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:5173",  "http://127.0.0.1:9090", "https://nsl.panjip.my.id"],
            credentials: true,
        }),
    );
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    swagger(app);
});

server.setErrorConfig((app) => {
    app.use(errorHandler);
});

const logger = container.get<ILogger>(TYPES.Logger);
const socket = container.get<SocketService>(TYPES.SocketService);

const app = server.build();

const httpServer = new HttpServer(app);
socket.initialize(httpServer);

httpServer.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`);
    logger.info(`Environment: ${config.env}`);
});
