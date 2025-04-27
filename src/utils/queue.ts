import { Queue, Worker, QueueEvents, Job } from "bullmq";
import { injectable, inject } from "inversify";
import { config } from "config";
import { ILogger } from "./logger";
import { TYPES } from "constant";
import Redis from "ioredis";

export type JobProcessor = (job: Job) => Promise<any>;

@injectable()
export class QueueService {
    private queues: Map<string, Queue>;
    private eventHandlers: Map<string, QueueEvents>;
    private workers: Map<string, Worker>;
    private jobProcessors: Map<string, JobProcessor>;
    private redisConfig: Redis;

    constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {
        this.queues = new Map();
        this.eventHandlers = new Map();
        this.workers = new Map();
        this.jobProcessors = new Map();
        this.redisConfig = new Redis({
            host: config.redis.host,
            port: Number(config.redis.port),
            password: config.redis.password,
            maxRetriesPerRequest: null,
        });
    }

    public registerProcessor(jobName: string, processor: JobProcessor): void {
        this.jobProcessors.set(jobName, processor);
        this.logger.info(`Registered processor for job type: ${jobName}`);
    }

    public createQueue(queueName: string): void {
        if (!this.queues.has(queueName)) {
            const queue = new Queue(queueName, {
                connection: this.redisConfig,
            });

            this.queues.set(queueName, queue);
            this.createWorker(queueName);
            this.createQueueEvents(queueName);
        }
    }

    public getQueue(queueName: string): Queue | undefined {
        return this.queues.get(queueName);
    }

    public async addJob(queueName: string, jobName: string, data: any, options = {}): Promise<void> {
        const queue = this.getQueue(queueName);
        if (queue) {
            await queue.add(jobName, data, options);
            this.logger.info(`Added job ${jobName} to queue ${queueName} with data`, {
                jobName,
                queueName,
                options,
            });
        } else {
            this.logger.warn(`Queue ${queueName} not found when adding job ${jobName}`);
        }
    }

    private createWorker(queueName: string): void {
        const worker = new Worker(
            queueName,
            async (job) => {
                this.logger.info(`Processing job ${job.name}`);
                const processor = this.jobProcessors.get(job.name);
                if (!processor) {
                    this.logger.error(`No processor registered for job type: ${job.name}`);
                    throw new Error(`No processor registered for job type: ${job.name}`);
                }
                return await processor(job);
            },
            {
                connection: this.redisConfig,
            },
        );
        worker.on("completed", (job) => {
            this.logger.info(`Job ${job.id} completed successfully.`);
        });

        worker.on("failed", (job, error) => {
            this.logger.error(`Job ${job?.id} failed with error: ${error.message}`);
        });

        this.workers.set(queueName, worker);
    }

    private createQueueEvents(queueName: string): void {
        const queueEvents = new QueueEvents(queueName, {
            connection: this.redisConfig,
        });

        queueEvents.on("completed", (job) => {
            this.logger.info(`Job ${job.jobId} completed successfully.`);
        });

        queueEvents.on("failed", (job) => {
            this.logger.error(`Job ${job.jobId} failed with reason: ${job.failedReason}`);
        });

        this.eventHandlers.set(queueName, queueEvents);
    }
}
