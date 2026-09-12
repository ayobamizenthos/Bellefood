// Belle Food audio.
//
// These play in a kitchen with extraction fans running and on a phone in a
// customer's pocket, so they are built to carry: a musical figure over a short
// noise transient, through a limiter so they can be loud without rasping.
// Everything is synthesised - nothing to download on a slow connection, and it
// fires the instant an order lands.
//
// An admin alert also speaks, because a sound alone does not tell a busy
// kitchen what arrived.

let ctx: AudioContext | null = null
let master: GainNode | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) {
    ctx = new Ctor()
    master = ctx.createGain()
    master.gain.value = 1
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -8
    limiter.knee.value = 6
    limiter.ratio.value = 12
    limiter.attack.value = 0.003
    limiter.release.value = 0.18
    master.connect(limiter)
    limiter.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface Voice {
  freq: number
  to?: number
  at?: number
  dur: number
  gain?: number
  type?: OscillatorType
  /** A second oscillator a touch sharp, which thickens a thin tone. */
  fat?: boolean
}

function play(voices: Voice[]) {
  const ac = audio()
  if (!ac || !master) return
  const now = ac.currentTime + 0.01

  for (const v of voices) {
    const start = now + (v.at ?? 0)
    const peak = v.gain ?? 0.2
    const detunes = v.fat ? [0, 7] : [0]

    for (const cents of detunes) {
      const osc = ac.createOscillator()
      const amp = ac.createGain()
      osc.type = v.type ?? 'triangle'
      osc.detune.value = cents
      osc.frequency.setValueAtTime(v.freq, start)
      if (v.to && v.to !== v.freq) osc.frequency.exponentialRampToValueAtTime(v.to, start + v.dur)

      const level = peak / detunes.length
      amp.gain.setValueAtTime(0.0001, start)
      amp.gain.exponentialRampToValueAtTime(level, start + 0.008)
      amp.gain.setValueAtTime(level, start + v.dur * 0.55)
      amp.gain.exponentialRampToValueAtTime(0.0001, start + v.dur)

      osc.connect(amp)
      amp.connect(master)
      osc.start(start)
      osc.stop(start + v.dur + 0.05)
    }
  }
}

/** A filtered noise burst: the transient that makes a cue sound real rather
 *  than like a test tone. */
function strike(at = 0, level = 0.13, decay = 0.09, colour = 2600) {
  const ac = audio()
  if (!ac || !master) return
  const start = ac.currentTime + 0.01 + at
  const frames = Math.floor(ac.sampleRate * decay)
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / frames, 3)
  }
  const source = ac.createBufferSource()
  source.buffer = buffer
  const band = ac.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = colour
  band.Q.value = 0.8
  const amp = ac.createGain()
  amp.gain.value = level
  source.connect(band)
  band.connect(amp)
  amp.connect(master)
  source.start(start)
}

// ---------------------------------------------------------------- voice ----
// The chime carries across the kitchen; the words say what landed. iOS only
// honours a chosen voice on an utterance whose engine was primed inside a real
// tap, so the first interaction of the session primes it with silence.

let preferred: SpeechSynthesisVoice | null = null
let speechPrimed = false
let announcing = false

const FEMALE = /(zira|samantha|karen|moira|tessa|fiona|serena|hazel|susan|aria|jenny|libby|sonia|female|woman)/i
const VOICE_CHOICE = 'bf.voice'

export function availableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  const all = window.speechSynthesis.getVoices()
  const english = all.filter(v => /^en(-|_|$)/i.test(v.lang))
  const pool = english.length > 0 ? english : all
  const local = pool.filter(v => v.localService)
  const candidates = local.length > 0 ? local : pool
  return [...candidates].sort((a, b) => (FEMALE.test(b.name) ? 1 : 0) - (FEMALE.test(a.name) ? 1 : 0))
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = availableVoices()
  if (voices.length === 0) return null
  let saved: string | null = null
  try { saved = localStorage.getItem(VOICE_CHOICE) } catch {}
  return voices.find(v => v.name === saved) ?? voices[0]
}

export function setVoice(name: string) {
  try { localStorage.setItem(VOICE_CHOICE, name) } catch {}
  preferred = availableVoices().find(v => v.name === name) ?? preferred
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    announcing = false
  }
}

export const currentVoice = () => {
  if (!preferred) preferred = pickVoice()
  return preferred
}

function unlockSpeech() {
  if (speechPrimed) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const silent = new SpeechSynthesisUtterance(' ')
    silent.volume = 0
    window.speechSynthesis.speak(silent)
    speechPrimed = true
  } catch {
    // no engine here; the chime carries the meaning on its own
  }
}

/** Browsers keep audio muted until a gesture. Call once on first tap. */
export function unlockAudio() {
  const ac = audio()
  if (ac && master) {
    const osc = ac.createOscillator()
    const amp = ac.createGain()
    amp.gain.value = 0.0001
    osc.connect(amp)
    amp.connect(master)
    osc.start()
    osc.stop(ac.currentTime + 0.01)
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const settle = () => { preferred = pickVoice() }
    settle()
    if (!preferred) {
      window.speechSynthesis.addEventListener('voiceschanged', settle, { once: true })
      window.setTimeout(settle, 1200)
    }
  }
  unlockSpeech()
}

function announce(words: string, delay = 0, rate = 0.92) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  unlockSpeech()
  if (announcing) window.speechSynthesis.cancel()

  window.setTimeout(() => {
    try {
      const line = new SpeechSynthesisUtterance(words)
      if (!preferred) preferred = pickVoice()
      if (preferred) {
        // lang first: assigning it after the voice detaches the voice on iOS
        line.lang = preferred.lang
        line.voice = preferred
      }
      line.rate = rate
      line.pitch = preferred && FEMALE.test(preferred.name) ? 1 : 0.85
      line.volume = 1
      announcing = true
      line.onend = () => { announcing = false }
      line.onerror = () => { announcing = false }
      window.speechSynthesis.speak(line)
    } catch {
      // no speech engine here - the chime already carried the meaning
    }
  }, delay)
}

/** Says a line now, in whatever voice is currently chosen. Used to audition. */
export function sayNow(words: string) {
  unlockSpeech()
  announce(words, 0)
}

const C5 = 523.25
const E5 = 659.25
const G5 = 783.99
const C6 = 1046.5
const E6 = 1318.51
const G6 = 1567.98

/** Added to the cart. Light, quick, not an event. */
export function playAddToCart() {
  play([
    { freq: G5, dur: 0.08, gain: 0.16, type: 'triangle', fat: true },
    { freq: C6, dur: 0.13, gain: 0.14, type: 'triangle', fat: true, at: 0.07 },
  ])
  strike(0, 0.06, 0.04, 3000)
}

/** The customer's order went through. A rising figure landing on a held chord -
 *  the moment they have been waiting for since checkout. */
export function playOrderPlaced() {
  play([
    { freq: C5, dur: 0.12, gain: 0.28, type: 'triangle', fat: true },
    { freq: E5, dur: 0.12, gain: 0.28, type: 'triangle', fat: true, at: 0.07 },
    { freq: G5, dur: 0.14, gain: 0.28, type: 'triangle', fat: true, at: 0.14 },
    { freq: C6, dur: 0.7, gain: 0.32, type: 'triangle', fat: true, at: 0.22 },
    { freq: E6, dur: 0.7, gain: 0.18, type: 'triangle', at: 0.22 },
    { freq: G6, dur: 0.7, gain: 0.11, type: 'sine', at: 0.22 },
    { freq: C6 * 2, dur: 0.85, gain: 0.07, type: 'sine', at: 0.24 },
  ])
  strike(0, 0.09, 0.06, 3200)
  strike(0.22, 0.14, 0.14, 2400)
}

/** A quiet in-app ping: something changed on a screen already being watched. */
export function playNotification() {
  play([
    { freq: E5, dur: 0.09, gain: 0.16, type: 'triangle', fat: true },
    { freq: G5, dur: 0.14, gain: 0.14, type: 'triangle', fat: true, at: 0.08 },
  ])
  strike(0, 0.06, 0.04, 2800)
}

/** The customer's order moved on. Warm, brief, and it says what happened. */
export function playCustomerAlert(words?: string) {
  play([
    { freq: G5, dur: 0.1, gain: 0.22, type: 'triangle', fat: true },
    { freq: C6, dur: 0.16, gain: 0.2, type: 'triangle', fat: true, at: 0.09 },
    { freq: E6, dur: 0.4, gain: 0.16, type: 'triangle', at: 0.18 },
  ])
  strike(0, 0.08, 0.05, 3000)
  if (words) announce(words, 400)
}

/**
 * A new order, heard from the other side of a kitchen. Three rising calls, a
 * held chord, then the words - because a sound alone does not tell anyone what
 * just landed.
 */
export function playAdminAlert(words = 'You have a new order') {
  play([
    { freq: C5, dur: 0.13, gain: 0.3, type: 'triangle', fat: true },
    { freq: E5, dur: 0.13, gain: 0.3, type: 'triangle', fat: true, at: 0.08 },
    { freq: G5, dur: 0.15, gain: 0.3, type: 'triangle', fat: true, at: 0.16 },

    { freq: C6, dur: 0.75, gain: 0.34, type: 'triangle', fat: true, at: 0.25 },
    { freq: E6, dur: 0.75, gain: 0.2, type: 'triangle', at: 0.25 },
    { freq: G6, dur: 0.75, gain: 0.13, type: 'sine', at: 0.25 },
    { freq: C5, dur: 0.8, gain: 0.16, type: 'sine', at: 0.25 },

    { freq: C6 * 2, dur: 0.95, gain: 0.075, type: 'sine', at: 0.27 },
  ])
  strike(0, 0.1, 0.07, 3200)
  strike(0.25, 0.15, 0.15, 2400)
  announce(words, 460)
}
