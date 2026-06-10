import { prisma } from "@/lib/prisma";

const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ");

export async function gradeAttempt(attemptId: string) {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: { test: { include: { questions: true } } },
  });

  if (!attempt) return null;
  if (attempt.test.type !== "LISTENING" && attempt.test.type !== "READING") {
    return null;
  }

  const savedAnswers = await prisma.answer.findMany({
    where: { attemptId },
    include: { question: true },
  });

  let earnedPoints = 0;
  let totalPoints = 0;

  for (const q of attempt.test.questions) {
    totalPoints += q.points;
  }

  for (const ans of savedAnswers) {
    const qPoints = ans.question.points;

    if (ans.question.questionType === "NOTE_COMPLETION") {
      let correctBlanks: Record<string, string> | null = null;
      try {
        const parsed = JSON.parse(ans.question.correctAnswer);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          correctBlanks = parsed;
        }
      } catch {}

      if (correctBlanks) {
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
        const totalBlanks = blankKeys.length;
        const earned =
          totalBlanks > 0 ? (blanksCorrect / totalBlanks) * qPoints : 0;
        const isCorrect = blanksCorrect === totalBlanks && totalBlanks > 0;
        earnedPoints += earned;

        await prisma.answer.update({
          where: { id: ans.id },
          data: { isCorrect, points: Math.round(earned) },
        });
      } else {
        const isCorrect =
          normalize(ans.userAnswer) === normalize(ans.question.correctAnswer);
        await prisma.answer.update({
          where: { id: ans.id },
          data: { isCorrect, points: isCorrect ? qPoints : 0 },
        });
        if (isCorrect) earnedPoints += qPoints;
      }
    } else {
      const isCorrect =
        normalize(ans.userAnswer) === normalize(ans.question.correctAnswer);

      await prisma.answer.update({
        where: { id: ans.id },
        data: { isCorrect, points: isCorrect ? qPoints : 0 },
      });

      if (isCorrect) earnedPoints += qPoints;
    }
  }

  const bandScore = totalPoints > 0
    ? Math.round((earnedPoints / totalPoints) * 10)
    : 0;

  return { bandScore, earnedPoints, totalPoints };
}
