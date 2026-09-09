import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase-public'
import { SITE } from '@/lib/site'
import type { Product } from '@/lib/types'
import ProductScreen from './ProductScreen'

export const revalidate = 3600

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return (data as Product) ?? null
}

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase.from('products').select('slug').eq('is_published', true)
  return (data ?? []).map(row => ({ slug: row.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await getProduct(params.slug)
  if (!product) return { title: 'Product not found', robots: { index: false, follow: false } }

  const description = (product.description ?? SITE.tagline).slice(0, 160)
  const url = `/product/${params.slug}`
  const ogImage = {
    url: `/product/${params.slug}/og-image`,
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: product.name,
  }

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description,
      url,
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [ogImage],
    },
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug)
  if (!product) notFound()
  return <ProductScreen initialProduct={product} />
}
