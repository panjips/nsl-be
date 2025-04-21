import { TYPES } from "constants/types";
import { inject } from "inversify";
import { controller, httpPost } from "inversify-express-utils";
import { AuthService } from "services/auth.service";
import { Request, Response } from "express";
import { RegisterDTO } from "dtos";

@controller("/auth")
export class AuthController {
  constructor(
    @inject(TYPES.AuthService)
    private readonly authService: AuthService
  ) {}

  @httpPost("/register")
  public async register(req: Request, res: Response): Promise<any> {
    try {
      const validate = RegisterDTO.safeParse(req.body);
      if (!validate.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: validate.error.format(),
        });
      }

      const userData = await this.authService.register(validate.data);
      return res.status(201).json(userData);
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  }
}
