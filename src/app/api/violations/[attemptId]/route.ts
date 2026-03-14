import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "DEAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { attemptId } = await params;

  // Get all violations for this attempt
  const violations = await prisma.violation.findMany({
    where: { attemptId, type: { not: "SCREEN_CAPTURE" } },
    orderBy: { createdAt: "desc" },
  });

  // Get all screenshots for this attempt
  const screenshots = await prisma.violation.findMany({
    where: { attemptId, type: "SCREEN_CAPTURE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, screenshot: true, createdAt: true },
  });

  // Get attempt info
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { id: true, name: true, fin: true } },
      test: { select: { id: true, title: true, type: true } },
    },
  });

  return NextResponse.json({ violations, screenshots, attempt });
}
