import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      )
    }

    const payload = await AuthService.verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Validate refresh token in database
    const isValid = await AuthService.validateRefreshToken(refreshToken);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Token expired or invalid' },
        { status: 401 }
      );
    }

    const newPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    const newAccessToken = await AuthService.generateAccessToken(newPayload);

    const response = NextResponse.json({
      message: 'Token refreshed successfully',
      token: newAccessToken, // Include the new token in the response for client-side updates
    })

    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Token refresh failed' },
      { status: 401 }
    )
  }
}