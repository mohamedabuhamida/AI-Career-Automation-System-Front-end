import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { decrypt, encrypt } from '@/lib/encryption'

export async function GET() {
  try {
    const supabase = await createClient()

    // ✅ Get authenticated user securely
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { valid: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // ✅ Get stored Google tokens
    const { data: tokens, error: dbError } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (dbError || !tokens) {
      return NextResponse.json({
        valid: false,
        error: 'No tokens found',
      })
    }

    // ✅ Decrypt tokens
    const accessToken = decrypt(tokens.access_token)
    const refreshToken = decrypt(tokens.refresh_token)

    if (!refreshToken) {
      return NextResponse.json({
        valid: false,
        error: 'No refresh token stored',
      })
    }

    const now = new Date()
    const expiresAt = new Date(tokens.expires_at)
    let currentAccessToken = accessToken

    // 🔄 Refresh if expired
    if (now >= expiresAt) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        )

        oauth2Client.setCredentials({
          refresh_token: refreshToken,
        })

        const { credentials } =
          await oauth2Client.refreshAccessToken()

        if (!credentials.access_token) {
          throw new Error('No access token returned')
        }

        currentAccessToken = credentials.access_token

        // 🔐 Encrypt and store updated access token
        const encryptedAccessToken = encrypt(
          credentials.access_token
        )

        await supabase
          .from('google_tokens')
          .update({
            access_token: encryptedAccessToken,
            expires_at: new Date(
              Date.now() +
                (credentials.expiry_date
                  ? credentials.expiry_date - Date.now()
                  : 3600000)
            ).toISOString(),
          })
          .eq('user_id', user.id)

      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError)

        return NextResponse.json({
          valid: false,
          error: 'Refresh failed',
        })
      }
    }

    // ✅ Verify Gmail access
  
try {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${currentAccessToken}`
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error('Invalid token')
  }

  const hasGmailScope = data.scope?.includes(
    'https://www.googleapis.com/auth/gmail.send'
  )

  if (!hasGmailScope) {
    return NextResponse.json({
      valid: false,
      error: 'Missing Gmail send scope',
    })
  }

  return NextResponse.json({
    valid: true,
    email: data.email,
    expiresIn: data.expires_in,
  })

} catch (error) {
  return NextResponse.json({
    valid: false,
    error: 'Token verification failed',
  })
}


  } catch (error) {
    console.error('Token status error:', error)

    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
