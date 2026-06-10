import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  if (session.user.role !== "TEACHER" && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    submissionId,
    score,         // admin 10-ballıq
    taskAchievement,
    coherenceCohesion,
    lexicalResource,
    grammaticalRange,
    overallBand,
    correctedContent,
    comments,
    inlineComments,
  } = body;

  if (!submissionId) {
    return NextResponse.json({ error: "submissionId is required" }, { status: 400 });
  }

  // Admin sadə 10-ballıq score göndərir
  if (isAdmin && score == null) {
    return NextResponse.json({ error: "score is required" }, { status: 400 });
  }

  // Teacher IELTS kriteriyaları göndərir
  if (!isAdmin && (taskAchievement == null || coherenceCohesion == null || lexicalResource == null || grammaticalRange == null || overallBand == null)) {
    return NextResponse.json({ error: "submissionId and all band scores are required" }, { status: 400 });
  }

  const finalScore = isAdmin ? score : overallBand;
  const finalTA = isAdmin ? score : taskAchievement;
  const finalCC = isAdmin ? score : coherenceCohesion;
  const finalLR = isAdmin ? score : lexicalResource;
  const finalGR = isAdmin ? score : grammaticalRange;

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
        taskAchievement: finalTA,
        coherenceCohesion: finalCC,
        lexicalResource: finalLR,
        grammaticalRange: finalGR,
        overallBand: finalScore,
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
        score: finalScore,
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
