import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"
import { decrypt, encrypt } from "./encryption"

export async function ensureValidToken(userId: string) {
  const supabase = await createClient()

  const { data: tokens } = await supabase
    .from("google_tokens")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!tokens) throw new Error("No tokens found")

  const now = new Date()
  const expiresAt = new Date(tokens.expires_at)

  // لو فاض أكتر من 5 دقايق
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return decrypt(tokens.access_token)
  }

  // 🔄 Refresh
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    refresh_token: decrypt(tokens.refresh_token),
  })

  const { credentials } = await oauth2Client.refreshAccessToken()

  const newAccessToken = credentials.access_token!
  const expiryDate = new Date(credentials.expiry_date!)

  await supabase
    .from("google_tokens")
    .update({
      access_token: encrypt(newAccessToken),
      expires_at: expiryDate.toISOString(),
    })
    .eq("user_id", userId)

  return newAccessToken
}
