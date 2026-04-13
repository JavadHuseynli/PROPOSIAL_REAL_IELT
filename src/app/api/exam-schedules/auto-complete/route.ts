import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateBandScore } from "@/lib/utils";

// This endpoint can be called by a cron job or admin to auto-complete expired exams
export async function POST() {
  const now = new Date();

  // Find all exam schedules where endTime has passed
  const schedules = await prisma.examSchedule.findMany({
    include: {
      group: {
        include: {
          students: {
            select: { id: true },
          },
        },
      },
    },
  });

  let completed = 0;

  for (const schedule of schedules) {
    const dateStr = schedule.examDate.toISOString().split("T")[0];
    const startTime = new Date(`${dateStr}T${schedule.startTime}:00`);
    const endTime = new Date(`${dateStr}T${schedule.endTime}:00`);
    // Cross-midnight: push end to next day
    if (endTime.getTime() <= startTime.getTime()) {
      endTime.setDate(endTime.getDate() + 1);
    }

    if (now <= endTime) continue; // Not ended yet

    const studentIds = schedule.group.students.map((s) => s.id);

    // Find all IN_PROGRESS attempts for these students
    const attempts = await prisma.testAttempt.findMany({
      where: {
        userId: { in: studentIds },
        status: "IN_PROGRESS",
      },
      include: {
        test: { include: { questions: true } },
      },
    });

    for (const attempt of attempts) {
      // Auto-grade if L/R
      if (attempt.test.type === "LISTENING" || attempt.test.type === "READING") {
        const answers = await prisma.answer.findMany({
          where: { attemptId: attempt.id },
          include: { question: true },
        });

        let correct = 0;
        const total = attempt.test.questions.length;

        for (const ans of answers) {
          const isCorrect = ans.userAnswer.trim().toLowerCase() === ans.question.correctAnswer.trim().toLowerCase();
          await prisma.answer.update({
            where: { id: ans.id },
            data: { isCorrect, points: isCorrect ? ans.question.points : 0 },
          });
          if (isCorrect) correct++;
        }

        await prisma.testAttempt.update({
          where: { id: attempt.id },
          data: {
            status: "COMPLETED",
            completedAt: now,
            score: calculateBandScore(correct, total || 1),
          },
        });
      } else {
        await prisma.testAttempt.update({
          where: { id: attempt.id },
          data: { status: "COMPLETED", completedAt: now },
        });
      }
      completed++;
    }
  }

  return NextResponse.json({ message: `${completed} attempt avtomatik tamamlandi` });
}
