import { NextResponse, type NextRequest } from 'next/server'
import { AuthService } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // List of public paths that don't require authentication
  const publicPaths = [
    '/',
    '/about',
    '/blog',
    '/contact',
    '/faq',
    '/gallery',
    '/terms',
    '/privacy',
    '/help',
    '/careers',
    '/research',
    '/join',
    '/auth/login',
    '/auth/register',
    '/auth/confirmation',
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/webhook',
    '/api/health',
    '/api/socket',
    '/api/ws',
    '/api/debug-auth',
    '/api/test-cookies',
    // Static assets
    '/_next/',
    '/api/trpc/',
  ]

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  )

  // Skip authentication for public paths
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Get tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value

  // Handle API routes that require authentication
  if (pathname.startsWith('/api/')) {
    // Special handling for admin and dashboard API routes
    if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/dashboard')) {
      let payload = null
      
      // First try to verify access token
      if (accessToken) {
        try {
          payload = await AuthService.verifyAccessToken(accessToken)
        } catch (error) {
          console.warn('Access token verification failed:', error)
        }
      }

      // If access token is invalid but we have a refresh token, try to refresh
      if (!payload && refreshToken) {
        try {
          const refreshPayload = await AuthService.verifyRefreshToken(refreshToken)
          
          if (refreshPayload && await AuthService.validateRefreshToken(refreshToken)) {
            const newAccessToken = await AuthService.generateAccessToken(refreshPayload)
            
            // Create response with new access token
            const response = NextResponse.next()
            response.cookies.set('accessToken', newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 15 * 60, // 15 minutes
              path: '/'
            })
            
            return response
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
        }
      }

      // If we still don't have a valid payload, return 401 for API routes
      if (!payload) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or expired token' }, 
          { status: 401 }
        )
      }

      // Verify user role for admin routes
      if (pathname.startsWith('/api/admin') && payload.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' }, 
          { status: 403 }
        )
      }
      
      return NextResponse.next()
    }
    
    // For other API routes, continue normally
    return NextResponse.next()
  }

  // Handle protected UI routes (dashboard, etc.)
  if (pathname.startsWith('/dashboard')) {
    let payload = null
    
    // First try to verify access token
    if (accessToken) {
      try {
        payload = await AuthService.verifyAccessToken(accessToken)
      } catch (error) {
        console.warn('Access token verification failed:', error)
      }
    }

    // If access token is invalid but we have a refresh token, try to refresh
    if (!payload && refreshToken) {
      try {
        const refreshPayload = await AuthService.verifyRefreshToken(refreshToken)
        
        if (refreshPayload && await AuthService.validateRefreshToken(refreshToken)) {
          const newAccessToken = await AuthService.generateAccessToken(refreshPayload)
          
          // Redirect to the same page but set the new access token
          const response = NextResponse.redirect(request.nextUrl)
          response.cookies.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60, // 15 minutes
            path: '/'
          })
          
          return response
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
      }
    }

    // If we don't have a valid token, redirect to login
    if (!payload) {
      const response = NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodeURIComponent(request.url)}`, request.url)
      )
      return response
    }

    // Handle role-based routing for dashboard
    if (pathname === '/dashboard' && payload.role) {
      let redirectPath = ''
      switch (payload.role) {
        case UserRole.ADMIN:
          redirectPath = '/dashboard/admin'
          break
        case UserRole.VOLUNTEER:
          redirectPath = '/dashboard/volunteer'
          break
        case UserRole.SPONSOR:
          redirectPath = '/dashboard/sponsor'
          break
        default:
          redirectPath = '/auth/login'
      }
      
      if (redirectPath) {
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }

    // Role guard for specific dashboard sections
    if (
      pathname.startsWith('/dashboard/admin') && 
      payload.role !== UserRole.ADMIN
    ) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    if (
      pathname.startsWith('/dashboard/volunteer') &&
      payload.role !== UserRole.VOLUNTEER &&
      payload.role !== UserRole.ADMIN
    ) {
      return NextResponse.redirect(new URL('/dashboard/sponsor', request.url))
    }

    if (
      pathname.startsWith('/dashboard/sponsor') &&
      payload.role !== UserRole.SPONSOR &&
      payload.role !== UserRole.ADMIN
    ) {
      return NextResponse.redirect(new URL('/dashboard/volunteer', request.url))
    }

    return NextResponse.next()
  }

  // For all other protected routes, just continue
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
