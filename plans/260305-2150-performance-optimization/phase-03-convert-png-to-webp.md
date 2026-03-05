---
title: "Phase 3: Convert PNG Icons to WebP"
status: pending
priority: P3
effort: 20min
---

# Phase 3: Convert PNG Icons to WebP

## Context
- 428KB PNG icons detected
- WebP provides 25-35% size reduction
- Better compression than PNG with same quality

## Files to Convert

Find all PNG files in public/assets:
```bash
find public/ -name "*.png" -type f
```

## Implementation Steps

1. **Install sharp (if not available)**
   ```bash
   pnpm add -D sharp
   ```

2. **Create conversion script**
   ```bash
   # scripts/convert-png-to-webp.js
   const sharp = require('sharp');
   const fs = require('fs');
   const path = require('path');

   async function convertPngToWebp(dir) {
     const files = fs.readdirSync(dir);
     for (const file of files) {
       const filePath = path.join(dir, file);
       const stat = fs.statSync(filePath);
       if (stat.isDirectory()) {
         convertPngToWebp(filePath);
       } else if (file.endsWith('.png')) {
         const webpPath = filePath.replace('.png', '.webp');
         await sharp(filePath).webp({ quality: 85 }).toFile(webpPath);
         console.log(`Converted: ${file}`);
       }
     }
   }

   convertPngToWebp('public/');
   ```

3. **Run conversion**
   ```bash
   node scripts/convert-png-to-webp.js
   ```

4. **Update imports in code**
   ```bash
   grep -rn "\.png'" src/ | grep -v node_modules
   ```

5. **Verify size reduction**
   ```bash
   du -sh public/assets/*
   ```

## Success Criteria
- [ ] All PNG icons converted to WebP
- [ ] Total icon size reduced by 25%+
- [ ] All images render correctly
- [ ] No broken image links

## Rollback
Keep original PNG files until verified, then remove:
```bash
find public/ -name "*.png" -delete
```
