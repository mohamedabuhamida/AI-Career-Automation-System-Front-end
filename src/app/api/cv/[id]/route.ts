import { createClient } from "@/lib/supabase/server"

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient()

  // 1️⃣ تحقق من المستخدم
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2️⃣ هات الـ CV وتأكد إنه ملك المستخدم
  const { data: cv, error } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !cv) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 })
  }

  if (cv.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 3️⃣ اعمل Signed URL لمدة 60 ثانية
  const { data: signed, error: signedError } =
    await supabase.storage
      .from("cvs")
      .createSignedUrl(cv.storage_path, 60)

  if (signedError || !signed) {
    return NextResponse.json({ error: "Failed to sign URL" }, { status: 500 })
  }

  // 4️⃣ Redirect للمستخدم
  return NextResponse.redirect(signed.signedUrl)
}
