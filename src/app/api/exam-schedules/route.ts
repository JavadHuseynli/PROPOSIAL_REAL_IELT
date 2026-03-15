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
  const { groupId, examDate, startTime, endTime, note } = body;

  if (!groupId || !examDate || !startTime || !endTime) {
    return NextResponse.json({ error: "Qrup, tarix, baslama ve bitme saati teleb olunur" }, { status: 400 });
  }

  const schedule = await prisma.examSchedule.upsert({
    where: { groupId },
    create: { groupId, examDate: new Date(examDate), startTime, endTime, note: note || null },
    update: { examDate: new Date(examDate), startTime, endTime, note: note || null },
    include: {
      group: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}
