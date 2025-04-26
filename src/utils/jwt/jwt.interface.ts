export interface AccessTokenPayload {
    id: number;
    roleId: number;
    username: string;
    email: string;
}

export interface RefreshTokenPayload {
    id: number;
}
