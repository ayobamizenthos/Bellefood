// Every value here is public by design. The fallbacks keep the live Netlify build, which has no
// environment variables yet, pointing at the production project; set NEXT_PUBLIC_* to override.
const PRODUCTION = {
  supabaseUrl: 'https://wpanjjgxrbyrieirutpl.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYW5qamd4cmJ5cmllaXJ1dHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDE4MDIsImV4cCI6MjEwMzQxNzgwMn0.P-OqtTxhjA61Iat0NaQj50hVYX9h2gERfwmrL57bU1A',
  paystackPublicKey: 'pk_test_ab8eecf2a87da448ad9f051fce756ac5d53812b5',
  vapidPublicKey:
    'BJ0gSPvFQYkKiQaHlcD6TXO0wHsqMzkhAB0-S6Sr-LYuUe3MmDr9M-ZKQQK1PCwi7jU9vV5eS4l1XtnWgx9Pzrw',
  cloudinaryCloudName: 'nmmsdyna',
  cloudinaryUploadPreset: 'bellefood_unsigned',
} as const

export interface PublicConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  paystackPublicKey: string
  vapidPublicKey: string
  cloudinaryCloudName: string
  cloudinaryUploadPreset: string
}

const pick = (value: string | undefined, fallback: string): string => value?.trim() || fallback

// Next inlines NEXT_PUBLIC_* only when each variable is read by its literal name.
export const config: PublicConfig = {
  supabaseUrl: pick(process.env.NEXT_PUBLIC_SUPABASE_URL, PRODUCTION.supabaseUrl),
  supabaseAnonKey: pick(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, PRODUCTION.supabaseAnonKey),
  paystackPublicKey: pick(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, PRODUCTION.paystackPublicKey),
  vapidPublicKey: pick(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, PRODUCTION.vapidPublicKey),
  cloudinaryCloudName: pick(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    PRODUCTION.cloudinaryCloudName
  ),
  cloudinaryUploadPreset: pick(
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    PRODUCTION.cloudinaryUploadPreset
  ),
}
