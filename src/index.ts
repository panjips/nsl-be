import "reflect-metadata";
import { InversifyExpressServer } from "inversify-express-utils";
import express from "express";
import { container } from "config/inversify.config";
import { config } from "config/env.config";
import { logger } from "utils/logger";

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
  app.use(express.json());
});

const app = server.build();
app.listen(config.port, () => {
  logger.info(`Server running in port ${config.port}`);
});
