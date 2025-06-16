export class BaseService {
    protected excludeMetaFields<T extends Record<string, any> | null | undefined, K extends string>(
        obj: T,
        extras: K[] = [],
    ): T extends null | undefined ? null : Partial<T> {
        if (obj === null || obj === undefined) {
            return null as any;
        }

        if (Array.isArray(obj)) {
            return obj.map((item) =>
                item === null || item === undefined
                    ? null
                    : typeof item === "object" && item !== null
                      ? this.excludeMetaFields(item, extras)
                      : item,
            ) as any;
        }

        const excludedKeys = ["created_at", "updated_at", "deleted_at", ...extras];
        const result: any = {};

        for (const key in obj) {
            const value = obj[key];

            if (excludedKeys.includes(key)) continue;

            if (value === null || value === undefined) {
                result[key] = value;
            } else if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
                result[key] = this.excludeMetaFields(value, extras);
            } else {
                result[key] = value;
            }
        }

        return result as any;
    }
}
