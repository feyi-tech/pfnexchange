const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'index.html',
  'pay/index.html',
  'backend/paths.json',
  'manifest.json',
  'sw.js',
  'assets/js/pay-gateway.js',
  'assets/icons/logo.png',
  'assets/icons/logo-64.png',
  'assets/icons/logo-512.png',
  'assets/icons/logo-1024.png',
  'assets/icons/favicon.png'
];

const supportedCurrencies = [
  'NGN', 'GHS', 'USD', 'GBP', 'EUR', 'CAD', 'AED', 'AUD', 'ZAR',
  'ETB', 'INR', 'KES', 'MWK', 'RWF', 'SLL', 'TZS', 'UGX', 'XAF', 'XOF', 'ZMW'
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
  if (indexContent.includes('navigator.serviceWorker.register')) {
    console.error('Test failed! index.html still registers service worker');
    process.exit(1);
  }
  if (!indexContent.includes('gallery')) {
     console.error('Test failed! index.html missing gallery section');
     process.exit(1);
  }
  if (!indexContent.includes('<dd>20</dd>') || !indexContent.includes('20 supported currencies')) {
    console.error('Test failed! index.html must show the updated supported currency count');
    process.exit(1);
  }
  supportedCurrencies.forEach(currency => {
    if (!indexContent.includes(`<span class="currency-code">${currency}</span>`)) {
      console.error(`Test failed! index.html is missing ${currency} currency card`);
      process.exit(1);
    }
  });

  const payContent = fs.readFileSync('pay/index.html', 'utf8');
  if (!payContent.includes('id="currency"') || !payContent.includes('id="amount"') || !payContent.includes('id="email"')) {
    console.error('Test failed! pay page is missing required payment fields');
    process.exit(1);
  }
  supportedCurrencies.forEach(currency => {
    if (!payContent.includes(`value="${currency}"`)) {
      console.error(`Test failed! pay page is missing ${currency} currency option`);
      process.exit(1);
    }
  });
  if (!payContent.includes('value="GHS" selected')) {
    console.error('Test failed! GHS must be the default currency');
    process.exit(1);
  }
  if (!payContent.includes('/assets/js/pay-gateway.js')) {
    console.error('Test failed! pay page must load the checkout gateway');
    process.exit(1);
  }
  if (/lushy/i.test(payContent)) {
    console.error('Test failed! pay page must not mention Lushy Crown');
    process.exit(1);
  }
  if (/<a\b/i.test(payContent)) {
    console.error('Test failed! pay page must not include page links');
    process.exit(1);
  }

  const pathsConfig = JSON.parse(fs.readFileSync('backend/paths.json', 'utf8'));
  if (pathsConfig['/pay'] !== '/pay/index.html') {
    console.error('Test failed! /pay route is not mapped to pay/index.html');
    process.exit(1);
  }

  const payScript = fs.readFileSync('assets/js/pay.js', 'utf8');
  if (!payScript.includes('PAYMENT_CHECKOUT_CONFIG') || !payScript.includes('PAYMENT_CHECKOUT_GLOBAL')) {
    console.error('Test failed! pay script must expose payment config and launch checkout');
    process.exit(1);
  }

  const gatewayScript = fs.readFileSync('assets/js/pay-gateway.js', 'utf8');
  if (!gatewayScript.includes('checkout.') || !gatewayScript.includes('v3.js')) {
    console.error('Test failed! gateway loader must request the checkout script');
    process.exit(1);
  }
  if (!payScript.includes('PAYMENT_FORM_STORAGE_KEY') || !payScript.includes('localStorage') || !payScript.includes('restoreSavedDetails')) {
    console.error('Test failed! pay script must persist and restore customer payment details');
    process.exit(1);
  }

  console.log('Basic content checks passed.');
  process.exit(0);
}
