#!/usr/bin/env node
// Run: node scripts/generate-icons.js
// Generates PNG icons for PWA (requires sharp or canvas)
// If you can't run this, use https://realfavicongenerator.net/

const fs = require('fs');
const path = require('path');

// Simple SVG icon for CarCost
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#0e1420"/>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0e1420"/>
      <stop offset="100%" style="stop-color:#151d2e"/>
    </linearGradient>
  </defs>
  <!-- Car emoji representation -->
  <text x="256" y="320" font-size="240" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji">🚗</text>
  <!-- Orange dot accent -->
  <circle cx="390" cy="140" r="28" fill="#f97316"/>
</svg>`;

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Save SVG version
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);
console.log('✅ SVG icon saved to public/icons/icon.svg');
console.log('');
console.log('📌 To generate PNG icons, either:');
console.log('   1. Use https://realfavicongenerator.net/ with the SVG above');
console.log('   2. Run: npm install -g sharp-cli && sharp -i public/icons/icon.svg -o public/icons/icon-192.png resize 192 192 && sharp -i public/icons/icon.svg -o public/icons/icon-512.png resize 512 512');
console.log('   3. Use any image editor to export icon.svg as icon-192.png (192×192) and icon-512.png (512×512)');
