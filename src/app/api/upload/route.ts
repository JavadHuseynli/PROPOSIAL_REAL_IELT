import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export async function POST(req: NextRequest) {
  try {
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

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name) || ".mp3";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    // Image upload
    if (uploadType === "image") {
      return NextResponse.json({ url: publicUrl }, { status: 201 });
    }

    // Audio upload
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
        filePath: publicUrl,
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
