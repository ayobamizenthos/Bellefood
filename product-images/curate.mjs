import fs from 'fs'
const catalog = JSON.parse(fs.readFileSync(new URL('./supermart_catalog.json', import.meta.url).pathname.replace(/^\//, '')))

const CATS = {
  beverages: { inc: ['coca cola', 'coke', 'fanta', 'sprite', 'pepsi', '7up', 'mirinda', ' juice', 'fruit drink', 'table water', 'bottled water', 'malt', 'amstel malta', 'hollandia', 'ribena', 'chivita', 'chi ', 'capri', '5 alive', 'energy drink', 'soft drink', 'lucozade', 'schweppes'], exc: ['perfume', 'edp', 'edt', 'after sun', ' soap', 'lotion', 'sun ', 'cologne', 'shower', 'shampoo', 'hair', 'body spray', 'sanitizer'] },
  provisions: { inc: ['milo', 'bournvita', 'ovaltine', 'cornflakes', 'corn flakes', 'oats', 'custard', 'cereal', 'golden morn', 'granola', 'coco pops', 'weetabix', 'nutri'], exc: ['bar ', 'pudding', 'shampoo'] },
  cooking: { inc: ['vegetable oil', 'groundnut oil', 'palm oil', 'sunflower oil', 'tomato paste', 'tinned tomato', 'chopped tomato', 'seasoning', 'maggi', 'knorr', 'iodised salt', ' salt ', 'curry powder', 'thyme', 'ground pepper', 'gino', 'stock cube', 'bouillon', 'spice'], exc: ['ketchup', 'crisp', 'hair', ' soap', 'shampoo', 'chocolate'] },
  'dairy-eggs': { inc: ['milk powder', 'peak milk', 'dano', 'three crowns', 'evaporated milk', 'butter', 'cheese', ' egg', 'yoghurt', 'yogurt', 'margarine', 'condensed milk'], exc: ['hair', 'body', ' soap', 'shea', 'peanut butter', 'cocoa'] },
  foodstuff: { inc: ['basmati rice', 'jasmine rice', 'long grain rice', 'honey beans', 'baked beans', 'garri', 'semovita', 'semolina', 'spaghetti', 'macaroni', 'penne', 'indomie', 'instant noodles', 'wheat flour', 'plantain flour', 'yam flour', 'elubo', 'poundo', 'pounded yam'], exc: ['crisp', 'snack'] },
  frozen: { inc: ['frozen chicken', 'whole chicken', 'chicken breast', 'chicken wings', 'frozen fish', 'sausage', 'turkey', 'beef', 'shrimp', 'prawn', 'fish fillet'], exc: ['stock', 'seasoning', 'cube', 'flavour', 'sauce', 'noodle', 'crisp'] },
  snacks: { inc: ['biscuit', 'cookies', 'chocolate bar', 'oreo', 'pringles', 'potato chips', 'crisps', 'popcorn', 'kit kat', 'cadbury', 'digestive', 'wafer', 'cracker', 'groundnut', 'peanut', 'chin chin', 'candy', 'gala', 'sausage roll', 'plantain chips'], exc: ['hair', 'body', 'shampoo'] },
  toiletries: { inc: ['bath soap', 'bar soap', 'toothpaste', 'toothbrush', 'sanitary', 'deodorant', 'toilet tissue', 'tissue', 'vaseline', 'petroleum jelly', 'sanitizer', 'cotton bud', 'shower gel', 'antiseptic soap', 'sanitary pad', 'roll on'], exc: ['dish', 'laundry', 'hair'] },
  household: { inc: ['laundry detergent', 'washing powder', 'bleach', 'dishwashing', 'dish wash', 'air freshener', 'insecticide', 'aluminium foil', 'cling film', 'scouring', 'sponge', 'omo', 'ariel', 'morning fresh', 'hypo', 'harpic', 'toilet cleaner', 'mop', 'fabric conditioner', 'disinfectant'], exc: ['hair', 'body'] },
  haircare: { inc: ['shampoo', 'conditioner', 'hair cream', 'hair food', 'relaxer', 'edge control', 'castor oil', 'shea butter', 'hair gel', 'leave in', 'hair lotion', 'hair oil', 'hair mayonnaise'], exc: [] },
  baby: { inc: ['baby lotion', 'baby oil', 'baby powder', 'baby wipes', 'diaper', 'huggies', 'molfix', 'pampers', 'cerelac', 'infant cereal', 'baby wash', 'baby bath'], exc: ['adult'] },
}

const PER_CAT = 12
const used = new Set()
const selection = []
for (const [cat, { inc, exc }] of Object.entries(CATS)) {
  const hits = catalog.filter(c => {
    const t = c.title.toLowerCase()
    const price = parseFloat(c.price)
    if (!(price >= 150 && price <= 200000)) return false
    if (used.has(c.title)) return false
    if (exc.some(e => t.includes(e))) return false
    return inc.some(k => t.includes(k))
  })
  // prefer shorter, cleaner titles
  hits.sort((a, b) => a.title.length - b.title.length)
  const picked = hits.slice(0, PER_CAT)
  picked.forEach(p => { used.add(p.title); selection.push({ category: cat, title: p.title, price: Math.round(parseFloat(p.price)), img: p.img }) })
}
fs.writeFileSync(new URL('./selection.json', import.meta.url).pathname.replace(/^\//, ''), JSON.stringify(selection, null, 1))
let cat = ''
for (const s of selection) {
  if (s.category !== cat) { cat = s.category; console.log('\n### ' + cat) }
  console.log(`  N${String(s.price).padEnd(6)} ${s.title}`)
}
console.log('\nTOTAL SELECTED:', selection.length)
