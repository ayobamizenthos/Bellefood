import { config } from './config'

export async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', config.cloudinaryUploadPreset)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`,
    { method: 'POST', body: form }
  )
  if (!response.ok) throw new Error(`${file.name} could not be uploaded.`)

  const upload = (await response.json()) as { secure_url?: string }
  if (!upload.secure_url) throw new Error(`${file.name} could not be uploaded.`)
  return upload.secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
}
