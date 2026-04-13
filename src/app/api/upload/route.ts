import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Next.js App Router body size limit
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Auth check (middleware skips this route for FormData compatibility)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const testId = formData.get("testId") as string | null;
    const section = formData.get("section") as string | null;
    const order = formData.get("order") as string | null;
    const uploadType = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Fayl secilmeyib" }, { status: 400 });
    }

    // Convert file to base64 data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "application/octet-stream";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Image upload - return data URL directly
    if (uploadType === "image") {
      return NextResponse.json({ url: dataUrl }, { status: 201 });
    }

    // Audio upload - store as base64 data URL in DB
    if (!testId) {
      return NextResponse.json({ error: "testId lazimdir" }, { status: 400 });
    }

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) {
      return NextResponse.json({ error: "Test tapilmadi" }, { status: 404 });
    }

    const audioFile = await prisma.audioFile.create({
      data: {
        testId,
        filePath: dataUrl,
        section: section ? parseInt(section, 10) : 1,
        order: order ? parseInt(order, 10) : 0,
      },
    });

    return NextResponse.json(audioFile, { status: 201 });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload xetasi: " + (err.message || "").slice(0, 200) },
      { status: 500 }
    );
  }
}
