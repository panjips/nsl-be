import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError, MidtransService } from "utils";
import { PaymentRepository, OrderRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreatePayment, MidtransItems, UpdatePayment } from "models";
import { OrderStatus, PaymentType, TransactionStatus } from "@prisma/client";

@injectable()
export class PaymentService extends BaseService {
    constructor(
        @inject(TYPES.PaymentRepository) private readonly paymentRepository: PaymentRepository,
        @inject(TYPES.OrderRepository) private readonly orderRepository: OrderRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.MidtransService) private readonly midtrans: MidtransService,
    ) {
        super();
    }

    async getAllPayments() {
        try {
            const payments = await this.paymentRepository.findAll();
            return this.excludeMetaFields(payments);
        } catch (error) {
            this.logger.error(`Error getting all payments: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to retrieve payments", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getPaymentById(id: number) {
        try {
            const payment = await this.paymentRepository.findById(id);

            if (!payment) {
                throw new CustomError("Payment not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(payment);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting payment by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve payment", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getPaymentsByOrderId(orderId: number) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) {
                throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
            }

            const payments = await this.paymentRepository.findByOrderId(orderId);
            return this.excludeMetaFields(payments);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting payments for order ID ${orderId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve payments", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createPayment(payment_type: string, order: any, data?: MidtransItems[]) {
        try {
            if (payment_type === PaymentType.CASH) {
                const payment: Partial<CreatePayment> = {
                    order_id: order.id,
                    payment_type: PaymentType.CASH,
                    paid_amount: order.total_amount,
                    trx_status: TransactionStatus.SUCCESS,
                    trx_time: new Date(),
                };

                const createdPayment = await this.paymentRepository.create(payment as CreatePayment);
                this.logger.info(`Payment created with ID ${createdPayment.id} for order ${order.id}`);

                // update order status to COMPLETED
                await this.orderRepository.update(order.id, {
                    order_status: OrderStatus.COMPLETED,
                });
                this.logger.info(`Order ${order.id} status updated to COMPLETED`);
                return this.excludeMetaFields(createdPayment);
            }

            const parameter = {
                transaction_details: {
                    order_id: order.id.toString(),
                    gross_amount: Number(order.total_amount),
                },
                customer_details: {
                    first_name: order.user ? order.user.name : "POS System",
                    email: order.user ? order.user.email : "needsixletters@test.com",
                },
                item_details: data,
            };

            const snap = await this.midtrans.charge(parameter);

            return {
                order_id: order.id,
                token: snap,
            };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(`Error creating payment: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create payment", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updatePayment(id: number, data: UpdatePayment) {
        try {
            const existingPayment = await this.paymentRepository.findById(id);
            if (!existingPayment) {
                throw new CustomError("Payment not found", HttpStatus.NOT_FOUND);
            }

            const order = await this.orderRepository.findById(existingPayment.order_id);
            if (!order) {
                throw new CustomError("Associated order not found", HttpStatus.NOT_FOUND);
            }
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating payment ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update payment", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getPaymentStatistics() {
        try {
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);

            const dailyTotal = await this.paymentRepository.getTotalPaymentsByDateRange(startOfDay, endOfDay);

            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

            const monthlyTotal = await this.paymentRepository.getTotalPaymentsByDateRange(startOfMonth, endOfMonth);

            const paymentMethodSummary = await this.paymentRepository.getPaymentSummaryByType();

            return {
                dailyTotal,
                monthlyTotal,
                paymentMethodSummary,
            };
        } catch (error) {
            this.logger.error(
                `Error getting payment statistics: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve payment statistics", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
