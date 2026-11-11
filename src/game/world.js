// Free-roaming 2D town, front-facing (3/4) view. Coordinates are world pixels.
export const WW = 2400, WH = 1700

// base = y of the building's bottom edge; door = x of the entrance
export const PLACES = [
  { id: 'house', label: 'Bahay', x: 80, w: 320, base: 480, color: 0xf4a261, roof: 0xb23a48, door: 240 },
  { id: 'sari', label: 'Sari-Sari Store', x: 480, w: 280, base: 480, color: 0x2a9d8f, roof: 0xe9c46a, door: 620, awning: true },
  { id: 'restaurant', label: 'Karinderya', x: 840, w: 320, base: 480, color: 0xe76f51, roof: 0x7f1d1d, door: 1000, awning: true },
  { id: 'market', label: 'Palengke', x: 1480, w: 360, base: 480, color: 0x3b82f6, roof: 0xfcd116, door: 1660, awning: true },
  { id: 'terminal', label: 'Jeepney Terminal', x: 1560, w: 640, base: 1020, color: 0x64748b, roof: 0x0038a8, door: 1880 },
]
// teleport targets [x, y] (feet)
export const LOCATIONS = {
  house: [240, 520], sari: [620, 520], restaurant: [1000, 520], market: [1660, 520], park: [580, 1310], terminal: [1880, 1070],
}

const L = (skin, hair, shirt, gender, style) => ({ skin, hair, shirt, gender, hairStyle: style })
export const NPCS = [
  { id: 'nena', name: 'Aling Nena', shop: 'sari', x: 700, y: 510, look: L('#e0ac69', '#555555', '#e63946', 'female', 2), line: 'Hi! Want to buy something from the store?' },
  { id: 'joy', name: 'Ate Joy', shop: 'restaurant', x: 1080, y: 510, look: L('#c68642', '#1b1b1b', '#fcd116', 'female', 2), line: 'Adobo ang ulam ngayon. Kain ka muna?' },
  { id: 'maria', name: 'Ate Maria', shop: 'market', x: 1740, y: 510, look: L('#f1c27d', '#3b2417', '#f472b6', 'female', 2), line: 'Hi! Want to buy some fresh fruits?' },
  { id: 'dodong', name: 'Kuya Dodong', x: 700, y: 1220, look: L('#e0ac69', '#4a2c17', '#0038a8', 'male', 1), line: 'Pahinga muna dito sa parke. Basketball tayo mamaya, pre!' },
  { id: 'tonyo', name: 'Mang Tonyo', x: 1760, y: 1100, look: L('#8d5524', '#1b1b1b', '#2a9d8f', 'male', 0), line: 'Para po! Jeepney driver ako dito. Kailangan ng rider? Punta ka sa terminal.' },
]
