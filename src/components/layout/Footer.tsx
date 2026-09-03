import Image from 'next/image'
import { Link } from '@/lib/router'
import { Mail, MessageCircle } from 'lucide-react'
import { useStoreSettings } from '@/hooks/useStoreSettings'
import { useSupportSheet } from '@/stores/support'
import { STORE } from '@/lib/constants'

const shopLinks = [
  { label: 'Restaurant Menu', to: '/shop?store=restaurant' },
  { label: 'Supermarket', to: '/shop?store=supermarket' },
  { label: 'Rice Dishes', to: '/shop?store=restaurant&category=rice' },
  { label: 'Provisions & Cereals', to: '/shop?store=supermarket&category=provisions' },
  { label: 'Drinks & Beverages', to: '/shop?store=supermarket&category=beverages' },
]

const toolLinks = [
  { label: 'My Orders', to: '/orders' },
  { label: 'Saved Items', to: '/account' },
  { label: 'My Account', to: '/account' },
  { label: 'Contact Us', to: '/account' },
]

export function Footer() {
  const { settings } = useStoreSettings()
  const showSupport = useSupportSheet(s => s.show)
  const whatsapp = settings?.whatsapp_number || STORE.whatsappNumber
  const email = settings?.support_email || STORE.supportEmail

  return (
    <footer className="mt-16 hidden md:block">
      <div className="relative overflow-hidden rounded-t-[2.5rem] bg-gradient-to-br from-[#3A1E0C] via-brand-dark to-[#4A2410] text-white">
        <div className="app-shell relative z-10 grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 pb-40 pt-20">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Image
                src="/bellefood-mark.png"
                alt="Belle Food"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
              <span className="flex flex-col leading-none">
                <span className="text-lg font-bold tracking-tight">Belle Food</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70">
                  Kitchen &amp; Mart
                </span>
              </span>
            </div>
            <p className="max-w-xs text-body leading-relaxed text-white/70">
              Fresh Nigerian meals and everyday groceries in Lagos, open 24/7. Order from our
              restaurant and supermarket for fast delivery or pickup. Good food, great memories.
            </p>
            <div className="flex gap-3">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-white hover:text-white"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href={`mailto:${email}`}
                aria-label="Email"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/25 text-white/80 transition-colors hover:border-white hover:text-white"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          <FooterColumn title="Shop">
            {shopLinks.map(link => (
              <Link key={link.label} to={link.to} className="footer-link">
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Tools">
            {toolLinks.map(link => (
              <Link key={link.label} to={link.to} className="footer-link">
                {link.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Contact">
            <button type="button" onClick={showSupport} className="footer-link text-left">
              Contact Support
            </button>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="footer-link"
            >
              WhatsApp
            </a>
            <a href={`mailto:${email}`} className="footer-link">
              {email}
            </a>
            <span className="text-body text-white/70">Lagos, Nigeria</span>
          </FooterColumn>
        </div>

        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-6 left-0 w-full select-none whitespace-nowrap text-center text-[6.5rem] font-bold leading-none tracking-tight text-white/[0.05] lg:text-[8.5rem]"
        >
          BELLE FOOD
        </span>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-body font-bold text-[#FFC89A]">{title}</h3>
      {children}
    </div>
  )
}
