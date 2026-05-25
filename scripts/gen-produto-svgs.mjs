import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dir = path.join(root, "img", "produtos");
fs.mkdirSync(dir, { recursive: true });

const items = [
  { file: "1.svg", emoji: "🍣", label: "Poke Noboru" },
  { file: "2.svg", emoji: "🦐", label: "Poke Aloha" },
  { file: "3.svg", emoji: "🐟", label: "Poke Ohana" },
  { file: "4.svg", emoji: "🥗", label: "Poke Moana" },
  { file: "5.svg", emoji: "🍗", label: "Poke Chicken" },
  { file: "poke-custom.svg", emoji: "✨", label: "Monte seu poke" },
  { file: "6.svg", emoji: "🍙", label: "Temaki Salmão" },
  { file: "7.svg", emoji: "🐠", label: "Temaki Cebolinha" },
  { file: "8.svg", emoji: "🧀", label: "Temaki Filadélfia" },
  { file: "9.svg", emoji: "🔥", label: "Temaki Hot" },
  { file: "10.svg", emoji: "🍤", label: "Mini Hot" },
  { file: "11.svg", emoji: "💧", label: "Água" },
  { file: "12.svg", emoji: "🍇", label: "Fanta Uva" },
  { file: "13.svg", emoji: "🍊", label: "Fanta Laranja lata" },
  { file: "14.svg", emoji: "🥤", label: "Fanta Guaraná" },
  { file: "15.svg", emoji: "🥤", label: "Coca Zero lata" },
  { file: "16.svg", emoji: "🥤", label: "Coca-Cola lata" },
  { file: "17.svg", emoji: "🥤", label: "Coca Zero 600ml" },
  { file: "18.svg", emoji: "🍊", label: "Fanta Laranja 600ml" },
  { file: "19.svg", emoji: "🍵", label: "Chá gelado" },
];

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

for (let i = 0; i < items.length; i++) {
  const { file, emoji, label } = items[i];
  const id = "grad" + file.replace(/\W/g, "");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200" role="img" aria-label="${escapeXml(label)}">
  <defs>
    <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fff5f5"/>
      <stop offset="100%" style="stop-color:#fce7eb"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#${id})" rx="12" stroke="#f9a8d4" stroke-width="2"/>
  <text x="160" y="115" text-anchor="middle" font-size="80" style="font-family: 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif;">${escapeXml(emoji)}</text>
</svg>
`;
  fs.writeFileSync(path.join(dir, file), svg, "utf8");
}

console.log("OK:", dir, items.length, "SVGs");
