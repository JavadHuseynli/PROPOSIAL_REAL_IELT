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

  const groups = await prisma.group.findMany({
    include: {
      teacher: { select: { id: true, name: true } },
      examSchedules: true,
      students: {
        select: {
          id: true,
          name: true,
          fin: true,
          testAttempts: {
            where: { status: { in: ["COMPLETED", "GRADED"] } },
            include: {
              test: { select: { type: true, title: true } },
            },
            orderBy: { completedAt: "desc" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const report = groups.map((group) => {
    const examSchedule = group.examSchedules[0] || null;

    const students = group.students.map((student) => {
      const listening = student.testAttempts.find((a) => a.test.type === "LISTENING");
      const reading = student.testAttempts.find((a) => a.test.type === "READING");
      const writing = student.testAttempts.find((a) => a.test.type === "WRITING");

      return {
        id: student.id,
        name: student.name,
        fin: student.fin,
        listening: listening ? { score: listening.score, date: listening.completedAt } : null,
        reading: reading ? { score: reading.score, date: reading.completedAt } : null,
        writing: writing ? { score: writing.score, date: writing.completedAt } : null,
        overall: null as number | null,
      };
    });

    for (const s of students) {
      const scores = [s.listening?.score, s.reading?.score, s.writing?.score].filter((x): x is number => x !== null && x !== undefined);
      if (scores.length > 0) {
        s.overall = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 2) / 2;
      }
    }

    const allScores = students.map((s) => s.overall).filter((x): x is number => x !== null);
    const groupAvg = allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 2) / 2 : null;

    return {
      id: group.id,
      name: group.name,
      teacher: group.teacher,
      studentCount: group.students.length,
      avgScore: groupAvg,
      examDate: examSchedule?.examDate || null,
      examNote: examSchedule?.note || null,
      students,
    };
  });

  return NextResponse.json(report);
}
