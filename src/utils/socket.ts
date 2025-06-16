import { inject, injectable } from "inversify";
import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { TYPES } from "constant";
import { ILogger } from "utils";

@injectable()
export class SocketService {
    private io: SocketIOServer | null = null;

    constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {}

    initialize(server: HttpServer): void {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: "*",
            },
        });

        this.io.on("connection", (socket: Socket) => {
            this.logger.info("Client connected:", socket.id);

            socket.on("disconnect", () => {
                this.logger.info("Client disconnected:", socket.id);
            });
        });

        this.logger.info("Socket.IO server initialized");
    }

    emit(event: string, data: any): void {
        if (this.io) {
            this.logger.info(`Emitting event: ${event}`, data);
            this.io.emit(event, data);
        } else {
            this.logger.error("Socket.IO server is not initialized");
        }
    }

    getIO(): SocketIOServer | null {
        return this.io;
    }
}
