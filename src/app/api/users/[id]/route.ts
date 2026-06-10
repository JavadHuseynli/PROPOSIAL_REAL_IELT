import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      groupId: true,
      createdAt: true,
      group: { select: { id: true, name: true } },
      teacherOfGroups: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { email, name, role, groupId, fin, password, teacherGroupIds } = body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hashedPassword =
    typeof password === "string" && password.trim().length > 0
      ? await bcrypt.hash(password, 10)
      : undefined;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(email !== undefined && { email }),
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(groupId !== undefined && { groupId }),
      ...(fin !== undefined && { fin: fin || null }),
      ...(hashedPassword && { password: hashedPassword }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      fin: true,
      role: true,
      groupId: true,
      createdAt: true,
    },
  });

  // For teachers: update which groups they teach
  if (Array.isArray(teacherGroupIds)) {
    // Remove this teacher from all their current groups
    await prisma.group.updateMany({
      where: { teacherId: id },
      data: { teacherId: null },
    });
    // Assign them to the selected groups
    if (teacherGroupIds.length > 0) {
      await prisma.group.updateMany({
        where: { id: { in: teacherGroupIds } },
        data: { teacherId: id },
      });
    }
  }

  return NextResponse.json(user);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ message: "User deleted" });
}
