import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { encrypt, decrypt } from '@/lib/encryption'
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
    const cookieStore = cookies()
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get tokens from request body
    const { access_token, refresh_token, expires_at } = await request.json()

    if (!access_token || !refresh_token || !expires_at) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Encrypt tokens
    const encryptedAccessToken = encrypt(access_token)
    const encryptedRefreshToken = encrypt(refresh_token)

    // Store in database using service role (bypass RLS)
    const { error: dbError } = await supabase
      .from('google_tokens')
      .upsert({
        user_id: user.id,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at,
      }, {
        onConflict: 'user_id',
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to store tokens' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Token storage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's tokens
    const { data: tokens, error: dbError } = await supabase
      .from('google_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single()

    if (dbError || !tokens) {
      return NextResponse.json(
        { error: 'No tokens found' },
        { status: 404 }
      )
    }

    // Decrypt tokens
    const decryptedTokens = {
      access_token: decrypt(tokens.access_token),
      refresh_token: decrypt(tokens.refresh_token),
      expires_at: tokens.expires_at,
    }

    return NextResponse.json(decryptedTokens)
  } catch (error) {
    console.error('Token retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}