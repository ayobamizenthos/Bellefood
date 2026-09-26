'use client'

import { useState } from 'react'
import { Check, Copy, Gift, Share2, Users } from 'lucide-react'
import { useLoyalty } from '@/hooks/useLoyalty'
import { SITE } from '@/lib/site'
import { formatNaira } from '@/lib/format'
import { copyToClipboard } from '@/lib/text'
import { Button } from '@/components/ui/Button'

const COPIED_FEEDBACK_MS = 1500
const RECENT_ACTIVITY = 6
const SHARE_MESSAGE = 'Order great food on Belle Food and we both earn rewards. Sign up with my link:'

export function RewardsCard() {
  const { points, username, referralCount, settings, ledger, nairaValue, loading, claimUsername } =
    useLoyalty()
  const [claim, setClaim] = useState('')
  const [claimError, setClaimError] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [copied, setCopied] = useState(false)

  if (loading) return <div className="h-40 animate-pulse rounded-3xl bg-line/50" />

  const referralLink = username ? `${SITE.url}/signup?ref=${username}` : ''

  const submitClaim = async () => {
    setClaimError('')
    setClaiming(true)
    const error = await claimUsername(claim)
    setClaiming(false)
    if (error) setClaimError(error)
    else setClaim('')
  }

  const copyLink = async () => {
    if (!referralLink || !(await copyToClipboard(referralLink))) return
    setCopied(true)
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
  }

  const shareLink = async () => {
    if (!referralLink) return
    if (typeof navigator.share === 'function') {
      const shared = await navigator
        .share({ title: 'Belle Food', text: SHARE_MESSAGE, url: referralLink })
        .then(() => true)
        .catch(() => false)
      if (shared) return
    }
    await copyLink()
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-5 text-white shadow-pop">
        <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-2 text-white/80">
          <Gift size={16} />
          <span className="text-[12px] font-semibold uppercase tracking-[0.16em]">Belle Rewards</span>
        </div>
        <p className="relative mt-3 text-4xl font-bold leading-none">{points.toLocaleString()}</p>
        <p className="relative mt-1 text-sm text-white/80">
          points · worth {formatNaira(nairaValue)} off food &amp; delivery
        </p>
        <div className="relative mt-4 rounded-xl bg-white/10 px-3 py-2 text-[13px] backdrop-blur">
          Earn {settings.earn_per_order} points per order and {settings.earn_per_referral} when a
          friend you invite orders.
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-brand" />
          <h3 className="font-bold">Invite &amp; earn</h3>
          <span className="ml-auto text-label text-ink-muted">{referralCount} joined</span>
        </div>

        {username ? (
          <>
            <p className="mt-2 text-body text-ink-muted">Share your personal link:</p>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-brand-tint/40 pl-3">
              <span className="min-w-0 flex-1 truncate text-body font-medium">
                {SITE.url.replace(/^https?:\/\//, '')}/signup?ref={username}
              </span>
              <button
                type="button"
                onClick={copyLink}
                className="grid h-11 w-11 shrink-0 place-items-center text-brand"
                aria-label={copied ? 'Link copied' : 'Copy link'}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <Button onClick={shareLink} fullWidth className="mt-3">
              <Share2 size={16} /> Share my link
            </Button>
          </>
        ) : (
          <>
            <p className="mt-2 text-body text-ink-muted">
              Claim a username to unlock your referral link. This is permanent, so choose well.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={claim}
                onChange={event => setClaim(event.target.value.toLowerCase())}
                placeholder="yourname"
                aria-label="Username"
                maxLength={20}
                className="input flex-1"
              />
              <Button loading={claiming} onClick={submitClaim} disabled={claim.length < 3}>
                Claim
              </Button>
            </div>
            {claimError && <p className="mt-2 text-label text-danger">{claimError}</p>}
          </>
        )}
      </div>

      {ledger.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-4">
          <h3 className="mb-2 font-bold">Points activity</h3>
          <ul className="flex flex-col gap-1.5">
            {ledger.slice(0, RECENT_ACTIVITY).map(entry => (
              <li key={entry.id} className="flex items-center justify-between text-body">
                <span className="capitalize text-ink-muted">{entry.reason.replace(/_/g, ' ')}</span>
                <span className={entry.delta > 0 ? 'font-semibold text-success' : 'font-semibold text-ink'}>
                  {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
