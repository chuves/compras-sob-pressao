import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(path.join(__dirname, "icon-source.svg"));
const outDir = path.join(__dirname, "../public/icons");

import { mkdirSync } from "node:fs";
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, name));
  console.log(`gerado ${name}`);
}

// Maskable icon: same design but with extra padding so OS icon masks don't crop it.
await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#047857" },
})
  .composite([
    {
      input: await sharp(svg, { density: 384 }).resize(360, 360).toBuffer(),
      top: 76,
      left: 76,
    },
  ])
  .png()
  .toFile(path.join(outDir, "icon-maskable-512.png"));
console.log("gerado icon-maskable-512.png");

await sharp(svg, { density: 384 }).resize(64, 64).png().toFile(
  path.join(__dirname, "../public/favicon.png"),
);
console.log("gerado favicon.png");
