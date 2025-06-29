import nodemailer, { type Transporter, type SentMessageInfo } from "nodemailer";
import { injectable, inject } from "inversify";
import { TYPES } from "constant";
import { ILogger } from "utils";
import { config } from "config";

@injectable()
export class MailService {
    private transporter: Transporter;

    constructor(@inject(TYPES.Logger) private logger: ILogger) {
        const user = config.smtp.user;
        const pass = config.smtp.password;
        if (!user || !pass) throw new Error("SMTP credentials missing");

        this.transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: Number(config.smtp.port),
            secure: true,
            auth: { user, pass },
        });
    }

    async notify(receiver: string, subject: string, body: string): Promise<string> {
        const mail = {
            from: `"Needsixletters Coffee" <no-reply@needsixletters.coffee>`,
            to: receiver,
            subject: subject,
            text: body,
        };

        try {
            const info: SentMessageInfo = await this.transporter.sendMail(mail);
            this.logger.info(`Email sent to ${receiver}: ${info.messageId}`);
            return info.messageId;
        } catch (err) {
            this.logger.error(`Failed sending OTP to ${receiver}: ${(err as Error).message}`);
            throw err;
        }
    }

    // async sendInvoice()
}
