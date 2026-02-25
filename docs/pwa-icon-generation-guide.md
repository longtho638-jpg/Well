# PWA Icon Generation Instructions

## Current Status
The PWA manifest is configured in `vite.config.ts` and expects the following icon files:
- `public/pwa-192x192.png` (192x192px)
- `public/pwa-512x512.png` (512x512px)
- Both should support maskable icon format

## Source File
A source SVG icon has been created at: `public/pwa-icon.svg`

## To Generate Icons

### Option 1: Using Online Tools
1. Open the SVG in a browser or Figma
2. Export as PNG at 512x512 and 192x192 resolutions
3. Save as:
   - `public/pwa-192x192.png`
   - `public/pwa-512x512.png`

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick if needed
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Linux

# Convert SVG to PNG
convert -background none -resize 512x512 public/pwa-icon.svg public/pwa-512x512.png
convert -background none -resize 192x192 public/pwa-icon.svg public/pwa-192x192.png
```

### Option 3: Using sharp (Node.js)
```bash
npm install --save-dev sharp sharp-cli

# Convert
npx sharp -i public/pwa-icon.svg -o public/pwa-512x512.png resize 512 512
npx sharp -i public/pwa-icon.svg -o public/pwa-192x192.png resize 192 192
```

## Maskable Icon Requirements
For the maskable icon format (Android adaptive icons):
- Must have a safe zone in the center (80% of the icon)
- Outer 20% (10% on each side) may be cropped
- Background should extend to edges
- Test at: https://maskable.app/

## Additional Icons (Optional)
For better PWA support, consider adding:
- `public/apple-touch-icon.png` (180x180) - iOS home screen
- `public/favicon.ico` (32x32, 16x16 multi-size)
- `public/favicon-16x16.png`
- `public/favicon-32x32.png`

## Verification
After generating icons, verify the PWA manifest by:
1. Run `npm run build`
2. Serve the build: `npx serve dist`
3. Open Chrome DevTools > Application > Manifest
4. Check that all icons are properly loaded
