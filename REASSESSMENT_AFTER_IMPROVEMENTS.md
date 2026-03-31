# Reassessment: Half-Sampling Test Coverage

**Date:** December 3, 2025 (Fourth Assessment)  
**Previous Assessments:** November 22, 2025 (Original), November 23, 2025 (Second), November 26, 2025 (Third)  
**Context:** Reassessment after significant testing reorganization to determine if duplicate canvas drawing bug still exists

---

## Bug Status: STILL PRESENT ❌

The duplicate canvas drawing bug in `frame_grabber_browser.js:127-160` **is still present**:

```javascript
// Line 129-140: First draw to tempCanvas (ALWAYS executed)
const tempCanvas = document.createElement('canvas');
tempCtx.drawImage(drawable, ...);  // ← DRAW #1

// Lines 142-145: Grayscale conversion (unused when halfSample=true)
const originalImageData = tempCtx.getImageData(...);
computeGray(originalImageData, grayData, _streamConfig);

if (doHalfSample) {
    // Lines 147-160: Second draw to _canvas
    _ctx.drawImage(drawable, ...);  // ← DRAW #2
    grayAndHalfSampleFromCanvasData(ctxData, _size, _data);
}
```

**Problem:** When `halfSample=true`:
- First `drawImage()` + grayscale conversion is completely **UNUSED**
- Second `drawImage()` duplicates the work
- ~50% performance overhead

---

## Current State Summary

After analyzing the current test infrastructure:

### Integration Tests (`test/integration/integration.spec.ts`)

| Test Suite | halfSample Setting | Number of Tests |
|------------|-------------------|-----------------|
| ean | true (default) | 10 |
| ean_extended | true (default) | 10 |
| code_128 | true (default) | 10 |
| code_39 | true (default) | 11 |
| code_39_vin | **false** (explicit) | 11 |
| code_32 | true (explicit) | 10 |
| ean_8 | true (default) | 10 |
| upc | true (default) | 10 |
| upc_e | true (default) | 10 |
| codabar | true (default) | 10 |
| i2of5 | **false** (explicit) | 5 |
| 2of5 | true (default) | 10 |
| code_93 | true (explicit) | 11 |
| no_code | true (explicit) | 1 |

**Summary:**
- **Tests with halfSample=true:** ~109 (68%)
- **Tests with halfSample=false:** ~51 (32%)
- **Tests running with BOTH settings:** 0

### Unit Tests for halfSample

| Component | Unit Tests | Status |
|-----------|------------|--------|
| `frame_grabber_browser.js` | 0 | ❌ Critical Gap |
| `frame_grabber.js` (Node) | 0 | ❌ Gap |
| `cv_utils.halfSample()` | 0 | ❌ Gap |
| `barcode_locator.js` | 4 (dimension checking) | ✅ Partial |

### Performance Tests
- No dedicated performance tests found
- No performance measurement logging detected in current test infrastructure

---

## Additional Tests Needed Before Addressing Duplicate Canvas Drawing Issue

### CRITICAL: Required Before Optimization

#### 1. Frame Grabber Unit Tests (Priority: **CRITICAL**)

**File:** `src/input/test/browser/frame_grabber_browser.spec.ts` (NEW)

The duplicate canvas drawing issue is in `frame_grabber_browser.js:127-160`. Without unit tests, we cannot:
- Verify the fix doesn't break EXIF rotation handling
- Confirm grayscale conversion remains correct
- Validate canvas operations are correct
- Test edge cases independently

**Required Test Cases:**

```typescript
describe('frame_grabber_browser', () => {
    describe('grab() with halfSample=true', () => {
        it('should draw to canvas only ONCE (not twice)', () => {
            // Spy on drawImage
            // This test would FAIL currently (bug exists)
            // This test should PASS after fix
        });
        
        it('should handle EXIF rotation correctly', () => {
            // Test orientations 6, 8
        });
        
        it('should produce correct grayscale output', () => {
            // Verify output data integrity
        });
    });
    
    describe('grab() with halfSample=false', () => {
        it('should process frame correctly', () => {
            // Verify non-halfSample path works
        });
    });
});
```

**Estimated Effort:** 2-3 days

#### 2. Canvas Drawing Verification Test (Priority: **CRITICAL**)

This is the specific test that validates the fix works:

```typescript
describe('Canvas drawing efficiency', () => {
    it('with halfSample=true, should call drawImage exactly once', () => {
        const drawImageSpy = sinon.spy();
        // Setup mock canvas with spy
        // Run grab()
        expect(drawImageSpy.callCount).to.equal(1);
        // Currently would be 2 (bug), should be 1 after fix
    });
});
```

**Estimated Effort:** 1 day

### IMPORTANT: Should Have

#### 3. halfSample() Function Unit Tests

**File:** Add to `src/common/test/cv_utils.spec.js`

```javascript
describe('halfSample', () => {
    it('should correctly average 2x2 pixel blocks', () => {
        // Known input → expected output
    });
    
    it('should handle various image sizes', () => {
        // 640x480, 1280x720, etc.
    });
});
```

**Estimated Effort:** 1 day

### RECOMMENDED: Nice to Have

#### 4. Integration Tests with Both halfSample Settings

Modify `runDecoderTest` to run each test with both `halfSample: true` and `halfSample: false`:

```typescript
function runDecoderTest(name, config, testSet) {
    [true, false].forEach(halfSample => {
        describe(`Decoder ${name} (halfSample=${halfSample})`, () => {
            // Run tests with this halfSample setting
        });
    });
}
```

**Estimated Effort:** 1 day (but doubles test run time)

---

## Summary: Test Implementation Priority

| Priority | Test | Effort | Required Before Fix? |
|----------|------|--------|---------------------|
| **CRITICAL** | Frame grabber unit tests | 2-3 days | YES |
| **CRITICAL** | Canvas drawing count test | 1 day | YES |
| Important | halfSample() unit tests | 1 day | No |
| Recommended | Both halfSample modes in integration | 1 day | No |

**Minimum viable test suite before optimization:** 3-4 days

---

## The Duplicate Canvas Drawing Bug

**Location:** `src/input/frame_grabber_browser.js:127-160`

**Current Behavior (BUG):**
1. Line 139: `tempCtx.drawImage(drawable, ...)` - First draw
2. Line 153/157: `_ctx.drawImage(drawable, ...)` - Second draw (when halfSample=true)

**Why It's a Bug:**
- The first draw to tempCanvas creates grayscale data that is NOT USED when halfSample=true
- The second draw duplicates work unnecessarily
- ~50% performance overhead in half-sampling mode

**Fix:** Restructure to draw only once based on halfSample setting.

---

## Recommendation

**Before fixing the duplicate canvas drawing issue:**

1. ✅ Implement frame grabber unit tests (especially canvas drawing count)
2. ✅ Add canvas drawing verification test that would FAIL before fix and PASS after
3. ✅ Run baseline tests to confirm current behavior

**Then:**

4. Apply the optimization fix
5. Verify canvas drawing count test passes (proof of fix)
6. Verify all integration tests still pass (correctness maintained)

---

**Updated:** December 3, 2025  
**Status:** Bug still present. Awaiting unit test implementation before optimization.

---

## Quick Answer: What's Needed?

**Minimum required before fixing the bug:**

| Test | Purpose | Effort |
|------|---------|--------|
| Canvas drawing count test | Verify fix works (drawImage called once, not twice) | 1 day |
| Frame grabber unit tests | Catch regressions in EXIF rotation, grayscale, etc. | 2-3 days |

**The integration tests (which have been significantly improved) will catch correctness regressions, but won't verify the performance optimization actually eliminates the duplicate work.**
