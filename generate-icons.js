const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = 'assets/icons/logo.svg';
const outputDir = 'assets/icons';

const sizes = [
  { size: 64, name: 'logo-64.png' },
  { size: 512, name: 'logo-512.png' },
  { size: 1024, name: 'logo-1024.png' },
  { size: 32, name: 'favicon.png' }
];

async function generateIcons() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const item of sizes) {
    await sharp(inputSvg)
      .resize(item.size, item.size)
      .png()
      .toFile(path.join(outputDir, item.name));
    console.log(`Generated ${item.name}`);
  }
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
