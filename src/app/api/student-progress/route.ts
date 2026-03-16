import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get user's group and active exam schedule
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { groupId: true },
  });

  let examStart: Date | null = null;
  let examEnd: Date | null = null;

  if (user?.groupId) {
    const now = new Date();
    const schedules = await prisma.examSchedule.findMany({
      where: { groupId: user.groupId },
      orderBy: { examDate: "desc" },
    });

    // Find today's active or most recent exam
    for (const s of schedules) {
      const dateStr = s.examDate.toISOString().split("T")[0];
      const start = new Date(`${dateStr}T${s.startTime}:00`);
      const end = new Date(`${dateStr}T${s.endTime}:00`);
      if (now >= start && now <= end) {
        examStart = start;
        examEnd = end;
        break;
      }
    }
  }

  // Check attempts completed during active exam time window
  const where: any = {
    userId,
    status: { in: ["COMPLETED", "GRADED"] },
  };

  if (examStart && examEnd) {
    where.startedAt = { gte: examStart, lte: examEnd };
  } else {
    // No active exam - check today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.startedAt = { gte: today, lt: tomorrow };
  }

  const attempts = await prisma.testAttempt.findMany({
    where,
    include: { test: { select: { type: true } } },
  });

  const completedTypes = new Set(attempts.map((a) => a.test.type));

  const activeTestCounts = await prisma.test.groupBy({
    by: ["type"],
    where: { isActive: true },
    _count: true,
  });

  const requiredTypes = activeTestCounts
    .filter((t) => t._count > 0)
    .map((t) => t.type);

  return NextResponse.json({
    LISTENING: completedTypes.has("LISTENING"),
    READING: completedTypes.has("READING"),
    WRITING: completedTypes.has("WRITING"),
    allCompleted: requiredTypes.every((t) => completedTypes.has(t)),
    requiredTypes,
  });
}
