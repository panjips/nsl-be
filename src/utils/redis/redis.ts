import { injectable, inject } from "inversify";
import Redis from "ioredis";
import { config } from "config";
import { TYPES } from "constant";
import { ILogger } from "utils";

@injectable()
export class RedisService {
    private readonly client: Redis;

    constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {
        this.client = new Redis({
            host: config.redis.host,
            port: Number(config.redis.port),
            password: config.redis.password,
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.client.on("connect", () => {
            this.logger.info("Redis client connected");
        });

        this.client.on("error", (err) => {
            this.logger.error(`Redis error: ${err.message}`);
        });

        this.client.on("reconnecting", () => {
            this.logger.warn("Redis client reconnecting");
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.client.get(key);
            if (!data) {
                return null;
            }
            return JSON.parse(data) as T;
        } catch (error) {
            this.logger.error(
                `Redis GET error for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
            );
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds = 600): Promise<boolean> {
        try {
            await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
            return true;
        } catch (error) {
            this.logger.error(
                `Redis SET error for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
            );
            return false;
        }
    }

    async delete(key: string): Promise<boolean> {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            this.logger.error(
                `Redis DELETE error for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
            );
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            this.logger.error(
                `Redis EXISTS error for key "${key}": ${error instanceof Error ? error.message : String(error)}`,
            );
            return false;
        }
    }

    async keys(pattern: string): Promise<string[]> {
        try {
            return await this.client.keys(pattern);
        } catch (error) {
            this.logger.error(`Redis keys error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return [];
        }
    }
}
