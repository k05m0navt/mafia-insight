#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon for the Mafia Insight app
const createIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#3b82f6"/>
  <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${size * 0.1}" fill="white"/>
  <circle cx="${size * 0.7}" cy="${size * 0.3}" r="${size * 0.1}" fill="white"/>
  <circle cx="${size * 0.5}" cy="${size * 0.6}" r="${size * 0.15}" fill="white"/>
  <rect x="${size * 0.2}" y="${size * 0.8}" width="${size * 0.6}" height="${size * 0.1}" rx="${size * 0.05}" fill="white"/>
</svg>`;
};

// Icon sizes for PWA
const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512];

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
sizes.forEach((size) => {
  const iconSvg = createIcon(size);

  // For now, create SVG files (in production, you'd convert to PNG)
  const svgFilename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, svgFilename), iconSvg);

  console.log(`Generated ${svgFilename}`);
});

console.log('PWA icons generated successfully!');
