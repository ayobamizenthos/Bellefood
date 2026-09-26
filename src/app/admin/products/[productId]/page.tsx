import ProductEditScreen from '../ProductEditScreen'

export default function Page({ params }: { params: { productId: string } }) {
  return <ProductEditScreen productId={params.productId} />
}
