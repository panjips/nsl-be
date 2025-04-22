import "reflect-metadata";
import { InversifyExpressServer } from "inversify-express-utils";
import express from "express";
import { container, config } from "config";
import cookieParser from "cookie-parser";

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
});

const app = server.build();
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
