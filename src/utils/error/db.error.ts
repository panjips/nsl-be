import { AppError } from "./error";

export class UniqueError extends AppError {
  constructor(message: string, errors?: any) {
    super(message, errors);
  }
}
