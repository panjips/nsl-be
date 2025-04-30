import swaggerUi from "swagger-ui-express";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import { config } from "config";
import fs from "node:fs";
import path from "node:path";

function loadSwaggerDocument() {
    try {
        const env = config.env || "development";
        const swaggerPath = path.resolve(__dirname, env === "development" ? "./swagger.json" : `./swagger.${env}.json`);

        if (!fs.existsSync(swaggerPath)) {
            console.warn(`Swagger file not found: ${swaggerPath}, falling back to default swagger.json`);
            return require("./swagger.json");
        }

        console.log(`Using Swagger file: ${swaggerPath}`);
        return require(swaggerPath);
    } catch (error) {
        console.error("Error loading Swagger document:", error);
        throw new Error("Failed to load Swagger document");
    }
}

const theme = new SwaggerTheme();
const options = {
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
};

export const swagger = (app: any) =>
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(loadSwaggerDocument(), options));
