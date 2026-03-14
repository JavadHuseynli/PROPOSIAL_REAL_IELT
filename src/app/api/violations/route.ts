import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { attemptId, type, detail, duration, screenshot } = body;

  if (!attemptId || !type) {
    return NextResponse.json({ error: "attemptId and type required" }, { status: 400 });
  }

  const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const violation = await prisma.violation.create({
    data: {
      attemptId,
      type,
      detail: detail || null,
      duration: duration || null,
      screenshot: screenshot || null,
    },
  });

  // Increment tab switch count
  if (type === "TAB_SWITCH") {
    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { tabSwitchCount: { increment: 1 } },
    });
  }

  return NextResponse.json(violation, { status: 201 });
}
