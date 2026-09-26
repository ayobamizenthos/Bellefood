import ProductEditScreen from '../ProductEditScreen'

export default async function Page({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  return <ProductEditScreen productId={productId} />
}
