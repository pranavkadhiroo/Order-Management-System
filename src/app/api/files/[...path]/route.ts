import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
import mime from "mime";

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const filePathParam = params.path.join("/");
    const safePath = filePathParam.split("/").pop(); // uniqueName is just the filename now

    if (!safePath) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const { createClient } = require("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: "Supabase credentials not configured." }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data, error } = await supabase.storage.from("documents").download(safePath);

        if (error || !data) {
            throw new Error(error?.message || "File not found");
        }

        const fileBuffer = Buffer.from(await data.arrayBuffer());
        const mimeType = "application/octet-stream"; // or derive from name

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": mimeType,
                "Content-Disposition": `attachment; filename="${safePath}"`,
            }
        });

    } catch (error) {
        console.error("File download error:", error);
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
