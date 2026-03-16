import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { groupId: true },
  });

  if (!user?.groupId) {
    return NextResponse.json(null);
  }

  // Return the currently active or next upcoming exam for this group
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const schedules = await prisma.examSchedule.findMany({
    where: { groupId: user.groupId },
    orderBy: { examDate: "asc" },
  });

  // Find active exam (today, within time range)
  for (const s of schedules) {
    const dateStr = s.examDate.toISOString().split("T")[0];
    if (dateStr === todayStr) {
      const start = new Date(`${dateStr}T${s.startTime}:00`);
      const end = new Date(`${dateStr}T${s.endTime}:00`);
      if (now >= start && now <= end) {
        return NextResponse.json(s);
      }
    }
  }

  // Find next upcoming
  for (const s of schedules) {
    const dateStr = s.examDate.toISOString().split("T")[0];
    const end = new Date(`${dateStr}T${s.endTime}:00`);
    if (end > now) {
      return NextResponse.json(s);
    }
  }

  return NextResponse.json(null);
}
