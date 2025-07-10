import nodemailer, { type Transporter, type SentMessageInfo } from "nodemailer";
import { injectable, inject } from "inversify";
import { TYPES } from "constant";
import { ILogger, ThermalInvoiceData, ThermalInvoiceItem } from "utils";
import { config } from "config";
import { getInvoicePdfBuffer } from "./pdf";

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

    async sendBulkEmail(receivers: string[], subject: string, htmlContent: string) {
        try {
            if (!receivers || receivers.length === 0) {
                this.logger.warn("No email receivers provided");
                return null;
            }

            const mail = {
                from: `"Needsixletters Coffee" <${config.smtp.user}>`,
                bcc: receivers, 
                subject: subject,
                html: htmlContent,
            };

            this.logger.info(`Sending bulk email to ${receivers.length} recipients: ${subject}`);
            const info = await this.transporter.sendMail(mail);

            this.logger.info(`Bulk email sent successfully: ${info.messageId}`);
            return info.messageId;
        } catch (error) {
            this.logger.error(`Failed to send bulk email: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }

    async sendInvoice(receiverEmail: string, orderData: any[]) {
        try {
            this.logger.info(`Preparing to send invoice to ${receiverEmail}`);

            const invoiceDetails = this.prepareThermalInvoiceData(orderData);
            if (!invoiceDetails) {
                this.logger.error("Could not prepare invoice data: empty or invalid order data");
                throw new Error("Could not prepare invoice data.");
            }

            const pdfBuffer = await getInvoicePdfBuffer(invoiceDetails);

            const mail = {
                from: `"Needsixletters Coffee" <${config.smtp.user}>`,
                to: receiverEmail,
                subject: `Your Needsixletters Coffee Invoice for Order #${invoiceDetails.orderId}`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #8B4513; color: white; padding: 20px; text-align: center;">
                        <h1>Thank You for Your Order!</h1>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
                        <p>Dear Customer,</p>
                        <p>Thank you for choosing Needsixletters Coffee! Your order #${invoiceDetails.orderId} has been successfully processed.</p>
                        <p>Please find your invoice attached to this email. We've also included a summary of your purchase below:</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <h3>Order Summary</h3>
                            <p><strong>Order ID:</strong> #${invoiceDetails.orderId}</p>
                            <p><strong>Date:</strong> ${new Date(invoiceDetails.orderDate).toLocaleString("en-GB", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                            })}</p>
                            <p><strong>Total Amount:</strong> Rp ${invoiceDetails.cartTotal.toLocaleString("id-ID")}</p>
                        </div>
                        
                        <p>Best regards,<br>Needsixletters Coffee Team</p>
                    </div>
                    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                        <p>Needsixletters Coffee | Pantai Masceti, Gianyar, Bali | www.needsixletters.com</p>
                    </div>
                </div>
            `,
                attachments: [
                    {
                        filename: `invoice-${invoiceDetails.orderId}.pdf`,
                        content: pdfBuffer,
                        contentType: "application/pdf",
                    },
                ],
            };

            this.logger.info(`Sending invoice email to ${receiverEmail} for order ${invoiceDetails.orderId}`);
            const info = await this.transporter.sendMail(mail);

            this.logger.info(
                `Invoice email sent to ${receiverEmail} for order ${invoiceDetails.orderId}: ${info.messageId}`,
            );
            return info.messageId;
        } catch (error) {
            this.logger.error(`Failed to send invoice email: ${(error as Error).message}`);
            return null;
        }
    }

    private prepareThermalInvoiceData(orderData: any[]): ThermalInvoiceData | null {
        if (!orderData || orderData.length === 0) {
            return null;
        }

        try {
            const firstItem = orderData[0];
            if (!firstItem) return null;

            // Use order_id from the first item or fallback to a default value
            const orderId = firstItem.order_id || 0;

            // Use a timestamp that makes sense - created_at or now
            const orderDate = firstItem.created_at || new Date().toISOString();

            let cartTotal = 0;
            const items: ThermalInvoiceItem[] = orderData.map((item) => {
                // Handle invalid subtotal
                const subtotal =
                    typeof item.subtotal === "number" ? item.subtotal : Number.parseFloat(item.subtotal) || 0;

                cartTotal += subtotal;

                const addOns: Array<{ name: string; price: number }> = [];

                // Safely process addons if they exist
                if (item.addons && Array.isArray(item.addons)) {
                    item.addons.forEach((addon: any) => {
                        if (addon?.addon) {
                            addOns.push({
                                name: addon.addon.name || "Addon",
                                price:
                                    typeof addon.price === "number" ? addon.price : Number.parseFloat(addon.price) || 0,
                            });
                        }
                    });
                }

                return {
                    name: item.product?.name || "Unknown Product",
                    quantity: item.quantity || 1,
                    price: typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0,
                    subtotal: subtotal,
                    selected_sugar_type: item.selected_sugar_type || undefined,
                    addOns: addOns.length > 0 ? addOns : undefined,
                };
            });

            const companyName = "Needsixletters Coffee";
            const companyAddress = "Pantai Masceti, Gianyar, Bali";
            const companyContact = "www.needsixletters.com";

            return {
                orderId,
                orderDate,
                items,
                cartTotal,
                companyName,
                companyAddress,
                companyContact,
            };
        } catch (error) {
            this.logger.error(`Error preparing invoice data: ${(error as Error).message}`);
            return null;
        }
    }
}
