import { ReportRepository } from "@/repositories/ReportRepository";
import ExcelJS from "exceljs";

const reportRepository = new ReportRepository();

export class ReportService {
    async getOrderSummary(startDate?: Date, endDate?: Date, targetCurrency: "USD" | "AED" = "USD") {
        const orders = await reportRepository.getOrderSummaryData(startDate, endDate);
        const EXCHANGE_RATE = 3.6725; // 1 USD = 3.6725 AED

        return orders.map((order) => {
            const totals = order.charges.reduce(
                (acc, charge) => {
                    let rate = 1;
                    if (charge.currency === "USD" && targetCurrency === "AED") {
                        rate = EXCHANGE_RATE;
                    } else if (charge.currency === "AED" && targetCurrency === "USD") {
                        rate = 1 / EXCHANGE_RATE;
                    }
                    // If currencies match (USD->USD or AED->AED) or other pairings not handled data is kept as is (or could error)
                    // Assuming only USD/AED for now based on requirements.
                    // Other currencies will be treated as 1:1 if not USD/AED, or we should default them to USD?
                    // Safe approach: if currency isn't one of the known ones, treat as 1:1 to target if it matches, otherwise maybe logic needs to be more robust.
                    // Given prompt "only need to consider 2 currencies AED and USD", we focus on that.

                    return {
                        saleAmount: acc.saleAmount + (charge.saleAmount * rate),
                        costAmount: acc.costAmount + (charge.costAmount * rate),
                        vatSale: acc.vatSale + (charge.vatSale * rate),
                        vatCost: acc.vatCost + (charge.vatCost * rate),
                        totalSale: acc.totalSale + (charge.totalSale * rate),
                        totalCost: acc.totalCost + (charge.totalCost * rate),
                    };
                },
                { saleAmount: 0, costAmount: 0, vatSale: 0, vatCost: 0, totalSale: 0, totalCost: 0 }
            );

            return {
                orderNumber: order.orderNumber,
                executionDate: order.executionDate ? order.executionDate.toISOString().split("T")[0] : "",
                customerName: order.customer.customerName,
                ...totals,
                netAmount: totals.totalSale - totals.totalCost, // Profit
            };
        });
    }

    async generateOrderSummaryExcel(startDate?: Date, endDate?: Date, targetCurrency: "USD" | "AED" = "USD") {
        const data = await this.getOrderSummary(startDate, endDate, targetCurrency);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Order Summary");

        worksheet.columns = [
            { header: "Order Number", key: "orderNumber", width: 15 },
            { header: "Execution Date", key: "executionDate", width: 15 },
            { header: "Customer", key: "customerName", width: 25 },
            { header: "Total Sales", key: "totalSale", width: 15 },
            { header: "Total Cost", key: "totalCost", width: 15 },
            { header: "Sales VAT", key: "vatSale", width: 15 },
            { header: "Cost VAT", key: "vatCost", width: 15 },
            { header: "Net Amount", key: "netAmount", width: 15 },
        ];

        data.forEach((row) => {
            worksheet.addRow(row);
        });

        // Formatting
        worksheet.getRow(1).font = { bold: true };

        // Number formatting for financial columns
        ["D", "E", "F", "G", "H"].forEach(col => {
            worksheet.getColumn(col).numFmt = '#,##0.00';
        });

        return workbook.xlsx.writeBuffer();
    }

    async generateOrderSummaryXml(startDate?: Date, endDate?: Date, targetCurrency: "USD" | "AED" = "USD") {
        const data = await this.getOrderSummary(startDate, endDate, targetCurrency);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<OrderSummary>\n`;
        for (const row of data) {
            xml += `  <Order>\n`;
            xml += `    <OrderNumber><![CDATA[${row.orderNumber}]]></OrderNumber>\n`;
            xml += `    <ExecutionDate><![CDATA[${row.executionDate}]]></ExecutionDate>\n`;
            xml += `    <CustomerName><![CDATA[${row.customerName}]]></CustomerName>\n`;
            xml += `    <TotalSale>${row.totalSale.toFixed(2)}</TotalSale>\n`;
            xml += `    <TotalCost>${row.totalCost.toFixed(2)}</TotalCost>\n`;
            xml += `    <VatSale>${row.vatSale.toFixed(2)}</VatSale>\n`;
            xml += `    <VatCost>${row.vatCost.toFixed(2)}</VatCost>\n`;
            xml += `    <NetAmount>${row.netAmount.toFixed(2)}</NetAmount>\n`;
            xml += `  </Order>\n`;
        }
        xml += `</OrderSummary>`;

        return Buffer.from(xml, "utf-8");
    }
}
