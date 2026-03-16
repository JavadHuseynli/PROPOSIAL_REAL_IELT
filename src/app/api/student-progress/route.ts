import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Only check TODAY's completed attempts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAttempts = await prisma.testAttempt.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "GRADED"] },
      startedAt: { gte: today, lt: tomorrow },
    },
    include: {
      test: { select: { type: true } },
    },
  });

  const completedTypes = new Set(todayAttempts.map((a) => a.test.type));

  const activeTestCounts = await prisma.test.groupBy({
    by: ["type"],
    where: { isActive: true },
    _count: true,
  });

  const requiredTypes = activeTestCounts
    .filter((t) => t._count > 0)
    .map((t) => t.type);

  const progress = {
    LISTENING: completedTypes.has("LISTENING"),
    READING: completedTypes.has("READING"),
    WRITING: completedTypes.has("WRITING"),
    allCompleted: requiredTypes.every((t) => completedTypes.has(t)),
    requiredTypes,
  };

  return NextResponse.json(progress);
}
