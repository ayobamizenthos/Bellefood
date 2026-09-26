# Belle Food

A restaurant and supermarket in one installable web app for Lagos. Customers order meals from the
kitchen and groceries from the Mart for delivery or pickup, pay by Paystack or bank transfer, and
earn points they can spend on food and delivery. Staff run products, categories, orders, customers
and settings from the admin panel, with sound and push alerts for new orders.

## Stack

- Next.js 14 (App Router), React 18, TypeScript in strict mode
- Tailwind CSS, zustand for client state
- Supabase: Postgres with row level security, auth, storage, realtime and edge functions (Deno)
- Paystack (test mode) for card payments, Cloudinary for product photos
- Serwist service worker for offline shell and web push
- Vitest for unit tests

## Local setup

Requires Node 20 or later.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm start`.

## Environment variables

All app variables are public (`NEXT_PUBLIC_*`) and listed in `.env.example`. `src/lib/config.ts`
reads them and falls back to the production values, so a build without them still points at the
live project. Set them on every environment so the fallbacks are never relied on.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push public key, the pair of `VAPID_PRIVATE_KEY` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud for product photos |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset used by the admin |

## Database migrations

Migrations live in `supabase/migrations` and apply in filename order. Never edit a migration that
has been applied; add a new numbered file instead.

| File | Change |
| --- | --- |
| `0001_initial_schema.sql` | Tables, policies and triggers |
| `0002_admin_receipt_alert.sql` | Alert admins when a customer confirms receipt |
| `0003_loyalty_and_security.sql` | Points, referrals, column guards, `place_order` |
| `0004_push_queue.sql` | Notifications become a push queue |
| `0005_checkout_and_privileges.sql` | Checkout fixes and revoked function grants |
| `0006_cancelled_status.sql` | `cancelled` order and notification values |
| `0007_signup_and_referrals.sql` | No email-based admin, welcome bonus, `username_available`, `referral_count` |
| `0008_product_costs.sql` | Admin-only `product_costs`, drops `products.cost` |
| `0009_push_claims.sql` | `claim_push_batch` so overlapping senders never double send |
| `0010_checkout_rules.sql` | Points-only orders settle at checkout, Lagos order numbers, address zone ids |
| `0011_order_cancellation.sql` | `cancel_order` with points refund |
| `0012_order_status_messages.sql` | Pickup wording, single alert on payment, cancellation alert |

Apply with the Supabase CLI (`supabase link` then `supabase db push`) or paste each file into the
SQL editor in order. `supabase/seed.sql` loads the catalogue into an empty project.

Admin access is granted by hand: `update profiles set is_admin = true where id = '<user id>';`

## Edge functions and secrets

| Function | JWT | Role |
| --- | --- | --- |
| `paystack-verify` | required | Called by checkout after the Paystack popup succeeds |
| `paystack-webhook` | off | Receives signed Paystack events and settles pending orders |
| `send-push` | required | Drains the notification queue to subscribed devices |

Deploy with `supabase functions deploy <name>`. Secrets (`supabase secrets set NAME=value`):

- `PAYSTACK_SECRET_KEY` for both Paystack functions
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional `VAPID_SUBJECT` for `send-push`

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase.

## Paystack webhook

In the Paystack dashboard, under Settings, API Keys and Webhooks, set the webhook URL to:

```
https://<project-ref>.supabase.co/functions/v1/paystack-webhook
```

Paystack signs each event with the secret key; the function rejects anything whose
`x-paystack-signature` does not match. Use the test secret with the test webhook URL and the live
secret with the live one.

## Deploy

Netlify builds the site with `npm run build` using `@netlify/plugin-nextjs` (see `netlify.toml`).
Set the environment variables above in the Netlify site settings. Database changes and edge
functions are deployed separately through Supabase.

## Testing

`npm test` runs the Vitest unit tests in `src/**/*.test.ts`; none of them touch a database. GitHub
Actions (`.github/workflows/ci.yml`) runs lint, typecheck, tests and a production build on every
push to `main` and every pull request.
