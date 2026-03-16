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
    orderBy: { examDate: "desc" },
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
  const { groupId, title, examDate, startTime, endTime, note } = body;

  if (!groupId || !examDate || !startTime || !endTime) {
    return NextResponse.json({ error: "Qrup, tarix, baslama ve bitme saati teleb olunur" }, { status: 400 });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: "Qrup tapilmadi" }, { status: 404 });
  }

  try {
    const schedule = await prisma.examSchedule.create({
      data: {
        groupId,
        title: title || "IELTS Imtahan",
        examDate: new Date(examDate),
        startTime,
        endTime,
        note: note || null,
      },
      include: {
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Yaradila bilmedi: " + (err.message || "").slice(0, 100) }, { status: 500 });
  }
}
