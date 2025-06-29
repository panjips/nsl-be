import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError, MidtransService, MailService } from "utils";
import { PaymentRepository, OrderRepository } from "repositories";
import { BaseService } from "./base.service";
import { CreateOrderAddonItem, CreatePayment, MidtransItems, OrderMapping, UpdatePayment } from "models";
import { OrderStatus, PaymentType, TransactionStatus } from "@prisma/client";
import { MidtransNotificationType } from "dtos";
import { config } from "config";
import crypto from "node:crypto";
import { Decimal } from "@prisma/client/runtime/library";
import { InventoryUsageService } from "./inventoryUsage.service";
import { Server } from "socket.io";

@injectable()
export class PaymentService extends BaseService {
    constructor(
        @inject(TYPES.PaymentRepository) private readonly paymentRepository: PaymentRepository,
        @inject(TYPES.OrderRepository) private readonly orderRepository: OrderRepository,
        @inject(TYPES.InventoryUsageService) private readonly inventoryUsageService: InventoryUsageService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
        @inject(TYPES.SocketService) private readonly ws: Server,
        @inject(TYPES.MailService) private readonly ms: MailService,
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

    async createPayment(payment_type: PaymentType, order: any, data?: MidtransItems[]) {
        try {
            if (payment_type !== PaymentType.QRIS_MIDTRANS) {
                const payment: Partial<CreatePayment> = {
                    order_id: order.id,
                    payment_type: payment_type,
                    paid_amount: order.total_amount,
                    trx_status: TransactionStatus.SUCCESS,
                    trx_time: new Date(),
                };

                const createdPayment = await this.paymentRepository.create(payment as CreatePayment);
                this.logger.info(`Payment created with ID ${createdPayment.id} for order ${order.id}`);

                await this.orderRepository.update(order.id, {
                    order_status: OrderStatus.COMPLETED,
                });
                this.logger.info(`Order ${order.id} status updated to COMPLETED`);
                return this.excludeMetaFields(createdPayment);
            }

            const payment: Partial<CreatePayment> = {
                order_id: order.id,
                payment_type: PaymentType.QRIS_MIDTRANS,
                paid_amount: order.total_amount,
                trx_status: TransactionStatus.PENDING,
                trx_time: new Date(),
            };
            await this.paymentRepository.create(payment as CreatePayment);

            const parameter = {
                transaction_details: {
                    order_id: this.formOrderId(order.id),
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

    formOrderId(order_id: number) {
        return `PAYMENT-${order_id}-${Date.now()}`;
    }

    toOrderId(order_id: string) {
        const parts = order_id.split("-");
        if (parts.length < 3) {
            throw new CustomError("Invalid order ID format", HttpStatus.BAD_REQUEST);
        }
        const id = parts[1];
        const parsedId = Number(id);
        if (isNaN(parsedId)) {
            throw new CustomError("Invalid order ID format", HttpStatus.BAD_REQUEST);
        }
        return parsedId;
    }

    async updateMidtransPayment(data: MidtransNotificationType) {
        try {
            const serverKey = config.midtrans.serverKey;

            const order_id = this.toOrderId(data.order_id).toString();

            const localHash = crypto
                .createHash("sha512")
                .update(`${data.order_id}${data.status_code}${data.gross_amount}${serverKey}`)
                .digest("hex");

            if (data.signature_key !== localHash) {
                this.logger.warn(
                    `Signature mismatch for order ${data.order_id}. Expected: ${localHash}, Received: ${data.signature_key}`,
                );
                throw new CustomError("Invalid signature", HttpStatus.UNAUTHORIZED);
            }

            const payment = await this.paymentRepository.findByOrderId(Number(order_id));
            if (!payment || payment.length === 0) {
                this.logger.warn(`Payment not found for order ${order_id}`);
                throw new CustomError("Payment not found", HttpStatus.NOT_FOUND);
            }

            let trx_status: TransactionStatus;
            switch (data.transaction_status) {
                case "capture":
                    trx_status =
                        data.fraud_status === "accept"
                            ? TransactionStatus.SUCCESS
                            : data.fraud_status === "challenge"
                              ? TransactionStatus.PENDING
                              : TransactionStatus.FAILURE;
                    break;
                case "settlement":
                    trx_status = TransactionStatus.SUCCESS;
                    break;
                case "cancel":
                    trx_status = TransactionStatus.FAILURE;
                    break;
                case "deny":
                    trx_status = TransactionStatus.FAILURE;
                    break;
                case "expire":
                    trx_status = TransactionStatus.FAILURE;
                    break;
                case "pending":
                    trx_status = TransactionStatus.PENDING;
                    break;
                default:
                    trx_status = TransactionStatus.FAILURE;
            }

            await this.paymentRepository.update(payment[0].id, {
                trx_status: trx_status,
                paid_amount: new Decimal(data.gross_amount),
            });

            this.logger.info(
                `Payment for order ${order_id} updated to status ${trx_status} with amount ${data.gross_amount}`,
            );

            if (trx_status === TransactionStatus.SUCCESS) {
                const order = await this.orderRepository.findById(Number(order_id));
                if (!order) {
                    this.logger.warn(`Order not found for payment ${order_id}`);
                    throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
                }

                if (order.user?.role.name === "Pelanggan") {
                    // I want to send invoice to customer via email
                    console.log(order.items);
                }

                const update = await this.orderRepository.update(Number(order_id), {
                    order_status: order?.order_type === "ONLINE" ? OrderStatus.PROCESSING : OrderStatus.COMPLETED,
                });

                const validatedItems = await this.convertOrderToOrderMapping(Number(order_id));
                await this.inventoryUsageService.createManyInventoryUsages(Number(order_id), validatedItems);

                this.logger.info(`Order ${order_id} status updated to PROCESSING`);
                if (order?.order_type === "ONLINE") {
                    this.ws.emit("new_online_order", update);
                }
            }

            return {
                order_id: order_id,
                trx_status: trx_status,
                paid_amount: data.gross_amount,
            };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating Midtrans payment for order ${data.order_id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update Midtrans payment", HttpStatus.INTERNAL_SERVER_ERROR);
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

    async convertOrderToOrderMapping(order_id: number): Promise<OrderMapping> {
        try {
            const order = await this.orderRepository.findById(order_id);
            if (!order) {
                throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
            }

            const validatedItems: OrderMapping = order.items.map((item) => {
                if (!item.product_id || !item.quantity || !item.price) {
                    throw new CustomError("Invalid order item data", HttpStatus.BAD_REQUEST);
                }

                const addonItems: Partial<CreateOrderAddonItem>[] =
                    item.addons?.map((addon) => {
                        if (!addon.addon_id || !addon.quantity || !addon.price) {
                            throw new CustomError("Invalid addon item data", HttpStatus.BAD_REQUEST);
                        }

                        return {
                            addon_id: addon.addon_id,
                            quantity: addon.quantity,
                            cost: addon.price,
                            order_product_item_id: addon.order_product_item_id,
                            price: addon.price,
                            subtotal: addon.subtotal,
                        };
                    }) || [];

                return {
                    order_id: order.id,
                    selected_sugar_type: item.selected_sugar_type,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.subtotal,
                    cost: item.cost,
                    addons: addonItems,
                };
            });

            return validatedItems;
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error converting order to order mapping for order ${order_id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to convert order to order mapping", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
