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

  const review = await prisma.writingReview.findUnique({
    where: { id },
    include: {
      inlineComments: true,
      teacher: {
        select: { id: true, name: true, email: true },
      },
      submission: {
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
        },
      },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // Students can only see reviews of their own submissions
  if (
    session.user.role === "STUDENT" &&
    review.submission.attempt.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(review);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const review = await prisma.writingReview.findUnique({
    where: { id },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // Only the original teacher or admin can update
  if (
    session.user.role === "TEACHER" &&
    review.teacherId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    taskAchievement,
    coherenceCohesion,
    lexicalResource,
    grammaticalRange,
    overallBand,
    correctedContent,
    comments,
    inlineComments,
  } = body;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedReview = await tx.writingReview.update({
      where: { id },
      data: {
        ...(taskAchievement != null && { taskAchievement }),
        ...(coherenceCohesion != null && { coherenceCohesion }),
        ...(lexicalResource != null && { lexicalResource }),
        ...(grammaticalRange != null && { grammaticalRange }),
        ...(overallBand != null && { overallBand }),
        ...(correctedContent !== undefined && { correctedContent }),
        ...(comments !== undefined && { comments }),
      },
    });

    // Replace inline comments if provided
    if (inlineComments && Array.isArray(inlineComments)) {
      await tx.inlineComment.deleteMany({
        where: { reviewId: id },
      });

      for (const ic of inlineComments) {
        await tx.inlineComment.create({
          data: {
            reviewId: id,
            startIndex: ic.startIndex,
            endIndex: ic.endIndex,
            originalText: ic.originalText,
            suggestedText: ic.suggestedText || null,
            comment: ic.comment,
          },
        });
      }
    }

    // Update attempt score if overallBand changed
    if (overallBand != null) {
      const submission = await tx.writingSubmission.findUnique({
        where: { id: updatedReview.submissionId },
      });

      if (submission) {
        await tx.testAttempt.update({
          where: { id: submission.attemptId },
          data: { score: overallBand },
        });
      }
    }

    return updatedReview;
  });

  const fullReview = await prisma.writingReview.findUnique({
    where: { id: updated.id },
    include: {
      inlineComments: true,
      teacher: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(fullReview);
}
