import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      questions: {
        orderBy: { order: "asc" },
      },
      audioFiles: {
        orderBy: [{ section: "asc" }, { order: "asc" }],
      },
      writingTasks: true,
    },
  });

  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  return NextResponse.json(test);
}

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
  const { title, type, description, duration, isActive, examDate } = body;

  const existing = await prisma.test.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  const test = await prisma.test.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(duration !== undefined && { duration }),
      ...(isActive !== undefined && { isActive }),
      ...(examDate !== undefined && { examDate: examDate ? new Date(examDate) : null }),
    },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      questions: {
        orderBy: { order: "asc" },
      },
      audioFiles: {
        orderBy: [{ section: "asc" }, { order: "asc" }],
      },
      writingTasks: true,
    },
  });

  return NextResponse.json(test);
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

  const existing = await prisma.test.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  await prisma.test.delete({ where: { id } });

  return NextResponse.json({ message: "Test deleted" });
}
