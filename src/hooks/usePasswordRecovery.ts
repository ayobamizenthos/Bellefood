import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

let recoveryStarted = false

// Registered when the module loads so the event is caught even if the reset link is processed
// before the reset screen mounts.
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(event => {
    if (event === 'PASSWORD_RECOVERY') recoveryStarted = true
  })
}

/** True only once Supabase has signed the visitor in from a password reset link. */
export function usePasswordRecovery(): boolean {
  const [ready, setReady] = useState(recoveryStarted)

  useEffect(() => {
    if (recoveryStarted) {
      setReady(true)
      return
    }
    const { data } = supabase.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return ready
}
