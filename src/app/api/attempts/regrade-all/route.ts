import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gradeAttempt } from "@/lib/grading";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const testId = searchParams.get("testId");

  const attempts = await prisma.testAttempt.findMany({
    where: {
      status: { in: ["COMPLETED", "GRADED"] },
      test: {
        type: { in: ["LISTENING", "READING"] },
      },
      ...(testId && { testId }),
    },
    select: { id: true },
  });

  let success = 0;
  let failed = 0;

  for (const a of attempts) {
    try {
      const result = await gradeAttempt(a.id);
      if (result) {
        await prisma.testAttempt.update({
          where: { id: a.id },
          data: { score: result.bandScore },
        });
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ total: attempts.length, success, failed });
}
