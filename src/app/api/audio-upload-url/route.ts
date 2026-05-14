import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { testId, part } = await req.json();
  if (!testId || !part) {
    return NextResponse.json({ error: "testId and part required" }, { status: 400 });
  }

  const path = `audio/${testId}-part${part}-${Date.now()}.mp3`;

  const { data, error } = await supabaseAdmin.storage
    .from("uploads")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: "Signed URL yaradila bilmedi: " + (error?.message || "") },
      { status: 500 }
    );
  }

  const { data: urlData } = supabaseAdmin.storage.from("uploads").getPublicUrl(path);

  return NextResponse.json({
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: urlData.publicUrl,
  });
}
