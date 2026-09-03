let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!context) context = new Ctor()
  if (context.state === 'suspended') void context.resume()
  return context
}

interface Tone {
  from: number
  to: number
  duration: number
  type?: OscillatorType
  gain?: number
  at?: number
}

function play(tones: Tone[]) {
  const ac = getContext()
  if (!ac) return
  const now = ac.currentTime
  for (const tone of tones) {
    const start = now + (tone.at ?? 0)
    const osc = ac.createOscillator()
    const amp = ac.createGain()
    osc.type = tone.type ?? 'sine'
    osc.frequency.setValueAtTime(tone.from, start)
    osc.frequency.exponentialRampToValueAtTime(tone.to, start + tone.duration)
    amp.gain.setValueAtTime(0.0001, start)
    amp.gain.exponentialRampToValueAtTime(tone.gain ?? 0.12, start + 0.012)
    amp.gain.exponentialRampToValueAtTime(0.0001, start + tone.duration)
    osc.connect(amp)
    amp.connect(ac.destination)
    osc.start(start)
    osc.stop(start + tone.duration + 0.03)
  }
}

export function playAddToCart() {
  play([
    { from: 660, to: 880, duration: 0.11, gain: 0.11 },
    { from: 880, to: 1320, duration: 0.09, gain: 0.07, at: 0.06 },
  ])
}

export function playOrderPlaced() {
  play([
    { from: 523.25, to: 784, duration: 0.12, type: 'triangle', gain: 0.14 },
    { from: 784, to: 1046.5, duration: 0.14, type: 'triangle', gain: 0.12, at: 0.1 },
    { from: 1046.5, to: 1318.5, duration: 0.18, gain: 0.09, at: 0.22 },
  ])
}

function strikeBell(startOffset: number, fundamental: number, gain: number) {
  const ac = getContext()
  if (!ac) return
  const start = ac.currentTime + startOffset
  const partials = [1, 2.01, 2.42, 3.03, 4.5]
  const partialGains = [1, 0.55, 0.4, 0.28, 0.16]
  partials.forEach((ratio, i) => {
    const osc = ac.createOscillator()
    const amp = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = fundamental * ratio
    amp.gain.setValueAtTime(0.0001, start)
    amp.gain.linearRampToValueAtTime(gain * partialGains[i], start + 0.004)
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 1.1)
    osc.connect(amp)
    amp.connect(ac.destination)
    osc.start(start)
    osc.stop(start + 1.15)
  })
}

export function playNotification() {
  strikeBell(0, 880, 0.55)
  strikeBell(0.22, 1174.66, 0.5)
  strikeBell(0.6, 880, 0.55)
  strikeBell(0.82, 1174.66, 0.5)
}
