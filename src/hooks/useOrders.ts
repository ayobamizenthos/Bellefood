import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import type { Order, OrderStatusLog } from '@/lib/types'

export function useOrders() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    load()
    const channel = supabase
      .channel(`orders-list:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        load
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, load])

  return { orders, loading }
}

export function useOrder(orderId: string | undefined) {
  const { session } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [log, setLog] = useState<OrderStatusLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!orderId) return
    const [orderRes, logRes] = await Promise.all([
      supabase.from('orders').select('*').eq('id', orderId).single(),
      supabase.from('order_status_log').select('*').eq('order_id', orderId).order('created_at'),
    ])
    setOrder(orderRes.data)
    setLog(logRes.data ?? [])
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    load()
    if (!orderId || !session) return

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        payload => setOrder(payload.new as Order)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_status_log',
          filter: `order_id=eq.${orderId}`,
        },
        payload => setLog(prev => [...prev, payload.new as OrderStatusLog])
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, session, load])

  const confirmReceipt = useCallback(async () => {
    if (!orderId) return
    await supabase.from('orders').update({ receipt_confirmed: true }).eq('id', orderId)
    setOrder(prev => (prev ? { ...prev, receipt_confirmed: true } : prev))
  }, [orderId])

  return { order, log, loading, confirmReceipt, reload: load }
}
