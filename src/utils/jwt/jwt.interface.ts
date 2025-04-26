export interface AccessTokenPayload {
    id: number;
    role?: string;
    username?: string;
    email?: string;
    phone_number?: string;
}

export interface RefreshTokenPayload {
    id: number;
}
