import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateBandScore } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const attempt = await prisma.testAttempt.findUnique({
    where: { id },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          type: true,
          description: true,
          duration: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
      writingSubmissions: {
        include: {
          writingTask: true,
          review: {
            include: { inlineComments: true },
          },
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  const isAdminOrDean =
    session.user.role === "ADMIN" || session.user.role === "DEAN";
  if (!isAdminOrDean && attempt.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(attempt);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const attempt = await prisma.testAttempt.findUnique({
    where: { id },
    include: {
      test: {
        include: {
          questions: true,
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  if (attempt.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { answers, status } = body;

  // Save answers if provided
  if (answers && Array.isArray(answers)) {
    for (const answer of answers) {
      const { questionId, userAnswer } = answer;

      const existingAnswer = await prisma.answer.findFirst({
        where: { attemptId: id, questionId },
      });

      if (existingAnswer) {
        await prisma.answer.update({
          where: { id: existingAnswer.id },
          data: { userAnswer },
        });
      } else {
        await prisma.answer.create({
          data: {
            attemptId: id,
            questionId,
            userAnswer,
          },
        });
      }
    }
  }

  // Handle completion
  if (status === "COMPLETED") {
    const testType = attempt.test.type;

    if (testType === "LISTENING" || testType === "READING") {
      // Auto-grade: compare answers to correct answers
      const savedAnswers = await prisma.answer.findMany({
        where: { attemptId: id },
        include: { question: true },
      });

      let correctCount = 0;
      let totalPoints = 0;

      // Normalize answers so "NOT_GIVEN" / "NOT GIVEN" / "not given" all match,
      // and so fill-in answers are case/whitespace insensitive.
      const normalize = (s: string) =>
        s.trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ");

      for (const q of attempt.test.questions) {
        if (q.questionType === "NOTE_COMPLETION") {
          // Multi-blank template counts each {{N}} as 1 point; single-blank counts as 1.
          const blankNums = q.questionText.match(/\{\{(\d+)\}\}/g) || [];
          totalPoints += blankNums.length > 0 ? blankNums.length : 1;
        } else {
          totalPoints += 1;
        }
      }

      for (const ans of savedAnswers) {
        if (ans.question.questionType === "NOTE_COMPLETION") {
          // Detect multi-blank (JSON object) vs single-blank (plain string).
          let correctBlanks: Record<string, string> | null = null;
          try {
            const parsed = JSON.parse(ans.question.correctAnswer);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              correctBlanks = parsed;
            }
          } catch {}

          if (correctBlanks) {
            // Multi-blank: compare each blank individually
            let userBlanks: Record<string, string> = {};
            try {
              const parsedUser = JSON.parse(ans.userAnswer);
              if (parsedUser && typeof parsedUser === "object") userBlanks = parsedUser;
            } catch {}

            let blanksCorrect = 0;
            const blankKeys = Object.keys(correctBlanks);
            for (const key of blankKeys) {
              if (
                userBlanks[key] &&
                normalize(userBlanks[key]) === normalize(correctBlanks[key] || "")
              ) {
                blanksCorrect++;
              }
            }
            const isCorrect = blanksCorrect === blankKeys.length && blankKeys.length > 0;
            correctCount += blanksCorrect;

            await prisma.answer.update({
              where: { id: ans.id },
              data: { isCorrect, points: blanksCorrect },
            });
          } else {
            // Single-blank note completion: plain-string compare
            const isCorrect =
              normalize(ans.userAnswer) === normalize(ans.question.correctAnswer);
            await prisma.answer.update({
              where: { id: ans.id },
              data: { isCorrect, points: isCorrect ? 1 : 0 },
            });
            if (isCorrect) correctCount++;
          }
        } else {
          const isCorrect =
            normalize(ans.userAnswer) === normalize(ans.question.correctAnswer);

          await prisma.answer.update({
            where: { id: ans.id },
            data: {
              isCorrect,
              points: isCorrect ? ans.question.points : 0,
            },
          });

          if (isCorrect) correctCount++;
        }
      }

      const bandScore = calculateBandScore(correctCount, totalPoints);

      const updated = await prisma.testAttempt.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          score: bandScore,
        },
        include: {
          test: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
          answers: {
            include: { question: true },
          },
        },
      });

      return NextResponse.json(updated);
    }

    // For WRITING tests, just mark as completed (teacher will grade)
    const updated = await prisma.testAttempt.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  }

  // If not completing, just return the attempt
  const updated = await prisma.testAttempt.findUnique({
    where: { id },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
      answers: true,
    },
  });

  return NextResponse.json(updated);
}
