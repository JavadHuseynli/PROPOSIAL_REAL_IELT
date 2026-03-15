import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schedules = await prisma.examSchedule.findMany({
    include: {
      group: { select: { id: true, name: true } },
      test: { select: { id: true, title: true, type: true } },
    },
    orderBy: { examDate: "asc" },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { groupId, testId, examDate, note } = body;

  if (!groupId || !testId || !examDate) {
    return NextResponse.json({ error: "Qrup, test ve tarix teleb olunur" }, { status: 400 });
  }

  // Upsert - if schedule already exists for this group+test, update it
  const schedule = await prisma.examSchedule.upsert({
    where: { groupId_testId: { groupId, testId } },
    create: { groupId, testId, examDate: new Date(examDate), note: note || null },
    update: { examDate: new Date(examDate), note: note || null },
    include: {
      group: { select: { id: true, name: true } },
      test: { select: { id: true, title: true, type: true } },
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}
