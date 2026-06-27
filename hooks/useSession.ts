"use client"

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useSession(sessionTimeout: number = 3600000) { // 1 hour default
  const router = useRouter()

  const extendSession = useCallback(() => {
    // Update last activity timestamp
    localStorage.setItem('lastActivity', Date.now().toString())

    // Reset auto-logout timer
    const timer = localStorage.getItem('logoutTimer')
    if (timer) {
      clearTimeout(parseInt(timer))
    }

    const newTimer = setTimeout(() => {
      handleLogoutWithServerCheck()
    }, sessionTimeout)

    localStorage.setItem('logoutTimer', newTimer.toString())
  }, [sessionTimeout])

  const handleLogout = useCallback(() => {
    // Clear session data
    localStorage.removeItem('lastActivity')
    localStorage.removeItem('logoutTimer')

    // Clear cookies
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    // Redirect to login
    router.push('/auth/login')
  }, [router])

  const handleLogoutWithServerCheck = useCallback(async () => {
    try {
      // First check if the session is still valid on the server
      const response = await fetch('/api/debug-auth');
      const result = await response.json();

      if (result.authenticated) {
        // Server session is still valid, extend client-side session
        console.log('Server session still valid, extending client session');
        extendSession();
        return;
      }
    } catch (error) {
      console.error('Error checking server session:', error);
    }

    // If server session is invalid or check failed, proceed with logout
    console.log('Logging out due to invalid server session or failed check');
    handleLogout();
  }, [handleLogout, extendSession]);

  const checkSession = useCallback(() => {
    try {
      const lastActivity = localStorage.getItem('lastActivity')
      console.log('useSession: checkSession called, lastActivity:', lastActivity)

      if (!lastActivity) {
        console.log('useSession: No lastActivity found, extending session')
        extendSession()
        return
      }

      const timeSinceActivity = Date.now() - parseInt(lastActivity)
      console.log('useSession: Time since activity:', timeSinceActivity, 'timeout:', sessionTimeout)

      if (timeSinceActivity > sessionTimeout) {
        console.log('useSession: Session expired, checking server status')
        handleLogoutWithServerCheck()
      } else {
        console.log('useSession: Session valid, extending')
        extendSession()
      }
    } catch (error) {
      console.error('useSession: Error in checkSession:', error)
      // Don't logout on localStorage errors, just extend session
      extendSession()
    }
  }, [sessionTimeout, extendSession, handleLogoutWithServerCheck])

  useEffect(() => {
    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      extendSession()
    }

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Initial session check
    checkSession()

    // Set up periodic session check
    const interval = setInterval(checkSession, 60000) // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      clearInterval(interval)

      // Clear logout timer
      const timer = localStorage.getItem('logoutTimer')
      if (timer) {
        clearTimeout(parseInt(timer))
      }
    }
  }, [checkSession, extendSession])

  return {
    extendSession,
    handleLogout,
    handleLogoutWithServerCheck,
    checkSession
  }
}