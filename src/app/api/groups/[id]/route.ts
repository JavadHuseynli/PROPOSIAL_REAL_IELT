import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      students: {
        select: { id: true, name: true, fin: true, email: true, createdAt: true },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(group);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, teacherId, studentIds } = body;

  const existing = await prisma.group.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Teachers can only edit their own groups
  if (session.user.role === "TEACHER" && existing.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If studentIds is provided, update student assignments
  if (Array.isArray(studentIds)) {
    // Remove all current students from this group
    await prisma.user.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    // Assign the new students to this group
    if (studentIds.length > 0) {
      await prisma.user.updateMany({
        where: { id: { in: studentIds } },
        data: { groupId: id },
      });
    }
  }

  const group = await prisma.group.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(teacherId !== undefined && { teacherId }),
    },
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      students: {
        select: { id: true, name: true, fin: true, email: true, createdAt: true },
      },
    },
  });

  return NextResponse.json(group);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.group.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (session.user.role === "TEACHER" && existing.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Remove students from group before deleting
  await prisma.user.updateMany({
    where: { groupId: id },
    data: { groupId: null },
  });

  await prisma.group.delete({ where: { id } });

  return NextResponse.json({ message: "Group deleted" });
}
