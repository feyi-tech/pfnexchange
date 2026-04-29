const QRCode = require('qrcode');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const manifestPath = 'manifest.json';
const outputDir = 'assets/qrcodes';
const outputFile = 'qrcode.png';

// Change this one number, and everything else scales perfectly
const QR_WIDTH = 1024; 

async function generateQRCodeFromManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  const websiteUrl = manifest.url;
  const qrColor = manifest.theme_color || '#000000';

  if (!websiteUrl) throw new Error('No "url" in manifest');

  // 1. Pick largest icon from manifest
  const selectedIcon = manifest.icons
    .map(icon => ({
      ...icon,
      size: parseInt(icon.sizes.split('x')[0])
    }))
    .sort((a, b) => b.size - a.size)[0];

  const logoPath = path.join(process.cwd(), selectedIcon.src.replace(/^\//, ''));

  if (!fs.existsSync(logoPath)) {
    throw new Error(`Logo not found: ${logoPath}`);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 2. Dynamic Sizing Logic
  // We target ~28% coverage to stay safe under the 30% 'H' limit.
  const cutoutSize = Math.floor(QR_WIDTH * 0.28); 
  
  // We want the padding to be roughly 15-20% of the cutout area
  const padding = Math.floor(cutoutSize * 0.17); 
  
  // The actual logo is whatever space is left
  const logoSize = cutoutSize - padding;

  console.log(`📏 Scaling for ${QR_WIDTH}px: Logo(${logoSize}px) + Padding(${padding}px)`);

  // 3. Generate QR with TRANSPARENT background
  const qrBuffer = await QRCode.toBuffer(websiteUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 2,
    color: {
      dark: qrColor,
      light: '#0000' // Transparent
    },
    width: QR_WIDTH
  });

  // 4. Prepare the Logo
  const logoBuffer = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // 5. Create the "Eraser" mask (The Cutout)
  // MUST be opaque (alpha: 1) to "punch" the hole in the QR code
  const cutout = await sharp({
    create: {
      width: cutoutSize,
      height: cutoutSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 } 
    }
  })
    .png()
    .toBuffer();

  // 6. Composite everything
  await sharp(qrBuffer)
    .composite([
      {
        input: cutout,
        gravity: 'center',
        blend: 'dest-out' // This removes the QR modules in the center
      },
      {
        input: logoBuffer,
        gravity: 'center' // This places the logo in the newly emptied space
      }
    ])
    .png()
    .toFile(path.join(outputDir, outputFile));

  console.log('✅ Transparent QR with clean dynamic cutout generated');
}

generateQRCodeFromManifest().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});