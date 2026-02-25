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
    // Prevent path traversal
    const safePath = path.basename(filePathParam);
    // Actually we stored relative path as "timestamp-filename" in service, so it should be just a filename usually.
    // But wait, in service I did: const filePath = path.join(uploadDir, uniqueName);
    // And returned: filePath: uniqueName. 
    // So the "path" param here should be the uniqueName.

    if (!safePath || safePath !== filePathParam) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const absolutePath = path.join(process.cwd(), "storage", "uploads", safePath);

    try {
        const fileBuffer = await fs.readFile(absolutePath);
        const mimeType = mime.getType(absolutePath) || "application/octet-stream";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": mimeType,
                "Content-Disposition": `attachment; filename="${safePath}"`, // Should really use original name, but we don't have it here easily easily without looking up DB. For now, serve as is or use ID mapping.
                // Actually, in the UI we will have the original name. The download link could be just a proxy.
                // Let's rely on the browser to handle the filename if we can, or just serve it.
            }
        });

    } catch (error) {
        console.error("File read error:", error);
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
}
