import sharp from 'sharp'
import { createPublicClient } from '@/lib/supabase'
import { palette } from '@/lib/palette'

export const runtime = 'nodejs'
export const revalidate = 86400

const WIDTH = 1200
const HEIGHT = 630
const PRODUCT_SIZE = 560

async function productImage(slug: string): Promise<Buffer | null> {
  const supabase = createPublicClient()
  const { data } = await supabase.from('products').select('images').eq('slug', slug).maybeSingle()
  const source = data?.images[0]
  if (!source) return null
  const response = await fetch(source)
  if (!response.ok) return null
  return sharp(Buffer.from(await response.arrayBuffer()))
    .resize(PRODUCT_SIZE, PRODUCT_SIZE, { fit: 'contain', background: palette.surface })
    .png()
    .toBuffer()
}

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const canvas = sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background: palette.surface },
  })

  // A missing or broken product photo still yields a valid blank share card.
  const image = await productImage(params.slug).catch(() => null)
  if (image) canvas.composite([{ input: image, gravity: 'center' }])

  const jpeg = await canvas.jpeg({ quality: 85 }).toBuffer()

  return new Response(new Uint8Array(jpeg), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
    },
  })
}
