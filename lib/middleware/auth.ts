import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '../auth'
import { UserRole } from '@prisma/client'

export function withAuth(handler: Function, requiredRoles?: UserRole[]) {
  return async (request: NextRequest, context?: any) => {
    try {
      const authHeader = request.headers.get('Authorization')
      const headerToken = authHeader?.replace('Bearer ', '')
      const cookieToken = request.cookies.get('accessToken')?.value
      const refreshToken = request.cookies.get('refreshToken')?.value
      const token = headerToken || cookieToken

      if (!token) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 })
      }

      let payload = await AuthService.verifyAccessToken(token)
      let newAccessToken: string | null = null

      // If access token is invalid but refresh token exists, try to refresh
      if (!payload && refreshToken) {
        try {
          const refreshPayload = await AuthService.verifyRefreshToken(refreshToken)
          if (refreshPayload) {
            // Generate new access token
            newAccessToken = await AuthService.generateAccessToken(refreshPayload)
            payload = refreshPayload
          }
        } catch (err) {
          console.warn('🔁 Token refresh failed:', err)
        }
      }

      // Still no valid payload, reject the request
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      if (requiredRoles && !requiredRoles.includes(payload.role)) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      // Add user info to request
      const enhancedRequest = request as NextRequest & { user: typeof payload }
      enhancedRequest.user = payload

      // Call handler and get response
      const response = await handler(enhancedRequest, context)

      // If we have a new access token and the response is a NextResponse, set it in cookies
      if (newAccessToken && response instanceof NextResponse) {
        response.cookies.set('accessToken', newAccessToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 15 * 60 // 15 minutes
        })
      }

      return response
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
  }
}