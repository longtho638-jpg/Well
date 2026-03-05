/**
 * Convert PNG/JPG images to WebP format
 * Reduces image size by 70-90% while maintaining quality
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = './public';
const EXCLUDE_DIRS = ['.git', 'node_modules'];

async function findImages(dir) {
  const images = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory() && !EXCLUDE_DIRS.includes(entry.name)) {
      images.push(...(await findImages(fullPath)));
    } else if (entry.isFile() && /\.(png|jpg|jpeg)$/i.test(entry.name)) {
      images.push(fullPath);
    }
  }

  return images;
}

async function convertToWebP(imagePath) {
  try {
    const output = imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

    const metadata = await sharp(imagePath).metadata();
    const originalSize = (await stat(imagePath)).size;

    await sharp(imagePath)
      .webp({ quality: 85, effort: 6 })
      .toFile(output);

    const newSize = (await stat(output)).size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);

    console.log(`✓ ${imagePath} → ${output} (${originalSize} → ${newSize} bytes, -${savings}%)`);

    return { original: originalSize, converted: newSize, savings: parseFloat(savings) };
  } catch (error) {
    console.error(`✗ ${imagePath}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 Finding images...\n');
  const images = await findImages(PUBLIC_DIR);
  console.log(`📸 Found ${images.length} images\n`);

  console.log('🔄 Converting to WebP...\n');
  let totalOriginal = 0;
  let totalConverted = 0;

  for (const image of images) {
    const result = await convertToWebP(image);
    if (result) {
      totalOriginal += result.original;
      totalConverted += result.converted;
    }
  }

  const totalSavings = ((1 - totalConverted / totalOriginal) * 100).toFixed(1);
  console.log(`\n📊 Summary:`);
  console.log(`   Original: ${(totalOriginal / 1024).toFixed(1)} KB`);
  console.log(`   Converted: ${(totalConverted / 1024).toFixed(1)} KB`);
  console.log(`   Savings: ${totalSavings}%`);
}

main().catch(console.error);
