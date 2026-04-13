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

  // Return ALL schedules for this group.
  // The client picks the best one (active > upcoming > latest ended)
  // to avoid server (UTC) vs client (local timezone) mismatches.
  const schedules = await prisma.examSchedule.findMany({
    where: { groupId: user.groupId },
    orderBy: { examDate: "asc" },
  });

  if (schedules.length === 0) {
    return NextResponse.json(null);
  }

  return NextResponse.json(schedules);
}
