import type { Reservation, ReservationStatus } from "@prisma/client";

export type CreateReservation = Omit<
    Reservation,
    "id" | "created_at" | "updated_at" | "deleted_at" | "is_active" | "status"
>;

export type UpdateReservation = Partial<Omit<Reservation, "id" | "created_at" | "updated_at" | "deleted_at">>;

export interface ReservationWithRelations extends Reservation {
    user: {
        id: number;
        name: string;
        email: string;
        phone_number: string;
    };
    cateringPackage?: {
        id: number;
        name: string;
        price: number;
        size_unit: string;
        size_volume: number;
    };
    orderCaterings?: {
        id: number;
        catering_package_id: number;
        price: number;
        quantity_cup: number;
        size_unit: string;
        size_volume: number;
        free_cup: number | null;
        cateringPackage: {
            name: string;
        };
    }[];
}

export interface ReservationStatusUpdate {
    status: ReservationStatus;
}
