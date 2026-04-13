import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Single query: get user with group and schedules
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      groupId: true,
      group: {
        select: {
          examSchedules: {
            orderBy: { examDate: "desc" },
            select: { examDate: true, startTime: true, endTime: true },
          },
        },
      },
    },
  });

  let examStart: Date | null = null;
  let examEnd: Date | null = null;

  if (user?.group?.examSchedules) {
    const now = new Date();
    for (const s of user.group.examSchedules) {
      const dateStr = s.examDate.toISOString().split("T")[0];
      const start = new Date(`${dateStr}T${s.startTime}:00`);
      const end = new Date(`${dateStr}T${s.endTime}:00`);
      if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);
      if (now >= start && now <= end) {
        examStart = start;
        examEnd = end;
        break;
      }
    }
  }

  // Build time window filter
  const timeFilter: Record<string, unknown> = {};
  if (examStart && examEnd) {
    timeFilter.startedAt = { gte: examStart, lte: examEnd };
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    timeFilter.startedAt = { gte: today, lt: tomorrow };
  }

  // Parallel: completed attempts + active test types
  const [attempts, activeTestCounts] = await Promise.all([
    prisma.testAttempt.findMany({
      where: {
        userId,
        status: { in: ["COMPLETED", "GRADED"] },
        ...timeFilter,
      },
      select: { test: { select: { type: true } } },
    }),
    prisma.test.groupBy({
      by: ["type"],
      where: { isActive: true },
      _count: true,
    }),
  ]);

  const completedTypes = new Set(attempts.map((a) => a.test.type));
  const requiredTypes = activeTestCounts
    .filter((t) => t._count > 0)
    .map((t) => t.type);

  const res = NextResponse.json({
    LISTENING: completedTypes.has("LISTENING"),
    READING: completedTypes.has("READING"),
    WRITING: completedTypes.has("WRITING"),
    allCompleted: requiredTypes.every((t) => completedTypes.has(t)),
    requiredTypes,
  });

  // Cache for 10 seconds — reduces duplicate hits from same student
  res.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=5");
  return res;
}
