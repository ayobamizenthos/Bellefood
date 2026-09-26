import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'
import type { Order, OrderStatusLog } from '@/lib/types'

/** The signed-in person's own orders, even when that person is an admin who can read every order. */
export function useOrders() {
  const { userId } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setOrders([])
      setLoading(false)
      return
    }
    void load()
    const channel = supabase
      .channel(`orders-list:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        () => void load()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, load])

  return { orders, loading }
}

export function useOrder(orderId: string) {
  const { userId } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [log, setLog] = useState<OrderStatusLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [orderResult, logResult] = await Promise.all([
      supabase.from('orders').select('*').eq('id', orderId).maybeSingle(),
      supabase.from('order_status_log').select('*').eq('order_id', orderId).order('created_at'),
    ])
    setOrder(orderResult.data)
    setLog(logResult.data ?? [])
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    if (!userId) return
    void load()

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
        payload => {
          const entry = payload.new as OrderStatusLog
          setLog(previous =>
            previous.some(existing => existing.id === entry.id) ? previous : [...previous, entry]
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, userId, load])

  const confirmReceipt = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .update({ receipt_confirmed: true, status: 'completed' })
      .eq('id', orderId)
      .select('*')
      .maybeSingle()
    if (error) return false
    if (data) setOrder(data)
    return data?.status === 'completed'
  }, [orderId])

  return { order, log, loading, confirmReceipt, reload: load }
}
