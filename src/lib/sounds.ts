let context: AudioContext | null = null
let master: GainNode | null = null

type AudioContextConstructor = typeof AudioContext

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Constructor: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
  if (!Constructor) return null
  if (!context) {
    context = new Constructor()
    master = context.createGain()
    master.gain.value = 1
    const limiter = context.createDynamicsCompressor()
    limiter.threshold.value = -8
    limiter.knee.value = 6
    limiter.ratio.value = 12
    limiter.attack.value = 0.003
    limiter.release.value = 0.18
    master.connect(limiter)
    limiter.connect(context.destination)
  }
  if (context.state === 'suspended') void context.resume()
  return context
}

interface Tone {
  freq: number
  at?: number
  dur: number
  gain?: number
  type?: OscillatorType
  /** Adds a second oscillator a few cents sharp to thicken the tone. */
  doubled?: boolean
}

const DOUBLING_CENTS = 7
const ATTACK_SECONDS = 0.008
const SILENT_GAIN = 0.0001

function play(tones: Tone[]) {
  const ac = audio()
  if (!ac || !master) return
  const now = ac.currentTime + 0.01

  for (const tone of tones) {
    const start = now + (tone.at ?? 0)
    const detunes = tone.doubled ? [0, DOUBLING_CENTS] : [0]
    const level = (tone.gain ?? 0.2) / detunes.length

    for (const cents of detunes) {
      const oscillator = ac.createOscillator()
      const amp = ac.createGain()
      oscillator.type = tone.type ?? 'triangle'
      oscillator.detune.value = cents
      oscillator.frequency.setValueAtTime(tone.freq, start)

      amp.gain.setValueAtTime(SILENT_GAIN, start)
      amp.gain.exponentialRampToValueAtTime(level, start + ATTACK_SECONDS)
      amp.gain.setValueAtTime(level, start + tone.dur * 0.55)
      amp.gain.exponentialRampToValueAtTime(SILENT_GAIN, start + tone.dur)

      oscillator.connect(amp)
      amp.connect(master)
      oscillator.start(start)
      oscillator.stop(start + tone.dur + 0.05)
    }
  }
}

function strike(at = 0, level = 0.13, decay = 0.09, bandHz = 2600) {
  const ac = audio()
  if (!ac || !master) return
  const start = ac.currentTime + 0.01 + at
  const frames = Math.floor(ac.sampleRate * decay)
  const buffer = ac.createBuffer(1, frames, ac.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let frame = 0; frame < frames; frame += 1) {
    samples[frame] = (Math.random() * 2 - 1) * Math.pow(1 - frame / frames, 3)
  }
  const source = ac.createBufferSource()
  source.buffer = buffer
  const band = ac.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = bandHz
  band.Q.value = 0.8
  const amp = ac.createGain()
  amp.gain.value = level
  source.connect(band)
  band.connect(amp)
  amp.connect(master)
  source.start(start)
}

const FEMALE_VOICE = /(zira|samantha|karen|moira|tessa|fiona|serena|hazel|susan|aria|jenny|libby|sonia|female|woman)/i

let preferredVoice: SpeechSynthesisVoice | null = null
let speechPrimed = false
let announcing = false

const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

function pickVoice(): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices()
  const english = all.filter(voice => /^en(-|_|$)/i.test(voice.lang))
  const pool = english.length > 0 ? english : all
  const local = pool.filter(voice => voice.localService)
  const candidates = local.length > 0 ? local : pool
  return candidates.find(voice => FEMALE_VOICE.test(voice.name)) ?? candidates[0] ?? null
}

// iOS only honours a chosen voice once the engine has spoken inside a real tap.
function primeSpeech() {
  if (speechPrimed || !speechSupported()) return
  try {
    const silence = new SpeechSynthesisUtterance(' ')
    silence.volume = 0
    window.speechSynthesis.speak(silence)
    speechPrimed = true
  } catch {
    speechPrimed = false
  }
}

/** Browsers keep audio muted until a user gesture, so the first tap of a session calls this. */
export function unlockAudio() {
  const ac = audio()
  if (ac && master) {
    const oscillator = ac.createOscillator()
    const amp = ac.createGain()
    amp.gain.value = SILENT_GAIN
    oscillator.connect(amp)
    amp.connect(master)
    oscillator.start()
    oscillator.stop(ac.currentTime + 0.01)
  }

  if (speechSupported()) {
    const settleVoice = () => {
      preferredVoice = pickVoice()
    }
    settleVoice()
    if (!preferredVoice) {
      window.speechSynthesis.addEventListener('voiceschanged', settleVoice, { once: true })
    }
  }
  primeSpeech()
}

function announce(words: string, delayMs: number) {
  if (!speechSupported()) return
  primeSpeech()
  if (announcing) window.speechSynthesis.cancel()

  window.setTimeout(() => {
    try {
      const line = new SpeechSynthesisUtterance(words)
      preferredVoice ??= pickVoice()
      if (preferredVoice) {
        // lang must be set first: assigning it after the voice detaches the voice on iOS
        line.lang = preferredVoice.lang
        line.voice = preferredVoice
      }
      line.rate = 0.92
      line.pitch = preferredVoice && FEMALE_VOICE.test(preferredVoice.name) ? 1 : 0.85
      line.volume = 1
      announcing = true
      line.onend = () => {
        announcing = false
      }
      line.onerror = () => {
        announcing = false
      }
      window.speechSynthesis.speak(line)
    } catch {
      announcing = false
    }
  }, delayMs)
}

const C5 = 523.25
const E5 = 659.25
const G5 = 783.99
const C6 = 1046.5
const E6 = 1318.51
const G6 = 1567.98

export function playAddToCart() {
  play([
    { freq: G5, dur: 0.08, gain: 0.16, doubled: true },
    { freq: C6, dur: 0.13, gain: 0.14, doubled: true, at: 0.07 },
  ])
  strike(0, 0.06, 0.04, 3000)
}

export function playOrderPlaced() {
  play([
    { freq: C5, dur: 0.12, gain: 0.28, doubled: true },
    { freq: E5, dur: 0.12, gain: 0.28, doubled: true, at: 0.07 },
    { freq: G5, dur: 0.14, gain: 0.28, doubled: true, at: 0.14 },
    { freq: C6, dur: 0.7, gain: 0.32, doubled: true, at: 0.22 },
    { freq: E6, dur: 0.7, gain: 0.18, at: 0.22 },
    { freq: G6, dur: 0.7, gain: 0.11, type: 'sine', at: 0.22 },
    { freq: C6 * 2, dur: 0.85, gain: 0.07, type: 'sine', at: 0.24 },
  ])
  strike(0, 0.09, 0.06, 3200)
  strike(0.22, 0.14, 0.14, 2400)
}

export function playNotification() {
  play([
    { freq: E5, dur: 0.09, gain: 0.16, doubled: true },
    { freq: G5, dur: 0.14, gain: 0.14, doubled: true, at: 0.08 },
  ])
  strike(0, 0.06, 0.04, 2800)
}

export function playCustomerAlert(words?: string) {
  play([
    { freq: G5, dur: 0.1, gain: 0.22, doubled: true },
    { freq: C6, dur: 0.16, gain: 0.2, doubled: true, at: 0.09 },
    { freq: E6, dur: 0.4, gain: 0.16, at: 0.18 },
  ])
  strike(0, 0.08, 0.05, 3000)
  if (words) announce(words, 400)
}

/** Loud enough to cross a busy kitchen, then spoken so staff know what arrived. */
export function playAdminAlert(words: string) {
  play([
    { freq: C5, dur: 0.13, gain: 0.3, doubled: true },
    { freq: E5, dur: 0.13, gain: 0.3, doubled: true, at: 0.08 },
    { freq: G5, dur: 0.15, gain: 0.3, doubled: true, at: 0.16 },
    { freq: C6, dur: 0.75, gain: 0.34, doubled: true, at: 0.25 },
    { freq: E6, dur: 0.75, gain: 0.2, at: 0.25 },
    { freq: G6, dur: 0.75, gain: 0.13, type: 'sine', at: 0.25 },
    { freq: C5, dur: 0.8, gain: 0.16, type: 'sine', at: 0.25 },
    { freq: C6 * 2, dur: 0.95, gain: 0.075, type: 'sine', at: 0.27 },
  ])
  strike(0, 0.1, 0.07, 3200)
  strike(0.25, 0.15, 0.15, 2400)
  announce(words, 460)
}
