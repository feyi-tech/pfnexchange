const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'assets/images/services');

// matches: -480w.png, -720w.jpg, etc
const responsivePattern = /-\d+w\.(png|jpe?g|webp|gif|svg)$/i;

const serviceImages = fs
  .readdirSync(servicesDir)
  .filter(file => {
    return !responsivePattern.test(file); // ❌ exclude responsive variants
  })
  .map(file => `assets/images/services/${file}`);

const images = [
  'assets/images/hero.png',
  ...serviceImages
];

const sizes = [
  { width: 480, suffix: '480w' },
  { width: 800, suffix: '800w' },
  { width: 1200, suffix: '1200w' },
];

async function generateResponsiveImages() {
  for (const imagePath of images) {
    if (!fs.existsSync(imagePath)) {
      console.warn(`File not found: ${imagePath}`);
      continue;
    }

    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const dirname = path.dirname(imagePath);

    for (const size of sizes) {
      const outputName = `${basename}-${size.suffix}${ext}`;
      const outputPath = path.join(dirname, outputName);

      await sharp(imagePath)
        .resize(size.width)
        .toFile(outputPath);
      
      console.log(`Generated: ${outputPath}`);
    }
  }
}

generateResponsiveImages().catch(err => {
  console.error('Error generating responsive images:', err);
  process.exit(1);
});