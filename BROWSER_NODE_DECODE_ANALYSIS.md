# Code 128 Browser vs Node Decode Failure Analysis

## Problem Summary

**Browser (Cypress):** Code 128 images 003 and 004 fail to decode
**Node:** Both images decode successfully

## Test Configuration

```javascript
{
    inputStream: { size: 800, singleChannel: false },
    locator: { patchSize: 'medium', halfSample: true }
}
```

## Expected Results

- image-003.jpg: '673023'
- image-004.jpg: '010210150301625334'

## Key Differences in Image Processing

### Browser (frame_grabber_browser.js)

1. **Load**: HTMLImageElement loads JPEG
2. **Resize**: Canvas drawImage() scales to 800px
3. **Extract**: getImageData() retrieves RGBA pixels
4. **Convert**: computeGray() with luminance formula:
   ```javascript
   gray = 0.299*R + 0.587*G + 0.114*B
   ```

### Node (input_stream.ts)

1. **Load**: fs.readFile() or HTTP GET retrieves raw bytes
2. **Decode**: ndarray-pixels (uses jpeg-js) decodes JPEG to pixels
3. **Resize**: ndarray operations scale to 800px
4. **Convert**: Similar grayscale conversion

## Potential Root Causes

### 1. JPEG Decoding Differences ⭐ MOST LIKELY

Browser's native JPEG decoder vs jpeg-js library may produce slightly different RGB values, especially for:
- Chroma subsampling artifacts
- DCT coefficient rounding
- Color space conversions

**Impact:** Even small RGB differences become significant after grayscale conversion and subsequent binarization/thresholding.

### 2. Image Scaling Differences

- **Browser**: Canvas uses bilinear/bicubic interpolation (browser-specific)
- **Node**: ndarray-pixels likely uses different interpolation

**Impact:** Scaling from original size to 800px can introduce different artifacts.

### 3. Floating Point Precision

The luminance formula `0.299*R + 0.587*G + 0.114*B` involves:
- Floating point multiplication
- Rounding to Uint8

Different JavaScript engines (V8 in Node vs browser) might handle edge cases differently.

### 4. Canvas Context Differences

Browser canvas uses `{ willReadFrequently: true }` which may affect:
- Color space handling
- Pixel format
- Alpha premultiplication

## Why Specifically Images 003 and 004?

These images likely have characteristics that amplify the differences:
- Low contrast barcodes
- Complex backgrounds
- Specific JPEG compression artifacts
- Critical grayscale values near binarization thresholds

## Proposed Solutions

### Option 1: Normalize Image Processing ⭐ RECOMMENDED

Create consistent image loading/processing pipeline for both environments:
- Use same JPEG decoder (bundle jpeg-js for browser)
- Use same interpolation algorithm
- Ensure identical color space handling

### Option 2: Adjust Locator Parameters

Fine-tune detection parameters to be more robust:
- Adjust patchSize
- Modify halfSample behavior
- Tweak binarization thresholds

### Option 3: Pre-process Images

- Increase contrast
- Apply sharpening
- Normalize lighting

### Option 4: Accept Browser Limitations

Document that certain challenging images may not decode in browser due to platform differences.

## Next Steps to Verify

1. **Compare raw pixel data**: Extract first 100 pixels from both environments for image-003
2. **Test with different sizes**: Try size: 640, 1024 to see if scaling is the issue
3. **Test singleChannel: true**: Bypass RGB-to-gray conversion
4. **Add debug output**: Log barcode locator results to see if bars are found
5. **Test with synthetic barcodes**: Create clean test images to isolate variables

## Debugging Commands

```bash
# Node test with debug
NODE_ENV=test npm run test:node

# Browser test with debug  
npm run cypress:run

# Compare with size variations
# Modify test config and rerun
```

## References

- frame_grabber_browser.js: Line 108 (drawImage scaling)
- cv_utils.js: Line 551 (luminance formula)
- input_stream.ts: Line 106 (Node image loading with getPixels)
