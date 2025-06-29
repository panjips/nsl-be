import { inject, injectable } from "inversify";
import { HttpStatus, TYPES } from "constant";
import { ILogger, CustomError } from "utils";
import { BaseService } from "./base.service";
import { InventoryUsageRepository, OrderRepository, PurchaseRepository, ReservationRepository } from "repositories";
import { InventoryUsage, OrderType, PaymentType, Purchase } from "@prisma/client";
import { InventoryPurchaseReport, InventoryUsageReport, ReportType, ReservationReport, RevenueReport } from "models";
import { Decimal } from "@prisma/client/runtime/library";
import {
    addDays,
    endOfDay,
    endOfMonth,
    endOfWeek,
    endOfYear,
    format,
    startOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
    subDays,
} from "date-fns";

interface ProductSalesReportItem {
    product_id: number;
    product_name: string;
    quantity: number;
    price: string | Decimal;
    cost: string | Decimal;
    total: string | Decimal;
    total_cost: string | Decimal;
    gross_profit: string | Decimal;
}

interface AddonSalesReportItem {
    addon_id: number;
    addon_name: string;
    quantity: number;
    price: string | Decimal;
    cost: string | Decimal;
    total: string | Decimal;
    total_cost: string | Decimal;
    gross_profit: string | Decimal;
}

@injectable()
export class ReportService extends BaseService {
    constructor(
        @inject(TYPES.OrderRepository)
        private readonly orderRepository: OrderRepository,
        @inject(TYPES.InventoryUsageRepository)
        private readonly inventoryUsageRepository: InventoryUsageRepository,
        @inject(TYPES.PurchaseRepository)
        private readonly purchaseRepository: PurchaseRepository,
        @inject(TYPES.ReservationRepository)
        private readonly reservationRepository: ReservationRepository,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    private getDateRange(
        type: ReportType,
        startDateCustom?: string,
        endDateCustom?: string,
    ): { startDate: Date; endDate: Date } {
        let startDate: Date;
        let endDate: Date;
        const now = new Date();

        switch (type) {
            case "DAILY":
                startDate = startOfDay(now);
                endDate = endOfDay(now);
                break;
            case "CUSTOM":
                if (!startDateCustom || !endDateCustom) {
                    throw new CustomError(
                        "Start date and end date are required for custom report",
                        HttpStatus.BAD_REQUEST,
                    );
                }
                startDate = startOfDay(new Date(startDateCustom));
                endDate = endOfDay(new Date(endDateCustom));
                if (startDate > endDate) {
                    throw new CustomError("Start date cannot be after end date", HttpStatus.BAD_REQUEST);
                }
                break;
            case "WEEKLY":
                startDate = startOfWeek(now, { weekStartsOn: 1 });
                endDate = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case "MONTHLY":
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case "YEARLY":
                startDate = startOfYear(now);
                endDate = endOfYear(now);
                break;
            default:
                throw new CustomError("Invalid report type", HttpStatus.BAD_REQUEST);
        }
        return { startDate, endDate };
    }

    private processSalesReport(orders: any[]) {
        const productSalesMap = new Map<string, ProductSalesReportItem>();
        const addonSalesMap = new Map<string, AddonSalesReportItem>();

        for (const order of orders) {
            for (const orderItem of order.items) {
                const productKey = `${orderItem.product_id}-${orderItem.price.toString()}`;
                let existingProduct = productSalesMap.get(productKey);

                if (existingProduct) {
                    existingProduct.quantity += orderItem.quantity;
                    existingProduct.total_cost = new Decimal(existingProduct.quantity)
                        .mul(existingProduct.cost)
                        .toString();
                    existingProduct.total = new Decimal(existingProduct.quantity).mul(existingProduct.price).toString();
                    existingProduct.gross_profit = new Decimal(existingProduct.quantity)
                        .mul(new Decimal(existingProduct.price).sub(existingProduct.cost))
                        .toString();
                } else {
                    productSalesMap.set(productKey, {
                        product_id: orderItem.product_id,
                        product_name: orderItem.product.name,
                        quantity: orderItem.quantity,
                        cost: orderItem.cost,
                        price: orderItem.price,
                        total: new Decimal(orderItem.quantity).mul(orderItem.price).toString(),
                        total_cost: new Decimal(orderItem.quantity).mul(orderItem.cost).toString(),
                        gross_profit: new Decimal(orderItem.quantity)
                            .mul(new Decimal(orderItem.price).sub(orderItem.cost))
                            .toString(),
                    });
                }

                for (const addon of orderItem.addons) {
                    const addonKey = `${addon.addon_id}-${addon.price.toString()}`;
                    let existingAddon = addonSalesMap.get(addonKey);

                    if (existingAddon) {
                        existingAddon.quantity += addon.quantity;
                        existingAddon.total_cost = new Decimal(existingAddon.quantity)
                            .mul(existingAddon.cost)
                            .toString();
                        existingAddon.total = new Decimal(existingAddon.quantity).mul(existingAddon.price).toString();
                        existingAddon.gross_profit = new Decimal(existingAddon.quantity)
                            .mul(new Decimal(existingAddon.price).sub(existingAddon.cost))
                            .toString();
                    } else {
                        addonSalesMap.set(addonKey, {
                            addon_id: addon.addon_id,
                            addon_name: addon.addon.name,
                            quantity: addon.quantity,
                            cost: addon.cost,
                            price: addon.price,
                            total: new Decimal(addon.quantity).mul(addon.price).toString(),
                            total_cost: new Decimal(addon.quantity).mul(addon.cost).toString(),
                            gross_profit: new Decimal(addon.quantity)
                                .mul(new Decimal(addon.price).sub(addon.cost))
                                .toString(),
                        });
                    }
                }
            }
        }

        return {
            productSales: Array.from(productSalesMap.values()),
            addonSales: Array.from(addonSalesMap.values()),
        };
    }

    private processInventoryUsageReport(inventoryUsageData: any[]): InventoryUsageReport[] {
        return inventoryUsageData.map((item) => {
            const totalQuantityUsed = item.inventoryUsages.reduce(
                (sum: number, usage: InventoryUsage) => sum + usage.quantity_used.toNumber(),
                0,
            );
            return {
                id: item.id,
                name: item.name,
                unit: item.unit,
                current_stock: Number(item.quantity),
                total_quantity_used: totalQuantityUsed,
            };
        });
    }

    private processInventoryPurchaseReport(inventoryPurchaseData: any[]): InventoryPurchaseReport[] {
        return inventoryPurchaseData.map((item) => {
            const totalQuantityPurchased = item.purchases.reduce(
                (sum: number, purchase: Purchase) => sum + purchase.quantity.toNumber(),
                0,
            );
            const totalCost = item.purchases.reduce(
                (sum: number, purchase: Purchase) => sum + (purchase.total?.toNumber() || 0),
                0,
            );
            return {
                id: item.id,
                name: item.name,
                unit: item.unit,
                current_stock: Number(item.quantity),
                total_quantity_purchased: totalQuantityPurchased,
                total_cost: totalCost,
            };
        });
    }

    private processReservationReport(reservations: any[]): ReservationReport[] {
        return reservations.map((reservation) => {
            const orderCateringsMap = new Map<
                string,
                {
                    catering_package_id: number;
                    price: number;
                    quantity: number;
                    name: string;
                }
            >();

            if (reservation.orderCaterings) {
                for (const catering of reservation.orderCaterings) {
                    const cateringKey = `${catering.catering_package_id}-${catering.price.toString()}`;
                    let existingCatering = orderCateringsMap.get(cateringKey);

                    if (existingCatering) {
                        existingCatering.quantity += 1;
                    } else {
                        orderCateringsMap.set(cateringKey, {
                            catering_package_id: catering.catering_package_id,
                            price: catering.price,
                            quantity: 1,
                            name: catering.cateringPackage.name,
                        });
                    }
                }
            }

            return {
                event_date: reservation.event_date,
                total_price: reservation.total_price,
                is_use_cart: reservation.is_use_cart,
                package_count: reservation.orderCaterings?.length || 0,
                orderCaterings: Array.from(orderCateringsMap.values()),
            };
        });
    }

    async getProductSalesReport(
        type: ReportType,
        paymentType?: PaymentType,
        orderType?: OrderType,
        startDateCustom?: string,
        endDateCustom?: string,
    ) {
        try {
            const { startDate, endDate } = this.getDateRange(type, startDateCustom, endDateCustom);

            this.logger.info(
                `Getting product sales report for dates: ${format(
                    startDate,
                    "dd-MM-yyyy",
                )} to ${format(endDate, "dd-MM-yyyy")}`,
            );

            const sales = await this.orderRepository.getSalesReport({
                startDate,
                endDate,
                paymentType,
                orderType,
            });

            return this.processSalesReport(sales);
        } catch (error) {
            this.logger.error(
                `Error getting product sales report: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve product sales report", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getInventoryUsageReport(
        type: ReportType,
        startDateCustom?: string,
        endDateCustom?: string,
    ): Promise<InventoryUsageReport[]> {
        try {
            const { startDate, endDate } = this.getDateRange(type, startDateCustom, endDateCustom);

            this.logger.info(
                `Getting inventory usage report for dates: ${format(
                    startDate,
                    "dd-MM-yyyy",
                )} to ${format(endDate, "dd-MM-yyyy")}`,
            );

            const inventoryUsage = await this.inventoryUsageRepository.getInventoryUsageReport(startDate, endDate);

            return this.processInventoryUsageReport(inventoryUsage);
        } catch (error) {
            this.logger.error(
                `Error getting inventory usage report: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve inventory usage report", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getInventoryPurchaseReport(
        type: ReportType,
        startDateCustom?: string,
        endDateCustom?: string,
    ): Promise<InventoryPurchaseReport[]> {
        try {
            const { startDate, endDate } = this.getDateRange(type, startDateCustom, endDateCustom);

            this.logger.info(
                `Getting inventory purchase report for dates: ${format(
                    startDate,
                    "dd-MM-yyyy",
                )} to ${format(endDate, "dd-MM-yyyy")}`,
            );

            const inventoryPurchase = await this.purchaseRepository.getInventoryPurchaseReport(startDate, endDate);

            return this.processInventoryPurchaseReport(inventoryPurchase);
        } catch (error) {
            this.logger.error(
                `Error getting inventory purchase report: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve inventory purchase report", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getReservationCateringReport(
        type: ReportType,
        startDateCustom?: string,
        endDateCustom?: string,
    ): Promise<ReservationReport[]> {
        try {
            const { startDate, endDate } = this.getDateRange(type, startDateCustom, endDateCustom);

            this.logger.info(
                `Getting reservation catering report for dates: ${format(
                    startDate,
                    "dd-MM-yyyy",
                )} to ${format(endDate, "dd-MM-yyyy")}`,
            );

            const cateringReport = await this.reservationRepository.getReservationReport(startDate, endDate);
            return this.processReservationReport(cateringReport);
        } catch (error) {
            this.logger.error(
                `Error getting reservation catering report: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve reservation catering report", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getRevenueReport(type: ReportType, startDateCustom?: string, endDateCustom?: string): Promise<RevenueReport> {
        try {
            const { startDate, endDate } = this.getDateRange(type, startDateCustom, endDateCustom);

            this.logger.info(
                `Getting revenue report for dates: ${format(
                    startDate,
                    "dd-MM-yyyy",
                )} to ${format(endDate, "dd-MM-yyyy")}`,
            );

            const [revenueReservations, countReservations, revenueOrders, countOrders] = await Promise.all([
                this.reservationRepository.getTotalRevenueReservations(startDate, endDate),
                this.reservationRepository.getReservationCount(startDate, endDate),
                this.orderRepository.getTotalRevenueByDateRange(startDate, endDate),
                this.orderRepository.getCountOrdersByDateRange(startDate, endDate),
            ]);

            const totalRevenue = new Decimal(revenueReservations).add(new Decimal(revenueOrders)).toNumber();

            return {
                totalRevenue,
                orders: {
                    total: Number(revenueOrders),
                    count: Number(countOrders),
                },
                reservations: {
                    total: Number(revenueReservations),
                    count: Number(countReservations),
                },
            } as RevenueReport;
        } catch (error) {
            this.logger.error(
                `Error getting revenue report: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve revenue report", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getDashboardStatistics(user: any, startDateCustom?: string, endDateCustom?: string) {
        try {
            const today = endDateCustom ? new Date(endDateCustom) : new Date();
            const startDate = startDateCustom ? new Date(startDateCustom) : subDays(today, 29);

            const data: Record<string, { qty_order: number; total_amount: number; total_cost?: number }> = {};
            if (user.role === "Pelanggan") {
                const orders = await this.orderRepository.getOrderStatistics(user.id);
                orders.forEach((item: any) => {
                    const formatted = format(new Date(item.created_at), "dd-MM-yyyy");
                    if (!data[formatted]) {
                        data[formatted] = { qty_order: 0, total_amount: 0 };
                    }
                    data[formatted].qty_order += 1;
                    data[formatted].total_amount += Number(item.total_amount);
                });
            } else if (user.role === "Pemilik" || user.role === "Kasir") {
                const orders = await this.orderRepository.getSalesReport({
                    startDate,
                    endDate: today,
                });
                orders.forEach((item: any) => {
                    const formatted = format(new Date(item.created_at), "dd-MM-yyyy");
                    if (!data[formatted]) {
                        data[formatted] = { qty_order: 0, total_amount: 0, total_cost: 0 };
                    }
                    data[formatted].qty_order += 1;
                    data[formatted].total_amount += Number(item.total_amount);
                    let totalCost = 0;

                    item.items.forEach((orderItem: any) => {
                        totalCost += new Decimal(orderItem.cost).mul(orderItem.quantity).toNumber();
                        orderItem.addons.forEach((addon: any) => {
                            totalCost += new Decimal(addon.cost).mul(addon.quantity).toNumber();
                        });
                    });

                    if (totalCost > 0 && data[formatted]) {
                        data[formatted].total_cost = (data[formatted].total_cost || 0) + totalCost;
                    }
                });
            } else if (user.role === "Staf") {
                const purchase = await this.purchaseRepository.getPurchaseReportByRangeDate(startDate, today);

                purchase.forEach((item: any) => {
                    const formatted = format(new Date(item.created_at), "dd-MM-yyyy");
                    if (!data[formatted]) {
                        data[formatted] = { qty_order: 0, total_amount: 0, total_cost: 0 };
                    }
                    data[formatted].qty_order += 1;
                    data[formatted].total_amount += Number(item.total);

                });
            } else {
                throw new CustomError("Unauthorized role for dashboard statistics", HttpStatus.FORBIDDEN);
            }

            const transformData: {
                date: string;
                qty_order: number;
                total_amount: number;
                total_cost?: number;
            }[] = [];
            for (let d = startDate; d <= today; d = addDays(d, 1)) {
                const formatted = format(d, "dd-MM-yyyy");
                transformData.push({
                    date: formatted,
                    qty_order: data[formatted]?.qty_order || 0,
                    total_amount: data[formatted]?.total_amount || 0,
                    total_cost: data[formatted]?.total_cost || 0,
                });
            }

            return transformData;
        } catch (error) {
            this.logger.error(
                `Error getting dashboard statistics: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve dashboard statistics", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getTopProducts() {
        try {
            const today = new Date();
            const startDate = subDays(today, 29);

            const products: Record<string, { quantity: number; type: "Addon" | "Product" }> = {};

            const topProducts = await this.orderRepository.getSalesReport({
                startDate,
                endDate: today,
            });

            topProducts.forEach((item: any) => {
                item.items.forEach((orderItem: any) => {
                    const productKey = orderItem.product.name;
                    if (!products[productKey]) {
                        products[productKey] = { quantity: 0, type: "Product" };
                    }
                    products[productKey].quantity += orderItem.quantity;

                    orderItem.addons.forEach((addon: any) => {
                        const addonKey = addon.addon.name;
                        if (!products[addonKey]) {
                            products[addonKey] = { quantity: 0, type: "Addon" };
                        }
                        products[addonKey].quantity += addon.quantity;
                    });
                });
            });

            const transformData: {
                name: string;
                quantity: number;
                type: "Addon" | "Product";
            }[] = [];

            for (const [key, value] of Object.entries(products)) {
                transformData.push({
                    name: key,
                    quantity: value.quantity,
                    type: value.type,
                });
            }

            transformData.sort((a, b) => b.quantity - a.quantity);

            return transformData;
        } catch (error) {
            this.logger.error(`Error getting top products: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to retrieve top products", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
