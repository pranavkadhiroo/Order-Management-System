import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Start seeding...");

    // Create default admin user
    const password = await hash("password123", 10);
    const user = await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            name: "Admin User",
            password: password,
        },
    });

    console.log(`Created user: ${user.username} (password: password123)`);

    // Create sample customer
    const customer = await prisma.customer.upsert({
        where: { customerCode: "CUST001" },
        update: {},
        create: {
            customerCode: "CUST001",
            customerName: "Global Logistics Ltd",
            email: "contact@globallogistics.com",
            telephone: "+1234567890",
            city: "New York",
            country: "USA",
            salesPerson: "John Doe",
        },
    });

    console.log(`Created customer: ${customer.customerName}`);

    console.log("Seeding finished.");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
