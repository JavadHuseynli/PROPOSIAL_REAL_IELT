import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Teachers only see their own groups
  const where = session.user.role === "TEACHER"
    ? { teacherId: session.user.id }
    : undefined;

  const groups = await prisma.group.findMany({
    where,
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { students: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, teacherId } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Qrup adı tələb olunur" },
      { status: 400 }
    );
  }

  const existing = await prisma.group.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "Bu adla qrup artıq mövcuddur" },
      { status: 409 }
    );
  }

  // Teachers automatically become the teacher of their created group
  const finalTeacherId = session.user.role === "TEACHER"
    ? session.user.id
    : (teacherId || null);

  const group = await prisma.group.create({
    data: {
      name,
      teacherId: finalTeacherId,
    },
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { students: true },
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}
