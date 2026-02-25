import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CustomerService } from "@/services/CustomerService";
import { z } from "zod";

const customerService = new CustomerService();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where: { deletedAt: null },
      orderBy: { customerCode: "asc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        customerCode: true,
        customerName: true,
        telephone: true,
        email: true,
        country: true,
        city: true,
        state: true,
        salesPerson: true,
        createdAt: true
      },
    }),
    prisma.customer.count({ where: { deletedAt: null } }),
  ]);

  return NextResponse.json({ items, total });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const customer = await customerService.createCustomer(body as any);
    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    // Check for unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: "Customer code already exists" }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Email verification")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
