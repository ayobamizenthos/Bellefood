import fs from 'fs'
import { execSync } from 'child_process'
const SVC = fs.readFileSync('C:/Users/hercu/AppData/Local/Temp/claude/c--Users-hercu-OneDrive-Desktop-Zenthos-Energies/7654a02e-ecd2-4057-94ce-826500849550/scratchpad/svc.txt', 'utf8').trim()
const BASE = 'https://wpanjjgxrbyrieirutpl.supabase.co'
const DIR = new URL('./sm', import.meta.url).pathname.replace(/^\//, '')
const sh = c => { try { return execSync(c, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: 'bash', maxBuffer: 1 << 26 }) } catch { return '' } }

// wrong product match -> skip
const REJECT = new Set([6, 31, 43, 45, 47, 58, 59, 65, 72, 84, 88, 91, 92, 97, 109, 115, 116, 117, 118, 119, 120, 124, 126, 135])
// already have a good user-provided image -> keep
const SKIP = new Set([104, 106, 110])

const rows = JSON.parse(fs.readFileSync(new URL('./sm_final.json', import.meta.url).pathname.replace(/^\//, '')))
let applied = 0, skipped = 0
for (const r of rows) {
  const n = parseInt(r.idx, 10)
  if (!r.file || REJECT.has(n) || SKIP.has(n)) { skipped++; continue }
  const up = sh(`curl -s -X POST "https://api.cloudinary.com/v1_1/nmmsdyna/image/upload" -F "file=@${DIR}/${r.file}" -F "upload_preset=bellefood_unsigned"`)
  let url = ''
  try { const j = JSON.parse(up); url = j.secure_url ? j.secure_url.replace('/upload/', '/upload/f_auto,q_auto/') : '' } catch {}
  if (!url) { console.log('UPLOAD FAIL', r.name); continue }
  const patch = sh(`curl -s -X PATCH "${BASE}/rest/v1/products?id=eq.${r.id}" -H "apikey: ${SVC}" -H "Authorization: Bearer ${SVC}" -H "Content-Type: application/json" -H "Prefer: return=minimal" -d '{"images":["${url}"]}'`)
  applied++
  if (applied % 10 === 0) console.log('applied', applied, '...')
}
console.log('\nDONE. applied images:', applied, '| skipped:', skipped)
