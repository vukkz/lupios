// Writes https://lupios.org/og.png, the picture a shared link shows (og:image in astro.config.mjs),
// from src/assets/og.svg (made by art/generate.mjs). Platforms want a PNG, not an SVG, so it's
// rendered at every build with sharp (which Astro uses for images anyway); the PNG is git-ignored.
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const svg = fileURLToPath(new URL("../src/assets/og.svg", import.meta.url));
const png = fileURLToPath(new URL("../public/og.png", import.meta.url));
const info = await sharp(svg).png({ compressionLevel: 9 }).toFile(png);
console.log(`og.png: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
