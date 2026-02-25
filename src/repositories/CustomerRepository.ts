import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export class CustomerRepository {
    async listCustomersForDropdown() {
        return prisma.customer.findMany({
            select: { id: true, customerCode: true, customerName: true },
            orderBy: { customerName: "asc" },
            where: { deletedAt: null },
        });
    }

    async getCustomerById(id: string) {
        return prisma.customer.findUnique({
            where: { id },
            include: {
                addresses: true,
                contacts: true,
                documents: true,
            },
        });
    }

    async createCustomer(data: Prisma.CustomerCreateInput) {
        return prisma.customer.create({
            data,
            include: {
                addresses: true,
                contacts: true,
                documents: true,
            },
        });
    }

    async updateCustomer(id: string, data: Prisma.CustomerUpdateInput) {
        return prisma.customer.update({
            where: { id },
            data,
            include: {
                addresses: true,
                contacts: true,
                documents: true,
            },
        });
    }

    async deleteCustomer(id: string) {
        return prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
