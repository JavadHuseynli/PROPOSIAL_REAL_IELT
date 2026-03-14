import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get all completed/graded attempts for this student
  const completedAttempts = await prisma.testAttempt.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "GRADED"] },
    },
    include: {
      test: { select: { type: true } },
    },
  });

  const completedTypes = new Set(completedAttempts.map((a) => a.test.type));

  // Check if there are active tests for each type
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
