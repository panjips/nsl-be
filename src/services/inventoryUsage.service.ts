import { inject, injectable } from "inversify";
import { HttpStatus, JOB_KEY, QUEUE_KEY, Role, TYPES } from "constant";
import { ILogger, CustomError, MailService, QueueService } from "utils";
import {
    InventoryUsageRepository,
    InventoryRepository,
    ProductRecipeRepository,
    AddonRecipeRepository,
    UserRepository,
} from "repositories";
import { CreateInventoryUsage, OrderMapping } from "models";
import { BaseService } from "./base.service";
import { Decimal } from "@prisma/client/runtime/library";
import { SugarType } from "@prisma/client";

@injectable()
export class InventoryUsageService extends BaseService {
    constructor(
        @inject(TYPES.InventoryUsageRepository) private readonly inventoryUsageRepository: InventoryUsageRepository,
        @inject(TYPES.InventoryRepository) private readonly inventoryRepository: InventoryRepository,
        @inject(TYPES.ProductRecipeRepository) private readonly productRecipeRepository: ProductRecipeRepository,
        @inject(TYPES.AddonRecipeRepository) private readonly addonRecipeRepository: AddonRecipeRepository,
        @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
        @inject(TYPES.MailService) private readonly mailService: MailService,
        @inject(TYPES.QueueService) private readonly queueService: QueueService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
        this.initializeNotificationQueue();
    }

    private initializeNotificationQueue(): void {
        this.queueService.createQueue(QUEUE_KEY.INVENTORY_QUEUE);
        this.queueService.registerProcessor(JOB_KEY.LOW_STOCK_NOTIFICATION, this.processEmailNotification.bind(this));
        this.logger.info("Inventory notification queue initialized");
    }

    async getAllInventoryUsages() {
        try {
            const usages = await this.inventoryUsageRepository.findAll();
            return this.excludeMetaFields(usages);
        } catch (error) {
            this.logger.error(
                `Error getting all inventory usages: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve inventory usages", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async processEmailNotification(job: any): Promise<boolean> {
        try {
            const data = job.data;
            this.logger.info(`Processing email notification job: ${JSON.stringify(data)}`);

            if (data.type === "LOW_STOCK_ALERT") {
                return await this.sendLowStockNotification(data);
            }

            this.logger.warn(`Unknown email notification type: ${data.type}`);
            return false;
        } catch (error) {
            this.logger.error(
                `Error processing email notification: ${error instanceof Error ? error.message : String(error)}`,
            );
            return false;
        }
    }

    async sendLowStockNotification(data: any): Promise<boolean> {
        try {
            const users = await this.userRepository.getUserByRole([Role.PEMILIK, Role.STAF]);
            if (!users || users.length === 0) {
                this.logger.warn("No users with PEMILIK or STAF role found for low stock notification");
                return false;
            }

            const emailAddresses = users.filter((user) => user.email && user.is_active).map((user) => user.email);

            if (emailAddresses.length === 0) {
                this.logger.warn("No active users with email addresses found for low stock notification");
                return false;
            }

            const options: Intl.DateTimeFormatOptions = {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            };

            const emailSubject = `[URGENT] Low Stock Alert: ${data.inventoryName}`;
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #ff9800; color: white; padding: 20px; text-align: center;">
                        <h1>⚠️ Low Stock Alert</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                        <p>This is an automated notification to inform you that an inventory item has reached a low stock level.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #ff9800;">
                            <h3>${data.inventoryName}</h3>
                            <p><strong>Current Quantity:</strong> ${data.currentQuantity} ${data.unitOfMeasurement}</p>
                            <p><strong>Minimum Required:</strong> ${data.minQuantity} ${data.unitOfMeasurement}</p>
                            <p><strong>Inventory ID:</strong> ${data.inventoryId}</p>
                            <p><strong>Alert Time:</strong> ${new Date(data.timestamp).toLocaleString("en-GB", options)}</p>
                        </div>
                        
                        <p>Please restock this item as soon as possible to prevent disruptions to service.</p>
                        <p>You can manage inventory by logging into the admin dashboard.</p>
                    </div>
                    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                        <p>Needsixletters Coffee | Pantai Masceti, Gianyar, Bali</p>
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            `;

            await this.mailService.sendBulkEmail(emailAddresses, emailSubject, emailBody);

            this.logger.info(
                `Low stock notification sent to ${emailAddresses.length} users for item ${data.inventoryName}`,
            );
            return true;
        } catch (error) {
            this.logger.error(
                `Error sending low stock notification: ${error instanceof Error ? error.message : String(error)}`,
            );
            return false;
        }
    }

    async createManyInventoryUsages(order_id: number, items: OrderMapping) {
        try {
            if (!items.length) {
                throw new CustomError("No inventory usage items provided", HttpStatus.BAD_REQUEST);
            }

            const inventoryUsages = await this.calculateInventoryUsage(order_id, items);

            if (inventoryUsages.length === 0) {
                this.logger.warn("No inventory usages calculated for the provided items");
                return { count: 0, success: true };
            }

            for (const usage of inventoryUsages) {
                const inventory = await this.inventoryRepository.findById(usage.inventory_id);
                if (!inventory) {
                    this.logger.warn(`Inventory with ID ${usage.inventory_id} not found`);
                    continue;
                }
                if (inventory.quantity < usage.quantity_used) {
                    this.logger.warn(
                        `Insufficient inventory for ID ${usage.inventory_id}. Required: ${usage.quantity_used}, Available: ${inventory.quantity}`,
                    );
                    throw new CustomError(
                        `Insufficient inventory for ID ${usage.inventory_id}`,
                        HttpStatus.BAD_REQUEST,
                    );
                }
                const updatedInventory = await this.inventoryRepository.update(usage.inventory_id, {
                    quantity: new Decimal(inventory.quantity).minus(usage.quantity_used),
                });
                if (!updatedInventory) {
                    this.logger.warn(`Failed to update inventory for ID ${usage.inventory_id}`);
                    throw new CustomError(
                        `Failed to update inventory for ID ${usage.inventory_id}`,
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }
                this.logger.info(
                    `Inventory for ID ${usage.inventory_id} updated successfully. New quantity: ${updatedInventory.quantity}`,
                );

                const isLowStock = await this.inventoryRepository.inventoryLowStockCount(usage.inventory_id);
                if (isLowStock) {
                    try {
                        await this.queueService.addJob(QUEUE_KEY.INVENTORY_QUEUE, JOB_KEY.LOW_STOCK_NOTIFICATION, {
                            type: "LOW_STOCK_ALERT",
                            inventoryId: usage.inventory_id,
                            inventoryName: inventory.name,
                            currentQuantity: updatedInventory.quantity.toString(),
                            unitOfMeasurement: inventory.unit,
                            minQuantity: inventory.min_quantity?.toString() || "0",
                            timestamp: new Date().toISOString(),
                        });

                        this.logger.info(
                            `Low stock notification for inventory ${inventory.name} (ID: ${usage.inventory_id}) added to queue`,
                        );
                    } catch (queueError) {
                        this.logger.error(
                            `Failed to queue low stock notification: ${queueError instanceof Error ? queueError.message : String(queueError)}`,
                        );
                    }
                }
            }

            const createdUsages = await this.inventoryUsageRepository.createMany(inventoryUsages);

            return {
                count: createdUsages,
                success: true,
            };
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error creating inventory usages: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to create inventory usages", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async calculateInventoryUsage(orderId: number, items: OrderMapping): Promise<CreateInventoryUsage[]> {
        try {
            if (!items || items.length === 0) {
                return [];
            }

            const inventoryUsageMap = new Map<number, number>();

            for (const item of items) {
                const productWithRecipe = await this.productRecipeRepository.findByProductIdAndSugarType(
                    item.product_id as number,
                    item.selected_sugar_type as SugarType,
                );

                if (!productWithRecipe || !productWithRecipe.recipes || productWithRecipe.recipes.length === 0) {
                    this.logger.warn(`No recipes found for product ID ${item.product_id}`);
                    continue;
                }

                for (const recipe of productWithRecipe.recipes) {
                    if (!recipe.is_active) continue;

                    const inventoryId = recipe.inventory_id;
                    const quantityPerUnit = Number(recipe.quantity_used);
                    const totalQuantity = quantityPerUnit * (item.quantity ?? 0);

                    inventoryUsageMap.set(inventoryId, (inventoryUsageMap.get(inventoryId) || 0) + totalQuantity);
                }

                if (item.addons && item.addons.length > 0) {
                    for (const addon of item.addons) {
                        const addonWithRecipe = await this.addonRecipeRepository.findByAddonId(
                            addon.addon_id as number,
                        );
                        if (!addonWithRecipe || !addonWithRecipe.recipes || addonWithRecipe.recipes.length === 0) {
                            this.logger.warn(`No recipes found for addon ID ${addon.addon_id}`);
                            continue;
                        }

                        for (const recipe of addonWithRecipe.recipes) {
                            if (!recipe.is_active) continue;

                            const inventoryId = recipe.inventory_id;
                            const quantityPerUnit = Number(recipe.quantity_used);
                            const totalQuantity = quantityPerUnit * (addon.quantity ?? 0) * (item.quantity ?? 0);

                            inventoryUsageMap.set(
                                inventoryId,
                                (inventoryUsageMap.get(inventoryId) || 0) + totalQuantity,
                            );
                        }
                    }
                }
            }

            const inventoryUsage: CreateInventoryUsage[] = [];

            inventoryUsageMap.forEach((quantityUsed, inventoryId) => {
                inventoryUsage.push({
                    order_id: orderId,
                    inventory_id: inventoryId,
                    quantity_used: quantityUsed,
                });
            });

            return inventoryUsage;
        } catch (error) {
            this.logger.error(
                `Error calculating inventory usage: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to calculate inventory usage", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
