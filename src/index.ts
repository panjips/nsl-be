import "reflect-metadata";
import { InversifyExpressServer } from "inversify-express-utils";
import express from "express";
import { container, config } from "config";
import cookieParser from "cookie-parser";
import { errorHandler } from "middleware";
import { ILogger } from "utils";
import { TYPES } from "constant";
import { swagger } from "docs";

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    swagger(app);
});

server.setErrorConfig((app) => {
    app.use(errorHandler);
});

const logger = container.get<ILogger>(TYPES.Logger);
const app = server.build();
app.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`);
    logger.info(`Environment: ${config.env}`);
});
