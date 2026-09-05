import fs from 'fs'
import { execSync } from 'child_process'
const DIR = new URL('./sm', import.meta.url).pathname.replace(/^\//, '')
const sh = c => { try { return execSync(c, { stdio: ['pipe', 'pipe', 'ignore'], shell: 'bash' }) } catch {} }
const rows = JSON.parse(fs.readFileSync(new URL('./sm_final.json', import.meta.url).pathname.replace(/^\//, '')))

const byCat = {}
for (const r of rows) if (r.file) (byCat[r.category] = byCat[r.category] || []).push(r)

fs.mkdirSync(`${DIR}/sheets`, { recursive: true })
for (const [cat, items] of Object.entries(byCat)) {
  items.forEach((r, k) => sh(`ffmpeg -y -i "${DIR}/${r.file}" -vf "scale=200:200" "${DIR}/sheets/_${cat}_${String(k).padStart(2, '0')}.jpg"`))
  const cols = 5
  const rowsN = Math.ceil(items.length / cols)
  sh(`ffmpeg -y -framerate 1 -i "${DIR}/sheets/_${cat}_%02d.jpg" -vf "tile=${cols}x${rowsN}:padding=4:color=white" "${DIR}/sheets/sheet-${cat}.jpg"`)
  console.log(`\n### ${cat}  (${cols} cols)`)
  items.forEach((r, k) => console.log(`  [${k}] ${r.name}  <=  ${r.title}`))
}
