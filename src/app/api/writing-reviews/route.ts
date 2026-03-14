import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    submissionId,
    taskAchievement,
    coherenceCohesion,
    lexicalResource,
    grammaticalRange,
    overallBand,
    correctedContent,
    comments,
    inlineComments,
  } = body;

  if (
    !submissionId ||
    taskAchievement == null ||
    coherenceCohesion == null ||
    lexicalResource == null ||
    grammaticalRange == null ||
    overallBand == null
  ) {
    return NextResponse.json(
      { error: "submissionId and all band scores are required" },
      { status: 400 }
    );
  }

  // Verify the submission exists
  const submission = await prisma.writingSubmission.findUnique({
    where: { id: submissionId },
    include: { review: true },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  if (submission.review) {
    return NextResponse.json(
      { error: "This submission already has a review" },
      { status: 409 }
    );
  }

  // Create review with inline comments in a transaction
  const review = await prisma.$transaction(async (tx) => {
    const createdReview = await tx.writingReview.create({
      data: {
        submissionId,
        teacherId: session.user.id,
        taskAchievement,
        coherenceCohesion,
        lexicalResource,
        grammaticalRange,
        overallBand,
        correctedContent: correctedContent || null,
        comments: comments || null,
      },
    });

    // Create inline comments if provided
    if (inlineComments && Array.isArray(inlineComments)) {
      for (const ic of inlineComments) {
        await tx.inlineComment.create({
          data: {
            reviewId: createdReview.id,
            startIndex: ic.startIndex,
            endIndex: ic.endIndex,
            originalText: ic.originalText,
            suggestedText: ic.suggestedText || null,
            comment: ic.comment,
          },
        });
      }
    }

    // Update the TestAttempt status to GRADED and set score
    await tx.testAttempt.update({
      where: { id: submission.attemptId },
      data: {
        status: "GRADED",
        score: overallBand,
      },
    });

    return createdReview;
  });

  // Fetch the full review with inline comments
  const fullReview = await prisma.writingReview.findUnique({
    where: { id: review.id },
    include: {
      inlineComments: true,
      teacher: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(fullReview, { status: 201 });
}
