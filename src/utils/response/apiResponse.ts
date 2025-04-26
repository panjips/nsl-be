export class ApiResponse<T> {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T;
    errors?: any;

    constructor(params: {
        statusCode: number;
        success: boolean;
        message: string;
        data?: T;
        errors?: any;
    }) {
        this.statusCode = params.statusCode;
        this.success = params.success;
        this.message = params.message;
        if (params.data !== undefined) this.data = params.data;
        if (params.errors !== undefined) this.errors = params.errors;
    }

    static success<T>(message: string, data?: T, statusCode = 200) {
        return new ApiResponse<T>({ statusCode, success: true, message, data });
    }

    static created<T>(message = "Created", statusCode = 201) {
        return new ApiResponse<T>({ statusCode, success: true, message });
    }

    static error(message = "Error", statusCode = 400, errors?: any) {
        return new ApiResponse<null>({ statusCode, success: false, message, errors });
    }
}
