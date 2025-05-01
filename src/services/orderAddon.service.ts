import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { OrderAddonItemRepository, OrderProductItemRepository, OrderRepository, ProductRepository } from "repositories";
import { BaseService } from "./base.service";
import { UpdateOrderAddonItem } from "models";
import { Decimal } from "@prisma/client/runtime/library";

@injectable()
export class OrderAddonItemService extends BaseService {
    constructor(
        @inject(TYPES.OrderAddonItemRepository) private readonly orderAddonItemRepository: OrderAddonItemRepository,
        @inject(TYPES.OrderProductItemRepository)
        private readonly orderProductItemRepository: OrderProductItemRepository,
        @inject(TYPES.OrderRepository) private readonly orderRepository: OrderRepository,
        @inject(TYPES.ProductRepository) private readonly productRepository: ProductRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllOrderAddonItems() {
        try {
            const items = await this.orderAddonItemRepository.findAll();
            return this.excludeMetaFields(items);
        } catch (error) {
            this.logger.error(
                `Error getting all order addon items: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve order addon items", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getOrderAddonItemById(id: number) {
        try {
            const item = await this.orderAddonItemRepository.findById(id);

            if (!item) {
                throw new CustomError("Order addon item not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(item);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting order addon item by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve order addon item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getOrderAddonItemsByProductItemId(orderProductItemId: number) {
        try {
            const orderProductItem = await this.orderProductItemRepository.findById(orderProductItemId);
            if (!orderProductItem) {
                throw new CustomError("Order product item not found", HttpStatus.NOT_FOUND);
            }

            const items = await this.orderAddonItemRepository.findByOrderProductItemId(orderProductItemId);
            return this.excludeMetaFields(items);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting order addon items by product item ID ${orderProductItemId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve order addon items", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateOrderAddonItem(id: number, data: UpdateOrderAddonItem) {
        try {
            const existingItem = await this.orderAddonItemRepository.findById(id);
            if (!existingItem) {
                throw new CustomError("Order addon item not found", HttpStatus.NOT_FOUND);
            }

            const productItem = await this.orderProductItemRepository.findById(existingItem.order_product_item_id);
            if (!productItem) {
                throw new CustomError("Associated order product item not found", HttpStatus.NOT_FOUND);
            }

            const order = await this.orderRepository.findById(productItem.order_id);
            if (!order) {
                throw new CustomError("Associated order not found", HttpStatus.NOT_FOUND);
            }

            if (order.order_status === "COMPLETED" || order.order_status === "CANCELLED") {
                throw new CustomError("Cannot update addons on completed or cancelled orders", HttpStatus.BAD_REQUEST);
            }

            const updatedItem = await this.orderAddonItemRepository.update(id, data);

            if (data.quantity !== undefined || data.price !== undefined) {
                const allAddonItems = await this.orderAddonItemRepository.findByOrderProductItemId(productItem.id);

                const addonTotal = allAddonItems.reduce((sum, item) => {
                    return sum + item.price.toNumber() * item.quantity;
                }, 0);

                const product = await this.productRepository.findById(productItem.product_id);
                if (!product) {
                    throw new CustomError("Associated product not found", HttpStatus.NOT_FOUND);
                }

                const newSubtotal = new Decimal(product.price.toNumber() + addonTotal);

                await this.orderProductItemRepository.update(productItem.id, { subtotal: newSubtotal });

                const allProductItems = await this.orderProductItemRepository.findByOrderId(order.id);
                const newOrderTotal = new Decimal(
                    allProductItems.reduce((sum, item) => sum + item.subtotal.toNumber(), 0),
                );

                await this.orderRepository.update(order.id, { total_amount: newOrderTotal });

                this.logger.info(
                    `Updated order product item ${productItem.id} subtotal to ${newSubtotal} and order ${order.id} total to ${newOrderTotal}`,
                );
            }

            return this.excludeMetaFields(updatedItem);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating order addon item ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update order addon item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteOrderAddonItem(id: number) {
        try {
            const existingItem = await this.orderAddonItemRepository.findById(id);
            if (!existingItem) {
                throw new CustomError("Order addon item not found", HttpStatus.NOT_FOUND);
            }

            const productItem = await this.orderProductItemRepository.findById(existingItem.order_product_item_id);
            if (!productItem) {
                throw new CustomError("Associated order product item not found", HttpStatus.NOT_FOUND);
            }

            const order = await this.orderRepository.findById(productItem.order_id);
            if (!order) {
                throw new CustomError("Associated order not found", HttpStatus.NOT_FOUND);
            }

            if (order.order_status === "COMPLETED" || order.order_status === "CANCELLED") {
                throw new CustomError(
                    "Cannot delete addons from completed or cancelled orders",
                    HttpStatus.BAD_REQUEST,
                );
            }

            await this.orderAddonItemRepository.delete(id);

            const remainingAddonItems = await this.orderAddonItemRepository.findByOrderProductItemId(productItem.id);
            const addonTotal = remainingAddonItems.reduce((sum, item) => {
                return sum + item.price.toNumber() * item.quantity;
            }, 0);

            const product = await this.productRepository.findById(productItem.product_id);
            if (!product) {
                throw new CustomError("Associated product not found", HttpStatus.NOT_FOUND);
            }

            const newSubtotal = new Decimal(product.price.toNumber() + addonTotal);

            await this.orderProductItemRepository.update(productItem.id, { subtotal: newSubtotal });

            const allProductItems = await this.orderProductItemRepository.findByOrderId(order.id);
            const newOrderTotal = new Decimal(allProductItems.reduce((sum, item) => sum + item.subtotal.toNumber(), 0));

            await this.orderRepository.update(order.id, { total_amount: newOrderTotal });

            this.logger.info(
                `Updated order product item ${productItem.id} subtotal to ${newSubtotal} and order ${order.id} total to ${newOrderTotal} after addon removal`,
            );

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting order addon item ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete order addon item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
