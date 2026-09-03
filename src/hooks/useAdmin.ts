import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order, Product, Profile } from '@/lib/types'
import type { OrderStatus, PaymentStatus } from '@/lib/constants'

export function useAdminOrders(statusFilter?: OrderStatus | 'all') {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    let request = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (statusFilter && statusFilter !== 'all') request = request.eq('status', statusFilter)
    const { data } = await request
    setOrders(data ?? [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { orders, loading, reload: load }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return supabase.from('orders').update({ status }).eq('id', orderId)
}

export async function updatePaymentStatus(orderId: string, payment_status: PaymentStatus) {
  const patch: { payment_status: PaymentStatus; status?: OrderStatus } = { payment_status }
  if (payment_status === 'verified') patch.status = 'processing'
  return supabase.from('orders').update(patch).eq('id', orderId)
}

export function useAdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { products, loading, reload: load }
}

export function useAdminCustomers() {
  const [customers, setCustomers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('is_admin', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCustomers(data ?? [])
        setLoading(false)
      })
  }, [])

  return { customers, loading }
}
