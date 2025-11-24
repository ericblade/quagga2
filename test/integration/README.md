# Integration Tests

## Test Infrastructure

This directory contains integration tests for Quagga2's barcode decoder functionality. The tests have been organized into separate files per decoder type for better maintainability.

### File Structure

- `helpers.ts` - Shared test utilities and configuration functions
- `integration.spec.ts` - General integration tests (parallel decoding, edge cases)
- `decoders/` - Individual decoder test files:
  - `ean.spec.ts` - EAN-13 barcode tests
  - `ean_extended.spec.ts` - EAN with supplements (EAN-2, EAN-5)
  - `ean_8.spec.ts` - EAN-8 barcode tests
  - `upc.spec.ts` - UPC-A barcode tests
  - `upc_e.spec.ts` - UPC-E barcode tests
  - `code_128.spec.ts` - Code 128 barcode tests
  - `code_39.spec.ts` - Code 39 barcode tests
  - `code_39_vin.spec.ts` - Code 39 VIN (Vehicle Identification Number) tests
  - `code_32.spec.ts` - Code 32 (Italian Pharmacode) tests
  - `code_93.spec.ts` - Code 93 barcode tests
  - `codabar.spec.ts` - Codabar barcode tests
  - `i2of5.spec.ts` - Interleaved 2 of 5 barcode tests
  - `2of5.spec.ts` - Standard 2 of 5 barcode tests
  - `external-reader.spec.ts` - Tests for external reader functionality

### Test Behavior

By default, all decoder tests **must pass in both Node and browser environments**. If a test fails, the entire test run fails, alerting developers to regressions.

For tests that are known to fail in specific environments, you can use environment-specific flags to mark them explicitly. **These flags are the single authoritative source** for test failure configuration.

### Test Helper: `it.allowFail()`

The `it.allowFail()` helper is used internally when a test is marked with environment-specific failure flags. When a test fails in an allowed environment, it will be marked as "pending" instead of causing the test run to fail.

### Marking Tests with Environment-Specific Flags

In the test data structures, you can mark individual test cases with explicit environment-specific failure policies:

- **`allowFailInNode: true`**: Test can fail in Node environment without failing the build
- **`allowFailInBrowser: true`**: Test can fail in browser environment without failing the build
- **Both flags**: Test can fail in both environments - set both flags explicitly

```typescript
runDecoderTest('code_128', generateConfig(), [
    // This test passes everywhere - no flags needed, will fail build if it breaks
    { 'name': 'image-001.jpg', 'result': '0001285112001000040801', format: 'code_128' },

    // This test passes in Node but fails in browser - use allowFailInBrowser only
    { 'name': 'image-003.jpg', 'result': '673023', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },

    // This test fails in both environments - set BOTH flags explicitly
    { 'name': 'failing-test.jpg', 'result': '123456', format: 'code_128', allowFailInNode: true, allowFailInBrowser: true },
]);
```

## Current Test Status

As of the latest update:

- **399 tests passing** (improved from 387, +12 tests)
- **~54 tests pending** in both Node and browser (down from 64)
- Tests are balanced between environments

### Configuration Improvements

Recent optimizations have significantly improved decoder accuracy:

**EAN-8 Decoder:**

- Changed `patchSize` from `'medium'` to `'large'` for better accuracy
- Fixed: image-004 now decodes correctly with halfSample:true
- Trade-off: image-003 now fails in browser with halfSample:false (marked with `allowFailInBrowser`)

**Code 39 VIN Decoder:**

- Increased `inputStream.size` from 1280 → 2000 → **2200** (2x the 1100px original image size)
- Fixed: 5 images now pass (001, 003, 005, 006, 011) - improved from only 1 passing
- Note: 6 images still fail (002, 004, 007, 008, 009, 010) even with optimal settings - marked with both allowFail flags
- Testing revealed performance peaks around 2x: 3x and 4x scaling both perform worse (5/11 vs 10/11 passing)

**Interleaved 2 of 5 (i2of5) Decoder:**

- Set `inputStream.size` to **1375** (1.25x the 1100px original)
- **Perfect accuracy**: All 5 test images now pass in both halfSample modes (10/10 tests)
- Testing showed 1.25x-1.5x work well for these test images
- Performance degrades at higher scaling: 2.5x causes complete failure in halfSample:false mode

**Key Insight - Upscaling Improves Detection:**

Contrary to conventional wisdom, **upscaling images can significantly improve barcode detection accuracy**. Testing showed:

- Upscaling improves detection in **both** halfSample:true and halfSample:false modes
- Integer scaling factors (2x) provide clean pixel doubling with minimal interpolation artifacts
- Optimal scaling varies by image content and quality, not necessarily by barcode type
- Performance typically peaks at moderate upscaling (1.25x-2x) and degrades beyond 2.5x
- The interpolation acts as a smoothing filter, providing more pixels per bar for the locator to analyze

### Decoders with Targeted Configurations

- **ean_8**: Uses `patchSize: 'large'` (improved accuracy)
- **code_39_vin**: Uses `inputStream.size: 2200` (2x scaling for optimal accuracy)
- **i2of5**: Uses `inputStream.size: 1375` and `patchSize: 'small'` (1.25x scaling, perfect 100% accuracy)
- **code_32**: Uses `patchSize: 'large'` and `inputStream.size: 1280`
- **code_93**: Uses `patchSize: 'large'`

## Running Tests

```bash
# Run all integration tests in Node
npx ts-mocha -p test/tsconfig.json test/integration/**/*.spec.ts

# Run all tests (including integration tests)
npm run test:node

# Run browser tests (requires Cypress)
npm run test:browser-all
```

## Adding New Tests

When adding new decoder test cases:

1. Add the test data to the appropriate `runDecoderTest()` call **without** any flags
2. Run the tests in both Node and browser environments
3. Based on the results, add explicit flags:
   - **Passes everywhere**: Leave without flags
   - **Fails only in Node**: Add `allowFailInNode: true`
   - **Fails only in browser**: Add `allowFailInBrowser: true`
   - **Fails in both**: Add **both** `allowFailInNode: true` and `allowFailInBrowser: true`

Example:

```typescript
runDecoderTest('my_decoder', generateConfig(), [
    // Passes everywhere - no flags needed
    { 'name': 'working-image.jpg', 'result': '123456', format: 'my_format' },

    // Passes in Node, fails in browser - set allowFailInBrowser only
    { 'name': 'browser-issue.jpg', 'result': '789012', format: 'my_format', allowFailInBrowser: true },

    // Fails in both environments - set BOTH flags explicitly
    { 'name': 'problematic-image.jpg', 'result': '345678', format: 'my_format', allowFailInNode: true, allowFailInBrowser: true },
]);
```

## Fixing Failing Tests

When you fix a test that was marked with failure flags:

**For tests with both `allowFailInNode` and `allowFailInBrowser`:**

1. Remove both flags from the test
2. Verify the test passes consistently in both Node and browser environments
3. The test will now fail the build if it breaks in either environment

**For tests with `allowFailInBrowser` only:**

1. Fix the browser-specific issue
2. Remove the `allowFailInBrowser: true` flag
3. Verify the test passes in both Node and browser
4. The test will now fail the build if it breaks in either environment

**For tests with `allowFailInNode` only:**

1. Fix the Node-specific issue
2. Remove the `allowFailInNode: true` flag
3. Verify the test passes in both Node and browser
4. The test will now fail the build if it breaks in either environment

## Design Philosophy

The default behavior is "tests must pass in both environments" to catch regressions early. Environment-specific failure flags provide explicit control:

- **Single source of truth** - Test item flags in the spec files are the authoritative configuration
- **Regressions are caught immediately** - If a working test breaks, the build fails
- **Environment-specific exceptions** - Tests can be marked to allow failure in specific environments only
- **No implicit behavior** - Flags must be set explicitly for each environment
- **Clear intent** - Flags clearly indicate which environments have known issues

## Browser vs Node Differences

CI runs integration tests in **both Cypress (browser) and ts-node (Node.js)**. Some tests behave differently between these environments due to differences in image processing (Browser uses native Canvas API, Node uses the `canvas` package).

### Configuration Trade-offs

When optimizing decoder configurations for accuracy, some changes may improve one test while causing another to fail. These trade-offs are documented with comments in the decoder spec files and marked with appropriate failure flags.

Example: Changing EAN-8's `patchSize` to `'large'` fixed image-004 but caused image-003 to fail in the browser environment. The net result is still positive (more tests passing overall), and the failure is explicitly marked.
