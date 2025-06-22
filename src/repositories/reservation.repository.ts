import { inject, injectable } from "inversify";
import { TYPES } from "constant";
import { OrderCatering, PrismaClient, Reservation, ReservationStatus } from "@prisma/client";
import { ILogger } from "utils";
import { CreateReservation, UpdateReservation } from "models";

@injectable()
export class ReservationRepository {
    constructor(
        @inject(TYPES.PrismaClient) private readonly prisma: PrismaClient,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {}

    async findAll(status?: string, startDate?: string, endDate?: string): Promise<Reservation[]> {
        const whereClause: any = {
            is_active: true,
        };

        if (status) {
            whereClause.status = status;
        }

        if (startDate && endDate) {
            whereClause.event_date = {
                gte: startDate,
                lte: endDate,
            };
        } else if (startDate) {
            whereClause.event_date = {
                gte: startDate,
            };
        } else if (endDate) {
            whereClause.event_date = {
                lte: endDate,
            };
        }

        return this.prisma.reservation.findMany({
            where: whereClause,
            include: {
                orderCaterings: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        cateringPackage: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
            },
            orderBy: {
                event_date: "asc",
            },
        });
    }

    async findById(id: number): Promise<Reservation | null> {
        return this.prisma.reservation.findFirst({
            where: {
                id,
                is_active: true,
            },
            include: {
                orderCaterings: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        cateringPackage: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
            },
        });
    }

    async findByUserId(userId: number): Promise<Reservation[]> {
        return this.prisma.reservation.findMany({
            where: {
                user_id: userId,
                is_active: true,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                orderCaterings: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        cateringPackage: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                event_date: "desc",
            },
        });
    }

    async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
        return this.prisma.reservation.findMany({
            where: {
                status,
                is_active: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                orderCaterings: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        cateringPackage: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                event_date: "asc",
            },
        });
    }

    async create(data: CreateReservation): Promise<Reservation> {
        const reservation = await this.prisma.reservation.create({
            data: {
                user_id: data.user_id,
                location: data.location,
                total_price: data.total_price,
                notes: data.notes,
                event_date: new Date(data.event_date),
                is_use_cart: data.is_use_cart,
            },
        });

        this.logger.info(`Created reservation with ID ${reservation.id} for user ${data.user_id}`);
        return reservation;
    }

    async createOrderCatering(reservationId: number, packageData: any): Promise<OrderCatering> {
        const orderCatering = await this.prisma.orderCatering.create({
            data: {
                reservation_id: reservationId,
                catering_package_id: packageData.id,
                price: packageData.price,
                free_cup: packageData.free_cup,
                size_unit: packageData.size_unit,
                size_volume: packageData.size_volume,
                quantity_cup: packageData.quantity_cup,
            },
            include: {
                cateringPackage: {
                    select: {
                        name: true,
                        description: true,
                    },
                },
            },
        });

        this.logger.info(`Created order catering with ID ${orderCatering.id} for reservation ${reservationId}`);
        return orderCatering;
    }

    async update(id: number, data: UpdateReservation): Promise<Reservation> {
        const reservation = await this.prisma.reservation.update({
            where: { id },
            data: {
                location: data.location,
                event_date: data.event_date ? new Date(data.event_date) : undefined,
                notes: data.notes,
                is_use_cart: data.is_use_cart,
                total_price: data?.total_price,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                orderCaterings: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        cateringPackage: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });

        this.logger.info(`Updated reservation with ID ${id}`);
        return reservation;
    }

    async updateStatus(id: number, status: ReservationStatus): Promise<Reservation> {
        const reservation = await this.prisma.reservation.update({
            where: { id },
            data: { status },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                orderCaterings: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        cateringPackage: true,
                    },
                },
            },
        });

        this.logger.info(`Updated status for reservation ID ${id} to ${status}`);
        return reservation;
    }

    async delete(id: number): Promise<boolean> {
        await this.prisma.reservation.update({
            where: { id },
            data: {
                is_active: false,
                deleted_at: new Date(),
            },
        });

        this.logger.info(`Soft deleted reservation with ID ${id}`);
        return true;
    }

    async checkDateAvailability(
        date: Date,
        excludeReservationId?: number,
    ): Promise<{
        isAvailable: boolean;
        existingReservations: number;
        maxReservationsPerDay: number;
    }> {
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const whereCondition: any = {
            is_active: true,
            event_date: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: {
                in: [
                    ReservationStatus.CONFIRMED,
                    ReservationStatus.WAITING_DEPOSIT,
                    ReservationStatus.DEPOSIT_PAID,
                    ReservationStatus.PAYMENT_PENDING,
                    ReservationStatus.COMPLETED,
                ],
            },
        };

        if (excludeReservationId) {
            whereCondition.id = { not: excludeReservationId };
        }

        const existingReservations = await this.prisma.reservation.count({
            where: whereCondition,
        });

        const maxReservationsPerDay = 1;
        const isAvailable = existingReservations < maxReservationsPerDay;

        const dateString = targetDate.toISOString().split("T")[0];

        this.logger.info(
            `Date availability check for ${dateString}` +
                (excludeReservationId ? ` (excluding reservation ${excludeReservationId})` : "") +
                `: ${isAvailable ? "Available" : "Not available"} (${existingReservations}/${maxReservationsPerDay})`,
        );

        return {
            isAvailable,
            existingReservations,
            maxReservationsPerDay,
        };
    }

    async getTotalRevenueReservations(startDate: Date, endDate: Date) {
        const result = await this.prisma.reservation.aggregate({
            _sum: {
                total_price: true,
            },
            where: {
                is_active: true,
                status: ReservationStatus.COMPLETED,
                event_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        return result._sum.total_price || 0;
    }

    async getReservationCount(startDate: Date, endDate: Date) {
        const result = await this.prisma.reservation.count({
            where: {
                is_active: true,
                status: ReservationStatus.COMPLETED,
                event_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        return result;
    }

    async getReservationReport(startDate: Date, endDate: Date) {
        return this.prisma.reservation.findMany({
            where: {
                is_active: true,
                status: ReservationStatus.COMPLETED,
                event_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone_number: true,
                    },
                },
                orderCaterings: {
                    where: {
                        is_active: true,
                    },
                    include: {
                        cateringPackage: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                event_date: "asc",
            },
        });

        // Report from catering packages
        // return this.prisma.cateringPackage.findMany({
        //     where: {
        //         is_active: true,
        //         orderCaterings: {
        //             every: {
        //                 reservation: {
        //                     is_active: true,
        //                     event_date: {
        //                         gte: startDate,
        //                         lte: endDate,
        //                     },
        //                 },
        //             },
        //         },
        //     },
        //     include: {
        //         orderCaterings: {
        //             include: {
        //                 reservation: {
        //                     include: {
        //                         user: {
        //                             select: {
        //                                 name: true,
        //                                 email: true,
        //                                 phone_number: true,
        //                             },
        //                         },
        //                     },
        //                 },
        //             },
        //         },
        //     },
        // });
    }
}
