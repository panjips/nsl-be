import { MidtransClient } from "midtrans-node-client";
import { injectable } from "inversify";
import { config } from "config";
import "reflect-metadata";

@injectable()
export class MidtransService {
    private core: InstanceType<typeof MidtransClient.Snap>;

    constructor() {
        this.core = new MidtransClient.Snap({
            isProduction: false,
            serverKey: config.midtrans.serverKey,
            clientKey: config.midtrans.clientKey,
        });
    }

    async charge(payload: any) {
        return this.core.createTransactionToken(payload);
    }

    async getTransactionStatus(orderId: string) {
        return this.core.transaction.status(orderId);
    }

    async parseNotification(notificationJson: any) {
        return this.core.transaction.notification(notificationJson);
    }
}
