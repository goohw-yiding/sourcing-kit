const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const svgPath = path.join(__dirname, "../public/icons/icon.svg");
const outDir = path.join(__dirname, "../public/icons");

const sizes = [48, 72, 96, 144, 192, 512];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    const outPath = path.join(outDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated: icon-${size}.png`);
  }

  // Maskable icon with 20% padding (safe zone)
  const maskableSize = 512;
  const innerSize = Math.round(maskableSize * 0.8); // 80% of total = content area
  const padding = Math.round(maskableSize * 0.1); // 10% on each side

  const resizedContent = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .png()
    .toBuffer();

  // Create a navy background canvas and composite the icon centered
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 15, g: 45, b: 89, alpha: 1 }, // #0F2D59
    },
  })
    .composite([{ input: resizedContent, top: padding, left: padding }])
    .png()
    .toFile(path.join(outDir, "icon-maskable-512.png"));

  console.log("Generated: icon-maskable-512.png");
  console.log("All icons generated successfully!");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
