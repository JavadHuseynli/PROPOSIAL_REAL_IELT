import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const groupId = formData.get("groupId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Fayl teleb olunur" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Excel faylinda melumat yoxdur" }, { status: 400 });
  }

  const results: { name: string; fin: string; status: string }[] = [];

  for (const row of rows) {
    const name = (row["Ad Soyad"] || row["ad_soyad"] || row["name"] || "").trim();
    const fin = (row["FIN"] || row["fin"] || row["FIN Kod"] || row["fin_kod"] || "").trim().toUpperCase();
    const role = (row["Rol"] || row["rol"] || row["role"] || "STUDENT").trim().toUpperCase();

    if (!name || !fin) {
      results.push({ name: name || "?", fin: fin || "?", status: "Ad ve ya FIN bosh" });
      continue;
    }

    // Check if FIN already exists
    const existing = await prisma.user.findUnique({ where: { fin } });
    if (existing) {
      results.push({ name, fin, status: "Bu FIN artiq movcuddur" });
      continue;
    }

    const hashedPassword = await bcrypt.hash(fin, 10);
    const email = `${fin.toLowerCase()}@student.ielts.az`;

    try {
      const finalRole = (session.user.role === "TEACHER") ? "STUDENT" : (role === "TEACHER" || role === "STUDENT" || role === "DEAN" || role === "ADMIN" ? role : "STUDENT");

      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          fin,
          role: finalRole as any,
          groupId: groupId || null,
        },
      });
      results.push({ name, fin, status: "Ugurla yaradildi" });
    } catch (err: any) {
      results.push({ name, fin, status: `Xeta: ${err.message?.slice(0, 50)}` });
    }
  }

  const success = results.filter((r) => r.status === "Ugurla yaradildi").length;
  const failed = results.length - success;

  return NextResponse.json({ total: results.length, success, failed, results });
}
