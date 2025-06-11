import { HttpStatus, Role, TYPES } from "constant";
import { inject } from "inversify";
import {
    controller,
    httpPost,
    httpGet,
    httpPut,
    httpDelete,
    request,
    response,
    next,
    BaseHttpController,
    queryParam,
} from "inversify-express-utils";
import type { NextFunction, Request, Response } from "express";
import { ApiResponse, CustomError, ILogger } from "utils";
import { ReservationService } from "services";
import { RoleMiddlewareFactory, ZodValidation } from "middleware";
import { CreateReservationDTO, UpdateReservationDTO, UpdateReservationStatusDTO } from "dtos";
import { ReservationStatus } from "@prisma/client";

@controller("/reservation", TYPES.AuthMiddleware)
export class ReservationController extends BaseHttpController {
    constructor(
        @inject(TYPES.ReservationService) private readonly reservationService: ReservationService,
        @inject(TYPES.Logger) private readonly logger: ILogger,
    ) {
        super();
    }

    @httpGet("/", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getAllReservations(@response() res: Response, @next() next: NextFunction) {
        try {
            const reservations = await this.reservationService.getAllReservations();
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Reservations retrieved successfully", reservations));
        } catch (error) {
            this.logger.error("Error retrieving reservations");
            next(error);
        }
    }

    @httpGet("/check-availability", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.PELANGGAN]))
    public async checkDateAvailability(
        @queryParam("date") date: string,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            console.log(date);
            if (!date) {
                throw new CustomError("Date parameter is required", HttpStatus.BAD_REQUEST);
            }

            const availability = await this.reservationService.checkReservationAvailability(date);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Date availability checked", availability));
        } catch (error) {
            this.logger.error(
                `Error checking date availability: ${error instanceof Error ? error.message : String(error)}`,
            );
            next(error);
        }
    }

    @httpGet("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getReservationById(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                throw new CustomError("Invalid reservation ID", HttpStatus.BAD_REQUEST);
            }

            const reservation = await this.reservationService.getReservationById(id);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Reservation retrieved successfully", reservation));
        } catch (error) {
            this.logger.error(`Error retrieving reservation with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpGet("/user/:userId", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async getReservationsByUserId(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const userId = Number(req.params.userId);
            if (isNaN(userId)) {
                throw new CustomError("Invalid user ID", HttpStatus.BAD_REQUEST);
            }

            const reservations = await this.reservationService.getReservationsByUserId(userId);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success(`Reservations for user ${userId} retrieved successfully`, reservations));
        } catch (error) {
            this.logger.error(`Error retrieving reservations for user ID ${req.params.userId}`);
            next(error);
        }
    }

    @httpPost(
        "/",
        RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.PELANGGAN]),
        ZodValidation(CreateReservationDTO),
    )
    public async createReservation(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            if (!req.user) {
                throw new CustomError("Unauthorized", HttpStatus.UNAUTHORIZED);
            }

            const reservation = await this.reservationService.createReservation(req.user.id, req.body);
            return res
                .status(HttpStatus.CREATED)
                .json(ApiResponse.success("Reservation created successfully", reservation));
        } catch (error) {
            this.logger.error(`Error creating reservation: ${error instanceof Error ? error.message : String(error)}`);
            next(error);
        }
    }

    @httpPut(
        "/status/:id",
        RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]),
        ZodValidation(UpdateReservationStatusDTO),
    )
    public async updateReservationStatus(
        @request() req: Request,
        @response() res: Response,
        @next() next: NextFunction,
    ) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                throw new CustomError("Invalid reservation ID", HttpStatus.BAD_REQUEST);
            }

            const reservation = await this.reservationService.updateReservationStatus(
                id,
                req.body.status as ReservationStatus,
            );
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Reservation status updated successfully", reservation));
        } catch (error) {
            this.logger.error(`Error updating reservation status with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpPut(
        "/:id",
        RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR, Role.PELANGGAN]),
        ZodValidation(UpdateReservationDTO),
    )
    public async updateReservation(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                throw new CustomError("Invalid reservation ID", HttpStatus.BAD_REQUEST);
            }

            if (req.user?.role !== Role.PEMILIK && req.user?.role !== Role.KASIR) {
                const reservation = await this.reservationService.getReservationById(id);
                if (reservation.user.id !== req.user?.id) {
                    throw new CustomError("You are not authorized to update this reservation", HttpStatus.FORBIDDEN);
                }
            }

            const updatedReservation = await this.reservationService.updateReservation(id, req.body);
            return res
                .status(HttpStatus.OK)
                .json(ApiResponse.success("Reservation updated successfully", updatedReservation));
        } catch (error) {
            this.logger.error(`Error updating reservation with ID ${req.params.id}`);
            next(error);
        }
    }

    @httpDelete("/:id", RoleMiddlewareFactory([Role.PEMILIK, Role.KASIR]))
    public async deleteReservation(@request() req: Request, @response() res: Response, @next() next: NextFunction) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                throw new CustomError("Invalid reservation ID", HttpStatus.BAD_REQUEST);
            }

            await this.reservationService.deleteReservation(id);
            return res.status(HttpStatus.OK).json(ApiResponse.success("Reservation deleted successfully"));
        } catch (error) {
            this.logger.error(`Error deleting reservation with ID ${req.params.id}`);
            next(error);
        }
    }
}
