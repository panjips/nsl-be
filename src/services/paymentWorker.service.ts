import { inject, injectable } from "inversify";
import { TYPES, JOB_KEY, QUEUE_KEY } from "constant";
import { ILogger, QueueService } from "utils";
import { OrderStatus, TransactionStatus } from "@prisma/client";
import { OrderRepository, PaymentRepository } from "repositories";

@injectable()
export class PaymentWorker {
    constructor(
        @inject(TYPES.OrderRepository) private readonly orderRepository: OrderRepository,
        @inject(TYPES.PaymentRepository) private readonly paymentRepository: PaymentRepository,
        @inject(TYPES.QueueService) private readonly queueService: QueueService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        this.initializeQueue();
    }

    private initializeQueue(): void {
        this.queueService.createQueue(QUEUE_KEY.PAYMENT_QUEUE);
        this.queueService.registerProcessor(JOB_KEY.CHECK_EXPIRED_PAYMENTS, this.processExpiredPayments.bind(this));
        this.queueService.registerProcessor(JOB_KEY.UPDATE_EXPIRED_PAYMENT, this.updateExpiredPayment.bind(this));
        this.logger.info("Payment worker queue initialized");
    }

    async scheduleExpiryCheck(orderId: number, expiryDate: Date): Promise<void> {
        try {
            const now = new Date();
            const delay = expiryDate.getTime() - now.getTime();

            if (delay <= 0) {
                // If already expired, process immediately
                await this.queueService.addJob(QUEUE_KEY.PAYMENT_QUEUE, JOB_KEY.UPDATE_EXPIRED_PAYMENT, { orderId });
                return;
            }

            // Schedule job to run at expiry time
            await this.queueService.addJob(
                QUEUE_KEY.PAYMENT_QUEUE,
                JOB_KEY.UPDATE_EXPIRED_PAYMENT,
                { orderId },
                { delay },
            );

            this.logger.info(`Scheduled payment expiry check for order ${orderId} at ${expiryDate.toISOString()}`);
        } catch (error) {
            this.logger.error(
                `Error scheduling payment expiry check: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    async processExpiredPayments(): Promise<boolean> {
        try {
            const now = new Date();
            this.logger.info(`Processing expired payments job at ${now.toISOString()}`);

            const pendingPayments = await this.paymentRepository.findPendingPaymentsOlderThan(15); // 15 minutes

            for (const payment of pendingPayments) {
                await this.queueService.addJob(QUEUE_KEY.PAYMENT_QUEUE, JOB_KEY.UPDATE_EXPIRED_PAYMENT, {
                    orderId: payment.order_id,
                });
            }

            this.logger.info(`Queued ${pendingPayments.length} expired payments for processing`);
            return true;
        } catch (error) {
            this.logger.error(
                `Error processing expired payments: ${error instanceof Error ? error.message : String(error)}`,
            );
            return false;
        }
    }

    async updateExpiredPayment(job: any): Promise<boolean> {
        try {
            const { orderId } = job.data;
            this.logger.info(`Updating expired payment for order ${orderId}`);

            const payment = await this.paymentRepository.findByOrderId(orderId);

            if (!payment || payment.length === 0) {
                this.logger.warn(`No payment found for order ${orderId}`);
                return false;
            }

            // Only update if payment is still in PENDING status
            if (payment[0].trx_status !== TransactionStatus.PENDING) {
                this.logger.info(
                    `Payment for order ${orderId} already has status ${payment[0].trx_status}. No update needed.`,
                );
                return true;
            }

            // Update payment status to EXPIRED
            await this.paymentRepository.update(payment[0].id, {
                trx_status: TransactionStatus.EXPIRE,
                updated_at: new Date(),
            });

            // Update order status to CANCELLED
            await this.orderRepository.update(orderId, {
                order_status: OrderStatus.CANCELLED,
            });

            this.logger.info(
                `Successfully updated payment for order ${orderId} to EXPIRED and order status to CANCELLED`,
            );
            return true;
        } catch (error) {
            this.logger.error(
                `Error updating expired payment: ${error instanceof Error ? error.message : String(error)}`,
            );
            return false;
        }
    }

    // Method to start recurring checks (e.g. every 5 minutes)
    async startExpiryCheckSchedule(): Promise<void> {
        try {
            // Schedule recurring job
            await this.queueService.addRecurringJob(
                QUEUE_KEY.PAYMENT_QUEUE,
                JOB_KEY.CHECK_EXPIRED_PAYMENTS,
                {},
                "*/5 * * * *", // Cron expression: every 5 minutes
            );

            this.logger.info("Payment expiry check schedule started");
        } catch (error) {
            this.logger.error(
                `Error starting payment expiry check schedule: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }
}
