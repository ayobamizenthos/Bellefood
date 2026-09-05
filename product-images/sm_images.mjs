import fs from 'fs'
import { execSync } from 'child_process'
const SVC = fs.readFileSync('C:/Users/hercu/AppData/Local/Temp/claude/c--Users-hercu-OneDrive-Desktop-Zenthos-Energies/7654a02e-ecd2-4057-94ce-826500849550/scratchpad/svc.txt', 'utf8').trim()
const BASE = 'https://wpanjjgxrbyrieirutpl.supabase.co'
const DIR = new URL('./sm', import.meta.url).pathname.replace(/^\//, '')
fs.mkdirSync(DIR, { recursive: true })
const sh = c => { try { return execSync(c, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: 'bash', maxBuffer: 1 << 26 }) } catch { return '' } }

const STOP = new Set(['g', 'kg', 'ml', 'cl', 'l', 'pack', 'tin', 'sachet', 'bottle', 'roll', 'of', 'refill', 'foreign', 'large', 'medium', 'crate', 'cup', 'single', 'bag', 'tuber', 'set', 'kit', 'x'])
const toks = s => s.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(t => t && !STOP.has(t) && !/^\d+(kg|g|ml|cl|l)?$/.test(t))
const query = name => toks(name).join(' ')
const sizeOf = name => (name.toLowerCase().match(/\d+\s?(kg|g|cl|ml|l)\b/) || [])[0]?.replace(/\s/g, '') || ''

let prods = []
for (let attempt = 0; attempt < 5 && !prods.length; attempt++) {
  try { prods = JSON.parse(sh(`curl -s --max-time 30 "${BASE}/rest/v1/products?store=eq.supermarket&select=id,name,category&order=category,name" -H "apikey: ${SVC}" -H "Authorization: Bearer ${SVC}"`) || '[]') } catch {}
  if (!prods.length) sh('sleep 3')
}
if (!prods.length) { console.log('ERROR: could not load products'); process.exit(1) }
console.log('loaded', prods.length, 'products')
const rows = []
let i = 0
for (const p of prods) {
  i++
  const q = query(p.name)
  const enc = q.replace(/ /g, '%20')
  const txt = sh(`curl -s -A "Mozilla/5.0" "https://www.supermart.ng/search/suggest.json?q=${enc}&resources%5Btype%5D=product&resources%5Blimit%5D=6"`)
  let cands = []
  try { cands = JSON.parse(txt).resources.results.products || [] } catch {}
  const ptSet = new Set(toks(p.name))
  const wantSize = sizeOf(p.name)
  let best = null, bestScore = -1
  for (const c of cands) {
    const ct = toks(c.title)
    let shared = 0
    for (const t of ct) if (ptSet.has(t)) shared++
    let score = shared / Math.max(1, ptSet.size) + shared / (ct.length + 3)
    if (wantSize && c.title.toLowerCase().replace(/\s/g, '').includes(wantSize)) score += 0.5
    if (score > bestScore) { bestScore = score; best = c }
  }
  const idx = String(i).padStart(3, '0')
  let file = null
  if (best && best.image) {
    const raw = `${DIR}/${idx}.raw`
    sh(`curl -s -L --max-time 30 "${best.image}" -o "${raw}"`)
    const out = `${DIR}/${idx}.jpg`
    sh(`ffmpeg -y -i "${raw}" -vf "scale=680:680:force_original_aspect_ratio=decrease,pad=760:760:(ow-iw)/2:(oh-ih)/2:white" "${out}"`)
    fs.rmSync(raw, { force: true })
    if (fs.existsSync(out)) file = `${idx}.jpg`
  }
  rows.push({ idx, id: p.id, name: p.name, category: p.category, title: best?.title || '', price: best?.price || '', file })
  console.log(`${idx} ${p.name.slice(0, 24).padEnd(25)} => ${(best?.title || '(none)').slice(0, 40)} ${file ? 'OK' : '-'}`)
  sh('sleep 1.2')
}
fs.writeFileSync(new URL('./sm_final.json', import.meta.url).pathname.replace(/^\//, ''), JSON.stringify(rows, null, 1))
console.log('\nWITH IMAGE:', rows.filter(r => r.file).length, '/', rows.length)
