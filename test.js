const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'index.html',
  'manifest.json',
  'sw.js',
  'assets/icons/logo.svg',
  'assets/icons/logo-64.png',
  'assets/icons/logo-512.png',
  'assets/icons/logo-1024.png',
  'assets/icons/favicon.png',
  'assets/images/banner.jpg'
];

let missingFiles = [];

requiredFiles.forEach(file => {
  if (!fs.existsSync(path.join(__dirname, file))) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('Test failed! Missing files:', missingFiles.join(', '));
  process.exit(1);
} else {
  console.log('All required files are present.');

  // Basic content checks
  const indexContent = fs.readFileSync('index.html', 'utf8');
  if (!indexContent.includes('manifest.json')) {
    console.error('Test failed! index.html does not link to manifest.json');
    process.exit(1);
  }
  if (!indexContent.includes('sw.js')) {
    console.error('Test failed! index.html does not register service worker');
    process.exit(1);
  }
  if (!indexContent.includes('gallery')) {
     console.error('Test failed! index.html missing gallery section');
     process.exit(1);
  }

  console.log('Basic content checks passed.');
  process.exit(0);
}
