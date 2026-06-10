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

  const attempts = await prisma.testAttempt.findMany({
    where: {
      status: { in: ["COMPLETED", "GRADED"] },
      test: { type: { in: ["LISTENING", "READING"] } },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          group: { select: { id: true, name: true } },
        },
      },
      test: { select: { id: true, title: true, type: true } },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
              correctAnswer: true,
              order: true,
              points: true,
            },
          },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json(attempts);
}
