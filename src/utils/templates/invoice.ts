import PDFDocument from "pdfkit";

const formatNumberWithDots = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    };

    return date.toLocaleString("en-GB", options);
};

const formatCurrency = (amount: number): string => {
    return `Rp${formatNumberWithDots(amount)}`;
};

export interface ThermalInvoiceItem {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
    selected_sugar_type?: string;
    addOns?: Array<{ name: string; price: number }>;
}

export interface ThermalInvoiceData {
    orderId: number;
    orderDate: string;
    items: ThermalInvoiceItem[];
    cartTotal: number;
    companyName: string;
    companyAddress: string;
    companyContact: string;
}

const truncate = (str: string, max: number) => (str.length > max ? str.slice(0, max - 1).trim() + "…" : str);

export const generateInvoicePDF = (doc: typeof PDFDocument, data: ThermalInvoiceData) => {
    // === PAGE SETUP ===
    const widthInPoints = 58 * (72 / 25.4); // ~164.4
    const heightInPoints = 300; // arbitrary height, enough for 10+ items

    const marginVertical = 2 * (72 / 25.4); // ~5.67
    const marginHorizontal = 3 * (72 / 25.4); // ~8.5

    doc.options.size = [widthInPoints, heightInPoints];
    doc.options.margins = {
        top: marginVertical,
        bottom: marginVertical,
        left: marginHorizontal,
        right: marginHorizontal,
    };

    let y = doc.page.margins.top;
    const regularFontSize = 8;
    const headerFontSize = 10;
    const addOnFontSize = 7;

    // === HEADER ===
    doc.font("Helvetica-Bold").fontSize(headerFontSize).text(data.companyName, {
        align: "center",
    });

    doc.font("Helvetica").fontSize(regularFontSize);
    doc.text(data.companyAddress, { align: "center" });
    doc.text(data.companyContact, { align: "center" });
    y = doc.y + 4;

    // === DIVIDER ===
    const drawDivider = () => {
        doc.save()
            .moveTo(doc.page.margins.left, y)
            .lineTo(doc.page.width - doc.page.margins.right, y)
            .dash(1, { space: 2 })
            .stroke()
            .undash()
            .restore();
        y += 6;
    };

    drawDivider();

    doc.text(`Date: ${formatDateTime(data.orderDate)}`, doc.page.margins.left, y);
    y = doc.y + 4;

    drawDivider();

    // === COLUMN LAYOUT ===
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const qtyColWidth = usableWidth * 0.15;
    const priceColWidth = usableWidth * 0.25;
    const itemColWidth = usableWidth * 0.6;
    const startX = doc.page.margins.left;

    doc.font("Helvetica-Bold");
    doc.text("Qty", startX, y, { width: qtyColWidth });
    doc.text("Item", startX + qtyColWidth, y, { width: itemColWidth });
    doc.text("Price", startX + qtyColWidth + itemColWidth, y, {
        width: priceColWidth,
        align: "right",
    });
    y = doc.y + 2;

    drawDivider();

    // === ITEMS ===
    doc.font("Helvetica").fontSize(regularFontSize);
    data.items.forEach((item) => {
        const itemName = item.name;

        doc.text(item.quantity.toString(), startX, y, { width: qtyColWidth });
        doc.text(truncate(itemName, 32), startX + qtyColWidth, y, {
            width: itemColWidth,
        });
        doc.text(formatNumberWithDots(item.price), startX + qtyColWidth + itemColWidth, y, {
            width: priceColWidth,
            align: "right",
        });
        y = doc.y + 2;

        if (item.addOns && item.addOns.length > 0) {
            item.addOns.forEach((addon) => {
                doc.fontSize(addOnFontSize);
                doc.text("", startX, y, { width: qtyColWidth });
                doc.text(`+ ${addon.name}`, startX + qtyColWidth + 5, y, {
                    width: itemColWidth - 5,
                });
                doc.text(formatNumberWithDots(addon.price), startX + qtyColWidth + itemColWidth, y, {
                    width: priceColWidth,
                    align: "right",
                });
                y = doc.y + 2;
                doc.fontSize(regularFontSize);
            });
        }
    });

    y += 2;
    drawDivider();

    // === TOTAL ===
    doc.font("Helvetica-Bold").fontSize(regularFontSize + 1);

    // Calculate total width to ensure it fits on one line
    const totalLabelWidth = qtyColWidth + itemColWidth - 10; // Reduced width for label
    const totalValueWidth = priceColWidth + 10; // Increased width for value

    doc.text("Total:", startX, y, {
        width: totalLabelWidth,
        align: "left",
    });

    // Format currency with non-breaking amount
    const formattedTotal = formatCurrency(data.cartTotal).replace(/\s+/g, "");

    doc.text(formattedTotal, startX + totalLabelWidth, y, {
        width: totalValueWidth,
        align: "right",
    });

    y = doc.y + 4;

    drawDivider();

    // === FOOTER ===
    doc.font("Helvetica").fontSize(regularFontSize);
    doc.text("Thank you for your order!", doc.page.margins.left, y, {
        align: "center",
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    });

    doc.end();
};

export const calculateInvoiceHeight = (items: ThermalInvoiceItem[]): number => {
    const headerHeight = 35;
    const dividerHeight = 4;
    const itemTotalHeight = 12;
    const thankYou = 12;

    const tableHeaderHeight = 15;
    const tableRowHeight = 18;

    let calculatedItemDataHeight = 0;
    if (items) {
        items.forEach((item) => {
            calculatedItemDataHeight += tableRowHeight;
            if (item.addOns && item.addOns.length > 0) {
                calculatedItemDataHeight += item.addOns.length * (tableRowHeight - 4);
            }
        });
    }

    const totalHeight =
        headerHeight +
        dividerHeight * 4 +
        4 * 4 +
        calculatedItemDataHeight +
        tableHeaderHeight +
        itemTotalHeight +
        thankYou +
        50;

    return totalHeight;
};
