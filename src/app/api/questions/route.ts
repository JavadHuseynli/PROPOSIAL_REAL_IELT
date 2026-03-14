import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const testId = searchParams.get("testId");

  if (!testId) {
    return NextResponse.json(
      { error: "testId query parameter is required" },
      { status: 400 }
    );
  }

  const questions = await prisma.question.findMany({
    where: { testId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(questions);
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
  const { testId, questionText, questionType, options, correctAnswer, order, points } = body;

  if (!testId || !questionText || !questionType || !correctAnswer) {
    return NextResponse.json(
      { error: "testId, questionText, questionType, and correctAnswer are required" },
      { status: 400 }
    );
  }

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const question = await prisma.question.create({
    data: {
      testId,
      questionText,
      questionType,
      options: options || null,
      correctAnswer,
      order: order ?? 0,
      points: points ?? 1,
    },
  });

  return NextResponse.json(question, { status: 201 });
}
