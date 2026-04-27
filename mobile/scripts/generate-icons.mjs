import sharp from "sharp";
import opentype from "opentype.js";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const ASSETS_OUT = resolve(here, "..", "assets", "images");
const FONT_PATH = join(here, "assets", "InstrumentSerif-Italic.ttf");

const CORAL = "#FF5A3C";
const CREAM = "#F4EFE5";
const INK_DARK = "#17140F";

mkdirSync(ASSETS_OUT, { recursive: true });

const font = await opentype.load(FONT_PATH);

/** Render "LOG" as an SVG path centered in a `size` × `size` canvas at the given font height. */
function logPath({ size, fontPx, fill }) {
  const text = "LOG";
  // Generate path centered at (0, 0); we'll translate it
  const path = font.getPath(text, 0, 0, fontPx);
  const bb = path.getBoundingBox();
  const w = bb.x2 - bb.x1;
  const h = bb.y2 - bb.y1;
  const cx = bb.x1 + w / 2;
  const cy = bb.y1 + h / 2;
  const tx = size / 2 - cx;
  const ty = size / 2 - cy;
  const pathData = path.toPathData(2);
  return `<g transform="translate(${tx} ${ty})"><path d="${pathData}" fill="${fill}"/></g>`;
}

function svgIcon({ size, bg, fg, fontPx, glow = false }) {
  const glowMarkup = glow
    ? `<defs>
        <radialGradient id="g" cx="22%" cy="22%" r="55%">
          <stop offset="0" stop-color="${CREAM}" stop-opacity="0.16"/>
          <stop offset="1" stop-color="${CREAM}" stop-opacity="0"/>
        </radialGradient>
       </defs>
       <rect x="0" y="0" width="${size}" height="${size}" fill="url(#g)"/>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="0" width="${size}" height="${size}" fill="${bg}"/>
  ${glowMarkup}
  ${logPath({ size, fontPx, fill: fg })}
</svg>`;
}

function transparentSvg({ size, fg, fontPx }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${logPath({ size, fontPx, fill: fg })}
</svg>`;
}

async function makePNG(svg, outPath, size) {
  const png = await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(outPath, png);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

// iOS app icon — coral bg, cream LOG, faint cream glow top-left
await makePNG(
  svgIcon({ size: 1024, bg: CORAL, fg: CREAM, fontPx: 520, glow: true }),
  join(ASSETS_OUT, "icon.png"),
  1024
);

// Splash icon (Expo composites this on the dark splash bg)
await makePNG(
  svgIcon({ size: 512, bg: INK_DARK, fg: CREAM, fontPx: 280 }),
  join(ASSETS_OUT, "splash-icon.png"),
  512
);

// Favicon (web + dev menu)
await makePNG(
  svgIcon({ size: 256, bg: CORAL, fg: CREAM, fontPx: 130 }),
  join(ASSETS_OUT, "favicon.png"),
  256
);

// Android adaptive — foreground (transparent bg, smaller for the 72% safe zone)
await makePNG(
  transparentSvg({ size: 1024, fg: CREAM, fontPx: 360 }),
  join(ASSETS_OUT, "android-icon-foreground.png"),
  1024
);

// Android adaptive — solid coral background
const adaptiveBg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect x="0" y="0" width="1024" height="1024" fill="${CORAL}"/>
</svg>`;
await makePNG(adaptiveBg, join(ASSETS_OUT, "android-icon-background.png"), 1024);

// Android monochrome (system tints it)
await makePNG(
  transparentSvg({ size: 1024, fg: "#FFFFFF", fontPx: 360 }),
  join(ASSETS_OUT, "android-icon-monochrome.png"),
  1024
);

console.log("done");
