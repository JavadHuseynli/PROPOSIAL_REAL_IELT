import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role ? { role: role as any } : undefined,
    select: {
      id: true,
      email: true,
      name: true,
      fin: true,
      role: true,
      groupId: true,
      createdAt: true,
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
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
  const { email, password, name, role, groupId, fin } = body;

  // Teachers can only create students
  if (session.user.role === "TEACHER" && role && role !== "STUDENT") {
    return NextResponse.json({ error: "Müəllimlər yalnız tələbə yarada bilər" }, { status: 403 });
  }

  if (!name || !password) {
    return NextResponse.json(
      { error: "Ad və parol tələb olunur" },
      { status: 400 }
    );
  }

  // For students, FIN is required
  if ((role === "STUDENT" || !role) && !fin) {
    return NextResponse.json(
      { error: "Tələbələr üçün FIN kod tələb olunur" },
      { status: 400 }
    );
  }

  // Check FIN uniqueness
  if (fin) {
    const existingFin = await prisma.user.findUnique({ where: { fin } });
    if (existingFin) {
      return NextResponse.json(
        { error: "Bu FIN kodla istifadəçi artıq mövcuddur" },
        { status: 409 }
      );
    }
  }

  // Check email uniqueness if provided
  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Bu email artıq istifadə olunur" },
        { status: 409 }
      );
    }
  }

  // For students: if no password provided, use FIN as password
  const finalPassword = password || fin || "";
  if (!finalPassword) {
    return NextResponse.json({ error: "Parol və ya FIN kod tələb olunur" }, { status: 400 });
  }
  const hashedPassword = await bcrypt.hash(finalPassword, 10);

  // If no email, generate one from FIN
  const userEmail = email || `${(fin || Date.now().toString()).toLowerCase()}@student.ielts.az`;

  const user = await prisma.user.create({
    data: {
      email: userEmail,
      password: hashedPassword,
      name,
      fin: fin || null,
      role: role || "STUDENT",
      groupId: groupId || null,
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

  return NextResponse.json(user, { status: 201 });
}
