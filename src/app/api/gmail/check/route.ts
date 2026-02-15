import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureValidToken } from "@/lib/token-manager"
import { getGmailClient } from "@/lib/gmail"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ valid: false })
    }

    await getGmailClient(user.id)

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json({ valid: false })
  }
}

