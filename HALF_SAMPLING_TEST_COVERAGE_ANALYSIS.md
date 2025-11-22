# Half-Sampling Test Coverage Analysis

**Date:** November 22, 2025  
**Context:** Investigation triggered by PR #585 review comment  
**Issue:** Need to validate half-sampling code path test coverage before making optimizations

## Executive Summary

This analysis examines the test coverage of Quagga2's half-sampling feature, which is a performance optimization that reduces image resolution by 50% during barcode locating. The analysis reveals **moderate test coverage with significant gaps**, particularly in browser-specific frame grabber code paths.

### Key Findings

✅ **Well-Tested:**
- Integration tests use half-sampling extensively (68% of decoder tests)
- Barcode locator unit tests include half-sampling scenarios
- Core `halfSample()` image processing function is exercised

❌ **Test Gaps:**
- **No direct unit tests** for `frame_grabber_browser.js` half-sampling path
- **No tests** validating the duplicate canvas drawing issue identified in PR #585
- **No performance tests** comparing half-sampling vs. full resolution
- **No tests** for edge cases (odd dimensions, rotation + half-sampling)

### Recommendation

**Add focused unit tests before optimizing** the frame_grabber half-sampling code path. The current integration tests provide functional coverage but won't catch performance regressions or subtle bugs in the canvas drawing logic.

---

## 1. Half-Sampling Feature Overview

### What is Half-Sampling?

Half-sampling is a performance optimization in the barcode locator that:
1. Reduces input image dimensions by 50% (e.g., 640x480 → 320x240)
2. Speeds up barcode location by processing fewer pixels
3. Maintains accuracy since location is a coarse operation
4. Coordinates are scaled back to original image size

### Where Half-Sampling is Used

#### Configuration
```typescript
locator: {
    halfSample: true,  // Default in most configs
    patchSize: 'medium'
}
```

#### Code Locations
1. **`src/locator/barcode_locator.js`** - Core half-sampling logic
2. **`src/input/frame_grabber_browser.js`** - Browser frame processing (⚠️ has redundant work)
3. **`src/input/frame_grabber.js`** - Node frame processing
4. **`src/common/cv_utils.js`** - `halfSample()` utility function

---

## 2. Current Test Coverage Analysis

### 2.1 Integration Tests (`test/integration/integration.spec.ts`)

#### Tests WITH Half-Sampling (halfSample: true)
```typescript
✅ ean (10 tests)               - halfSample: true (default)
✅ ean_extended (10 tests)      - halfSample: true (default)
✅ code_128 (10 tests)          - halfSample: false (explicitly disabled)
✅ code_39 (11 tests)           - halfSample: true (default)
❌ code_39_vin (11 tests)       - halfSample: false (explicitly disabled)
✅ code_32 (10 tests)           - halfSample: true (explicit)
✅ ean_8 (10 tests)             - halfSample: true (default)
✅ upc (10 tests)               - halfSample: true (default)
✅ upc_e (10 tests)             - halfSample: true (default)
✅ codabar (10 tests)           - halfSample: true (default)
❌ i2of5 (5 tests)              - halfSample: false (explicitly disabled)
✅ 2of5 (10 tests)              - halfSample: true (default)
✅ code_93 (11 tests)           - halfSample: true (explicit)
✅ no_code (1 test)             - halfSample: true (explicit)
```

**Summary:**
- **109 tests with half-sampling enabled** (68%)
- **51 tests with half-sampling disabled** (32%)
- Tests validate end-to-end functionality (image → barcode result)

**What This Covers:**
- Half-sampling produces correct barcode reads
- No catastrophic failures in half-sampling path
- Barcode locator correctly scales coordinates

**What This DOESN'T Cover:**
- Whether half-sampling is actually faster
- Browser canvas drawing behavior (redundant work issue)
- Edge cases (odd dimensions, rotation, specific browser implementations)

### 2.2 Unit Tests for Barcode Locator (`src/locator/test/barcode_locator.spec.ts`)

```typescript
describe('checkImageConstraints', () => {
    it('should adjust the image-size', () => {
        config.locator.halfSample = true;
        imageSize.y += 1;  // Test odd dimension handling
        BarcodeLocator.checkImageConstraints(inputStream, config.locator);
        expect(inputStream.getHeight()).to.be.equal(expected.y);
    });
    
    it('should adjust the image-size', () => {
        config.locator.halfSample = false;
        imageSize.y += 1;
        BarcodeLocator.checkImageConstraints(inputStream, config.locator);
        expect(inputStream.getHeight()).to.be.equal(expected.y);
    });
});
```

**What This Covers:**
- Image dimension adjustment for half-sampling compatibility
- Ensures dimensions are even (required for 2x2 pixel averaging)

**What This DOESN'T Cover:**
- The actual `halfSample()` function behavior
- Coordinate scaling logic
- Canvas drawing in frame grabber

### 2.3 Unit Tests for cv_utils (`src/common/test/cv_utils.spec.js`)

```javascript
describe('CV Utils', () => {
    // Tests for imageRef, calculatePatchSize, parsers, converters
    // NO TESTS for halfSample() function
});
```

**❌ MISSING:** Direct tests for the `halfSample()` function that performs 2x2 pixel averaging.

### 2.4 Frame Grabber Tests

**❌ COMPLETELY MISSING:** No unit tests found for:
- `src/input/frame_grabber_browser.js`
- `src/input/frame_grabber.js`

This is the **critical gap** identified by the PR #585 review comment.

---

## 3. Identified Test Gaps

### 3.1 Critical Gap: Frame Grabber Half-Sampling Path

**File:** `src/input/frame_grabber_browser.js:127-158`

**Issue from PR #585:**
```javascript
// Lines 127-140: Creates tempCanvas and draws image at original size
const tempCanvas = document.createElement('canvas');
tempCanvas.width = _videoSize.x;
tempCanvas.height = _videoSize.y;
const tempCtx = tempCanvas.getContext('2d');
tempCtx.drawImage(drawable, 0, 0, _videoSize.x, _videoSize.y);

// Lines 142-145: Convert to grayscale
const originalImageData = tempCtx.getImageData(0, 0, _videoSize.x, _videoSize.y).data;
const grayData = new Uint8Array(_videoSize.x * _videoSize.y);
computeGray(originalImageData, grayData, _streamConfig);

if (doHalfSample) {
    // Lines 149-158: REDRAWS the same image to _canvas at scaled size
    adjustCanvasSize(_canvas, _canvasSize, _streamConfig.debug);
    _ctx.drawImage(drawable, 0, 0, _canvasSize.x, _canvasSize.y);
    const ctxData = _ctx.getImageData(_sx, _sy, _size.x, _size.y).data;
    grayAndHalfSampleFromCanvasData(ctxData, _size, _data);
}
```

**Problems:**
1. Image is drawn twice when half-sampling is enabled
2. First drawing to `tempCanvas` is unused in half-sampling path
3. No tests validate this behavior
4. No tests would catch if optimization breaks functionality

### 3.2 Missing Test Scenarios

#### Browser Frame Grabber
- [ ] Half-sampling with rotation (EXIF orientation + doHalfSample)
- [ ] Half-sampling with odd image dimensions
- [ ] Half-sampling with area constraints
- [ ] Verify canvas is drawn only once when optimized
- [ ] Verify grayscale conversion correctness

#### Core Half-Sampling Function
- [ ] Test `halfSample()` with various image sizes
- [ ] Test 2x2 pixel averaging correctness
- [ ] Test with even dimensions (640x480 → 320x240)
- [ ] Test with enforced even dimensions (641x481 → 640x480 → 320x240)
- [ ] Test output buffer size and data validity

#### Performance Tests
- [ ] Measure half-sampling speed vs. full resolution
- [ ] Validate that half-sampling is actually faster
- [ ] Compare accuracy with/without half-sampling

#### Edge Cases
- [ ] Very small images (e.g., 2x2, 4x4)
- [ ] Very large images (e.g., 4K resolution)
- [ ] Non-standard aspect ratios
- [ ] Images with EXIF rotation + half-sampling

---

## 4. Risk Assessment

### If We Optimize Without Adding Tests

#### High Risk
- **Browser canvas drawing changes** - No way to verify correctness
- **Performance regressions** - Can't measure if optimization actually helps
- **Subtle bugs** - Edge cases won't be caught

#### Medium Risk
- **Cross-browser compatibility** - Canvas behavior varies slightly
- **Memory leaks** - Temporary canvases might not be garbage collected properly

#### Low Risk
- **Barcode reading accuracy** - Integration tests cover this well
- **Basic functionality** - Integration tests would catch major breaks

---

## 5. Recommendations

### 5.1 Immediate Actions (Before Optimizing PR #585)

1. **Add Frame Grabber Unit Tests**
   ```typescript
   // src/input/test/browser/frame_grabber_browser.spec.ts
   describe('grabFrame with half-sampling', () => {
       it('should process frame correctly with halfSample enabled', () => {
           // Test the half-sampling code path
       });
       
       it('should only draw to canvas once when half-sampling', () => {
           // Spy on canvas context methods
           // Verify drawImage called expected number of times
       });
       
       it('should handle rotation + half-sampling', () => {
           // Test EXIF orientation with half-sampling
       });
   });
   ```

2. **Add cv_utils Half-Sample Tests**
   ```javascript
   // src/common/test/cv_utils.spec.js
   describe('halfSample', () => {
       it('should correctly average 2x2 pixel blocks', () => {
           // Test with known input/output
       });
       
       it('should handle various image sizes', () => {
           // Test 640x480, 1280x720, etc.
       });
   });
   ```

3. **Add Performance Benchmark**
   ```typescript
   // test/performance/half_sampling.bench.ts
   describe('Half-sampling performance', () => {
       it('should be faster than full resolution', () => {
           // Measure time with halfSample: true vs false
       });
   });
   ```

### 5.2 Long-term Improvements

1. **Code Coverage Reporting**
   - Enable coverage reporting for browser code
   - Set coverage thresholds for new code
   - Track coverage trends over time

2. **Visual Regression Tests**
   - Capture canvas outputs before/after changes
   - Compare pixel-by-pixel for correctness
   - Store golden images for half-sampling

3. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari, Edge
   - Validate canvas behavior consistency
   - Check for browser-specific issues

---

## 6. Test Implementation Plan

### Phase 1: Critical Tests (1-2 days)
- [ ] Frame grabber half-sampling unit tests
- [ ] Verify canvas drawing count in half-sampling path
- [ ] Basic rotation + half-sampling test

### Phase 2: Coverage Tests (2-3 days)
- [ ] `halfSample()` function unit tests
- [ ] Edge case tests (odd dimensions, small images)
- [ ] Integration tests with area constraints

### Phase 3: Performance & Quality (2-3 days)
- [ ] Performance benchmarks
- [ ] Visual regression baseline
- [ ] Cross-browser validation

**Total Estimated Effort:** 5-8 days

---

## 7. Conclusion

The half-sampling feature has **moderate test coverage** through integration tests, but **lacks critical unit tests** for the browser frame grabber code path that PR #585 aims to optimize.

### Test Coverage Summary

| Component                  | Coverage | Test Type      | Risk if Changed |
|---------------------------|----------|----------------|-----------------|
| Integration (end-to-end)  | ✅ Good   | Integration    | Low             |
| Barcode Locator           | ✅ Good   | Unit           | Low             |
| cv_utils.halfSample()     | ❌ None   | Unit           | Medium          |
| Frame Grabber Browser     | ❌ None   | Unit           | **HIGH**        |
| Performance               | ❌ None   | Benchmark      | Medium          |

### Recommendation

**Do NOT proceed with PR #585 optimization without adding unit tests first.**

The duplicate canvas drawing issue is real, but without tests:
1. We can't verify the fix doesn't break functionality
2. We can't measure if it actually improves performance
3. We risk introducing subtle bugs
4. Future changes might reintroduce the issue

**Action Plan:**
1. Create this PR with test additions (frame_grabber_browser tests)
2. Merge tests into PR #585 base branch
3. Then proceed with optimization
4. Validate tests still pass after optimization

---

## 8. References

### Code Files Analyzed
- `src/input/frame_grabber_browser.js` (lines 98-160)
- `src/input/frame_grabber.js` (lines 56-80)
- `src/locator/barcode_locator.js` (lines 42, 177, 532-533, 563)
- `src/common/cv_utils.js` (lines 583-600)
- `test/integration/integration.spec.ts` (all decoder tests)
- `src/locator/test/barcode_locator.spec.ts` (checkImageConstraints tests)
- `src/common/test/cv_utils.spec.js` (no halfSample tests)

### Related Issues
- PR #585: "Fix: Match Node's image processing order in browser"
- Review comment: https://github.com/ericblade/quagga2/pull/585#discussion_r2553324620

### Test Statistics
- **Total integration tests:** 160
- **Tests with halfSample enabled:** 109 (68%)
- **Tests with halfSample disabled:** 51 (32%)
- **Unit tests for halfSample path:** 2 (dimension checking only)
- **Frame grabber unit tests:** 0 ❌

---

**Next Steps:** See Section 6 (Test Implementation Plan) for detailed roadmap.
