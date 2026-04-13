import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { testId, filePath, section, order } = await req.json();

  if (!testId || !filePath) {
    return NextResponse.json({ error: "testId and filePath required" }, { status: 400 });
  }

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const audioFile = await prisma.audioFile.create({
    data: {
      testId,
      filePath,
      section: section || 1,
      order: order || 0,
    },
  });

  return NextResponse.json(audioFile, { status: 201 });
}
