import { config } from './config'

const SCRIPT_SRC = 'https://js.paystack.co/v2/inline.js'

interface PaystackPopup {
  newTransaction: (options: {
    key: string
    email: string
    amount: number
    currency: string
    reference: string
    metadata?: Record<string, unknown>
    onSuccess: (transaction: { reference: string }) => void
    onCancel: () => void
  }) => void
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopup
  }
}

let scriptLoad: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve()
  if (scriptLoad) return scriptLoad
  scriptLoad = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      scriptLoad = null
      reject(new Error('Unable to load Paystack'))
    }
    document.head.appendChild(script)
  })
  return scriptLoad
}

export async function payWithPaystack(options: {
  email: string
  amountNaira: number
  reference: string
  orderId: string
}): Promise<{ reference: string } | null> {
  await loadScript()
  const Popup = window.PaystackPop
  if (!Popup) throw new Error('Unable to load Paystack')

  return new Promise(resolve => {
    new Popup().newTransaction({
      key: config.paystackPublicKey,
      email: options.email,
      amount: Math.round(options.amountNaira * 100),
      currency: 'NGN',
      reference: options.reference,
      metadata: { orderId: options.orderId },
      onSuccess: transaction => resolve({ reference: transaction.reference }),
      onCancel: () => resolve(null),
    })
  })
}
