import fs from 'fs'
import { execSync } from 'child_process'
const DIR = 'C:/Users/hercu/AppData/Local/Temp/claude/c--Users-hercu-OneDrive-Desktop-Zenthos-Energies/7654a02e-ecd2-4057-94ce-826500849550/scratchpad/bfreal'
const sh = c => { try { return execSync(c, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: 'bash', maxBuffer: 1 << 26 }) } catch { return '' } }

const accepts = [
  { slug: 'peaksachet', name: 'Peak Milk Sachet', q: 'peak milk powder sachet', must: 'sachet' },
  { slug: 'eggs15', name: 'Half Crate Eggs (15)', q: 'crate eggs', must: 'x15' },
  { slug: 'turkey', name: 'Turkey 1kg', q: 'turkey wings', must: 'turkey wings' },
  { slug: 'foil', name: 'Foil Paper', q: 'aluminium foil', must: 'foil' },
  { slug: 'refuse', name: 'Dustbin Bag (Roll)', q: 'refuse sack', must: 'sack' },
  { slug: 'rice5', name: 'Rice 5kg (Foreign)', q: 'mama pride rice', must: '5 kg' },
  { slug: 'rice50', name: 'Rice 50kg Bag', q: 'royal stallion rice', must: '25 kg' },
  { slug: 'ariel', name: 'Ariel Detergent 1kg', q: 'ariel washing powder', must: 'ariel' },
  { slug: 'peakchoc', name: 'Peak Chocolate Cereal', q: 'peak chocolate milk', must: 'chocolate' },
]

const out = []
for (const a of accepts) {
  const enc = a.q.replace(/ /g, '%20')
  const txt = sh(`curl -s -A "Mozilla/5.0" "https://www.supermart.ng/search/suggest.json?q=${enc}&resources%5Btype%5D=product&resources%5Blimit%5D=6"`)
  let cands = []
  try { cands = JSON.parse(txt).resources.results.products || [] } catch {}
  const pick = cands.find(c => c.title.toLowerCase().includes(a.must)) || cands[0]
  if (pick && pick.image) {
    sh(`curl -s -L --max-time 30 "${pick.image}" -o "${DIR}/fix-${a.slug}.raw"`)
    sh(`ffmpeg -y -i "${DIR}/fix-${a.slug}.raw" -vf "scale=680:680:force_original_aspect_ratio=decrease,pad=760:760:(ow-iw)/2:(oh-ih)/2:white" "${DIR}/fix-${a.slug}.jpg"`)
    out.push({ ...a, title: pick.title, price: pick.price })
    console.log(`${a.slug.padEnd(10)} ${a.name.padEnd(22)} => ${pick.title}`)
  } else console.log(`${a.slug} NO IMAGE`)
  sh('sleep 1')
}
fs.writeFileSync(`${DIR}/fix.json`, JSON.stringify(out, null, 1))
