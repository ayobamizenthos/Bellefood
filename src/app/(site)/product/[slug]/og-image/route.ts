import sharp from 'sharp'
import type { Sharp } from 'sharp'
import { createPublicClient } from '@/lib/supabase-public'

export const runtime = 'nodejs'
export const revalidate = 86400

const WIDTH = 1200
const HEIGHT = 630

async function compositeProductImage(canvas: Sharp, slug: string): Promise<void> {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase.from('products').select('images').eq('slug', slug).single()
    const source = (data?.images as string[] | null)?.[0]
    if (!source) return
    const response = await fetch(source)
    const input = Buffer.from(await response.arrayBuffer())
    const image = await sharp(input)
      .resize(560, 560, { fit: 'contain', background: '#ffffff' })
      .png()
      .toBuffer()
    canvas.composite([{ input: image, gravity: 'center' }])
  } catch {
    return
  }
}

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const canvas = sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#ffffff' },
  })

  await compositeProductImage(canvas, params.slug)

  const jpeg = await canvas.jpeg({ quality: 85 }).toBuffer()

  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
    },
  })
}
