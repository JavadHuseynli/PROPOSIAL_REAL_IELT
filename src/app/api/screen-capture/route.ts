import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST - student uploads screen capture
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { attemptId, image } = body;

  if (!attemptId || !image) {
    return NextResponse.json({ error: "attemptId and image required" }, { status: 400 });
  }

  // Try auth first, but allow sendBeacon requests (which may not have session)
  const session = await auth();
  const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If session exists, verify ownership
  if (session?.user && attempt.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Save image to disk
  const capturesDir = path.join(process.cwd(), "public", "captures");
  await mkdir(capturesDir, { recursive: true });

  const filename = `${attemptId}-${Date.now()}.png`;
  const base64Data = image.replace(/^data:image\/png;base64,/, "");
  await writeFile(path.join(capturesDir, filename), base64Data, "base64");

  // Save to violation record as SCREEN_CAPTURE
  await prisma.violation.create({
    data: {
      attemptId,
      type: "SCREEN_CAPTURE",
      detail: `/captures/${filename}`,
      screenshot: `/captures/${filename}`,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

// GET - admin/dean gets latest captures for active attempts
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "DEAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get latest screen capture per STUDENT (not per attempt - avoids duplicates)
  const activeAttempts = await prisma.testAttempt.findMany({
    where: { status: "IN_PROGRESS" },
    include: {
      user: { select: { id: true, name: true, fin: true } },
      test: { select: { id: true, title: true, type: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  // Deduplicate: one entry per student (latest attempt only)
  const seenUsers = new Set<string>();
  const captures = [];

  for (const attempt of activeAttempts) {
    if (seenUsers.has(attempt.userId)) continue;
    seenUsers.add(attempt.userId);

    const latestCapture = await prisma.violation.findFirst({
      where: { attemptId: attempt.id, type: "SCREEN_CAPTURE" },
      orderBy: { createdAt: "desc" },
    });

    captures.push({
      attemptId: attempt.id,
      user: attempt.user,
      test: attempt.test,
      startedAt: attempt.startedAt,
      tabSwitchCount: attempt.tabSwitchCount,
      latestScreenshot: latestCapture?.screenshot || null,
      capturedAt: latestCapture?.createdAt || null,
    });
  }

  return NextResponse.json(captures);
}
