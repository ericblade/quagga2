# Integration Tests

## Test Infrastructure

This directory contains integration tests for Quagga2's barcode decoder functionality.

### Test Behavior

By default, all decoder tests **must pass**. If a test fails, the entire test run fails, alerting developers to regressions.

For tests that are known to fail (inherited test cases or work-in-progress features), you can mark them with `allowFail: true`. These tests will be marked as "pending" instead of causing the test run to fail.

### Test Helper: `it.allowFail()`

The `it.allowFail()` helper is used internally when a test is marked with `allowFail: true`. When a test fails, it will be marked as "pending" instead of causing the test run to fail.

### Marking Tests with `allowFail` or `allowFailInBrowser`

In the test data structures, you can mark individual test cases with different failure policies:

- **`allowFail: true`**: Test can fail in both Node and browser without failing the build
- **`allowFailInBrowser: true`**: Test must pass in Node (will fail build), but can fail in browser without failing the build

```typescript
runDecoderTest('code_128', generateConfig(), [
    // This test passes everywhere - no flag needed, will fail build if it breaks
    { 'name': 'image-001.jpg', 'result': '0001285112001000040801', format: 'code_128' },
    
    // This test passes in Node but fails in browser - use allowFailInBrowser
    { 'name': 'image-003.jpg', 'result': '673023', format: 'code_128', allowFailInBrowser: true },
    
    // This test fails in both environments - use allowFail
    { 'name': 'failing-test.jpg', 'result': '123456', format: 'code_128', allowFail: true },
]);
```

## Current Test Status

As of the latest update:
- **185 tests passing in Node** (will fail the build if they break)
- **26 tests marked with `allowFail: true`** (can fail in both Node and browser without failing the build)
- **2 tests marked with `allowFailInBrowser: true`** (must pass in Node, can fail in browser)

### Tests marked with `allowFail`:
- **code_39**: 2 tests (image-005, image-011)
- **code_39_vin**: 8 tests (image-002, 003, 004, 005, 007, 008, 009, 010)
- **code_32**: 5 tests (image-2, 3, 6, 7, 8)
- **ean_8**: 1 test (image-004 - gets wrong result)
- **codabar**: 1 test (image-008)
- **External Reader code_128**: 1 test (image-004)

### Tests marked with `allowFailInBrowser`:
- **code_128**: 2 tests (image-003, image-004 - pass in Node, fail in browser)

### Decoders with all tests passing (0 allowFail):
- ✅ ean (10 tests)
- ✅ ean_extended (10 tests)
- ✅ upc (10 tests)
- ✅ upc_e (10 tests)
- ✅ i2of5 (5 tests)
- ✅ 2of5 (10 tests)
- ✅ code_93 (11 tests)

## Running Tests

```bash
# Run node integration tests
npm run test:node

# Run browser tests (requires Cypress)
npm run test:browser-all
```

## Adding New Tests

When adding new decoder test cases:

1. Add the test data to the appropriate `runDecoderTest()` call **without** any flags
2. Run the tests in both Node and browser environments
3. Based on the results:
   - **Passes everywhere**: Leave without flags
   - **Fails only in browser**: Add `allowFailInBrowser: true`
   - **Fails in both**: Add `allowFail: true` (preserve for future debugging)

Example:
```typescript
runDecoderTest('my_decoder', generateConfig(), [
    // Passes everywhere - no flag needed
    { 'name': 'working-image.jpg', 'result': '123456', format: 'my_format' },
    
    // Passes in Node, fails in browser
    { 'name': 'browser-issue.jpg', 'result': '789012', format: 'my_format', allowFailInBrowser: true },
    
    // Fails in both environments
    { 'name': 'problematic-image.jpg', 'result': '345678', format: 'my_format', allowFail: true },
]);
```

## Fixing Failing Tests

When you fix a test that was marked with failure flags:

**For `allowFail: true` tests:**
1. Remove the `allowFail: true` flag from the test
2. Verify the test passes consistently in both Node and browser environments
3. The test will now fail the build if it breaks in either environment

**For `allowFailInBrowser: true` tests:**
1. Fix the browser-specific issue
2. Remove the `allowFailInBrowser: true` flag
3. Verify the test passes in both Node and browser
4. The test will now fail the build if it breaks in either environment

## Design Philosophy

The default behavior is "tests must pass" to catch regressions early. Only tests explicitly marked with `allowFail: true` are allowed to fail without breaking the build. This ensures that:

- **Regressions are caught immediately** - If a working test breaks, the build fails
- **Known failures are preserved** - Tests marked with `allowFail` can fail without breaking CI
- **Minimal flags needed** - Most tests don't need any special marking
- **Clear intent** - Tests marked with `allowFail` clearly indicate known issues

## Browser vs Node Differences

CI runs integration tests in **both Cypress (browser) and ts-node (Node.js)**. Some tests behave differently between these environments, which is being investigated.

### Test Failure Handling

- **`allowFail: true`**: Test can fail in both environments without failing CI
- **`allowFailInBrowser: true`**: Test must pass in Node (fails CI if it doesn't), but can fail in browser without failing CI

### Current Known Differences

**Tests that fail in browser but pass in Node** (using `allowFailInBrowser`):
- code_128 image-003, image-004

**Tests that fail in both environments** (using `allowFail`):
- code_39 image-005, image-011
- code_39_vin image-002, 003, 004, 005, 007, 008, 009, 010
- code_32 image-2, 3, 6, 7, 8
- ean_8 image-004
- codabar image-008
- External Reader code_128 image-004

This separation ensures that regressions in Node tests are caught immediately, even for tests that are known to fail in browser.
