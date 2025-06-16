import type { CateringPackage } from "@prisma/client";

export type CreateCateringPackage = Omit<
    CateringPackage,
    "id" | "created_at" | "updated_at" | "deleted_at" | "is_active"
>;

export type UpdateCateringPackage = Partial<CreateCateringPackage>;

export interface CateringPackageWithRelations extends CateringPackage {
    reservations?: {
        id: number;
        user_id: number;
        location: string;
        event_date: Date;
        status: string;
        total_price: number;
    }[];
}
