export class BaseService {
    protected excludeMetaFields<T extends Record<string, any>, K extends keyof T>(
        obj: T,
        extras: K[] = [],
    ): Partial<T> {
        const excludedKeys = ["created_at", "updated_at", "deleted_at", ...extras];
        const result: any = {};

        for (const key in obj) {
            const value = obj[key];

            if (excludedKeys.includes(key)) continue;

            result[key] =
                typeof value === "object" && value !== null && !Array.isArray(value)
                    ? this.excludeMetaFields(value)
                    : value;
        }

        return result;
    }
}
