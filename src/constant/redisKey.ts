export const RedisKey = {
    USER_ALL: "user:all",
    USER_BY_ID: (id: number) => `user:${id}`,
    RESERVATION: "reservation",
    RESERVATION_ALL: "reservation:all",
    CATEGORIES: "categories",
    PRODUCTS: "products",
    ADDONS: "addons",
};
