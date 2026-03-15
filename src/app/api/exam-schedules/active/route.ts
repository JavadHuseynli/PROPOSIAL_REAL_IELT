import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns exam schedule for the current student's group
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

  const schedule = await prisma.examSchedule.findUnique({
    where: { groupId: user.groupId },
  });

  return NextResponse.json(schedule);
}
