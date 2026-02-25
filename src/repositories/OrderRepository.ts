import { prisma } from "@/lib/prisma";
import { Order, Prisma } from "@prisma/client";

export class OrderRepository {
    async createOrder(data: Prisma.OrderCreateInput) {
        return prisma.order.create({
            data,
            include: {
                details: true,
                containers: true,
                charges: true,
            },
        });
    }

    async updateOrder(id: string, data: Prisma.OrderUpdateInput) {
        return prisma.order.update({
            where: { id },
            data,
            include: {
                details: true,
                containers: true,
                charges: true,
            },
        });
    }

    async getOrderById(id: string) {
        return prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                details: true,
                containers: true,
                charges: true,
            },
        });
    }

    async listOrders(
        skip: number,
        take: number,
        where?: Prisma.OrderWhereInput
    ) {
        return prisma.$transaction([
            prisma.order.findMany({
                skip,
                take,
                where: { ...where, deletedAt: null },
                include: { customer: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma.order.count({ where: { ...where, deletedAt: null } }),
        ]);
    }

    async softDeleteOrder(id: string): Promise<Order> {
        return prisma.order.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    // Aggregation for reports
    async listOrdersForReport(where?: Prisma.OrderWhereInput) {
        return prisma.order.findMany({
            where: { ...where, deletedAt: null },
            include: {
                customer: true,
                charges: true,
            },
            orderBy: { orderNumber: "asc" },
        });
    }
}
