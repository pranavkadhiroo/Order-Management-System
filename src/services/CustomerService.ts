import { CustomerRepository } from "@/repositories/CustomerRepository";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const customerRepository = new CustomerRepository();

const AddressSchema = z.object({
    id: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    telephone: z.string().nullable().optional(),
});

const ContactSchema = z.object({
    id: z.string().optional(),
    contactName: z.string().min(1, "Contact name is required"),
    email: z.string().email().nullable().optional().or(z.string().length(0)),
    phone: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
});

const DocumentSchema = z.object({
    id: z.string().optional(),
    fileName: z.string(),
    filePath: z.string(),
    fileType: z.string(),
    fileSize: z.number(),
    notes: z.string().nullable().optional(),
});

export const CustomerSchema = z.object({
    customerCode: z.string().min(1, "Customer Code is required"),
    customerName: z.string().min(1, "Customer Name is required"),
    telephone: z.string().nullable().optional(),
    email: z.string().email().nullable().optional().or(z.string().length(0)),
    country: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    salesPerson: z.string().nullable().optional(),
    addresses: z.array(AddressSchema).optional(),
    contacts: z.array(ContactSchema).optional(),
    documents: z.array(DocumentSchema).optional(),
});

export class CustomerService {
    async getCustomer(id: string) {
        return customerRepository.getCustomerById(id);
    }

    async createCustomer(data: z.infer<typeof CustomerSchema>) {
        const validated = CustomerSchema.parse(data);

        if (validated.email) {
            const verification = await prisma.emailVerification.findUnique({
                where: { email: validated.email }
            });
            if (!verification || !verification.verified) {
                throw new Error("Email verification is required.");
            }
        }

        const customerData: Prisma.CustomerCreateInput = {
            customerCode: validated.customerCode,
            customerName: validated.customerName,
            telephone: validated.telephone,
            email: validated.email,
            country: validated.country,
            city: validated.city,
            state: validated.state,
            salesPerson: validated.salesPerson,
            addresses: {
                create: validated.addresses?.map((a) => ({
                    address: a.address,
                    city: a.city,
                    state: a.state,
                    country: a.country,
                    telephone: a.telephone,
                })),
            },
            contacts: {
                create: validated.contacts?.map((c) => ({
                    contactName: c.contactName,
                    email: c.email,
                    phone: c.phone,
                    position: c.position,
                })),
            },
            documents: {
                create: validated.documents?.map((d) => ({
                    fileName: d.fileName,
                    filePath: d.filePath,
                    fileType: d.fileType,
                    fileSize: d.fileSize,
                    notes: d.notes,
                })),
            },
        };

        return customerRepository.createCustomer(customerData);
    }

    async updateCustomer(id: string, data: Partial<z.infer<typeof CustomerSchema>>) {
        // For simplicity, we are replacing lists. A more complex approach would be to diff.
        const validated = CustomerSchema.partial().parse(data);

        if (validated.email) {
            const existingCustomer = await this.getCustomer(id);
            if (existingCustomer?.email !== validated.email) {
                const verification = await prisma.emailVerification.findUnique({
                    where: { email: validated.email }
                });
                if (!verification || !verification.verified) {
                    throw new Error("Email verification is required for the new email address.");
                }
            }
        }

        const customerData: Prisma.CustomerUpdateInput = {
            ...(validated.customerCode && { customerCode: validated.customerCode }),
            ...(validated.customerName && { customerName: validated.customerName }),
            ...(validated.telephone !== undefined && { telephone: validated.telephone }),
            ...(validated.email !== undefined && { email: validated.email }),
            ...(validated.country !== undefined && { country: validated.country }),
            ...(validated.city !== undefined && { city: validated.city }),
            ...(validated.state !== undefined && { state: validated.state }),
            ...(validated.salesPerson !== undefined && { salesPerson: validated.salesPerson }),
        };

        if (validated.addresses) {
            customerData.addresses = {
                deleteMany: {},
                create: validated.addresses.map(a => ({
                    address: a.address,
                    city: a.city,
                    state: a.state,
                    country: a.country,
                    telephone: a.telephone,
                }))
            };
        }

        if (validated.contacts) {
            customerData.contacts = {
                deleteMany: {},
                create: validated.contacts.map(c => ({
                    contactName: c.contactName,
                    email: c.email,
                    phone: c.phone,
                    position: c.position,
                }))
            };
        }

        if (validated.documents) {
            // We only append new documents or update notes?
            // The UI usually sends the full list.
            // For documents we need to be careful not to delete files from disk if we delete from DB.
            // For now, let's assume we replace the metadata list.
            customerData.documents = {
                deleteMany: {},
                create: validated.documents.map(d => ({
                    fileName: d.fileName,
                    filePath: d.filePath,
                    fileType: d.fileType,
                    fileSize: d.fileSize,
                    notes: d.notes,
                }))
            };
        }

        return customerRepository.updateCustomer(id, customerData);
    }

    async saveFile(file: File): Promise<{ fileName: string; filePath: string; fileType: string; fileSize: number }> {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "storage", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });

        const allowedTypes = [
            'application/pdf', 'image/jpeg', 'image/png', 'image/gif',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain', 'application/zip', 'application/x-zip-compressed'
        ];

        if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type ${file.type || 'unknown'} is not allowed.`);
        }

        const safeFileName = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniqueName = `${Date.now()}-${safeFileName}`;
        const filePath = path.join(uploadDir, uniqueName);
        await fs.writeFile(filePath, buffer);

        return {
            fileName: path.basename(file.name),
            filePath: uniqueName, // Store relative filename
            fileType: file.type,
            fileSize: file.size
        };
    }
}
