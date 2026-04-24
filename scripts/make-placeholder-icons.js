/*
 * Placeholder icon generator. Produces solid-color / simple PNGs for the
 * `assets/images/` set that `app.json` references so Expo/EAS builds can
 * resolve them. These are intentionally minimal — replace with real artwork
 * before App Store submission.
 *
 * Run: `node scripts/make-placeholder-icons.js`
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC-32 (used by PNG chunks)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/**
 * Build an RGBA PNG from a (width*height*4) pixel buffer.
 */
function encodePng(width, height, pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: truecolor + alpha
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function setPx(buf, width, x, y, r, g, b, a = 255) {
  const o = (y * width + x) * 4;
  buf[o] = r;
  buf[o + 1] = g;
  buf[o + 2] = b;
  buf[o + 3] = a;
}

function fillRect(buf, width, rgba) {
  for (let i = 0; i < buf.length; i += 4) {
    buf[i] = rgba[0];
    buf[i + 1] = rgba[1];
    buf[i + 2] = rgba[2];
    buf[i + 3] = rgba[3];
  }
}

// Colors
const GREEN = [0x22, 0xc5, 0x5e, 255]; // #22C55E
const DARK = [0x0d, 0x0d, 0x0d, 255]; // #0D0D0D
const TRANSPARENT = [0, 0, 0, 0];

/**
 * Draws an arc (ring with a "mouth" cut out) approximating a "C" glyph.
 * Only paints pixels inside the ring band AND outside the mouth wedge,
 * so no pixel outside the ring is ever touched.
 *   mouthHalfAngle: half-angle of the wedge opening on the right (radians).
 *   Pass 0 for a full closed ring.
 */
function drawArc(buf, width, height, cx, cy, ro, ri, mouthHalfAngle, rgba) {
  const ro2 = ro * ro;
  const ri2 = ri * ri;
  const cosMouth = Math.cos(mouthHalfAngle);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > ro2 || d2 < ri2) continue;
      if (mouthHalfAngle > 0) {
        // Pixel is inside the mouth wedge when dx > 0 and angle-from-center
        // is within ±mouthHalfAngle of the +x axis, i.e. cos(angle) > cosMouth.
        const d = Math.sqrt(d2);
        if (dx > 0 && dx / d > cosMouth) continue;
      }
      setPx(buf, width, x, y, rgba[0], rgba[1], rgba[2], rgba[3]);
    }
  }
}

// --- Icon: solid #22C55E, 1024×1024 with a dark C mark centered.
function makeIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  fillRect(pixels, size, GREEN);
  const cx = size / 2;
  const cy = size / 2;
  const ro = size * 0.36;
  const ri = size * 0.24;
  drawArc(pixels, size, size, cx, cy, ro, ri, Math.PI / 4.5, DARK);
  return encodePng(size, size, pixels);
}

// --- Splash: solid dark with a centered green C, 2048×2048.
function makeSplash(size) {
  const pixels = Buffer.alloc(size * size * 4);
  fillRect(pixels, size, DARK);
  const cx = size / 2;
  const cy = size / 2;
  const ro = size * 0.14;
  const ri = size * 0.092;
  drawArc(pixels, size, size, cx, cy, ro, ri, Math.PI / 4.5, GREEN);
  return encodePng(size, size, pixels);
}

// --- Adaptive icon (Android): solid emerald foreground, 1024×1024.
function makeAdaptive(size) {
  return makeIcon(size);
}

// --- Favicon: small solid green square.
function makeFavicon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  fillRect(pixels, size, GREEN);
  return encodePng(size, size, pixels);
}

const outDir = path.join(__dirname, '..', 'assets', 'images');
fs.mkdirSync(outDir, { recursive: true });

const outputs = [
  ['icon.png', makeIcon(1024)],
  ['splash-icon.png', makeSplash(2048)],
  ['adaptive-icon.png', makeAdaptive(1024)],
  ['favicon.png', makeFavicon(48)],
];
for (const [name, buf] of outputs) {
  const p = path.join(outDir, name);
  fs.writeFileSync(p, buf);
  console.log(`wrote ${p} (${buf.length} bytes)`);
}
