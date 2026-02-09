const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'C:/Users/feras/OneDrive/Desktop/Personal/Airbnb/New';
const DEST_DIR = 'C:/Users/feras/MustaqarRS/public/amenities';

const images = [
  { source: 'Laundry.JPG', name: 'Laundry' },
  { source: 'Sofa.jpeg', name: 'Sofa' },
  { source: 'Maicrwave.JPG', name: 'Maicrwave' }
];

async function optimizeImage(sourceFile, baseName) {
  const sourcePath = path.join(SOURCE_DIR, sourceFile);
  const jpgPath = path.join(DEST_DIR, `${baseName}.jpg`);
  const webpPath = path.join(DEST_DIR, `${baseName}.webp`);

  // Get original file size
  const originalStats = fs.statSync(sourcePath);
  const originalSize = originalStats.size;

  // Load and optimize
  const image = sharp(sourcePath);
  const metadata = await image.metadata();

  console.log(`\n=== ${sourceFile} ===`);
  console.log(`Original: ${(originalSize / 1024).toFixed(2)} KB (${metadata.width}x${metadata.height})`);

  // Resize to max 1000x1000 maintaining aspect ratio
  const resizedImage = sharp(sourcePath)
    .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true });

  // Create JPG version
  await resizedImage
    .clone()
    .jpeg({ quality: 85 })
    .toFile(jpgPath);

  // Create WebP version
  await resizedImage
    .clone()
    .webp({ quality: 80 })
    .toFile(webpPath);

  // Get new file sizes
  const jpgStats = fs.statSync(jpgPath);
  const webpStats = fs.statSync(webpPath);

  const jpgMeta = await sharp(jpgPath).metadata();

  console.log(`JPG: ${(jpgStats.size / 1024).toFixed(2)} KB (${jpgMeta.width}x${jpgMeta.height}) -> ${jpgPath}`);
  console.log(`WebP: ${(webpStats.size / 1024).toFixed(2)} KB -> ${webpPath}`);
  console.log(`Savings: JPG ${((1 - jpgStats.size / originalSize) * 100).toFixed(1)}%, WebP ${((1 - webpStats.size / originalSize) * 100).toFixed(1)}%`);

  return {
    source: sourceFile,
    originalSize,
    jpgSize: jpgStats.size,
    webpSize: webpStats.size,
    jpgPath,
    webpPath
  };
}

async function main() {
  console.log('Optimizing amenity images...\n');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Destination: ${DEST_DIR}`);

  const results = [];

  for (const img of images) {
    try {
      const result = await optimizeImage(img.source, img.name);
      results.push(result);
    } catch (error) {
      console.error(`Error processing ${img.source}:`, error.message);
    }
  }

  console.log('\n=== Summary ===');
  let totalOriginal = 0;
  let totalJpg = 0;
  let totalWebp = 0;

  for (const r of results) {
    totalOriginal += r.originalSize;
    totalJpg += r.jpgSize;
    totalWebp += r.webpSize;
  }

  console.log(`Total Original: ${(totalOriginal / 1024).toFixed(2)} KB`);
  console.log(`Total JPG: ${(totalJpg / 1024).toFixed(2)} KB (${((1 - totalJpg / totalOriginal) * 100).toFixed(1)}% reduction)`);
  console.log(`Total WebP: ${(totalWebp / 1024).toFixed(2)} KB (${((1 - totalWebp / totalOriginal) * 100).toFixed(1)}% reduction)`);
}

main().catch(console.error);
