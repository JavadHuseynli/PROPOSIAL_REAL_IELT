import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const tests = await prisma.test.findMany({
    where: type ? { type: type as any } : undefined,
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tests);
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
  const { title, type, description, duration } = body;

  if (!title || !type) {
    return NextResponse.json(
      { error: "Title and type are required" },
      { status: 400 }
    );
  }

  const test = await prisma.test.create({
    data: {
      title,
      type,
      description: description || null,
      duration: duration || null,
      createdById: session.user.id!,
    },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { questions: true },
      },
    },
  });

  return NextResponse.json(test, { status: 201 });
}
