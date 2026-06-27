import { NextRequest, NextResponse } from 'next/server';

// Disable static generation for this route since it uses cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    console.log('Test Cookies - received tokens:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length
    });

    const response = NextResponse.json({
      cookies: {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenPresent: !!accessToken,
        refreshTokenPresent: !!refreshToken
      }
    });

    // Don't set cache control that would trigger logout
    response.headers.set('Cache-Control', 'no-cache, private');

    return response;
  } catch (error) {
    console.error('Test cookies error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}