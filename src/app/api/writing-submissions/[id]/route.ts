import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.writingSubmission.findUnique({
    where: { id },
    include: {
      writingTask: true,
      attempt: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          test: {
            select: { id: true, title: true, type: true },
          },
        },
      },
      review: {
        include: {
          inlineComments: true,
          teacher: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  // Students can only see their own submissions
  if (
    session.user.role === "STUDENT" &&
    submission.attempt.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(submission);
}
