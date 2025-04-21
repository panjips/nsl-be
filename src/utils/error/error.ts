export class AppError extends Error {
  errors?: any;

  constructor(message: string, errors?: any) {
    super(message);
    this.errors = errors;
  }
}
