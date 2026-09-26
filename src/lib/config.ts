export interface PublicConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  paystackPublicKey: string
  vapidPublicKey: string
  cloudinaryCloudName: string
  cloudinaryUploadPreset: string
}

const required = (name: string, value: string | undefined): string => {
  const trimmed = value?.trim()
  if (!trimmed) throw new Error(name + ' must be set')
  return trimmed
}

// Next inlines NEXT_PUBLIC_* only when each variable is read by its literal name.
export const config: PublicConfig = {
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  paystackPublicKey: required('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY', process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY),
  vapidPublicKey: required('NEXT_PUBLIC_VAPID_PUBLIC_KEY', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  cloudinaryCloudName: required('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
  cloudinaryUploadPreset: required(
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  ),
}
