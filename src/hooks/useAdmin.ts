import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order, Product, Profile } from '@/lib/types'
import type { OrderStatus, PaymentStatus } from '@/lib/constants'

export type OrderFilter = OrderStatus | 'all'

const ORDERS_PAGE_SIZE = 30

// PostgREST filter syntax treats these as operators, so they cannot appear in a search term.
const sanitizeSearch = (term: string) => term.replace(/[,()*%\\]/g, ' ').trim()

const matchesFilter = (order: Order, filter: OrderFilter) => filter === 'all' || order.status === filter

export function useAdminOrders(filter: OrderFilter, search: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const loadedCount = useRef(0)
  const term = sanitizeSearch(search)

  const fetchPage = useCallback(
    async (offset: number) => {
      let request = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + ORDERS_PAGE_SIZE - 1)
      if (filter !== 'all') request = request.eq('status', filter)
      if (term) {
        request = request.or(
          `order_number.ilike.*${term}*,delivery_address->>fullName.ilike.*${term}*,delivery_address->>phone.ilike.*${term}*`
        )
      }
      const { data } = await request
      return data ?? []
    },
    [filter, term]
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchPage(0).then(page => {
      if (!active) return
      setOrders(page)
      loadedCount.current = page.length
      setHasMore(page.length === ORDERS_PAGE_SIZE)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [fetchPage])

  useEffect(() => {
    if (term) return
    const channel = supabase
      .channel(`admin-orders:${filter}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        if (payload.eventType === 'DELETE') {
          const removedId = (payload.old as Partial<Order>).id
          setOrders(previous => previous.filter(order => order.id !== removedId))
          return
        }
        const changed = payload.new as Order
        setOrders(previous => {
          const rest = previous.filter(order => order.id !== changed.id)
          if (!matchesFilter(changed, filter)) return rest
          if (payload.eventType === 'INSERT') return [changed, ...rest]
          return previous.some(order => order.id === changed.id)
            ? previous.map(order => (order.id === changed.id ? changed : order))
            : previous
        })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [filter, term])

  const loadMore = useCallback(async () => {
    const page = await fetchPage(loadedCount.current)
    loadedCount.current += page.length
    setHasMore(page.length === ORDERS_PAGE_SIZE)
    setOrders(previous => [
      ...previous,
      ...page.filter(order => !previous.some(existing => existing.id === order.id)),
    ])
  }, [fetchPage])

  return { orders, loading, hasMore, loadMore }
}

export interface DashboardStats {
  orderCount: number
  productCount: number
  customerCount: number
  paidOrders: Pick<Order, 'total' | 'created_at'>[]
  recentOrders: Order[]
}

const RECENT_ORDERS = 8

// PostgREST returns at most 1000 rows per request, so revenue is read page by page.
const PAGE_SIZE = 1000

async function fetchPaidOrders() {
  const rows: { total: number; created_at: string }[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('payment_status', 'verified')
      .neq('status', 'cancelled')
      .order('created_at')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    const fetchStats = async () => {
      const [orders, products, customers, paid, recent] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', false),
        fetchPaidOrders(),
        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(RECENT_ORDERS),
      ])
      if (!active) return
      setStats({
        orderCount: orders.count ?? 0,
        productCount: products.count ?? 0,
        customerCount: customers.count ?? 0,
        paidOrders: paid,
        recentOrders: recent.data ?? [],
      })
    }
    setFailed(false)
    fetchStats().catch(() => {
      if (active) setFailed(true)
    })
    return () => {
      active = false
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt(count => count + 1), [])
  return { stats, loading: stats === null && !failed, failed, retry }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  return supabase.from('orders').update({ status }).eq('id', orderId)
}

export async function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
  const patch: { payment_status: PaymentStatus; status?: OrderStatus } = {
    payment_status: paymentStatus,
  }
  if (paymentStatus === 'verified') patch.status = 'processing'
  return supabase.from('orders').update(patch).eq('id', orderId)
}

export async function cancelOrder(orderId: string, reason: string) {
  return supabase.rpc('cancel_order', { p_order: orderId, p_reason: reason.trim() || undefined })
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
    void load()
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
