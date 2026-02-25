import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const password = await hash("password123", 10);
        const user = await prisma.user.upsert({
            where: { username: "admin" },
            update: {
                password: password,
            },
            create: {
                username: "admin",
                name: "Admin User",
                password: password,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Admin password successfully reset to 'password123'. You can now delete this file securely.",
            user: {
                id: user.id,
                username: user.username,
            }
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || "An unknown error occurred",
        }, { status: 500 });
    }
}
