import { OrderRepository } from "@/repositories/OrderRepository";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const orderRepository = new OrderRepository();

// Validation Schemas
const OrderDetailSchema = z.object({
    billNumber: z.string().min(1, "Bill number is required"),
    marks: z.string().optional(),
    description: z.string().optional(),
    qty: z.number().positive("Quantity must be greater than 0"),
    weight: z.number().optional(),
    volume: z.number().optional(),
});

const ContainerSchema = z.object({
    billNumber: z.string().optional(),
    containerNumber: z.string().optional(),
    sealNumber: z.string().optional(),
    containerWeight: z.number().optional(),
    // weight is usually float
});

const ChargeSchema = z.object({
    description: z.string().min(1, "Description is required"),
    qty: z.number().min(0),
    saleRate: z.number().min(0),
    costRate: z.number().min(0),
    vatPercent: z.number().min(0),
    currency: z.string().default("USD"),
});

export const OrderSchema = z.object({
    customerId: z.string().uuid("Invalid customer ID"),
    orderNumber: z.string().min(1, "Order number is required"),
    orderDate: z.string().or(z.date()),
    executionDate: z.string().or(z.date()).optional(),
    details: z.array(OrderDetailSchema).optional(),
    containers: z.array(ContainerSchema).optional(),
    charges: z.array(ChargeSchema).optional(),
});

export class OrderService {
    private calculateFinancials(charge: z.infer<typeof ChargeSchema>) {
        const saleAmount = charge.qty * charge.saleRate;
        const costAmount = charge.qty * charge.costRate;
        const vatSale = (saleAmount * charge.vatPercent) / 100;
        const vatCost = (costAmount * charge.vatPercent) / 100;

        return {
            saleAmount,
            costAmount,
            vatSale,
            vatCost,
            totalSale: saleAmount + vatSale,
            totalCost: costAmount + vatCost,
        };
    }

    async createOrder(data: z.infer<typeof OrderSchema>) {
        const validated = OrderSchema.parse(data);

        const orderData: Prisma.OrderCreateInput = {
            orderNumber: validated.orderNumber,
            orderDate: new Date(validated.orderDate),
            executionDate: validated.executionDate ? new Date(validated.executionDate) : null,
            customer: { connect: { id: validated.customerId } },
            details: {
                create: validated.details?.map((d) => ({
                    billNumber: d.billNumber,
                    marks: d.marks,
                    description: d.description,
                    qty: d.qty,
                    weight: d.weight,
                    volume: d.volume,
                })),
            },
            containers: {
                create: validated.containers?.map((c) => ({
                    billNumber: c.billNumber,
                    containerNumber: c.containerNumber,
                    sealNumber: c.sealNumber,
                    containerWeight: c.containerWeight,
                })),
            },
            charges: {
                create: validated.charges?.map((c) => {
                    const financials = this.calculateFinancials(c);
                    return {
                        description: c.description,
                        qty: c.qty,
                        saleRate: c.saleRate,
                        costRate: c.costRate,
                        vatPercent: c.vatPercent,
                        currency: c.currency,
                        ...financials,
                    };
                }),
            },
        };

        return orderRepository.createOrder(orderData);
    }

    async updateOrder(id: string, data: Partial<z.infer<typeof OrderSchema>>) {
        // For update, we might need a different strategy if we are replacing all lists
        // Simple approach: Delete related and recreate (for lists) or use specific update logic
        // Implementation Plan implied full update for lists for simplicity, or we can use transaction
        // Let's assume we are receiving full lists to replace.

        // Note: Prisma doesn't strictly support "replace all" easily without deleteMany.
        // We will use a transaction in the repository if we wanted to be atomic, but here we construct the input.
        // Actually, `update` with `details: { deleteMany: {}, create: [...] }` works.

        const orderData: Prisma.OrderUpdateInput = {
            ...(data.orderNumber && { orderNumber: data.orderNumber }),
            ...(data.orderDate && { orderDate: new Date(data.orderDate) }),
            ...(data.executionDate && { executionDate: new Date(data.executionDate) }),
            ...(data.customerId && { customer: { connect: { id: data.customerId } } }),
        };

        if (data.details) {
            orderData.details = {
                deleteMany: {},
                create: data.details.map((d) => ({
                    billNumber: d.billNumber,
                    marks: d.marks,
                    description: d.description,
                    qty: d.qty,
                    weight: d.weight,
                    volume: d.volume,
                })),
            };
        }

        if (data.containers) {
            orderData.containers = {
                deleteMany: {},
                create: data.containers.map((c) => ({
                    billNumber: c.billNumber,
                    containerNumber: c.containerNumber,
                    sealNumber: c.sealNumber,
                    containerWeight: c.containerWeight,
                })),
            };
        }

        if (data.charges) {
            orderData.charges = {
                deleteMany: {},
                create: data.charges.map((c) => {
                    const financials = this.calculateFinancials(c);
                    return {
                        description: c.description,
                        qty: c.qty,
                        saleRate: c.saleRate,
                        costRate: c.costRate,
                        vatPercent: c.vatPercent,
                        currency: c.currency,
                        ...financials,
                    };
                }),
            };
        }

        return orderRepository.updateOrder(id, orderData);
    }

    async getOrder(id: string) {
        return orderRepository.getOrderById(id);
    }

    async listOrders(page: number, pageSize: number, search?: string) {
        const where: Prisma.OrderWhereInput = search
            ? {
                OR: [
                    { orderNumber: { contains: search, mode: "insensitive" } },
                    { customer: { customerName: { contains: search, mode: "insensitive" } } },
                ],
            }
            : {};
        const skip = (page - 1) * pageSize;
        return orderRepository.listOrders(skip, pageSize, where);
    }

    async deleteOrder(id: string) {
        return orderRepository.softDeleteOrder(id);
    }
}
