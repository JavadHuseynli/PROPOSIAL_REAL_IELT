import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "DEAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get active attempts - deduplicate by user (one per student)
  const allActiveAttempts = await prisma.testAttempt.findMany({
    where: { status: "IN_PROGRESS" },
    include: {
      user: { select: { id: true, name: true, fin: true } },
      test: { select: { id: true, title: true, type: true } },
      violations: {
        where: { type: { not: "SCREEN_CAPTURE" } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { startedAt: "desc" },
  });

  // Deduplicate: one entry per student
  const seenUsers = new Set<string>();
  const activeAttempts = allActiveAttempts.filter((a) => {
    if (seenUsers.has(a.userId)) return false;
    seenUsers.add(a.userId);
    return true;
  });

  // Recent violations (exclude screen captures, last 50)
  const recentViolations = await prisma.violation.findMany({
    where: { type: { not: "SCREEN_CAPTURE" } },
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      attempt: {
        include: {
          user: { select: { id: true, name: true, fin: true } },
          test: { select: { id: true, title: true, type: true } },
        },
      },
    },
  });

  // Suspicious attempts with violations
  const suspiciousAttempts = await prisma.testAttempt.findMany({
    where: { tabSwitchCount: { gt: 0 } },
    include: {
      user: { select: { id: true, name: true, fin: true } },
      test: { select: { id: true, title: true, type: true } },
      _count: { select: { violations: true } },
    },
    orderBy: { tabSwitchCount: "desc" },
    take: 30,
  });

  return NextResponse.json({
    activeAttempts,
    recentViolations,
    suspiciousAttempts,
  });
}
