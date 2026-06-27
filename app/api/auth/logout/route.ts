import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (refreshToken) {
      await AuthService.removeRefreshToken(refreshToken)
    }

    const response = NextResponse.json({
      message: 'Logout successful',
    })

    // Clear all authentication-related cookies
    response.cookies.delete('accessToken')
    response.cookies.delete('refreshToken')
    
    // Also clear any potential role or user state cookies
    response.cookies.delete('userRole')
    response.cookies.delete('user')

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    )
  }
}