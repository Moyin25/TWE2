import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

// Disable static generation for this route since it uses cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get tokens from cookies
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    console.log('Debug auth - received tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length
    });

    let accessTokenValid = false;
    let accessTokenPayload = null;
    let refreshTokenValid = false;

    if (accessToken) {
      try {
        accessTokenPayload = await AuthService.verifyAccessToken(accessToken);
        accessTokenValid = !!accessTokenPayload;
      } catch (err) {
        console.error('Access token verification failed:', err);
      }
    }

    if (refreshToken) {
      try {
        refreshTokenValid = await AuthService.validateRefreshToken(refreshToken);
      } catch (err) {
        console.error('Refresh token validation failed:', err);
      }
    }

    const response = NextResponse.json({
      authenticated: accessTokenValid,
      tokens: {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenValid,
        refreshTokenValid
      },
      payload: accessTokenPayload
    });

    // Using a less aggressive cache policy to avoid triggering logout
    response.headers.set('Cache-Control', 'private, no-cache');

    return response;
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}