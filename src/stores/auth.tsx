'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

interface AuthContextValue {
  session: Session | null
  userId: string | undefined
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return data
}

// Drops cached responses that may hold this account's data, keeping the precached app shell.
async function clearCachedResponses() {
  if (typeof caches === 'undefined') return
  try {
    const names = await caches.keys()
    await Promise.all(names.filter(name => !name.includes('precache')).map(name => caches.delete(name)))
  } catch {
    // storage can be unavailable in private mode; signing out must still finish
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionResolved, setSessionResolved] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | undefined>()
  const userId = session?.user.id

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setSessionResolved(true)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setProfileUserId(undefined)
      return
    }
    let current = true
    fetchProfile(userId).then(loaded => {
      if (!current) return
      setProfile(loaded)
      setProfileUserId(userId)
    })
    return () => {
      current = false
    }
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    const loaded = await fetchProfile(userId)
    setProfile(loaded)
  }, [userId])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    await clearCachedResponses()
  }, [])

  const loading = !sessionResolved || (Boolean(userId) && profileUserId !== userId)

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      userId,
      profile,
      loading,
      isAdmin: profile?.is_admin ?? false,
      refreshProfile,
      signOut,
    }),
    [session, userId, profile, loading, refreshProfile, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
