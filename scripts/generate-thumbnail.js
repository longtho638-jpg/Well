#!/usr/bin/env node
/**
 * Generate Product Hunt Thumbnail
 * 240x240px PNG with WellNexus branding
 */

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../docs/product-hunt/thumbnail.png');

// Create canvas
const canvas = createCanvas(240, 240);
const ctx = canvas.getContext('2d');

// Gradient background (purple to blue)
const gradient = ctx.createLinearGradient(0, 0, 240, 240);
gradient.addColorStop(0, '#7C3AED'); // Purple
gradient.addColorStop(1, '#3B82F6'); // Blue

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 240, 240);

// Draw "W" logo (stylized)
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 140px Inter, Arial, sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
ctx.shadowBlur = 10;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 4;

// Draw W
ctx.fillText('W', 120, 100);

// Reset shadow for text
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;

// Draw "WellNexus" text below
ctx.font = 'bold 24px Inter, Arial, sans-serif';
ctx.fillStyle = '#FFFFFF';
ctx.fillText('WellNexus', 120, 190);

// Draw tagline
ctx.font = '14px Inter, Arial, sans-serif';
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.fillText('Open-Source RaaS', 120, 220);

// Save
const buffer = canvas.toBuffer('image/png');
writeFileSync(OUTPUT_PATH, buffer);

console.log(`✅ Thumbnail generated: ${OUTPUT_PATH}`);
console.log(`📏 Size: 240x240px`);
