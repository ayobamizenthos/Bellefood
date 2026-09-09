import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const DEFAULT_URL = 'https://wpanjjgxrbyrieirutpl.supabase.co'
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYW5qamd4cmJ5cmllaXJ1dHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDE4MDIsImV4cCI6MjEwMzQxNzgwMn0.P-OqtTxhjA61Iat0NaQj50hVYX9h2gERfwmrL57bU1A'

function resolveUrl(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_URL
  const trimmed = value.trim().replace(/\/+$/, '')
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? trimmed : DEFAULT_URL
  } catch {
    return DEFAULT_URL
  }
}

function resolveKey(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_ANON_KEY
  const trimmed = value.trim()
  return trimmed.startsWith('ey') && trimmed.length > 40 ? trimmed : DEFAULT_ANON_KEY
}

const url = resolveUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const anonKey = resolveKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
