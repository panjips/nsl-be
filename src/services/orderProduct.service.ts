import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { OrderProductItemRepository, OrderRepository } from "repositories";
import { BaseService } from "./base.service";
import { UpdateOrderProductItem } from "models";
import { Decimal } from "@prisma/client/runtime/library";

@injectable()
export class OrderProductItemService extends BaseService {
    constructor(
        @inject(TYPES.OrderProductItemRepository)
        private readonly orderProductItemRepository: OrderProductItemRepository,
        @inject(TYPES.OrderRepository) private readonly orderRepository: OrderRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllOrderProductItems() {
        try {
            const items = await this.orderProductItemRepository.findAll();
            return this.excludeMetaFields(items);
        } catch (error) {
            this.logger.error(
                `Error getting all order product items: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve order product items", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getOrderProductItemById(id: number) {
        try {
            const item = await this.orderProductItemRepository.findById(id);

            if (!item) {
                throw new CustomError("Order product item not found", HttpStatus.NOT_FOUND);
            }

            return this.excludeMetaFields(item);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting order product item by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve order product item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getOrderProductItemsByOrderId(orderId: number) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) {
                throw new CustomError("Order not found", HttpStatus.NOT_FOUND);
            }

            const items = await this.orderProductItemRepository.findByOrderId(orderId);
            return this.excludeMetaFields(items);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error getting order product items by order ID ${orderId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve order product items", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateOrderProductItem(id: number, data: UpdateOrderProductItem) {
        try {
            const existingItem = await this.orderProductItemRepository.findById(id);
            if (!existingItem) {
                throw new CustomError("Order product item not found", HttpStatus.NOT_FOUND);
            }

            const order = await this.orderRepository.findById(existingItem.order_id);
            if (!order) {
                throw new CustomError("Associated order not found", HttpStatus.NOT_FOUND);
            }

            if (order.order_status === "COMPLETED" || order.order_status === "CANCELLED") {
                throw new CustomError("Cannot update items on completed or cancelled orders", HttpStatus.BAD_REQUEST);
            }

            const updatedItem = await this.orderProductItemRepository.update(id, data);

            if (data.subtotal !== undefined) {
                const allItems = await this.orderProductItemRepository.findByOrderId(order.id);
                const newTotalAmount = new Decimal(allItems.reduce((sum, item) => sum + item.subtotal.toNumber(), 0));

                await this.orderRepository.update(order.id, { total_amount: newTotalAmount });
                this.logger.info(`Updated order ${order.id} total amount to ${newTotalAmount}`);
            }

            return this.excludeMetaFields(updatedItem);
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error updating order product item ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update order product item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteOrderProductItem(id: number) {
        try {
            const existingItem = await this.orderProductItemRepository.findById(id);
            if (!existingItem) {
                throw new CustomError("Order product item not found", HttpStatus.NOT_FOUND);
            }

            const order = await this.orderRepository.findById(existingItem.order_id);
            if (!order) {
                throw new CustomError("Associated order not found", HttpStatus.NOT_FOUND);
            }

            if (order.order_status === "COMPLETED" || order.order_status === "CANCELLED") {
                throw new CustomError("Cannot delete items from completed or cancelled orders", HttpStatus.BAD_REQUEST);
            }

            await this.orderProductItemRepository.delete(id);

            const remainingItems = await this.orderProductItemRepository.findByOrderId(order.id);
            const newTotalAmount = new Decimal(remainingItems.reduce((sum, item) => sum + item.subtotal.toNumber(), 0));

            await this.orderRepository.update(order.id, { total_amount: newTotalAmount });
            this.logger.info(`Updated order ${order.id} total amount to ${newTotalAmount} after item removal`);

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error deleting order product item ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete order product item", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
