import { injectable } from "inversify";
import { createLogger, format, transports, Logger } from "winston";
import { ILogger } from "./logger.interface";

@injectable()
export class LoggerService implements ILogger {
    private logger: Logger;

    constructor() {
        this.logger = createLogger({
            level: "info",
            format: format.combine(
                format.colorize(),
                format.timestamp(),
                format.printf(
                    ({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`,
                ),
            ),
            transports: [new transports.Console()],
        });
    }

    info(message: string, ...meta: any[]): void {
        this.logger.info(message, ...meta);
    }

    error(message: string, ...meta: any[]): void {
        this.logger.error(message, ...meta);
    }

    warn(message: string, ...meta: any[]): void {
        this.logger.warn(message, ...meta);
    }

    debug(message: string, ...meta: any[]): void {
        this.logger.debug(message, ...meta);
    }
}
