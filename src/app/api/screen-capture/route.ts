import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Store screenshot as base64 data URL directly in DB
  const screenshotData = image.startsWith("data:") ? image : `data:image/png;base64,${image}`;

  // Keep only the LATEST screen capture per attempt — delete old ones
  const existing = await prisma.violation.findFirst({
    where: { attemptId, type: "SCREEN_CAPTURE" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    await prisma.violation.update({
      where: { id: existing.id },
      data: { screenshot: screenshotData, createdAt: new Date() },
    });
    // Delete any older duplicates
    await prisma.violation.deleteMany({
      where: { attemptId, type: "SCREEN_CAPTURE", id: { not: existing.id } },
    });
  } else {
    await prisma.violation.create({
      data: {
        attemptId,
        type: "SCREEN_CAPTURE",
        detail: `screen-capture`,
        screenshot: screenshotData,
      },
    });
  }

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

  // Deduplicate per student
  const seenUsers = new Set<string>();
  const dedupedAttempts = activeAttempts.filter((a) => {
    if (seenUsers.has(a.userId)) return false;
    seenUsers.add(a.userId);
    return true;
  });

  // Fetch all latest screenshots in a SINGLE query
  const attemptIds = dedupedAttempts.map((a) => a.id);
  const screenshots = await prisma.violation.findMany({
    where: { attemptId: { in: attemptIds }, type: "SCREEN_CAPTURE" },
    select: { attemptId: true, screenshot: true, createdAt: true },
  });
  const shotMap = new Map(screenshots.map((s) => [s.attemptId, s]));

  const captures = dedupedAttempts.map((attempt) => {
    const shot = shotMap.get(attempt.id);
    return {
      attemptId: attempt.id,
      user: attempt.user,
      test: attempt.test,
      startedAt: attempt.startedAt,
      tabSwitchCount: attempt.tabSwitchCount,
      latestScreenshot: shot?.screenshot || null,
      capturedAt: shot?.createdAt || null,
    };
  });

  return NextResponse.json(captures, {
    headers: { "Cache-Control": "no-store" },
  });
}
