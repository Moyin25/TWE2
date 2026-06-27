import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { SecurityService } from '@/lib/security'
import { UserRole } from '@prisma/client'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, captchaToken } = body

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Validation failed', details: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    const userAgent = request.headers.get('user-agent') || undefined

    // Basic CAPTCHA validation (simplified - in production use proper CAPTCHA service)
    if (!captchaToken) {
      return NextResponse.json(
        { error: 'CAPTCHA required', details: 'Please complete the CAPTCHA' },
        { status: 400 }
      )
    }

    const { user, requiresMFA } = await AuthService.login(email, password, ipAddress, userAgent)

    // Generate tokens
    const accessToken = await AuthService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await AuthService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // If MFA is required, don't set tokens yet
    if (requiresMFA) {
      return NextResponse.json({
        message: 'MFA required',
        requiresMFA: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      }, { status: 200 })
    }

    const response = new NextResponse(
      JSON.stringify({
        message: 'Login successful',
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
        },
        token: accessToken,
        redirectUrl:
          user.role === UserRole.ADMIN
            ? '/dashboard/admin'
            : user.role === UserRole.SPONSOR
            ? '/dashboard/sponsor'
            : '/dashboard/volunteer',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    // Properly set cookies with security considerations
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Strict in production
      path: '/',
      maxAge: 15 * 60, // 15 minutes
      // Explicitly set domain to avoid subdomain issues
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Strict in production
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      // Explicitly set domain to avoid subdomain issues
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.message === 'Invalid credentials') {
      return NextResponse.json(
        { error: 'Invalid credentials', details: 'Incorrect email or password' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: 'An unexpected error occurred during login' },
      { status: 500 }
    )
  }
}