export const RedisKey = {
    USER_ALL: "user:all",
    USER_BY_ID: (id: number) => `user:${id}`,
};
