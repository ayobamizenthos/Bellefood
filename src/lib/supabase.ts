import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { config } from './config'

export const supabase = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

/** A session-less client for server rendering, where no visitor is signed in. */
export function createPublicClient() {
  return createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false },
  })
}
