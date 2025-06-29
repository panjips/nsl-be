import { inject, injectable } from "inversify";
import { HttpStatus, TYPES, RedisKey } from "constant";
import { ILogger, CustomError, RedisService } from "utils";
import {
    ReservationRepository,
    OrderCateringRepository,
    CateringPackageRepository,
    UserRepository,
} from "repositories";
import { BaseService } from "./base.service";
import { CreateOrderCatering } from "models";
import { ReservationStatus } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { CreateReservationDTOType, UpdateReservationDTOType } from "dtos";

@injectable()
export class ReservationService extends BaseService {
    constructor(
        @inject(TYPES.ReservationRepository) private readonly reservationRepository: ReservationRepository,
        @inject(TYPES.OrderCateringRepository) private readonly orderCateringRepository: OrderCateringRepository,
        @inject(TYPES.CateringPackageRepository) private readonly cateringPackageRepository: CateringPackageRepository,
        @inject(TYPES.UserRepository) private readonly userRepository: UserRepository,
        @inject(TYPES.RedisService) private readonly redisService: RedisService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    async getAllReservations(status?: ReservationStatus | ReservationStatus[]) {
        try {
            let cacheKey = RedisKey.RESERVATION_ALL;
            if (status) {
                const statusString = Array.isArray(status) ? status.sort().join(",") : status;
                cacheKey = `${RedisKey.RESERVATION_ALL}:${statusString}`;
            }

            const cachedReservations = await this.redisService.get(cacheKey);
            if (cachedReservations) {
                this.logger.info(`Retrieved reservations from cache with key: ${cacheKey}`);
                return JSON.parse(cachedReservations as string);
            }

            let reservations;
            if (status) {
                reservations = await this.reservationRepository.findByStatus(status);
            } else {
                reservations = await this.reservationRepository.findAll();
            }

            const data = this.excludeMetaFields(reservations);

            await this.redisService.set(cacheKey, JSON.stringify(data), 300);
            return data;
        } catch (error) {
            this.logger.error(
                `Error retrieving reservations: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve reservations", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getReservationById(id: number) {
        try {
            const cacheKey = `${RedisKey.RESERVATION}:${id}`;
            const cachedReservation = await this.redisService.get(cacheKey);
            if (cachedReservation) {
                return JSON.parse(cachedReservation as string);
            }

            const reservation = await this.reservationRepository.findById(id);
            if (!reservation) {
                throw new CustomError("Reservation not found", HttpStatus.NOT_FOUND);
            }

            const data = this.excludeMetaFields(reservation);
            await this.redisService.set(cacheKey, JSON.stringify(data));
            return data;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error retrieving reservation ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve reservation", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getReservationsByUserId(userId: number) {
        try {
            const user = await this.userRepository.getUserById(userId);
            if (!user) {
                throw new CustomError("User not found", HttpStatus.NOT_FOUND);
            }

            const reservations = await this.reservationRepository.findByUserId(userId);
            const data = this.excludeMetaFields(reservations);
            return data;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error retrieving reservations for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to retrieve reservations", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createReservation(userId: number, data: CreateReservationDTOType) {
        try {
            const user = await this.userRepository.getUserById(userId);
            if (!user) {
                throw new CustomError("User not found", HttpStatus.NOT_FOUND);
            }

            const availability = await this.checkReservationAvailability(data.event_date);

            if (!availability.isAvailable) {
                throw new CustomError(
                    "The requested date is already booked. Please select another date.",
                    HttpStatus.CONFLICT,
                );
            }

            if (!data.packages || data.packages.length === 0) {
                throw new CustomError("At least one package is required", HttpStatus.BAD_REQUEST);
            }

            let totalAmount = 0;
            const packageItems = [];
            for (const pkg of data.packages) {
                const cateringPackage = await this.cateringPackageRepository.findById(pkg.id);
                if (!cateringPackage) {
                    throw new CustomError(`Catering package with ID ${pkg.id} not found`, HttpStatus.NOT_FOUND);
                }
                totalAmount += cateringPackage.price.toNumber();
                packageItems.push(cateringPackage);
            }

            if (data.is_use_cart) {
                totalAmount += 500000;
            }

            const reservation = await this.reservationRepository.create({
                user_id: userId,
                location: data.location,
                event_date: new Date(data.event_date),
                notes: data.notes ?? null,
                is_use_cart: data.is_use_cart,
                total_price: new Decimal(totalAmount),
            });

            const orderCateringItems = packageItems.map((pkg) => ({
                reservation_id: reservation.id,
                catering_package_id: pkg.id,
                price: pkg.price,
                free_cup: pkg.free_cup,
                size_unit: pkg.size_unit,
                size_volume: pkg.size_volume,
                quantity_cup: pkg.quantity_cup,
            })) as CreateOrderCatering[];

            await this.orderCateringRepository.createMany(orderCateringItems);

            const completeReservation = await this.reservationRepository.findById(reservation.id);

            await this.clearReservationCache();

            return this.excludeMetaFields(completeReservation);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(`Error creating reservation: ${error instanceof Error ? error.message : String(error)}`);
            throw new CustomError("Failed to create reservation", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateReservationStatus(id: number, status: ReservationStatus) {
        try {
            const reservation = await this.reservationRepository.findById(id);
            if (!reservation) {
                throw new CustomError("Reservation not found", HttpStatus.NOT_FOUND);
            }

            this.validateStatusTransition(reservation.status, status);
            const updatedReservation = await this.reservationRepository.updateStatus(id, status);

            await this.clearReservationCache(id, reservation.user_id);
            return this.excludeMetaFields(updatedReservation);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error updating reservation status ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update reservation status", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async updateReservation(id: number, data: UpdateReservationDTOType & { total_price?: Decimal }) {
        try {
            const reservation = await this.reservationRepository.findById(id);
            if (!reservation) {
                throw new CustomError("Reservation not found", HttpStatus.NOT_FOUND);
            }

            if (data.event_date) {
                const availability = await this.checkReservationAvailability(data.event_date, id);

                if (!availability.isAvailable) {
                    throw new CustomError(
                        "The requested date is already booked. Please select another date.",
                        HttpStatus.CONFLICT,
                    );
                }
            }

            if (reservation.status !== ReservationStatus.PENDING) {
                throw new CustomError("Only pending reservations can be updated", HttpStatus.BAD_REQUEST);
            }

            let totalAmount = 0;
            let orderCateringItems: CreateOrderCatering[] = [];
            if (data.packages && data.packages.length > 0) {
                const existingOrderCaterings = await this.orderCateringRepository.findByReservationId(id);
                const existingPackageIds = existingOrderCaterings.map((oc) => oc.catering_package_id);
                const newPackageIds = data.packages.map((pkg) => pkg.id);

                const isDifferent: boolean =
                    existingPackageIds.length !== newPackageIds.length ||
                    existingPackageIds.some((id) => !newPackageIds.includes(id)) ||
                    newPackageIds.some((id) => !existingPackageIds.includes(id));

                if (isDifferent) {
                    await this.orderCateringRepository.permanentlyDeleteByReservationId(id);

                    for (const packageId of newPackageIds) {
                        const cateringPackage = await this.cateringPackageRepository.findById(packageId);
                        if (!cateringPackage) {
                            throw new CustomError(
                                `Catering package with ID ${packageId} not found`,
                                HttpStatus.NOT_FOUND,
                            );
                        }

                        orderCateringItems.push({
                            reservation_id: id,
                            catering_package_id: cateringPackage.id,
                            price: cateringPackage.price,
                            free_cup: cateringPackage.free_cup,
                            size_unit: cateringPackage.size_unit,
                            size_volume: cateringPackage.size_volume,
                            quantity_cup: cateringPackage.quantity_cup,
                        });

                        totalAmount += cateringPackage.price.toNumber();
                    }
                    if (newPackageIds.length > 0) {
                        await this.orderCateringRepository.createMany(orderCateringItems);
                        data.total_price = new Decimal(totalAmount);
                    }
                }
            }

            const updatedData = {
                ...data,
                event_date: data.event_date ? new Date(data.event_date) : undefined,
                total_price: data.is_use_cart ? data.total_price?.add(500000) : data.total_price,
                notes: data.notes ?? null,
            };

            const updatedReservation = await this.reservationRepository.update(id, updatedData);

            await this.clearReservationCache(id, reservation.user_id);
            return this.excludeMetaFields(updatedReservation);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error updating reservation ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to update reservation", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteReservation(id: number, user?: any) {
        try {
            const reservation = await this.reservationRepository.findById(id);
            if (!reservation) {
                throw new CustomError("Reservation not found", HttpStatus.NOT_FOUND);
            }

            if (
                reservation.status !== ReservationStatus.PENDING &&
                reservation.status !== ReservationStatus.CANCELLED
            ) {
                throw new CustomError("Only pending or cancelled reservations can be deleted", HttpStatus.BAD_REQUEST);
            }

            if (user && user.role === "Pelanggan") {
                const userReservation = await this.reservationRepository.findByUserId(user.id);
                if (!userReservation.some((res) => res.id === id)) {
                    throw new CustomError("You are not authorized to delete this reservation", HttpStatus.FORBIDDEN);
                }
            }

            await this.orderCateringRepository.deleteByReservationId(id);
            await this.reservationRepository.delete(id);

            await this.clearReservationCache(id, reservation.user_id);

            return { success: true };
        } catch (error) {
            if (error instanceof CustomError) throw error;
            this.logger.error(
                `Error deleting reservation ${id}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to delete reservation", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private async clearReservationCache(id?: number, userId?: number) {
        try {
            const keys = await this.redisService.keys(`${RedisKey.RESERVATION}:*`);
            keys.push(RedisKey.RESERVATION_ALL);

            if (id) {
                keys.push(`${RedisKey.RESERVATION}:${id}`);
            }

            if (userId) {
                keys.push(`${RedisKey.RESERVATION}:user:${userId}`);
            }

            if (keys.length > 0) {
                await Promise.all(keys.map((key) => this.redisService.delete(key)));
            }
        } catch (error) {
            this.logger.error(
                `Error clearing reservation cache: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    async checkReservationAvailability(dateString: string, excludeReservationId?: number) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                throw new CustomError("Invalid date format", HttpStatus.BAD_REQUEST);
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (date < today) {
                throw new CustomError("Cannot make reservations for past dates", HttpStatus.BAD_REQUEST);
            }

            const availability = await this.reservationRepository.checkDateAvailability(date, excludeReservationId);

            return {
                date: dateString,
                isAvailable: availability.isAvailable,
                existingReservations: availability.existingReservations,
                maxReservationsPerDay: availability.maxReservationsPerDay,
                message: availability.isAvailable
                    ? "This date is available for reservation"
                    : "Sorry, this date is already booked",
            };
        } catch (error) {
            if (error instanceof CustomError) throw error;

            this.logger.error(
                `Error checking reservation availability: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new CustomError("Failed to check date availability", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private validateStatusTransition(currentStatus: ReservationStatus, newStatus: ReservationStatus) {
        const allowedTransitions: Record<ReservationStatus, ReservationStatus[]> = {
            [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
            [ReservationStatus.CONFIRMED]: [ReservationStatus.WAITING_DEPOSIT, ReservationStatus.CANCELLED],
            [ReservationStatus.WAITING_DEPOSIT]: [ReservationStatus.DEPOSIT_PAID, ReservationStatus.CANCELLED],
            [ReservationStatus.DEPOSIT_PAID]: [ReservationStatus.PAYMENT_PENDING, ReservationStatus.CANCELLED],
            [ReservationStatus.PAYMENT_PENDING]: [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED],
            [ReservationStatus.COMPLETED]: [],
            [ReservationStatus.CANCELLED]: [],
        };

        if (!allowedTransitions[currentStatus].includes(newStatus)) {
            throw new CustomError(`Cannot change status from ${currentStatus} to ${newStatus}`, HttpStatus.BAD_REQUEST);
        }
    }
}
