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
  const userId = searchParams.get("userId");

  const isAdminOrDean =
    session.user.role === "ADMIN" || session.user.role === "DEAN";

  const where: Record<string, unknown> = {};

  if (!isAdminOrDean) {
    where.userId = session.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (testId) {
    where.testId = testId;
  }

  const attempts = await prisma.testAttempt.findMany({
    where,
    include: {
      test: {
        select: {
          id: true,
          title: true,
          type: true,
          description: true,
          duration: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json(attempts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { testId } = body;

  if (!testId) {
    return NextResponse.json(
      { error: "testId is required" },
      { status: 400 }
    );
  }

  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  // Check for active IN_PROGRESS attempt (prevent double start)
  const activeAttempt = await prisma.testAttempt.findFirst({
    where: {
      userId: session.user.id,
      testId,
      status: "IN_PROGRESS",
    },
  });

  if (activeAttempt) {
    return NextResponse.json(activeAttempt, { status: 200 });
  }

  // Check if already completed in current exam schedule time window.
  // We use the latest schedule's start time to scope the check,
  // avoiding server (UTC) vs client (local timezone) mismatches.
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { groupId: true } });
  if (user?.groupId) {
    const schedules = await prisma.examSchedule.findMany({
      where: { groupId: user.groupId },
      orderBy: { examDate: "asc" },
    });

    if (schedules.length > 0) {
      // Find the latest schedule by date+startTime (most recent exam window)
      const latest = schedules.reduce((best, s) => {
        const bDate = best.examDate.toISOString().split("T")[0];
        const sDate = s.examDate.toISOString().split("T")[0];
        const bStart = new Date(`${bDate}T${best.startTime}:00`);
        const sStart = new Date(`${sDate}T${s.startTime}:00`);
        return sStart > bStart ? s : best;
      });

      const latestDate = latest.examDate.toISOString().split("T")[0];
      const latestStart = new Date(`${latestDate}T${latest.startTime}:00`);

      // Only block if there's a completed attempt AFTER the latest schedule's start
      const alreadyDone = await prisma.testAttempt.findFirst({
        where: {
          userId: session.user.id,
          testId,
          status: { in: ["COMPLETED", "GRADED"] },
          startedAt: { gte: latestStart },
        },
      });
      if (alreadyDone) {
        return NextResponse.json(
          { error: "Bu testi bu imtahanda artiq tamamlamisiniz" },
          { status: 409 }
        );
      }
    }
  }

  const attempt = await prisma.testAttempt.create({
    data: {
      userId: session.user.id,
      testId,
      status: "IN_PROGRESS",
    },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          type: true,
          duration: true,
        },
      },
    },
  });

  return NextResponse.json(attempt, { status: 201 });
}
