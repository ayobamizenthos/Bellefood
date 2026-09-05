import fs from 'fs'
import { execSync } from 'child_process'
const SVC = fs.readFileSync('C:/Users/hercu/AppData/Local/Temp/claude/c--Users-hercu-OneDrive-Desktop-Zenthos-Energies/7654a02e-ecd2-4057-94ce-826500849550/scratchpad/svc.txt', 'utf8').trim()
const BASE = 'https://wpanjjgxrbyrieirutpl.supabase.co'
const sh = c => { try { return execSync(c, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: 'bash', maxBuffer: 1 << 26 }) } catch { return '' } }

const STOP = new Set(['g', 'kg', 'ml', 'cl', 'l', 'litre', 'litres', 'pack', 'tin', 'sachet', 'bottle', 'roll', 'pcs', 'pc', 'x', 'of', 'the', 'and', 'nigeria', 'nigerian', 'refill', 'family', 'size', 'each', 'set', 'kit', 'ng', 'large', 'medium', 'small', 'crate', 'cup', 'single', 'bag', 'tuber', 'foreign'])
const toks = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(t => t && !STOP.has(t) && !/^\d+$/.test(t))

const catalog = JSON.parse(fs.readFileSync(new URL('./supermart_catalog.json', import.meta.url).pathname.replace(/^\//, '')))
catalog.forEach(c => (c.tk = toks(c.title)))

const prods = JSON.parse(sh(`curl -s "${BASE}/rest/v1/products?store=eq.supermarket&select=id,name,category&order=category,name" -H "apikey: ${SVC}" -H "Authorization: Bearer ${SVC}"`) || '[]')

const out = []
for (const p of prods) {
  const pt = toks(p.name)
  const ptSet = new Set(pt)
  let best = null, bestScore = 0
  for (const c of catalog) {
    let shared = 0
    for (const t of c.tk) if (ptSet.has(t)) shared++
    if (!shared) continue
    // recall over our tokens + precision bonus, brand (first token) match bonus
    let score = shared / pt.length + shared / (c.tk.length + 2)
    if (pt[0] && c.tk.includes(pt[0])) score += 0.4
    if (score > bestScore) { bestScore = score; best = c }
  }
  out.push({ id: p.id, name: p.name, category: p.category, title: best?.title || '', img: best?.img || '', price: best?.price || '', score: +bestScore.toFixed(2) })
}
fs.writeFileSync(new URL('./match_map.json', import.meta.url).pathname.replace(/^\//, ''), JSON.stringify(out, null, 1))
let cat = ''
for (const r of out) {
  if (r.category !== cat) { cat = r.category; console.log('\n### ' + cat) }
  console.log(`${String(r.score).padStart(4)} | ${r.name.slice(0, 24).padEnd(25)} => ${(r.title || '(none)').slice(0, 42)}`)
}
console.log('\nMATCHED:', out.filter(o => o.img).length, '/', out.length)
