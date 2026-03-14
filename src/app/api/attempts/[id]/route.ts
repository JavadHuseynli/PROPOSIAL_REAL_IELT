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

      for (const q of attempt.test.questions) {
        if (q.questionType === "NOTE_COMPLETION") {
          // Count each blank as a separate point
          try {
            const blankNums = q.questionText.match(/\{\{(\d+)\}\}/g) || [];
            totalPoints += blankNums.length;
          } catch {
            totalPoints += q.points;
          }
        } else {
          totalPoints += 1;
        }
      }

      for (const ans of savedAnswers) {
        if (ans.question.questionType === "NOTE_COMPLETION") {
          // Compare each blank individually
          try {
            const userBlanks = JSON.parse(ans.userAnswer);
            const correctBlanks = JSON.parse(ans.question.correctAnswer);
            let blanksCorrect = 0;
            const blankKeys = Object.keys(correctBlanks);
            for (const key of blankKeys) {
              if (
                userBlanks[key]?.trim().toLowerCase() ===
                correctBlanks[key]?.trim().toLowerCase()
              ) {
                blanksCorrect++;
              }
            }
            const isCorrect = blanksCorrect === blankKeys.length;
            correctCount += blanksCorrect;

            await prisma.answer.update({
              where: { id: ans.id },
              data: {
                isCorrect,
                points: blanksCorrect,
              },
            });
          } catch {
            await prisma.answer.update({
              where: { id: ans.id },
              data: { isCorrect: false, points: 0 },
            });
          }
        } else {
          const isCorrect =
            ans.userAnswer.trim().toLowerCase() ===
            ans.question.correctAnswer.trim().toLowerCase();

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
