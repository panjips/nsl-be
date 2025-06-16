import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import {
    OrderRepository,
    OrderProductItemRepository,
    OrderAddonItemRepository,
    ProductRepository,
    AddonRepository,
    UserRepository,
} from "repositories";
import { BaseService } from "./base.service";
import { OrderStatus, OrderType, PaymentType } from "@prisma/client";
import { CreateOrder, CreateOrderAddonItem, CreateOrderProductItem, MidtransItems } from "models";
import { Decimal } from "@prisma/client/runtime/library";
import { CreateOrderDTOType } from "dtos";
import { InventoryUsageService } from "./inventoryUsage.service";
import { PaymentService } from "./payment.service";

@injectable()
export class OrderService extends BaseService {
    constructor(
        @inject(TYPES.OrderRepository) private readonly orderRepository: OrderRepository,
        @inject(TYPES.OrderProductItemRepository)
        private readonly orderProductItemRepository: OrderProductItemRepository,
        @inject(TYPES.OrderAddonItemRepository) private readonly orderAddonItemRepository: OrderAddonItemRepository,
        @inject(TYPES.ProductRepository) private readonly productRepository: ProductRepository,
        @inject(TYPES.AddonRepository) private readonly addonRepository: AddonRepository,
        @inject(TYPES.InventoryUsageService) private readonly inventoryUsageService: InventoryUsageService,
        @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
        @inject(TYPES.PaymentService) private readonly paymentService: PaymentService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }
    async getAllOrders(status?: string, type?: string, startDate?: string, endDate?: string) {
        try {
            const parsedStartDate = startDate ? new Date(startDate) : undefined;
            const parsedEndDate = endDate ? new Date(endDate) : undefined;

            console.log(
                `Fetching orders with filters - Status: ${status}, Type: ${type}, Start Date: ${parsedStartDate}, End Date: ${parsedEndDate}`,
            );
            const orders = await this.orderRepository.findAllWithFilter(
                (status as OrderStatus) || undefined,
                (type as OrderType) || undefined,
                parsedStartDate,
                parsedEndDate,
            );

            return this.excludeMetaFields(orders);
        } catch (error) {
            this.logger.error(`Error getting all orders: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to retrieve orders", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getOrdersByStatus(status: OrderStatus) {
        try {
            const orders = await this.orderRepository.findByStatus(status);
            return this.excludeMetaFields(orders);
        } catch (error) {
            this.logger.error(
                `Error getting orders by status ${status}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve orders", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getOrdersByType(type: OrderType) {
        try {
            const orders = await this.orderRepository.findByType(type);
            return this.excludeMetaFields(orders);
        } catch (error) {
            this.logger.error(
                `Error getting orders by type ${type}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve orders", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getOrdersByUserId(userId: number) {
        try {
            const user = await this.userRepository.getUserById(userId);
            if (!user) {
                throw new CustomError("User not found", HttpStatus.NOT_FOUND);
            }

            const orders = await this.orderRepository.findByUserId(userId);
            return this.excludeMetaFields(orders);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting orders by user ID ${userId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve orders", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getOrderById(id: number) {
        try {
            const order = await this.orderRepository.findById(id);

            if (!order) {
                throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(order);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting order by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve order", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createOrder(data: CreateOrderDTOType) {
        try {
            if (data.user_id) {
                const user = await this.userRepository.getUserById(data.user_id);
                if (!user) {
                    throw new CustomError("User not found", HttpStatus.NOT_FOUND);
                }
            }

            let totalAmount = new Decimal(0);
            const validatedItems: Partial<
                CreateOrderProductItem & {
                    addons: Partial<CreateOrderAddonItem>[];
                }
            >[] = [];
            const midtransItems: MidtransItems[] = [];

            let paymentType: PaymentType;
            switch (data.payment_type.toUpperCase()) {
                case "CASH":
                    paymentType = "CASH";
                    break;
                case "QRIS MIDTRANS":
                    paymentType = "QRIS_MIDTRANS";
                    break;
                case "QRIS OFFLINE":
                    paymentType = "QRIS_OFFLINE";
                    break;
                default:
                    this.logger.warn(`Unsupported payment type: ${data.payment_type}`);
                    throw new CustomError(`Unsupported payment type: ${data.payment_type}`, HttpStatus.BAD_REQUEST);
            }

            for (const item of data.items) {
                const product = await this.productRepository.findById(item.product_id);
                if (!product) {
                    throw new CustomError(`Product with ID ${item.product_id} not found`, HttpStatus.NOT_FOUND);
                }

                let itemSubtotal = product.price.times(item.quantity || 1);
                const addonItems: Partial<CreateOrderAddonItem>[] = [];

                if (paymentType === PaymentType.QRIS_MIDTRANS) {
                    midtransItems.push({
                        id: `product-${product.id}`,
                        name: product.name,
                        price: product.price.toNumber(),
                        quantity: item.quantity || 1,
                    });
                }

                if (item.addons && item.addons.length > 0) {
                    for (const addonItem of item.addons) {
                        const addon = await this.addonRepository.findById(addonItem.addon_id);
                        if (!addon) {
                            throw new CustomError(
                                `Addon with ID ${addonItem.addon_id} not found`,
                                HttpStatus.NOT_FOUND,
                            );
                        }

                        const addonSubtotal = addon.price.times(addonItem.quantity || 1);

                        itemSubtotal = itemSubtotal.plus(addonSubtotal);

                        addonItems.push({
                            ...addonItem,
                            cost: addon.cost,
                            subtotal: addonSubtotal,
                            addon_id: addon.id,
                            quantity: addonItem.quantity || 1,
                            price: addon.price,
                        });

                        if (paymentType === PaymentType.QRIS_MIDTRANS) {
                            midtransItems.push({
                                id: `addon-${addon.id}`,
                                name: `${product.name} - ${addon.name}`,
                                price: addon.price.toNumber(),
                                quantity: addonItem.quantity || 1,
                            });
                        }
                    }
                }

                totalAmount = totalAmount.plus(itemSubtotal);
                validatedItems.push({
                    ...item,
                    cost: product.cost,
                    product_id: product.id,
                    quantity: item.quantity || 1,
                    price: product.price,
                    subtotal: itemSubtotal,
                    addons: addonItems,
                });
            }

            data.user_id = data.order_type === OrderType.ONLINE ? data.user_id : undefined;

            const orderData = {
                user_id: data.user_id,
                order_type: data.order_type,
                order_status: OrderStatus.PENDING,
                total_amount: new Decimal(totalAmount),
                notes: data.notes,
            } as CreateOrder;

            const order = await this.orderRepository.create(orderData);

            for (const item of validatedItems) {
                if (!item.product_id || !item.cost || !item.price || !item.quantity || !item.subtotal) {
                    throw new CustomError("Invalid order item data", HttpStatus.BAD_REQUEST);
                }

                const orderItem = await this.orderProductItemRepository.create({
                    product_id: item.product_id,
                    cost: item.cost,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                    order_id: order.id,
                });

                if (item.addons && item.addons.length > 0) {
                    const orderAddonItems = item.addons.map((addon: any) => ({
                        order_product_item_id: orderItem.id,
                        addon_id: addon.addon_id,
                        quantity: addon.quantity || 1,
                        price: addon.price,
                        cost: addon.cost,
                        subtotal: addon.subtotal,
                    }));

                    await this.orderAddonItemRepository.createMany(orderAddonItems);
                }
            }

            const completeOrder = await this.orderRepository.findById(order.id);

            if (paymentType !== PaymentType.QRIS_MIDTRANS) {
                await this.inventoryUsageService.createManyInventoryUsages(order.id, validatedItems);
                await this.paymentService.createPayment(paymentType, completeOrder);
            } else {
                const midtransPayment = await this.paymentService.createPayment(
                    paymentType,
                    completeOrder,
                    midtransItems,
                );

                return midtransPayment;
            }
            return {
                order_id: completeOrder?.id,
            };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(`Error creating order: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create order", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateOrderStatus(id: number, status: OrderStatus) {
        try {
            const existingOrder = await this.orderRepository.findById(id);
            if (!existingOrder) {
                throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
            }

            const updatedOrder = await this.orderRepository.updateStatus(id, status);
            return this.excludeMetaFields(updatedOrder);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating order ${id} status: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update order status", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateOrder(id: number, data: any) {
        try {
            const existingOrder = await this.orderRepository.findById(id);
            if (!existingOrder) {
                throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
            }

            const updatedOrder = await this.orderRepository.update(id, data);
            return this.excludeMetaFields(updatedOrder);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(`Error updating order ${id}: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to update order", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async cancelOrder(id: number) {
        try {
            const existingOrder = await this.orderRepository.findById(id);
            if (!existingOrder) {
                throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
            }

            if (existingOrder.order_status === OrderStatus.COMPLETED) {
                throw new CustomError("Cannot cancel a completed order", HttpStatus.BAD_REQUEST);
            }

            const updatedOrder = await this.orderRepository.updateStatus(id, OrderStatus.CANCELLED);
            return this.excludeMetaFields(updatedOrder);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error cancelling order ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to cancel order", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteOrder(id: number) {
        try {
            const existingOrder = await this.orderRepository.findById(id);
            if (!existingOrder) {
                throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
            }

            await this.orderProductItemRepository.deleteByOrderId(id);

            const result = await this.orderRepository.delete(id);
            if (!result) {
                throw new CustomError("Failed to delete order", HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(`Error deleting order ${id}: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to delete order", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getOrderStatistics() {
        try {
            const statusCounts = await this.orderRepository.countByStatus();

            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));

            const dailyRevenue = await this.orderRepository.getTotalRevenueByDateRange(startOfDay, endOfDay);

            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

            const monthlyRevenue = await this.orderRepository.getTotalRevenueByDateRange(startOfMonth, endOfMonth);

            const topSellingProducts = await this.orderProductItemRepository.getTopSellingProducts(5);
            const topSellingAddons = await this.orderAddonItemRepository.getTopSellingAddons(5);

            return {
                statusCounts,
                dailyRevenue,
                monthlyRevenue,
                topSellingProducts,
                topSellingAddons,
            };
        } catch (error) {
            this.logger.error(
                `Error getting order statistics: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve order statistics", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
