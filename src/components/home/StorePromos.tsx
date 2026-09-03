import { Link } from '@/lib/router'
import { Clock, Truck, ShoppingBag, ChefHat } from 'lucide-react'

export function StorePromos() {
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-pop sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col items-start gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <Clock size={24} />
          </span>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Open 24/7. We never close.</h2>
          <p className="max-w-md text-body text-white/90">
            Hot Nigerian meals and everyday groceries, any hour of the day. Delivered fast across
            Lagos or ready for pickup.
          </p>
          <Link
            to="/shop?store=restaurant"
            className="mt-1 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-brand transition-transform active:scale-95"
          >
            <ChefHat size={18} /> Order Now
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl bg-ink px-5 py-5 text-white">
          <Truck size={26} />
          <div>
            <p className="font-bold">Fast Delivery</p>
            <p className="text-body opacity-90">Across Lekki, VI, Ikoyi &amp; mainland</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-5 shadow-card">
          <ShoppingBag size={26} className="text-brand" />
          <div>
            <p className="font-bold text-ink">Pickup Available</p>
            <p className="text-body text-ink-muted">Skip the fee, grab it at our store</p>
          </div>
        </div>
      </section>
    </>
  )
}
