import fs from 'fs'
import { execSync } from 'child_process'
const SVC = fs.readFileSync('C:/Users/hercu/AppData/Local/Temp/claude/c--Users-hercu-OneDrive-Desktop-Zenthos-Energies/7654a02e-ecd2-4057-94ce-826500849550/scratchpad/svc.txt', 'utf8').trim()
const BASE = 'https://wpanjjgxrbyrieirutpl.supabase.co'
const FIXDIR = 'C:/Users/hercu/AppData/Local/Temp/claude/c--Users-hercu-OneDrive-Desktop-Zenthos-Energies/7654a02e-ecd2-4057-94ce-826500849550/scratchpad/bfreal'
const sh = c => { try { return execSync(c, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: 'bash', maxBuffer: 1 << 26 }) } catch { return '' } }
const enc = s => encodeURIComponent(s)

const APPLY = ['peaksachet', 'eggs15', 'turkey', 'foil', 'refuse', 'rice5', 'rice50', 'ariel']
const fix = JSON.parse(fs.readFileSync(`${FIXDIR}/fix.json`))

for (const a of fix) {
  if (!APPLY.includes(a.slug)) continue
  const up = sh(`curl -s -X POST "https://api.cloudinary.com/v1_1/nmmsdyna/image/upload" -F "file=@${FIXDIR}/fix-${a.slug}.jpg" -F "upload_preset=bellefood_unsigned"`)
  let url = ''
  try { url = JSON.parse(up).secure_url.replace('/upload/', '/upload/f_auto,q_auto/') } catch {}
  if (!url) { console.log('UPLOAD FAIL', a.name); continue }
  sh(`curl -s -X PATCH "${BASE}/rest/v1/products?store=eq.supermarket&name=eq.${enc(a.name)}" -H "apikey: ${SVC}" -H "Authorization: Bearer ${SVC}" -H "Content-Type: application/json" -H "Prefer: return=minimal" -d '{"images":["${url}"]}'`)
  console.log('applied image ->', a.name)
}

const DELETE = ['Peak Chocolate Cereal', 'Groundnut Oil 5L', 'Omo Detergent 900g', 'Tom Tom (Pack)', 'Gala Sausage Roll', 'Rolling Tray', 'Cigar (Single)', 'Bic Lighter', 'Rizla Paper', 'Shisha Coal Pack', 'Backwoods (Russian Cream)', 'Backwoods (Honey)', 'Clipper Lighter']
for (const name of DELETE) {
  const r = sh(`curl -s -X DELETE "${BASE}/rest/v1/products?store=eq.supermarket&name=eq.${enc(name)}" -H "apikey: ${SVC}" -H "Authorization: Bearer ${SVC}" -H "Prefer: return=representation"`)
  let n = 0; try { n = JSON.parse(r).length } catch {}
  console.log('deleted', n, '->', name)
}
