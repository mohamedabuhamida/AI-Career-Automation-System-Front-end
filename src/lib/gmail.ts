import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"
import { decrypt, encrypt } from "./encryption"

export async function getGmailClient(userId: string) {
  const supabase = await createClient()

  const { data: tokens } = await supabase
    .from("google_tokens")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!tokens) throw new Error("No tokens found")

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: decrypt(tokens.access_token),
    refresh_token: decrypt(tokens.refresh_token),
  })

  oauth2Client.on("tokens", async (newTokens) => {
    if (newTokens.access_token) {
      await supabase
        .from("google_tokens")
        .update({
          access_token: encrypt(newTokens.access_token),
          expires_at: new Date(
            Date.now() + (newTokens.expiry_date || 3600000)
          ).toISOString(),
        })
        .eq("user_id", userId)
    }
  })

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  })
}
