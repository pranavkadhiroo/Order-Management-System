import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { ReportService } from "@/services/ReportService";

const reportService = new ReportService();

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

    try {
        const data = await reportService.getOrderSummary(startDate, endDate);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to generate report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
