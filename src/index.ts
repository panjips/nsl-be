import "reflect-metadata";
import { InversifyExpressServer } from "inversify-express-utils";
import express from "express";
import { container } from "config/inversify.config";
import { config } from "config/env.config";

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
  app.use(express.json());
});

const app = server.build();
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
