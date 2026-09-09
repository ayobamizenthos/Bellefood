const CLOUD_NAME = 'nmmsdyna'
const UPLOAD_PRESET = 'bellefood_unsigned'

export async function uploadToCloudinary(file: File): Promise<string | null> {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!response.ok) return null

  const data = (await response.json()) as { secure_url?: string }
  if (!data.secure_url) return null
  return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
}
