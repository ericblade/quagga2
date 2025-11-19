# ENV Reference Error Fix

This branch contains only the critical ENV fix from commit d5359e8.

## What This Fixes

Adds `typeof ENV !== 'undefined'` checks before all ENV usage to prevent ReferenceError when running TypeScript tests.

## Files Changed

- src/quagga.js
- src/decoder/barcode_decoder.js
- src/input/input_stream/input_stream.ts
- src/reader/code_39_vin_reader.ts
- src/quagga/initCanvas.ts
- src/quagga/initBuffers.ts
- src/quagga/qworker.ts
- src/input/frame_grabber.js
- src/input/camera_access.ts
- src/input/image_loader.js
- src/input/frame_grabber_browser.js
- src/locator/barcode_locator.js

## Test Results

✅ 185 passing
⏭️ 26 pending
❌ 0 ENV-related failures
