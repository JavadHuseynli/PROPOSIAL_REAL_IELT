import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const testId = req.nextUrl.searchParams.get("testId");
  if (!testId) {
    return NextResponse.json({ error: "testId is required" }, { status: 400 });
  }

  const tasks = await prisma.writingTask.findMany({
    where: { testId },
    orderBy: { taskType: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { testId, taskType, prompt, imageUrl, minWords, maxWords } = body;

  if (!testId || !taskType || !prompt) {
    return NextResponse.json(
      { error: "testId, taskType, and prompt are required" },
      { status: 400 }
    );
  }

  const task = await prisma.writingTask.create({
    data: {
      testId,
      taskType,
      prompt,
      imageUrl: imageUrl || null,
      minWords: minWords || 150,
      maxWords: maxWords || 300,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
