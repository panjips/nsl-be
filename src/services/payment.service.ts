import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { PaymentRepository, OrderRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreatePayment, UpdatePayment } from "models";
import { OrderStatus } from "@prisma/client";

@injectable()
export class PaymentService extends BaseService {
    constructor(
        @inject(TYPES.PaymentRepository) private readonly paymentRepository: PaymentRepository,
        @inject(TYPES.OrderRepository) private readonly orderRepository: OrderRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
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

    async createPayment(data: CreatePayment) {
        try {
            const order = await this.orderRepository.findById(data.order_id);
            if (!order) {
                throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
            }

            if (order.order_status === OrderStatus.CANCELLED) {
                throw new CustomError("Cannot add payment to a cancelled order", HttpStatus.BAD_REQUEST);
            }

            if (order.order_status === OrderStatus.COMPLETED) {
                throw new CustomError("Cannot add payment to a completed order", HttpStatus.BAD_REQUEST);
            }

            const payment = await this.paymentRepository.create(data);

            if (payment.paid_amount.toNumber() >= order.total_amount.toNumber()) {
                await this.orderRepository.updateStatus(order.id, OrderStatus.PAID);
                this.logger.info(`Order ${order.id} status updated to PAID`);
            }

            return this.excludeMetaFields(payment);
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

            if (order.order_status === OrderStatus.CANCELLED || order.order_status === OrderStatus.COMPLETED) {
                throw new CustomError(
                    "Cannot update payment for a cancelled or completed order",
                    HttpStatus.BAD_REQUEST,
                );
            }

            const payment = await this.paymentRepository.update(id, data);
            if (data.paid_amount && payment && order.order_status !== OrderStatus.PAID) {
                if (payment.paid_amount.toNumber() >= order.total_amount.toNumber()) {
                    await this.orderRepository.updateStatus(order.id, OrderStatus.PAID);
                    this.logger.info(`Order ${order.id} status updated to PAID`);
                }
            }

            return this.excludeMetaFields(payment);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating payment ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update payment", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deletePayment(id: number) {
        try {
            const existingPayment = await this.paymentRepository.findById(id);
            if (!existingPayment) {
                throw new CustomError("Payment not found", HttpStatus.NOT_FOUND);
            }

            const order = await this.orderRepository.findById(existingPayment.order_id);
            if (!order) {
                throw new CustomError("Associated order not found", HttpStatus.NOT_FOUND);
            }

            if (order.order_status === OrderStatus.CANCELLED || order.order_status === OrderStatus.COMPLETED) {
                throw new CustomError(
                    "Cannot delete payment for a cancelled or completed order",
                    HttpStatus.BAD_REQUEST,
                );
            }

            const result = await this.paymentRepository.delete(id);
            if (!result) {
                throw new CustomError("Failed to delete payment", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            if (order.order_status === OrderStatus.PAID) {
                const remainingPayments = await this.paymentRepository.findByOrderId(order.id);
                const totalPaid = remainingPayments.reduce((sum, payment) => sum + payment.paid_amount.toNumber(), 0);

                if (totalPaid < order.total_amount.toNumber()) {
                    await this.orderRepository.updateStatus(order.id, OrderStatus.PENDING);
                    this.logger.info(`Order ${order.id} status reverted to PENDING`);
                }
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting payment ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete payment", HttpStatus.INTERNAL_SERVER_ERROR);
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
