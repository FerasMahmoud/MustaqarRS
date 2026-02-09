const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Users\\feras\\OneDrive\\Desktop\\Personal\\Airbnb\\New';
const destDir = 'C:\\Users\\feras\\MustaqarRS\\public\\amenities';

const images = [
  { source: 'FirstAid.JPG', name: 'FirstAid' },
  { source: 'Locker.jpeg', name: 'Locker' },
  { source: 'ExtraAminities.jpeg', name: 'ExtraAminities' }
];

async function optimizeImage(sourcePath, destName) {
  const originalStats = fs.statSync(sourcePath);
  const originalSize = originalStats.size;

  const jpgPath = path.join(destDir, `${destName}.jpg`);
  const webpPath = path.join(destDir, `${destName}.webp`);

  // Optimize to JPG
  await sharp(sourcePath)
    .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(jpgPath);

  // Optimize to WebP
  await sharp(sourcePath)
    .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(webpPath);

  const jpgStats = fs.statSync(jpgPath);
  const webpStats = fs.statSync(webpPath);

  return {
    original: {
      path: sourcePath,
      size: originalSize,
      sizeKB: (originalSize / 1024).toFixed(2)
    },
    jpg: {
      path: jpgPath,
      size: jpgStats.size,
      sizeKB: (jpgStats.size / 1024).toFixed(2),
      reduction: ((1 - jpgStats.size / originalSize) * 100).toFixed(1)
    },
    webp: {
      path: webpPath,
      size: webpStats.size,
      sizeKB: (webpStats.size / 1024).toFixed(2),
      reduction: ((1 - webpStats.size / originalSize) * 100).toFixed(1)
    }
  };
}

async function main() {
  console.log('Optimizing amenity images...\n');

  for (const img of images) {
    const sourcePath = path.join(sourceDir, img.source);

    if (!fs.existsSync(sourcePath)) {
      console.log(`ERROR: Source file not found: ${sourcePath}`);
      continue;
    }

    try {
      const result = await optimizeImage(sourcePath, img.name);

      console.log(`=== ${img.source} -> ${img.name} ===`);
      console.log(`Original: ${result.original.sizeKB} KB`);
      console.log(`JPG:      ${result.jpg.sizeKB} KB (${result.jpg.reduction}% reduction)`);
      console.log(`          -> ${result.jpg.path}`);
      console.log(`WebP:     ${result.webp.sizeKB} KB (${result.webp.reduction}% reduction)`);
      console.log(`          -> ${result.webp.path}`);
      console.log('');
    } catch (err) {
      console.log(`ERROR processing ${img.source}: ${err.message}`);
    }
  }

  console.log('Done!');
}

main();
