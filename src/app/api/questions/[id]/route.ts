import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { questionText, questionType, options, correctAnswer, order, points, imageUrl, section, passageText, passageTitle } = body;

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const question = await prisma.question.update({
    where: { id },
    data: {
      ...(questionText !== undefined && { questionText }),
      ...(questionType !== undefined && { questionType }),
      ...(options !== undefined && { options }),
      ...(correctAnswer !== undefined && { correctAnswer }),
      ...(order !== undefined && { order }),
      ...(points !== undefined && { points }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(section !== undefined && { section }),
      ...(passageText !== undefined && { passageText }),
      ...(passageTitle !== undefined && { passageTitle }),
    },
  });

  return NextResponse.json(question);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  await prisma.question.delete({ where: { id } });

  return NextResponse.json({ message: "Question deleted" });
}
