import fs from 'fs'
import { execSync } from 'child_process'
const sh = c => { try { return execSync(c, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: 'bash', maxBuffer: 1024 * 1024 * 64 }) } catch { return '' } }

const catalog = []
for (let page = 1; page <= 40; page++) {
  const txt = sh(`curl -s -A "Mozilla/5.0" "https://www.supermart.ng/products.json?limit=250&page=${page}"`)
  let products = []
  try { products = JSON.parse(txt).products || [] } catch { break }
  if (!products.length) break
  for (const p of products) {
    const img = (p.images || [])[0]?.src || ''
    const price = (p.variants || [])[0]?.price || ''
    if (img) catalog.push({ title: p.title, img, price })
  }
  process.stdout.write(`page ${page}: +${products.length} (total ${catalog.length})\n`)
  sh('sleep 1')
}
fs.writeFileSync(new URL('./supermart_catalog.json', import.meta.url).pathname.replace(/^\//, ''), JSON.stringify(catalog))
console.log('CATALOG SIZE:', catalog.length)
