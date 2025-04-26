import { Request } from "express";

declare module "express" {
    export interface Request {
        user?: {
            id: number;
            role?: string;
            username?: string;
            email?: string;
            phone_number?: string;
        };
    }
}
