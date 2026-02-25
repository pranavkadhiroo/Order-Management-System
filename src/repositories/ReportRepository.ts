import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class ReportRepository {
    async getOrderSummaryData(startDate?: Date, endDate?: Date) {
        const where: Prisma.OrderWhereInput = {
            deletedAt: null,
            ...(startDate && endDate
                ? {
                    executionDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                }
                : {}),
        };

        return prisma.order.findMany({
            where,
            select: {
                orderNumber: true,
                executionDate: true,
                customer: {
                    select: { customerName: true },
                },
                charges: {
                    select: {
                        saleAmount: true,
                        costAmount: true,
                        vatSale: true,
                        vatCost: true,
                        totalSale: true,
                        totalCost: true,
                        currency: true,
                    },
                },
            },
            orderBy: { executionDate: "desc" },
        });
    }
}
