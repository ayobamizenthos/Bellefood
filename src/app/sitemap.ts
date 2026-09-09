import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'
import { createPublicClient } from '@/lib/supabase-public'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE.url}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE.url}/shop?store=supermarket`, changeFrequency: 'daily', priority: 0.9 },
  ]

  try {
    const supabase = createPublicClient()
    const { data } = await supabase.from('products').select('slug').eq('is_published', true)

    const productRoutes: MetadataRoute.Sitemap = (data ?? []).map(product => ({
      url: `${SITE.url}/product/${product.slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    return [...staticRoutes, ...productRoutes]
  } catch {
    return staticRoutes
  }
}
