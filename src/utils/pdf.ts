import { PassThrough } from "node:stream";
import PDFDocument from "pdfkit";
import { generateInvoicePDF, ThermalInvoiceData } from "./templates/invoice";

export const getInvoicePdfBuffer = async (data: ThermalInvoiceData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const heightInPoints = getDynamicHeight(data);
            console.log(heightInPoints);

            const doc = new PDFDocument({
                size: [164.41, heightInPoints],
                margins: {
                    top: 2 * (72 / 25.4),
                    right: 3 * (72 / 25.4),
                    bottom: 2 * (72 / 25.4),
                    left: 3 * (72 / 25.4),
                },
                autoFirstPage: true,
                bufferPages: true,
            });

            const chunks: Buffer[] = [];
            const stream = new PassThrough();

            stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on("error", (err) => reject(err));
            stream.on("end", () => resolve(Buffer.concat(chunks)));

            doc.pipe(stream);

            generateInvoicePDF(doc, data);
        } catch (error) {
            reject(error);
        }
    });
};

const getDynamicHeight = (data: ThermalInvoiceData): number => {
    const baseHeight = 158;

    let itemHeight = 0;
    data.items.forEach((item) => {
        itemHeight += 10;
        if (item.addOns && item.addOns.length > 0) {
            itemHeight += item.addOns.length * 8;
        }
    });

    const totalHeight = baseHeight + itemHeight;

    const marginVertical = 2 * 2.8346;
    const finalHeight = totalHeight + marginVertical;

    return finalHeight;
};
