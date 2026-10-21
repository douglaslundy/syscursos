// Gera os icones do PWA (public/icons) sem dependencias: fundo laranja da marca com um "play" branco.
// Uso: node scripts/make-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const ORANGE = [255, 77, 0];
const WHITE = [255, 255, 255];

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(4);
  out.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([out, body, crc]);
}

function png(size, scale) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  // Triangulo "play" centralizado; scale < 1 deixa margem segura para icones maskable.
  const half = size / 2;
  const reach = size * 0.3 * scale;
  const a = [half - reach * 0.6, half - reach];
  const b = [half - reach * 0.6, half + reach];
  const c = [half + reach, half];
  const side = (p, q, x, y) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);

  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const d1 = side(a, b, x, y);
      const d2 = side(b, c, x, y);
      const d3 = side(c, a, x, y);
      const inside = (d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0);
      const color = inside ? WHITE : ORANGE;
      raw.set(color, row + 1 + x * 3);
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;

  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", png(192, 1));
writeFileSync("public/icons/icon-512.png", png(512, 1));
writeFileSync("public/icons/icon-maskable-512.png", png(512, 0.75));
console.log("icons written");
