import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis";
import { decrypt, encrypt } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user's Google tokens
    const { data: tokens, error: dbError } = await supabase
      .from("google_tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (dbError || !tokens) {
      return NextResponse.json(
        {
          error:
            "No Google tokens found. Please reconnect your Google account.",
        },
        { status: 400 },
      );
    }

    // Decrypt tokens
    const accessToken = decrypt(tokens.access_token);
    const refreshToken = decrypt(tokens.refresh_token);

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokens.expires_at);
    let currentAccessToken = accessToken;

    if (now >= expiresAt) {
      // Token expired, refresh it
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
        );

        oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();

        // Store new tokens
        const encryptedAccessToken = encrypt(credentials.access_token!);

        await supabase
          .from("google_tokens")
          .update({
            access_token: encryptedAccessToken,
            expires_at: new Date(
              Date.now() + (credentials.expiry_date || 3600000),
            ).toISOString(),
          })
          .eq("user_id", user.id);

        currentAccessToken = credentials.access_token!;
      } catch (refreshError) {
        console.error("Token refresh error:", refreshError);
        return NextResponse.json(
          { error: "Failed to refresh Google token" },
          { status: 500 },
        );
      }
    }

    // Send email using Gmail API
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const gmail = google.gmail({
        version: "v1",
        auth: oauth2Client,
      });

      // Create email
      const email = [
        `To: ${to}`,
        "Content-Type: text/plain; charset=utf-8",
        "MIME-Version: 1.0",
        `Subject: ${subject}`,
        "",
        body,
      ].join("\n");

      // Encode email
      const encodedEmail = Buffer.from(email)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      try {
        const { token } = await oauth2Client.getAccessToken();
        console.log("Generated Access Token:", token);
      } catch (err) {
        console.error("Access token generation failed:", err);
      }

      // Send email
      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedEmail,
        },
      });

      // Log the email in database
      await supabase.from("emails_sent").insert({
        user_id: user.id,
        company_name: "Test",
        company_email: to,
        job_title: subject,
        job_description: body,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        messageId: response.data.id,
        threadId: response.data.threadId,
      });
    } catch (gmailError: any) {
      console.error("Gmail API error:", gmailError);

      // Log failed email
      await supabase.from("emails_sent").insert({
        user_id: user.id,
        company_name: "Test",
        company_email: to,
        job_title: subject,
        job_description: body,
        status: "failed",
        error_message: gmailError.message,
      });

      return NextResponse.json(
        {
          error: "Failed to send email via Gmail",
          details: gmailError.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
