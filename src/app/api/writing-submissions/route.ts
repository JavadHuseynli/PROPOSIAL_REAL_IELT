import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const groupId = searchParams.get("groupId");

  const where: Record<string, unknown> = {};

  if (session.user.role === "TEACHER") {
    const teacherGroups = await prisma.group.findMany({
      where: { teacherId: session.user.id },
      select: { id: true },
    });
    const teacherGroupIds = teacherGroups.map((g) => g.id);

    // Filter by specific group if requested, otherwise all teacher groups
    const activeGroupIds =
      groupId && teacherGroupIds.includes(groupId)
        ? [groupId]
        : teacherGroupIds;

    const students = await prisma.user.findMany({
      where: { groupId: { in: activeGroupIds } },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);
    where.attempt = { userId: { in: studentIds } };
  } else if (session.user.role === "STUDENT") {
    where.attempt = { userId: session.user.id };
  } else if (groupId) {
    // ADMIN/DEAN with groupId filter
    const students = await prisma.user.findMany({
      where: { groupId },
      select: { id: true },
    });
    where.attempt = { userId: { in: students.map((s) => s.id) } };
  }

  if (status === "unreviewed") {
    where.review = null;
  }

  const submissions = await prisma.writingSubmission.findMany({
    where,
    include: {
      writingTask: true,
      attempt: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              group: { select: { id: true, name: true } },
            },
          },
          test: {
            select: { id: true, title: true, type: true },
          },
        },
      },
      review: {
        select: { id: true, overallBand: true, reviewedAt: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(submissions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { attemptId, writingTaskId, content, wordCount } = body;

  if (!attemptId || !writingTaskId || !content) {
    return NextResponse.json(
      { error: "attemptId, writingTaskId, and content are required" },
      { status: 400 }
    );
  }

  // Verify the attempt belongs to the current user
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    return NextResponse.json(
      { error: "Attempt not found" },
      { status: 404 }
    );
  }

  if (attempt.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const submission = await prisma.writingSubmission.create({
    data: {
      attemptId,
      writingTaskId,
      content,
      wordCount: wordCount || 0,
    },
    include: {
      writingTask: true,
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
