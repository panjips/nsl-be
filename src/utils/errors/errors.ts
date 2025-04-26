export class CustomError extends Error {
  errors?: any;
  statusCode: number;
  success: boolean;

  constructor(message: string, statusCode: number = 500, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
  }
}
