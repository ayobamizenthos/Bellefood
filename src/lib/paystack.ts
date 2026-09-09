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

let loader: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve()
  if (loader) return loader
  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Paystack'))
    document.head.appendChild(script)
  })
  return loader
}

export async function payWithPaystack(options: {
  email: string
  amountNaira: number
  reference: string
  orderId: string
}): Promise<{ reference: string } | null> {
  const key =
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ??
    'pk_test_ab8eecf2a87da448ad9f051fce756ac5d53812b5'

  await loadScript()
  if (!window.PaystackPop) throw new Error('Unable to load Paystack')

  return new Promise(resolve => {
    const popup = new window.PaystackPop!()
    popup.newTransaction({
      key,
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
